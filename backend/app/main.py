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
    CORS(app)
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
    app.run(debug=True)
