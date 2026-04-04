#!/usr/bin/env python3
"""
Daena PII Filter v3.0
======================
Detects and redacts Personally Identifiable Information (PII) from text.
Works on both input (before sending to model) and output (before showing to user).

Detects: Email, phone, SSN, IBAN, credit card, IP address, passport, 
         Turkish TC Kimlik, Dutch BSN, date of birth patterns.

Usage:
    pii = PIIFilter()
    result = pii.scan("Contact john@example.com or call +31612345678")
    # → {"has_pii": True, "entities": [{"type": "email", ...}, {"type": "phone", ...}]}
    
    redacted = pii.redact("My email is john@example.com")
    # → "My email is [EMAIL_REDACTED]"
"""

import re
from typing import Dict, List

PII_PATTERNS = [
    {
        "type": "email",
        "pattern": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
        "replacement": "[EMAIL_REDACTED]",
    },
    {
        "type": "phone_international",
        "pattern": r"(?:\+|00)[1-9]\d{6,14}\b",
        "replacement": "[PHONE_REDACTED]",
    },
    {
        "type": "phone_local",
        "pattern": r"\b0[1-9]\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b",
        "replacement": "[PHONE_REDACTED]",
    },
    {
        "type": "credit_card",
        "pattern": r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b",
        "replacement": "[CC_REDACTED]",
    },
    {
        "type": "iban",
        "pattern": r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16}\b",
        "replacement": "[IBAN_REDACTED]",
    },
    {
        "type": "ssn_us",
        "pattern": r"\b\d{3}-\d{2}-\d{4}\b",
        "replacement": "[SSN_REDACTED]",
    },
    {
        "type": "tc_kimlik",  # Turkish national ID (11 digits)
        "pattern": r"\b[1-9]\d{10}\b",
        "replacement": "[TC_REDACTED]",
        "validate": lambda m: _validate_tc(m.group()),
    },
    {
        "type": "bsn_nl",  # Dutch BSN (9 digits, 11-check)
        "pattern": r"\b\d{9}\b",
        "replacement": "[BSN_REDACTED]",
        "validate": lambda m: _validate_bsn(m.group()),
    },
    {
        "type": "ipv4",
        "pattern": r"\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b",
        "replacement": "[IP_REDACTED]",
    },
    {
        "type": "passport",
        "pattern": r"\b[A-Z]{1,2}\d{6,8}\b",
        "replacement": "[PASSPORT_REDACTED]",
        "min_context": True,  # Only flag if context mentions passport
    },
    {
        "type": "date_of_birth",
        "pattern": r"\b(?:0[1-9]|[12]\d|3[01])[-/.](?:0[1-9]|1[0-2])[-/.](?:19|20)\d{2}\b",
        "replacement": "[DOB_REDACTED]",
    },
]

# Context keywords that increase PII confidence
PII_CONTEXT_KEYWORDS = [
    "passport", "pasaport", "kimlik", "identity", "ssn", "social security",
    "bsn", "burger", "doğum", "birthday", "born",
]


def _validate_tc(num_str: str) -> bool:
    """Validate Turkish TC Kimlik number using algorithm."""
    if len(num_str) != 11 or num_str[0] == '0':
        return False
    digits = [int(d) for d in num_str]
    # Check digit 10
    check10 = ((sum(digits[0:9:2]) * 7) - sum(digits[1:8:2])) % 10
    if check10 != digits[9]:
        return False
    # Check digit 11
    check11 = sum(digits[0:10]) % 10
    return check11 == digits[10]


def _validate_bsn(num_str: str) -> bool:
    """Validate Dutch BSN using 11-proof check."""
    if len(num_str) != 9:
        return False
    digits = [int(d) for d in num_str]
    weights = [9, 8, 7, 6, 5, 4, 3, 2, -1]
    total = sum(d * w for d, w in zip(digits, weights))
    return total % 11 == 0 and total != 0


class PIIFilter:
    def __init__(self):
        self._compiled = []
        for p in PII_PATTERNS:
            try:
                self._compiled.append({
                    **p,
                    "regex": re.compile(p["pattern"]),
                })
            except re.error:
                pass

    def scan(self, text: str) -> Dict:
        """Scan text for PII entities."""
        entities = []
        text_lower = text.lower()
        has_context = any(kw in text_lower for kw in PII_CONTEXT_KEYWORDS)

        for pattern in self._compiled:
            # Skip passport detection without context
            if pattern.get("min_context") and not has_context:
                continue

            for match in pattern["regex"].finditer(text):
                # Run validator if exists
                validator = pattern.get("validate")
                if validator and not validator(match):
                    continue

                entities.append({
                    "type": pattern["type"],
                    "value": match.group()[:4] + "***",  # Partially mask
                    "start": match.start(),
                    "end": match.end(),
                })

        return {
            "has_pii": len(entities) > 0,
            "entity_count": len(entities),
            "entities": entities,
            "types": list(set(e["type"] for e in entities)),
        }

    def redact(self, text: str) -> str:
        """Redact all PII from text."""
        redacted = text
        text_lower = text.lower()
        has_context = any(kw in text_lower for kw in PII_CONTEXT_KEYWORDS)

        for pattern in self._compiled:
            if pattern.get("min_context") and not has_context:
                continue

            def _replace(match):
                validator = pattern.get("validate")
                if validator and not validator(match):
                    return match.group()
                return pattern["replacement"]

            redacted = pattern["regex"].sub(_replace, redacted)

        return redacted

    def check_and_redact(self, text: str) -> Dict:
        """Scan and optionally redact. Returns both."""
        scan_result = self.scan(text)
        redacted = self.redact(text) if scan_result["has_pii"] else text
        return {
            **scan_result,
            "redacted_text": redacted,
        }


if __name__ == "__main__":
    pii = PIIFilter()
    print("PIIFilter Self-Test:\n")

    tests = [
        ("Normal business text without PII", False, []),
        ("Contact me at john@example.com", True, ["email"]),
        ("Call +31612345678 for info", True, ["phone_international"]),
        ("Credit card: 4111111111111111", True, ["credit_card"]),
        ("IBAN: NL91ABNA0417164300", True, ["iban"]),
        ("SSN: 123-45-6789", True, ["ssn_us"]),
        ("Born on 15/03/1990", True, ["date_of_birth"]),
        ("Server IP: 192.168.1.100", True, ["ipv4"]),
    ]

    passed = 0
    for text, expected_pii, expected_types in tests:
        result = pii.scan(text)
        ok = result["has_pii"] == expected_pii
        if expected_types:
            ok = ok and all(t in result["types"] for t in expected_types)
        status = "✅" if ok else "❌"
        if ok: passed += 1
        types_str = ", ".join(result["types"]) if result["types"] else "none"
        print(f"  {status} PII={result['has_pii']} types=[{types_str}] | '{text[:50]}'")

    # Redaction test
    mixed = "Email john@example.com, card 4111111111111111, IBAN NL91ABNA0417164300"
    redacted = pii.redact(mixed)
    print(f"\n  Redaction:")
    print(f"    Original: {mixed}")
    print(f"    Redacted: {redacted}")

    print(f"\n{passed}/{len(tests)} tests passed")
