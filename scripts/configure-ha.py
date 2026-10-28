#!/usr/bin/env python3
"""Local hidden token entry; credentials are never printed or passed as arguments."""
import getpass
import os
from pathlib import Path
path = Path(__file__).resolve().parents[1] / '.env'
token = getpass.getpass('Home Assistant-token (Hemstyrning 3d), dold inmatning: ').strip()
if not token or any(c.isspace() for c in token):
    raise SystemExit('Ingen giltig token angavs; konfigurationen ändrades inte.')
lines = path.read_text().splitlines() if path.exists() else []
keys = {'HA_URL', 'HA_TOKEN', 'HA_MODE', 'HA_ALLOW_CONTROL', 'HA_REAL_URL', 'HA_REAL_TOKEN'}
lines = [line for line in lines if line.split('=', 1)[0].strip() not in keys]
lines += ['HA_URL=http://192.168.0.130:8123', 'HA_TOKEN=' + token, 'HA_MODE=real', 'HA_ALLOW_CONTROL=false']
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
os.fchmod(fd, 0o600)
with os.fdopen(fd, 'w') as output:
    output.write('\n'.join(lines) + '\n')
print('Lokal .env sparad med rättighet 600. Starta om npm run dev. Verklig styrning är avstängd.')
