import os
from joblib import load

model_path = os.path.join(
    os.path.dirname(__file__),
    "app", "ml_model", "catboost_model.pkl"
)

if os.path.exists(model_path):
    model = load(model_path)
    print(f"✓ Model loaded")
    print(f"Feature names: {model.feature_names_}")
    print(f"Feature count: {len(model.feature_names_)}")
    print(f"\nClasses: {model.classes_}")
    print(f"Class count: {len(model.classes_)}")
else:
    print(f"Model not found at {model_path}")