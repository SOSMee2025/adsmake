import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = "AIzaSyDyMv2ms3p-Y38JdLBIrXr8991NclppCpQ";

async function run() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  try {
    const res = await model.generateContent("Hola, esto es una prueba");
    console.log("Response:", res.response.text());
  } catch(e) {
    console.error("Error calling gemini-2.5-flash:", e.message);
  }
}
run();
