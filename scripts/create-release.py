"""Package only built installers/bundles and checksums, never keys or user data."""
import hashlib,json,pathlib,subprocess,zipfile
root=pathlib.Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
files=[p for p in (root/'artifacts').rglob('*') if p.suffix.lower() in {'.apk','.exe','.msi','.ipa','.aab'}]
files+=list((root/'apps/android/app/build/outputs/bundle').glob('*/*.aab'))
if not files:raise SystemExit('No real built packages found')
source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
manifest={'version':version,'source':source,'files':[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
output=root/'artifacts'/('Hemstyrning-'+version+'.zip')
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as archive:
 for p in files:archive.write(p,'packages/'+p.name)
 archive.writestr('release.json',json.dumps(manifest,indent=2))
 archive.write(root/'docs/INSTALLABLE_APPS.md','INSTALLATION.md')
print(output)
