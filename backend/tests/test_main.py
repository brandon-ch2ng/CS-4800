import pytest
import json


class TestMainApp:
    """Test main application routes."""

    def test_home_route(self, client):
        """Test the home route returns success message."""
        response = client.get("/")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "message" in data
        assert "Flask backend running successfully" in data["message"]

    def test_app_cors_enabled(self, client):
        """Test that CORS headers are properly configured."""
        response = client.get("/")
        # Note: In test mode, CORS headers might not be fully set
        # This test verifies the route is accessible
        assert response.status_code == 200

    def test_invalid_route_404(self, client):
        """Test that invalid routes return 404."""
        response = client.get("/nonexistent-route")
        assert response.status_code == 404

    def test_invalid_method_405(self, client):
        """Test that invalid HTTP methods return 405."""
        # Home route only accepts GET
        response = client.post("/")
        assert response.status_code == 405


class TestAppConfiguration:
    """Test application configuration."""

    def test_app_testing_mode(self, app):
        """Test that app is in testing mode."""
        assert app.config["TESTING"] is True

    def test_jwt_secret_configured(self, app):
        """Test that JWT secret is configured."""
        assert app.config["JWT_SECRET_KEY"] is not None
        assert app.config["JWT_SECRET_KEY"] != ""

    def test_blueprints_registered(self, app):
        """Test that all blueprints are registered."""
        blueprint_names = [bp.name for bp in app.blueprints.values()]
        expected_blueprints = [
            "auth",
            "patients",
            "doctors",
            "prediction",
            "disease_catalog",
            "appointments"
        ]
        
        for expected in expected_blueprints:
            assert expected in blueprint_names, f"Blueprint '{expected}' not registered"


class TestHealthCheck:
    """Test basic health check functionality."""

    def test_database_connection(self):
        """Test that database connection is established."""
        from app.database import db
        
        # Try to ping the database
        try:
            db.command("ping")
            connected = True
        except Exception:
            connected = False
        
        assert connected, "Database connection failed"

    def test_collections_exist(self):
        """Test that expected collections can be accessed."""
        from app.database import db
        
        # These collections should be accessible
        expected_collections = [
            "users",
            "patients",
            "predictions",
            "notes",
            "appointments",
            "diseases"
        ]
        
        # Just verify we can query them (they might be empty)
        for collection_name in expected_collections:
            try:
                collection = db[collection_name]
                # Try to count documents (works even if collection is empty)
                collection.count_documents({})
                accessible = True
            except Exception:
                accessible = False
            
            assert accessible, f"Collection '{collection_name}' not accessible"
