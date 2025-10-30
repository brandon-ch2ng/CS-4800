from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.routes.auth_routes import auth_bp
from app.routes.patient_routes import patient_bp
from app.routes.doctor_routes import doctor_bp
from app.routes.prediction_routes import prediction_bp
from app.database import init_indexes
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET")
    CORS(
        app,
        resources={r"/*": {"origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]}},
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type"],
        supports_credentials=False,  # True only if use cookies
        max_age=3600,
    )

    JWTManager(app)

    # Register Blueprints (route groups)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(patient_bp, url_prefix="/patients")
    app.register_blueprint(doctor_bp, url_prefix="/doctors")
    app.register_blueprint(prediction_bp, url_prefix="/api")

    # Create MongoDB indexes on startup
    init_indexes()

    @app.route("/")
    def home():
        return {"message": "Flask backend running successfully"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0") #Binding to 0.0.0.0 exposes the server to the host network so the browser (and Vite proxy) can reach it.

