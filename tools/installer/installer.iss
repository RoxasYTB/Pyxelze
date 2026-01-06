[Setup]
AppName=Pyxelze
AppVersion=1.0.0
DefaultDirName={autopf}\Pyxelze
DefaultGroupName=Pyxelze
OutputDir=.
OutputBaseFilename=Pyxelze-Setup
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "{#PublishDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Pyxelze"; Filename: "{app}\Pyxelze.exe"
Name: "{commondesktop}\Pyxelze"; Filename: "{app}\Pyxelze.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes additionnelles:"

[Run]
Filename: "{app}\Pyxelze.exe"; Description: "Lancer Pyxelze"; Flags: nowait postinstall skipifsilent
