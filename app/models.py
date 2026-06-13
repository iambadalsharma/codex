from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_uid = Column(String, unique=True, index=True, nullable=False)
    business_name = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenders = relationship("Tender", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    serial_no = Column(Integer, nullable=True)
    remarks = Column(Text, nullable=True)
    published_date = Column(String, nullable=True)
    submission_end_date = Column(String, nullable=True)
    pre_bid_date = Column(String, nullable=True)
    pre_bid_location = Column(String, nullable=True)
    to_be_applied = Column(String, default="Review")
    not_applying_reason = Column(Text, nullable=True)
    applied = Column(String, default="No")
    tender_number = Column(String, index=True, nullable=False)
    tender_title = Column(String, nullable=False)
    consignee = Column(String, nullable=True)
    organisation = Column(String, nullable=True)
    location = Column(String, nullable=True)
    emd_value = Column(Float, default=0)
    ra = Column(String, default="No")
    tender_value = Column(Float, default=0)
    quoted_value = Column(Float, default=0)
    result = Column(String, nullable=True)
    winning_value = Column(Float, default=0)
    tender_link = Column(String, nullable=True)
    current_status = Column(String, default="Upcoming")
    folder_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="tenders")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    serial_no = Column(Integer, nullable=True)
    gem_tender_reference = Column(String, nullable=False)
    tech_specs_reference = Column(String, nullable=True)
    category = Column(String, nullable=True)
    contract_no = Column(String, nullable=True)
    contract_link = Column(String, nullable=True)
    contract_date = Column(String, nullable=True)
    organisation = Column(String, nullable=True)
    location = Column(String, nullable=True)
    work = Column(Text, nullable=True)
    total_order_value = Column(Float, default=0)
    order_status = Column(String, default="Generated")
    bg_value = Column(Float, default=0)
    bg_number = Column(String, nullable=True)
    bg_link = Column(String, nullable=True)
    bg_issue_date = Column(String, nullable=True)
    bg_timeline = Column(String, nullable=True)
    bg_status = Column(String, nullable=True)
    collected_or_not = Column(String, default="No")
    couriered = Column(String, default="No")
    crac_link = Column(String, nullable=True)
    folder_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
