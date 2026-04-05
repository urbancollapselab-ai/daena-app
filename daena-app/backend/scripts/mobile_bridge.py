#!/usr/bin/env python3
"""
Daena Mobile Bridge v1.0
========================
Enables iPhone/Android PWA connection to the desktop Daena instance.
Handles: local IP discovery, QR code generation, PIN pairing, JWT tokens.

Usage:
    bridge = MobileBridge()
    qr_data = bridge.generate_qr_payload()  # Returns URL + PIN for QR code
    token = bridge.verify_pin("123456")       # Returns JWT if PIN matches
"""

import hashlib
import json
import os
import secrets
import socket
import time
from pathlib import Path
from typing import Dict, Optional

ROOT = Path(__file__).parent.parent


class MobileBridge:
    def __init__(self, port: int = 8910):
        self._port = port
        self._pin: Optional[str] = None
        self._pin_expiry: float = 0
        self._tokens: Dict[str, float] = {}  # token → expiry timestamp
        self._token_secret = secrets.token_hex(32)

    def get_local_ip(self) -> str:
        """Discover LAN IP address (works on macOS, Windows, Linux)."""
        try:
            # Create a dummy UDP socket to find the default route IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def generate_pin(self) -> str:
        """Generate a 6-digit PIN valid for 5 minutes."""
        self._pin = f"{secrets.randbelow(1000000):06d}"
        self._pin_expiry = time.time() + 300  # 5 minutes
        return self._pin

    def generate_qr_payload(self) -> dict:
        """Generate the full QR code data for mobile pairing."""
        ip = self.get_local_ip()
        pin = self.generate_pin()
        url = f"http://{ip}:{self._port}"

        return {
            "url": url,
            "pin": pin,
            "ip": ip,
            "port": self._port,
            "expires_in": 300,
            # The QR code should encode this URL which will open in mobile Safari
            "qr_content": f"{url}?pair={pin}",
        }

    def verify_pin(self, submitted_pin: str) -> Optional[str]:
        """Verify PIN and return a JWT-like session token."""
        if not self._pin:
            return None
        if time.time() > self._pin_expiry:
            self._pin = None
            return None
        if submitted_pin != self._pin:
            return None

        # PIN correct — generate session token
        self._pin = None  # One-time use
        token_data = f"{submitted_pin}:{time.time()}:{secrets.token_hex(16)}"
        token = hashlib.sha256(token_data.encode()).hexdigest()

        # Token valid for 30 days
        self._tokens[token] = time.time() + (30 * 86400)
        return token

    def validate_token(self, token: str) -> bool:
        """Check if a mobile session token is still valid."""
        if token not in self._tokens:
            return False
        if time.time() > self._tokens[token]:
            del self._tokens[token]
            return False
        return True

    def revoke_token(self, token: str):
        """Revoke a mobile session."""
        self._tokens.pop(token, None)

    def get_status(self) -> dict:
        """Get mobile bridge status."""
        active_sessions = sum(
            1 for exp in self._tokens.values() if time.time() < exp
        )
        return {
            "local_ip": self.get_local_ip(),
            "port": self._port,
            "active_mobile_sessions": active_sessions,
            "pin_active": self._pin is not None and time.time() < self._pin_expiry,
        }


# ── Singleton for server.py import ──
_bridge = MobileBridge()


def get_bridge(port: int = 8910) -> MobileBridge:
    global _bridge
    if _bridge._port != port:
        _bridge = MobileBridge(port)
    return _bridge


if __name__ == "__main__":
    bridge = MobileBridge()
    print("Daena Mobile Bridge Self-Test:\n")

    # Test IP discovery
    ip = bridge.get_local_ip()
    print(f"  Local IP: {ip}")
    assert ip != "", "IP discovery failed"

    # Test QR payload
    qr = bridge.generate_qr_payload()
    print(f"  QR URL: {qr['qr_content']}")
    print(f"  PIN: {qr['pin']}")

    # Test PIN verification
    token = bridge.verify_pin(qr["pin"])
    assert token is not None, "PIN verification failed"
    print(f"  Token: {token[:20]}...")

    # Test token validation
    assert bridge.validate_token(token), "Token validation failed"
    print(f"  Token valid: True")

    # Test expired PIN
    bridge.generate_pin()
    bridge._pin_expiry = time.time() - 1  # Force expire
    assert bridge.verify_pin(bridge._pin or "") is None, "Expired PIN should fail"
    print(f"  Expired PIN rejected: True")

    # Test status
    status = bridge.get_status()
    print(f"  Active sessions: {status['active_mobile_sessions']}")

    print(f"\n✅ MobileBridge self-test passed")
