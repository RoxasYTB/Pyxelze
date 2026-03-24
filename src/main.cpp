#include <QApplication>
#include <QFile>
#include "core/AppConstants.h"
#include "localization/Localization.h"
#include "ui/MainWindow.h"

int main(int argc, char* argv[]) {
    QApplication app(argc, argv);
    app.setApplicationName(QStringLiteral("Pyxelze"));
    app.setApplicationVersion(QString::fromLatin1(AppConstants::Version));
    app.setOrganizationName(QStringLiteral("Pyxelze"));

    L::init();

    QString fileToOpen;
    for (int i = 1; i < argc; ++i) {
        auto arg = QString::fromLocal8Bit(argv[i]);
        if (!arg.startsWith('-') && QFile::exists(arg)) {
            fileToOpen = arg;
            break;
        }
    }

    MainWindow w(fileToOpen);
    w.show();

    return app.exec();
}
