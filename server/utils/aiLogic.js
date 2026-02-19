const { GoogleGenerativeAI } = require("@google/generative-ai");


// ============================================
// ✅ PLAGIARISM FUNCTION (Jaccard Similarity)
// ============================================

function calculatePlagiarismRisk(newText, existingTexts) {

  if (!existingTexts || existingTexts.length === 0) return 0;

  const tokenize = (text) =>
    text.toLowerCase().split(/\W+/).filter((w) => w.length > 2);

  const tokens1 = new Set(tokenize(newText));

  let maxSimilarity = 0;

  for (const text of existingTexts) {

    const tokens2 = new Set(tokenize(text));

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));

    const union = new Set([...tokens1, ...tokens2]);

    const similarity = (intersection.size / union.size) * 100;

    if (similarity > maxSimilarity) maxSimilarity = similarity;

  }

  return Math.round(maxSimilarity);

}


// ============================================
// ✅ RULE-BASED FALLBACK FEEDBACK
// ============================================

function generateRuleBasedFeedback(text) {

  const wordCount = text.trim().split(/\s+/).length;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  const hasIntroduction =
    text.toLowerCase().includes("introduction") ||
    text.toLowerCase().includes("overview") ||
    text.toLowerCase().includes("this assignment");

  const hasConclusion =
    text.toLowerCase().includes("conclusion") ||
    text.toLowerCase().includes("in summary") ||
    text.toLowerCase().includes("to summarize") ||
    text.toLowerCase().includes("therefore");

  const hasExamples =
    text.toLowerCase().includes("example") ||
    text.toLowerCase().includes("for instance") ||
    text.toLowerCase().includes("such as");

  let feedback = "";

  // Length-based
  if (wordCount < 50) {
    feedback =
      "The submission is too brief and lacks sufficient detail. Please elaborate on the key concepts with proper explanations and examples.";
  } else if (wordCount < 150) {
    feedback =
      "The assignment covers the basics but needs more depth. Consider adding supporting evidence, examples, and a clearer structure with introduction and conclusion.";
  } else if (wordCount >= 150 && wordCount < 400) {
    if (!hasIntroduction && !hasConclusion) {
      feedback =
        "Good content length. However, the assignment lacks a clear introduction and conclusion. Structure your response better to improve readability and flow.";
    } else if (!hasExamples) {
      feedback =
        "Well-structured assignment with adequate length. Consider adding real-world examples or evidence to strengthen your arguments and demonstrate deeper understanding.";
    } else {
      feedback =
        "Good assignment with clear structure and examples. Review your arguments for logical consistency and ensure all claims are properly supported.";
    }
  } else {
    // 400+ words
    if (hasIntroduction && hasConclusion && hasExamples) {
      feedback =
        "Excellent submission with strong structure, examples, and comprehensive coverage. Ensure your citations are complete and the arguments flow logically from start to finish.";
    } else if (!hasConclusion) {
      feedback =
        "Detailed and thorough submission. The assignment would benefit from a stronger conclusion that summarizes the key points and provides a final perspective.";
    } else {
      feedback =
        "Well-developed assignment demonstrating good understanding of the topic. Consider refining your thesis statement and ensuring each paragraph contributes directly to your central argument.";
    }
  }

  return feedback;

}


// ============================================
// ✅ AI FEEDBACK FUNCTION (Gemini + Fallback)
// ============================================

async function generateFeedback(text) {

  const apiKey = process.env.GEMINI_API_KEY;

  // ─── DEBUG LOG ──────────────────────────────
  console.log(
    "🔑 GEMINI KEY CHECK:",
    apiKey ? `Found (...${apiKey.slice(-6)})` : "❌ NOT FOUND"
  );
  // ────────────────────────────────────────────

  // If no key, skip straight to fallback
  if (!apiKey) {
    console.log("⚠️  No API key — using rule-based feedback.");
    return generateRuleBasedFeedback(text);
  }

  // ─── TRY GEMINI ─────────────────────────────
  try {

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an academic assignment evaluator. 
Analyze the following student assignment and give exactly 2 lines of constructive feedback.
Be specific, professional, and helpful.

Assignment:
${text}

Feedback (2 lines only):`;

    console.log("🤖 Calling Gemini API...");

    const result = await model.generateContent(prompt);

    const output = result.response.text();

    console.log("✅ Gemini responded successfully");

    return output;

  } catch (error) {

    // ─── FULL ERROR LOGGING ──────────────────
    console.log("❌ Gemini API Error:");
    console.log("   Message :", error.message);
    console.log("   Status  :", error.status || "N/A");
    console.log("   Details :", JSON.stringify(error?.errorDetails || {}, null, 2));
    // ─────────────────────────────────────────

    console.log("⚠️  Falling back to rule-based feedback...");
    return generateRuleBasedFeedback(text);

  }

}


// ============================================
// ✅ EXPORTS
// ============================================

module.exports = {
  calculatePlagiarismRisk,
  generateFeedback,
};