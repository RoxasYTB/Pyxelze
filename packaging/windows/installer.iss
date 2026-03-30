#define MyAppName "Pyxelze"
#ifndef MyAppVersion
  #define MyAppVersion "1.3.1"
#endif
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
OutputDir=..\..\build
OutputBaseFilename=Pyxelze-{#MyAppVersion}-Setup
SetupIconFile=..\..\appIcon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
ChangesAssociations=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"; LicenseFile: "..\..\LICENSE"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"; LicenseFile: "..\..\LICENSE_FR"
Name: "german"; MessagesFile: "compiler:Languages\German.isl"; LicenseFile: "..\..\LICENSE_DE"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"; LicenseFile: "..\..\LICENSE_ES"
Name: "italian"; MessagesFile: "compiler:Languages\Italian.isl"; LicenseFile: "..\..\LICENSE_IT"
Name: "portuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"; LicenseFile: "..\..\LICENSE_PT"
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"; LicenseFile: "..\..\LICENSE_PL"
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"; LicenseFile: "..\..\LICENSE_TR"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"; LicenseFile: "..\..\LICENSE_RU"
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"; LicenseFile: "..\..\LICENSE_JA"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "associatepng"; Description: "Associate with .png files (steganography archives)"; GroupDescription: "File associations:"

[Files]
Source: "..\..\build\deploy\pyxelze.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\build\deploy\roxify\roxify_native.exe"; DestDir: "{app}\roxify"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\..\appIcon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\LICENSE_FR"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\build\deploy\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\..\build\deploy\platforms\*"; DestDir: "{app}\platforms"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "..\..\build\deploy\styles\*"; DestDir: "{app}\styles"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "..\..\build\deploy\imageformats\*"; DestDir: "{app}\imageformats"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "..\..\build\deploy\iconengines\*"; DestDir: "{app}\iconengines"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "..\..\build\deploy\tls\*"; DestDir: "{app}\tls"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "..\..\build\deploy\networkinformation\*"; DestDir: "{app}\networkinformation"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\appIcon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\appIcon.ico"; Tasks: desktopicon

[Registry]
Root: HKA; Subkey: "Software\Classes\.pxz"; ValueType: string; ValueName: ""; ValueData: "PyxelzeArchive"; Flags: uninsdeletevalue; Tasks: associatepng
Root: HKA; Subkey: "Software\Classes\PyxelzeArchive"; ValueType: string; ValueName: ""; ValueData: "Pyxelze Archive"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\PyxelzeArchive\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKA; Subkey: "Software\Classes\PyxelzeArchive\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\appIcon.ico"
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\open"; ValueType: string; ValueName: ""; ValueData: "Open archive"
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\extractHere"; ValueType: string; ValueName: ""; ValueData: "Extract here"
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\extractHere\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" --extract-here ""%1"""
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\extractTo"; ValueType: string; ValueName: ""; ValueData: "Extract to folder..."
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\extractTo\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" --extract-to ""%1"""
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\encode"; ValueType: string; ValueName: ""; ValueData: "Encode"
Root: HKCU; Subkey: "Software\Classes\*\shell\Pyxelze\shell\encode\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" --encode ""%1"""

Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\appIcon.ico"
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\open"; ValueType: string; ValueName: ""; ValueData: "Open archive"
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\extractHere"; ValueType: string; ValueName: ""; ValueData: "Extract here"
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\extractHere\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" --extract-here ""%1"""
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\extractTo"; ValueType: string; ValueName: ""; ValueData: "Extract to folder..."
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\extractTo\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" --extract-to ""%1"""
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\encode"; ValueType: string; ValueName: ""; ValueData: "Encode"
Root: HKCU; Subkey: "Software\Classes\Directory\shell\Pyxelze\shell\encode\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" --encode ""%1"""

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
