# train_model.py
import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATA_PATHS = [
    "data/Advertising Budget and Sales.csv",
    "Advertising Budget and Sales.csv",
    "data/advertising.csv",
    "advertising.csv"
]

def load_csv():
    for p in DATA_PATHS:
        if os.path.exists(p):
            return pd.read_csv(p)
    # Optional: try Kaggle API if credentials present
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        os.makedirs("data", exist_ok=True)
        api.dataset_download_file('yasserh/advertising-sales-dataset',
                                  file_name='Advertising Budget and Sales.csv',
                                  path='data', force=False)
        # downloaded file should now exist at data/Advertising Budget and Sales.csv
        p = "data/Advertising Budget and Sales.csv"
        if os.path.exists(p):
            return pd.read_csv(p)
    except Exception:
        pass
    raise FileNotFoundError("CSV non trovato. Metti il file in ./data/Advertising Budget and Sales.csv o installa kaggle e configura le credenziali.")

df = load_csv()

# pulizia e rinomina colonne comuni
if "Unnamed: 0" in df.columns:
    df = df.drop(columns=["Unnamed: 0"])
df = df.rename(columns={
    "TV Ad Budget ($)": "TV",
    "Radio Ad Budget ($)": "Radio",
    "Newspaper Ad Budget ($)": "Newspaper",
    "Sales ($)": "Sales"
})

# assicurati che le colonne esistano
required = ["TV","Radio","Newspaper","Sales"]
if not all(col in df.columns for col in required):
    raise RuntimeError(f"Colonne mancanti. Trovate: {list(df.columns)}")

X = df[["TV","Radio","Newspaper"]]
y = df["Sales"]

X_train, X_test, y_train, y_test = train_test_split(X, y,
                                                    test_size=0.2,
                                                    random_state=42)

models = {
    "linear": LinearRegression(),
    "tree": DecisionTreeRegressor(random_state=42),
    "rf": RandomForestRegressor(n_estimators=200, random_state=42)
}

results = {}
os.makedirs("models", exist_ok=True)

for name, m in models.items():
    pipeline = Pipeline([("scaler", StandardScaler()), ("model", m)])
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    results[name] = {"MAE": mae, "MSE": mse, "R2": r2}
    joblib.dump(pipeline, f"models/{name}_pipeline.pkl")

# scegli il miglior modello per R2
best_name = max(results, key=lambda k: results[k]["R2"])
best_path = f"models/{best_name}_pipeline.pkl"
joblib.dump(joblib.load(best_path), "models/best_model.pkl")

# salva metriche
with open("models/metrics.json", "w") as f:
    json.dump({"results": results, "best": best_name}, f, indent=2)

print("Risultati:")
for n, m in results.items():
    print(f"{n}: R2={m['R2']:.4f}  MAE={m['MAE']:.4f}  MSE={m['MSE']:.4f}")
print("Miglior modello:", best_name)
print("Modello salvato in models/best_model.pkl")
