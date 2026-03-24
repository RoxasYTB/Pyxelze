#pragma once
#include <QString>

namespace PassphraseManager {
    QString cachedPassphrase();
    void save(const QString& pass);
    void clear();
    bool needsPassphrase(const QString& stdOut, const QString& stdErr);
    bool isDecryptionFailure(const QString& stdOut, const QString& stdErr);
    QString buildPassphraseArg(const QString& passphrase);
}
