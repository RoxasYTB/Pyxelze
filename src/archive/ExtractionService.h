#pragma once
#include "core/VirtualFile.h"
#include <QList>
#include <QString>
#include <QWidget>

namespace ExtractionService {
    bool extractArchive(QWidget* parent, const QString& archivePath, const QString& outputDir);
    bool extractWithProgress(QWidget* parent, const QString& archivePath, const QString& outputDir);
    bool extractFileSingle(QWidget* parent, const QString& archivePath, const QString& internalPath, const QString& outputPath);
    int extractMultipleFiles(QWidget* parent, const QString& archivePath, const QStringList& internalPaths, const QString& tempOut);
    bool decompressArchiveToDir(const QString& archivePath, const QString& outputDir);
    QString findExtractedFile(const QString& tempOut, const QString& internalPath);
    QList<VirtualFile> getFilesUnder(const QList<VirtualFile>& allFiles, const QString& folderPath);
    QStringList buildSelectiveExtractArgs(const QString& archivePath, const QString& outputDir, const QStringList& internalPaths);
    QStringList missingFiles(const QString& outputDir, const QStringList& internalPaths);
}
