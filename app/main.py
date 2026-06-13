import csv
import re
import uuid
from datetime import date, datetime
from io import StringIO
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Customer, Order, Tender
from .schemas import CustomerLogin, CustomerOut, CustomerSignup, OrderCreate, OrderOut, TenderCreate, TenderOut

Base.metadata.create_all(bind=engine)

DATA_ROOT = Path("customer_data")
app = FastAPI(title="TenderEase Customer Portal")

TENDER_COLUMNS = [
    "serial_no", "remarks", "published_date", "submission_end_date", "pre_bid_date",
    "pre_bid_location", "to_be_applied", "not_applying_reason", "applied", "due_days",
    "tender_number", "tender_title", "consignee", "organisation", "location", "emd_value",
    "ra", "tender_value", "quoted_value", "result", "winning_value", "tender_link",
    "current_status", "folder_path",
]

ORDER_COLUMNS = [
    "serial_no", "gem_tender_reference", "tech_specs_reference", "category", "contract_no",
    "contract_link", "contract_date", "organisation", "location", "work", "total_order_value",
    "order_status", "bg_value", "bg_number", "bg_link", "bg_issue_date", "bg_timeline",
    "bg_status", "collected_or_not", "couriered", "crac_link", "folder_path",
]


def _customer_folder(customer_uid: str) -> Path:
    folder = DATA_ROOT / customer_uid
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def _safe_folder_name(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip())
    return cleaned.strip("-") or "item"


def _tender_folder(customer_uid: str, tender_number: str) -> str:
    folder = _customer_folder(customer_uid) / "tenders" / _safe_folder_name(tender_number)
    folder.mkdir(parents=True, exist_ok=True)
    return str(folder)


def _order_folder(customer_uid: str, order_ref: str) -> str:
    folder = _customer_folder(customer_uid) / "orders" / _safe_folder_name(order_ref)
    folder.mkdir(parents=True, exist_ok=True)
    return str(folder)


def _due_days(submission_end_date: str | None) -> int | None:
    if not submission_end_date:
        return None
    try:
        return (date.fromisoformat(submission_end_date) - date.today()).days
    except ValueError:
        return None


def _tender_out(tender: Tender) -> TenderOut:
    data = TenderOut.model_validate(tender)
    data.due_days = _due_days(tender.submission_end_date)
    return data


def _write_csv(filename: str, columns: list[str], rows: list[dict]):
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "TenderEase"}


@app.post("/api/auth/signup", response_model=CustomerOut)
def signup(payload: CustomerSignup, db: Session = Depends(get_db)):
    if db.query(Customer).filter(Customer.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    customer = Customer(customer_uid=f"CUST-{uuid.uuid4().hex[:8].upper()}", **payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    _customer_folder(customer.customer_uid)
    return customer


@app.post("/api/auth/login", response_model=CustomerOut)
def login(payload: CustomerLogin, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == payload.email, Customer.password == payload.password).first()
    if not customer:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return customer


@app.get("/api/customers/{customer_id}/dashboard")
def dashboard(customer_id: int, db: Session = Depends(get_db)):
    tenders = db.query(Tender).filter(Tender.customer_id == customer_id).all()
    orders = db.query(Order).filter(Order.customer_id == customer_id).all()
    return {
        "live_tenders": sum(1 for t in tenders if t.current_status.lower() in {"live", "working"}),
        "upcoming_tenders": sum(1 for t in tenders if t.current_status.lower() == "upcoming"),
        "total_filed_tenders": sum(1 for t in tenders if t.applied.lower() == "yes"),
        "missed_tenders": sum(1 for t in tenders if t.current_status.lower() == "missed"),
        "working_tenders": sum(1 for t in tenders if t.current_status.lower() == "working"),
        "orders": len(orders),
        "nearest_due_days": min([d for d in (_due_days(t.submission_end_date) for t in tenders) if d is not None], default=None),
    }


@app.post("/api/customers/{customer_id}/tenders", response_model=TenderOut)
def add_tender(customer_id: int, payload: TenderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    tender = Tender(customer_id=customer.id, folder_path=_tender_folder(customer.customer_uid, payload.tender_number), **payload.model_dump())
    db.add(tender)
    db.commit()
    db.refresh(tender)
    return _tender_out(tender)


@app.get("/api/customers/{customer_id}/tenders", response_model=list[TenderOut])
def list_tenders(customer_id: int, db: Session = Depends(get_db)):
    tenders = db.query(Tender).filter(Tender.customer_id == customer_id).order_by(Tender.updated_at.desc()).all()
    return [_tender_out(t) for t in tenders]


@app.post("/api/customers/{customer_id}/tenders/import-pdf", response_model=TenderOut)
def import_tender_pdf(customer_id: int, pdf: UploadFile = File(...), db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    tender_number = Path(pdf.filename or f"tender-{int(datetime.utcnow().timestamp())}").stem
    folder = Path(_tender_folder(customer.customer_uid, tender_number))
    target = folder / (pdf.filename or "tender.pdf")
    target.write_bytes(pdf.file.read())
    tender = Tender(
        customer_id=customer.id,
        tender_number=tender_number,
        tender_title=f"PDF Imported Tender - {tender_number}",
        current_status="Review",
        tender_link=str(target),
        folder_path=str(folder),
    )
    db.add(tender)
    db.commit()
    db.refresh(tender)
    return _tender_out(tender)


@app.get("/api/customers/{customer_id}/tenders/export")
def export_tenders(customer_id: int, db: Session = Depends(get_db)):
    tenders = db.query(Tender).filter(Tender.customer_id == customer_id).all()
    rows = [_tender_out(t).model_dump() for t in tenders]
    return _write_csv("tender-dashboard.csv", TENDER_COLUMNS, rows)


@app.post("/api/customers/{customer_id}/orders", response_model=OrderOut)
def add_order(customer_id: int, payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    order = Order(customer_id=customer.id, folder_path=_order_folder(customer.customer_uid, payload.gem_tender_reference), **payload.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@app.get("/api/customers/{customer_id}/orders", response_model=list[OrderOut])
def list_orders(customer_id: int, db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.customer_id == customer_id).order_by(Order.updated_at.desc()).all()


@app.get("/api/customers/{customer_id}/orders/export")
def export_orders(customer_id: int, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.customer_id == customer_id).all()
    rows = [OrderOut.model_validate(o).model_dump() for o in orders]
    return _write_csv("orders-dashboard.csv", ORDER_COLUMNS, rows)


@app.get("/")
def index():
    return FileResponse(Path("app/static/index.html"))


app.mount("/static", StaticFiles(directory="app/static"), name="static")
