#include "PassphraseManager.h"
#include <QMutex>

static QMutex s_mutex;
static QString s_cached;

static bool contains(const QString& text, const QString& needle) {
    return !text.isEmpty() && text.contains(needle, Qt::CaseInsensitive);
}

QString PassphraseManager::cachedPassphrase() {
    QMutexLocker lock(&s_mutex);
    return s_cached;
}

void PassphraseManager::save(const QString& pass) {
    QMutexLocker lock(&s_mutex);
    s_cached = pass;
}

void PassphraseManager::clear() {
    QMutexLocker lock(&s_mutex);
    s_cached.clear();
}

bool PassphraseManager::needsPassphrase(const QString& stdOut, const QString& stdErr) {
    return contains(stdOut, QStringLiteral("Passphrase required"))
        || contains(stdErr, QStringLiteral("Passphrase required"))
        || contains(stdOut, QStringLiteral("Encrypted payload"))
        || contains(stdErr, QStringLiteral("Encrypted payload"))
        || contains(stdOut, QStringLiteral("AES decryption failed"))
        || contains(stdErr, QStringLiteral("AES decryption failed"));
}

bool PassphraseManager::isDecryptionFailure(const QString& stdOut, const QString& stdErr) {
    return contains(stdOut, QStringLiteral("AES decryption failed"))
        || contains(stdErr, QStringLiteral("AES decryption failed"))
        || contains(stdOut, QStringLiteral("Encrypted payload"))
        || contains(stdErr, QStringLiteral("Encrypted payload"));
}

QString PassphraseManager::buildPassphraseArg(const QString& passphrase) {
    auto escaped = passphrase;
    escaped.replace('"', QStringLiteral("\\\""));
    return QStringLiteral("--passphrase \"%1\"").arg(escaped);
}
