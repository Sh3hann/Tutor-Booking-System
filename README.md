<div align="center">

# 📚 TutorHub — Modern Tutoring & Educational Booking Marketplace
### Connecting Students, Verified Tutors, and Educational Institutes

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tutor-booking-system-eight.vercel.app)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<p align="center">
  <a href="https://tutor-booking-system-eight.vercel.app"><b>🚀 Visit Live Platform</b></a> •
  <a href="#-key-features"><b>Explore Features</b></a> •
  <a href="#-tech-stack"><b>Tech Stack</b></a> •
  <a href="#-getting-started"><b>Local Setup</b></a>
</p>

</div>

---

## ⚡ Key Features

- 🔍 **Smart Tutor Discovery**: Search, filter, and compare tutors based on subject matter, hourly rate, rating, language, and curriculum levels.
- 📅 **Real-Time Booking & Scheduling**: Seamless calendar booking engine allowing students to select time slots with automated conflict resolution.
- 🤖 **AI Study Companion**: Integrated conversational AI assistant helping students with homework hints and study planning.
- 💬 **Live Chat & Messaging**: Real-time direct messaging between students and tutors to discuss lesson goals and materials.
- 🏢 **Institute Management Portal**: Special multi-tutor dashboards for coaching academies and institutes to manage faculty and collective schedules.
- 💳 **Tiered Subscriptions & Payments**: Flexible membership tiers and secure payment processing for premium tutoring packages.
- 🛡️ **Role-Based Security**: Complete JWT-authenticated access control for 4 user archetypes: **Students**, **Tutors**, **Institutes**, and **Super Admins**.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hosting**: [Vercel](https://vercel.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & cryptjs
- **Architecture**: Modular RESTful API route architecture

---

## 🚀 Getting Started

### 1. Clone the repository
`ash
git clone https://github.com/Sh3hann/Tutor-Booking-System.git
cd Tutor-Booking-System
`

### 2. Setup and Run Backend
`ash
cd Backend
npm install
# Configure your .env (PORT, MONGO_URI, JWT_SECRET)
npm run dev
`

### 3. Setup and Run Frontend
`ash
cd ../Frontend
npm install
npm run dev
`

The application will run on http://localhost:5173 with backend API on http://localhost:5000.

---

## 📂 Repository Structure

`
Tutor-Booking-System/
├── Backend/
│   ├── config/              # MongoDB connection & server configuration
│   ├── middleware/          # JWT auth, RBAC & error handlers
│   ├── routes/              # REST endpoints (auth, tutors, bookings, ai-chat, institutes)
│   ├── utils/               # Token generators & business logic helpers
│   └── server.js            # Express server initialization
│
├── Frontend/
│   ├── src/
│   │   ├── app/             # Application views & pages
│   │   ├── components/      # UI widgets, modal dialogs & cards
│   │   └── main.tsx         # React app entry point
│   ├── index.html           # HTML template
│   └── vite.config.ts       # Vite bundler configuration
`

---

## 👤 Author

**Akil Shehan**
- Live Demo: [tutor-booking-system-eight.vercel.app](https://tutor-booking-system-eight.vercel.app)
- Portfolio: [itzshehan.xyz](https://itzshehan.xyz/)
- GitHub: [@Sh3hann](https://github.com/Sh3hann)
- LinkedIn: [Akil Shehan](https://www.linkedin.com/in/akil-shehan-b808b340b)

---

## 📄 License
This project is licensed under the MIT License.