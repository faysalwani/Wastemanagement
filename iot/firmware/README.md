# ESP32 Smart Bin Embedded Firmware
**Target:** ESP32-WROOM-32 (NodeMCU / DevKit v1)  
**IDE/Framework:** PlatformIO / Arduino C++  
**Sensors:** Ultrasonic (HC-SR04 / JSN-SR04T), Load Cell + HX711, DS18B20 1-Wire Probe, 3-LED Indicators.

## Pinout Map
* `GPIO 5`: Ultrasonic Trigger
* `GPIO 18`: Ultrasonic Echo (via $1\text{k}\Omega : 2\text{k}\Omega$ voltage divider to convert $5\text{V} \rightarrow 3.3\text{V}$)
* `GPIO 19`: HX711 Data (`DT`)
* `GPIO 23`: HX711 Clock (`SCK`)
* `GPIO 4`: DS18B20 1-Wire Data (`DQ`) with $4.7\text{k}\Omega$ pullup to $3.3\text{V}$
* `GPIO 12`: Green LED (Normal: $<50\%$)
* `GPIO 14`: Yellow LED (Warning: $50-79\%$)
* `GPIO 27`: Red LED (Urgent: $\ge 80\%$)

## Security & Protocol
* Telemetry sent via `HTTP POST http://<backend_ip>:5000/api/v1/iot/telemetry`
* Protected by custom header: `X-Device-Token: <cryptographic_token>`
