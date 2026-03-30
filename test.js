const apiKey = "AIzaSyDyMv2ms3p-Y38JdLBIrXr8991NclppCpQ";

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log("Status:", res.status);
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log("Error or no models:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

listModels();
