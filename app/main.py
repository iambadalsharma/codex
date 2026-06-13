from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Bid, BidHistory
from .schemas import BidCreate, BidHistoryOut, BidOut, BidUpdateStage
from .tender_service import TenderProvider

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tender Tracker")
provider = TenderProvider()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/tenders")
def search_tenders(keywords: str = Query(default="")):
    items = provider.search(keywords.split(","))
    return [item.model_dump() for item in items]


@app.get("/api/tenders/export")
def export_tenders(keywords: str = Query(default="")):
    items = provider.search(keywords.split(","))
    frame = pd.DataFrame([item.model_dump() for item in items])

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        frame.to_excel(writer, index=False, sheet_name="Tenders")
    output.seek(0)

    headers = {"Content-Disposition": "attachment; filename=tenders.xlsx"}
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@app.post("/api/bids", response_model=BidOut)
def create_bid(payload: BidCreate, db: Session = Depends(get_db)):
    bid = Bid(**payload.model_dump())
    db.add(bid)
    db.flush()

    history = BidHistory(bid_id=bid.id, stage=bid.stage, comment="Bid created")
    db.add(history)
    db.commit()
    db.refresh(bid)
    return bid


@app.get("/api/bids", response_model=list[BidOut])
def list_bids(db: Session = Depends(get_db)):
    return db.query(Bid).order_by(Bid.updated_at.desc()).all()


@app.get("/api/bids/{bid_id}/history", response_model=list[BidHistoryOut])
def bid_history(bid_id: int, db: Session = Depends(get_db)):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    return (
        db.query(BidHistory)
        .filter(BidHistory.bid_id == bid_id)
        .order_by(BidHistory.changed_at.desc())
        .all()
    )


@app.patch("/api/bids/{bid_id}/stage", response_model=BidOut)
def update_stage(bid_id: int, payload: BidUpdateStage, db: Session = Depends(get_db)):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    bid.stage = payload.stage
    if payload.comment:
        bid.notes = payload.comment
    db.add(BidHistory(bid_id=bid.id, stage=payload.stage, comment=payload.comment))
    db.commit()
    db.refresh(bid)
    return bid


@app.get("/api/export/bids")
def export_bids(db: Session = Depends(get_db)):
    bids = db.query(Bid).all()
    rows = [
        {
            "id": b.id,
            "tender_id": b.tender_id,
            "title": b.title,
            "department": b.department,
            "value": b.value,
            "due_date": b.due_date,
            "stage": b.stage,
            "notes": b.notes,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
        }
        for b in bids
    ]

    frame = pd.DataFrame(rows)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        frame.to_excel(writer, index=False, sheet_name="Bid_Tracker")
    output.seek(0)

    headers = {"Content-Disposition": "attachment; filename=bid-tracker.xlsx"}
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@app.get("/")
def index():
    return FileResponse(Path("app/static/index.html"))


app.mount("/static", StaticFiles(directory="app/static"), name="static")
