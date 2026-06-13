# Tender Intelligence Portal

Ye project government tender discovery + selected bid management ke liye banaya gaya hai.

## Features
- Keyword-based tender search (`/api/tenders`)
- External API integration support (`TENDER_API_URL`, `TENDER_API_KEY`)
- Excel export of tender results (`/api/tenders/export`)
- Selected bid tracker with stage updates (`/api/bids`, `/api/bids/{id}/stage`)
- Selected bid ka full track record/history (`/api/bids/{id}/history`)
- Bid tracker Excel export (`/api/export/bids`)
- Complete bid history database (`bid_history` table)

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open: `http://localhost:8000`

## Free deployment (always-on guidance)
True 24x7 "always on" free tier par generally possible nahi hota. Free plans usually sleep karte hain.
Best options:
1. **Railway** or **Render** free trial/credits -> easy deploy, but inactivity sleep ho sakta hai.
2. **Fly.io** free allowance (region/usage dependent), better uptime but strict limits.
3. **Oracle Cloud Always Free VM** (technical setup thoda advanced) -> yeh sabse close hai always-on free hosting ke liye.

### Render quick deploy
1. GitHub repo push karo.
2. Render Web Service create karo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Env vars set karo: `TENDER_API_URL`, `TENDER_API_KEY` (optional)

## API integration notes
- Agar official tender API available ho to uska URL `TENDER_API_URL` me do.
- Service GET response ko normalized tender schema me map karti hai.
- API unavailable hone par app sample data fallback use karti hai.
