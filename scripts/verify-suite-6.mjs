import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (m) => { console.error(`SUITE6_VERIFY_FAILED: ${m}`); process.exitCode = 1; };
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const suite = readJson('SUITE_VERSION.json');
if (suite.version !== '6.0.0') fail(`expected suite version 6.0.0, got ${suite.version}`);
for (const [name, version] of Object.entries(suite.products || {})) {
  if (version !== suite.version) fail(`${name} version ${version} does not match suite ${suite.version}`);
}
if (suite.iosMode !== 'web-client-only') fail('iOS must remain web-client-only');
if (!Array.isArray(suite.hostModes) || !suite.hostModes.includes('windows') || !suite.hostModes.includes('android')) fail('Windows + Android host modes required');

for (const forbidden of ['.replit','.replitignore']) {
  if (fs.existsSync(path.join(root,forbidden))) fail(`forbidden Replit file exists: ${forbidden}`);
}

const secretNamePatterns = [/LicenseSigningKeyBackup/i,/private[-_ ]?signing[-_ ]?key/i,/ed25519[-_ ]?private/i];
const ignoreDirs = new Set(['.git','node_modules','.expo','dist','build']);
function walk(dir) {
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    if (ignoreDirs.has(ent.name)) continue;
    const full = path.join(dir,ent.name);
    if (ent.isDirectory()) walk(full);
    else {
      const rel = path.relative(root,full).replaceAll('\\','/');
      if (secretNamePatterns.some((r)=>r.test(rel))) fail(`possible private licensing key file committed: ${rel}`);
    }
  }
}
walk(root);

if (!process.exitCode) console.log(`Shahboun Suite ${suite.version} repository verification passed.`);
