
async function test() {
  const key = "AIzaSyDgD-5SxDKlOGgUvmGNrNgvv4RSoe5YwGo"; 
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + key;
  const body = {
    contents: [{ role: "user", parts: [{ text: "Create a simple ad" }] }],
    generationConfig: { responseModalities: ["IMAGE"] }
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  console.log("PARTS:", JSON.stringify(data.candidates[0].content.parts, null, 2));
}
test();