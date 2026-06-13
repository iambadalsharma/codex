import json
import os
from pathlib import Path
from typing import Iterable

import requests

from .schemas import Tender

DEFAULT_SAMPLE_FILE = Path(__file__).parent / "data" / "sample_tenders.json"


class TenderProvider:
    """Fetch tenders from configured API, with local sample fallback."""

    def __init__(self):
        self.api_url = os.getenv("TENDER_API_URL", "").strip()
        self.api_key = os.getenv("TENDER_API_KEY", "").strip()

    def fetch_tenders(self) -> list[Tender]:
        if self.api_url:
            try:
                headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                resp = requests.get(self.api_url, headers=headers, timeout=20)
                resp.raise_for_status()
                data = resp.json()
                return [self._normalize(item, source="api") for item in data]
            except requests.RequestException:
                pass

        return self._load_sample()

    def search(self, keywords: Iterable[str]) -> list[Tender]:
        tokens = [k.strip().lower() for k in keywords if k.strip()]
        tenders = self.fetch_tenders()
        if not tokens:
            return tenders

        def matches(tender: Tender):
            hay = f"{tender.title} {tender.department or ''}".lower()
            return all(token in hay for token in tokens)

        return [t for t in tenders if matches(t)]

    def _load_sample(self) -> list[Tender]:
        with open(DEFAULT_SAMPLE_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return [self._normalize(item, source="sample") for item in data]

    @staticmethod
    def _normalize(item: dict, source: str) -> Tender:
        return Tender(
            tender_id=str(item.get("tender_id") or item.get("id") or ""),
            title=item.get("title", "Untitled Tender"),
            department=item.get("department"),
            value=item.get("value"),
            due_date=item.get("due_date"),
            source=source,
            url=item.get("url"),
        )
