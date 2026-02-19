const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 1. Middleware Settings
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
app.use(express.json());

// 2. MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// 3. Message Schema
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("ContactMessage", messageSchema);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Backend Server is Running!");
});

// 4. Contact Form Route
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // A. Save to MongoDB
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    console.log("💾 Message saved to MongoDB");

    // B. Nodemailer Transporter Setup (Port 587 for Render)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `New Portfolio Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    // C. Send Email
    await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully");

    res.status(200).json({
      success: true,
      message: "Message received and email sent!",
    });
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Message process failed",
      error: error.message,
    });
  }
});

// 5. Port Settings
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
