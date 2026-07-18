#include "LicenseManager.h"

#include "HardwareId.h"
#include "LicenseAlgorithm.h"
#include "core/AppConstants.h"
#include "localization/Localization.h"
#include "platform/PlatformService.h"
#include "ui/IconProvider.h"
#include "ui/ThemeManager.h"

#include <QCoreApplication>
#include <QDialog>
#include <QDialogButtonBox>
#include <QDir>
#include <QEventLoop>
#include <QFile>
#include <QHBoxLayout>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLabel>
#include <QLineEdit>
#include <QMessageBox>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QPushButton>
#include <QSettings>
#include <QStandardPaths>
#include <QTimer>
#include <QVBoxLayout>

namespace {
const QString kLicensePreferenceKey = QStringLiteral("license/key");
const QString kHwidPreferenceKey = QStringLiteral("license/hwid");
const QString kLastVerifiedKey = QStringLiteral("license/lastVerified");

static QNetworkAccessManager* net() {
    static auto* mgr = new QNetworkAccessManager;
    return mgr;
}

QString normalizeForStorage(const QString& raw) {
    const QString normalized = LicenseAlgorithm::normalize(raw);
    if (!normalized.startsWith(QStringLiteral("PYX")) || normalized.size() != 28) {
        return normalized;
    }
    const QString digits = normalized.mid(3);
    return QStringLiteral("PYX-%1-%2-%3-%4-%5")
        .arg(digits.mid(0, 5))
        .arg(digits.mid(5, 5))
        .arg(digits.mid(10, 5))
        .arg(digits.mid(15, 5))
        .arg(digits.mid(20, 5));
}

QString durableLicensePath() {
    QString base = QStandardPaths::writableLocation(QStandardPaths::GenericDataLocation);
    if (base.isEmpty()) {
        base = PlatformService::configDir();
    }
    const QString dir = base + QStringLiteral("/Pyxelze");
    QDir().mkpath(dir);
    return dir + QStringLiteral("/license.key");
}

QString readDurableLicense() {
    QFile file(durableLicensePath());
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) return {};
    return QString::fromUtf8(file.readAll()).trimmed();
}

void writeDurableLicense(const QString& key) {
    QFile file(durableLicensePath());
    if (!file.open(QIODevice::WriteOnly | QIODevice::Text | QIODevice::Truncate)) return;
    file.write(key.toUtf8());
}

QString readNativeSettingsLicense() {
    QSettings native(QStringLiteral("Pyxelze"), QStringLiteral("License"));
    return native.value(QStringLiteral("key")).toString().trimmed();
}

void writeNativeSettingsLicense(const QString& key) {
    QSettings native(QStringLiteral("Pyxelze"), QStringLiteral("License"));
    native.setValue(QStringLiteral("key"), key);
}

void persistLicenseEverywhere(const QString& key) {
    const QString canonical = normalizeForStorage(key);
    PlatformService::savePreference(kLicensePreferenceKey, canonical);
    writeNativeSettingsLicense(canonical);
    writeDurableLicense(canonical);
}

void clearAllLicenseData() {
    PlatformService::savePreference(kLicensePreferenceKey, {});
    PlatformService::savePreference(kHwidPreferenceKey, {});
    PlatformService::savePreference(kLastVerifiedKey, {});
    QSettings native(QStringLiteral("Pyxelze"), QStringLiteral("License"));
    native.remove(QStringLiteral("key"));
    QFile::remove(durableLicensePath());
}

QString findStoredKey() {
    const QString pref = PlatformService::loadPreference(kLicensePreferenceKey, {}).toString().trimmed();
    if (!pref.isEmpty()) return normalizeForStorage(pref);

    const QString native = readNativeSettingsLicense();
    if (!native.isEmpty()) return normalizeForStorage(native);

    const QString durable = readDurableLicense();
    if (!durable.isEmpty()) return normalizeForStorage(durable);

    return {};
}

QString findStoredHwid() {
    return PlatformService::loadPreference(kHwidPreferenceKey, {}).toString().trimmed();
}

struct LicenseCheckResult {
    enum Status { Valid, Invalid, Offline };
    Status status;
    QString message;
};

