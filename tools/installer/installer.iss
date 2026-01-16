#ifndef ReleaseDir
#define ReleaseDir "..\\..\\publish_with_native"
#endif

[Setup]
AppId={{D3B9B9B3-C8C1-4A5A-9DEB-1B9B6B3A6F2E}}
AppName=Pyxelze
AppVersion=1.0.1
DefaultDirName={autopf}\Pyxelze
DefaultGroupName=Pyxelze
UninstallDisplayName=Pyxelze
UninstallDisplayIcon={app}\Pyxelze.exe
OutputDir=..\..\releases
OutputBaseFilename=Pyxelze-Setup
PrivilegesRequired=admin
SetupIconFile=..\..\appIcon.ico
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
CloseApplications=force
RestartApplications=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
Source: "{#ReleaseDir}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs; Excludes: "\tools\roxify\dist\rox.exe,\tools\roxify\roxify,\tools\roxify\roxify\*,\win-x64,\win-x64\*,\artifacts\*,*.tar.gz"

[Icons]
Name: "{group}\Pyxelze"; Filename: "{app}\Pyxelze.exe"
Name: "{commondesktop}\Pyxelze"; Filename: "{app}\Pyxelze.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le bureau"; GroupDescription: "Icônes additionnelles:"
Name: "defenderexcl"; Description: "Ajouter une exclusion Windows Defender pour Pyxelze (recommandé)"; GroupDescription: "Sécurité:"



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
  ExecOK: Boolean;
  Cmd: string;
  RoxExePath: string;
  NodePathA: string;
  NodePathB: string;
  NodePathC: string;
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
    ExecOK := Exec(ExpandConstant('{app}\Pyxelze.exe'), 'register-contextmenu', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    if not ExecOK then
    begin
      MsgBox('Attention: impossible d''exécuter "' + ExpandConstant('{app}\Pyxelze.exe') + '" pour l''enregistrement du menu contextuel. Il est possible que le binaire installé ne soit pas la bonne version (ex. binaire Linux).\n\nMerci de vérifier que tu utilises la version Windows de Pyxelze.', mbError, MB_OK);
    end
    else if ResultCode <> 0 then
    begin
      MsgBox('La commande d''enregistrement du menu contextuel a renvoyé le code ' + IntToStr(ResultCode) + '. Si le problème persiste, vérifie le binaire dans le dossier d''installation.', mbError, MB_OK);
    end;

    // If the user asked, try to add a Windows Defender exclusion for the roxify folder
    if WizardIsTaskSelected('defenderexcl') then
    begin
      if FileExists(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe')) then
      begin
        Cmd := '-NoProfile -ExecutionPolicy Bypass -Command "try { Add-MpPreference -ExclusionPath ''' + ExpandConstant('{app}\roxify') + ''' -ErrorAction Stop; exit 0 } catch { exit 1 }"';
        ExecOK := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
        if not ExecOK or (ResultCode <> 0) then
        begin
          MsgBox('Impossible d''ajouter automatiquement l''exclusion Windows Defender pour : ' + ExpandConstant('{app}\roxify') + #13#10 + 'Tu peux l''ajouter manuellement depuis Sécurité Windows → Protection contre les virus et menaces → Gérer les paramètres → Exclusions.', mbInformation, MB_OK);
        end;
      end
      else
        MsgBox('PowerShell introuvable; impossible d''ajouter l''exclusion Windows Defender automatiquement.', mbInformation, MB_OK);
    end;

    // Verify roxify native artifacts exist (either CLI .exe or native module .node)
    RoxExePath := ExpandConstant('{app}\roxify\roxify_native.exe');
    NodePathA := ExpandConstant('{app}\roxify\libroxify_native.node');
    NodePathB := ExpandConstant('{app}\libroxify_native.node');
    NodePathC := ExpandConstant('{app}\tools\roxify\libroxify_native.node');

    // Do not execute roxify during install (can trigger Defender scans); just verify presence
    if FileExists(RoxExePath) then
      ExecOK := True
    else if FileExists(NodePathA) or FileExists(NodePathB) or FileExists(NodePathC) then
      ExecOK := True
    else
      MsgBox('Aucun binaire roxify natif trouvé (ni roxify_native.exe ni libroxify_native.node). Certaines fonctionnalités peuvent être limitées.', mbError, MB_OK);

    // Informative message if roxify exists but was not executed (to avoid triggering antivirus during install)
    if FileExists(RoxExePath) and not ExecOK then
      MsgBox('Le binaire roxify_native.exe est présent, mais nous n''exécutons pas automatiquement les binaires pendant l''installation afin d''éviter des analyses antivirus. Si nécessaire, exécute "roxify_native.exe --version" manuellement pour vérifier le binaire.', mbInformation, MB_OK);

    end;
  end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  EnvPath: string;
  RoxPath: string;
  P: Integer;
  ResultCode: Integer;
  ExecOK: Boolean;
  Cmd: string;
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

    // Attempt to remove Windows Defender exclusion for roxify (best-effort)
    if FileExists(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe')) then
    begin
      Cmd := '-NoProfile -ExecutionPolicy Bypass -Command "try { Remove-MpPreference -ExclusionPath ''' + ExpandConstant('{app}\roxify') + ''' -ErrorAction Stop; exit 0 } catch { exit 1 }"';
      ExecOK := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      // ignore result; uninstall should continue
    end;
  end;
end;
