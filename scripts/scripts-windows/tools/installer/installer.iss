#define MyAppName "Pyxelze"
#define MyAppVersion "1.3.1"
#define MyAppPublisher "Pyxelze"
#define MyAppURL "https://github.com/RoxasYTB/Pyxelze"
#define MyAppExeName "Pyxelze.exe"

#ifndef PublishDir
  #define PublishDir "..\..\..\..\publish_final"
#endif

[Setup]
AppId={{A3F12B4E-7C89-4D56-B8E1-9F3A2C5D7E41}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\..\..\..\LICENSE
OutputDir=..\..\..\..\installer_output
OutputBaseFilename=Pyxelze-Setup-{#MyAppVersion}
SetupIconFile={#PublishDir}\appIcon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
ChangesAssociations=yes

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "fileassoc"; Description: "Associer les fichiers .png (Rox) avec Pyxelze"; GroupDescription: "Associations de fichiers:"

[Files]
Source: "{#PublishDir}\Pyxelze.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#PublishDir}\Pyxelze.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#PublishDir}\Pyxelze.deps.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#PublishDir}\Pyxelze.runtimeconfig.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#PublishDir}\appIcon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#PublishDir}\roxify\*"; DestDir: "{app}\roxify"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCR; Subkey: ".roxpng"; ValueType: string; ValueName: ""; ValueData: "Pyxelze.RoxArchive"; Flags: uninsdeletevalue; Tasks: fileassoc
Root: HKCR; Subkey: "Pyxelze.RoxArchive"; ValueType: string; ValueName: ""; ValueData: "Archive Rox (Pyxelze)"; Flags: uninsdeletekey; Tasks: fileassoc
Root: HKCR; Subkey: "Pyxelze.RoxArchive\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\appIcon.ico,0"; Tasks: fileassoc
Root: HKCR; Subkey: "Pyxelze.RoxArchive\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: fileassoc

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "register-contextmenu"; StatusMsg: "Installation du menu contextuel..."; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\{#MyAppExeName}"; Parameters: "unregister-contextmenu"; Flags: runhidden waituntilterminated
