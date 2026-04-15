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
#include <QJsonArray>
#include <QJsonDocument>
#include <QSet>
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

static QStringList buildDecompressArgs(const QString& archivePath, const QString& outputDir, const QStringList& extraArgs = {}) {
    QStringList args{QStringLiteral("decompress"), archivePath, outputDir};
    args.append(extraArgs);
    return args;
}

static QStringList buildDecompressArgsWithPass(const QString& archivePath, const QString& outputDir, const QString& passphrase, const QStringList& extraArgs = {}) {
    QStringList args{QStringLiteral("decompress"), archivePath};
    if (!passphrase.isEmpty())
        args.append(PassphraseManager::buildPassphraseArgs(passphrase));
    args.append(outputDir);
    args.append(extraArgs);
    return args;
}

static QStringList buildFilesArgs(const QStringList& internalPaths) {
    QJsonArray files;
    QSet<QString> seen;
    for (const auto& path : internalPaths) {
        auto normalized = path.trimmed();
        if (normalized.isEmpty() || seen.contains(normalized)) continue;
        seen.insert(normalized);
        files.append(normalized);
    }
    return {QStringLiteral("--files"), QString::fromUtf8(QJsonDocument(files).toJson(QJsonDocument::Compact))};
}

static QString extractedOutputPath(const QString& outputDir, const QString& internalPath) {
    auto rel = internalPath;
    rel.replace('/', QDir::separator());
    return QDir(outputDir).filePath(rel);
}

static QStringList missingInternalPaths(const QString& outputDir, const QStringList& internalPaths) {
    QStringList missing;
    QSet<QString> seen;
    for (const auto& path : internalPaths) {
        auto normalized = path.trimmed();
        if (normalized.isEmpty() || seen.contains(normalized)) continue;
        seen.insert(normalized);
        if (!QFileInfo::exists(extractedOutputPath(outputDir, normalized)))
            missing.append(normalized);
    }
    return missing;
}

static bool extractRequestedToDir(QWidget* parent, const QString& archivePath, const QStringList& internalPaths, const QString& outputDir) {
    if (archivePath.isEmpty() || internalPaths.isEmpty()) return false;

    QDir().mkpath(outputDir);
    const auto missingPaths = missingInternalPaths(outputDir, internalPaths);
    if (missingPaths.isEmpty()) return true;
    const auto extraArgs = buildFilesArgs(missingPaths);

    auto runWithPass = [&](const QString& passphrase) {
        auto args = passphrase.isEmpty()
            ? buildDecompressArgs(archivePath, outputDir, extraArgs)
            : buildDecompressArgsWithPass(archivePath, outputDir, passphrase, extraArgs);
        return ProcessHelper::runRox(args);
    };

    auto cached = PassphraseManager::cachedPassphrase();
    auto r = runWithPass(cached);
    if (r.exitCode == 0 && ProcessHelper::directoryHasEntries(outputDir)) {
        if (!cached.isEmpty()) PassphraseManager::save(cached);
        return true;
    }
    if (!PassphraseManager::needsPassphrase(r.stdOut, r.stdErr) || parent == nullptr) {
        return false;
    }

    QString errorMsg;
    while (true) {
        auto pass = PassphraseDialog::prompt(parent, L::get("passphrase.required"), L::get("passphrase.prompt"), errorMsg);
        if (!pass.has_value()) return false;
        r = runWithPass(*pass);
        if (r.exitCode == 0 && ProcessHelper::directoryHasEntries(outputDir)) {
            PassphraseManager::save(*pass);
            return true;
        }
        if (!PassphraseManager::isDecryptionFailure(r.stdOut, r.stdErr)) {
            return false;
        }
        errorMsg = L::get("dialog.wrongPassword");
    }
}

