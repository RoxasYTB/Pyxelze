#pragma once
#include "core/VirtualFile.h"
#include <QList>
#include <QString>

namespace ArchiveParser {
    QList<VirtualFile> parse(const QString& data);
    QStringList parseFileNames(const QString& data);
}
