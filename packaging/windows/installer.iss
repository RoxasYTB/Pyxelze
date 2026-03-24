#define MyAppName "Pyxelze"
#define MyAppVersion "1.2.2"
#define MyAppPublisher "Yohan SANNIER"
#define MyAppURL "https://github.com/RoxasYTB/Pyxelze"
#define MyAppExeName "pyxelze.exe"

[Setup]
AppId={{E8A7F3B2-4C1D-4E5F-9A8B-1C2D3E4F5A6B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\..\LICENSE
OutputDir=..\..\build
OutputBaseFilename=Pyxelze-{#MyAppVersion}-Setup
SetupIconFile=..\..\appIcon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
ChangesAssociations=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "german"; MessagesFile: "compiler:Languages\German.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "italian"; MessagesFile: "compiler:Languages\Italian.isl"
Name: "portuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "associatepng"; Description: "Associate with .png files (steganography archives)"; GroupDescription: "File associations:"

[Files]
Source: "..\..\build\pyxelze.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\build\roxify\roxify_native.exe"; DestDir: "{app}\roxify"; Flags: ignoreversion
Source: "..\..\appIcon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
; Qt6 DLLs - must be deployed with windeployqt before building installer
Source: "..\..\build\deploy\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKA; Subkey: "Software\Classes\.pxz"; ValueType: string; ValueName: ""; ValueData: "PyxelzeArchive"; Flags: uninsdeletevalue; Tasks: associatepng
Root: HKA; Subkey: "Software\Classes\PyxelzeArchive"; ValueType: string; ValueName: ""; ValueData: "Pyxelze Archive"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\PyxelzeArchive\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKA; Subkey: "Software\Classes\PyxelzeArchive\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
