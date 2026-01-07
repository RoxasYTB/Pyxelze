[Setup]
AppName=Pyxelze
AppVersion=1.0.0
DefaultDirName={localappdata}\Programs\Pyxelze
DefaultGroupName=Pyxelze
OutputDir=.
OutputBaseFilename=Pyxelze-Setup
SetupIconFile={#ProjectPath}\appIcon.ico
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "{#ProjectPath}\production\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\Pyxelze"; Filename: "{app}\Pyxelze.exe"
Name: "{autodesktop}\Pyxelze"; Filename: "{app}\Pyxelze.exe"; Tasks: desktopicon

[Registry]
Root: HKCR; Subkey: "*\shell\PyxelzeOpen"; ValueType: string; ValueName: ""; ValueData: "Ouvrir avec Pyxelze"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKCR; Subkey: "*\shell\PyxelzeOpen"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\Pyxelze.exe"; Tasks: contextmenu
Root: HKCR; Subkey: "*\shell\PyxelzeOpen\command"; ValueType: string; ValueName: ""; ValueData: """{app}\Pyxelze.exe"" ""%1"""; Tasks: contextmenu

Root: HKCR; Subkey: "Directory\shell\PyxelzeExtract"; ValueType: string; ValueName: ""; ValueData: "Extraire vers dossier"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKCR; Subkey: "Directory\shell\PyxelzeExtract"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\Pyxelze.exe"; Tasks: contextmenu
Root: HKCR; Subkey: "Directory\shell\PyxelzeExtract\command"; ValueType: string; ValueName: ""; ValueData: """{app}\Pyxelze.exe"" extract ""%1"""; Tasks: contextmenu

Root: HKCR; Subkey: "Directory\shell\PyxelzeCompress"; ValueType: string; ValueName: ""; ValueData: "Compresser vers archive.png"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKCR; Subkey: "Directory\shell\PyxelzeCompress"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\Pyxelze.exe"; Tasks: contextmenu
Root: HKCR; Subkey: "Directory\shell\PyxelzeCompress\command"; ValueType: string; ValueName: ""; ValueData: """{app}\Pyxelze.exe"" compress ""%1"""; Tasks: contextmenu

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes supplémentaires:"; Flags: unchecked
Name: "contextmenu"; Description: "Ajouter l'intégration au menu contextuel (clic droit)"; GroupDescription: "Intégration Windows:"; Flags: unchecked
