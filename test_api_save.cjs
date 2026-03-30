
async function test() {
  const key = "AIzaSyDgD-5SxDKlOGgUvmGNrNgvv4RSoe5YwGo"; 
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + key;
  const body = {
    contents: [{ role: "user", parts: [{ text: "Create a minimalist logo for a tech startup" }] }],
    generationConfig: { responseModalities: ["IMAGE"] }
  };
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart) {
      console.error("No image part found in response:", JSON.stringify(data, null, 2));
      return;
    }
    const base64Data = imagePart.inlineData.data;
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync("/Users/alejandroleon/Desktop/ADSmake/test_output.png", buffer);
    console.log("Image saved to /Users/alejandroleon/Desktop/ADSmake/test_output.png");
    console.log("File size:", buffer.length, "bytes");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();