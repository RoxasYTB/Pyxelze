#include "TempHelper.h"
#include <QDir>
#include <QFile>
#include <QUuid>
#include <QStringList>

static QStringList s_trackedDirs;

QString TempHelper::createTempDir(const QString& prefix) {
    auto path = QDir::tempPath() + QStringLiteral("/%1-%2").arg(prefix, QUuid::createUuid().toString(QUuid::Id128));
    QDir().mkpath(path);
    s_trackedDirs.append(path);
    return path;
}

void TempHelper::safeDelete(const QString& path) {
    QDir dir(path);
    if (dir.exists()) dir.removeRecursively();
    s_trackedDirs.removeAll(path);
}

void TempHelper::safeDeleteFile(const QString& path) {
    QFile::remove(path);
}

void TempHelper::moveContents(const QString& srcDir, const QString& destDir) {
    QDir().mkpath(destDir);
    QDir src(srcDir);
    for (const auto& entry : src.entryInfoList(QDir::AllEntries | QDir::NoDotAndDotDot)) {
        auto dest = destDir + QStringLiteral("/") + entry.fileName();
        if (entry.isDir()) {
            QDir(dest).removeRecursively();
            copyDirectory(entry.absoluteFilePath(), dest);
        } else {
            QFile::remove(dest);
            QFile::copy(entry.absoluteFilePath(), dest);
        }
    }
}

void TempHelper::copyDirectory(const QString& srcDir, const QString& destDir) {
    QDir().mkpath(destDir);
    QDir src(srcDir);
    for (const auto& f : src.entryInfoList(QDir::Files))
        QFile::copy(f.absoluteFilePath(), destDir + QStringLiteral("/") + f.fileName());
    for (const auto& d : src.entryInfoList(QDir::Dirs | QDir::NoDotAndDotDot))
        copyDirectory(d.absoluteFilePath(), destDir + QStringLiteral("/") + d.fileName());
}

void TempHelper::cleanupAll() {
    for (const auto& path : s_trackedDirs) {
        QDir dir(path);
        if (dir.exists()) dir.removeRecursively();
    }
    s_trackedDirs.clear();
}
