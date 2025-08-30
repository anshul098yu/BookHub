const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { dbConnect } = require("./config/db");
const dotenv = require("dotenv");
const cron = require("node-cron");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

// Import Models for sample data creation
const User = require("./models/user.model");
const Book = require("./models/book.model");
const BorrowRecord = require("./models/borrowRecord.model");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://book-hub-zeta-blue.vercel.app"],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Routes
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/admin", require("./routes/admin.routes"));
app.use("/api/v1/user", require("./routes/user.routes"));
app.use("/api/v1/book", require("./routes/book.routes"));
app.use("/api/v1/borrow", require("./routes/borrow.routes"));
app.use("/api/v1/profile", require("./routes/profile.routes"));
app.use("/api/v1/import", require("./routes/import.routes"));
app.use("/api/v1/notification", require("./routes/notification.route"));
app.use("/api/v1/payment", require("./routes/payment.routes"));
app.use("/api/v1/review", require("./routes/review.routes"));
app.use("/api/v1/fine", require("./routes/fine.routes"));
app.use("/api/v1/discussion", require("./routes/discussion.routes"));
app.use("/api/v1/challenge", require("./routes/challenge.routes"));
app.use("/api/v1/badge", require("./routes/badge.routes"));
app.use("/api/v1/advanced-analytics", require("./routes/advancedAnalytics.routes"));
app.use("/api/v1/advanced-borrowing", require("./routes/advancedBorrowing.routes"));
app.use("/api/v1/integration", require("./routes/integration.routes"));
app.use("/api/v1/payment-gateway", require("./routes/paymentGateway.routes"));
app.use("/api/v1/wishlist", require("./routes/wishlist.routes"));

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BookHub API is running successfully!",
  });
});

// Function to create sample analytics data
async function createSampleAnalyticsData() {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("Sample data already exists, skipping creation...");
      return;
    }

    console.log("Creating sample analytics data...");

    // Create sample users with historical dates
    const sampleUsers = [];
    const userNames = [
      "John Doe", "Jane Smith", "Alice Johnson", "Bob Brown", "Charlie Davis",
      "Diana Wilson", "Eve Miller", "Frank Garcia", "Grace Martinez", "Henry Rodriguez"
    ];

    for (let i = 0; i < userNames.length; i++) {
      const name = userNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      const gender = i % 2 === 0 ? 'male' : 'female'; // Alternate between male and female

      // Create dates over the last 6 months
      const monthsAgo = Math.floor(i / 2);
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - monthsAgo);

      const user = new User({
        fullName: name,
        email: email,
        password: "password123", // This will be hashed by the model
        gender: gender,
        profilePic: {
          imageUrl: gender === 'male'
            ? `https://avatar.iran.liara.run/public/boy?username=${name}`
            : `https://avatar.iran.liara.run/public/girl?username=${name}`
        },
        isVerified: true,
        createdAt: createdAt,
        updatedAt: createdAt
      });

      const savedUser = await user.save();
      sampleUsers.push(savedUser);
    }

    console.log(`✅ Created ${sampleUsers.length} sample users`);

    // Create sample books with historical dates
    const sampleBooks = [];
    const bookTitles = [
      "JavaScript: The Good Parts", "Python Programming", "Node.js Design Patterns",
      "React Development Guide", "MongoDB Essentials", "Express.js Fundamentals",
      "Web Development Bootcamp", "Data Structures & Algorithms", "Software Engineering",
      "Computer Science Basics"
    ];

    for (let i = 0; i < bookTitles.length; i++) {
      const title = bookTitles[i];

      // Create dates over the last 4 months
      const monthsAgo = Math.floor(i / 3);
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - monthsAgo);

      const book = new Book({
        title: title,
        description: `A comprehensive guide to ${title.toLowerCase()}`,
        quantity: Math.floor(Math.random() * 5) + 3, // 3-7 copies
        availableQuantity: Math.floor(Math.random() * 3) + 1, // 1-3 available
        authors: [`Author ${i + 1}`],
        genres: ["Computer Science", "Technology"],
        keywords: title.toLowerCase().split(' '),
        language: "English",
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
        coverImage: {
          publicId: `book_${i}`,
          imageUrl: `https://via.placeholder.com/300x400?text=${encodeURIComponent(title)}`
        },
        externalSource: "manual",
        createdAt: createdAt,
        updatedAt: createdAt
      });

      const savedBook = await book.save();
      sampleBooks.push(savedBook);
    }

    console.log(`✅ Created ${sampleBooks.length} sample books`);

    // Create sample borrow records with historical dates
    const sampleBorrowRecords = [];

    for (let i = 0; i < 15; i++) {
      const user = sampleUsers[i % sampleUsers.length];
      const book = sampleBooks[i % sampleBooks.length];

      // Create borrow records over the last 3 months
      const monthsAgo = Math.floor(i / 5);
      const issueDate = new Date();
      issueDate.setMonth(issueDate.getMonth() - monthsAgo);
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30));

      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks from issue

      let status = "returned";
      let returnDate = null;

      // Some records are still issued or overdue
      if (i < 5) {
        status = "issued";
        const today = new Date();
        if (dueDate < today) {
          status = "overdue";
        }
      } else {
        // Return date is random between issue and due date
        returnDate = new Date(issueDate);
        returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 14) + 1);
      }

      const borrowRecord = new BorrowRecord({
        userId: user._id,
        bookId: book._id,
        issueDate: issueDate,
        dueDate: dueDate,
        returnDate: returnDate,
        status: status,
        createdAt: issueDate,
        updatedAt: returnDate || issueDate
      });

      const savedRecord = await borrowRecord.save();
      sampleBorrowRecords.push(savedRecord);
    }

    console.log(`✅ Created ${sampleBorrowRecords.length} sample borrow records`);
    console.log("✅ Sample analytics data creation completed successfully!");

  } catch (error) {
    console.error("❌ Error creating sample analytics data:", error.message);
  }
}

// Cron job for overdue books (runs daily at 9 AM)
cron.schedule("0 9 * * *", async () => {
  try {
    const today = new Date();
    const result = await BorrowRecord.updateMany(
      {
        dueDate: { $lt: today },
        status: "issued",
      },
      { status: "overdue" }
    );
    console.log(`Updated ${result.modifiedCount} books to overdue status`);
  } catch (error) {
    console.error("Error updating overdue books:", error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error"
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Connect to database
dbConnect()
  .then(() => {
    // Start server after database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Create admin user in development mode
      if (process.env.NODE_ENV === "development") {
        const createTestUser = require("./createTestUser");
        createTestUser().catch((err) => {
          console.error("Error creating test user:", err.message);
        });
      }
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
  });

module.exports = app;