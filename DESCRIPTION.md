# BookHub - Library Management System

BookHub is a modern, full-stack Library Management System designed to streamline book borrowing, user management, and library analytics. Built with cutting-edge technologies, it provides an efficient and user-friendly interface for both library patrons and administrators.

## Overview

BookHub transforms traditional library operations by digitizing and automating key processes. The system offers a seamless experience for managing book inventories, tracking borrowing history, and generating insightful analytics - all through an intuitive web interface.

## Key Features

### For Library Users
- **User Authentication**: Secure registration and login system with JWT-based session management
- **Book Discovery**: Browse and search through an extensive digital catalog of books
- **Borrowing System**: Request to borrow books and manage your borrowing history
- **Queue Management**: Join waiting lists for popular books and receive automatic notifications
- **Profile Management**: Update personal information and view reading history
- **Review System**: Rate and review books to help other users make informed decisions
- **Dark/Light Mode**: Personalized viewing experience with theme preferences

### For Library Administrators
- **Dashboard Analytics**: Real-time insights into library operations and user activities
- **Book Management**: Complete CRUD operations for the library catalog with soft delete functionality
- **User Management**: View user statistics, manage accounts, and monitor user activities
- **Borrowing Oversight**: Track book loans, returns, and manage overdue items
- **Notification System**: Automated email alerts for due dates, overdue books, and queue updates
- **Fine Management**: Track and manage user fines for overdue books

### Technical Highlights
- **Responsive Design**: Fully mobile-friendly interface that works on all devices
- **Secure Architecture**: JWT authentication with protected routes and middleware
- **Real-time Notifications**: Email alerts powered by Nodemailer and cron jobs
- **Data Visualization**: Charts and graphs for better data interpretation
- **Cloud Integration**: Cloudinary integration for efficient image management
- **Modern Stack**: Built with React, Node.js, Express, and MongoDB

## Technology Stack

### Backend
- **Node.js** with **Express.js** framework
- **MongoDB** database with **Mongoose** ODM
- **JWT** for secure authentication
- **Nodemailer** for email notifications
- **Cloudinary** for image management
- **node-cron** for scheduled tasks

### Frontend
- **React** with **Redux Toolkit** for state management
- **TailwindCSS** for styling
- **Radix UI** components
- **Recharts** for data visualization
- **Vite** for fast development

## Benefits

1. **Efficiency**: Automates manual library processes, reducing administrative overhead
2. **Accessibility**: 24/7 access to library services from any device
3. **Transparency**: Real-time tracking of book availability and borrowing status
4. **Scalability**: Designed to handle growing collections and user bases
5. **User Engagement**: Review system and reading history encourage active participation
6. **Data-Driven**: Analytics help librarians make informed decisions about collection management

## Getting Started

BookHub is ready for deployment and can be easily set up in any environment that supports Node.js and MongoDB. With separate backend and frontend components, it offers flexibility in deployment architecture.

Whether you're managing a small community library or a large institutional collection, BookHub provides the tools needed to modernize your library operations and enhance the user experience.