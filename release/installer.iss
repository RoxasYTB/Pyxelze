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
Source: "{#ProjectPath}\production\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs; Excludes: "\node_modules,\node_modules\*,\roxify\node_modules,\roxify\node_modules\*"

[Icons]
Name: "{autoprograms}\Pyxelze"; Filename: "{app}\Pyxelze.exe"
Name: "{autodesktop}\Pyxelze"; Filename: "{app}\Pyxelze.exe"; Tasks: desktopicon

[Registry]
; Context menu integration is handled by the application post-install (no installer prompt)

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes supplémentaires:"; Flags: unchecked
