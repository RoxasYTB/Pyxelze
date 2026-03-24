#pragma once
#include <QIcon>
#include <QString>

namespace IconProvider {
    QIcon iconForFile(const QString& fileName, bool isFolder);
    QIcon appIcon();
    QIcon toolbarIcon(const QString& name);
}
