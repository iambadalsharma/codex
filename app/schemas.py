from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CustomerSignup(BaseModel):
    business_name: str
    owner_name: str
    email: str
    phone: Optional[str] = None
    password: str


class CustomerLogin(BaseModel):
    email: str
    password: str


class CustomerOut(BaseModel):
    id: int
    customer_uid: str
    business_name: str
    owner_name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TenderBase(BaseModel):
    serial_no: Optional[int] = None
    remarks: Optional[str] = None
    published_date: Optional[str] = None
    submission_end_date: Optional[str] = None
    pre_bid_date: Optional[str] = None
    pre_bid_location: Optional[str] = None
    to_be_applied: str = "Review"
    not_applying_reason: Optional[str] = None
    applied: str = "No"
    tender_number: str
    tender_title: str
    consignee: Optional[str] = None
    organisation: Optional[str] = None
    location: Optional[str] = None
    emd_value: float = 0
    ra: str = "No"
    tender_value: float = 0
    quoted_value: float = 0
    result: Optional[str] = None
    winning_value: float = 0
    tender_link: Optional[str] = None
    current_status: str = "Upcoming"


class TenderCreate(TenderBase):
    pass


class TenderOut(TenderBase):
    id: int
    customer_id: int
    due_days: Optional[int] = None
    folder_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    serial_no: Optional[int] = None
    gem_tender_reference: str
    tech_specs_reference: Optional[str] = None
    category: Optional[str] = None
    contract_no: Optional[str] = None
    contract_link: Optional[str] = None
    contract_date: Optional[str] = None
    organisation: Optional[str] = None
    location: Optional[str] = None
    work: Optional[str] = None
    total_order_value: float = 0
    order_status: str = "Generated"
    bg_value: float = 0
    bg_number: Optional[str] = None
    bg_link: Optional[str] = None
    bg_issue_date: Optional[str] = None
    bg_timeline: Optional[str] = None
    bg_status: Optional[str] = None
    collected_or_not: str = "No"
    couriered: str = "No"
    crac_link: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderOut(OrderBase):
    id: int
    customer_id: int
    folder_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
