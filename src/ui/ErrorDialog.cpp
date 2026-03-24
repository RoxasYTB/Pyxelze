#include "ErrorDialog.h"
#include "ThemeManager.h"
#include "core/Logger.h"
#include "localization/Localization.h"
#include "platform/PlatformService.h"
#include <QDialog>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QTextEdit>
#include <QPushButton>
#include <QApplication>
#include <QClipboard>

void ErrorDialog::show(QWidget* parent, const QString& message, const QString& details, const QString& title) {
    auto t = title.isEmpty() ? L::get("error.title") : title;
    Logger::log(QStringLiteral("[ERROR] %1%2").arg(message, details.isEmpty() ? QString() : QStringLiteral("\n") + details));

    QDialog dlg(parent);
    dlg.setWindowTitle(t);
    dlg.setMinimumSize(520, details.isEmpty() ? 180 : 320);
    ThemeManager::applyToWidget(&dlg);

    auto* layout = new QVBoxLayout(&dlg);
    layout->setContentsMargins(16, 16, 16, 16);

    auto* lblMsg = new QLabel(message);
    lblMsg->setWordWrap(true);
    layout->addWidget(lblMsg);

    if (!details.isEmpty()) {
        auto* txtDetails = new QTextEdit;
        txtDetails->setPlainText(details);
        txtDetails->setReadOnly(true);
        txtDetails->setFont(QFont(QStringLiteral("monospace"), 9));
        layout->addWidget(txtDetails);
    }

    auto* btnRow = new QHBoxLayout;
    auto fullText = details.isEmpty() ? message : message + QStringLiteral("\n\n") + details;

    auto* btnCopy = new QPushButton(L::get("error.copy"));
    QObject::connect(btnCopy, &QPushButton::clicked, [fullText, btnCopy] {
        QApplication::clipboard()->setText(fullText);
        btnCopy->setText(L::get("error.copied"));
    });
    btnRow->addWidget(btnCopy);

    auto* btnLog = new QPushButton(L::get("error.openLog"));
    QObject::connect(btnLog, &QPushButton::clicked, [] {
        PlatformService::openFile(Logger::logPath());
    });
    btnRow->addWidget(btnLog);

    btnRow->addStretch();
    auto* btnOk = new QPushButton(QStringLiteral("OK"));
    QObject::connect(btnOk, &QPushButton::clicked, &dlg, &QDialog::accept);
    btnRow->addWidget(btnOk);

    layout->addLayout(btnRow);
    dlg.exec();
}
