<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:1e1b4b,50:4338ca,100:7c3aed&height=190&section=header&text=TutorHub&fontSize=48&fontAlignY=38&desc=Full-Stack%20Tutor%20Marketplace%20%7C%20Real-Time%20Chat%20%7C%20Institute%20Portal&descAlignY=62&descSize=16&fontColor=ffffff" width="100%" alt="TutorHub Header" />

  <p align="center">
    <b>A full-stack educational tutoring marketplace connecting students, qualified tutors, and academic institutes with smart search, booking management, real-time Socket.IO chat, brain quizzes, and an AI support assistant.</b>
  </p>

  <p align="center">
    <a href="https://tutor-booking-system-eight.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Live_Demo-Launch_App-7c3aed?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 18" />
    <img src="https://img.shields.io/badge/TypeScript-Vite_6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript & Vite" />
    <img src="https://img.shields.io/badge/Node.js-Express_4-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js & Express" />
    <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Socket.IO-Real--Time_Chat-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="MIT License" /></a>
  </p>

</div>

---

## Core Platform Capabilities

| Role / Module | Features |
| :--- | :--- |
| **Student Experience** | Filter tutors by subject, grade, teaching medium, class type & format; book sessions; track booking status & payments; rate tutors; take interactive brain quizzes. |
| **Tutor Portal** | Multi-step onboarding & verification workflow; manage subjects, hourly rates, timetables & learning materials; accept/reject booking requests; subscription plans & earnings dashboard. |
| **Real-Time Messaging** | Chat-request approval flow and instant bidirectional messaging powered by **Socket.IO**. |
| **Institute Management** | Create and manage educational institutes, assign tutors, configure institute timetables, and handle join requests. |
| **Admin Dashboard** | Approve/reject tutor profile requests, manage subjects, quizzes, user accounts, reviews, and financial records. |
| **AI Support Assistant** | Conversational help desk integrated via `/api/ai-chat` supporting local **Ollama** (`llama3.2`) with an automatic built-in FAQ fallback. |

---

## System Architecture

```mermaid
graph LR
    subgraph Client["Frontend (React 18 + TypeScript + Vite)"]
        UI["Role Portals\n(Student, Tutor, Institute, Admin)"]
        WS_C["Socket.IO Client"]
        API_C["REST API Layer"]
    end

    subgraph Server["Backend (Node.js + Express + Socket.IO)"]
        REST["Express Routers\n(/auth, /tutors, /bookings, /institutes, /admin, /ai-chat)"]
        AUTH["JWT Auth Middleware"]
        WS_S["Socket.IO Server"]
        LLM["Ollama Client / FAQ Fallback"]
    end

    subgraph Data["Persistence Layer"]
        MONGO[("MongoDB\n(with In-Memory Fallback)")]
    end

    UI --> API_C --> REST --> AUTH --> MONGO
    UI --> WS_C <--> WS_S --> MONGO
    REST --> LLM
```

<details>
<summary><b>Project Structure</b></summary>

```text
Tutor-Booking-System/
├── Backend/
│   ├── config/mongodb.js      # MongoDB connection with in-memory fallback
│   ├── data/                  # Sample seed datasets & role organizers
│   ├── middleware/auth.js     # JWT authentication middleware
│   ├── routes/                # auth, tutors, bookings, chat, institutes, admin, ai-chat, subscription, users
│   ├── utils/notifications.js
│   ├── .env.example
│   └── server.js              # Express + Socket.IO entry point
├── Frontend/
│   ├── src/app/
│   │   ├── components/        # Chatbot widget, UI primitives & admin components
│   │   ├── contexts/          # Auth, ChatAuth, Theme & TutorOnboarding contexts
│   │   ├── pages/             # 35+ role-based pages & workflows
│   │   └── utils/             # REST & Socket.IO service wrappers
│   └── package.json
└── LICENSE
```

</details>

---

## Local Development Setup

### Prerequisites
- **Node.js 18+** and **npm**
- **MongoDB** (optional — if unreachable, the backend automatically starts with an in-memory database seeded from `Backend/data/json/`)

### 1. Clone the Repository
```bash
git clone https://github.com/Sh3hann/Tutor-Booking-System.git
cd Tutor-Booking-System
```

### 2. Start the Backend API
```bash
cd Backend
npm install
cp .env.example .env
npm run dev
```
The API and Socket.IO server will start on **http://localhost:3001**.

### 3. Start the Frontend Client
Open a second terminal:
```bash
cd Frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## Demo Accounts

Default credentials seeded for local testing (after running `Backend/clear-and-reload.js` or initial JSON load):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@gmail.com` | `password123` |
| **Tutor** | `tutor@gmail.com` | `password123` |
| **Admin** | `admin@gmail.com` | `admin@gmail.com` |

---

## License

Released under the [MIT License](LICENSE) © 2026 [Akil Shehan](https://github.com/Sh3hann).

<div align="center">

<a href="https://itzshehan.xyz/"><img src="https://img.shields.io/badge/Portfolio-itzshehan.xyz-f59e0b?style=flat-square&logo=googlechrome&logoColor=white" alt="Portfolio" /></a>
<a href="https://www.linkedin.com/in/akil-shehan"><img src="https://img.shields.io/badge/LinkedIn-Akil_Shehan-0077b5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
<a href="https://github.com/Sh3hann"><img src="https://img.shields.io/badge/GitHub-@Sh3hann-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub" /></a>

</div>
