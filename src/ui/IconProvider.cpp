#include "IconProvider.h"
#include <QFileIconProvider>
#include <QTemporaryFile>
#include <QDir>
#include <QHash>
#include <QPainter>
#include <QSvgRenderer>

static QFileIconProvider s_provider;
static QHash<QString, QIcon> s_cache;

static QString extensionOf(const QString& name) {
    int dot = name.lastIndexOf('.');
    return dot > 0 ? name.mid(dot).toLower() : QStringLiteral(".unknown");
}

static QIcon svgToIcon(const QString& path) {
    QSvgRenderer renderer(path);
    if (!renderer.isValid()) return QIcon();
    QIcon icon;
    for (int sz : {16, 24, 32, 48, 64}) {
        QPixmap pix(sz, sz);
        pix.fill(Qt::transparent);
        QPainter p(&pix);
        p.setRenderHint(QPainter::Antialiasing);
        p.setRenderHint(QPainter::SmoothPixmapTransform);
        renderer.render(&p);
        p.end();
        icon.addPixmap(pix);
    }
    return icon;
}

QIcon IconProvider::iconForFile(const QString& fileName, bool isFolder) {
    if (isFolder)
        return s_provider.icon(QFileIconProvider::Folder);

    auto ext = extensionOf(fileName);
    if (s_cache.contains(ext))
        return s_cache[ext];

    QTemporaryFile tmp(QDir::tempPath() + QStringLiteral("/pyxelze_icon_XXXXXX") + ext);
    if (tmp.open()) {
        tmp.close();
        QFileInfo fi(tmp.fileName());
        auto icon = s_provider.icon(fi);
        s_cache[ext] = icon;
        return icon;
    }

    auto fallback = s_provider.icon(QFileIconProvider::File);
    s_cache[ext] = fallback;
    return fallback;
}

QIcon IconProvider::appIcon() {
    return QIcon(QStringLiteral(":/icons/app.png"));
}

QIcon IconProvider::toolbarIcon(const QString& name) {
    return svgToIcon(QStringLiteral(":/icons/%1.svg").arg(name));
}
