#define MyAppName "Pyxelze"
#define MyAppVersion "1.2.2"
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
Source: "{#PublishDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "roxify\*,roxify"
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

Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: ""; ValueData: ""; Flags: uninsdeletekey
Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"
Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: "open;decode"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\open"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Ouvrir l'archive"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\open"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\decode"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Décoder"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\decode"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\decode\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" decode ""%1"""
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: ""; ValueData: ""; Flags: uninsdeletekey
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: "encode"
Root: HKCR; Subkey: "Directory\shell\Pyxelze\shell\encode"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Encoder"
Root: HKCR; Subkey: "Directory\shell\Pyxelze\shell\encode"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "Directory\shell\Pyxelze\shell\encode\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" compress ""%1"""

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    RegDeleteKeyIncludingSubkeys(HKEY_CLASSES_ROOT, '*\shell\Pyxelze');
    RegDeleteKeyIncludingSubkeys(HKEY_CLASSES_ROOT, 'Directory\shell\Pyxelze');
  end;
end;
