#define PublishDir "..\..\publish_final"

[Setup]
AppName=Pyxelze
AppVersion=1.0.1
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
Source: "{#PublishDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs; Excludes: "\tools\roxify\roxify,\tools\roxify\roxify\*,\win-x64,\win-x64\*"

[Icons]
Name: "{group}\Pyxelze"; Filename: "{app}\Pyxelze.exe"
Name: "{commondesktop}\Pyxelze"; Filename: "{app}\Pyxelze.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes additionnelles:"



[UninstallRun]
Filename: "{app}\Pyxelze.exe"; Parameters: "unregister-contextmenu"; Flags: runhidden waituntilterminated

[Code]
const EnvironmentKey = 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment';

function SendMessageTimeout(hWnd: Integer; Msg: Integer; wParam: Integer; lParam: String;
  fuFlags: Integer; uTimeout: Integer; var lpdwResult: Cardinal): Integer;
  external 'SendMessageTimeoutA@user32.dll stdcall';

procedure BroadcastEnvironmentChange;
var
  ReturnValue: Cardinal;
begin
  SendMessageTimeout($FFFF, $001A, 0, 'Environment', 2, 5000, ReturnValue);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvPath: string;
  RoxPath: string;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    RoxPath := ExpandConstant('{app}\roxify');
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
        BroadcastEnvironmentChange;
      end;
    end;

    // Try to register context menu, but handle failures gracefully
    var ExecOK: Boolean;
    ExecOK := Exec(ExpandConstant('{app}\Pyxelze.exe'), 'register-contextmenu', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    if not ExecOK then
    begin
      MsgBox('Attention: impossible d''exécuter "' + ExpandConstant('{app}\Pyxelze.exe') + '" pour l''enregistrement du menu contextuel. Il est possible que le binaire installé ne soit pas la bonne version (ex. binaire Linux).\n\nMerci de vérifier que tu utilises la version Windows de Pyxelze.', mbError, MB_OK);
    end
    else if ResultCode <> 0 then
    begin
      MsgBox('La commande d''enregistrement du menu contextuel a renvoyé le code ' + IntToStr(ResultCode) + '. Si le problème persiste, vérifie le binaire dans le dossier d''installation.', mbError, MB_OK);
    end;

    // Verify roxify binary exists and is runnable
    if not FileExists(ExpandConstant('{app}\roxify\roxify_native.exe')) then
    begin
      MsgBox('Le binaire roxify (roxify_native.exe) est absent de l''installation. Certaines fonctionnalités peuvent être limitées.', mbError, MB_OK);
    end
    else
    begin
      ExecOK := Exec(ExpandConstant('{app}\roxify\roxify_native.exe'), '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if not ExecOK or (ResultCode <> 0) then
      begin
        MsgBox('Le binaire roxify_native.exe est présent mais n''a pas pu s''exécuter correctement (code: ' + IntToStr(ResultCode) + '). Vérifie l''architecture du binaire.', mbError, MB_OK);
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
    RoxPath := ExpandConstant('{app}\roxify');
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
