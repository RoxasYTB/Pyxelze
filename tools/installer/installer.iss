#ifndef ReleaseDir
#define ReleaseDir "..\\..\\publish_with_native"
#endif

[Setup]
AppId={{D3B9B9B3-C8C1-4A5A-9DEB-1B9B6B3A6F2E}}
AppName=Pyxelze
AppVersion=1.0.2
DefaultDirName={autopf}\Pyxelze
DefaultGroupName=Pyxelze
UninstallDisplayName=Pyxelze
UninstallDisplayIcon={app}\Pyxelze.exe
OutputDir=..\..\releases
OutputBaseFilename=Pyxelze-Setup
PrivilegesRequired=admin
SetupIconFile=..\..\appIcon.ico
Compression=none
SolidCompression=no
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



[UninstallRun]
Filename: "{app}\Pyxelze.exe"; Parameters: "unregister-contextmenu"; Flags: runhidden waituntilterminated

[Code]
const EnvironmentKey = 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment';

// Ensure we remove previous installation tree and common VirtualStore leftovers
function InitializeSetup(): Boolean;
var
  AppDir: String;
  VirtDir: String;
  Candidate1: String;
  Candidate2: String;
  Cmd: String;
  ExecOK: Boolean;
  ResultCode: Integer;
begin
  // {app} is not yet initialized when InitializeSetup runs; use likely install locations instead
  try
    Candidate1 := ExpandConstant('{localappdata}\Programs\Pyxelze');
    Candidate2 := ExpandConstant('{autopf}\Pyxelze');
  except
    Candidate1 := '';
    Candidate2 := '';
  end;

  // Remove existing install dir in common locations to force a clean install (best-effort)
  if (Candidate1 <> '') and DirExists(Candidate1) then
  begin
    DelTree(Candidate1, True, True, True);
  end
  else if (Candidate2 <> '') and DirExists(Candidate2) then
  begin
    DelTree(Candidate2, True, True, True);
  end;

  // Also remove VirtualStore copy for current user, if present
  try
    VirtDir := ExpandConstant('{localappdata}\VirtualStore\Program Files\Pyxelze');
    if DirExists(VirtDir) then
    begin
      DelTree(VirtDir, True, True, True);
    end;
  except
    // ignore
  end;

  // Attempt to remove VirtualStore copies for all user profiles (best-effort)
  try
    if FileExists(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe')) then
    begin
      Cmd := '-NoProfile -ExecutionPolicy Bypass -Command "try { Get-ChildItem -Path C:\Users -Directory -ErrorAction SilentlyContinue | ForEach-Object { $u=$_; $p=(Join-Path $u.FullName ''AppData\\Local\\VirtualStore\\Program Files\\Pyxelze''); if (Test-Path $p) { Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue; Write-Output $p } $p2=(Join-Path $u.FullName ''AppData\\Local\\VirtualStore\\Program Files (x86)\\Pyxelze''); if (Test-Path $p2) { Remove-Item -Recurse -Force $p2 -ErrorAction SilentlyContinue; Write-Output $p2 } } exit 0 } catch { exit 1 }"';
      ExecOK := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if ExecOK and (ResultCode = 0) then
        SaveStringToFile(ExpandConstant('{tmp}\pyxelze_install.log'), 'VirtualStore cleanup attempted for all users', True);
    end;
  except
    // ignore
  end;

  Result := True;
end;

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
  HashFile: string;
  TmpHashFile: string;
  ExpHash: string;
  InstHash: string;
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

    // Verify installed executable checksum matches published checksum (if provided)


    HashFile := ExpandConstant('{app}\sha256sums.txt');
    TmpHashFile := ExpandConstant('{tmp}\pyxelze_installed_hash.txt');

    if FileExists(HashFile) then
    begin
      // Compare installed executable SHA256 with the published sha256sums.txt (best-effort via PowerShell)
      if FileExists(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe')) then
      begin
        Cmd := '-NoProfile -Command "try { $installed=(Get-FileHash -Algorithm SHA256 -Path ''' + ExpandConstant('{app}\Pyxelze.exe') + ''' | Select -ExpandProperty Hash).Trim(); $expected=(Get-Content -Path ''' + ExpandConstant('{app}\sha256sums.txt') + ''' | Select-Object -First 1).Trim(); if ($installed -eq $expected) { exit 0 } else { exit 2 } } catch { exit 1 }"';
        ExecOK := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      end
      else
        ExecOK := False;

      if not ExecOK or (ResultCode = 1) then
      begin
        MsgBox('Vérification de l''intégrité impossible (PowerShell indisponible ou échec).', mbInformation, MB_OK);
        SaveStringToFile(ExpandConstant('{tmp}\pyxelze_install.log'), 'Checksum verification: could not compute installed hash', True);
      end
      else if ResultCode = 2 then
      begin
        MsgBox('Avertissement: le checksum de l''exécutable installé ne correspond pas au checksum publié. L''installation peut être incorrecte. Merci de réessayer ou contacter le support.', mbError, MB_OK);
        SaveStringToFile(ExpandConstant('{tmp}\pyxelze_install.log'), 'Checksum mismatch - aborting post-install tasks', True);
        exit; // abort remaining post-install tasks
      end
      else
      begin
        SaveStringToFile(ExpandConstant('{tmp}\pyxelze_install.log'), 'Checksum OK', True);
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

    if FileExists(ExpandConstant('{app}\roxify')) then
      MsgBox('Si nécessaire, tu peux ajouter une exclusion manuellement dans Sécurité Windows → Protection contre les virus et menaces → Gérer les paramètres → Exclusions en ajoutant le dossier : ' + ExpandConstant('{app}\roxify'), mbInformation, MB_OK);

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
  end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  EnvPath: string;
  RoxPath: string;
  P: Integer;
  ResultCode: Integer;
  ExecOK: Boolean;
  Cmd: string;
  LclProgDir: string;
  UserDataDir: string;
  ActionsMsg: string;
begin
  ActionsMsg := '';

  if CurUninstallStep = usPostUninstall then
  begin
    RoxPath := ExpandConstant('{app}\roxify');

    // Remove any PATH entries we added during installation
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
        ActionsMsg := ActionsMsg + 'PATH entry for roxify removed.' + #13#10;
      end
      else
      begin
        ActionsMsg := ActionsMsg + 'No PATH entry for roxify found.' + #13#10;
      end;
    end
    else
      ActionsMsg := ActionsMsg + 'PATH not read; cannot modify PATH.' + #13#10;

    // Attempt to remove Windows Defender exclusion for roxify (best-effort)
    if FileExists(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe')) then
    begin
      Cmd := '-NoProfile -ExecutionPolicy Bypass -Command "try { Remove-MpPreference -ExclusionPath ''' + ExpandConstant('{app}\roxify') + ''' -ErrorAction Stop; exit 0 } catch { exit 1 }"';
      ExecOK := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if ExecOK and (ResultCode = 0) then
        ActionsMsg := ActionsMsg + 'Windows Defender exclusion removed (if it existed).' + #13#10
      else
        ActionsMsg := ActionsMsg + 'Windows Defender exclusion removal skipped or failed.' + #13#10;
    end
    else
      ActionsMsg := ActionsMsg + 'PowerShell not available: skipped Defender exclusion removal.' + #13#10;

    // Remove per-user install tree (if present) and settings
    LclProgDir := ExpandConstant('{localappdata}\Programs\Pyxelze');
    if DirExists(LclProgDir) then
    begin
      DelTree(LclProgDir, True, True, True);
      if not DirExists(LclProgDir) then
        ActionsMsg := ActionsMsg + 'Removed: ' + LclProgDir + #13#10
      else
        ActionsMsg := ActionsMsg + 'Failed to remove: ' + LclProgDir + #13#10;
    end
    else
      ActionsMsg := ActionsMsg + 'Not found: ' + LclProgDir + #13#10;

    UserDataDir := ExpandConstant('{userappdata}\Pyxelze');
    if DirExists(UserDataDir) then
    begin
      DelTree(UserDataDir, True, True, True);
      if not DirExists(UserDataDir) then
        ActionsMsg := ActionsMsg + 'Removed: ' + UserDataDir + #13#10
      else
        ActionsMsg := ActionsMsg + 'Failed to remove: ' + UserDataDir + #13#10;
    end
    else
      ActionsMsg := ActionsMsg + 'Not found: ' + UserDataDir + #13#10;

    // Remove HKCU settings (best-effort via PowerShell)
    if FileExists(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe')) then
    begin
      Cmd := '-NoProfile -ExecutionPolicy Bypass -Command "try { Remove-Item -Path ''HKCU:\\Software\\Pyxelze'' -Recurse -Force -ErrorAction SilentlyContinue; exit 0 } catch { exit 1 }"';
      ExecOK := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if ExecOK and (ResultCode = 0) then
        ActionsMsg := ActionsMsg + 'Removed HKCU\Software\Pyxelze (if it existed).' + #13#10
      else
        ActionsMsg := ActionsMsg + 'HKCU key removal skipped or failed.' + #13#10;
    end
    else
      ActionsMsg := ActionsMsg + 'PowerShell not available: skipped HKCU key removal.' + #13#10;

    // Attempt to remove VirtualStore copies for all Windows user profiles (best-effort using PowerShell)
    if FileExists(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe')) then
    begin
      Cmd := '-NoProfile -ExecutionPolicy Bypass -Command "try { Get-ChildItem -Path C:\\Users -Directory -ErrorAction SilentlyContinue | ForEach-Object { $u=$_; $p=(Join-Path $u.FullName ''AppData\\Local\\VirtualStore\\Program Files\\Pyxelze''); if (Test-Path $p) { Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue; Write-Output $p } $p2=(Join-Path $u.FullName ''AppData\\Local\\VirtualStore\\Program Files (x86)\\Pyxelze''); if (Test-Path $p2) { Remove-Item -Recurse -Force $p2 -ErrorAction SilentlyContinue; Write-Output $p2 } } exit 0 } catch { exit 1 }"';
      ExecOK := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'), Cmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if ExecOK and (ResultCode = 0) then
        ActionsMsg := ActionsMsg + 'Attempted removal of VirtualStore copies (see logs for details).' + #13#10
      else
        ActionsMsg := ActionsMsg + 'VirtualStore cleanup skipped or failed.' + #13#10;
    end
    else
      ActionsMsg := ActionsMsg + 'PowerShell not available: skipped VirtualStore cleanup.' + #13#10;

    // Unregister context menu
    ExecOK := Exec(ExpandConstant('{app}\Pyxelze.exe'), 'unregister-contextmenu', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    if ExecOK and (ResultCode = 0) then
      ActionsMsg := ActionsMsg + 'Context menu unregistered.' + #13#10
    else
      ActionsMsg := ActionsMsg + 'Context menu unregister skipped or failed.' + #13#10;

    // Show final summary to user
    MsgBox('Désinstallation terminée. Résumé des actions :' + #13#10#13#10 + ActionsMsg, mbInformation, MB_OK);

  end;
end;

