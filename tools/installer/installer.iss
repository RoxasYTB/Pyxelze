[Setup]
AppName=Pyxelze - Rox CLI
AppVersion=1.0.0
DefaultDirName={localappdata}\Programs\Pyxelze\rox
DefaultGroupName=Pyxelze
OutputDir=.
OutputBaseFilename=Pyxelze-Rox-Setup
Compression=lzma
SolidCompression=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; ReleaseDir is provided via ISCC /DReleaseDir="path"
Source: "{#ReleaseDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Rox (CLI)"; Filename: "{app}\rox.cmd"

[Run]
Filename: "{app}\install-rox.cmd"; Flags: shellexec postinstall runascurrentuser
