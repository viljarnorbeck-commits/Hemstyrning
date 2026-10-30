import{readFile}from'node:fs/promises';
const version=JSON.parse(await readFile('package.json','utf8')).version;
for(const path of ['In/hemkontroll_3d_komplett/package.json','services/ha-simulator/package.json','apps/windows/tauri.conf.json'])if(JSON.parse(await readFile(path,'utf8')).version!==version)throw new Error('Version mismatch: '+path);
for(const path of ['apps/windows/Cargo.toml','apps/android/app/build.gradle','apps/ios/Hemstyrning/Info.plist'])if(!(await readFile(path,'utf8')).includes(version))throw new Error('Version mismatch: '+path);
console.log('Shared version verified: '+version);
