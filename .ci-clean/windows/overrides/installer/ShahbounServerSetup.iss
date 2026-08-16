#define MyAppName "Shahboun Server"
#define MyAppVersion "6.0.1"
#define MyAppPublisher "Ahmed Shahboun"
[Setup]
AppId={{A4F09936-4B15-49E2-A9D6-42F4EAF55601}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\Shahboun Server
DefaultGroupName=Shahboun
OutputBaseFilename=Shahboun_Server_Setup_6.0.1
Compression=lzma2/ultra64
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
SetupIconFile=shahboun.ico
UninstallDisplayIcon={app}\installer\shahboun.ico

[Files]
Source: "..\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: ".env,.git\*,backups\*,installer\Output\*,*.log,*.md"

[Icons]
Name: "{group}\Shahboun Server"; Filename: "{app}\START_SERVER.bat"; WorkingDir: "{app}"
Name: "{commondesktop}\منظومة شهبون للمبيعات"; Filename: "{app}\START_SERVER.bat"; WorkingDir: "{app}"

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\BOOTSTRAP_PREREQUISITES.ps1"""; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\FIRST_RUN_SETUP.ps1"""; Flags: runhidden waituntilterminated
Filename: "{app}\ENABLE_LAN_ACCESS.bat"; Flags: runhidden waituntilterminated
Filename: "{app}\INSTALL_SERVER_AUTOSTART.bat"; Flags: runhidden waituntilterminated
Filename: "{app}\START_SERVER.bat"; Description: "تشغيل منظومة شهبون"; Flags: postinstall nowait skipifsilent
