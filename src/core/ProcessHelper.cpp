#include "ProcessHelper.h"
#include "RoxRunner.h"
#include "Logger.h"
#include <QDir>
#include <QApplication>
#include <QElapsedTimer>

static bool shouldLogRoxTiming(const QStringList& args) {
    if (args.isEmpty()) return false;
    const auto command = args.first();
    return command == QStringLiteral("encode") || command == QStringLiteral("decompress");
}

static QStringList sanitizeRoxArgs(const QStringList& args) {
    QStringList sanitized;
    sanitized.reserve(args.size());

    for (int index = 0; index < args.size(); ++index) {
        const auto& arg = args.at(index);
        sanitized.append(arg);

        if (arg == QStringLiteral("--passphrase") && index + 1 < args.size()) {
            sanitized.append(QStringLiteral("***"));
            ++index;
            continue;
        }

        if (arg == QStringLiteral("--files") && index + 1 < args.size()) {
            sanitized.append(QStringLiteral("<json:%1 bytes>").arg(args.at(index + 1).toUtf8().size()));
            ++index;
        }
    }

    return sanitized;
}

ProcessResult ProcessHelper::runProcess(const QString& program, const QStringList& args, int timeoutMs) {
    QProcess proc;
    proc.setProcessChannelMode(QProcess::SeparateChannels);
    proc.start(program, args);

    if (!proc.waitForStarted(5000))
        return {-1, {}, QStringLiteral("Failed to start process")};

    QElapsedTimer timer;
    timer.start();

    while (!proc.waitForFinished(50)) {
        QApplication::processEvents();
        if (timer.elapsed() > timeoutMs) {
            proc.kill();
            proc.waitForFinished(2000);
            return {-1, {}, QStringLiteral("Timeout")};
        }
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

    QElapsedTimer timer;
    timer.start();
    const auto result = runProcess(roxPath, args, timeoutMs);
    logRoxTiming(args, timer.elapsed(), result.exitCode);
    return result;
}

bool ProcessHelper::directoryHasEntries(const QString& path) {
    QDir dir(path);
    return dir.exists() && !dir.entryList(QDir::AllEntries | QDir::NoDotAndDotDot).isEmpty();
}

void ProcessHelper::logRoxTiming(const QStringList& args, qint64 elapsedMs, int exitCode) {
    if (!shouldLogRoxTiming(args)) return;

    Logger::log(
        QStringLiteral("[ROX][TIMING] op=%1 elapsed_ms=%2 exit=%3 args=%4")
            .arg(args.first())
            .arg(elapsedMs)
            .arg(exitCode)
            .arg(sanitizeRoxArgs(args).join(' '))
    );
}
