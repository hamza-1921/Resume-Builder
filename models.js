const { GoogleGenerativeAI } = require("@google/generative-ai");
// If you aren't using a .env file, replace process.env.GEMINI_API_KEY with your actual key string

const genAI = new GoogleGenerativeAI("AIzaSyAydYc65f_w9E3Oab2ZT21Z_7Vsl_AKuaw");

async function checkMyModels() {
  try {
    // In the standard SDK, we use the global fetch-like pattern or the internal client
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY || "AIzaSyAydYc65f_w9E3Oab2ZT21Z_7Vsl_AKuaw"}`);
    const data = await response.json();

    console.log("--- START OF MODELS LIST ---");
    if (data.models) {
      data.models.forEach(model => {
        console.log(`> Model Name: ${model.name}`);
        console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(", ")}`);
        console.log('---------------------------');
      });
    } else {
      console.log("No models found. Response received:", data);
    }
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

checkMyModels();