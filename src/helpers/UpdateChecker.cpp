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

static QNetworkAccessManager* netManager() {
    static auto* mgr = new QNetworkAccessManager;
    return mgr;
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

        QString downloadUrl;
        auto assets = root[QStringLiteral("assets")].toArray();
        for (const auto& a : assets) {
            auto name = a.toObject()[QStringLiteral("name")].toString();
#ifdef Q_OS_WIN
            if (name.endsWith(QStringLiteral(".exe"), Qt::CaseInsensitive)) {
#elif defined(Q_OS_MAC)
            if (name.endsWith(QStringLiteral(".dmg"), Qt::CaseInsensitive)
                || name.endsWith(QStringLiteral(".pkg"), Qt::CaseInsensitive)
                || name.endsWith(QStringLiteral(".zip"), Qt::CaseInsensitive)) {
#else
            if (name.endsWith(QStringLiteral(".deb"), Qt::CaseInsensitive) || name.endsWith(QStringLiteral(".AppImage"), Qt::CaseInsensitive)) {
#endif
                downloadUrl = a.toObject()[QStringLiteral("browser_download_url")].toString();
                break;
            }
        }
        if (downloadUrl.isEmpty())
            downloadUrl = root[QStringLiteral("html_url")].toString();

        auto msg = L::get("update.available").replace(QStringLiteral("{0}"), tagName);
        QMessageBox box(QMessageBox::Question, L::get("update.availableTitle"), msg, QMessageBox::Yes | QMessageBox::No, parent);
        ThemeManager::applyToWidget(&box);
        auto ans = box.exec();
        if (ans == QMessageBox::Yes)
            PlatformService::openUrl(downloadUrl);
    });
}
