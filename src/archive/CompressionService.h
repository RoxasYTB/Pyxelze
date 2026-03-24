#pragma once
#include <QString>
#include <QWidget>

namespace CompressionService {
    bool compressDirectory(QWidget* parent, const QString& dirPath, const QString& outputFile = {});
}
