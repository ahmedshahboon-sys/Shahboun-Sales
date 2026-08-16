$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$runtime=Join-Path $root 'runtime'
$node=Join-Path $runtime 'node\node.exe'
if(!(Test-Path $node)){ throw 'PACKAGED_NODE_RUNTIME_NOT_FOUND' }

$pgRoot=Join-Path $runtime 'postgresql'
$psql=Join-Path $pgRoot 'bin\psql.exe'
$pgReady=Join-Path $pgRoot 'bin\pg_isready.exe'
$serviceName='shahboun-postgresql-17'
$port='54329'
$secretFile=Join-Path $runtime '.db_secret'

function New-RandomSecret([int]$Length=36){
  $chars='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%_-'
  -join (1..$Length | ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })
}

if(!(Test-Path $psql)){
  $installer=Get-ChildItem (Join-Path $runtime 'postgresql-*.exe') -ErrorAction SilentlyContinue | Select-Object -First 1
  if(!$installer){ throw 'PACKAGED_POSTGRES_INSTALLER_NOT_FOUND' }

  $dbPassword=$null
  $envFile=Join-Path $root '.env'
  if(Test-Path $envFile){
    $line=Get-Content $envFile | Where-Object { $_ -match '^DB_PASSWORD=' } | Select-Object -First 1
    if($line){ $dbPassword=$line.Substring('DB_PASSWORD='.Length) }
  }
  if([string]::IsNullOrWhiteSpace($dbPassword)){
    if(Test-Path $secretFile){ $dbPassword=(Get-Content $secretFile -Raw).Trim() }
    else { $dbPassword=New-RandomSecret 36; Set-Content -Path $secretFile -Value $dbPassword -NoNewline -Encoding ASCII }
  }

  New-Item -ItemType Directory -Force $pgRoot | Out-Null
  $dataDir=Join-Path $runtime 'pgdata'
  $args=@(
    '--mode','unattended',
    '--unattendedmodeui','none',
    '--prefix',$pgRoot,
    '--datadir',$dataDir,
    '--serverport',$port,
    '--servicename',$serviceName,
    '--superpassword',$dbPassword
  )
  $p=Start-Process -FilePath $installer.FullName -ArgumentList $args -Wait -PassThru
  if($p.ExitCode -ne 0){ throw "POSTGRES_INSTALL_FAILED_$($p.ExitCode)" }
}

if(!(Test-Path $psql)){ throw 'POSTGRES_RUNTIME_MISSING_AFTER_INSTALL' }

if(Test-Path $pgReady){
  $ok=$false
  for($i=0;$i -lt 60;$i++){
    & $pgReady -h 127.0.0.1 -p $port | Out-Null
    if($LASTEXITCODE -eq 0){ $ok=$true; break }
    Start-Sleep -Seconds 2
  }
  if(!$ok){ throw 'POSTGRES_SERVICE_NOT_READY' }
}
