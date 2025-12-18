import pytest
from fastapi.testclient import TestClient
from api.main import app
import os
import io

client = TestClient(app)


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ledes-converter"


def test_invalid_file_extension():
    """Test rejection of non-DOCX files."""
    response = client.post(
        "/convert/docx-to-ledes",
        files={"file": ("test.pdf", b"fake content", "application/pdf")}
    )
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


def test_empty_file():
    """Test rejection of empty files."""
    response = client.post(
        "/convert/docx-to-ledes",
        files={"file": ("test.docx", b"", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 400
    assert "Empty file" in response.json()["detail"]


def test_file_too_large():
    """Test rejection of files exceeding size limit."""
    # Create a file larger than 10MB
    large_content = b"x" * (11 * 1024 * 1024)
    response = client.post(
        "/convert/docx-to-ledes",
        files={"file": ("large.docx", large_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 413
    assert "too large" in response.json()["detail"]

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