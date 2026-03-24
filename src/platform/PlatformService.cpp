#include "PlatformService.h"
#include "localization/Localization.h"
#include <QStandardPaths>
#include <QSettings>
#include <QDesktopServices>
#include <QUrl>
#include <QDir>
#include <QFileInfo>
#include <QProcess>
#include <QCoreApplication>
#include <QMessageBox>

#ifdef Q_OS_WIN
#include <windows.h>
#include <shellapi.h>
#include <shlwapi.h>
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "advapi32.lib")
#endif

static QString settingsPath() {
    auto dir = PlatformService::configDir();
    QDir().mkpath(dir);
    return dir + QStringLiteral("/settings.ini");
}

QString PlatformService::configDir() {
#ifdef Q_OS_WIN
    return QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
#else
    auto xdg = QStandardPaths::writableLocation(QStandardPaths::GenericConfigLocation);
    return xdg + QStringLiteral("/pyxelze");
#endif
}

void PlatformService::savePreference(const QString& key, const QVariant& value) {
    QSettings s(settingsPath(), QSettings::IniFormat);
    s.setValue(key, value);
}

QVariant PlatformService::loadPreference(const QString& key, const QVariant& defaultValue) {
    QSettings s(settingsPath(), QSettings::IniFormat);
    return s.value(key, defaultValue);
}

void PlatformService::openUrl(const QString& url) {
    QDesktopServices::openUrl(QUrl(url));
}

void PlatformService::openFile(const QString& path) {
    QDesktopServices::openUrl(QUrl::fromLocalFile(path));
}

QString PlatformService::fileTypeName(const QString& fileName) {
#ifdef Q_OS_WIN
    auto ext = QFileInfo(fileName).suffix();
    if (ext.isEmpty()) return QStringLiteral("File");
    auto dotExt = QStringLiteral(".") + ext;
    SHFILEINFOW sfi = {};
    auto hr = SHGetFileInfoW(
        reinterpret_cast<LPCWSTR>(dotExt.utf16()),
        FILE_ATTRIBUTE_NORMAL,
        &sfi, sizeof(sfi),
        SHGFI_TYPENAME | SHGFI_USEFILEATTRIBUTES
    );
    if (hr && sfi.szTypeName[0] != L'\0')
        return QString::fromWCharArray(sfi.szTypeName);
    return ext.toUpper() + QStringLiteral(" File");
#else
    QMimeDatabase db;
    auto mime = db.mimeTypeForFile(fileName, QMimeDatabase::MatchExtension);
    auto desc = mime.comment();
    return desc.isEmpty() ? mime.name() : desc;
#endif
}

bool PlatformService::canRegisterContextMenu() {
#ifdef Q_OS_WIN
    return true;
#else
    return false;
#endif
}

#ifdef Q_OS_WIN
static bool writeRegKey(HKEY root, const wchar_t* subKey, const wchar_t* valueName, const std::wstring& data) {
    HKEY hKey = nullptr;
    LONG res = RegCreateKeyExW(root, subKey, 0, nullptr, 0, KEY_WRITE, nullptr, &hKey, nullptr);
    if (res != ERROR_SUCCESS) return false;
    res = RegSetValueExW(hKey, valueName, 0, REG_SZ,
                         reinterpret_cast<const BYTE*>(data.c_str()),
                         static_cast<DWORD>((data.size() + 1) * sizeof(wchar_t)));
    RegCloseKey(hKey);
    return res == ERROR_SUCCESS;
}

static void deleteRegTree(HKEY root, const wchar_t* subKey) {
    RegDeleteTreeW(root, subKey);
    RegDeleteKeyW(root, subKey);
}

static void registerCascadingMenuAt(const wchar_t* rootKey, const std::wstring& wExe, const std::wstring& wIco) {
    std::wstring base = std::wstring(rootKey) + L"\\Pyxelze";
    std::wstring shellBase = base + L"\\shell";

    writeRegKey(HKEY_CURRENT_USER, base.c_str(), L"MUIVerb", L"Pyxelze");
    writeRegKey(HKEY_CURRENT_USER, base.c_str(), L"SubCommands", L"");
    writeRegKey(HKEY_CURRENT_USER, base.c_str(), L"Icon", wIco);

    struct SubCmd { const wchar_t* id; const char* labelKey; const wchar_t* arg; };
    SubCmd cmds[] = {
        { L"open",        "contextmenu.openArchive", L""               },
        { L"extractHere", "contextmenu.extractHere", L"--extract-here" },
        { L"extractTo",   "contextmenu.extractTo",   L"--extract-to"   },
        { L"encode",      "contextmenu.encode",      L"--encode"       },
    };

    for (const auto& cmd : cmds) {
        std::wstring subKey = shellBase + L"\\" + cmd.id;
        std::wstring cmdKey = subKey + L"\\command";
        auto label = L::get(cmd.labelKey).toStdWString();
        std::wstring cmdLine = L"\"" + wExe + L"\"";
        if (cmd.arg[0] != L'\0')
            cmdLine += L" " + std::wstring(cmd.arg);
        cmdLine += L" \"%1\"";

        writeRegKey(HKEY_CURRENT_USER, subKey.c_str(), nullptr, label);
        writeRegKey(HKEY_CURRENT_USER, cmdKey.c_str(), nullptr, cmdLine);
    }
}
#endif

void PlatformService::registerContextMenu() {
#ifdef Q_OS_WIN
    auto exe = QCoreApplication::applicationFilePath().replace('/', '\\');
    auto wExe = exe.toStdWString();
    auto appDir = QCoreApplication::applicationDirPath().replace('/', '\\');
    auto icoPath = appDir + QStringLiteral("\\appIcon.ico");
    auto wIco = QFileInfo(icoPath).exists() ? icoPath.toStdWString() : wExe + L",0";

    registerCascadingMenuAt(L"Software\\Classes\\*\\shell", wExe, wIco);
    registerCascadingMenuAt(L"Software\\Classes\\Directory\\shell", wExe, wIco);

    QMessageBox::information(nullptr, QStringLiteral("Pyxelze"), L::get("contextmenu.registerSuccess"));
#endif
}

void PlatformService::unregisterContextMenu() {
#ifdef Q_OS_WIN
    deleteRegTree(HKEY_CURRENT_USER, L"Software\\Classes\\*\\shell\\Pyxelze");
    deleteRegTree(HKEY_CURRENT_USER, L"Software\\Classes\\Directory\\shell\\Pyxelze");
    deleteRegTree(HKEY_CURRENT_USER, L"Software\\Classes\\.png\\shell\\Pyxelze");

    QMessageBox::information(nullptr, QStringLiteral("Pyxelze"), L::get("contextmenu.unregisterSuccess"));
#endif
}
