# api_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = "models/best_model.pkl"
model = joblib.load(MODEL_PATH)

# --- LLM Support -------------------------------------------------------------
try:
    from openai import OpenAI
    _openai_client = OpenAI()
except Exception:
    _openai_client = None

LLM_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

_PROJECT_CONTEXT = None

def load_project_context():
    global _PROJECT_CONTEXT
    if _PROJECT_CONTEXT:
        return _PROJECT_CONTEXT
    parts = []
    ctx_path = os.getenv("PROJECT_CONTEXT_PATH")
    candidates = [ctx_path] if ctx_path else ["README.md", "models/metrics.json"]
    for p in candidates:
        if p and os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as f:
                    parts.append(f"--- {p} ---\n" + f.read()[:8000])
            except Exception:
                pass
    if not parts:
        parts.append("Nessun contesto file trovato. Progetto: modello RandomForest per prevedere Sales da TV/Radio/Newspaper.")
    _PROJECT_CONTEXT = "\n\n".join(parts)[:16000]
    return _PROJECT_CONTEXT

def ensure_llm_ready():
    if _openai_client is None:
        return False, "Libreria openai non disponibile (pip install openai)."
    if not os.getenv("OPENAI_API_KEY"):
        return False, "Variabile OPENAI_API_KEY non impostata."
    return True, None
# -----------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status":"ok"})

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    try:
        tv = float(data.get("TV", None))
        radio = float(data.get("Radio", None))
        newspaper = float(data.get("Newspaper", None))
    except Exception:
        return jsonify({"error":"Input non valido. Usa JSON con TV, Radio, Newspaper numerici."}), 400

    X = np.array([[tv, radio, newspaper]])
    pred = model.predict(X)[0]
    return jsonify({"prediction": float(pred)})

@app.route("/api/chat", methods=["POST"])
def chat():
    ok, err = ensure_llm_ready()
    if not ok:
        return jsonify({"error": err}), 500
    data = request.get_json(force=True) or {}
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Campo 'question' mancante"}), 400
    context = load_project_context()
    system_msg = (
        "Sei un assistente tecnico. Rispondi in italiano con riferimenti concisi al progetto "
        "di previsione vendite (ML RandomForest + Flask). Se la domanda è fuori ambito, chiedi di "
        "riformulare. Non inventare codice inesistente."
    )
    try:
        completion = _openai_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": f"Contesto:\n{context}\n\nDomanda:\n{question}"}
            ],
            temperature=0.2,
            max_tokens=500
        )
        answer = completion.choices[0].message.content.strip()
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": f"Errore LLM: {e}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
