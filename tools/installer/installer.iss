#define PublishDir "..\..\bin\Release\net7.0-windows"

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
CloseApplications=force
RestartApplications=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "{#PublishDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs; Excludes: "\tools\roxify\node_modules,\tools\roxify\node_modules\*,\tools\roxify\roxify,\tools\roxify\roxify\*"

[Icons]
Name: "{group}\Pyxelze"; Filename: "{app}\Pyxelze.exe"
Name: "{commondesktop}\Pyxelze"; Filename: "{app}\Pyxelze.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes additionnelles:"



[Run]
Filename: "{app}\Pyxelze.exe"; Parameters: "register-contextmenu"; StatusMsg: "Enregistrement du menu contextuel..."; Flags: runhidden waituntilterminated
Filename: "{app}\Pyxelze.exe"; Description: "Lancer Pyxelze"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\Pyxelze.exe"; Parameters: "unregister-contextmenu"; Flags: runhidden waituntilterminated

[Code]
const EnvironmentKey = 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment';

procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvPath: string;
  RoxPath: string;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    RoxPath := ExpandConstant('{app}\tools\roxify');
    if RegQueryStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', EnvPath) then
    begin
      if Pos(Uppercase(RoxPath), Uppercase(EnvPath)) = 0 then
      begin
        if Length(EnvPath) > 0 then
        begin
          if EnvPath[Length(EnvPath)] <> ';' then
            EnvPath := EnvPath + ';';
        end;
        EnvPath := EnvPath + RoxPath;
        RegWriteExpandStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', EnvPath);
        Exec('cmd.exe', '/c setx PATH "' + EnvPath + '" /M', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      end;
    end;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  EnvPath: string;
  RoxPath: string;
  P: Integer;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    RoxPath := ExpandConstant('{app}\tools\roxify');
    if RegQueryStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', EnvPath) then
    begin
      P := Pos(Uppercase(RoxPath), Uppercase(EnvPath));
      if P > 0 then
      begin
        Delete(EnvPath, P, Length(RoxPath));
        if (P > 1) and (EnvPath[P-1] = ';') then
          Delete(EnvPath, P-1, 1)
        else if (P <= Length(EnvPath)) and (EnvPath[P] = ';') then
          Delete(EnvPath, P, 1);
        RegWriteExpandStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', EnvPath);
      end;
    end;
  end;
end;
