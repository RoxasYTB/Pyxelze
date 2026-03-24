#include "ExtractionService.h"
#include <QDirIterator>
#include "core/RoxRunner.h"
#include "core/ProcessHelper.h"
#include "core/Logger.h"
#include "security/PassphraseManager.h"
#include "helpers/TempHelper.h"
#include "ui/PassphraseDialog.h"
#include "ui/ProgressDialog.h"
#include "localization/Localization.h"
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QUuid>

static bool isAccessDenied(const QString& err) {
    return err.contains(QStringLiteral("access denied"), Qt::CaseInsensitive)
        || err.contains(QStringLiteral("os error 5"), Qt::CaseInsensitive);
}

static bool canWriteTo(const QString& dir) {
    QDir().mkpath(dir);
    auto testFile = dir + QStringLiteral("/.pyxelze_test_") + QUuid::createUuid().toString(QUuid::Id128);
    QFile f(testFile);
    if (f.open(QIODevice::WriteOnly)) {
        f.write("test");
        f.close();
        QFile::remove(testFile);
        return true;
    }
    return false;
}

static bool runPassphraseRetryLoop(QWidget* parent, const QString& archivePath, const QString& outputDir) {
    QString errorMsg;
    while (true) {
        auto pass = PassphraseDialog::prompt(parent, L::get("passphrase.required"), L::get("passphrase.prompt"), errorMsg);
        if (!pass.has_value()) return false;

        auto passArg = PassphraseManager::buildPassphraseArg(*pass);
        auto args = QStringLiteral("decompress \"%1\" %2 \"%3\"").arg(archivePath, passArg, outputDir);
        auto r = ProcessHelper::runRox(args.split(' '));
        if (r.exitCode == 0) {
            PassphraseManager::save(*pass);
            return true;
        }
        if (PassphraseManager::isDecryptionFailure(r.stdOut, r.stdErr)) {
            errorMsg = L::get("dialog.wrongPassword");
            continue;
        }
        return false;
    }
}

static bool extractWithPassphraseLoop(QWidget* parent, const QString& archivePath, const QString& outputDir) {
    auto pass = PassphraseManager::cachedPassphrase();
    QString errorMsg;

    while (true) {
        if (pass.isEmpty()) {
            auto result = PassphraseDialog::prompt(parent, L::get("passphrase.required"), L::get("passphrase.prompt"), errorMsg);
            if (!result.has_value()) return false;
            pass = *result;
        }

        auto passArg = PassphraseManager::buildPassphraseArg(pass);
        auto args = QStringLiteral("decompress \"%1\" %2 \"%3\"").arg(archivePath, passArg, outputDir);
        auto r = ProgressDialog::runRoxWithProgress(parent, L::get("extraction.decrypting"), L::get("extraction.decryptingProgress"), args);

        if (r.exitCode == 0 && ProcessHelper::directoryHasEntries(outputDir)) {
            PassphraseManager::save(pass);
            return true;
        }

        if (PassphraseManager::isDecryptionFailure(r.stdOut, r.stdErr)) {
            if (PassphraseManager::cachedPassphrase() == pass)
                PassphraseManager::clear();
            errorMsg = L::get("dialog.wrongPassword");
            pass.clear();
            continue;
        }
        return false;
    }
}

static bool extractViaTempDir(QWidget* parent, const QString& archivePath, const QString& outputDir) {
    auto tempDir = TempHelper::createTempDir(QStringLiteral("pyxelze-extract"));
    Logger::log(QStringLiteral("ExtractViaTempDir: %1 -> temp=%2 -> final=%3").arg(archivePath, tempDir, outputDir));

    auto args = QStringLiteral("decompress \"%1\" \"%2\"").arg(archivePath, tempDir);
    auto cached = PassphraseManager::cachedPassphrase();
    if (!cached.isEmpty())
        args = QStringLiteral("decompress \"%1\" %2 \"%3\"").arg(archivePath, PassphraseManager::buildPassphraseArg(cached), tempDir);

    auto r = ProgressDialog::runRoxWithProgress(parent, L::get("extraction.fallback"), L::get("extraction.fallbackProgress"), args);

    if (PassphraseManager::needsPassphrase(r.stdOut, r.stdErr)) {
        if (!runPassphraseRetryLoop(parent, archivePath, tempDir)) {
            TempHelper::safeDelete(tempDir);
            return false;
        }
    }

    if (ProcessHelper::directoryHasEntries(tempDir)) {
        TempHelper::moveContents(tempDir, outputDir);
        TempHelper::safeDelete(tempDir);
        return true;
    }

    TempHelper::safeDelete(tempDir);
    return false;
}

bool ExtractionService::extractArchive(QWidget* parent, const QString& archivePath, const QString& outputDir) {
    QDir().mkpath(outputDir);
    Logger::log(QStringLiteral("ExtractArchive: %1 -> %2").arg(archivePath, outputDir));

    if (!canWriteTo(outputDir))
        return extractViaTempDir(parent, archivePath, outputDir);

    auto r = ProcessHelper::runRox(QStringList{QStringLiteral("decompress"), archivePath, outputDir});

    if (PassphraseManager::needsPassphrase(r.stdOut, r.stdErr))
        return extractWithPassphraseLoop(parent, archivePath, outputDir);

    if (r.exitCode == 0 && ProcessHelper::directoryHasEntries(outputDir))
        return true;

    if (isAccessDenied(r.stdErr))
        return extractViaTempDir(parent, archivePath, outputDir);

    return false;
}

