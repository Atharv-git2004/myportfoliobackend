const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// 2. Message Schema
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("ContactMessage", messageSchema);

// 3. API Endpoint (POST)
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // A. Save to Database
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    console.log("💾 Message saved to MongoDB");

    // B. Email Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Puthiya 16-digit App Password ivide venam
      },
      tls: {
        rejectUnauthorized: false, // Certificate error ozhivakkan
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
      message: "Something went wrong!",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
