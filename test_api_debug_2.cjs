
async function test() {
  const key = "AIzaSyDgD-5SxDKlOGgUvmGNrNgvv4RSoe5YwGo"; 
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + key;
  const body = {
    contents: [{ role: "user", parts: [{ text: "Create a simple ad" }] }],
    generationConfig: { responseModalities: ["IMAGE"] }
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  console.log("Model: gemini-2.0-flash-exp", "Status:", res.status);
  const data = await res.json();
  if (res.status !== 200) console.log("Response:", JSON.stringify(data, null, 2));
}
test();