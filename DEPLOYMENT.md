# Deployment Guide for BookHub

This guide explains how to deploy BookHub to a production environment.

## Backend Deployment

### Prerequisites
- Node.js v16+
- MongoDB instance (Atlas recommended for production)
- SMTP server for email notifications
- Cloudinary account for image uploads
- Razorpay account for payments (if applicable)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/anshul098yu/BookHub.git
   cd BookHub/backend
   ```

2. **Install dependencies**
   ```bash
   npm install --production
   ```

3. **Create .env file**
   Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   CLIENT_URL=https://your-frontend-url.com
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   NODE_ENV=production
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **For PM2 (recommended for production)**
   ```bash
   npm install pm2 -g
   pm2 start app.js --name "bookhub-backend"
   ```

## Frontend Deployment

### Prerequisites
- Node.js v16+
- Access to hosting service (Vercel, Netlify, etc.)

### Steps

1. **Navigate to frontend directory**
   ```bash
   cd BookHub/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   Create a `.env` file in the frontend directory with:
   ```
   VITE_BACKEND_URL=https://your-backend-url.com
   VITE_API_BASE_URL=https://your-backend-url.com/api/v1
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. **Build for production**
   ```bash
   npm run production
   ```

5. **Deploy to hosting service**
   - For Vercel: `vercel --prod`
   - For Netlify: `netlify deploy --prod`
   - Or upload the `dist` folder to your hosting service

## Environment Considerations

- Set `NODE_ENV=production` in the backend for production mode
- Ensure MongoDB connection string includes database name
- Use secure HTTPS URLs for both frontend and backend
- Configure CORS in the backend to allow your frontend domain
- Set up proper error logging for production

## Monitoring & Maintenance

- Set up monitoring with PM2 or a similar tool
- Implement error logging with a service like Sentry
- Set up database backups for MongoDB
- Monitor disk space and memory usage

## Troubleshooting

- If emails aren't sending, check SMTP credentials and network rules
- If images aren't uploading, verify Cloudinary configuration
- For database connection issues, check network rules and connection strings
- For any 500 errors, check server logs for detailed error messages