#include "ArchiveInfoDialog.h"
#include "ThemeManager.h"
#include "IconProvider.h"
#include "core/ProcessHelper.h"
#include "core/RoxRunner.h"
#include "helpers/SizeFormatter.h"
#include "localization/Localization.h"
#include <QVBoxLayout>
#include <QGridLayout>
#include <QLabel>
#include <QPushButton>
#include <QFileInfo>
#include <QDateTime>
#include <QFrame>

static QLabel* dimLabel(const QString& text) {
    auto* l = new QLabel(text);
    l->setStyleSheet(QStringLiteral("color: %1; font-size: 9pt;").arg(ThemeManager::dimText().name()));
    return l;
}

static QLabel* boldLabel(const QString& text) {
    auto* l = new QLabel(text);
    l->setStyleSheet(QStringLiteral("font-weight: bold; font-size: 9pt; color: %1;").arg(ThemeManager::windowFore().name()));
    return l;
}

ArchiveInfoDialog::ArchiveInfoDialog(QWidget* parent, const QString& archivePath, const QList<VirtualFile>& allFiles)
    : QDialog(parent) {
    QFileInfo fi(archivePath);
    int totalFiles = 0, totalFolders = 0;
    qint64 totalSize = 0;
    for (const auto& f : allFiles) {
        if (f.isFolder) ++totalFolders;
        else { ++totalFiles; totalSize += f.size; }
    }

    bool hasPass = false;
    auto r = ProcessHelper::runRox(QStringList{QStringLiteral("havepassphrase"), archivePath}, 5000);
    if (r.exitCode == 0 && r.stdOut.contains(QStringLiteral("Passphrase detected")))
        hasPass = true;

    setWindowTitle(L::get("info.title").replace(QStringLiteral("{0}"), fi.fileName()));
    setFixedSize(520, 480);
    ThemeManager::applyToWidget(this);

    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(28, 20, 28, 20);

    auto* headerLayout = new QHBoxLayout;
    auto* iconLabel = new QLabel;
    iconLabel->setPixmap(IconProvider::appIcon().pixmap(48, 48));
    headerLayout->addWidget(iconLabel);

    auto* titleLayout = new QVBoxLayout;
    auto* lblTitle = new QLabel(fi.fileName());
    lblTitle->setStyleSheet(QStringLiteral("font-size: 16pt; font-weight: bold; color: %1;").arg(ThemeManager::accentColor().name()));
    titleLayout->addWidget(lblTitle);
    auto* lblPath = new QLabel(fi.absolutePath());
    lblPath->setStyleSheet(QStringLiteral("color: %1; font-size: 8pt;").arg(ThemeManager::dimText().name()));
    titleLayout->addWidget(lblPath);
    headerLayout->addLayout(titleLayout);
    headerLayout->addStretch();
    layout->addLayout(headerLayout);

    auto* sep1 = new QFrame;
    sep1->setFrameShape(QFrame::HLine);
    layout->addWidget(sep1);

    auto* grid = new QGridLayout;
    int row = 0;
    auto addRow = [&](const QString& label, const QString& value) {
        grid->addWidget(dimLabel(label), row, 0);
        grid->addWidget(boldLabel(value), row, 1);
        ++row;
    };

    addRow(L::get("info.archiveSize"), SizeFormatter::format(fi.size()));
    addRow(L::get("info.contentSize"), SizeFormatter::format(totalSize));

    if (fi.size() > 0 && totalSize > 0) {
        double saved = (1.0 - double(fi.size()) / totalSize) * 100;
        auto compText = saved > 0
            ? L::get("info.saved").replace(QStringLiteral("{0}"), QString::number(saved, 'f', 1))
            : L::get("info.heavier").replace(QStringLiteral("{0}"), QString::number(-saved, 'f', 1));
        addRow(QStringLiteral("Compression"), compText);
    }

    addRow(L::get("info.files"), QString::number(totalFiles));
    addRow(L::get("info.folders"), QString::number(totalFolders));
    addRow(L::get("info.encryption"), hasPass ? L::get("info.encryptionYes") : L::get("info.encryptionNo"));

    layout->addLayout(grid);

    auto* sep2 = new QFrame;
    sep2->setFrameShape(QFrame::HLine);
    layout->addWidget(sep2);

    auto* dateGrid = new QGridLayout;
    int dRow = 0;
    dateGrid->addWidget(dimLabel(L::get("info.createdAt")), dRow, 0);
    dateGrid->addWidget(boldLabel(fi.birthTime().toString(QStringLiteral("dd/MM/yyyy HH:mm:ss"))), dRow++, 1);
    dateGrid->addWidget(dimLabel(L::get("info.modifiedAt")), dRow, 0);
    dateGrid->addWidget(boldLabel(fi.lastModified().toString(QStringLiteral("dd/MM/yyyy HH:mm:ss"))), dRow, 1);
    layout->addLayout(dateGrid);

    layout->addStretch();
    auto* btnClose = new QPushButton(L::get("info.close"));
    btnClose->setFixedSize(88, 32);
    connect(btnClose, &QPushButton::clicked, this, &QDialog::accept);
    auto* btnLayout = new QHBoxLayout;
    btnLayout->addStretch();
    btnLayout->addWidget(btnClose);
    layout->addLayout(btnLayout);
}
