# CAS Parser Technical Guide: Industrial Reliability Standards

This document serves as the permanent source of truth for the CAS (Consolidated Account Statement) parsing engine located in `app/api/portfolio/import-cas/route.js`. These standards have been implemented to ensure 100% data fidelity and professional-grade reliability.

---

## 1. Fund Name Extraction (AMC Whitelist)
To prevent administrative metadata (RIA codes, Distributor addresses, EUINs) from being misidentified as fund names, the parser uses a **Whitelist-First Validation** approach.

- **AMC Whitelist**: Only identify a potential string as a fund if it contains one of the recognized AMCs:  
  `SBI, HDFC, ICICI, DSP, NIPPON, QUANT, PARAG, BANDHAN, UTI, MOTILAL, KOTAK, AXIS, MIRAE, TATA, INVESCO, EDELWEISS, CANARA, BARODA, IDFC, FRANKLIN, HSBC, WHITE OAK, PGIM, PPFAS`.
- **Keyword Fallback**: If an AMC is not found, a string is only accepted if it contains multiple fund keywords:  
  `fund, growth, direct, plan, option, equity, debt, tax, saver, advantage, oppor, index, nifty, sensex, bluechip, cap, liquid, yield, fixed, income, balanced, hybrid`.

## 2. Negative Word Filtering (Noise Rejection)
Specific "Blocked" terms are used to immediately reject any line containing administrative data that often appears in multi-column PDF layouts:
- **Blocked Terms**: `RIA, Distributor, Code, EUIN, ARN, Nominee, Guardian, Holder, Status, Remarks, Address, PAN, Mobile, Email, Page, computer generated`.

## 3. Deterministic Fund IDs (Portfolio Merging)
To ensure the **Pie Chart** correctly groups funds and avoids an "Other" category explosion, IDs are generated deterministically based on **Normalized Name + Folio**:
- **Logic**: `UNMATCHED_${nameSlug}-${folioSuffix}`.
- **Why**: Excluding valuation from the ID allows different statements (with different prices) to merge perfectly into the same holding row.

## 4. Multi-Line Buffering
The parser maintains a rolling 2-line buffer to handle "Floating" fund names that appear *before* their transaction/data rows in MFCentral and SBI formats. 
- **Fragment Prevention**: Strings shorter than 8 characters or consisting only of `Growth, Direct, Plan` are excluded to prevent partial names.

## 5. Error Reporting Standards
The backend now returns specific error codes that the UI (`CasImportModal.js`) can display to the user:
- `INCORRECT_PASSWORD`: Specific catch for PAN/Password mismatches.
- `PDF_PARSER_ERROR`: Detailed logging for extraction failures.
- `PDF_EXTRACTION_EMPTY`: Triggered if the parser returns no text (often due to protected but unpassed PDFs).

---

## Maintenance Notes
When adding support for a new AMC:
1.  Verify if its name is in the `AMC_LIST`.
2.  If the fund name leaks into a following line (e.g. "Growth" on a new line), adjust the `multiLineBuffer` logic to join these fragments.
3.  Always check the `prefix` logic in `universalExtract` to see if AMC-specific transaction codes (e.g. `LD246G`) are being correctly stripped.
