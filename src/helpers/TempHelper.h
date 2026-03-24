#pragma once
#include <QString>

namespace TempHelper {
    QString createTempDir(const QString& prefix = QStringLiteral("pyxelze"));
    void safeDelete(const QString& path);
    void safeDeleteFile(const QString& path);
    void moveContents(const QString& srcDir, const QString& destDir);
    void copyDirectory(const QString& srcDir, const QString& destDir);
}
