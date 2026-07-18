#include "HardwareId.h"

#include <QCryptographicHash>
#include <QDir>
#include <QHostInfo>
#include <QNetworkInterface>
#include <QSysInfo>
#include <QVector>

QString HardwareId::generate() {

    QString data;
    const auto interfaces = QNetworkInterface::allInterfaces();
    QVector<QString> macs;
    for (const auto& iface : interfaces) {
        if (iface.flags().testFlag(QNetworkInterface::IsLoopBack))
            continue;
        if (!iface.flags().testFlag(QNetworkInterface::IsUp))
            continue;
        const auto mac = iface.hardwareAddress();
        if (!mac.isEmpty() && mac != QStringLiteral("00:00:00:00:00:00"))
            macs.append(mac);
    }
    std::sort(macs.begin(), macs.end());
    for (const auto& mac : macs)
        data += mac;

    data += QHostInfo::localHostName();
    data += QSysInfo::productType();
    data += QSysInfo::productVersion();
    data += QSysInfo::kernelVersion();
    data += QDir::home().dirName();

    const auto hash = QCryptographicHash::hash(
        data.toUtf8(),
        QCryptographicHash::Sha256
    );

    return QString::fromLatin1(hash.toHex());
}
