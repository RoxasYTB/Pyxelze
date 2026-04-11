#include "UpdateChecker.h"
#include "core/AppConstants.h"
#include "core/Logger.h"
#include "localization/Localization.h"
#include "platform/PlatformService.h"
#include "ui/ThemeManager.h"
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QMessageBox>
#include <QVersionNumber>
#include <QProgressDialog>
#include <QApplication>
#include <QDir>
#include <QFile>
#include <QProcess>
#include <QStandardPaths>

static QNetworkAccessManager* netManager() {
    static auto* mgr = new QNetworkAccessManager;
    return mgr;
}

static QString platformAssetSuffix() {
#ifdef Q_OS_WIN
    return QStringLiteral(".exe");
#elif defined(Q_OS_MAC)
    return QStringLiteral(".dmg");
#else
    return QStringLiteral(".AppImage");
#endif
}

static void downloadAndInstall(QWidget* parent, const QString& url, QString version) {
    auto* progress = new QProgressDialog(
        L::get("update.downloading").replace(QStringLiteral("{0}"), version),
        L::get("dialog.cancel"),
        0, 100, parent
    );
    progress->setWindowTitle(L::get("update.availableTitle"));
    progress->setMinimumDuration(0);
    progress->setAutoClose(false);
    progress->setAutoReset(false);
    ThemeManager::applyToWidget(progress);
    progress->show();

    QNetworkRequest req{QUrl(url)};
    req.setRawHeader("User-Agent", "Pyxelze-Updater");
    req.setAttribute(QNetworkRequest::RedirectPolicyAttribute, QNetworkRequest::NoLessSafeRedirectPolicy);

    auto* reply = netManager()->get(req);

    QObject::connect(reply, &QNetworkReply::downloadProgress, progress, [progress](qint64 received, qint64 total) {
        if (total > 0)
            progress->setValue(static_cast<int>(received * 100 / total));
    });

    QObject::connect(progress, &QProgressDialog::canceled, reply, &QNetworkReply::abort);

    QObject::connect(reply, &QNetworkReply::finished, parent, [reply, progress, parent, version]() {
        reply->deleteLater();
        progress->deleteLater();

        if (reply->error() != QNetworkReply::NoError) {
            if (reply->error() != QNetworkReply::OperationCanceledError) {
                Logger::log(QStringLiteral("Update download failed: %1").arg(reply->errorString()));
                QMessageBox box(QMessageBox::Warning, L::get("update.availableTitle"),
                    L::get("update.downloadFailed"), QMessageBox::Ok, parent);
                ThemeManager::applyToWidget(&box);
                box.exec();
            }
            return;
        }

        auto data = reply->readAll();
        if (data.isEmpty()) {
            Logger::log(QStringLiteral("Update download empty"));
            return;
        }

#ifdef Q_OS_WIN
        auto tmpPath = QStandardPaths::writableLocation(QStandardPaths::TempLocation)
            + QStringLiteral("/Pyxelze-%1-Setup.exe").arg(version);
        QFile f(tmpPath);
        if (f.open(QIODevice::WriteOnly)) {
            f.write(data);
            f.close();
            QProcess::startDetached(tmpPath, {});
            QApplication::quit();
        }
#elif defined(Q_OS_MAC)
        auto tmpPath = QStandardPaths::writableLocation(QStandardPaths::TempLocation)
            + QStringLiteral("/Pyxelze-%1.dmg").arg(version);
        QFile f(tmpPath);
        if (f.open(QIODevice::WriteOnly)) {
            f.write(data);
            f.close();
            QProcess::startDetached(QStringLiteral("open"), {tmpPath});
        }
#else
        auto appPath = QApplication::applicationFilePath();
        auto isAppImage = !qEnvironmentVariableIsEmpty("APPIMAGE");
        auto targetPath = isAppImage ? QString::fromLocal8Bit(qgetenv("APPIMAGE")) : appPath;

        auto tmpPath = targetPath + QStringLiteral(".update");
        QFile f(tmpPath);
        if (f.open(QIODevice::WriteOnly)) {
            f.write(data);
            f.close();
            f.setPermissions(QFileDevice::ReadOwner | QFileDevice::WriteOwner | QFileDevice::ExeOwner
                | QFileDevice::ReadGroup | QFileDevice::ExeGroup
                | QFileDevice::ReadOther | QFileDevice::ExeOther);

            QFile::remove(targetPath + QStringLiteral(".old"));
            QFile::rename(targetPath, targetPath + QStringLiteral(".old"));
            QFile::rename(tmpPath, targetPath);

            QMessageBox box(QMessageBox::Information, L::get("update.availableTitle"),
                L::get("update.restartRequired"), QMessageBox::Ok, parent);
            ThemeManager::applyToWidget(&box);
            box.exec();
            QProcess::startDetached(targetPath, QApplication::arguments().mid(1));
            QApplication::quit();
        }
#endif
    });
}

