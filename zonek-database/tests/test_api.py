from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from datetime import datetime

from api.main import app

client = TestClient(app)

@pytest.fixture
def mock_db():
    with patch("api.main.get_db_connection") as mock_conn_func:
        mock_conn = MagicMock()
        mock_conn_func.return_value.__enter__.return_value = mock_conn
        
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        
        yield mock_cur

def test_get_company_not_found(mock_db):
    mock_db.fetchone.return_value = None
    response = client.get("/companies/NOTFOUND")
    assert response.status_code == 404
    assert response.json()["detail"] == "Company not found"

def test_get_company_success(mock_db):
    mock_db.fetchone.return_value = {
        "cin": "U123",
        "company_name": "Test Co",
        "company_status": "Active",
        "company_class": None,
        "company_category": None,
        "incorporation_date": None,
        "roc": None,
        "state": None,
        "registered_address": None,
        "authorised_capital": None,
        "paid_up_capital": None,
        "nic_code": None,
        "created_at": datetime(2026, 1, 1),
        "updated_at": datetime(2026, 1, 1)
    }
    mock_db.fetchall.return_value = [
        {
            "cin": "U123",
            "field_name": "company_name",
            "field_value": "Test Co",
            "source": "mca_ogd",
            "confidence_score": 80,
            "last_verified_at": datetime(2026, 1, 1)
        }
    ]
    
    response = client.get("/companies/U123")
    assert response.status_code == 200
    data = response.json()
    assert data["cin"] == "U123"
    assert data["company_name"]["value"] == "Test Co"
    assert data["company_name"]["provenance"]["source"] == "mca_ogd"
    assert data["company_name"]["provenance"]["confidence_score"] == 80.0
    
    # Check that a field with no provenance handles it correctly
    assert data["company_status"]["value"] == "Active"
    assert data["company_status"]["provenance"] is None

def test_list_companies_empty(mock_db):
    mock_db.fetchall.return_value = []
    response = client.get("/companies")
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0

def test_list_companies_with_data(mock_db):
    # first fetchall is companies, second is provenance
    mock_db.fetchall.side_effect = [
        [
            {
                "cin": "U123",
                "company_name": "Test Co 1",
                "company_status": "Active",
                "company_class": None,
                "company_category": None,
                "incorporation_date": None,
                "roc": None,
                "state": "karnataka",
                "registered_address": None,
                "authorised_capital": None,
                "paid_up_capital": None,
                "nic_code": "68100",
                "created_at": datetime(2026, 1, 1),
                "updated_at": datetime(2026, 1, 1)
            }
        ],
        [
            {
                "cin": "U123",
                "field_name": "company_name",
                "field_value": "Test Co 1",
                "source": "mca_ogd",
                "confidence_score": 80,
                "last_verified_at": datetime(2026, 1, 1)
            }
        ]
    ]
    
    response = client.get("/companies?state=karnataka&status=active&nic_code=68100")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    
    # Check that query parameters were passed to the query
    executed_query = mock_db.execute.call_args_list[0][0][0]
    executed_params = mock_db.execute.call_args_list[0][0][1]
    
    assert "lower(state) = %s" in executed_query
    assert "lower(company_status) = %s" in executed_query
    assert "nic_code = %s" in executed_query
    
    assert "karnataka" in executed_params
    assert "active" in executed_params
    assert "68100" in executed_params
