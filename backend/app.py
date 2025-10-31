
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import traceback

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing

# ============== Load Model and Vectorizer ===================
# Get the absolute path to the current directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "sentiment_model_balanced.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "models", "tfidf_vectorizer_balanced.pkl")

try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("Model and vectorizer loaded successfully!")
except Exception as e:
    print(f"Error loading model or vectorizer: {e}")
    traceback.print_exc()
    model = None
    vectorizer = None
# ==============================================================

# in backend/app.py
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    if not model or not vectorizer:
        return jsonify({"error": "Model not loaded. Check server logs."}), 500

    try:
        data = request.get_json()
        text_to_analyze = data.get("text")

        if not text_to_analyze:
            return jsonify({"error": "No text provided."}), 400

        # Perform the sentiment analysis
        processed_text = vectorizer.transform([text_to_analyze])
        prediction = model.predict(processed_text)
        probability = model.predict_proba(processed_text).max()

        # The prediction is the sentiment
        sentiment = prediction[0]

        return jsonify({"sentiment": sentiment, "confidence": probability})

    except Exception as e:
        print(f"Error processing request: {e}")
        traceback.print_exc()
        return jsonify({"error": "Could not process the request."}), 500

if __name__ == '__main__':
    # Use 0.0.0.0 to make the app accessible on your network
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
