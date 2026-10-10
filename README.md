 NudgeBin: Enterprise Waste-to-Energy OS

<div align="center">
  <img src="https://img.shields.io/badge/Track-Waste_%26_Energy-10b981?style=for-the-badge&logo=leaf" alt="Track" />
  <img src="https://img.shields.io/badge/AWS-Serverless-FF9900?style=for-the-badge&logo=amazonaws" alt="AWS" />
  <img src="https://img.shields.io/badge/Frontend-React_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Machine_Learning-SageMaker-blue?style=for-the-badge&logo=scikit-learn" alt="ML" />
  <img src="https://img.shields.io/badge/Hardware-ESP32-E7352C?style=for-the-badge&logo=espressif" alt="Hardware" />
</div>

<br/>

> **Circuit Design(Wokwi Software):**  https://wokwi.com/projects/476707733910847489
 
> **Live Web Dashboard:**   https://main.d1rrvh1o5pnpqr.amplifyapp.com/
---

## Executive Summary
Traditional municipal solid waste (MSW) management relies on static collection routes. Trucks dispatch on fixed schedules, often emptying bins that are only 10% full, wasting millions of liters of diesel annually and generating unnecessary COâ‚‚ emissions. Simultaneously, overflowing bins create localized health hazards and methane pockets.

**NudgeBin** modernizes this infrastructure by merging **Behavioral Psychology at the Edge** with **Predictive Cloud Logistics**. It intercepts poor disposal habits in real-time via audio nudges while utilizing AWS Machine Learning to optimize collection fleets and forecast biogas energy generation.

---

## Deep-Dive Architecture & Workflow

NudgeBin operates across 5 distinct technical layers:

### 1. The Edge Layer (Hardware & Behavioral Nudges)
*   **Sensing:** An **ESP32 Microcontroller** interfaces with an **HC-SR04 Ultrasonic Sensor** mounted inside the bin lid to calculate fill percentages based on spatial volume reduction.
*   **Nudging:** A PIR motion sensor detects user approach, triggering a **DFPlayer Mini** to play localized MP3 audio files.
*   **Behavioral Loop:** Positive reinforcement ("Thank you for keeping the city clean!") encourages continuous usage, while negative limits ("Bin is at capacity, please use the adjacent bin") prevent overflowing.
*   **Transmission:** The ESP32 wakes from deep sleep, connects to Wi-Fi/GSM, and pushes an HTTP POST payload to the cloud.

### 2. The Cloud Ingestion Layer (AWS)
*   **Amazon API Gateway:** Acts as the secure front door, receiving REST payload POST requests from the distributed ESP32 network without requiring complex hardware-side authentication.
*   **AWS Lambda (Ingestion):** A Python (Boto3) serverless function validates the payload, parses the JSON, and stamps it with an epoch timestamp.
*   **Amazon DynamoDB:** A high-throughput NoSQL table (`BinTelemetry`) configured with `bin_id` as the Partition Key and `timestamp` as the Sort Key for rapid time-series querying.

### 3. The Analytics & ML Layer (Amazon SageMaker)
*   **Data Synthesis:** A JupyterLab environment deployed on an `ml.t3.medium` SageMaker instance.
*   **Model:** A `RandomForestRegressor` via `scikit-learn` trains on historical bin data.
*   **Features:** `current_fill_level`, `hour_of_day`, `day_of_week`, and `foot_traffic_multiplier`.
*   **Predictions:** The model accurately forecasts the exact **hours remaining until 85% capacity** and projects the weekly **Biogas (kWh) yield** based on the specific organic matter density of the region.

### 4. The Dispatch & Alerting Layer (Amazon SNS)
*   Instead of requiring dispatchers to monitor dashboards 24/7, the architecture is event-driven.
*   When the Lambda function detects a `fill_level >= 85%`, it invokes **Amazon SNS (Simple Notification Service)**.
*   SNS immediately publishes an alert (via Email/SMS) to the municipal logistics team to dynamically append the specific `bin_id` to the active collection route.

### 5. The Presentation Layer (AWS Amplify + React)
*   **Frontend:** A modular React + Vite application leveraging custom glassmorphism CSS, `Chart.js` for predictive graphing, and `Lucide-React` for enterprise iconography.
*   **Hosting:** Fully managed CI/CD deployment via **AWS Amplify**, automatically building and distributing the application to edge networks globally upon GitHub `main` branch updates.

---

## The Math: Real-World Impact Formulas
The dashboard translates raw integer data into actionable climate metrics. The backend utilizes the following algorithms per collection cycle:

1.  **Fleet Optimization (Diesel Saved):**
    `Skipped_Bins * 0.75 Liters` *(Average diesel consumed per stop/idle cycle)*
2.  **Carbon Mitigation (COâ‚‚ Avoided):**
    `Diesel_Saved (L) * 2.68 kg COâ‚‚/L` *(Standard EPA diesel emission factor)*
3.  **Waste-to-Energy (Biogas Yield):**
    `(Full_Bins * 22.5 kg organic waste) * 0.08 biogas multiplier * 2.14 kWh conversion`

---

## API Contract (API Gateway -> Lambda)

The backend expects standard JSON payloads from the IoT hardware. 

**POST `/NudgeBinTelemetryHandler`**
```json
{
  "bin_id": "BIN_04",
  "fill_level": 88,
  "battery_voltage": 3.9,
  "foot_traffic": "high"
}

```

**GET `/NudgeBinTelemetryHandler` (Dashboard Response)**

```json
{
  "bins": [
    {
      "bin_id": "BIN_04",
      "fill_level": 88,
      "battery_voltage": 3.9,
      "timestamp": 1729000000
    }
  ],
  "summary": {
    "total_bins": 12,
    "full_bins_count": 3,
    "diesel_saved_liters": 6.75,
    "co2_avoided_kg": 18.09,
    "biogas_yield_kwh": 11.55
  }
}

```

---

##  Security & Cloud Governance

* **IAM Least Privilege:** The Lambda execution role is strictly bound to `AmazonDynamoDBFullAccess` and `AmazonSNSFullAccess`. It cannot interact with unauthorized AWS resources.
* **CORS Configuration:** API Gateway securely manages `OPTIONS` preflight requests, ensuring the React dashboard can fetch data cross-origin securely.

---

## Local Installation & Development

To run the Enterprise Control Center locally:

1. **Clone the repository:**
```bash
git clone [https://github.com/your-username/nudgebin.git](https://github.com/your-username/nudgebin.git)
cd nudgebin/nudgebin-dashboard

```


2. **Install dependencies:**
```bash
npm install chart.js lucide-react react-chartjs-2

```


3. **Start the Vite development server:**
```bash
npm run dev

```


4. **Access the Dashboard:** Open `http://localhost:5173`. Use the built-in "Inject API Payload" button in the sidebar to simulate live hardware events.

---

## Future Scope

* **LoRaWAN Integration:** Migrating from Wi-Fi to AWS IoT Core + LoRaWAN for city-wide deployments without cellular dependencies.
* **Edge AI (TinyML):** Deploying a lightweight sound-classification model directly onto the ESP32 to detect glass breaking vs. plastic dropping, categorizing waste types at the source.

---

**Designed & Architected by Akarshak Mishra**

*Built for the Waste & Energy Track*


