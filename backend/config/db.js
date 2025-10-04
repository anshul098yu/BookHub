const mongoose = require("mongoose");

module.exports.dbConnect = async () => {
  try {
    // Use MONGODB_URL (from our .env file) or fallback to MONGODB_URI
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URL or MONGODB_URI is not defined in environment variables");
    }

    // Add database name if not included in the URI
    const uri = mongoUri.includes('/') && !mongoUri.includes('mongodb://') ?
      mongoUri :
      `${mongoUri}/bookhub`;

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      maxPoolSize: 10 // Maintain up to 10 socket connections
    });

    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Database Connection Issue:", error.message);
    if (process.env.NODE_ENV === 'production') {
      console.error("Error occurred in production environment. Check MongoDB connection string.");
    } else {
      console.error("Full error details:", error);
    }
    process.exit(1);
  }
};