void UpdateChecker::checkAsync(QWidget* parent, bool silent) {
    QNetworkRequest req(QUrl(QString::fromLatin1(AppConstants::GitHubApiUrl)));
    req.setRawHeader("User-Agent", "Pyxelze-Updater");
    req.setRawHeader("Accept", "application/vnd.github.v3+json");

    auto* reply = netManager()->get(req);
    QObject::connect(reply, &QNetworkReply::finished, parent, [reply, parent, silent]() {
        reply->deleteLater();
        if (reply->error() != QNetworkReply::NoError) {
            Logger::log(QStringLiteral("UpdateCheck failed: %1").arg(reply->errorString()));
            return;
        }

        auto doc = QJsonDocument::fromJson(reply->readAll());
        auto root = doc.object();
        auto tagName = root[QStringLiteral("tag_name")].toString();
        tagName.remove(QRegularExpression(QStringLiteral("^[vV]")));

        auto local = QVersionNumber::fromString(QString::fromLatin1(AppConstants::Version));
        auto remote = QVersionNumber::fromString(tagName);
        Logger::log(QStringLiteral("UpdateCheck: local=%1 remote=%2").arg(local.toString(), remote.toString()));

        if (remote <= local) {
            if (!silent) {
                QMessageBox box(QMessageBox::Information, L::get("dialog.update"), L::get("dialog.upToDate"), QMessageBox::Ok, parent);
                ThemeManager::applyToWidget(&box);
                box.exec();
            }
            return;
        }

        auto suffix = platformAssetSuffix();
        QString downloadUrl;
        auto assets = root[QStringLiteral("assets")].toArray();
        for (const auto& a : assets) {
            auto name = a.toObject()[QStringLiteral("name")].toString();
            if (name.endsWith(suffix, Qt::CaseInsensitive)) {
                downloadUrl = a.toObject()[QStringLiteral("browser_download_url")].toString();
                break;
            }
        }

        if (downloadUrl.isEmpty()) {
            downloadUrl = root[QStringLiteral("html_url")].toString();
            auto msg = L::get("update.available").replace(QStringLiteral("{0}"), tagName);
            QMessageBox box(QMessageBox::Question, L::get("update.availableTitle"), msg, QMessageBox::Yes | QMessageBox::No, parent);
            ThemeManager::applyToWidget(&box);
            if (box.exec() == QMessageBox::Yes)
                PlatformService::openUrl(downloadUrl);
            return;
        }

        auto msg = L::get("update.available").replace(QStringLiteral("{0}"), tagName);
        QMessageBox box(QMessageBox::Question, L::get("update.availableTitle"), msg, QMessageBox::Yes | QMessageBox::No, parent);
        ThemeManager::applyToWidget(&box);
        if (box.exec() == QMessageBox::Yes)
            downloadAndInstall(parent, downloadUrl, tagName);
    });
}
