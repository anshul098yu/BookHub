const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user.model");
const Admin = require("./models/admin.model");

// Load environment variables
dotenv.config();

// Database connection
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
}

async function createTestUser() {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: "anshulraj6205474281@gmail.com" });

        if (existingUser) {
            console.log("User 'Adarsh' already exists. Updating fine amount...");
            existingUser.fineAmount = 50; // Set fine amount to ₹50
            await existingUser.save();
            console.log("User 'Adarsh' updated with fine amount: ₹", existingUser.fineAmount);
        } else {
            // Create new user
            const newUser = new User({
                fullName: "Adarsh",
                email: "anshulraj6205474281@gmail.com",
                password: "adarsh123", // This will be hashed
                gender: "male",
                profilePic: {
                    imageUrl: "https://ui-avatars.com/api/?name=Adarsh&background=random"
                },
                role: "user",
                fineAmount: 50, // Set fine amount to ₹50
                isVerified: true, // Mark as verified for testing
                phone: "+916205474281",
                address: "Bit Mesra, Ranchi, India"
            });

            await newUser.save();
            console.log("User 'Adarsh' created successfully with fine amount: ₹", newUser.fineAmount);
        }

        // Create admin user
        const existingAdmin = await Admin.findOne({ userName: "Aditya" });

        if (existingAdmin) {
            console.log("Admin 'Aditya' already exists.");
        } else {
            // Create new admin
            const newAdmin = new Admin({
                userName: "Aditya",
                password: "Aditya098", // This will be hashed
                email: "aditya@example.com",
                fullName: "Aditya Admin",
                profilePic: {
                    imageUrl: "https://ui-avatars.com/api/?name=Aditya&background=random"
                },
                isVerified: true,
                role: "admin"
            });

            await newAdmin.save();
            console.log("Admin 'Aditya' created successfully");
        }

        console.log("Test user setup completed");
    } catch (error) {
        console.error("Error:", error.message);
        throw error;
    }
}

// Export the function
module.exports = createTestUser;