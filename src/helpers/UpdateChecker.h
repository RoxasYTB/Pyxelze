#pragma once
#include <QString>
#include <QWidget>

namespace UpdateChecker {
    struct UpdateInfo {
        bool available = false;
        QString version;
        QString downloadUrl;
    };

    void checkAsync(QWidget* parent, bool silent = true);
}
