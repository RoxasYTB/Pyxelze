#include "AboutDialog.h"
#include "ThemeManager.h"
#include "IconProvider.h"
#include "core/AppConstants.h"
#include "core/ProcessHelper.h"
#include "localization/Localization.h"
#include "platform/PlatformService.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QGridLayout>
#include <QLabel>
#include <QPushButton>
#include <QFrame>
#include <QSysInfo>

static QFrame* hLine() {
    auto* f = new QFrame;
    f->setFrameShape(QFrame::HLine);
    f->setFrameShadow(QFrame::Sunken);
    return f;
}

AboutDialog::AboutDialog(QWidget* parent) : QDialog(parent) {
    setWindowTitle(L::get("about.title"));
    setFixedSize(480, 460);
    ThemeManager::applyToWidget(this);

    auto accent = ThemeManager::accentColor();
    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(28, 20, 28, 20);

    auto* header = new QHBoxLayout;
    auto* iconLbl = new QLabel;
    iconLbl->setPixmap(IconProvider::appIcon().pixmap(48, 48));
    header->addWidget(iconLbl);

    auto* titleCol = new QVBoxLayout;
    auto* lblTitle = new QLabel(QStringLiteral("Pyxelze"));
    lblTitle->setStyleSheet(QStringLiteral("font-size: 24pt; font-weight: bold; color: %1;").arg(accent.name()));
    titleCol->addWidget(lblTitle);
    auto* lblVer = new QLabel(QStringLiteral("v%1").arg(QString::fromLatin1(AppConstants::Version)));
    lblVer->setStyleSheet(QStringLiteral("color: gray; font-size: 11pt;"));
    titleCol->addWidget(lblVer);
    header->addLayout(titleCol);
    header->addStretch();
    layout->addLayout(header);

    auto* lblDesc = new QLabel(L::get("about.description"));
    lblDesc->setWordWrap(true);
    layout->addWidget(lblDesc);

    layout->addWidget(hLine());

    auto* grid = new QGridLayout;
    int row = 0;
    auto addRow = [&](const QString& label, const QString& value) {
        auto* l = new QLabel(label);
        l->setStyleSheet(QStringLiteral("color: gray; font-size: 9pt;"));
        grid->addWidget(l, row, 0);
        auto* v = new QLabel(value);
        v->setStyleSheet(QStringLiteral("font-weight: bold; font-size: 9pt;"));
        grid->addWidget(v, row, 1);
        ++row;
    };

    auto roxVer = ProcessHelper::runRox(QStringList{QStringLiteral("--version")}, 5000);
    auto roxVerStr = (roxVer.exitCode == 0 && !roxVer.stdOut.trimmed().isEmpty()) ? roxVer.stdOut.trimmed() : L::get("about.notAvailable");

    addRow(L::get("about.appVersion"), QString::fromLatin1(AppConstants::Version));
    addRow(L::get("about.build"), QString::fromLatin1(AppConstants::BuildStamp));
    addRow(L::get("about.roxifyEngine"), roxVerStr);
    addRow(QStringLiteral("Qt"), QString::fromLatin1(qVersion()));
    layout->addLayout(grid);

    layout->addWidget(hLine());

    auto* lblDev = new QLabel(L::get("about.developedBy"));
    lblDev->setStyleSheet(QStringLiteral("color: gray;"));
    layout->addWidget(lblDev);
    auto* lblName = new QLabel(QStringLiteral("Yohan SANNIER"));
    lblName->setStyleSheet(QStringLiteral("font-weight: bold; font-size: 10pt;"));
    layout->addWidget(lblName);

    auto* lnk = new QLabel(QStringLiteral("<a href=\"%1\">%1</a>").arg(QString::fromLatin1(AppConstants::RepoUrl)));
    lnk->setOpenExternalLinks(true);
    lnk->setStyleSheet(QStringLiteral("color: %1;").arg(accent.name()));
    layout->addWidget(lnk);

    auto* lblCopy = new QLabel(L::get("about.copyright").replace(QStringLiteral("{0}"), QStringLiteral("2024-2026")));
    lblCopy->setStyleSheet(QStringLiteral("color: gray;"));
    layout->addWidget(lblCopy);

    layout->addWidget(hLine());

    auto* lblLic = new QLabel(L::get("about.license"));
    lblLic->setStyleSheet(QStringLiteral("color: gray; font-size: 9pt;"));
    layout->addWidget(lblLic);

    layout->addStretch();
    auto* btnClose = new QPushButton(L::get("about.close"));
    btnClose->setFixedSize(88, 32);
    connect(btnClose, &QPushButton::clicked, this, &QDialog::accept);
    auto* btnRow = new QHBoxLayout;
    btnRow->addStretch();
    btnRow->addWidget(btnClose);
    layout->addLayout(btnRow);
}