bool ExtractionService::extractWithProgress(QWidget* parent, const QString& archivePath, const QString& outputDir) {
    QDir().mkpath(outputDir);
    Logger::log(QStringLiteral("ExtractWithProgress: %1 -> %2").arg(archivePath, outputDir));

    auto args = QStringLiteral("decompress \"%1\" \"%2\"").arg(archivePath, outputDir);
    auto cached = PassphraseManager::cachedPassphrase();
    if (!cached.isEmpty())
        args = QStringLiteral("decompress \"%1\" %2 \"%3\"").arg(archivePath, PassphraseManager::buildPassphraseArg(cached), outputDir);

    auto r = ProgressDialog::runRoxWithProgress(parent, L::get("extraction.title"), L::get("extraction.progress"), args);

    if (PassphraseManager::needsPassphrase(r.stdOut, r.stdErr))
        return extractWithPassphraseLoop(parent, archivePath, outputDir);

    if (r.exitCode == 0 && ProcessHelper::directoryHasEntries(outputDir))
        return true;

    if (isAccessDenied(r.stdErr))
        return extractViaTempDir(parent, archivePath, outputDir);

    return false;
}

bool ExtractionService::extractFileSingle(const QString& archivePath, const QString& internalPath, const QString& outputPath) {
    Logger::logDnd(QStringLiteral("ExtractFileSingle: %1 -> %2").arg(internalPath, outputPath));
    if (archivePath.isEmpty()) return false;

    auto tempOut = TempHelper::createTempDir(QStringLiteral("pyxelze_extract"));
    auto cleanup = qScopeGuard([&]{ TempHelper::safeDelete(tempOut); });

    auto escaped = internalPath;
    escaped.replace('"', QStringLiteral("\\\""));
    QString args;
    auto cached = PassphraseManager::cachedPassphrase();
    if (!cached.isEmpty())
        args = QStringLiteral("decompress \"%1\" %2 \"%3\" --files \"%4\"").arg(archivePath, PassphraseManager::buildPassphraseArg(cached), tempOut, escaped);
    else
        args = QStringLiteral("decompress \"%1\" \"%2\" --files \"%3\"").arg(archivePath, tempOut, escaped);

    auto r = ProcessHelper::runRox(QStringList{args});
    if (r.exitCode != 0 || !ProcessHelper::directoryHasEntries(tempOut)) {
        if (!cached.isEmpty())
            args = QStringLiteral("decompress \"%1\" %2 \"%3\"").arg(archivePath, PassphraseManager::buildPassphraseArg(cached), tempOut);
        else
            args = QStringLiteral("decompress \"%1\" \"%2\"").arg(archivePath, tempOut);
        ProcessHelper::runRox(QStringList{args});
    }

    auto sourceFull = findExtractedFile(tempOut, internalPath);
    if (sourceFull.isEmpty()) return false;

    QDir().mkpath(QFileInfo(outputPath).absolutePath());
    QFile::remove(outputPath);
    return QFile::copy(sourceFull, outputPath);
}

int ExtractionService::extractMultipleFiles(const QString& archivePath, const QStringList& internalPaths, const QString& tempOut) {
    Logger::logDnd(QStringLiteral("ExtractMultipleFiles: %1 files -> %2").arg(internalPaths.size()).arg(tempOut));
    if (archivePath.isEmpty()) return 0;

    QDir().mkpath(tempOut);
    if (!decompressArchiveToDir(archivePath, tempOut)) return 0;

    int found = 0;
    for (const auto& p : internalPaths) {
        if (!findExtractedFile(tempOut, p).isEmpty())
            ++found;
    }
    return found;
}

bool ExtractionService::decompressArchiveToDir(const QString& archivePath, const QString& outputDir) {
    QDir().mkpath(outputDir);
    QString args;
    auto cached = PassphraseManager::cachedPassphrase();
    if (!cached.isEmpty())
        args = QStringLiteral("decompress \"%1\" %2 \"%3\"").arg(archivePath, PassphraseManager::buildPassphraseArg(cached), outputDir);
    else
        args = QStringLiteral("decompress \"%1\" \"%2\"").arg(archivePath, outputDir);

    auto r = ProcessHelper::runRox(QStringList{args});
    Logger::log(QStringLiteral("DecompressArchiveToDir: exit=%1").arg(r.exitCode));

    if (PassphraseManager::needsPassphrase(r.stdOut, r.stdErr) && r.exitCode != 0)
        return runPassphraseRetryLoop(nullptr, archivePath, outputDir);

    return r.exitCode == 0;
}

QString ExtractionService::findExtractedFile(const QString& tempOut, const QString& internalPath) {
    auto sourceRel = internalPath;
    sourceRel.replace('/', QDir::separator());
    auto sourceFull = tempOut + QDir::separator() + sourceRel;
    if (QFile::exists(sourceFull)) return sourceFull;

    QDir dir(tempOut);
    auto fileName = QFileInfo(internalPath).fileName();
    auto matches = dir.entryList(QStringList{fileName}, QDir::Files, QDir::NoSort);
    if (!matches.isEmpty())
        return tempOut + QDir::separator() + matches.first();

    QDirIterator it(tempOut, QStringList{fileName}, QDir::Files, QDirIterator::Subdirectories);
    if (it.hasNext()) return it.next();

    return {};
}

QList<VirtualFile> ExtractionService::getFilesUnder(const QList<VirtualFile>& allFiles, const QString& folderPath) {
    QList<VirtualFile> result;
    if (folderPath.isEmpty()) return result;
    auto prefix = folderPath + QStringLiteral("/");
    for (const auto& f : allFiles) {
        if (!f.isFolder && f.fullPath.startsWith(prefix))
            result.append(f);
    }
    return result;
}
