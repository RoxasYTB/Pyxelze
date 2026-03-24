#include "Localization.h"
#include <QFile>
#include <QHash>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLocale>

static QHash<QString, QHash<QString, QString>> s_strings;
static QString s_currentLang = QStringLiteral("fr");
static bool s_initialized = false;

static const QStringList s_langs = {
    QStringLiteral("fr"), QStringLiteral("en"), QStringLiteral("de"),
    QStringLiteral("es"), QStringLiteral("it"), QStringLiteral("ru"),
    QStringLiteral("ar"), QStringLiteral("ja"), QStringLiteral("zh"),
    QStringLiteral("ko"), QStringLiteral("pt"), QStringLiteral("tr"),
    QStringLiteral("pl")
};

static void loadLanguage(const QString& code) {
    QFile f(QStringLiteral(":/lang/%1.json").arg(code));
    if (!f.open(QIODevice::ReadOnly)) return;
    auto doc = QJsonDocument::fromJson(f.readAll());
    if (!doc.isObject()) return;
    auto obj = doc.object();
    auto& m = s_strings[code];
    for (auto it = obj.begin(); it != obj.end(); ++it)
        m.insert(it.key(), it.value().toString());
}

void L::init() {
    if (s_initialized) return;
    s_initialized = true;
    for (const auto& lang : s_langs)
        loadLanguage(lang);
    auto sysLang = QLocale::system().name().left(2);
    s_currentLang = s_strings.contains(sysLang) ? sysLang : QStringLiteral("en");
}

QString L::currentLang() { return s_currentLang; }

QStringList L::availableLanguages() { return s_langs; }

QString L::languageDisplayName(const QString& code) {
    static const QHash<QString, QString> names = {
        {QStringLiteral("fr"), QStringLiteral("Français")},
        {QStringLiteral("en"), QStringLiteral("English")},
        {QStringLiteral("de"), QStringLiteral("Deutsch")},
        {QStringLiteral("es"), QStringLiteral("Español")},
        {QStringLiteral("it"), QStringLiteral("Italiano")},
        {QStringLiteral("ru"), QStringLiteral("Русский")},
        {QStringLiteral("ar"), QStringLiteral("العربية")},
        {QStringLiteral("ja"), QStringLiteral("日本語")},
        {QStringLiteral("zh"), QStringLiteral("中文")},
        {QStringLiteral("ko"), QStringLiteral("한국어")},
        {QStringLiteral("pt"), QStringLiteral("Português")},
        {QStringLiteral("tr"), QStringLiteral("Türkçe")},
        {QStringLiteral("pl"), QStringLiteral("Polski")}
    };
    return names.value(code, code);
}

void L::setLanguage(const QString& lang) {
    if (s_strings.contains(lang))
        s_currentLang = lang;
}

QString L::get(const QString& key) {
    if (!s_initialized) init();
    auto it = s_strings.constFind(s_currentLang);
    if (it != s_strings.constEnd()) {
        auto vit = it->constFind(key);
        if (vit != it->constEnd()) return *vit;
    }
    auto en = s_strings.constFind(QStringLiteral("en"));
    if (en != s_strings.constEnd()) {
        auto vit = en->constFind(key);
        if (vit != en->constEnd()) return *vit;
    }
    return key;
}

QString L::get(const QString& key, const QStringList& args) {
    QString result = get(key);
    for (int i = 0; i < args.size(); ++i)
        result.replace(QStringLiteral("{%1}").arg(i), args[i]);
    return result;
}
