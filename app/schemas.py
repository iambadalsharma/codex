from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Tender(BaseModel):
    tender_id: str
    title: str
    department: Optional[str] = None
    value: Optional[str] = None
    due_date: Optional[str] = None
    source: str
    url: Optional[str] = None


class BidBase(BaseModel):
    tender_id: str
    title: str
    department: Optional[str] = None
    value: Optional[str] = None
    due_date: Optional[str] = None
    stage: str = "draft"
    notes: Optional[str] = None


class BidCreate(BidBase):
    pass


class BidUpdateStage(BaseModel):
    stage: str
    comment: Optional[str] = None


class BidHistoryOut(BaseModel):
    id: int
    stage: str
    comment: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True


class BidOut(BidBase):
    id: int
    created_at: datetime
    updated_at: datetime
    history: list[BidHistoryOut] = []

    class Config:
        from_attributes = True
