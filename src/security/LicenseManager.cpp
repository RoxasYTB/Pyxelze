#include "LicenseManager.h"

#include "LicenseAlgorithm.h"
#include "localization/Localization.h"
#include "platform/PlatformService.h"
#include "ui/IconProvider.h"
#include "ui/ThemeManager.h"

#include <QDialog>
#include <QDialogButtonBox>
#include <QDir>
#include <QFile>
#include <QHBoxLayout>
#include <QLabel>
#include <QLineEdit>
#include <QMessageBox>
#include <QPushButton>
#include <QSettings>
#include <QStandardPaths>
#include <QVBoxLayout>

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
        QDialog dlg(parent);
        dlg.setWindowTitle(L::get(QStringLiteral("license.title")));
        dlg.setFixedSize(460, 280);
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

        root->addSpacing(24);

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
        QObject::connect(buttons, &QDialogButtonBox::accepted, &dlg, &QDialog::accept);
        QObject::connect(buttons, &QDialogButtonBox::rejected, &dlg, &QDialog::reject);
        root->addWidget(buttons);

        input->setFocus();

        if (dlg.exec() != QDialog::Accepted) {
            return false;
        }

        const QString entered = input->text().trimmed();

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
