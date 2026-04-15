#pragma once
#include <QString>
#include <QStringList>
#include <QProcess>

struct ProcessResult {
    int exitCode = -1;
    QString stdOut;
    QString stdErr;
};

namespace ProcessHelper {
    ProcessResult runProcess(const QString& program, const QStringList& args, int timeoutMs = 600000);
    ProcessResult runRox(const QStringList& args, int timeoutMs = 600000);
    bool directoryHasEntries(const QString& path);
    void logRoxTiming(const QStringList& args, qint64 elapsedMs, int exitCode);
}
