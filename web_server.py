# web_server.py
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static")

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
