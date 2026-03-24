#include <QApplication>
#include <QFile>
#include <QFileInfo>
#include <QFileDialog>
#include <QDir>
#include "core/AppConstants.h"
#include "localization/Localization.h"
#include "archive/ExtractionService.h"
#include "archive/CompressionService.h"
#include "ui/MainWindow.h"

static int runExtractHere(const QString& filePath) {
    L::init();
    auto info = QFileInfo(filePath);
    auto destDir = info.absolutePath() + QLatin1Char('/') + info.completeBaseName();
    QDir().mkpath(destDir);
    ExtractionService::extractWithProgress(nullptr, filePath, destDir);
    return 0;
}

static int runExtractTo(const QString& filePath) {
    L::init();
    auto dir = QFileDialog::getExistingDirectory(nullptr, L::get("toolbar.extractAll"));
    if (dir.isEmpty()) return 0;
    auto destDir = dir + QLatin1Char('/') + QFileInfo(filePath).completeBaseName();
    QDir().mkpath(destDir);
    ExtractionService::extractWithProgress(nullptr, filePath, destDir);
    return 0;
}

static int runEncode(const QString& filePath) {
    L::init();
    CompressionService::compressDirectory(nullptr, filePath);
    return 0;
}

int main(int argc, char* argv[]) {
    QApplication app(argc, argv);
    app.setApplicationName(QStringLiteral("Pyxelze"));
    app.setApplicationVersion(QString::fromLatin1(AppConstants::Version));
    app.setOrganizationName(QStringLiteral("Pyxelze"));

    QString action;
    QString fileToOpen;
    for (int i = 1; i < argc; ++i) {
        auto arg = QString::fromLocal8Bit(argv[i]);
        if (arg == QStringLiteral("--extract-here") || arg == QStringLiteral("--extract-to") || arg == QStringLiteral("--encode")) {
            action = arg;
        } else if (!arg.startsWith('-')) {
            fileToOpen = arg;
        }
    }

    if (!action.isEmpty() && !fileToOpen.isEmpty()) {
        if (action == QStringLiteral("--extract-here"))
            return runExtractHere(fileToOpen);
        if (action == QStringLiteral("--extract-to"))
            return runExtractTo(fileToOpen);
        if (action == QStringLiteral("--encode"))
            return runEncode(fileToOpen);
    }

    L::init();

    MainWindow w(fileToOpen);
    w.show();

    return app.exec();
}
