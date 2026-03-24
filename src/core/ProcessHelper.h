#pragma once
#include <QString>
#include <QProcess>

struct ProcessResult {
    int exitCode = -1;
    QString stdOut;
    QString stdErr;
};

namespace ProcessHelper {
    ProcessResult runProcess(const QString& program, const QStringList& args, int timeoutMs = 30000);
    ProcessResult runRox(const QStringList& args, int timeoutMs = 30000);
    bool directoryHasEntries(const QString& path);
}
