#include "RoxRunner.h"
#include "ProcessHelper.h"
#include <QCoreApplication>
#include <QDir>
#include <QFileInfo>
#include <QProcess>
#include <QStandardPaths>

static QString s_roxPath;

static bool tryPath(const QString& path) {
    if (QFileInfo::exists(path)) {
        s_roxPath = path;
        return true;
    }
    return false;
}

static void resolve() {
    if (!s_roxPath.isEmpty()) return;

    auto base = QCoreApplication::applicationDirPath();

#ifdef Q_OS_WIN
    const auto bin = QStringLiteral("roxify_native.exe");
#else
    const auto bin = QStringLiteral("roxify_native");
#endif

    if (tryPath(base + QStringLiteral("/roxify/") + bin)) return;
    if (tryPath(base + QStringLiteral("/") + bin)) return;

#ifndef Q_OS_WIN
    if (tryPath(QStringLiteral("/usr/lib/pyxelze/roxify_native"))) return;
    if (tryPath(QStringLiteral("/usr/local/lib/pyxelze/roxify_native"))) return;

    auto fromPath = QStandardPaths::findExecutable(QStringLiteral("roxify_native"));
    if (!fromPath.isEmpty()) { s_roxPath = fromPath; return; }

    QProcess npmRoot;
    npmRoot.start(QStringLiteral("npm"), {QStringLiteral("root"), QStringLiteral("-g")});
    if (npmRoot.waitForFinished(3000) && npmRoot.exitCode() == 0) {
        auto npmDir = QString::fromUtf8(npmRoot.readAllStandardOutput()).trimmed();
        if (tryPath(npmDir + QStringLiteral("/roxify/dist/roxify_native"))) return;
        if (tryPath(npmDir + QStringLiteral("/roxify/target/release/roxify_native"))) return;
    }
#endif
}

QString RoxRunner::roxPath() {
    resolve();
    return s_roxPath;
}

bool RoxRunner::isAvailable() {
    resolve();
    return !s_roxPath.isEmpty();
}

QString RoxRunner::roxDirectory() {
    resolve();
    return s_roxPath.isEmpty() ? QString() : QFileInfo(s_roxPath).absolutePath();
}

bool RoxRunner::tryCheckRox(QString& error) {
    auto r = ProcessHelper::runRox({QStringLiteral("--version")}, 5000);
    if (r.exitCode == 0) return true;
    error = r.stdErr.isEmpty() ? QStringLiteral("Exit code %1").arg(r.exitCode) : r.stdErr;
    return false;
}
