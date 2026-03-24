#include "ProcessHelper.h"
#include "RoxRunner.h"
#include "Logger.h"
#include <QDir>

ProcessResult ProcessHelper::runProcess(const QString& program, const QStringList& args, int timeoutMs) {
    QProcess proc;
    proc.setProcessChannelMode(QProcess::SeparateChannels);
    proc.start(program, args);

    if (!proc.waitForStarted(5000))
        return {-1, {}, QStringLiteral("Failed to start process")};

    if (!proc.waitForFinished(timeoutMs)) {
        proc.kill();
        proc.waitForFinished(2000);
        return {-1, {}, QStringLiteral("Timeout")};
    }

    return {
        proc.exitCode(),
        QString::fromUtf8(proc.readAllStandardOutput()),
        QString::fromUtf8(proc.readAllStandardError())
    };
}

ProcessResult ProcessHelper::runRox(const QStringList& args, int timeoutMs) {
    auto roxPath = RoxRunner::roxPath();
    if (roxPath.isEmpty())
        return {-1, {}, QStringLiteral("roxify_native not found")};
    return runProcess(roxPath, args, timeoutMs);
}

bool ProcessHelper::directoryHasEntries(const QString& path) {
    QDir dir(path);
    return dir.exists() && !dir.entryList(QDir::AllEntries | QDir::NoDotAndDotDot).isEmpty();
}
