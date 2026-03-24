#pragma once
#include <QString>
#include <QWidget>
#include <functional>

namespace UpdateChecker {
    struct UpdateInfo {
        bool available = false;
        QString version;
        QString downloadUrl;
    };

    void checkAsync(QWidget* parent, bool silent = true);
}
