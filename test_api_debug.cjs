
async function test() {
  const key = "AIzaSyDgD-5SxDKlOGgUvmGNrNgvv4RSoe5YwGo"; 
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + key;
  const body = {
    contents: [{ role: "user", parts: [{ text: "Create a luxury watch ad" }] }],
    generationConfig: { responseModalities: ["IMAGE"] }
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}
test();