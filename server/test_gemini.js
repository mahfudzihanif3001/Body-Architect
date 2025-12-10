require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAI() {
  console.log("1. Membaca API KEY...");
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("❌ API KEY TIDAK DITEMUKAN DI .ENV");
    return;
  }
  console.log("✅ API KEY terbaca:", key.substring(0, 10) + "...");

  console.log("2. Menghubungi Google Gemini...");
  const genAI = new GoogleGenerativeAI(key);

  // Coba model 'gemini-1.5-flash'
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = "Sapa saya dengan semangat dalam 5 kata!";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("\n🎉 SUKSES! Balasan AI:");
    console.log(text);
  } catch (error) {
    console.error("\n❌ ERROR TERJADI:");
    console.error(error.message);

    // Jika masih error, kita cek model apa yang tersedia untuk akunmu
    console.log("\n🔍 Mencoba listing model yang tersedia...");
    try {
      // Ini fitur untuk melihat model apa saja yang boleh kamu pakai
      // (Butuh library versi terbaru)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      const data = await response.json();
      console.log("Daftar Model yang tersedia untuk key ini:");
      if (data.models) {
        data.models.forEach((m) => console.log("- " + m.name));
      } else {
        console.log("Tidak bisa mengambil list model.", data);
      }
    } catch (e) {
      console.log("Gagal cek list model.");
    }
  }
}

testAI();
