import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure this matches your .env.local variable name
const genAI = new GoogleGenerativeAI('AIzaSyALA4lFmK_2ZbaFPS9c_NpG_qaSIki0xMs');

export async function POST(req) {
  try {
    const { imageBase64, userText } = await req.json();
    
    if (!imageBase64 || !userText) {
      return NextResponse.json({ error: "Missing image or text input" }, { status: 400 });
    }

    const imageData = imageBase64.split(",")[1];
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const prompt = `
You are an expert Document Architect and Design System Compiler. 
Your goal is to inspect the provided reference image to extract its design system color palette, and format the user's complete background text into a matching structured hierarchy.

=== INPUT DATA ===
<user_career_text>
${userText}
</user_career_text>

=== FULL CONTENT EXPANSION MANDATE (CRITICAL) ===
- You MUST process and include ALL text, jobs, bullet points, metrics, and data points present in <user_career_text>.
- Do NOT shorten, summarize, or truncate anything. 
- Build complete, detailed blocks for the sections: EXPERIENCE, SKILLS, EDUCATION, PROJECTS, and CERTIFICATIONS.

=== DESIGN SYSTEM COLOR EXTRACTION ===
- Extract the core visual colors directly from the uploaded reference image.
- Output colors ONLY as standard 6-character hexadecimal codes (e.g., "#0F172A"). Never output color functions like lab() or oklch().

=== MANDATORY JSON OUTPUT FORMAT ===
Return ONLY raw, valid JSON. Do not wrap in markdown syntax blocks (\`\`\`). Do not include conversation or introductions.

{
  "fullName": "Name extracted from input text",
  "primaryColor": "#HEX_ACCENT_FROM_IMAGE",
  "textColor": "#HEX_BODY_TEXT_FROM_IMAGE",
  "accentColor": "#HEX_SECONDARY_MUTED_FROM_IMAGE",
  "fontStyle": "sans" or "serif",
  "summary": "Polished, highly detailed professional profile summary paragraph.",
  "sections": [
    { "heading": "EXPERIENCE", "content": "Full un-truncated detailed job description data." },
    { "heading": "SKILLS", "content": "Complete comprehensive list of competencies." },
    { "heading": "EDUCATION", "content": "Complete academic history details." },
    { "heading": "PROJECTS", "content": "Detailed, complete documentation of key projects." },
    { "heading": "CERTIFICATIONS", "content": "All certifications and accomplishments." }
  ]
}
`;


    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: imageData, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    let text = response.text();

    // BETTER JSON CLEANING: Finds the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1 || end === 0) {
      console.error("AI Response was not JSON:", text);
      throw new Error("AI returned an invalid format");
    }

    const jsonString = text.substring(start, end);
    const parsedData = JSON.parse(jsonString);

    return NextResponse.json(parsedData);

  } catch (error) {
    // This will now show the REAL error in your VS Code terminal
    console.error("--- BACKEND ERROR ---", error);
    return NextResponse.json({ 
      error: error.message || "Failed to parse AI response" 
    }, { status: 500 });
  }
}