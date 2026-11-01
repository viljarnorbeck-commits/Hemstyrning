"""Read-only mDNS discovery. Never launches a receiver or starts playback."""
import argparse
import hashlib
import json
import threading
import time
import os
from pathlib import Path
import ipaddress
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode
from urllib.request import Request, ProxyHandler, HTTPRedirectHandler, build_opener
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from zeroconf import IPVersion, ServiceBrowser, ServiceListener, Zeroconf

TYPES = ['_spotify-connect._tcp.local.', '_googlecast._tcp.local.']


class Devices(ServiceListener):
    def __init__(self):
        self.lock = threading.Lock()
        self.rows = {}
        self.probes = ThreadPoolExecutor(max_workers=4)

    def add_service(self, zc, type_, name):
        info = zc.get_service_info(type_, name, timeout=2000)
        if info is None:
            return
        props = info.decoded_properties
        with self.lock:
            self.rows[name] = {
                'id': hashlib.sha256(name.encode()).hexdigest()[:24],
                'name': props.get('fn') or name.removesuffix('.' + type_),
                'model': props.get('md', ''),
                'protocol': 'Google Cast' if type_ == TYPES[1] else 'Spotify Connect',
                'announced': True,
                'lastSeen': time.time(),
            }
        if type_ == TYPES[0]:
            self.probes.submit(self.friendly_name, info, name)

    def friendly_name(self, info, name):
        # Only read getInfo from an advertised RFC1918 receiver, without redirects,
        # proxies, credentials, account association, or playback commands.
        addresses = info.parsed_addresses()
        address = next((a for a in addresses if any(ipaddress.ip_address(a) in ipaddress.ip_network(n)
                        for n in ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'))), None)
        path = info.decoded_properties.get('CPath', '/')
        if not address or not path.startswith('/') or any(c in path for c in ('?', '#', '\r', '\n')):
            return
        class NoRedirect(HTTPRedirectHandler):
            def redirect_request(self, *_args, **_kwargs):
                return None
        try:
            opener = build_opener(ProxyHandler({}), NoRedirect())
            url = f'http://{address}:{info.port}{path}?' + urlencode({'action': 'getInfo'})
            with opener.open(Request(url), timeout=2) as response:
                data = json.loads(response.read(16385))
            label = data.get('remoteName')
            if isinstance(label, str) and 0 < len(label) <= 200:
                with self.lock:
                    if name in self.rows:
                        self.rows[name]['name'] = label
        except (OSError, ValueError):
            pass

    def update_service(self, zc, type_, name):
        self.add_service(zc, type_, name)

    def remove_service(self, zc, type_, name):
        with self.lock:
            if name in self.rows:
                self.rows[name]['announced'] = False

    def snapshot(self):
        with self.lock:
            return {'devices': sorted((dict(r) for r in self.rows.values()), key=lambda r: r['name'].casefold()),
                    'source': 'mdns', 'readOnly': True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8766)
    parser.add_argument('--scan', action='store_true')
    parser.add_argument('--output', help='Private JSON snapshot for the WSL app backend')
    args = parser.parse_args()
    devices = Devices()
    zc = Zeroconf(ip_version=IPVersion.V4Only)
    browser = ServiceBrowser(zc, TYPES, devices)
    stop_writer = threading.Event()
    writer = None
    if args.output:
        output = Path(args.output)
        def publish():
            while not stop_writer.is_set():
                try:
                    payload = {**devices.snapshot(), 'observedAt': time.time() * 1000}
                    output.parent.mkdir(parents=True, exist_ok=True)
                    temporary = output.with_suffix('.tmp')
                    with temporary.open('w', encoding='utf-8') as stream:
                        json.dump(payload, stream, ensure_ascii=False)
                    os.replace(temporary, output)
                except OSError:
                    print('Local discovery snapshot could not be written.', flush=True)
                stop_writer.wait(5)
        writer = threading.Thread(target=publish, daemon=True)
        writer.start()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.headers.get('Host') not in (f'127.0.0.1:{args.port}', f'localhost:{args.port}'):
                self.send_error(403)
                return
            origin = self.headers.get('Origin')
            if origin and origin not in ('http://127.0.0.1:8765', 'http://localhost:8765',
                                         'http://127.0.0.1:5173', 'http://localhost:5173'):
                self.send_error(403)
                return
            if self.path != '/devices':
                self.send_error(404)
                return
            body = json.dumps(devices.snapshot(), ensure_ascii=False).encode()
            self.send_response(200)
            if origin:
                self.send_header('Access-Control-Allow-Origin', origin)
                self.send_header('Vary', 'Origin')
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_):
            pass

    try:
        if args.scan:
            time.sleep(8)
            print(json.dumps(devices.snapshot(), ensure_ascii=False))
        else:
            server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
            try:
                server.serve_forever()
            finally:
                server.server_close()
    finally:
        stop_writer.set()
        if writer:
            writer.join(timeout=3)
        browser.cancel()
        devices.probes.shutdown(wait=False, cancel_futures=True)
        zc.close()


if __name__ == '__main__':
    main()
