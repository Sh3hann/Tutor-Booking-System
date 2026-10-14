<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=18,12,32&height=200&section=header&text=📚%20TutorHub&fontSize=46&fontAlignY=36&desc=Full-Stack%20EdTech%20%7C%20Tutor%20Marketplace%20%7C%20AI%20Study%20Hub&descAlignY=58&descSize=16&fontColor=ffffff" width="100%" alt="TutorHub Header" />

  <p align="center">
    <b>A modern educational tutoring marketplace connecting students, certified tutors, and academic institutes with automated scheduling, live chat, and AI study assistance.</b>
  </p>

  <p align="center">
    <a href="https://tutor-booking-system-eight.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/🌐_Live_Demo-Launch_TutorHub-7C3AED?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
    </a>
    &nbsp;
    <a href="https://github.com/Sh3hann/Tutor-Booking-System">
      <img src="https://img.shields.io/badge/💻_Source_Code-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Source Code" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-Backend-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="License" />
  </p>

</div>

---

## ⚡ Core Operational Features

<div align="center">

| Feature | Operational Scope | Benefit |
|:---|:---|:---|
| 🔍 **Smart Tutor Directory** | Dynamic search by subject, curriculum level, hourly rate, verified badges, and student reviews. | Direct access to vetted, qualified educators tailored to individual student needs. |
| 📅 **Calendar & Session Booking** | Real-time booking engine with conflict resolution and automated email confirmations. | Prevents scheduling overlaps and manages student lesson calendars effortlessly. |
| 🤖 **AI Study Assistant** | Integrated educational AI assistant helping students break down complex concepts and study plans. | Continuous 24/7 learning support outside of scheduled tutoring sessions. |
| 💬 **Direct Messaging & Chat** | Real-time communication channels between students and tutors for lesson prep and homework queries. | Keeps student-tutor dialogue centralized, organized, and secure. |
| 🏢 **Institute Multi-Tutor Hub** | Specialized organizational portal for coaching academies to manage faculties and course schedules. | Centralizes administration for multi-tutor educational institutions. |
| 🛡️ **Role-Based Security** | JWT-authenticated role separation for **Students**, **Tutors**, **Institutes**, and **Admins**. | Guarantees tailored dashboards and airtight data privacy across user tiers. |

</div>

---

## 🏗️ System Architecture

`mermaid
graph LR
    subgraph Client ["Frontend Architecture (React + Vite)"]
        SPA["Single Page App"]
        ROUTER["App Router"]
        AUTH_CTX["Auth & Role Context"]
        API_LAYER["API Gateway Service"]
    end

    subgraph Server ["Express.js REST Engine"]
        MW["JWT & Auth Middleware"]
        ROUTERS["Domain Routes<br/>(Tutors, Bookings, Chat, Institutes)"]
        AI_ROUTER["AI Learning Engine"]
    end

    subgraph Database ["Persistence Layer"]
        MONGO[("MongoDB Atlas")]
    end

    SPA --> ROUTER --> AUTH_CTX --> API_LAYER
    API_LAYER --> MW --> ROUTERS
    API_LAYER --> MW --> AI_ROUTER
    ROUTERS --> MONGO
    AI_ROUTER --> MONGO
`

<details>
<summary><b>📂 View Modular Codebase Architecture</b></summary>

`
Tutor-Booking-System/
├── Frontend/                 # React 18 + TypeScript + Vite Client
│   ├── src/app/              # Application views (search, booking, dashboard, chat)
│   ├── src/components/       # UI building blocks (cards, modals, badges)
│   └── vite.config.ts        # Bundler configuration
├── Backend/                  # Express RESTful Micro-Engine
│   ├── routes/               # API endpoints (auth, tutors, bookings, ai-chat, institutes)
│   ├── middleware/           # Role-based access control & token verification
│   ├── config/               # Database connection pooling
│   └── server.js             # API server entrypoint
`

</details>

---

## 🚀 Getting Started

### 1. Clone the repository
`ash
git clone https://github.com/Sh3hann/Tutor-Booking-System.git
cd Tutor-Booking-System
`

### 2. Launch Backend
`ash
cd Backend
npm install
npm run dev
`

### 3. Launch Frontend
`ash
cd ../Frontend
npm install
npm run dev
`

Open **http://localhost:5173** to access the web application.

---

<div align="center">

### 👨‍💻 Developed with Precision by [Akil Shehan](https://github.com/Sh3hann)

[![Website](https://img.shields.io/badge/Portfolio-itzshehan.xyz-f59e0b?style=flat-square&logo=google-chrome&logoColor=white)](https://itzshehan.xyz/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Akil_Shehan-0077b5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/akil-shehan-b808b340b)
[![GitHub](https://img.shields.io/badge/GitHub-@Sh3hann-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Sh3hann)

<sub>© 2026 TutorHub. Released under the MIT License.</sub>

</div>