# 🛫 SkyInfo — Web Application for Travel & Airport Support

**SkyInfo** is a comprehensive web platform designed to assist passengers during travel preparation and their stay at the airport. By leveraging the **MEAN stack** (MongoDB, Express.js, Angular, Node.js) alongside several external APIs and libraries, SkyInfo integrates real-time flight tracking, interactive airport terminal navigation, automatic passport scanning via OCR, visa requirement checks, and currency conversion into a single, cohesive user experience.

---

## ✨ Key Features

### ✈️ Real-Time Flight Search & Tracking
* **Multi-Criteria Search:** Search flights by flight number, airline, departure/arrival airports, or date (powered by **AeroDataBox API**).
* **Boarding Pass Scanning:** Automatically extract flight details by uploading a digital or scanned boarding pass (`@zxing/browser`).
* **Flight Watchlist:** Registered users can track flights and receive notifications about delays, gate/terminal changes, or status updates.

### 📷 Automatic Travel Document OCR
* **Automated Data Extraction:** Upload passport photos to extract Machine Readable Zone (**MRZ**) data automatically using **Tesseract.js**.
* **Smart Pre-filling:** Auto-populates passport number, nationality, date of birth, sex, and expiration date during registration.
* **Document Expiration Alerts:** Notifies users when primary or secondary travel documents are nearing expiration.

### 🗺️ Interactive Terminal Navigation
* **3D Airport Map:** Interactive terminal floor plans powered by **Mappedin JS SDK**.
* **Indoor Wayfinding:** Step-by-step turn-by-turn navigation instructions between terminal points of interest (gates, lounges, shops, restaurants).

### 🛂 Visa & Entry Requirements Check
* **Destination Check:** Verifies visa necessity and passport validity rules based on nationality and destination via **TravelBuddyAI API**.
* **Automated Profile Integration:** Registered users automatically check requirements using stored primary travel documents.

### 💱 Currency Converter & 🌐 Multilingual Interface
* **Live Exchange Rates:** Quick currency calculations for international travelers.
* **Multi-Language Support:** Full dynamic localization in Serbian, English, and Spanish (`@ngx-translate/core`).

### 🛡️ Role-Based Access & Security
* **User Roles:** Guests, Registered Users, and Administrators.
* **Security:** Password hashing via `bcrypt`, data validation, and secure authentication tokens.
* **Admin Dashboard:** Manage registered users and broadcast global airport notifications.

---

## 🛠️ Tech Stack & Dependencies

### Frontend
* **Framework:** Angular (v20.3)
* **Language:** TypeScript (v5.9)
* **OCR Engine:** Tesseract.js (v7.0)
* **3D Maps:** Mappedin JS SDK (v6.24)
* **Internationalization:** `@ngx-translate/core` (v18.0)
* **Barcode Reader:** `@zxing/browser` (v0.2)

### Backend
* **Runtime:** Node.js (v22.21)
* **Framework:** Express.js (v5.2)
* **Database:** MongoDB (v8.2) & Mongoose (v9.1)
* **Password Hashing:** `bcrypt.js`

### External APIs
* **AeroDataBox API** (Flight data & schedules via RapidAPI)
* **TravelBuddyAI API** (Visa & travel requirements via RapidAPI)
* **Currency Conversion API** (Real-time exchange rates via RapidAPI)

---

## 📁 Repository Structure

```text
├── frontend/             # Angular client application
│   ├── src/
│   │   ├── app/          # Core components & views
│   │   ├── models/       # TypeScript interfaces & models
│   │   └── services/     # Angular HTTP services & API integrators
│   ├── angular.json
│   └── package.json
│
└── backend/              # Node.js & Express server application
    ├── src/
    │   ├── contolers/    # API controllers & business logic
    │   ├── models/       # Mongoose schemas (User, TravelDocument, Notification)
    │   ├── ruter/        # Express route definitions
    │   ├── services/     # Email & external API helpers
    │   └── server.ts     # Main server entry point
    └── package.json