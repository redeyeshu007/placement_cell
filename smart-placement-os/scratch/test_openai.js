const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function checkOpenAl() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not found in .env.local");
    process.exit(1);
  }

  console.log("🔍 Checking OpenAI API status...");
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say 'OpenAI is operational'" }],
      max_tokens: 10,
    });

    console.log("✅ Success!");
    console.log("Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("❌ OpenAI API Error:");
    console.error(error.message);
    if (error.status) console.error("Status:", error.status);
    if (error.code) console.error("Code:", error.code);
  }
}

checkOpenAl();
