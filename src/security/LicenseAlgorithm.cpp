#include "LicenseAlgorithm.h"

#include <QtGlobal>

namespace {
const QString kPrefix = QStringLiteral("PYX");
const QString kSalt = QStringLiteral("PXZ2026SALT");
const QString kKeyA = QStringLiteral("ROXIFYK1");
const QString kKeyB = QStringLiteral("PYXELZEK2");

int charDigit(const QString& input, int index) {
    return input.at(index).unicode() % 10;
}

quint32 seededState(const QString& payload) {
    quint32 state = 2166136261u;
    const QString stream = payload + QStringLiteral("|") + kSalt + QStringLiteral("|") + kKeyA + QStringLiteral("|") + kKeyB;

    for (QChar c : stream) {
        const quint32 code = c.unicode();
        state ^= code;
        state *= 16777619u;
        state += code * 131u;
    }

    return state;
}

QString signatureFromPayload(const QString& payload) {
    quint32 state = seededState(payload);
    QString signature;
    signature.reserve(6);

    for (int i = 0; i < 6; ++i) {
        const quint32 a = static_cast<quint32>(kKeyA.at(i % kKeyA.size()).unicode());
        const quint32 b = static_cast<quint32>(kKeyB.at((i * 3) % kKeyB.size()).unicode());
        const quint32 s = static_cast<quint32>(kSalt.at((i * 5) % kSalt.size()).unicode());
        state = (state ^ (a << 16) ^ (b << 8) ^ s) * 1664525u + 1013904223u;
        const int digit = static_cast<int>((state >> 27) % 10u);
        signature += QChar::fromLatin1(static_cast<char>('0' + digit));
    }

    return signature;
}

int computeCheckDigit(const QString& body24) {
    int sum = 0;
    bool shouldDouble = ((charDigit(kKeyA, 0) + charDigit(kKeyB, 0) + charDigit(kSalt, 0)) % 2) == 0;

    for (int i = body24.size() - 1; i >= 0; --i) {
        int n = body24.at(i).digitValue();

        const int tweak = (charDigit(kSalt, i % kSalt.size())
            + charDigit(kKeyA, i % kKeyA.size())
            + charDigit(kKeyB, i % kKeyB.size())) % 10;

        n = (n + tweak) % 10;

        if (shouldDouble) {
            n *= 2;
            if (n > 9) {
                n -= 9;
            }
        }

        sum += n;
        shouldDouble = !shouldDouble;
    }

    return (10 - (sum % 10)) % 10;
}
}

QString LicenseAlgorithm::normalize(const QString& raw) {
    QString normalized;
    normalized.reserve(raw.size());

    for (QChar c : raw.toUpper()) {
        if (c.isDigit() || (c >= QChar::fromLatin1('A') && c <= QChar::fromLatin1('Z'))) {
            normalized += c;
        }
    }

    return normalized;
}

bool LicenseAlgorithm::isValid(const QString& raw) {
    const QString normalized = normalize(raw);

    if (!normalized.startsWith(kPrefix)) {
        return false;
    }

    const QString digits = normalized.mid(kPrefix.size());

    if (digits.size() != 25) {
        return false;
    }

    for (QChar c : digits) {
        if (!c.isDigit()) {
            return false;
        }
    }

    const QString body24 = digits.left(24);
    const QString payload = body24.left(18);
    const QString signature = body24.mid(18, 6);

    if (signature != signatureFromPayload(payload)) {
        return false;
    }

    const int expectedCheckDigit = computeCheckDigit(body24);
    const int checkDigit = digits.at(24).digitValue();

    return checkDigit == expectedCheckDigit;
}
