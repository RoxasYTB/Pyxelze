#pragma once
#include <QString>
#include <QStringList>

namespace L {
    void init();
    QString currentLang();
    QStringList availableLanguages();
    QString languageDisplayName(const QString& code);
    void setLanguage(const QString& lang);
    QString get(const QString& key);
    QString get(const QString& key, const QStringList& args);
}
