from pydantic import BaseModel

class ConversionStatus(BaseModel):
    filename: str
    status: str
    message: str | None = None
    ledes_content: str | None = None

class LedesData(BaseModel):
    invoice_date: str
    invoice_number: str
    client_id: str
    matter_id: str
    invoice_total: float
    line_items: list[dict]
