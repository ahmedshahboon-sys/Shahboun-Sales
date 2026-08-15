require('dotenv').config();

const required = ['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  serverName: process.env.SERVER_NAME || 'Shahboun Server',
  trialHours: Number(process.env.TRIAL_HOURS || 24),
  trialMaxDevices: Number(process.env.TRIAL_MAX_DEVICES || 5),
  // Public verification key only. The private signing key must never be committed to Git.
  licensePublicKeyB64: process.env.LICENSE_PUBLIC_KEY_B64 || 'RKp/T18jbb/JxKEiM15em89PFUmzBPpgFHGUgrljIIs=',
  backupDir: process.env.BACKUP_DIR || './backups'
};
