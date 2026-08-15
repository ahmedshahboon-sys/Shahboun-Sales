$ErrorActionPreference='Stop'
$root=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root
function New-Secret([int]$Length=64){$chars='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%_-';-join(1..$Length|%{$chars[(Get-Random -Minimum 0 -Maximum $chars.Length)]})}
$runtime=Join-Path $root 'runtime'
$node=Join-Path $runtime 'node\node.exe'
$pgBin=Join-Path $runtime 'postgres\bin'
$psql=Join-Path $pgBin 'psql.exe'
$secretFile=Join-Path $runtime '.db_secret'
if(!(Test-Path $node)){throw 'NODE_RUNTIME_MISSING'}
if(!(Test-Path $psql)){throw 'POSTGRES_RUNTIME_MISSING'}
if(!(Test-Path $secretFile)){throw 'POSTGRES_SECRET_MISSING'}
$dbPassword=(Get-Content $secretFile -Raw).Trim()
$env:PGPASSWORD=$dbPassword
$env:Path="$pgBin;$env:Path"
$db='shahboun_lan'
$exists=& $psql -h 127.0.0.1 -p 55432 -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db'"
if(($exists|Out-String).Trim() -ne '1'){& $psql -h 127.0.0.1 -p 55432 -U postgres -c "CREATE DATABASE $db ENCODING 'UTF8'";if($LASTEXITCODE-ne 0){throw 'DATABASE_CREATE_FAILED'}}
if(!(Test-Path '.env')){
$jwt=New-Secret 72
@"
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=55432
DB_NAME=shahboun_lan
DB_USER=postgres
DB_PASSWORD=$dbPassword
JWT_SECRET=$jwt
JWT_EXPIRES_IN=12h
SERVER_NAME=Shahboun Suite 6.0.0
LICENSE_PUBLIC_KEY_B64=RKp/T18jbb/JxKEiM15em89PFUmzBPpgFHGUgrljIIs=
TRIAL_HOURS=24
BACKUP_DIR=./backups
"@|Set-Content -Encoding UTF8 '.env'
try{icacls '.env' /inheritance:r /grant:r "$env:USERNAME:(R,W)" 'SYSTEM:(F)'|Out-Null}catch{}
}
if(!(Test-Path 'node_modules\express\package.json')){throw 'NODE_MODULES_MISSING'}
& $node 'src\db\migrate.js';if($LASTEXITCODE-ne 0){throw 'DATABASE_MIGRATION_FAILED'}
& $node 'src\db\seed.js';if($LASTEXITCODE-ne 0){throw 'DATABASE_SEED_FAILED'}
Write-Host 'Shahboun Suite 6.0.0 database initialized.' -ForegroundColor Green
