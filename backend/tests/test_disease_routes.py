import pytest
import json
from app.database import db


@pytest.fixture(autouse=True)
def seed_test_diseases():
    """Seed test diseases before each test and clean up after."""
    test_diseases = [
        {
            "code": "HTN",
            "name": "Hypertension",
            "description": "Chronically elevated blood pressure.",
            "symptoms": ["Headache", "Dizziness", "Often asymptomatic"],
            "risk_factors": ["Obesity", "Smoking", "Family history"],
            "treatments": ["Lifestyle modification", "ACE inhibitors"],
            "tags": ["cardio", "bp"]
        },
        {
            "code": "DM2",
            "name": "Type 2 Diabetes Mellitus",
            "description": "Insulin resistance with hyperglycemia.",
            "symptoms": ["Polyuria", "Polydipsia", "Blurred vision"],
            "risk_factors": ["Obesity", "Sedentary lifestyle", "Age"],
            "treatments": ["Diet", "Exercise", "Metformin"],
            "tags": ["endocrine", "glucose"]
        },
        {
            "code": "ASTH",
            "name": "Asthma",
            "description": "Chronic airway inflammation.",
            "symptoms": ["Wheezing", "Cough", "Shortness of breath"],
            "risk_factors": ["Allergens", "Family history", "Smoking"],
            "treatments": ["Inhaled corticosteroids", "SABAs"],
            "tags": ["respiratory"]
        },
        {
            "code": "COPD",
            "name": "Chronic Obstructive Pulmonary Disease",
            "description": "Progressive lung disease.",
            "symptoms": ["Chronic cough", "Dyspnea", "Wheezing"],
            "risk_factors": ["Smoking", "Air pollution", "Occupational exposure"],
            "treatments": ["Bronchodilators", "Steroids", "Oxygen therapy"],
            "tags": ["respiratory", "chronic"]
        }
    ]
    
    # Clean existing test diseases
    db.diseases.delete_many({"code": {"$in": ["HTN", "DM2", "ASTH", "COPD"]}})
    
    # Insert test diseases
    db.diseases.insert_many(test_diseases)
    
    yield
    
    # Cleanup
    db.diseases.delete_many({"code": {"$in": ["HTN", "DM2", "ASTH", "COPD"]}})


class TestListDiseases:
    """Test disease catalog listing endpoint."""

    def test_list_all_diseases(self, client):
        """Test listing all diseases without filters."""
        response = client.get("/catalog/")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "items" in data
        assert len(data["items"]) >= 4
        assert "total" in data
        assert data["total"] >= 4

    def test_list_diseases_with_search_query(self, client):
        """Test searching diseases by name."""
        response = client.get("/catalog/?q=diabetes")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) >= 1
        assert any("Diabetes" in item["name"] for item in data["items"])

    def test_list_diseases_search_by_code(self, client):
        """Test searching diseases by code."""
        response = client.get("/catalog/?q=HTN")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) >= 1
        assert any(item["code"] == "HTN" for item in data["items"])

    def test_list_diseases_search_by_tag(self, client):
        """Test searching diseases by tag."""
        response = client.get("/catalog/?q=respiratory")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) >= 2  # ASTH and COPD
        assert all(
            "respiratory" in item.get("tags", []) 
            for item in data["items"]
        )

    def test_list_diseases_case_insensitive_search(self, client):
        """Test that search is case-insensitive."""
        response = client.get("/catalog/?q=ASTHMA")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) >= 1

    def test_list_diseases_no_results(self, client):
        """Test search with no matching results."""
        response = client.get("/catalog/?q=nonexistentdisease12345")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) == 0
        assert data["total"] == 0

    def test_list_diseases_pagination(self, client):
        """Test pagination parameters."""
        response = client.get("/catalog/?page=1&limit=2")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) <= 2
        assert data["page"] == 1
        assert data["limit"] == 2

    def test_list_diseases_pagination_page_2(self, client):
        """Test getting second page of results."""
        response = client.get("/catalog/?page=2&limit=2")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["page"] == 2
        assert data["limit"] == 2

    def test_list_diseases_limit_capped_at_100(self, client):
        """Test that limit is capped at 100."""
        response = client.get("/catalog/?limit=200")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["limit"] == 100

    def test_list_diseases_sorted_by_name(self, client):
        """Test that results are sorted by name."""
        response = client.get("/catalog/")
        assert response.status_code == 200
        data = json.loads(response.data)
        
        names = [item["name"] for item in data["items"]]
        assert names == sorted(names)

    def test_list_diseases_response_structure(self, client):
        """Test that response has correct structure."""
        response = client.get("/catalog/")
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert "items" in data
        assert "page" in data
        assert "limit" in data
        assert "total" in data
        
        if len(data["items"]) > 0:
            item = data["items"][0]
            assert "code" in item
            assert "name" in item
            assert "description" in item
            assert "symptoms" in item
            assert "risk_factors" in item
            assert "treatments" in item
            assert "tags" in item
            assert "_id" not in item  # Should be excluded


class TestGetDisease:
    """Test getting individual disease details."""

    def test_get_disease_success(self, client):
        """Test getting a disease by code."""
        response = client.get("/catalog/HTN")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["code"] == "HTN"
        assert data["name"] == "Hypertension"
        assert "description" in data
        assert "symptoms" in data
        assert "risk_factors" in data
        assert "treatments" in data
        assert "_id" not in data

    def test_get_disease_not_found(self, client):
        """Test getting a non-existent disease."""
        response = client.get("/catalog/NOTEXIST")
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "Not found" in data["error"]

    def test_get_disease_response_structure(self, client):
        """Test that disease detail response has all fields."""
        response = client.get("/catalog/DM2")
        assert response.status_code == 200
        data = json.loads(response.data)
        
        required_fields = [
            "code", "name", "description", "symptoms",
            "risk_factors", "treatments", "tags"
        ]
        for field in required_fields:
            assert field in data

    def test_get_all_seeded_diseases(self, client):
        """Test that all seeded diseases can be retrieved."""
        codes = ["HTN", "DM2", "ASTH", "COPD"]
        
        for code in codes:
            response = client.get(f"/catalog/{code}")
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data["code"] == code


class TestDiseaseCatalogNoAuth:
    """Test that disease catalog endpoints don't require authentication."""

    def test_list_diseases_no_auth(self, client):
        """Test that listing diseases doesn't require authentication."""
        response = client.get("/catalog/")
        assert response.status_code == 200

    def test_get_disease_no_auth(self, client):
        """Test that getting disease details doesn't require authentication."""
        response = client.get("/catalog/HTN")
        assert response.status_code == 200
