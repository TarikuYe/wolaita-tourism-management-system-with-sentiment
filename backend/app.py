import os
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS  # ⬅️ Add this import
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# -------------------------------
# 1️⃣ Flask setup with CORS
# -------------------------------
app = Flask(__name__)
CORS(app)  # ⬅️ Add this line to enable CORS for all routes

# -------------------------------
# 2️⃣ Model setup
# -------------------------------
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "models" / "trained_hybrid_model"

# Select device
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Using device: {DEVICE}")

# Load model and tokenizer
try:
    print(f"🔍 Loading model from: {MODEL_DIR.resolve()}")
    model_path = str(MODEL_DIR.resolve())
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model directory not found: {model_path}")
    
    print(f"📁 Model path: {model_path}")
    print(f"📁 Directory exists: {os.path.exists(model_path)}")
    
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(model_path, local_files_only=True)
    model.to(DEVICE)
    model.eval()
    print(f"✅ Hybrid model loaded successfully from {model_path}")
    
except Exception as e:
    print(f"❌ Error loading hybrid model: {e}")
    tokenizer = None
    model = None

# -------------------------------
# 3️⃣ Helper function for prediction
# -------------------------------
def predict_sentiment(text):
    """Predict sentiment for given text using the trained hybrid model."""
    if model is None or tokenizer is None:
        return {"error": "Model not loaded properly."}

    # Tokenize and prepare input
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True).to(DEVICE)

    # Get prediction
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        pred_class = torch.argmax(probs, dim=1).item()
        confidence = torch.max(probs).item()

    # Map class index to label
    id2label = model.config.id2label if hasattr(model.config, "id2label") else {0: "negative", 1: "neutral", 2: "positive"}
    label = id2label.get(pred_class, "unknown")

    return {"label": label, "score": round(confidence, 4)}

# -------------------------------
# 4️⃣ Routes
# -------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Hybrid Sentiment Analysis API is running 🚀",
        "usage": "POST text to /predict to get sentiment"
    })

@app.route("/predict", methods=["POST"])
def predict():
    """Accepts raw JSON input: { 'text': 'your sentence' }"""
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Please provide text in JSON format like {'text': 'your sentence'}"}), 400

    text = data["text"]
    result = predict_sentiment(text)
    return jsonify(result)

# -------------------------------
# 5️⃣ Run server
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)