# YOLOv8 Alopecia Detection System (Full Stack)

This system provides a professional interface for detecting alopecia using a trained YOLOv8 model.

## Architecture

- **Frontend**: React (Vite)
- **Middleware**: Node.js/Express (Multer for persistent storage)
- **AI Core**: FastAPI (Python/YOLOv8)
- **Database**: MongoDB (Sessions & History)

## Folder Structure

```text
/yolo_system
├── /backend          # Python FastAPI (AI Inference & Auth Logic)
├── /backend_node     # Node.js Middleware (Multer Storage & Proxy)
│   └── /uploads      # Persistent image storage (<username>/<timestamp>_<file>)
├── /frontend_react   # React Frontend (Vite)
└── README.md
```

## Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running at `mongodb://localhost:27017`

### 2. Start Backend AI (FastAPI)
Navigate to `backend` and run:
```bash
pip install -r requirements.txt
python main.py
```
*Server running on http://localhost:8000*

### 3. Start Storage Middleware (Node.js)
Navigate to `backend_node` and run:
```bash
npm install
node server.js
```
*Middleware running on http://localhost:3000*

### 4. Start React Frontend
Navigate to `frontend_react` and run:
```bash
npm install
npm run dev
```
*Open http://localhost:5173 in your browser.*

## Features

- **JWT Authentication**: Secure user registration and login.
- **Persistent Storage**: Images are saved in `/backend_node/uploads/<username>/`.
- **Intelligent Validation**: Rejects blurry, dark, or low-resolution images.
- **Healthy Hair Detection**: Explicitly identifies normal scalp/hair.
- **Prediction History**: View past records stored in MongoDB.
