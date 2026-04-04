#!/usr/bin/env python3
"""
Daena Google A2A (Agent-to-Agent) Protocol Server v3.0
======================================================
Implements standard JSON/REST interfaces for agents globally to communicate.
Allows external corporate agents (e.g., a supplier's inventory agent) to query Daena.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading

class A2AServerHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/v1/a2a/request":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body)
                sender = data.get("sender_id")
                intent = data.get("intent")
                
                # Mock response based on protocol
                response = {
                    "status": "ACCEPTED",
                    "receiver_id": "daena_core",
                    "response": f"Message received from {sender}. Intent '{intent}' is queued.",
                }
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
            
    def log_message(self, format, *args):
        pass # Silent logging

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8911), A2AServerHandler)
    from threading import Thread
    t = Thread(target=server.serve_forever)
    t.daemon = True
    t.start()
    
    print("A2A Server Self-Test:\n")
    import urllib.request
    req = urllib.request.Request(
        "http://127.0.0.1:8911/v1/a2a/request",
        data=json.dumps({"sender_id": "external_vendor_agent", "intent": "check_stock"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        resp_data = json.loads(response.read())
        print(f"Reply from A2A: {resp_data['response']}")
        
    print("\n✅ A2A Protocol stub self-test passed")
