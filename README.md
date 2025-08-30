# BookHub - Library Management System

BookHub is a full-stack Library Management System designed to streamline book borrowing, user management, and library analytics. Built with the MERN stack, it provides a modern, responsive interface for both library users and administrators.

## Features

### Backend (Node.js, Express, MongoDB)
- **Authentication & Authorization:** Secure user and admin login, registration, and JWT-based session management
- **Book Management:** CRUD operations for books with soft delete and restore functionality
- **User Management:** Admin dashboard for managing users and viewing statistics
- **Borrowing System:** Handles book borrowing, returning, and queue management
- **Review & Rating:** Users can review and rate books
- **Notifications:** Email notifications for due/overdue reminders and queue updates
- **Profile Management:** Users can update their profile and view borrowing history

### Frontend (React, Redux, TailwindCSS)
- **User Portal:** Browse books, borrow/return books, view history, and manage profile
- **Admin Portal:** Manage books, users, requests, and view analytics via dedicated dashboard
- **Responsive UI:** Mobile-friendly design with dark/light mode support
- **State Management:** Redux Toolkit for global state management
- **Real-time Feedback:** Notifications and alerts for user actions

## Technologies Used

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer, Cloudinary, node-cron
- **Frontend:** React, Redux Toolkit, React Router, TailwindCSS, Radix UI, Axios, Recharts
- **Dev Tools:** Vite, ESLint, Nodemon

## Installation & Setup

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB instance (local or cloud)

### Backend Setup
```bash
cd backend
npm install
# Create a .env file with required variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Author

- Anshul Raj

## License

This project is licensed under the ISC License.
