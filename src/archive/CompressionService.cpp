#include "CompressionService.h"
#include "core/RoxRunner.h"
#include "core/ProcessHelper.h"
#include "core/Logger.h"
#include "security/PassphraseManager.h"
#include "helpers/TempHelper.h"
#include "ui/PassphraseDialog.h"
#include "ui/ProgressDialog.h"
#include "localization/Localization.h"
#include <QFileInfo>
#include <QDir>
#include <QFile>
#include <QUuid>

static bool isAccessDenied(const QString& err) {
    return err.contains(QStringLiteral("access denied"), Qt::CaseInsensitive)
        || err.contains(QStringLiteral("os error 5"), Qt::CaseInsensitive);
}

static bool compressViaTempFile(QWidget* parent, const QString& dirPath, const QString& outputFile, const QString& passArg) {
    auto tempFile = QDir::tempPath() + QStringLiteral("/pyxelze-encode-%1.png").arg(QUuid::createUuid().toString(QUuid::Id128));
    Logger::log(QStringLiteral("CompressViaTempFile: %1 -> %2").arg(dirPath, tempFile));

    auto args = QStringLiteral("encode \"%1\" \"%2\"%3").arg(dirPath, tempFile, passArg);
    auto r = ProgressDialog::runRoxWithProgress(parent, L::get("compression.fallback"), L::get("compression.fallbackProgress"), args);

    if (r.exitCode == 0 && QFile::exists(tempFile)) {
        QFile::remove(outputFile);
        if (QFile::rename(tempFile, outputFile))
            return true;
    }
    TempHelper::safeDeleteFile(tempFile);
    return false;
}

bool CompressionService::compressDirectory(QWidget* parent, const QString& dirPath, const QString& outputFile) {
    auto out = outputFile;
    if (out.isEmpty()) {
        QFileInfo fi(dirPath);
        out = fi.absolutePath() + QStringLiteral("/") + fi.fileName() + QStringLiteral(".png");
    }
    Logger::log(QStringLiteral("CompressDirectory: %1 -> %2").arg(dirPath, out));

    auto pass = PassphraseDialog::prompt(parent, L::get("compression.passphraseTitle"), L::get("compression.passphrasePrompt"));
    if (!pass.has_value()) return false;

    QString passArg;
    if (!pass->isEmpty())
        passArg = QStringLiteral(" ") + PassphraseManager::buildPassphraseArg(*pass);

    auto args = QStringLiteral("encode \"%1\" \"%2\"%3").arg(dirPath, out, passArg);
    auto r = ProgressDialog::runRoxWithProgress(parent, L::get("compression.encoding"), L::get("compression.encodingFile").replace(QStringLiteral("{0}"), QFileInfo(dirPath).fileName()), args);

    if (r.exitCode == 0 && QFile::exists(out))
        return true;

    if (isAccessDenied(r.stdErr))
        return compressViaTempFile(parent, dirPath, out, passArg);

    return false;
}