static bool runPassphraseRetryLoop(QWidget* parent, const QString& archivePath, const QString& outputDir) {
    QString errorMsg;
    while (true) {
        auto pass = PassphraseDialog::prompt(parent, L::get("passphrase.required"), L::get("passphrase.prompt"), errorMsg);
        if (!pass.has_value()) return false;

        auto args = buildDecompressArgsWithPass(archivePath, outputDir, *pass);
        auto r = ProcessHelper::runRox(args);
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

        auto args = buildDecompressArgsWithPass(archivePath, outputDir, pass);
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

    auto cached = PassphraseManager::cachedPassphrase();
    auto args = cached.isEmpty()
        ? buildDecompressArgs(archivePath, tempDir)
        : buildDecompressArgsWithPass(archivePath, tempDir, cached);

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

    auto r = ProcessHelper::runRox(buildDecompressArgs(archivePath, outputDir));

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

    auto cached = PassphraseManager::cachedPassphrase();
    auto args = cached.isEmpty()
        ? buildDecompressArgs(archivePath, outputDir)
        : buildDecompressArgsWithPass(archivePath, outputDir, cached);

    auto r = ProgressDialog::runRoxWithProgress(parent, L::get("extraction.title"), L::get("extraction.progress"), args);

    if (PassphraseManager::needsPassphrase(r.stdOut, r.stdErr))
        return extractWithPassphraseLoop(parent, archivePath, outputDir);

    if (r.exitCode == 0 && ProcessHelper::directoryHasEntries(outputDir))
        return true;

    if (isAccessDenied(r.stdErr))
        return extractViaTempDir(parent, archivePath, outputDir);

    return false;
}

bool ExtractionService::extractFileSingle(QWidget* parent, const QString& archivePath, const QString& internalPath, const QString& outputPath) {
    Logger::logDnd(QStringLiteral("ExtractFileSingle: %1 -> %2").arg(internalPath, outputPath));
    if (archivePath.isEmpty()) return false;

    auto tempOut = TempHelper::createTempDir(QStringLiteral("pyxelze_extract"));
    auto cleanup = qScopeGuard([&]{ TempHelper::safeDelete(tempOut); });

    if (!extractRequestedToDir(parent, archivePath, {internalPath}, tempOut)) return false;

    auto sourceFull = findExtractedFile(tempOut, internalPath);
    if (sourceFull.isEmpty()) return false;

    QDir().mkpath(QFileInfo(outputPath).absolutePath());
    QFile::remove(outputPath);
    return QFile::copy(sourceFull, outputPath);
}

int ExtractionService::extractMultipleFiles(QWidget* parent, const QString& archivePath, const QStringList& internalPaths, const QString& tempOut) {
    Logger::logDnd(QStringLiteral("ExtractMultipleFiles: %1 files -> %2").arg(internalPaths.size()).arg(tempOut));
    if (archivePath.isEmpty()) return 0;

    QDir().mkpath(tempOut);
    if (!extractRequestedToDir(parent, archivePath, internalPaths, tempOut)) return 0;

    int found = 0;
    for (const auto& p : internalPaths) {
        if (!findExtractedFile(tempOut, p).isEmpty())
            ++found;
    }
    return found;
}

bool ExtractionService::decompressArchiveToDir(const QString& archivePath, const QString& outputDir) {
    QDir().mkpath(outputDir);
    auto cached = PassphraseManager::cachedPassphrase();
    auto args = cached.isEmpty()
        ? buildDecompressArgs(archivePath, outputDir)
        : buildDecompressArgsWithPass(archivePath, outputDir, cached);

    auto r = ProcessHelper::runRox(args);
    Logger::log(QStringLiteral("DecompressArchiveToDir: exit=%1").arg(r.exitCode));

    if (PassphraseManager::needsPassphrase(r.stdOut, r.stdErr) && r.exitCode != 0)
        return runPassphraseRetryLoop(nullptr, archivePath, outputDir);

    return r.exitCode == 0;
}

QString ExtractionService::findExtractedFile(const QString& tempOut, const QString& internalPath) {
    auto sourceFull = extractedOutputPath(tempOut, internalPath);
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

QStringList ExtractionService::buildSelectiveExtractArgs(const QString& archivePath, const QString& outputDir, const QStringList& internalPaths) {
    if (archivePath.isEmpty()) return {};
    const auto extraArgs = buildFilesArgs(internalPaths);
    if (extraArgs.isEmpty()) return {};

    const auto cached = PassphraseManager::cachedPassphrase();
    return cached.isEmpty()
        ? buildDecompressArgs(archivePath, outputDir, extraArgs)
        : buildDecompressArgsWithPass(archivePath, outputDir, cached, extraArgs);
}

QStringList ExtractionService::missingFiles(const QString& outputDir, const QStringList& internalPaths) {
    return missingInternalPaths(outputDir, internalPaths);
}
