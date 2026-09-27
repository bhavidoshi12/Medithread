#!/usr/bin/env python3
"""
MediThread - Local Development & Production Preview Web Server
Serves static assets with proper MIME types, CORS, and fallback routing.
"""

import http.server
import json
import socketserver
import os
import threading
import time
import urllib.parse

from sharepoint_graph import (
    MAX_UPLOAD_BYTES,
    SharePointError,
    UploadValidationError,
    is_configured,
    upload_file,
)

PORT = 3000
UPLOADS_PER_HOUR = 20
UPLOAD_TIMES_BY_IP = {}
UPLOAD_LIMIT_LOCK = threading.Lock()

class MediThreadHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if urllib.parse.urlparse(self.path).path == '/api/sharepoint/status':
            self.send_json(200, {'configured': is_configured()})
            return
        super().do_GET()

    def do_POST(self):
        if urllib.parse.urlparse(self.path).path != '/api/sharepoint/upload':
            self.send_json(404, {'error': 'Not found.'})
            return

        if not is_configured():
            self.send_json(503, {'error': 'SharePoint server settings are not configured.'})
            return

        if not self.allow_upload_from_client():
            self.send_json(429, {'error': 'Upload limit reached. Try again later.'})
            return

        try:
            content_length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            self.send_json(400, {'error': 'Invalid upload size.'})
            return

        if content_length < 1:
            self.send_json(400, {'error': 'The uploaded file is empty.'})
            return
        if content_length > MAX_UPLOAD_BYTES:
            self.close_connection = True
            self.send_json(413, {'error': 'Files must be 25 MB or smaller.'})
            return

        filename = urllib.parse.unquote(self.headers.get('X-File-Name', ''))
        content = self.rfile.read(content_length)
        if len(content) != content_length:
            self.send_json(400, {'error': 'The upload did not finish.'})
            return

        try:
            uploaded_file = upload_file(
                filename,
                content,
                self.headers.get('Content-Type', ''),
            )
        except UploadValidationError as error:
            self.send_json(400, {'error': str(error)})
            return
        except SharePointError as error:
            self.send_json(502, {'error': str(error)})
            return

        self.send_json(201, uploaded_file)

    def allow_upload_from_client(self):
        now = time.time()
        client_ip = self.client_address[0]
        with UPLOAD_LIMIT_LOCK:
            recent_uploads = [
                timestamp
                for timestamp in UPLOAD_TIMES_BY_IP.get(client_ip, [])
                if now - timestamp < 3600
            ]
            if len(recent_uploads) >= UPLOADS_PER_HOUR:
                UPLOAD_TIMES_BY_IP[client_ip] = recent_uploads
                return False
            recent_uploads.append(now)
            UPLOAD_TIMES_BY_IP[client_ip] = recent_uploads
            return True

    def send_json(self, status, payload):
        encoded_payload = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded_payload)))
        self.end_headers()
        self.wfile.write(encoded_payload)

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    handler = MediThreadHTTPRequestHandler
    
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"============================================================")
        print(f"  MediThread Platform Server Running at:")
        print(f"  --> http://localhost:{PORT}")
        print(f"============================================================")
        print("Press Ctrl+C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.server_close()

if __name__ == '__main__':
    run_server()
