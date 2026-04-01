#pragma once

#include <QString>

namespace LicenseAlgorithm {
    QString normalize(const QString& raw);
    bool isValid(const QString& raw);
}
