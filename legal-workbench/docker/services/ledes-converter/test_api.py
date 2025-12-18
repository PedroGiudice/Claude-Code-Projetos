import pytest
from fastapi.testclient import TestClient
from api.main import app
import os

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_convert_docx_to_ledes_success():
    # Path to the sample file
    sample_file = "tests/fixtures/sample.docx"
    
    if not os.path.exists(sample_file):
        pytest.skip(f"Sample file not found at {sample_file}")

    with open(sample_file, "rb") as f:
        response = client.post(
            "/convert/docx-to-ledes",
            files={
                "file": (
                    "sample.docx",
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "ledes_content" in data
    
    # Check extracted content validation
    extracted = data["extracted_data"]
    assert extracted["client_id"] == "SALESFORCE"
    assert extracted["invoice_number"] == "4432"
    # Format might vary depending on locale parsing, but let's check basic structure
    assert extracted["invoice_total"] == 9900.0
    assert len(extracted["line_items"]) > 0
    
    # Check first line item description
    first_item = extracted["line_items"][0]
    assert "Draft and file a Special Appeal" in first_item["description"]
    assert first_item["amount"] == 1200.0

    # Check LEDES content format (Pipe delimited)
    ledes_lines = data["ledes_content"].split('\n')
    assert len(ledes_lines) > 1
    assert "INVOICE_DATE|INVOICE_NUMBER" in ledes_lines[0] # Header check
    assert "SALESFORCE|LITIGATION-BRAZIL|9900.00" in ledes_lines[1] # Data check