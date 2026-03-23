#define MyAppName "Pyxelze"
#define MyAppVersion "1.2.1"
#define MyAppPublisher "Pyxelze"
#define MyAppURL "https://github.com/RoxasYTB/Pyxelze"
#define MyAppExeName "Pyxelze.exe"

#ifndef PublishDir
  #define PublishDir "..\..\..\..\publish_final"
#endif

[Setup]
AppId={{A3F12B4E-7C89-4D56-B8E1-9F3A2C5D7E41}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\..\..\..\LICENSE
OutputDir=..\..\..\..\installer_output
OutputBaseFilename=Pyxelze-Setup-{#MyAppVersion}
SetupIconFile={#PublishDir}\appIcon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
ChangesAssociations=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"; LicenseFile: "..\..\..\..\LICENSE"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"; LicenseFile: "..\..\..\..\LICENSE_FR"
Name: "german"; MessagesFile: "compiler:Languages\German.isl"; LicenseFile: "..\..\..\..\LICENSE_DE"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"; LicenseFile: "..\..\..\..\LICENSE_ES"
Name: "italian"; MessagesFile: "compiler:Languages\Italian.isl"; LicenseFile: "..\..\..\..\LICENSE_IT"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"; LicenseFile: "..\..\..\..\LICENSE_RU"
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"; LicenseFile: "..\..\..\..\LICENSE_JA"
Name: "portuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"; LicenseFile: "..\..\..\..\LICENSE_PT"
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"; LicenseFile: "..\..\..\..\LICENSE_TR"
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"; LicenseFile: "..\..\..\..\LICENSE_PL"

[CustomMessages]
english.FileAssocDesc=Associate .png (Rox) files with Pyxelze
english.FileAssocGroup=File associations:
english.OpenArchive=Open archive
english.Decode=Decode
english.Encode=Encode
french.FileAssocDesc=Associer les fichiers .png (Rox) avec Pyxelze
french.FileAssocGroup=Associations de fichiers :
french.OpenArchive=Ouvrir l'archive
french.Decode=Décoder
french.Encode=Encoder
german.FileAssocDesc=.png (Rox) Dateien mit Pyxelze verknüpfen
german.FileAssocGroup=Dateizuordnungen:
german.OpenArchive=Archiv öffnen
german.Decode=Dekodieren
german.Encode=Kodieren
spanish.FileAssocDesc=Asociar archivos .png (Rox) con Pyxelze
spanish.FileAssocGroup=Asociaciones de archivos:
spanish.OpenArchive=Abrir archivo
spanish.Decode=Decodificar
spanish.Encode=Codificar
italian.FileAssocDesc=Associa file .png (Rox) con Pyxelze
italian.FileAssocGroup=Associazioni file:
italian.OpenArchive=Apri archivio
italian.Decode=Decodifica
italian.Encode=Codifica
russian.FileAssocDesc=Ассоциировать файлы .png (Rox) с Pyxelze
russian.FileAssocGroup=Ассоциации файлов:
russian.OpenArchive=Открыть архив
russian.Decode=Декодировать
russian.Encode=Закодировать
japanese.FileAssocDesc=.png (Rox) ファイルを Pyxelze に関連付ける
japanese.FileAssocGroup=ファイルの関連付け:
japanese.OpenArchive=アーカイブを開く
japanese.Decode=デコード
japanese.Encode=エンコード
portuguese.FileAssocDesc=Associar arquivos .png (Rox) com Pyxelze
portuguese.FileAssocGroup=Associações de arquivos:
portuguese.OpenArchive=Abrir arquivo
portuguese.Decode=Decodificar
portuguese.Encode=Codificar
turkish.FileAssocDesc=.png (Rox) dosyalarını Pyxelze ile ilişkilendir
turkish.FileAssocGroup=Dosya ilişkilendirmeleri:
turkish.OpenArchive=Arşivi aç
turkish.Decode=Çöz
turkish.Encode=Kodla
polish.FileAssocDesc=Powiąż pliki .png (Rox) z Pyxelze
polish.FileAssocGroup=Skojarzenia plików:
polish.OpenArchive=Otwórz archiwum
polish.Decode=Dekoduj
polish.Encode=Koduj

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "fileassoc"; Description: "{cm:FileAssocDesc}"; GroupDescription: "{cm:FileAssocGroup}"

[Files]
Source: "{#PublishDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "roxify\*,roxify"
Source: "{#PublishDir}\roxify\*"; DestDir: "{app}\roxify"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCR; Subkey: ".roxpng"; ValueType: string; ValueName: ""; ValueData: "Pyxelze.RoxArchive"; Flags: uninsdeletevalue; Tasks: fileassoc
Root: HKCR; Subkey: "Pyxelze.RoxArchive"; ValueType: string; ValueName: ""; ValueData: "Archive Rox (Pyxelze)"; Flags: uninsdeletekey; Tasks: fileassoc
Root: HKCR; Subkey: "Pyxelze.RoxArchive\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\appIcon.ico,0"; Tasks: fileassoc
Root: HKCR; Subkey: "Pyxelze.RoxArchive\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: fileassoc

Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: ""; ValueData: ""; Flags: uninsdeletekey
Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"
Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "*\shell\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: "open;decode"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\open"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Open archive"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\open"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\decode"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Decode"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\decode"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "*\shell\Pyxelze\shell\decode\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" decode ""%1"""
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: ""; ValueData: ""; Flags: uninsdeletekey
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Pyxelze"
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "Directory\shell\Pyxelze"; ValueType: string; ValueName: "SubCommands"; ValueData: "encode"
Root: HKCR; Subkey: "Directory\shell\Pyxelze\shell\encode"; ValueType: string; ValueName: "MUIVerb"; ValueData: "Encode"
Root: HKCR; Subkey: "Directory\shell\Pyxelze\shell\encode"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"
Root: HKCR; Subkey: "Directory\shell\Pyxelze\shell\encode\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" compress ""%1"""

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    RegDeleteKeyIncludingSubkeys(HKEY_CLASSES_ROOT, '*\shell\Pyxelze');
    RegDeleteKeyIncludingSubkeys(HKEY_CLASSES_ROOT, 'Directory\shell\Pyxelze');
  end;
end;
