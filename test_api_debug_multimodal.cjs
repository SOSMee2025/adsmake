
async function test() {
  const key = "AIzaSyDgD-5SxDKlOGgUvmGNrNgvv4RSoe5YwGo"; 
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + key;
  // A tiny blank pixel for multimodal test
  const dummyPic = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  const body = {
    contents: [{ role: "user", parts: [
      { inlineData: { data: dummyPic, mimeType: "image/png" } },
      { text: "Modify this to be a luxury watch ad" }
    ] }],
    generationConfig: { responseModalities: ["IMAGE"] }
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  console.log("Model: gemini-2.5-flash-image", "Multimodal Status:", res.status);
  const data = await res.json();
  if (res.status !== 200) console.log("Response:", JSON.stringify(data, null, 2));
}
test();