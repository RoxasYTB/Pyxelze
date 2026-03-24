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

static bool deleteRegTree(HKEY root, const wchar_t* subKey) {
    LONG res = RegDeleteTreeW(root, subKey);
    if (res == ERROR_SUCCESS || res == ERROR_FILE_NOT_FOUND)
        return RegDeleteKeyW(root, subKey) == ERROR_SUCCESS || res == ERROR_FILE_NOT_FOUND;
    return false;
}

void PlatformService::registerContextMenu() {
#ifdef Q_OS_WIN
    auto exe = QCoreApplication::applicationFilePath().replace('/', '\\');
    auto label = L::get("contextmenu.openWith");
    auto wLabel = label.toStdWString();
    auto wExe = exe.toStdWString();
    std::wstring wCmd = L"\"" + wExe + L"\" \"%1\"";

    bool ok = true;
    ok &= writeRegKey(HKEY_CURRENT_USER, L"Software\\Classes\\*\\shell\\Pyxelze", nullptr, wLabel);
    ok &= writeRegKey(HKEY_CURRENT_USER, L"Software\\Classes\\*\\shell\\Pyxelze", L"Icon", wExe);
    ok &= writeRegKey(HKEY_CURRENT_USER, L"Software\\Classes\\*\\shell\\Pyxelze\\command", nullptr, wCmd);
    ok &= writeRegKey(HKEY_CURRENT_USER, L"Software\\Classes\\.png\\shell\\Pyxelze", nullptr, wLabel);
    ok &= writeRegKey(HKEY_CURRENT_USER, L"Software\\Classes\\.png\\shell\\Pyxelze", L"Icon", wExe);
    ok &= writeRegKey(HKEY_CURRENT_USER, L"Software\\Classes\\.png\\shell\\Pyxelze\\command", nullptr, wCmd);

    if (ok)
        QMessageBox::information(nullptr, QStringLiteral("Pyxelze"), L::get("contextmenu.registerSuccess"));
    else
        QMessageBox::warning(nullptr, QStringLiteral("Pyxelze"), L::get("contextmenu.registerFail"));
#endif
}

void PlatformService::unregisterContextMenu() {
#ifdef Q_OS_WIN
    bool ok = true;
    ok &= deleteRegTree(HKEY_CURRENT_USER, L"Software\\Classes\\*\\shell\\Pyxelze");
    ok &= deleteRegTree(HKEY_CURRENT_USER, L"Software\\Classes\\.png\\shell\\Pyxelze");

    if (ok)
        QMessageBox::information(nullptr, QStringLiteral("Pyxelze"), L::get("contextmenu.unregisterSuccess"));
    else
        QMessageBox::warning(nullptr, QStringLiteral("Pyxelze"), L::get("contextmenu.unregisterFail"));
#endif
}
