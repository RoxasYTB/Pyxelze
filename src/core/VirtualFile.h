#pragma once
#include <QString>

struct VirtualFile {
    QString fullPath;
    QString originalPath;
    QString name;
    qint64 size = 0;
    bool isFolder = false;
};
