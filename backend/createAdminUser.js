const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const Admin = require("./models/admin.model");
const { dbConnect } = require("./config/db");

// Admin credentials (using a shorter username to meet the 10-character limit)
const adminCredentials = {
    userName: "anshul098", // Shortened from "anshul098yu" to meet 10-character limit
    password: "Anshulraj098@",
    role: "admin"
};

async function createAdminUser() {
    try {
        // Connect to database
        await dbConnect();
        console.log("Connected to database");

        // Check if admin user already exists
        const existingAdmin = await Admin.findOne({ userName: adminCredentials.userName });
        if (existingAdmin) {
            console.log(`Admin user '${adminCredentials.userName}' already exists`);
            process.exit(0);
        }

        // Create new admin user
        const admin = new Admin(adminCredentials);
        await admin.save();

        console.log(`Admin user '${adminCredentials.userName}' created successfully`);
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin user:", error.message);
        process.exit(1);
    }
}

createAdminUser();