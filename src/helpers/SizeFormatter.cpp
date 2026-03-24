#include "SizeFormatter.h"
#include "localization/Localization.h"

QString SizeFormatter::format(qint64 bytes) {
    const QString units[] = {
        L::get("size.B"), L::get("size.KB"), L::get("size.MB"),
        L::get("size.GB"), L::get("size.TB")
    };
    if (bytes < 1024)
        return QStringLiteral("%1 %2").arg(bytes).arg(units[0]);

    double len = bytes;
    int order = 0;
    while (len >= 1024.0 && order < 4) { ++order; len /= 1024.0; }
    return QStringLiteral("%1 %2").arg(len, 0, 'f', 2).arg(units[order]);
}
