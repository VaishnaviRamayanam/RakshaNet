from flask import Flask, request, jsonify
import joblib
import numpy as np
import tensorflow as tf

app = Flask(__name__)

try:
    feature_extractor = tf.keras.models.load_model("tf_feature_extractor.keras")
    rf_model = joblib.load("random_forest_model.pkl")
    label_encoder = joblib.load("label_encoder.pkl")
    print("✅ All models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    raise e

@app.route('/')
def home():
    return jsonify({"message": "FIR Severity API is running!", "status": "active"})

@app.route('/predict-severity', methods=['POST'])
def predict_severity():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data received'}), 400

    crime_text = data.get('firDetails', '')

    if not crime_text.strip():
        return jsonify({'error': 'FIR details are required'}), 400

    try:
        crime_text_tensor = tf.constant([crime_text])
        deep_features = feature_extractor.predict(crime_text_tensor, verbose=0)
        predicted_class_encoded = rf_model.predict(deep_features)[0]
        prediction_proba = rf_model.predict_proba(deep_features)[0]
        predicted_label = label_encoder.inverse_transform([predicted_class_encoded])[0]
        confidence_score = np.max(prediction_proba)

        response = {
            'severityClass': predicted_label,
            'confidence': round(float(confidence_score), 4)
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting FIR Severity API server...")
    app.run(debug=False, host='0.0.0.0', port=5000)