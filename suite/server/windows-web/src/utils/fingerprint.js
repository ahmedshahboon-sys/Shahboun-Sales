const os = require('os');
const crypto = require('crypto');

function serverFingerprint() {
  const nets = os.networkInterfaces();
  const macs = [];
  for (const list of Object.values(nets)) {
    for (const n of list || []) {
      if (!n.internal && n.mac && n.mac !== '00:00:00:00:00:00') macs.push(n.mac.toLowerCase());
    }
  }
  const raw = [os.hostname(), os.platform(), os.arch(), os.cpus()?.[0]?.model || '', ...macs.sort()].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}
function licenseDeviceId(){
  const d=serverFingerprint().toUpperCase();
  return `WIN-${d.slice(0,8)}-${d.slice(8,16)}-${d.slice(16,24)}`;
}
module.exports = { serverFingerprint, licenseDeviceId };
