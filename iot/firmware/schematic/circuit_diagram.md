# ESP32 Smart Bin Circuit Schematics & Electrical Engineering Reference

**Project:** IoT-Based Intelligent Waste Management & Resource Recovery System  
**Institution:** NIELIT / NDU Campus, Srinagar  
**Candidate:** Mohd Faisal Wani (NDU202500069)

---

## 1. Hardware Bill of Materials (BOM)

| Component | Part / Model | Operating Voltage | Interface / Protocol | Pin Connected to ESP32 |
|---|---|---|---|---|
| Microcontroller | ESP32-WROOM-32D | 3.3V (5V via USB/VBUS) | Wi-Fi 802.11 b/g/n (2.4 GHz) | Core Controller |
| Ultrasonic Sensor | HC-SR04 | 5.0V | Digital Trig / Echo | Trig: GPIO 5, Echo: GPIO 18 (via Divider) |
| Weight Load Cell | 50 kg Half-Bridge (x4) | 5.0V Excitation | HX711 24-bit ADC (Differential) | DT: GPIO 19, SCK: GPIO 23 |
| Temperature Sensor | DS18B20 Waterproof | 3.3V – 5.0V | 1-Wire Digital Bus | Data: GPIO 4 (with 4.7kΩ pull-up) |
| Status LEDs | Green (Normal), Yellow (Warning), Red (Urgent) | 2.0V – 2.2V (Forward) | Digital GPIO (Active HIGH) | Green: GPIO 12, Yellow: GPIO 14, Red: GPIO 27 |
| Current Limiting Resistors | 3x 330Ω 1/4W | N/A | Series Protection | Between GPIOs and LED Anodes |
| Voltage Divider Resistors | 1x 1kΩ, 1x 2kΩ | N/A | Voltage Step-Down | HC-SR04 Echo Pin Protection |
| OneWire Pull-up Resistor | 1x 4.7kΩ | N/A | Bus Pull-up to 3.3V | Between DS18B20 VCC and DQ Pin |

---

## 2. Voltage Divider Derivation (HC-SR04 Echo Pin Protection)

### The Engineering Problem:
* The HC-SR04 ultrasonic transducer requires a **5.0V \(V_{cc}\)** rail to generate acoustic ultrasound bursts (40 kHz).
* Consequently, the `ECHO` output pin outputs a **5.0V logic HIGH** signal when reading ultrasound reflection transit times.
* The ESP32 microcontroller GPIO pins are **NOT 5V tolerant**; subjecting GPIO 18 directly to 5V will cause internal silicon ESD breakdown and latch-up failure.

### Mathematical Derivation:
We implement a passive two-resistor voltage divider:

```
HC-SR04 ECHO (5V) ----[ R1: 1kΩ ]----+---- GPIO 18 (ESP32 Input, 3.33V)
                                     |
                                 [ R2: 2kΩ ]
                                     |
                                    GND
```

Formula for output voltage:
\[
V_{out} = V_{in} \times \left( \frac{R_2}{R_1 + R_2} \right)
\]

Substituting the nominal component values:
\[
V_{out} = 5.00\,\text{V} \times \left( \frac{2000\,\Omega}{1000\,\Omega + 2000\,\Omega} \right) = 5.00\,\text{V} \times \frac{2}{3} \approx 3.33\,\text{V}
\]

* \(3.33\,\text{V}\) matches the standard \(V_{IH}\) (Input High Voltage) tolerance threshold of the ESP32 GPIO buffer without stressing the input diodes.
* Total divider current:
  \[
  I = \frac{5.0\,\text{V}}{3000\,\Omega} = 1.66\,\text{mA}
  \]
  Well within the 15 mA output drive capability of the HC-SR04 output driver.

---

## 3. Comprehensive Wiring Pinout Diagram

```
+-------------------------------------------------------------------------+
|                              ESP32 DEVKIT V1                            |
|                                                                         |
|  [3V3] -----------------+--------+-------------------- DS18B20 VDD      |
|                         |        |                                      |
|                       [4.7kΩ]    |                                      |
|                         |        |                                      |
|  [GPIO 4] --------------+--------|-------------------- DS18B20 DQ (Data)|
|                                  |                                      |
|  [GPIO 5] -----------------------|-------------------- HC-SR04 TRIG     |
|                                  |                                      |
|  [GPIO 18] <--+--[ 2kΩ ]-- GND   |                                      |
|               |                  |                                      |
|               +--[ 1kΩ ] <-------|-------------------- HC-SR04 ECHO     |
|                                  |                                      |
|  [GPIO 19] ----------------------|-------------------- HX711 DT         |
|  [GPIO 23] ----------------------|-------------------- HX711 SCK        |
|                                  |                                      |
|  [GPIO 12] ---[ 330Ω ]--->|------+                    GREEN LED (Normal)|
|  [GPIO 14] ---[ 330Ω ]--->|------+                    YELLOW LED (Warn) |
|  [GPIO 27] ---[ 330Ω ]--->|------+                    RED LED (Urgent)  |
|                                  |                                      |
|  [VIN (5V)] ---------------------+-------------------- HC-SR04 VCC      |
|             ---------------------+-------------------- HX711 VCC        |
|                                                                         |
|  [GND] --------------------------+-------------------- COMMON GROUND    |
+-------------------------------------------------------------------------+
```

---

## 4. HX711 Load Cell Calibration Procedure

1. **Tare Calibration:**
   With the bin container completely empty, execute:
   ```cpp
   scale.tare(); // Establishes zero-offset baseline
   ```
2. **Known Calibration Mass:**
   Place an accurately weighed mass (e.g. \(5.00\,\text{kg}\)) inside the container.
3. **Compute Scale Factor:**
   ```cpp
   long rawValue = scale.get_value(10);
   float calibrationFactor = rawValue / 5.0f;
   scale.set_scale(calibrationFactor);
   ```
4. Record `calibrationFactor` into the firmware constant:
   ```cpp
   scale.set_scale(2280.0f);
   ```
