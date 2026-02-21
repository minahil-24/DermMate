DermMate - AI Dermatology Platform Frontend & Full Stack

DermMate v1.0 is an AI-powered dermatology platform designed to streamline dermatological workflows, improve patient care, and integrate intelligent clinical automation. The platform provides role-based access for patients, dermatologists, and administrators, supporting features such as AI-assisted image analysis, structured case management, appointment scheduling, and notification systems.

📌 Table of Contents

Purpose

Features

User Roles

Technology Stack

System Requirements

Installation & Setup

Project Structure

Demo Credentials

UX & Design

Future Enhancements

License

🧭 Purpose

DermMate aims to:

Reduce manual clinical workload through intelligent automation.

Improve diagnostic efficiency using AI-assisted image analysis.

Enhance patient experience with guided data submission and streamlined communication.

Enable structured, traceable, and secure dermatological care delivery.

🌟 Features
Authentication

Email-based login/signup with role selection

Mock and Google login (UI only)

Role-based routing and access protection

Patient Module

Dashboard with overview stats and cards

Profile management and history

Complaint selection (Hair, Skin, Nails)

Multi-step questionnaires

Multi-angle image upload with validation

AI Alopecia Detection (UI mock)

Dermatologist search and booking

Appointment management and pre-appointment case submission

Follow-up tracking

Medical record and treatment plan viewer

Notifications and clinic discovery

Dermatologist Module

Dashboard with appointment queue

Certification upload and verification

Case management and image comparison (before/after)

Clinical notes with speech-to-text

Treatment planning and follow-ups

Notifications and alerts

Admin Module

Analytics dashboard

User management and dermatologist verification

AI model management

Reports and broadcast notifications

System Role

Image quality and multi-angle validation

Case structuring and AI inference status

Speech-to-text processing

Reminder automation logs

Activity and system reports

AI Integration

YOLOv8-based alopecia detection

Intelligent image validation (blurry, dark, low-res rejection)

Persistent storage of uploaded images

Prediction history viewable by patients

👥 User Roles
Role	Capabilities
Patient	Submit cases, upload images, book appointments, view reports and treatments.
Dermatologist	Review AI-assisted cases, document consultations, manage follow-ups, handle appointments.
Admin	Manage users, verify dermatologists, maintain AI models, generate reports.
🛠 Technology Stack

Frontend:

React 18 + Vite

Tailwind CSS

React Router DOM

Framer Motion

Lucide React Icons

Chart.js / Recharts

Backend:

Python (FastAPI) for AI inference and API

Node.js/Express for image storage (Multer)

MongoDB for session and history storage

AI Tools:

YOLOv8 for alopecia detection

TensorFlow / PyTorch / OpenCV

Other:

JWT Authentication

Role-based access control

Responsive design (Mobile/Tablet/Desktop)

💻 System Requirements

Client Device: Desktop, laptop, tablet, or smartphone with camera

OS: Windows, macOS, Android, iOS

Browser: Latest Chrome, Firefox, Safari, Edge

Network: Internet connection for AI processing, notifications, and payments

🚀 Installation & Setup
Frontend Setup
cd DermMate/frontend
npm install
npm start

Open browser at http://localhost:3000

Backend AI (FastAPI)
cd backend
pip install -r requirements.txt
python main.py

Server runs at http://localhost:8000

Middleware Node.js
cd backend
npm install
npm start

Middleware runs at http://localhost:3000

Production Build
npm run build
npm run preview

Built files located in /dist

🎨 UX & Design

Theme: Emerald/Teal medical theme

Layout: Card-based, glassmorphism

Animations: Smooth transitions, hover effects, skeleton loaders

Responsive: Mobile → Desktop → Large screens

Dark Mode: Optional support

🔮 Future Enhancements

Real backend integration

AI-assisted detection live

Real-time notifications

Cloud storage support for uploads

More analytics and chart types

Enhanced dark mode

📄 License

This project is part of a Final Year Project (FYP).
Built with ❤️ for dermatology care and YOLOv8 Alopecia Detection.

💡 Summary

DermMate provides a professional, AI-powered dermatology platform, combining:

Patient-friendly case submission

Dermatologist-assisted AI review

Admin monitoring and analytics

Full-stack architecture ready for production
