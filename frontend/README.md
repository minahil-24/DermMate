# DermMate - Dermatology Platform Frontend

A comprehensive frontend application for a dermatology platform built with React, Vite, and modern web technologies.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Chart.js / Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zustand** - State management
- **Mock Data** - No backend required

## 📁 Project Structure

```
src/
 ├── assets/              # Static assets
 ├── components/          # Reusable components
 │   ├── common/          # Common UI components (Toast, Skeleton, etc.)
 │   ├── layout/          # Layout components (Sidebar, Navbar)
 │   ├── charts/          # Chart components
 │   └── ui/              # UI primitives (Button, Card, Modal)
 ├── pages/               # Page components
 │   ├── auth/            # Authentication pages
 │   ├── patient/         # Patient module pages
 │   ├── dermatologist/   # Dermatologist module pages
 │   ├── admin/           # Admin module pages
 │   └── system/          # System role pages
 ├── routes/              # Route configuration
 ├── mock-data/           # Mock data files
 ├── store/               # Zustand stores
 ├── utils/               # Utility functions
 ├── hooks/               # Custom React hooks
 ├── styles/              # Global styles
 └── App.jsx              # Main app component
```

## 🎨 Features

### Authentication
- Login/Signup pages with role selection
- Mock authentication (no backend)
- Role-based routing protection
- Google Login UI (mock)

### Patient Module
- Dashboard with overview cards and stats
- Profile management
- Complaint selection (Hair/Skin/Nails)
- Multi-step questionnaire
- Image upload with multi-angle validation
- AI Alopecia Detection (UI mock)
- Dermatologist search and booking
- Appointment management
- Pre-appointment case submission
- Follow-up management
- Medical records viewer
- Treatment plan viewer
- Notifications center
- Clinics discovery

### Dermatologist Module
- Dashboard with appointment queue
- Certification upload and status
- Appointment management (Accept/Reject)
- Patient case viewer
- Image management with before/after comparison
- Clinical notes with speech-to-text UI
- Treatment planning
- Follow-up scheduling
- Notifications

### Admin Module
- Dashboard with analytics
- User management
- Dermatologist verification
- AI model management
- Reports & analytics with charts
- Broadcast notifications

### System Role
- Image quality validation
- Multi-angle validation
- Case structuring
- AI inference status
- Speech-to-text processing
- Reminder automation logs
- Activity logs
- System reports

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd DermMate/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 🔐 Demo Credentials

The application uses mock authentication. You can login with:

- **Patient**: `patient@example.com` (any password)
- **Dermatologist**: `dermatologist@example.com` (any password)
- **Admin**: `admin@example.com` (any password)

## 🎨 Design System

- **Theme Colors**: Emerald/Teal medical theme
- **Design Style**: Clean, modern, health-tech UI
- **Animations**: Smooth page transitions, hover effects, loading states
- **Layout**: Card-based layouts with glassmorphism effects
- **Responsive**: Fully responsive (mobile, tablet, desktop)
- **Dark Mode**: Optional dark mode support

## 📱 Responsive Design

The application is fully responsive and works on:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 🛠️ Development

### Adding New Pages

1. Create a new component in the appropriate `pages/` subdirectory
2. Add the route in `src/App.jsx`
3. Add navigation link in the appropriate Sidebar component

### Adding Mock Data

1. Create or update files in `src/mock-data/`
2. Import and use in your components

### State Management

- Use Zustand stores in `src/store/` for global state
- Use React Hook Form for form state
- Use local state for component-specific data

## 📦 Key Dependencies

- `react` - ^18.2.0
- `react-dom` - ^18.2.0
- `react-router-dom` - ^6.14.0
- `framer-motion` - ^10.16.4
- `lucide-react` - ^0.562.0
- `chart.js` - ^4.4.0
- `react-chartjs-2` - ^5.2.0
- `react-hook-form` - ^7.48.2
- `zustand` - ^4.4.6
- `tailwindcss` - ^3.3.5
- `vite` - ^5.0.0

## 🎯 UX Features

- Page transition animations
- Skeleton loaders
- Toast notifications
- Empty states
- Error states
- Tooltips
- Responsive sidebar navigation
- Breadcrumbs navigation

## 📝 Notes

- This is a **frontend-only** application with mock data
- No backend connection required
- All data is stored in memory/localStorage
- Perfect for prototyping and UI/UX demonstration

## 🚧 Future Enhancements

- Connect to real backend API
- Implement actual AI detection
- Add real-time notifications
- Implement file upload to cloud storage
- Add more chart types and analytics
- Enhance dark mode support

## 📄 License

This project is part of a Final Year Project (FYP).

---

Built with ❤️ for dermatology care
