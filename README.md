# TenderEase Customer Portal

TenderEase ek simple customer-facing web portal hai jisme business owner sign up/login karke apne tenders, orders aur related document folders manage kar sakta hai.

## Current Scope
- Public landing page: customer ko clearly dikhega ki service kya karti hai.
- Login / Sign up: sign up par har customer ki unique ID banti hai.
- Customer dashboard: live tenders, upcoming tenders, total filed tenders, missed tenders, working tenders, orders aur nearest due days.
- Tender panel: manually tender add karna, PDF upload karke basic tender entry banana, due days calculate karna aur per-tender folder path create karna.
- Order panel: GeM reference, contract, BG, courier, collection aur CRAC details track karna.
- CSV export: Tender dashboard aur order dashboard Excel me open hone wali CSV file ke roop me download ho sakte hain.

## Removed for now
External government tender API integration abhi intentionally remove kar di gayi hai. Abhi flow point-to-point customer data entry aur management par focused hai.

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open: `http://localhost:8000`

## Data folders
Customer documents local `customer_data/` directory me save hote hain:

```text
customer_data/
  CUST-XXXXXXXX/
    tenders/<tender-number>/
    orders/<gem-reference>/
```

## Deployment note
Free hosting par true 24x7 always-on guarantee usually nahi hoti. Practical options:
1. Oracle Cloud Always Free VM - always-on ke sabse close.
2. Render / Railway / Fly.io - easy setup, lekin free plan me limits/sleeping ho sakta hai.
