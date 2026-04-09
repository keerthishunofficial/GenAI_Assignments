import http.server
import socketserver
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from services.generator import generate_prompts
from services.evaluator import evaluate_prompts
from services.notebook_export import construct_notebook
from services.report_export import generate_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Files that should be force-downloaded (not rendered in browser)
DOWNLOAD_EXTENSIONS = {
    ".ipynb": "application/octet-stream",
    ".md":    "text/markdown",
    ".csv":   "text/csv",
}


class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    # ── GET ───────────────────────────────────────────────────────────────────
    def do_GET(self):
        if self.path == "/" or self.path == "":
            self.path = "/index.html"

        # Strip query strings (e.g. ?t=12345 cache-busters)
        clean_path = self.path.split("?")[0]
        ext = os.path.splitext(clean_path)[1].lower()

        if ext in DOWNLOAD_EXTENSIONS:
            # Serve the file with Content-Disposition: attachment so the
            # browser downloads it instead of trying to display it.
            file_path = os.path.join(BASE_DIR, clean_path.lstrip("/"))
            if not os.path.isfile(file_path):
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"File not found")
                return

            mime = DOWNLOAD_EXTENSIONS[ext]
            filename = os.path.basename(file_path)
            with open(file_path, "rb") as f:
                data = f.read()

            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

    # ── POST ──────────────────────────────────────────────────────────────────
    def do_POST(self):
        if self.path == "/api/generate":
            print("Received request to generate prompts...")
            try:
                print("Generating templates via Groq...")
                prompts = generate_prompts(10)
                if not prompts:
                    raise ValueError("No prompts were generated. Check your GROQ_API_KEY.")

                print(f"Evaluating {len(prompts)} templates via Groq...")
                evaluated_prompts = evaluate_prompts(prompts)

                print("Building Notebook and Report...")
                notebook_path = construct_notebook(
                    evaluated_prompts,
                    os.path.join(BASE_DIR, "prompt_library.ipynb")
                )
                report_path = generate_report(
                    evaluated_prompts,
                    os.path.join(BASE_DIR, "evaluation_report.md")
                )

                response_data = {
                    "status": "success",
                    "notebook_url": "/prompt_library.ipynb",
                    "report_url": "/evaluation_report.md",
                    "evaluations": evaluated_prompts,
                }

                body = json.dumps(response_data).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            except Exception as e:
                import traceback
                traceback.print_exc()
                body = json.dumps({"status": "error", "message": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")


def run(port: int = 8080):
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), HTTPRequestHandler) as httpd:
        print(f"\n{'='*50}")
        print(f"  Customer Support Prompt Library")
        print(f"  Open: http://localhost:{port}")
        print(f"{'='*50}\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
        finally:
            httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run(port)
