#include "Logger.h"
#include <QDir>
#include <QFile>
#include <QDateTime>
#include <QMutex>
#include <QStandardPaths>

static QMutex s_mutex;
static QString s_logPath;

static const QString& resolveLogPath() {
    if (s_logPath.isEmpty())
        s_logPath = QDir::tempPath() + QStringLiteral("/pyxelze.log");
    return s_logPath;
}

QString Logger::logPath() {
    return resolveLogPath();
}

void Logger::log(const QString& text) {
    QMutexLocker lock(&s_mutex);
    QFile f(resolveLogPath());
    if (f.open(QIODevice::Append | QIODevice::Text)) {
        f.write(QStringLiteral("[%1] %2\n")
            .arg(QDateTime::currentDateTime().toString(Qt::ISODateWithMs), text).toUtf8());
    }
}

void Logger::logDnd(const QString& text) {
    log(QStringLiteral("[DND] %1").arg(text));
}
