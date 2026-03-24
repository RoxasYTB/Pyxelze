#pragma once
#include <QString>

namespace RoxRunner {
    QString roxPath();
    bool isAvailable();
    QString roxDirectory();
    bool tryCheckRox(QString& error);
}
