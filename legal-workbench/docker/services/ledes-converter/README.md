# LEDES Converter Service

A production-ready FastAPI service for converting DOCX legal fee invoices to LEDES 1998B format.

## Features

- DOCX to LEDES 1998B format conversion
- Comprehensive security controls
- Rate limiting (10 requests/minute per IP)
- MIME type validation using magic bytes
- Input sanitization and validation
- Structured error handling
- Health check endpoint for orchestration

## API Endpoints

### `GET /health`

Health check endpoint for container orchestration.

**Response:**
```json
{
  "status": "ok",
  "service": "ledes-converter"
}
```

### `POST /convert/docx-to-ledes`

Converts an uploaded DOCX invoice file to LEDES 1998B format.

**Request:**
- `file`: (File) DOCX file containing invoice data (max 10MB)

**Success Response (200 OK):**
```json
{
  "filename": "invoice.docx",
  "status": "success",
  "extracted_data": {
    "invoice_date": "20251218",
    "invoice_number": "4432",
    "client_id": "SALESFORCE",
    "matter_id": "LITIGATION-BRAZIL",
    "invoice_total": 9900.0,
    "line_items": [
      {
        "description": "Legal service description",
        "amount": 1200.0
      }
    ]
  },
  "ledes_content": "INVOICE_DATE|INVOICE_NUMBER|...\n20251218|4432|..."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type, empty file, or malformed DOCX
- `413 Payload Too Large`: File exceeds 10MB limit
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Conversion failure

## Security Features

1. **CORS Protection**: Configurable allowed origins (not `*` in production)
2. **Rate Limiting**: 10 requests per minute per IP (in-memory, Redis recommended for production)
3. **MIME Validation**: Uses libmagic to verify actual file type (not just extension)
4. **Input Sanitization**: All extracted text is sanitized and length-limited
5. **File Size Limits**: 10MB maximum
6. **Secure Temp Files**: Restrictive permissions (0600) on temporary files
7. **Non-root Container**: Runs as user `appuser` (UID 1000)

## Architecture

```
api/
├── main.py        # FastAPI application and business logic
├── models.py      # Pydantic models for validation
requirements.txt   # Python dependencies
Dockerfile         # Multi-stage production build
entrypoint.sh      # Container startup script
```

### Key Design Decisions

- **Separation of Concerns**: Models separated from business logic
- **Validation at Boundaries**: Pydantic models validate all I/O
- **Fail-Fast**: Early validation prevents processing invalid data
- **Structured Logging**: Contextual logs for debugging and monitoring
- **Explicit Error Messages**: User-friendly error responses

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost,http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_SECONDS=60

# File Upload
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=INFO
```

## Development

### Local Development

```bash
cd legal-workbench/docker
docker-compose up --build ledes-converter
```

Access the service at `http://localhost:8003`

API documentation (Swagger UI): `http://localhost:8003/docs`

### Running Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest test_api.py -v

# Run with coverage
pytest test_api.py --cov=api --cov-report=term-missing
```

### Testing with curl

```bash
# Health check
curl http://localhost:8003/health

# Convert DOCX
curl -X POST http://localhost:8003/convert/docx-to-ledes \
  -F "file=@sample_invoice.docx" \
  -H "Content-Type: multipart/form-data"
```

## Production Deployment

### Recommendations

1. **Rate Limiting**: Replace in-memory storage with Redis for distributed rate limiting
2. **CORS**: Set `ALLOWED_ORIGINS` to specific domains (remove wildcards)
3. **Monitoring**: Integrate with Prometheus/Grafana for metrics
4. **Logging**: Ship logs to centralized logging (e.g., ELK stack)
5. **Secrets**: Use secret management (Vault, AWS Secrets Manager)
6. **File Storage**: Consider async file processing for large volumes

### Docker Production Build

```bash
docker build -t ledes-converter:latest .
docker run -p 8003:8003 \
  -e ALLOWED_ORIGINS="https://yourdomain.com" \
  ledes-converter:latest
```

## Troubleshooting

### Common Issues

**"Invalid file format" error**
- Ensure file is a valid DOCX (not renamed DOC)
- Check file is not corrupted
- Verify DOCX is not password-protected

**Rate limit errors**
- Wait 60 seconds between bursts
- For production, configure Redis-based rate limiting

**No line items found**
- Verify invoice format matches expected structure
- Check that amounts are prefixed with "US $"

### Logs

View container logs:
```bash
docker-compose logs -f ledes-converter
```

## LEDES 1998B Format

The service generates pipe-delimited LEDES 1998B format with the following fields:

```
INVOICE_DATE|INVOICE_NUMBER|CLIENT_ID|MATTER_ID|INVOICE_TOTAL|
BILLING_START_DATE|BILLING_END_DATE|INVOICE_DESCRIPTION|
LINE_ITEM_NUMBER|EXP/FEE/INV_ADJ_TYPE|LINE_ITEM_DATE|
LINE_ITEM_TASK_CODE|LINE_ITEM_EXPENSE_CODE|TIMEKEEPER_ID|
LINE_ITEM_DESCRIPTION|LINE_ITEM_UNITS|LINE_ITEM_RATE|
LINE_ITEM_ADJUSTMENT_AMOUNT|LINE_ITEM_TOTAL
```

## License

Internal use only - Legal Workbench project
