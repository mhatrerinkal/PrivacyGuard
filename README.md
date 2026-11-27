# PrivacyGuard – Client-Side PII Detection & Data Sanitization Platform

**Tagline:** *Detect. Protect. Sanitize.*  
**Description:** Intelligent 100% client-side PII detection and data sanitization inside your browser.

---

## Privacy Guarantees

- **100% Client-Side Processing:** All text parsing, regular expression scanning, Luhn validation, redaction, and file exports execute strictly in browser memory.
- **Zero Network Transmission:** No pasted text, uploaded `.txt`/`.csv` files, or audit summaries are ever transmitted to external APIs, LLMs, or backend servers.
- **Zero Persistent Storage:** Sensitive input and original-to-pseudonym mappings are never written to `localStorage`, `sessionStorage`, cookies, or external databases.
- **Privacy-Safe Telemetry & Exports:** Sanitized exports, the Activity Log, and Audit Reports never contain raw sensitive values or original-to-pseudonym lookup tables.

---

## Architecture & Project Structure

```text
src/
├── types/
│   └── pii.ts                        # Domain types for entities, scans, audit, and logs
├── utils/
│   ├── luhn.ts                       # Custom Mod-10 Luhn checksum implementation
│   ├── validators.ts                 # IPv4 octet, PAN, Aadhaar-style, email & phone validators
│   ├── csvHandler.ts                 # Safe RFC-4180 CSV parser, malformed quote recovery & escaper
│   └── fileExport.ts                 # Browser Blob API downloader with URL.revokeObjectURL()
├── engine/
│   ├── categories.ts                 # Color coding, labels, and pseudonym prefixes
│   ├── detector.ts                   # Modular detection engine with exact offsets & overlap resolution
│   ├── redactor.ts                   # Full Mask, Partial Mask, and Consistent Pseudonymization
│   └── sampleData.ts                 # Sample noisy text and sample CSV test payloads
├── components/
│   ├── Header.tsx                    # Branding, nav, Local Processing Active badge, theme toggle
│   ├── HeroSection.tsx               # Hero headline, privacy indicator, SVG shield illustration
│   ├── InputSection.tsx              # Text editor, drag-and-drop .txt/.csv upload, metrics, Scan button
│   ├── HighlightedText.tsx           # Inline category-colored highlighting
│   ├── EntityClassificationPanel.tsx # Category count cards + total entity counter
│   ├── RedactionControls.tsx         # 3 redaction strategies + Authorized Local Mapping Preview
│   ├── SideBySideDiff.tsx            # Synchronized dual-panel diff view, Copy & Download controls
│   ├── AuditDashboard.tsx            # Live analytics cards, status indicator, Audit Summary & JSON export
│   ├── ActivityLogPanel.tsx          # Chronological in-memory Activity Log + Prompt & System Rules Log
│   └── HowItWorksSection.tsx         # 3-step overview and privacy assurance banner
└── __tests__/
    └── piiEngine.test.ts             # Automated Vitest suite covering all acceptance criteria
```

---

## Detection & Validation Logic

| Category | Highlight Color | Pattern & Validation Rules |
| :--- | :--- | :--- |
| **Email Addresses** | Blue | RFC-style `local@domain.tld` regex excluding trailing punctuation (`.,;!?`) |
| **Phone Numbers** | Green | Indian (`+91`, 10-digit `[6-9]xxxxxxxxx`) & international (`+1`, E.164); 10–15 digits; rejects repeating/short sequences |
| **IPv4 Addresses** | Purple | 4 dotted octets validated strictly in `0–255` without invalid leading zeros (rejects `999.999.999.999`) |
| **Indian PAN** | Orange | Standard 10-character structure: 5 letters + 4 digits + 1 letter (e.g., `ABCDE1234F`) |
| **Aadhaar-Style** | Red | 12-digit format (space/hyphen/contiguous); rejects dummy/0-prefixed patterns; avoids partial matches inside 16-digit numbers |
| **Credit Cards** | Pink | 13–19 digits (raw, spaced, hyphenated) validated with custom **Luhn (Mod-10)** checksum; rejects random 16-digit numbers like `1234567890123456` |

### Overlap Prevention & Offset Safety
All candidate spans are sorted by start index, span length, and deterministic category priority (`Credit Card > Aadhaar > Email > PAN > IPv4 > Phone`). Overlapping matches are discarded, and replacements are applied **right-to-left** so original text formatting, indentation, and line breaks are never corrupted.

---

## Redaction Modes

1. **Mode 1 — Full Mask:** Replaces every detected entity with `[REDACTED]`.
2. **Mode 2 — Partial Mask:** Preserves verification context (e.g., `j***@gmail.com`, `XXXXXX3210`, `XXXXX1234F`, `XXXX XXXX 0123`, `XXXX XXXX XXXX 0366`).
3. **Mode 3 — Consistent Pseudonymization:** Maps recurring identical values to consistent per-category placeholders (`USER_01`, `PHONE_01`, `IP_01`, `PAN_01`, `AADHAAR_01`, `CARD_01`). Mappings reset whenever the document is cleared or reset, and are never included in exported files.

---

## Local Setup & Running

### Prerequisites
- Node.js 18+ and npm

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Automated Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```
