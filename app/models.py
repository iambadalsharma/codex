from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    value = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    stage = Column(String, default="draft", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    history = relationship("BidHistory", back_populates="bid", cascade="all, delete-orphan")


class BidHistory(Base):
    __tablename__ = "bid_history"

    id = Column(Integer, primary_key=True, index=True)
    bid_id = Column(Integer, ForeignKey("bids.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    bid = relationship("Bid", back_populates="history")
