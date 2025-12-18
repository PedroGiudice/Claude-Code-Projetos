# LEDES Converter Service

This service is responsible for converting `.docx` legal fee statements into LEDES-compliant format.

## API Endpoints

### `POST /convert/docx-to-ledes`

Converts an uploaded `.docx` file into a LEDES file.

**Request Body:**

`file`: (File) The `.docx` file to convert.

**Response:**

`200 OK`: Returns the converted LEDES content or a status of the conversion.

```json
{
  "filename": "example.docx",
  "status": "success",
  "ledes_content": "[LEDES content here]"
}
```

## Development

To run this service locally, navigate to the `legal-workbench/docker` directory and run:

```bash
docker-compose up --build ledes-converter
```

## Testing

Run tests using `pytest`:

```bash
pytest test_api.py
```
