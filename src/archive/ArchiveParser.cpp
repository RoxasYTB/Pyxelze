#include "ArchiveParser.h"
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonObject>
#include <QRegularExpression>
#include <QFileInfo>
#include <QSet>

static const QRegularExpression LineSizeRegex(QStringLiteral(R"(^(.+?)\s+\((\d+)\s+bytes\)$)"));

static bool isJsonArray(const QString& d) {
    return d.startsWith('[') && d.endsWith(']');
}

static void addParentDirs(QList<VirtualFile>& files, const QString& filePath, QSet<QString>& seen) {
    auto dir = QFileInfo(filePath).path().replace('\\', '/');
    while (!dir.isEmpty() && dir != QStringLiteral(".")) {
        if (seen.contains(dir)) break;
        seen.insert(dir);
        VirtualFile vf;
        vf.fullPath = dir;
        vf.name = QFileInfo(dir).fileName();
        vf.isFolder = true;
        files.append(vf);
        dir = QFileInfo(dir).path().replace('\\', '/');
    }
}

static QList<VirtualFile> parseJson(const QString& data) {
    QList<VirtualFile> result;
    QSet<QString> seenDirs;
    auto doc = QJsonDocument::fromJson(data.toUtf8());
    if (!doc.isArray()) return result;

    for (const auto& val : doc.array()) {
        auto obj = val.toObject();
        auto name = obj[QStringLiteral("name")].toString();
        auto size = obj[QStringLiteral("size")].toInteger();
        if (name.isEmpty()) continue;

        VirtualFile vf;
        vf.fullPath = name;
        vf.originalPath = name;
        vf.name = QFileInfo(name).fileName();
        vf.size = size;
        vf.isFolder = false;
        result.append(vf);
        addParentDirs(result, name, seenDirs);
    }
    return result;
}

static QList<VirtualFile> parseText(const QString& data) {
    QList<VirtualFile> result;
    QSet<QString> seenDirs;

    for (const auto& line : data.split('\n', Qt::SkipEmptyParts)) {
        auto trimmed = line.trimmed();
        if (trimmed.startsWith(QStringLiteral("Files in"))) continue;

        auto match = LineSizeRegex.match(trimmed);
        if (!match.hasMatch()) continue;

        auto path = match.captured(1).trimmed().replace('\\', '/');
        auto size = match.captured(2).toLongLong();

        VirtualFile vf;
        vf.fullPath = path;
        vf.originalPath = path;
        vf.name = QFileInfo(path).fileName();
        vf.size = size;
        vf.isFolder = false;
        result.append(vf);
        addParentDirs(result, path, seenDirs);
    }
    return result;
}

QList<VirtualFile> ArchiveParser::parse(const QString& data) {
    auto d = data.trimmed();
    if (d.isEmpty()) return {};
    return isJsonArray(d) ? parseJson(d) : parseText(d);
}

QStringList ArchiveParser::parseFileNames(const QString& data) {
    auto d = data.trimmed();
    if (d.isEmpty()) return {};

    if (isJsonArray(d)) {
        QStringList names;
        auto doc = QJsonDocument::fromJson(d.toUtf8());
        if (!doc.isArray()) return {};
        for (const auto& val : doc.array()) {
            auto n = val.toObject()[QStringLiteral("name")].toString();
            if (!n.isEmpty()) names.append(n);
        }
        return names;
    }

    QStringList names;
    for (const auto& line : d.split('\n', Qt::SkipEmptyParts)) {
        auto match = LineSizeRegex.match(line.trimmed());
        if (match.hasMatch())
            names.append(match.captured(1).trimmed());
    }
    return names;
}
