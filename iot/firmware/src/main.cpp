/**
 * ESP32 Smart Waste Bin Telematics Firmware
 * M.Sc. AI & ML Major Project — NIELIT / NDU Srinagar
 * Candidate: Mohd Faisal Wani (NDU202500069)
 *
 * Architecture:
 * - FreeRTOS Dual-Task Pipeline (Sensor Acquisition + HTTP Ingestion)
 * - Moving Median Filter (N=5) for HC-SR04 Ultrasonic Sensor
 * - HX711 Load Cell Calibration & Tare Integration
 * - DS18B20 OneWire Temperature Telemetry
 * - Hardware Status LEDs (Normal <50%, Warning 50-79%, Urgent >=80%)
 * - Non-blocking Wi-Fi Reconnection State Machine
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "HX711.h"

// Configuration Constants
const char* WIFI_SSID     = "SRINAGAR_SMART_CITY_WIFI";
const char* WIFI_PASSWORD = "SmartWastePassword123";
const char* API_ENDPOINT  = "http://192.168.1.100:5000/api/v1/iot/telemetry";
const char* DEVICE_TOKEN  = "SRG_BIN_01_SECURE_TOKEN_2026";
const char* BIN_ID        = "BIN_SRG_01";
const float BIN_DEPTH_CM  = 100.0f;

// GPIO Pin Definitions
#define PIN_TRIG        5
#define PIN_ECHO        18    // CONNECTED VIA 1k/2k VOLTAGE DIVIDER TO PROTECT 3.3V GPIO
#define PIN_HX711_DT    19
#define PIN_HX711_SCK   23
#define PIN_ONE_WIRE    4
#define PIN_LED_GREEN   12
#define PIN_LED_YELLOW  14
#define PIN_LED_RED     27

// Hardware Peripherals
HX711 scale;
OneWire oneWire(PIN_ONE_WIRE);
DallasTemperature tempSensors(&oneWire);

// Shared Inter-Task Data Structure (Protected by Mutex)
struct TelemetryPacket {
  float distanceCm;
  float weightKg;
  float temperatureC;
  int batteryPercent;
  bool isReady;
};

TelemetryPacket currentTelemetry = {0.0f, 0.0f, 0.0f, 100, false};
SemaphoreHandle_t telemetryMutex;

// 5-Point Median Filter for Ultrasonic Jitter Suppression
float getMedianDistanceCm() {
  float readings[5];
  for (int i = 0; i < 5; i++) {
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);

    long durationUs = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout (~5m max distance)
    if (durationUs == 0) {
      readings[i] = BIN_DEPTH_CM; // Timeout fallback to empty
    } else {
      readings[i] = (durationUs * 0.0343f) / 2.0f;
    }
    vTaskDelay(pdMS_TO_TICKS(40));
  }

  // Simple sort for 5 elements
  for (int i = 0; i < 4; i++) {
    for (int j = i + 1; j < 5; j++) {
      if (readings[i] > readings[j]) {
        float tmp = readings[i];
        readings[i] = readings[j];
        readings[j] = tmp;
      }
    }
  }
  return readings[2]; // Return median value
}

// Update Local LED Status Indicators
void updateStatusLEDs(float fillPercent) {
  if (fillPercent >= 80.0f) {
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
  } else if (fillPercent >= 50.0f) {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
  } else {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_GREEN, HIGH);
  }
}

// Task 1: Sensor Data Acquisition (Runs every 2000 ms on Core 1)
void TaskReadSensors(void *pvParameters) {
  for (;;) {
    float dist = getMedianDistanceCm();
    
    // Read Load Cell (Calibrated scale factor)
    float weight = 0.0f;
    if (scale.is_ready()) {
      weight = scale.get_units(3); // Average of 3 readings
      if (weight < 0.0f) weight = 0.0f;
    }

    // Read Temperature
    tempSensors.requestTemperatures();
    float temp = tempSensors.getTempCByIndex(0);
    if (temp < -50.0f || temp > 100.0f) temp = 20.0f; // Sensor fault fallback

    float fillPercent = ((BIN_DEPTH_CM - dist) / BIN_DEPTH_CM) * 100.0f;
    if (fillPercent < 0.0f) fillPercent = 0.0f;
    if (fillPercent > 100.0f) fillPercent = 100.0f;

    updateStatusLEDs(fillPercent);

    // Save to shared memory with Mutex protection
    if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
      currentTelemetry.distanceCm = dist;
      currentTelemetry.weightKg = weight;
      currentTelemetry.temperatureC = temp;
      currentTelemetry.batteryPercent = 95; // Simulated battery ADC
      currentTelemetry.isReady = true;
      xSemaphoreGive(telemetryMutex);
    }

    vTaskDelay(pdMS_TO_TICKS(2000));
  }
}

// Task 2: Wi-Fi & HTTP Telemetry Transmission (Runs every 10000 ms on Core 0)
void TaskTransmitTelemetry(void *pvParameters) {
  for (;;) {
    // Non-blocking Wi-Fi check & reconnect
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[Wi-Fi] Connecting to AP...");
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      int retryCount = 0;
      while (WiFi.status() != WL_CONNECTED && retryCount < 10) {
        vTaskDelay(pdMS_TO_TICKS(500));
        retryCount++;
      }
    }

    if (WiFi.status() == WL_CONNECTED) {
      TelemetryPacket localData;
      bool hasData = false;

      if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
        if (currentTelemetry.isReady) {
          localData = currentTelemetry;
          hasData = true;
        }
        xSemaphoreGive(telemetryMutex);
      }

      if (hasData) {
        HTTPClient http;
        http.begin(API_ENDPOINT);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("X-Device-Token", DEVICE_TOKEN);
        http.setTimeout(5000);

        StaticJsonDocument<256> doc;
        doc["binId"] = BIN_ID;
        doc["rawDistanceCm"] = localData.distanceCm;
        doc["weightKg"] = localData.weightKg;
        doc["temperatureC"] = localData.temperatureC;
        doc["batteryPercent"] = localData.batteryPercent;

        String jsonPayload;
        serializeJson(doc, jsonPayload);

        int httpResponseCode = http.POST(jsonPayload);
        if (httpResponseCode == 200) {
          Serial.printf("[HTTP] Telemetry ingested successfully! Status: %d\n", httpResponseCode);
        } else {
          Serial.printf("[HTTP] Ingestion failed. Error code: %d\n", httpResponseCode);
        }
        http.end();
      }
    }

    vTaskDelay(pdMS_TO_TICKS(10000));
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Initializing ESP32 Smart Waste Telematics Firmware ---");

  // GPIO Mode Setup
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  // Initialize Sensors
  tempSensors.begin();
  scale.begin(PIN_HX711_DT, PIN_HX711_SCK);
  scale.set_scale(2280.0f); // Calibration factor for 50kg load cell
  scale.tare();             // Zero the empty bin weight

  telemetryMutex = xSemaphoreCreateMutex();

  // Create FreeRTOS Tasks pinned to ESP32 dual cores
  xTaskCreatePinnedToCore(TaskReadSensors, "SensorTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(TaskTransmitTelemetry, "TelemetryTask", 8192, NULL, 1, NULL, 0);

  Serial.println("[Setup] FreeRTOS tasks started successfully.");
}

void loop() {
  // FreeRTOS handles execution via pinned tasks
  vTaskDelete(NULL);
}
