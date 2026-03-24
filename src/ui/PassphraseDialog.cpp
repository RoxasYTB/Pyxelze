#include "PassphraseDialog.h"
#include "ThemeManager.h"
#include "localization/Localization.h"
#include <QDialog>
#include <QVBoxLayout>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QDialogButtonBox>

std::optional<QString> PassphraseDialog::prompt(QWidget* parent, const QString& title, const QString& message, const QString& errorMsg) {
    QDialog dlg(parent);
    dlg.setWindowTitle(title);
    dlg.setFixedWidth(420);
    ThemeManager::applyToWidget(&dlg);

    auto* layout = new QVBoxLayout(&dlg);
    layout->setContentsMargins(15, 15, 15, 15);

    auto* lbl = new QLabel(message);
    lbl->setWordWrap(true);
    layout->addWidget(lbl);

    if (!errorMsg.isEmpty()) {
        auto* lblErr = new QLabel(errorMsg);
        lblErr->setStyleSheet(QStringLiteral("color: red;"));
        layout->addWidget(lblErr);
    }

    auto* txt = new QLineEdit;
    txt->setEchoMode(QLineEdit::Password);
    layout->addWidget(txt);

    auto* buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel);
    buttons->button(QDialogButtonBox::Ok)->setText(L::get("passphrase.ok"));
    buttons->button(QDialogButtonBox::Cancel)->setText(L::get("passphrase.cancel"));
    layout->addWidget(buttons);

    QObject::connect(buttons, &QDialogButtonBox::accepted, &dlg, &QDialog::accept);
    QObject::connect(buttons, &QDialogButtonBox::rejected, &dlg, &QDialog::reject);

    if (dlg.exec() == QDialog::Accepted)
        return txt->text();
    return std::nullopt;
}
