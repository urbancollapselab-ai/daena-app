#!/usr/bin/env python3
"""
Daena Orchestrator v1.0
=======================
Routes tasks to the correct department agent based on keyword analysis.
"""

import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

DEPARTMENT_PATTERNS = {
    "finance": [
        r"fatura", r"invoice", r"bütçe", r"budget", r"ödeme", r"payment",
        r"gelir", r"gider", r"revenue", r"expense", r"muhasebe", r"accounting",
        r"maliyet", r"cost", r"kâr", r"profit", r"vergi", r"tax",
    ],
    "data": [
        r"lead", r"veri", r"data", r"enrichment", r"crm", r"müşteri listesi",
        r"customer list", r"scrape", r"collect", r"database", r"zenginleştir",
    ],
    "marketing": [
        r"pazarlama", r"marketing", r"içerik", r"content", r"sosyal medya",
        r"social media", r"kampanya", r"campaign", r"blog", r"seo",
        r"reklam", r"advertising", r"branding",
    ],
    "sales": [
        r"satış", r"sales", r"teklif", r"proposal", r"outreach",
        r"müşteri", r"client", r"deal", r"pipeline", r"close",
    ],
    "research": [
        r"araştır", r"arastir", r"research", r"analiz", r"analysis",
        r"rakip", r"competitor", r"pazar", r"market", r"trend",
    ],
    "watchdog": [
        r"kontrol et", r"check", r"monitor", r"izle", r"hata", r"error",
        r"sağlık", r"sagligi", r"health", r"durum", r"status",
    ],
    "heartbeat": [
        r"rapor", r"report", r"özet", r"summary", r"günlük", r"daily",
        r"haftalık", r"weekly", r"uptime",
    ],
    "coordinator": [
        r"koordine", r"coordinate", r"yönet", r"manage", r"düzenle",
        r"organize", r"workflow", r"ajan", r"agent",
    ],
}

ASCII_MAP = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")


class Orchestrator:
    def classify_task(self, message: str) -> dict:
        msg_lower = message.lower()
        msg_ascii = msg_lower.translate(ASCII_MAP)

        for dept, patterns in DEPARTMENT_PATTERNS.items():
            for pattern in patterns:
                pat_ascii = pattern.translate(ASCII_MAP)
                if re.search(pattern, msg_lower) or re.search(pat_ascii, msg_ascii):
                    return {
                        "destination": "department",
                        "department": dept,
                        "confidence": 0.8,
                    }

        return {
            "destination": "worker",
            "department": None,
            "confidence": 0.5,
        }

    def get_department_context(self, department: str) -> str:
        claude_md = ROOT / "agents" / department / "CLAUDE.md"
        if claude_md.exists():
            content = claude_md.read_text()
            # Return first 2000 chars for context
            return content[:2000]
        return f"You are the {department} department agent."
