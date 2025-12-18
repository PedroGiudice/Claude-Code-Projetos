from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import Annotated
import docx
import re
import os
import tempfile
from datetime import datetime

app = FastAPI()

def parse_currency(value_str):
    if not value_str:
        return 0.0
    # Remove 'US $', '$', ',', ' ' and other non-numeric chars except '.'
    clean_val = re.sub(r'[^\d.]', '', value_str)
    try:
        return float(clean_val)
    except ValueError:
        return 0.0

def format_date_ledes(date_str):
    try:
        # Assuming format "Month DD, YYYY" e.g., "December 15, 2025"
        dt = datetime.strptime(date_str, "%B %d, %Y")
        return dt.strftime("%Y%m%d")
    except ValueError:
        return ""

def extract_ledes_data(text):
    data = {
        "invoice_date": "",
        "invoice_number": "",
        "client_id": "SALESFORCE", # Placeholder based on template analysis
        "matter_id": "LITIGATION-BRAZIL", # Placeholder
        "invoice_total": 0.0,
        "line_items": []
    }
    
    # Regex patterns
    date_pattern = re.compile(r"Date\s*of\s*Issuance:\s*(.*)")
    invoice_num_pattern = re.compile(r"Invoice\s*#\s*(\d+)")
    total_pattern = re.compile(r"Total\s*Gross\s*Amount:\s*US\s*\$([\d,]+\.\d{2})")
    
    # Line items are tricky. Based on the template, they seem to be text followed by a price US $...
    # We will look for lines that end with a price pattern.
    line_item_pattern = re.compile(r"(.*?)\s*US\s*\$([\d,]+)(?:\s|$)")

    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Extract Header Info
        date_match = date_pattern.search(line)
        if date_match:
            data["invoice_date"] = format_date_ledes(date_match.group(1).strip())
            
        inv_num_match = invoice_num_pattern.search(line)
        if inv_num_match:
            data["invoice_number"] = inv_num_match.group(1).strip()
            
        total_match = total_pattern.search(line)
        if total_match:
            data["invoice_total"] = parse_currency(total_match.group(1))

        # Extract Line Items
        # This is a heuristic: if a line ends with a currency amount and isn't the total line
        if "Total Gross Amount" not in line:
            item_match = line_item_pattern.search(line)
            if item_match:
                desc = item_match.group(1).strip()
                amount = parse_currency(item_match.group(2))
                
                # Filter out likely false positives (e.g. headers)
                if desc and amount > 0:
                    data["line_items"].append({
                        "description": desc,
                        "amount": amount
                    })

    return data

def generate_ledes_1998b(data):
    # LEDES 1998B Header
    header = (
        "INVOICE_DATE|INVOICE_NUMBER|CLIENT_ID|MATTER_ID|INVOICE_TOTAL|"
        "BILLING_START_DATE|BILLING_END_DATE|INVOICE_DESCRIPTION|"
        "LINE_ITEM_NUMBER|EXP/FEE/INV_ADJ_TYPE|LINE_ITEM_DATE|"
        "LINE_ITEM_TASK_CODE|LINE_ITEM_EXPENSE_CODE|TIMEKEEPER_ID|"
        "LINE_ITEM_DESCRIPTION|LINE_ITEM_UNITS|LINE_ITEM_RATE|"
        "LINE_ITEM_ADJUSTMENT_AMOUNT|LINE_ITEM_TOTAL"
    )
    
    lines = [header]
    
    for i, item in enumerate(data["line_items"], 1):
        row = [
            data["invoice_date"],           # 1
            data["invoice_number"],         # 2
            data["client_id"],              # 3
            data["matter_id"],              # 4
            f"{data['invoice_total']:.2f}", # 5
            "",                             # 6
            "",                             # 7
            "Legal Services",               # 8
            str(i),                         # 9
            "F",                            # 10
            "",                             # 11
            "",                             # 12
            "",                             # 13
            "",                             # 14
            item["description"],            # 15
            "",                             # 16
            "",                             # 17
            "",                             # 18
            f"{item['amount']:.2f}"         # 19
        ]
        
        lines.append("|".join(row))
        
    return "\n".join(lines)


@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/convert/docx-to-ledes")
async def convert_docx_to_ledes(file: Annotated[UploadFile, File(description="DOCX file to convert to LEDES")]):
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .docx file.")
    
    tmp_path = ""
    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Process DOCX
        doc = docx.Document(tmp_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        
        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    full_text.append(cell.text)
                    
        text_content = "\n".join(full_text)
        
        # Extract Data
        extracted_data = extract_ledes_data(text_content)
        
        # Generate LEDES
        ledes_content = generate_ledes_1998b(extracted_data)
        
        return {
            "filename": file.filename,
            "status": "success",
            "extracted_data": extracted_data, # Useful for debugging/preview
            "ledes_content": ledes_content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)