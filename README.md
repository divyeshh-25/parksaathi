# 🚗 ParkSaathi

**Smart Vehicle Assistance for Residential Societies**

ParkSaathi is a QR-based vehicle identification and assistance platform designed for residential societies. It helps people identify registered vehicles and facilitates communication with vehicle owners while respecting their privacy.

## ✨ Features

- 🚘 **Vehicle Management** — Register, update, and manage vehicles.
- 👥 **Resident Management** — Manage resident information and account status.
- 📱 **QR Code Generation** — Generate unique QR codes for individual vehicles.
- 🔐 **Privacy Controls** — Control which vehicle and owner details are visible.
- ✅ **Membership Verification** — Demo verification using registered resident mobile numbers.
- 🛡️ **Privacy-Aware Scanning** — View vehicle information according to configured privacy settings.
- 🚗 **Multiple Vehicles per Owner** — Designed to support multiple vehicles linked to one resident.

## 🛠️ Tech Stack

- React
- Vite
- JavaScript
- CSS
- Lucide React
- Browser Local Storage

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm

### Installation

**1. Clone the repository**

```bash
git clone <your-repository-url>
```

**2. Navigate to the project directory**

```bash
cd parksaathi
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Build for production**

```bash
npm run build
```

## 📂 Project Structure

```text
parksaathi/
├── public/
├── src/
│   ├── data/
│   ├── pages/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
├── package.json
└── README.md
```

## 🔒 Privacy & Security

ParkSaathi is designed with resident privacy in mind. QR codes identify individual vehicles, while configurable privacy settings determine which information is displayed in the demo.

**Current limitations:**
- Data is stored in browser local storage.
- Mobile verification is simulated and does not use OTP.
- Backend authentication and authorization are not yet implemented.
- Production deployment requires server-side verification and privacy enforcement.

This project is currently under development and is not intended for handling sensitive resident information in production.

## 🗺️ Roadmap

- [x] Vehicle management interface
- [x] Resident management interface
- [x] QR code generation interface
- [x] Privacy settings interface
- [x] QR scan demonstration
- [ ] Multiple vehicles per resident
- [ ] Contact owner and urgent assistance workflows
- [ ] Laravel backend and REST APIs
- [ ] Authentication and authorization
- [ ] Real OTP verification
- [ ] Notifications and scan history

## 🎯 Vision

To make vehicle assistance in residential societies simpler, faster, and more privacy-conscious.

---

**ParkSaathi** — Smarter vehicle assistance, with privacy in mind. 🚘