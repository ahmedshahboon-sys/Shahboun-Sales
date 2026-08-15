$ErrorActionPreference='Stop'
$root=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$runtime=Join-Path $root 'runtime'
$node=Join-Path $runtime 'node\node.exe'
if(!(Test-Path $node)){throw 'PACKAGED_NODE_RUNTIME_NOT_FOUND'}

$pgPort=55432
$pgService='ShahbounPostgres'
$secretFile=Join-Path $runtime '.db_secret'
$pgRoot=Join-Path $runtime 'postgres'
$pgBin=Join-Path $pgRoot 'bin'
$psql=Join-Path $pgBin 'psql.exe'

function New-Secret([int]$Length=40){$chars='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%_-';-join(1..$Length|%{$chars[(Get-Random -Minimum 0 -Maximum $chars.Length)]})}

if(!(Test-Path $psql)){
  $installer=Get-ChildItem (Join-Path $runtime 'postgresql-*-windows-x64.exe') -ErrorAction SilentlyContinue|Select-Object -First 1
  if(!$installer){throw 'PACKAGED_POSTGRES_INSTALLER_NOT_FOUND'}
  $pwd=New-Secret 40
  New-Item -ItemType Directory -Force -Path $pgRoot|Out-Null
  Set-Content -Path $secretFile -Value $pwd -NoNewline -Encoding ASCII
  try{icacls $secretFile /inheritance:r /grant:r "$env:USERNAME:(R,W)" 'SYSTEM:(F)'|Out-Null}catch{}
  $args=@('--mode','unattended','--unattendedmodeui','none','--prefix',$pgRoot,'--datadir',(Join-Path $pgRoot 'data'),'--superpassword',$pwd,'--serverport',"$pgPort",'--servicename',$pgService)
  $p=Start-Process -FilePath $installer.FullName -ArgumentList $args -Wait -PassThru
  if($p.ExitCode -ne 0){throw "POSTGRES_INSTALL_FAILED_$($p.ExitCode)"}
}
if(!(Test-Path $psql)){throw 'SHAHBOUN_POSTGRES_NOT_READY'}
Write-Host "Shahboun private PostgreSQL ready on 127.0.0.1:$pgPort" -ForegroundColor Green
