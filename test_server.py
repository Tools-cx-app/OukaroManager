#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP server for testing OukaroManager WebUI
Supports WSA and local browser access
"""

import http.server
import socketserver
import os
import sys
import socket
from urllib.parse import unquote

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), 'module', 'webroot'), **kwargs)
    
    def end_headers(self):
        # Add CORS headers to support cross-origin access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Add cache control
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

def get_local_ip():
    """Get local IP address"""
    try:
        # Connect to a remote address to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def main():
    ports = [8080, 8000, 3000, 9000, 8888]
    
    for port in ports:
        try:
            with socketserver.TCPServer(("0.0.0.0", port), CustomHTTPRequestHandler) as httpd:
                local_ip = get_local_ip()
                print(f"\n🚀 OukaroManager test server started successfully!")
                print(f"📱 Local access: http://localhost:{port}")
                print(f"🌐 Network access: http://{local_ip}:{port}")
                print(f"📱 WSA access: http://10.0.2.2:{port}")
                print(f"🔧 WebUI directory: {os.path.join(os.path.dirname(__file__), 'module', 'webroot')}")
                print(f"\nPress Ctrl+C to stop the server\n")
                
                httpd.serve_forever()
                
        except OSError as e:
            if "Address already in use" in str(e):
                print(f"Port {port} is already in use, trying next port...")
                continue
            else:
                print(f"Port {port} failed to start: {e}")
                continue
        except KeyboardInterrupt:
            print(f"\n✅ Server stopped")
            break
    else:
        print("❌ Unable to start server on any port")

if __name__ == "__main__":
    main()
