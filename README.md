# 📦 Staff Inventory Management App

A professional, high-performance mobile and web inventory management application built with **Expo**, **React Native**, **Expo Router**, and **TypeScript**. Designed for warehouse staff to seamlessly scan product barcodes/QR codes, check live stock levels, and perform real-time CRUD operations.

---

## 🚀 Key Features

* **Dual-Tab Interface (`index.tsx`):**
  * **Scanner & Search Tab:** Integrated camera barcode/QR scanner using `expo-camera` with tactile feedback (`expo-haptics`) and a web-friendly manual search fallback.
  * **Inventory CRUD Tab:** Full backend list management allowing staff to view all inventory items, adjust quantities instantly, and delete records.
* **Granular Product Management (`product.tsx`):** Dedicated detail view for managing individual product stock numbers with quick increment/decrement steppers and direct database deletion.
* **REST API Integration:** Direct communication with backend endpoints (`GET`, `POST`, `PATCH`, `DELETE`) powered by `axios`.
* **Cross-Platform:** Runs natively on iOS and Android (via Expo Go / Development Builds) and smoothly inside desktop web browsers.

---

## 🛠️ Tech Stack

* **Framework:** [Expo](https://expo.dev/) (~58.0) with Expo Router (File-based routing)
* **Language:** TypeScript
* **UI & Styling:** React Native `StyleSheet` (Optimized for native performance)
* **Hardware APIs:** `expo-camera` (Scanning), `expo-haptics` (Tactile feedback)
* **Networking:** `axios`

---

## ⚙️ Setup 

### Install Dependencies
Navigate into your project folder and install the required npm packages:

npm install

### Run the jsonserver for mock data

npx json-server db.json

### Run on web 

npx expo start --web --clear

### Or run on mobile 

npx expo start --clear