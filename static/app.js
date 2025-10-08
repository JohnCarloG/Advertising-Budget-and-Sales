// static/app.js
const API_URL = "http://localhost:5001/api/predict"; // se API su altro host, cambiare qui

document.getElementById("predict").addEventListener("click", async () => {
  const tv = parseFloat(document.getElementById("tv").value) || 0;
  const radio = parseFloat(document.getElementById("radio").value) || 0;
  const newspaper = parseFloat(document.getElementById("newspaper").value) || 0;

  const payload = { TV: tv, Radio: radio, Newspaper: newspaper };
  document.getElementById("result").textContent = "Calcolo in corso...";

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (resp.ok) {
      document.getElementById("result").textContent = `Vendite previste: ${data.prediction.toFixed(3)}`;
    } else {
      document.getElementById("result").textContent = `Errore: ${data.error || JSON.stringify(data)}`;
    }
  } catch (e) {
    document.getElementById("result").textContent = "Errore di connessione all'API.";
  }
});
