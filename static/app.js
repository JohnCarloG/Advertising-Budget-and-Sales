// static/app.js
const API_URL = "http://localhost:5001/api/predict"; // se API su altro host, cambiare qui

const els = {
  tv: document.getElementById("tv"),
  radio: document.getElementById("radio"),
  news: document.getElementById("newspaper"),
  predictBtn: document.getElementById("predict"),
  result: document.getElementById("result"),
  errors: document.getElementById("errors"),
  spinner: document.querySelector("#predict .spinner"),
  btnLabel: document.querySelector("#predict .btn-label"),
  historyBody: document.getElementById("history-body"),
  historyTable: document.getElementById("history-table"),
  historyEmpty: document.getElementById("history-empty"),
  clearHistory: document.getElementById("clear-history"),
  apiStatus: document.getElementById("api-status"),
  toggleTheme: document.getElementById("toggle-theme"),
  // convertBtn rimosso
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  chatSend: document.getElementById("chat-send"),
  chatSendSpinner: document.querySelector("#chat-send .spinner"),
  chatSendLabel: document.querySelector("#chat-send .btn-label"),
  chatLog: document.getElementById("chat-log")
};

const HISTORY_KEY = "predHistoryV1";
let history = loadHistory();

const RATE_TO_EUR = 0.93; // tasso fisso modificabile
let lastPredictionUSD = null;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function renderHistory() {
  if (!history.length) {
    els.historyEmpty.classList.remove("hidden");
    els.historyTable.classList.add("hidden");
    return;
  }
  els.historyEmpty.classList.add("hidden");
  els.historyTable.classList.remove("hidden");
  els.historyBody.innerHTML = history
    .slice(0, 10)
    .map(h => `<tr>
      <td>${h.TV}</td>
      <td>${h.Radio}</td>
      <td>${h.Newspaper}</td>
      <td>${h.prediction.toFixed(2)}</td>
      <td>${h.time}</td>
    </tr>`).join("");
}

function setLoading(isLoading) {
  els.predictBtn.disabled = isLoading;
  els.spinner.classList.toggle("hidden", !isLoading);
  if (isLoading) {
    els.btnLabel.textContent = "Calcolo...";
  } else {
    els.btnLabel.textContent = "Predici";
  }
}

function validate() {
  const vals = [els.tv, els.radio, els.news];
  let msgs = [];
  vals.forEach(inp => {
    inp.classList.remove("invalid");
    if (inp.value === "" || isNaN(parseFloat(inp.value))) {
      msgs.push(`${inp.id.toUpperCase()} mancante`);
      inp.classList.add("invalid");
    } else if (parseFloat(inp.value) < 0) {
      msgs.push(`${inp.id.toUpperCase()} negativo`);
      inp.classList.add("invalid");
    }
  });
  if (msgs.length) {
    els.errors.innerHTML = msgs.join("<br>");
    els.errors.classList.remove("hidden");
    return false;
  }
  els.errors.classList.add("hidden");
  return true;
}

async function predict() {
  if (!validate()) return;
  setLoading(true);
  els.result.textContent = "Calcolo in corso...";
  const payload = {
    TV: parseFloat(els.tv.value),
    Radio: parseFloat(els.radio.value),
    Newspaper: parseFloat(els.news.value)
  };
  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (resp.ok && typeof data.prediction === "number") {
      lastPredictionUSD = data.prediction;
      const eur = lastPredictionUSD * RATE_TO_EUR;
      els.result.textContent = `Vendite previste: ${lastPredictionUSD.toFixed(2)} $ (~${eur.toFixed(2)} €)`;
      history.unshift({
        ...payload,
        prediction: data.prediction,
        time: new Date().toLocaleTimeString()
      });
      saveHistory();
      renderHistory();
    } else {
      els.result.textContent = `Errore: ${data.error || "Risposta non valida"}`;
      lastPredictionUSD = null;
    }
  } catch (e) {
    els.result.textContent = "Errore di connessione all'API.";
  } finally {
    setLoading(false);
  }
}

function setChatLoading(v){
  els.chatSend.disabled = v;
  els.chatSendSpinner.classList.toggle("hidden", !v);
  els.chatSendLabel.textContent = v ? "..." : "Invia";
}

function appendMsg(role, text){
  if(!els.chatLog) return;
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "assistant");
  div.textContent = text;
  els.chatLog.appendChild(div);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

async function sendChat(e){
  e.preventDefault();
  const q = (els.chatInput.value || "").trim();
  if(!q) return;
  appendMsg("user", q);
  els.chatInput.value = "";
  setChatLoading(true);
  try{
    const resp = await fetch(API_URL.replace("/predict","/chat"), {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({question:q})
    });
    const data = await resp.json();
    if(resp.ok && data.answer){
      appendMsg("assistant", data.answer);
    } else {
      appendMsg("assistant", "Errore: " + (data.error || "risposta non valida"));
    }
  }catch(err){
    appendMsg("assistant", "Errore connessione API chat.");
  }finally{
    setChatLoading(false);
  }
}

function attachEvents() {
  els.predictBtn.addEventListener("click", predict);
  [els.tv, els.radio, els.news].forEach(inp => {
    inp.addEventListener("input", () => {
      validate();
    });
  });
  els.clearHistory.addEventListener("click", () => {
    history = [];
    saveHistory();
    renderHistory();
  });
  els.toggleTheme.addEventListener("click", toggleTheme);
  if(els.chatForm){
    els.chatForm.addEventListener("submit", sendChat);
    els.chatInput.addEventListener("keydown", e=>{
      if(e.key==="Enter" && !e.shiftKey){
        e.preventDefault();
        sendChat(e);
      }
    });
  }
  // listener convertBtn rimosso
}

async function healthCheck() {
  try {
    const resp = await fetch(API_URL.replace("/predict","/health"), {cache:"no-store"});
    if (resp.ok) {
      setStatus("ok");
    } else setStatus("down");
  } catch {
    setStatus("down");
  }
}

function setStatus(state) {
  const el = els.apiStatus;
  el.classList.remove("status-ok","status-down","status-unknown");
  if (state === "ok") {
    el.textContent = "API OK";
    el.classList.add("status-ok");
  } else if (state === "down") {
    el.textContent = "API OFF";
    el.classList.add("status-down");
  } else {
    el.textContent = "API?";
    el.classList.add("status-unknown");
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("prefTheme",
    document.documentElement.classList.contains("dark") ? "dark" : "light");
}

function initTheme() {
  const pref = localStorage.getItem("prefTheme");
  if (pref === "dark" ||
     (!pref && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
}

function init() {
  initTheme();
  attachEvents();
  renderHistory();
  validate();
  healthCheck();
  setInterval(healthCheck, 10000);
}

document.addEventListener("DOMContentLoaded", init);
