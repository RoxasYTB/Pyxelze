#pragma once
#include <QString>
#include <QWidget>
#include <optional>

namespace PassphraseDialog {
    std::optional<QString> prompt(QWidget* parent, const QString& title, const QString& message, const QString& errorMsg = {});
}
