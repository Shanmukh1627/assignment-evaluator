// =====================================================
// ✅ 1. LOAD ENV VARIABLES
// =====================================================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


// =====================================================
// ✅ 2. IMPORT FILES
// =====================================================

const Submission = require("./models/Submission");

const {
  calculatePlagiarismRisk,
  generateFeedback,
} = require("./utils/aiLogic");


// =====================================================
// ✅ 3. DEBUG ENV ON STARTUP
// =====================================================

console.log("======================================");
console.log("🚀 Starting Server...");
console.log(
  "🔑 GEMINI KEY:",
  process.env.GEMINI_API_KEY
    ? `✅ Loaded (...${process.env.GEMINI_API_KEY.slice(-6)})`
    : "❌ NOT FOUND — check your .env file"
);
console.log(
  "🗄️  MONGO URI:",
  process.env.MONGO_URI ? "✅ Loaded" : "❌ NOT FOUND"
);
console.log("======================================");


// =====================================================
// ✅ 4. CREATE EXPRESS APP
// =====================================================

const app = express();

app.use(cors());

app.use(express.json());


// =====================================================
// ✅ 5. CONNECT MONGODB
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err.message);
  });


// =====================================================
// ✅ 6. TEST GEMINI ROUTE (use to debug AI)
// Open: http://localhost:5000/test-gemini
// =====================================================

app.get("/test-gemini", async (req, res) => {
  try {
    console.log("🧪 Testing Gemini...");
    const feedback = await generateFeedback(
      "Photosynthesis is the process by which plants convert sunlight into food. " +
      "It involves chlorophyll absorbing light energy to convert carbon dioxide and water into glucose. " +
      "This process is essential for life on Earth as it produces oxygen as a byproduct."
    );
    res.json({
      success: true,
      feedback,
      keyLoaded: !!process.env.GEMINI_API_KEY,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
    });
  }
});


// =====================================================
// ✅ 7. SUBMIT ASSIGNMENT API
// =====================================================

app.post("/api/submit", async (req, res) => {

  try {

    console.log("📥 Incoming Request Body:", req.body);

    const { studentName, content } = req.body;

    // ✅ VALIDATION
    if (!studentName || !content) {
      console.log("❌ Missing Fields");
      return res.status(400).json({
        error: "studentName and content are required",
      });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({
        error: "Assignment content is too short",
      });
    }

    console.log("📄 Submission from:", studentName);


    // ─── PLAGIARISM CHECK ────────────────────
    const previousSubmissions = await Submission.find({}, "content");
    const existingTexts = previousSubmissions.map((s) => s.content);
    const plagiarismRisk = calculatePlagiarismRisk(content, existingTexts);
    console.log("📊 Plagiarism Risk:", plagiarismRisk + "%");
    // ─────────────────────────────────────────


    // ─── AI FEEDBACK ─────────────────────────
    console.log("🤖 Generating AI Feedback...");
    let aiFeedbackRaw = "";

    try {
      aiFeedbackRaw = await generateFeedback(content);
    } catch (aiError) {
      console.log("❌ AI Failed:", aiError.message);
      aiFeedbackRaw = "Unable to generate feedback at this time.";
    }

    console.log("✅ Feedback:", aiFeedbackRaw);
    // ─────────────────────────────────────────


    // ─── SCORE ───────────────────────────────
    const score = Math.floor(Math.random() * 41) + 60;
    // ─────────────────────────────────────────


    // ─── SAVE TO DATABASE ────────────────────
    const newSubmission = new Submission({
      studentName,
      assignmentTitle: "Assignment 1",
      content,
      plagiarismRisk,
      score,
      aiFeedback: aiFeedbackRaw,
    });

    await newSubmission.save();
    console.log("✅ Saved to MongoDB");
    // ─────────────────────────────────────────


    // ─── RESPONSE ────────────────────────────
    res.json(newSubmission);
    // ─────────────────────────────────────────

  } catch (error) {
    console.log("❌ SERVER ERROR:", error);
    res.status(500).json({
      error: "Server error: " + error.message,
    });
  }

});


// =====================================================
// ✅ 8. GET ALL SUBMISSIONS
// =====================================================

app.get("/api/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================================
// ✅ 9. HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    status: "✅ Backend Running",
    geminiKey: process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing",
    mongoUri: process.env.MONGO_URI ? "✅ Loaded" : "❌ Missing",
  });
});


// =====================================================
// ✅ 10. START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🧪 Test Gemini at: http://localhost:${PORT}/test-gemini`);
});