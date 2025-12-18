You are the Backend Architect. Your task is to rigorously review and enhance the implementation of the LEDES 1998B format generation in the `ledes-converter` service.

**Target File:** `legal-workbench/docker/services/ledes-converter/api/main.py`

**Objectives:**
1.  **Verify LEDES 1998B Compliance:** Ensure the generated output strictly adheres to the LEDES 1998B specification (pipe-delimited, correct column order, correct data formats for dates and numbers).
2.  **Validate Data Mapping:** Check if the extracted data from the DOCX (handled by `extract_ledes_data`) is correctly mapped to the LEDES columns.
3.  **Refine Logic:** If there are any flaws or potential edge cases in the current regex-based extraction or the string formatting, fix them.
4.  **Update Code:** Modify `legal-workbench/docker/services/ledes-converter/api/main.py` directly with the improved logic.

**Context:**
The current implementation is a basic prototype using regex to parse a specific DOCX template. The goal is to make the *generation* part robust and compliant.

Please analyze the code and rewrite the `generate_ledes_1998b` function (and `extract_ledes_data` if needed) to ensure 100% correctness for the LEDES 1998B standard.
