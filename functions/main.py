import firebase_admin
from firebase_admin import credentials
from firebase_functions import https_fn
import joblib
import os

# Initialize Firebase Admin SDK
cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)

# Load the model and vectorizer
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models/sentiment_model_balanced.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "models/tfidf_vectorizer_balanced.pkl")

# Load the model and vectorizer at startup
try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("Model and vectorizer loaded successfully!")
except Exception as e:
    print(f"Error loading model or vectorizer: {e}")
    # Set to None to handle errors gracefully
    model = None
    vectorizer = None

@https_fn.on_request()
def analyze_sentiment(req: https_fn.Request) -> https_fn.Response:
    """
    Analyzes the sentiment of a given text using a pre-trained model.
    Expects a JSON request body with a "text" field.
    """
    try:
        # Check if model and vectorizer are loaded
        if model is None or vectorizer is None:
            return https_fn.Response(
                "Error: Sentiment analysis model not available.", 
                status=503
            )

        # Get the text from the request
        data = req.get_json()
        
        # Handle cases where no JSON data is provided
        if data is None:
            return https_fn.Response(
                "Error: No JSON data provided. Please send a JSON object with a 'text' field.", 
                status=400
            )
        
        text_to_analyze = data.get("text")

        if not text_to_analyze:
            return https_fn.Response(
                "Error: No text provided. Please include a 'text' field in your JSON.", 
                status=400
            )

        # Transform the text using the loaded vectorizer
        text_vectorized = vectorizer.transform([text_to_analyze])
        
        # Make prediction
        prediction = model.predict(text_vectorized)
        
        # Get prediction probabilities (if available)
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(text_vectorized)
            confidence = probabilities.max()  # Get the highest probability
        else:
            # For models without predict_proba, use a default confidence
            confidence = 1.0
        
        # Convert prediction to string (assuming your model returns 0/1 or positive/negative)
        sentiment = str(prediction[0])
        
        # If your model uses numerical labels, you might want to map them
        # Uncomment and modify the following lines if your model uses 0/1 for negative/positive:
        # if sentiment == "0":
        #     sentiment = "negative"
        # elif sentiment == "1":
        #     sentiment = "positive"

        # Return the sentiment and confidence
        return https_fn.Response(
            f'{{"sentiment": "{sentiment}", "confidence": {confidence}}}',
            status=200,
            mimetype="application/json"
        )

    except Exception as e:
        print(f"Error processing request: {e}")
        return https_fn.Response(
            f"Error: Could not process the request. {str(e)}", 
            status=500
        )