LicenseCheckResult checkLicenseOnline(const QString& key, const QString& hwid) {
    const QString url = QString::fromLatin1(AppConstants::LicenseApiBaseUrl) + QStringLiteral("/validate");
    QNetworkRequest req{QUrl(url)};
    req.setHeader(QNetworkRequest::ContentTypeHeader, QStringLiteral("application/json"));
    req.setTransferTimeout(10000);

    const QString bodyJson = QStringLiteral(R"({"key":"%1","hardware_id":"%2"})")
        .arg(key, hwid);

    auto* reply = net()->post(req, bodyJson.toUtf8());

    QEventLoop loop;
    QTimer timeout;
    timeout.setSingleShot(true);
    QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    QObject::connect(&timeout, &QTimer::timeout, &loop, &QEventLoop::quit);
    timeout.start(10000);
    loop.exec();

    if (!reply->isFinished()) {
        reply->abort();
        reply->deleteLater();
        return {LicenseCheckResult::Offline, QStringLiteral("Server unreachable")};
    }

    const auto statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    const auto data = reply->readAll();
    reply->deleteLater();

    if (statusCode == 429) {
        return {LicenseCheckResult::Offline, QStringLiteral("Rate limited")};
    }

    const auto doc = QJsonDocument::fromJson(data);
    if (!doc.isObject()) {
        return {LicenseCheckResult::Offline, QStringLiteral("Invalid response")};
    }

    const auto obj = doc.object();
    if (!obj[QStringLiteral("valid")].toBool()) {
        return {LicenseCheckResult::Invalid, L::get(QStringLiteral("license.invalid"))};
    }

    const bool isBound = obj[QStringLiteral("bound")].toBool();
    const bool matchesHwid = obj[QStringLiteral("matchesHwid")].toBool();

    if (!isBound || matchesHwid) {
        return {LicenseCheckResult::Valid, {}};
    }

    return {LicenseCheckResult::Invalid, L::get(QStringLiteral("license.differentDevice"))};
}

bool activateLicenseOnline(const QString& key, const QString& hwid) {
    const QString url = QString::fromLatin1(AppConstants::LicenseApiBaseUrl) + QStringLiteral("/activate");
    QNetworkRequest req{QUrl(url)};
    req.setHeader(QNetworkRequest::ContentTypeHeader, QStringLiteral("application/json"));
    req.setTransferTimeout(15000);

    const QString bodyJson = QStringLiteral(R"({"key":"%1","hardware_id":"%2"})")
        .arg(key, hwid);

    auto* reply = net()->post(req, bodyJson.toUtf8());

    QEventLoop loop;
    QTimer timeout;
    timeout.setSingleShot(true);
    QObject::connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
    QObject::connect(&timeout, &QTimer::timeout, &loop, &QEventLoop::quit);
    timeout.start(15000);
    loop.exec();

    if (!reply->isFinished()) {
        reply->abort();
        reply->deleteLater();
        return false;
    }

    const auto statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    const auto data = reply->readAll();
    reply->deleteLater();

    if (statusCode != 200) return false;

    const auto doc = QJsonDocument::fromJson(data);
    return doc.isObject() && doc.object()[QStringLiteral("success")].toBool();
}
}

