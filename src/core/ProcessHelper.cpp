#include "ProcessHelper.h"
#include "RoxRunner.h"
#include "Logger.h"
#include <QDir>
#include <QApplication>
#include <QElapsedTimer>
#include <QFile>
#include <QRegularExpression>
#include <QTextStream>
#include <QIODevice>
#include <QDateTime>
// platform mem check
#ifdef Q_OS_WIN
#include <windows.h>
#endif
#ifdef Q_OS_MAC
#include <mach/mach.h>
#include <mach/mach_host.h>
#endif

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

    auto getAvailableMemoryBytes = []() -> quint64 {
#ifdef Q_OS_LINUX
        QFile f("/proc/meminfo");
        if (f.open(QIODevice::ReadOnly)) {
                const auto data = QString::fromUtf8(f.readAll());
                QRegularExpression re("MemAvailable:\\s+(\\d+) kB");
                auto m = re.match(data);
                if (m.hasMatch()) {
                    bool ok = false;
                    const quint64 kb = m.captured(1).toULongLong(&ok);
                    if (ok) return kb * 1024ULL;
                }
        }
#endif
#ifdef Q_OS_WIN
        MEMORYSTATUSEX st;
        st.dwLength = sizeof(st);
        if (GlobalMemoryStatusEx(&st)) {
            return static_cast<quint64>(st.ullAvailPhys);
        }
#endif
#ifdef Q_OS_MAC
        mach_port_t host = mach_host_self();
        vm_size_t page_size = 0;
        host_page_size(host, &page_size);
        vm_statistics64_data_t vmstat;
        mach_msg_type_number_t count = HOST_VM_INFO64_COUNT;
        if (host_statistics64(host, HOST_VM_INFO64, reinterpret_cast<host_info64_t>(&vmstat), &count) == KERN_SUCCESS) {
            const quint64 free_count = static_cast<quint64>(vmstat.free_count) + static_cast<quint64>(vmstat.inactive_count);
            return free_count * static_cast<quint64>(page_size);
        }
#endif
        return 0;
    };

    QByteArray outBuf;
    QByteArray errBuf;

    const quint64 reservedFreeBytes = 4ULL * 1024ULL * 1024ULL * 1024ULL; // keep 4GB free
    quint64 avail = getAvailableMemoryBytes();
    quint64 maxTotalBuf = 0;
    if (avail > reservedFreeBytes) {
        maxTotalBuf = avail - reservedFreeBytes;
        // cap to reasonable upper bound to avoid gigantic allocations
        const quint64 hardCap = 3ULL * 1024ULL * 1024ULL * 1024ULL; // 3GB
        if (maxTotalBuf > hardCap) maxTotalBuf = hardCap;
    } else {
        // fallback when unknown or small: allow 256MB total
        maxTotalBuf = 256ULL * 1024ULL * 1024ULL;
    }
    const qsizetype MAX_BUF = static_cast<qsizetype>(qMin<quint64>(maxTotalBuf / 2ULL,  ((quint64)INT_MAX)));

    while (!proc.waitForFinished(50)) {
        QApplication::processEvents();

        auto o = proc.readAllStandardOutput();
        if (!o.isEmpty()) {
            outBuf.append(o);
            if (outBuf.size() > MAX_BUF) outBuf = outBuf.right(MAX_BUF);
        }

        auto e = proc.readAllStandardError();
        if (!e.isEmpty()) {
            errBuf.append(e);
            if (errBuf.size() > MAX_BUF) errBuf = errBuf.right(MAX_BUF);
        }

        if (timer.elapsed() > timeoutMs) {
            proc.kill();
            proc.waitForFinished(2000);
            return {-1, {}, QStringLiteral("Timeout")};
        }
    }

    // Read any remaining data (and enforce cap)
    outBuf.append(proc.readAllStandardOutput());
    errBuf.append(proc.readAllStandardError());
    if (outBuf.size() > MAX_BUF) outBuf = outBuf.right(MAX_BUF);
    if (errBuf.size() > MAX_BUF) errBuf = errBuf.right(MAX_BUF);

    return { proc.exitCode(), QString::fromUtf8(outBuf), QString::fromUtf8(errBuf) };
}

ProcessResult ProcessHelper::runRox(const QStringList& args, int timeoutMs) {
    auto roxPath = RoxRunner::roxPath();
    if (roxPath.isEmpty())
        return {-1, {}, QStringLiteral("roxify_native not found")};

    QElapsedTimer timer;
    timer.start();
    const auto result = runProcess(roxPath, args, timeoutMs);
    logRoxTiming(args, timer.elapsed(), result.exitCode);

    // Log diagnostic stderr if it contains [PACK] or other diagnostic tags
    if (!result.stdErr.isEmpty() && (result.stdErr.contains("[PACK]") || result.stdErr.contains("DEBUG"))) {
        QFile debugLog("/tmp/roxify_debug.log");
        if (debugLog.open(QIODevice::Append | QIODevice::Text)) {
            QTextStream stream(&debugLog);
            stream << QDateTime::currentDateTime().toString(Qt::ISODate) << " - " << result.stdErr << "\n";
            debugLog.close();
        }
    }

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
