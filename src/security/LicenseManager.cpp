#include "LicenseManager.h"

#include "LicenseAlgorithm.h"
#include "localization/Localization.h"
#include "platform/PlatformService.h"

#include <QDir>
#include <QFile>
#include <QInputDialog>
#include <QLineEdit>
#include <QMessageBox>
#include <QSettings>
#include <QStandardPaths>

namespace {
const QString kLicensePreferenceKey = QStringLiteral("license/key");

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

    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        return {};
    }

    return QString::fromUtf8(file.readAll()).trimmed();
}

void writeDurableLicense(const QString& key) {
    QFile file(durableLicensePath());

    if (!file.open(QIODevice::WriteOnly | QIODevice::Text | QIODevice::Truncate)) {
        return;
    }

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

QString findValidStoredLicense() {
    const QString pref = PlatformService::loadPreference(kLicensePreferenceKey, {}).toString().trimmed();
    if (LicenseAlgorithm::isValid(pref)) {
        return normalizeForStorage(pref);
    }

    const QString native = readNativeSettingsLicense();
    if (LicenseAlgorithm::isValid(native)) {
        return normalizeForStorage(native);
    }

    const QString durable = readDurableLicense();
    if (LicenseAlgorithm::isValid(durable)) {
        return normalizeForStorage(durable);
    }

    return {};
}
}

bool LicenseManager::ensureActivated(QWidget* parent) {
    const QString stored = findValidStoredLicense();

    if (!stored.isEmpty()) {
        persistLicenseEverywhere(stored);
        return true;
    }

    QString currentInput;

    while (true) {
        bool ok = false;
        const QString entered = QInputDialog::getText(
            parent,
            L::get(QStringLiteral("license.title")),
            L::get(QStringLiteral("license.prompt")),
            QLineEdit::Normal,
            currentInput,
            &ok
        ).trimmed();

        if (!ok) {
            return false;
        }

        if (LicenseAlgorithm::isValid(entered)) {
            persistLicenseEverywhere(entered);
            return true;
        }

        currentInput = entered;
        QMessageBox::warning(
            parent,
            L::get(QStringLiteral("license.title")),
            L::get(QStringLiteral("license.invalid"))
        );
    }
}
