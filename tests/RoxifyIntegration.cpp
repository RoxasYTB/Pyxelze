#include "archive/ArchiveParser.h"
#include "core/ProcessHelper.h"
#include "core/RoxRunner.h"
#include <QCoreApplication>
#include <QDir>
#include <QFile>
#include <QJsonArray>
#include <QJsonDocument>
#include <QMap>
#include <QTemporaryDir>
#include <QTextStream>
#include <stdexcept>

static void require(bool condition, const QString& message) {
    if (!condition) throw std::runtime_error(message.toStdString());
}

static ProcessResult run(const QStringList& args) {
    const auto result = ProcessHelper::runRox(args, 60000);
    require(result.exitCode == 0, result.stdErr + result.stdOut);
    return result;
}

static QByteArray read(const QString& path) {
    QFile file(path);
    require(file.open(QIODevice::ReadOnly), QStringLiteral("Cannot read %1").arg(path));
    return file.readAll();
}

int main(int argc, char** argv) {
    QCoreApplication app(argc, argv);
    try {
        require(RoxRunner::isAvailable(), QStringLiteral("Bundled Roxify not found"));
        const auto version = run({QStringLiteral("--version")}).stdOut.trimmed();
        require(version == QStringLiteral("roxify_native " ROXIFY_EXPECTED_VERSION), version);
        QTemporaryDir temporary;
        require(temporary.isValid(), QStringLiteral("Cannot create test directory"));
        const auto source = temporary.path() + QStringLiteral("/source");
        require(QDir().mkpath(source + QStringLiteral("/nested")), QStringLiteral("Cannot create source"));
        const QMap<QString, QByteArray> files{
            {QStringLiteral("empty.txt"), {}},
            {QStringLiteral("hello.txt"), QByteArray("Hello Roxify\n")},
            {QStringLiteral("nested/data with spaces.bin"), QByteArray(65537, '\xAB')},
            {QString::fromUtf8("nested/caf\xc3\xa9.txt"), QByteArray("UTF-8 path\n")},
        };
        for (auto it = files.cbegin(); it != files.cend(); ++it) {
            QFile file(source + '/' + it.key());
            require(file.open(QIODevice::WriteOnly), QStringLiteral("Cannot write test input"));
            require(file.write(it.value()) == it.value().size(), QStringLiteral("Short write"));
        }
        for (bool encrypted : {false, true}) {
            const auto suffix = encrypted ? QStringLiteral("encrypted") : QStringLiteral("plain");
            const auto archive = temporary.path() + '/' + suffix + QStringLiteral(".png");
            const QStringList password = encrypted
                ? QStringList{QStringLiteral("--passphrase"), QStringLiteral("integration-test-password")}
                : QStringList{};
            run(QStringList{QStringLiteral("encode"), source, archive} + password);
            const auto listing = run({QStringLiteral("list"), archive});
            const auto parsed = ArchiveParser::parse(listing.stdOut);
            QMap<QString, qint64> actual;
            for (const auto& file : parsed) {
                if (!file.isFolder) actual.insert(file.fullPath, file.size);
            }
            require(actual.size() == files.size(), QStringLiteral("File list count mismatch"));
            for (auto it = files.cbegin(); it != files.cend(); ++it) {
#ifdef Q_OS_MAC
                // QFile writes decomposed UTF-8 file names on macOS.
                const auto archivePath = QString::fromUtf8(QFile::encodeName(it.key()));
#else
                const auto archivePath = it.key();
#endif
                require(actual.contains(archivePath) && actual.value(archivePath) == it.value().size(),
                        QStringLiteral("Incorrect list entry: %1").arg(archivePath));
            }
            const auto out = temporary.path() + '/' + suffix;
            run(QStringList{QStringLiteral("decompress"), archive, out,
                            QStringLiteral("--ram-budget-mb"), QStringLiteral("256")} + password);
            for (auto it = files.cbegin(); it != files.cend(); ++it) {
                require(read(out + '/' + it.key()) == it.value(), QStringLiteral("Roundtrip mismatch"));
            }
            const auto selected = QStringLiteral("nested/data with spaces.bin");
            const auto selectiveOut = out + QStringLiteral("-selected");
            const auto selection = QString::fromUtf8(QJsonDocument(QJsonArray{selected}).toJson(QJsonDocument::Compact));
            run(QStringList{QStringLiteral("decompress"), archive, selectiveOut,
                            QStringLiteral("--files"), selection,
                            QStringLiteral("--ram-budget-mb"), QStringLiteral("256")} + password);
            require(read(selectiveOut + '/' + selected) == files.value(selected), QStringLiteral("Selection mismatch"));
            require(!QFile::exists(selectiveOut + QStringLiteral("/hello.txt")), QStringLiteral("Selection extracted extra files"));
            if (encrypted) {
                const auto failed = ProcessHelper::runRox({QStringLiteral("decompress"), archive,
                    out + QStringLiteral("-wrong-password"), QStringLiteral("--passphrase"), QStringLiteral("wrong")});
                require(failed.exitCode != 0, QStringLiteral("Wrong password was accepted"));
            }
        }
        QTextStream(stdout) << "Roxify integration passed: version, listing, roundtrips, encryption and selection.\n";
        return 0;
    } catch (const std::exception& error) {
        QTextStream(stderr) << error.what() << '\n';
        return 1;
    }
}
