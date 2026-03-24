#pragma once
#include <QString>
#include <QVariant>

namespace PlatformService {
    QString configDir();
    void savePreference(const QString& key, const QVariant& value);
    QVariant loadPreference(const QString& key, const QVariant& defaultValue = QVariant());
    void openUrl(const QString& url);
    void openFile(const QString& path);
    QString fileTypeName(const QString& fileName);
    bool canRegisterContextMenu();
    void registerContextMenu();
    void unregisterContextMenu();
}
