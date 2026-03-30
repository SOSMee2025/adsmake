const GEMINI_KEY = "AIzaSyDgD-5SxDKlOGgUvmGNrNgvv4RSoe5YwGo";
const AI_STUDIO_KEY = "AIzaSyDyMv2ms3p-Y38JdLBIrXr8991NclppCpQ";

async function testKey(label, key) {
  console.log(`\n====== Testing: ${label} ======`);

  // Test 1: List available models
  const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  console.log("Models endpoint status:", modelsRes.status);
  
  // Test 2: Try imagen-4.0-fast-generate-001
  const imagenRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:generateImages?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "A professional product ad photo, cinematic lighting",
        number_of_images: 1,
      })
    }
  );
  const imagenText = await imagenRes.text();
  console.log("Imagen 4 status:", imagenRes.status);
  try {
    const data = JSON.parse(imagenText);
    if (data.predictions || data.generatedImages) {
      console.log("SUCCESS - got images!");
    } else {
      const msg = data.error?.message || JSON.stringify(data).substring(0, 300);
      console.log("Error:", msg.substring(0, 200));
    }
  } catch(e) {
    console.log("Raw:", imagenText.substring(0, 200));
  }

  // Test 3: Try gemini-2.5-flash-image with IMAGE modality
  const flashImgRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Generate a simple product ad image, red background" }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
      })
    }
  );
  const flashText = await flashImgRes.text();
  console.log("gemini-2.5-flash-image status:", flashImgRes.status);
  try {
    const data = JSON.parse(flashText);
    const parts = data.candidates?.[0]?.content?.parts;
    if (parts?.some(p => p.inlineData)) {
      console.log("SUCCESS - got image inline data!");
    } else {
      const msg = data.error?.message || JSON.stringify(data).substring(0, 200);
      console.log("Error:", msg.substring(0, 200));
    }
  } catch(e) {
    console.log("Raw:", flashText.substring(0, 200));
  }
}

await testKey("Gemini API Key (Cloud Project SOSMee)", GEMINI_KEY);
