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

[Tasks]
Name: "desktopicon"; Description: "Create a desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked
