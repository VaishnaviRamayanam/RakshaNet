import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import tensorflow as tf
import joblib

df = pd.read_csv("crime_data_large.csv")

label_encoder = LabelEncoder()
df['severity_label_encoded'] = label_encoder.fit_transform(df['severity_label'])
joblib.dump(label_encoder, "label_encoder.pkl")

X = df['crime_description'].astype(str).values
y = df['severity_label_encoded'].values
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

VOCAB_SIZE = 10000
SEQUENCE_LENGTH = 100

vectorize_layer = tf.keras.layers.TextVectorization(
    max_tokens=VOCAB_SIZE,
    output_mode='int',
    output_sequence_length=SEQUENCE_LENGTH
)
vectorize_layer.adapt(X_train)

feature_extractor = tf.keras.Sequential([
    vectorize_layer,
    tf.keras.layers.Embedding(VOCAB_SIZE, 128, mask_zero=True),
    tf.keras.layers.GlobalAveragePooling1D(),
    tf.keras.layers.Dense(64, activation='relu'),
], name="feature_extractor")

X_train_tensor = tf.constant(X_train)
X_test_tensor = tf.constant(X_test)

X_train_dl_features = feature_extractor.predict(X_train_tensor, verbose=0)
X_test_dl_features = feature_extractor.predict(X_test_tensor, verbose=0)

rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train_dl_features, y_train)

y_pred = rf_model.predict(X_test_dl_features)
accuracy = accuracy_score(y_test, y_pred)

joblib.dump(rf_model, "random_forest_model.pkl")
feature_extractor.save("tf_feature_extractor.keras")

print(f"Model trained with accuracy: {accuracy:.4f}")