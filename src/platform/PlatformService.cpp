#include "PlatformService.h"
#include <QStandardPaths>
#include <QSettings>
#include <QDesktopServices>
#include <QUrl>
#include <QDir>
#include <QFileInfo>
#include <QMimeDatabase>
#include <QProcess>
#include <QCoreApplication>

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
    QMimeDatabase db;
    auto mime = db.mimeTypeForFile(fileName, QMimeDatabase::MatchExtension);
    auto desc = mime.comment();
    return desc.isEmpty() ? mime.name() : desc;
}

bool PlatformService::canRegisterContextMenu() {
#ifdef Q_OS_WIN
    return true;
#else
    return false;
#endif
}

void PlatformService::registerContextMenu() {
#ifdef Q_OS_WIN
    auto exe = QCoreApplication::applicationFilePath().replace('/', '\\');
    QSettings reg(QStringLiteral("HKEY_CLASSES_ROOT\\*\\shell\\Pyxelze"), QSettings::NativeFormat);
    reg.setValue(QStringLiteral("Default"), QStringLiteral("Ouvrir avec Pyxelze"));
    reg.setValue(QStringLiteral("Icon"), exe);
    QSettings cmd(QStringLiteral("HKEY_CLASSES_ROOT\\*\\shell\\Pyxelze\\command"), QSettings::NativeFormat);
    cmd.setValue(QStringLiteral("Default"), QStringLiteral("\"%1\" \"%2\"").arg(exe, QStringLiteral("%1")));
#endif
}

void PlatformService::unregisterContextMenu() {
#ifdef Q_OS_WIN
    QSettings reg(QStringLiteral("HKEY_CLASSES_ROOT\\*\\shell"), QSettings::NativeFormat);
    reg.remove(QStringLiteral("Pyxelze"));
#endif
}
