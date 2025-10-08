# api_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

MODEL_PATH = "models/best_model.pkl"
model = joblib.load(MODEL_PATH)

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
