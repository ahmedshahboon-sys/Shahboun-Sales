$ErrorActionPreference='Stop'
Write-Host '=== Shahboun Suite 6.0.1 - First Run Setup ===' -ForegroundColor Cyan
$root=Split-Path -Parent $PSScriptRoot
Set-Location $root

function New-RandomSecret([int]$Length=48){
  $chars='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%_-'
  -join (1..$Length | ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })
}

$nodeExe=Join-Path $root 'runtime\node\node.exe'
if(!(Test-Path $nodeExe)){ throw 'NODE_RUNTIME_MISSING: Shahboun Setup package is incomplete.' }

$pgRoot=Join-Path $root 'runtime\postgresql'
$psql=Join-Path $pgRoot 'bin\psql.exe'
$createdb=Join-Path $pgRoot 'bin\createdb.exe'
$pgDump=Join-Path $pgRoot 'bin\pg_dump.exe'
$pgRestore=Join-Path $pgRoot 'bin\pg_restore.exe'
if(!(Test-Path $psql)){ throw 'POSTGRES_RUNTIME_MISSING: Shahboun Setup package is incomplete.' }

$secretFile=Join-Path $root 'runtime\.db_secret'
if(!(Test-Path '.env')){
  if(!(Test-Path $secretFile)){ throw 'DATABASE_SECRET_MISSING' }
  $dbPassword=(Get-Content $secretFile -Raw).Trim()
  if([string]::IsNullOrWhiteSpace($dbPassword)){ throw 'DATABASE_SECRET_EMPTY' }
  $jwt=New-RandomSecret 64
  @"
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=54329
DB_NAME=shahboun_lan
DB_USER=postgres
DB_PASSWORD=$dbPassword
JWT_SECRET=$jwt
JWT_EXPIRES_IN=12h
SERVER_NAME=Shahboun Server 6.0.1
TRIAL_HOURS=24
TRIAL_MAX_DEVICES=5
BACKUP_DIR=./backups
PG_DUMP_PATH=$pgDump
PG_RESTORE_PATH=$pgRestore
"@ | Set-Content -Encoding UTF8 '.env'
}

$cfg=@{}
Get-Content '.env' | ForEach-Object {
  if($_ -match '^([^#=]+)=(.*)$'){ $cfg[$matches[1]]=$matches[2] }
}
foreach($k in @('DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD')){
  if([string]::IsNullOrWhiteSpace($cfg[$k])){ throw "ENV_MISSING_$k" }
}

$env:PGPASSWORD=$cfg['DB_PASSWORD']
$dbName=$cfg['DB_NAME']
$exists=& $psql -h $cfg['DB_HOST'] -p $cfg['DB_PORT'] -U $cfg['DB_USER'] -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'"
if($LASTEXITCODE -ne 0){ throw 'POSTGRES_AUTH_FAILED' }
if(($exists | Out-String).Trim() -ne '1'){
  & $createdb -h $cfg['DB_HOST'] -p $cfg['DB_PORT'] -U $cfg['DB_USER'] $dbName
  if($LASTEXITCODE -ne 0){ throw 'DATABASE_CREATE_FAILED' }
}

if(!(Test-Path 'node_modules\express\package.json')){ throw 'NODE_MODULES_MISSING: Shahboun release package is incomplete.' }
& $nodeExe 'src\db\migrate.js'
if($LASTEXITCODE -ne 0){ throw 'DATABASE_MIGRATION_FAILED' }
& $nodeExe 'src\db\seed.js'
if($LASTEXITCODE -ne 0){ throw 'DATABASE_SEED_FAILED' }

if(Test-Path $secretFile){ Remove-Item $secretFile -Force -ErrorAction SilentlyContinue }
Write-Host 'Shahboun Suite 6.0.1 is ready.' -ForegroundColor Green
