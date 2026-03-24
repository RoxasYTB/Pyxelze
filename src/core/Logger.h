#pragma once
#include <QString>

namespace Logger {
    QString logPath();
    void log(const QString& text);
    void logDnd(const QString& text);
}
