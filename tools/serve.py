"""Local preview server that never lets the browser cache anything.

Python's built-in http.server sends no cache headers, so browsers keep serving
old copies of HTML, CSS and JS after files change. That makes edits look like
they "didn't work". This server tells the browser to fetch fresh every time.

    python tools/serve.py          # http://localhost:4176
    python tools/serve.py 8080     # another port
"""
import http.server, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4176
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCache(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # Wipes anything the browser cached from an older, non-cache-safe server,
        # the moment any page is fetched fresh. localhost counts as secure.
        if self.path.split("?")[0] in ("/", "/index.html") or self.path.endswith(".html"):
            self.send_header("Clear-Site-Data", '"cache"')
        super().end_headers()


if __name__ == "__main__":
    print("Crystal Lights preview: http://localhost:%d  (Ctrl+C to stop)" % PORT)
    http.server.ThreadingHTTPServer(("", PORT), NoCache).serve_forever()
