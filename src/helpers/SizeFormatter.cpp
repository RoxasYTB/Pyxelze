#include "SizeFormatter.h"
#include "localization/Localization.h"
#include <QLocale>

QString SizeFormatter::format(qint64 bytes) {
    if (bytes < 0) return QStringLiteral("0 ") + L::get("size.B");

    if (bytes < 1024)
        return QLocale().toString(bytes) + QStringLiteral(" ") + L::get("size.B");

    const QString units[] = {
        L::get("size.KB"), L::get("size.MB"),
        L::get("size.GB"), L::get("size.TB")
    };

    double value = static_cast<double>(bytes) / 1024.0;
    int order = 0;
    while (value >= 1024.0 && order < 3) { ++order; value /= 1024.0; }

    if (order == 0)
        return QLocale().toString(qint64(qRound(value))) + QStringLiteral(" ") + units[0];

    if (value >= 100.0)
        return QLocale().toString(qint64(qRound(value))) + QStringLiteral(" ") + units[order];

    if (value >= 10.0)
        return QStringLiteral("%1 %2").arg(value, 0, 'f', 1).arg(units[order]);

    return QStringLiteral("%1 %2").arg(value, 0, 'f', 2).arg(units[order]);
}