bool LicenseManager::ensureActivated(QWidget* parent) {
    const QString storedKey = findStoredKey();
    const QString currentHwid = HardwareId::generate();

    if (!storedKey.isEmpty()) {
        const auto result = checkLicenseOnline(storedKey, currentHwid);
        switch (result.status) {
            case LicenseCheckResult::Valid: {
                PlatformService::savePreference(kHwidPreferenceKey, currentHwid);
                PlatformService::savePreference(kLastVerifiedKey, QDateTime::currentSecsSinceEpoch());
                persistLicenseEverywhere(storedKey);
                return true;
            }
            case LicenseCheckResult::Invalid: {
                clearAllLicenseData();
                QMessageBox box(
                    QMessageBox::Warning,
                    L::get(QStringLiteral("license.title")),
                    L::get(QStringLiteral("license.invalid")),
                    QMessageBox::Ok,
                    parent
                );
                ThemeManager::applyToWidget(&box);
                box.exec();
                break;
            }
            case LicenseCheckResult::Offline: {
                const qint64 lastVerified = PlatformService::loadPreference(kLastVerifiedKey, 0).toLongLong();
                const qint64 now = QDateTime::currentSecsSinceEpoch();
                const int graceDays = AppConstants::LicenseOfflineGraceDays;
                if (lastVerified > 0 && (now - lastVerified) < graceDays * 86400) {
                    return true;
                }
                const auto answer = QMessageBox::question(
                    parent,
                    L::get(QStringLiteral("license.title")),
                    L::get(QStringLiteral("license.offline")),
                    QMessageBox::Yes | QMessageBox::No
                );
                if (answer == QMessageBox::Yes) {
                    return true;
                }
                clearAllLicenseData();
            }
        }
    }

    QString currentInput;
    while (true) {
        QDialog dlg(parent);
        dlg.setWindowTitle(L::get(QStringLiteral("license.title")));
        dlg.setFixedSize(460, 320);
        ThemeManager::applyToWidget(&dlg);

        auto accent = ThemeManager::accentColor();
        auto dim = ThemeManager::dimText();
        auto fg = ThemeManager::windowFore();

        auto* root = new QVBoxLayout(&dlg);
        root->setContentsMargins(32, 28, 32, 24);
        root->setSpacing(0);

        auto* header = new QHBoxLayout;
        header->setSpacing(16);
        auto* iconLbl = new QLabel;
        iconLbl->setPixmap(IconProvider::appIcon().pixmap(48, 48));
        iconLbl->setFixedSize(48, 48);
        header->addWidget(iconLbl);

        auto* titleCol = new QVBoxLayout;
        titleCol->setSpacing(4);
        auto* titleLbl = new QLabel(QStringLiteral("Pyxelze"));
        titleLbl->setStyleSheet(QStringLiteral("font-size: 20pt; font-weight: bold; color: %1;").arg(accent.name()));
        titleCol->addWidget(titleLbl);
        auto* subtitleLbl = new QLabel(L::get(QStringLiteral("license.title")));
        subtitleLbl->setStyleSheet(QStringLiteral("font-size: 10pt; color: %1;").arg(dim.name()));
        titleCol->addWidget(subtitleLbl);
        header->addLayout(titleCol);
        header->addStretch();
        root->addLayout(header);

        root->addSpacing(24);

        auto* promptLbl = new QLabel(L::get(QStringLiteral("license.prompt")));
        promptLbl->setStyleSheet(QStringLiteral("font-size: 10pt; color: %1; margin-bottom: 8px;").arg(fg.name()));
        root->addWidget(promptLbl);

        root->addSpacing(8);

        auto* input = new QLineEdit;
        input->setPlaceholderText(QStringLiteral("PYX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"));
        input->setText(currentInput);
        input->setStyleSheet(QStringLiteral(
            "QLineEdit {"
            "  font-size: 12pt; font-family: 'Consolas', 'Courier New', monospace;"
            "  padding: 10px 14px;"
            "  border: 2px solid %1;"
            "  border-radius: 8px;"
            "  background: %2;"
            "  color: %3;"
            "}"
            "QLineEdit:focus { border-color: %4; }"
        ).arg(ThemeManager::borderColor().name(),
              ThemeManager::controlBack().name(),
              fg.name(),
              accent.name()));
        root->addWidget(input);

        auto* statusLbl = new QLabel;
        statusLbl->setVisible(false);
        statusLbl->setStyleSheet(QStringLiteral("font-size: 9pt; color: %1; margin-top: 8px;").arg(dim.name()));
        root->addWidget(statusLbl);

        root->addSpacing(16);

        auto* buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel);
        auto* okBtn = buttons->button(QDialogButtonBox::Ok);
        okBtn->setText(L::get(QStringLiteral("license.title")));
        okBtn->setStyleSheet(QStringLiteral(
            "QPushButton {"
            "  background: %1; color: white; font-weight: bold;"
            "  padding: 8px 24px; border-radius: 6px; font-size: 10pt;"
            "}"
            "QPushButton:hover { opacity: 0.9; }"
        ).arg(accent.name()));

        auto* cancelBtn = buttons->button(QDialogButtonBox::Cancel);
        QObject::connect(buttons, &QDialogButtonBox::accepted, &dlg, &QDialog::accept);
        QObject::connect(buttons, &QDialogButtonBox::rejected, &dlg, &QDialog::reject);
        root->addWidget(buttons);

        input->setFocus();

        const int accepted = dlg.exec();
        if (accepted != QDialog::Accepted) return false;

        const QString entered = input->text().trimmed();
        if (entered.isEmpty()) continue;

        const QString normalized = LicenseAlgorithm::normalize(entered);
        if (normalized.size() < 25 || !normalized.startsWith(QStringLiteral("PYX"))) {
            currentInput = entered;
            statusLbl->setText(L::get(QStringLiteral("license.invalid")));
            statusLbl->setStyleSheet(QStringLiteral("font-size: 9pt; color: #e74c3c; margin-top: 8px;"));
            statusLbl->setVisible(true);
            continue;
        }

        okBtn->setEnabled(false);
        cancelBtn->setEnabled(false);
        input->setEnabled(false);
        statusLbl->setText(L::get(QStringLiteral("license.verifying")));
        statusLbl->setStyleSheet(QStringLiteral("font-size: 9pt; color: %1; margin-top: 8px;").arg(dim.name()));
        statusLbl->setVisible(true);
        QCoreApplication::processEvents();

        const bool activated = activateLicenseOnline(normalized, currentHwid);

        okBtn->setEnabled(true);
        cancelBtn->setEnabled(true);
        input->setEnabled(true);

        if (activated) {
            persistLicenseEverywhere(normalized);
            PlatformService::savePreference(kHwidPreferenceKey, currentHwid);
            PlatformService::savePreference(kLastVerifiedKey, QDateTime::currentSecsSinceEpoch());
            return true;
        }

        currentInput = entered;
        statusLbl->setText(L::get(QStringLiteral("license.activationFailed")));
        statusLbl->setStyleSheet(QStringLiteral("font-size: 9pt; color: #e74c3c; margin-top: 8px;"));
        statusLbl->setVisible(true);
    }
}
