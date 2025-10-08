# Advertising Budget and Sales

Web app per prevedere le performance degli studenti usando Random Forest.

## Installazione | USARE POWERSHERLL

```bash
python3 -m venv venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

```bash
pip install -r requirements.txt
python train_model.py
python api_server.py
python web_server.py
```

## Endpoint LLM (Chat sul progetto)

Imposta la chiave OpenAI (modello modificabile):
```powershell
$env:OPENAI_API_KEY="sk-..."
# oppure in Linux/macOS: export OPENAI_API_KEY=sk-...
```

```powershell
Remove-Item Env:OPENAI_API_KEY
```
Avvia normalmente `api_server.py`. Nuovo endpoint:
- POST http://localhost:5001/api/chat  JSON: {"question":"..."}  -> {"answer":"..."}

Variabili opzionali:
- PROJECT_CONTEXT_PATH: path a file extra di contesto (se non impostata usa README + models/metrics.json se presente).

Modello di default: gpt-4o-mini (puoi cambiarlo via OPENAI_MODEL).

```bash
http://localhost:5000/
```
