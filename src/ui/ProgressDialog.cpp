#include "ProgressDialog.h"
#include "ThemeManager.h"
#include "core/RoxRunner.h"
#include "core/Logger.h"
#include <QVBoxLayout>
#include <QLabel>
#include <QProgressBar>
#include <QPushButton>
#include <QProcess>
#include <QApplication>
#include <QElapsedTimer>

ProgressDialog::ProgressDialog(QWidget* parent, const QString& title, const QString& message)
    : QDialog(parent) {
    setWindowTitle(title);
    setFixedSize(420, 150);
    setWindowFlags(windowFlags() & ~Qt::WindowContextHelpButtonHint);
    ThemeManager::applyToWidget(this);

    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(15, 15, 15, 15);

    m_label = new QLabel(message);
    layout->addWidget(m_label);

    m_bar = new QProgressBar;
    m_bar->setRange(0, 0);
    layout->addWidget(m_bar);

    auto* btnCancel = new QPushButton(tr("Annuler"));
    layout->addWidget(btnCancel, 0, Qt::AlignRight);
    connect(btnCancel, &QPushButton::clicked, this, [this]{ m_cancelled = true; });
}

ProcessResult ProgressDialog::runRoxWithProgress(QWidget* parent, const QString& title, const QString& message, const QStringList& args) {
    ProgressDialog dlg(parent, title, message);
    dlg.show();
    QApplication::processEvents();

    auto roxPath = RoxRunner::roxPath();
    if (roxPath.isEmpty())
        return {-1, {}, QStringLiteral("roxify_native not found")};

    QProcess proc;
    proc.setProcessChannelMode(QProcess::SeparateChannels);
    proc.start(roxPath, args);

    if (!proc.waitForStarted(5000)) {
        dlg.close();
        return {-1, {}, QStringLiteral("Failed to start")};
    }

    QElapsedTimer timer;
    timer.start();

    while (!proc.waitForFinished(50)) {
        QApplication::processEvents();
        if (dlg.m_cancelled) {
            proc.kill();
            proc.waitForFinished(2000);
            dlg.close();
            return {-1, {}, QStringLiteral("Cancelled")};
        }
        if (timer.elapsed() > 120000) {
            proc.kill();
            proc.waitForFinished(2000);
            dlg.close();
            return {-1, {}, QStringLiteral("Timeout")};
        }
    }

    dlg.close();
    return {
        proc.exitCode(),
        QString::fromUtf8(proc.readAllStandardOutput()),
        QString::fromUtf8(proc.readAllStandardError())
    };
}
