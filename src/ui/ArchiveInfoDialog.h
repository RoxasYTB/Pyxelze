#pragma once
#include "core/VirtualFile.h"
#include <QDialog>
#include <QList>
#include <QString>

class ArchiveInfoDialog : public QDialog {
    Q_OBJECT
public:
    ArchiveInfoDialog(QWidget* parent, const QString& archivePath, const QList<VirtualFile>& allFiles, const QString& encryptionText);
};
