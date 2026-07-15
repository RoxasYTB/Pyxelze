#pragma once
#include <QString>
#include <QStringList>

namespace PassphraseManager {
    QString cachedPassphrase();
    void save(const QString& pass);
    void clear();
    bool needsPassphrase(const QString& stdOut, const QString& stdErr);
    bool isDecryptionFailure(const QString& stdOut, const QString& stdErr);
    QStringList buildPassphraseArgs(const QString& passphrase);
}
