[Setup]
AppName=Pyxelze
AppVersion=1.0
DefaultDirName={localappdata}\Programs\Pyxelze
DefaultGroupName=Pyxelze
OutputDir=release\windows
OutputBaseFilename=Pyxelze-Setup
SetupIconFile=D:\Users\yohan\Bureau\Pyxelze\release\windows\appIcon.ico
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Créer un raccourci sur le Bureau"; GroupDescription: "Options d'installation:"

[Files]
Source: "D:\\Users\\yohan\\Bureau\\Pyxelze\\release\\windows\\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Pyxelze"; Filename: "{app}\Pyxelze-win_x64.exe"
Name: "{userdesktop}\Pyxelze"; Filename: "{app}\Pyxelze-win_x64.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Pyxelze-win_x64.exe"; Description: "Lancer Pyxelze"; Flags: nowait postinstall skipifsilent

[Registry]
; Files context menu
; Ensure no leftover default command remains on the top-level key (would make it a single action instead of a submenu)
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\command"; Flags: deletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze"; ValueType: string; ValueName: ""; Flags: deletevalue
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\\Pyxelze-win_x64.exe"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: ""; Flags: uninsdeletekey

Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Open"; ValueType: string; ValueName: ""; ValueData: "Ouvrir l'archive"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Open"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\\Pyxelze-win_x64.exe"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Open\\command"; ValueType: string; ValueName: ""; ValueData: """{app}\\Pyxelze-win_x64.exe"" ""%1"""; Flags: uninsdeletekey

; Decode/Encode actions
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Decode"; ValueType: string; ValueName: ""; ValueData: "Décoder l'archive ROX"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Decode"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\\Pyxelze-win_x64.exe"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Decode\\command"; ValueType: string; ValueName: ""; ValueData: "cmd.exe /C start """" /MIN powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\\resources\\rox-options-dialog.ps1"" -Mode decode -FilePath ""%1"" -WorkingDir ""%W"" -ExePath ""{app}\\Pyxelze-win_x64.exe"""; Flags: uninsdeletekey

Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Encode"; ValueType: string; ValueName: ""; ValueData: "Encoder en archive ROX"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Encode"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\\Pyxelze-win_x64.exe"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\*\\shell\\Pyxelze\\shell\\Encode\\command"; ValueType: string; ValueName: ""; ValueData: "cmd.exe /C start """" /MIN powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\\resources\\rox-options-dialog.ps1"" -Mode encode -FilePath ""%1"" -WorkingDir ""%W"" -ExePath ""{app}\\Pyxelze-win_x64.exe"""; Flags: uninsdeletekey

; Directory context menu (encode)
; Ensure no leftover default command remains on directory-level key
Root: HKCU; Subkey: "Software\\Classes\\Directory\\shell\\Pyxelze\\command"; Flags: deletekey
Root: HKCU; Subkey: "Software\\Classes\\Directory\\shell\\Pyxelze"; ValueType: string; ValueName: ""; Flags: deletevalue
Root: HKCU; Subkey: "Software\\Classes\\Directory\\shell\\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\Directory\\shell\\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\\Pyxelze-win_x64.exe"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\Directory\\shell\\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: ""; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\Directory\\shell\\Pyxelze\\shell\\Encode"; ValueType: string; ValueName: ""; ValueData: "Encoder en archive ROX"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\\Classes\\Directory\\shell\\Pyxelze\\shell\\Encode\\command"; ValueType: string; ValueName: ""; ValueData: "cmd.exe /C start """" /MIN powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\\resources\\rox-options-dialog.ps1"" -Mode encode -FilePath ""%V"" -WorkingDir ""%W"" -ExePath ""{app}\\Pyxelze-win_x64.exe"""; Flags: uninsdeletekey

[Code]
procedure AddToPath(Dir: string);
var
  CurrentPath: string;
  NewPath: string;
begin
  if not RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', CurrentPath) then
    CurrentPath := '';

  if Pos(';' + Dir + ';', ';' + CurrentPath + ';') = 0 then
  begin
    if CurrentPath <> '' then
      NewPath := CurrentPath + ';' + Dir
    else
      NewPath := Dir;

    RegWriteStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', NewPath);
  end;
end;

procedure RemovePath(Dir: string);
var
  CurrentPath: string;
  P: Integer;
  NewPath: string;
begin
  if not RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', CurrentPath) then
    Exit;

  P := Pos(';' + Dir + ';', ';' + CurrentPath + ';');
  if P = 0 then Exit;

  if P = 1 then
    Delete(CurrentPath, 1, Length(Dir) + 1)
  else
    Delete(CurrentPath, P, Length(Dir) + 1);

  if CurrentPath = '' then
    RegDeleteValue(HKEY_CURRENT_USER, 'Environment', 'Path')
  else
    RegWriteStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', CurrentPath);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  LogFile: String;
begin
  LogFile := ExpandConstant('{app}\\pyxelze-install.log');
  if CurStep = ssInstall then
  begin
    SaveStringToFile(LogFile, '[INSTALL] Start' + #13#10, False);
  end
  else if CurStep = ssPostInstall then
  begin
    SaveStringToFile(LogFile, '[INSTALL] Files installed' + #13#10, True);
    SaveStringToFile(LogFile, '[INSTALL] Registry entries applied (menu contextuel)' + #13#10, True);

    AddToPath(ExpandConstant('{app}'));
    SaveStringToFile(LogFile, '[INSTALL] PATH updated' + #13#10, True);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
  LogFile: String;
begin
  LogFile := ExpandConstant('{app}\pyxelze-uninstall.log');
  if CurUninstallStep = usUninstall then
  begin
    RemovePath(ExpandConstant('{app}'));
    SaveStringToFile(LogFile, '[UNINSTALL] PATH cleaned' + #13#10, True);

    if FileExists(ExpandConstant('{app}\uninstall-pyxelze.reg')) then
    begin
      Exec(ExpandConstant('{cmd}'), '/C reg import "' + ExpandConstant('{app}\uninstall-pyxelze.reg') + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      SaveStringToFile(LogFile, '[UNINSTALL] Reg import exit: ' + IntToStr(ResultCode) + #13#10, True);
    end;
  end;
end;
