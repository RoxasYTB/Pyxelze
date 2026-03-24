#pragma once
#include <QString>
#include <QWidget>

namespace ErrorDialog {
    void show(QWidget* parent, const QString& message, const QString& details = {}, const QString& title = {});
}
