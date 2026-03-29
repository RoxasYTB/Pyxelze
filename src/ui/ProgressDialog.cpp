#include "ProgressDialog.h"
#include "ThemeManager.h"
#include "core/RoxRunner.h"
#include "core/Logger.h"
#include "localization/Localization.h"
#include <QVBoxLayout>
#include <QLabel>
#include <QProgressBar>
#include <QPushButton>
#include <QProcess>
#include <QApplication>
#include <QElapsedTimer>
#include <QTimer>

ProgressDialog::ProgressDialog(QWidget* parent, const QString& title, const QString& message)
    : QDialog(parent), m_baseMessage(message) {
    setWindowTitle(title);
    setFixedSize(460, 180);
    setWindowFlags(windowFlags() & ~Qt::WindowContextHelpButtonHint);
    ThemeManager::applyToWidget(this);

    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(15, 15, 15, 15);
    layout->setSpacing(8);

    m_label = new QLabel(message);
    layout->addWidget(m_label);

    m_bar = new QProgressBar;
    m_bar->setRange(0, 100);
    m_bar->setValue(0);
    m_bar->setTextVisible(true);
    m_bar->setFormat(QStringLiteral("%p%"));
    layout->addWidget(m_bar);

    m_statsLabel = new QLabel;
    m_statsLabel->setStyleSheet(QStringLiteral("color: gray; font-size: 11px;"));
    layout->addWidget(m_statsLabel);

    auto* btnCancel = new QPushButton(tr("Annuler"));
    layout->addWidget(btnCancel, 0, Qt::AlignRight);
    connect(btnCancel, &QPushButton::clicked, this, [this]{ m_cancelled = true; });

    m_animTimer = new QTimer(this);
    m_animTimer->setInterval(100);
    connect(m_animTimer, &QTimer::timeout, this, [this]{
        if (m_displayPercent < m_targetPercent)
            m_displayPercent++;

        m_bar->setValue(m_displayPercent);
        m_label->setText(QStringLiteral("%1 - %2%").arg(m_baseMessage).arg(m_displayPercent));

        auto elapsedMs = m_elapsed.elapsed();
        m_statsLabel->setText(QStringLiteral("%1 %2").arg(L::get("progress.elapsed"), formatDuration(elapsedMs)));
    });

    m_elapsed.start();
    m_animTimer->start();
}

QString ProgressDialog::formatDuration(qint64 ms) {
    auto totalSec = ms / 1000;
    if (totalSec < 60)
        return QStringLiteral("%1s").arg(totalSec);
    auto min = totalSec / 60;
    auto sec = totalSec % 60;
    return QStringLiteral("%1m%2s").arg(min).arg(sec, 2, 10, QChar('0'));
}

void ProgressDialog::setTargetPercent(int percent) {
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    m_targetPercent = percent;
    m_hasProgress = true;
    m_bar->setRange(0, 100);
}

ProcessResult ProgressDialog::runRoxWithProgress(QWidget* parent, const QString& title, const QString& message, const QStringList& args) {
    auto result = runWithArgs(parent, title, message, args, true);
    if (result.exitCode == 2 && result.stdErr.contains(QStringLiteral("unexpected argument")))
        return runWithArgs(parent, title, message, args, false);
    return result;
}

ProcessResult ProgressDialog::runWithArgs(QWidget* parent, const QString& title, const QString& message, const QStringList& args, bool useProgress) {
    ProgressDialog dlg(parent, title, message);
    dlg.show();
    QApplication::processEvents();

    auto roxPath = RoxRunner::roxPath();
    if (roxPath.isEmpty())
        return {-1, {}, QStringLiteral("roxify_native not found")};

    QStringList fullArgs = args;
    if (useProgress)
        fullArgs.append(QStringLiteral("--progress"));

    QProcess proc;
    proc.setProcessChannelMode(QProcess::SeparateChannels);
    proc.start(roxPath, fullArgs);

    if (!proc.waitForStarted(5000)) {
        dlg.close();
        return {-1, {}, QStringLiteral("Failed to start")};
    }

    QByteArray stderrBuf;
    QByteArray stderrOutput;

    while (!proc.waitForFinished(50)) {
        QApplication::processEvents();

        stderrBuf.append(proc.readAllStandardError());

        while (stderrBuf.contains('\n')) {
            auto nlPos = stderrBuf.indexOf('\n');
            auto line = stderrBuf.left(nlPos).trimmed();
            stderrBuf.remove(0, nlPos + 1);

            if (line.startsWith("PROGRESS:")) {
                bool ok;
                int pct = line.mid(9).toInt(&ok);
                if (ok && pct >= 0 && pct <= 100)
                    dlg.setTargetPercent(pct);
            } else if (!line.isEmpty()) {
                stderrOutput.append(line);
                stderrOutput.append('\n');
            }
        }

        if (!dlg.m_hasProgress) {
            dlg.m_bar->setRange(0, 0);
        }

        if (dlg.m_cancelled) {
            proc.kill();
            proc.waitForFinished(2000);
            dlg.close();
            return {-1, {}, QStringLiteral("Cancelled")};
        }
        if (dlg.m_elapsed.elapsed() > 1800000) {
            proc.kill();
            proc.waitForFinished(2000);
            dlg.close();
            return {-1, {}, QStringLiteral("Timeout")};
        }
    }

    stderrBuf.append(proc.readAllStandardError());
    while (stderrBuf.contains('\n')) {
        auto nlPos = stderrBuf.indexOf('\n');
        auto line = stderrBuf.left(nlPos).trimmed();
        stderrBuf.remove(0, nlPos + 1);
        if (line.startsWith("PROGRESS:")) {
            bool ok;
            int pct = line.mid(9).toInt(&ok);
            if (ok && pct >= 0 && pct <= 100)
                dlg.setTargetPercent(pct);
        } else if (!line.isEmpty()) {
            stderrOutput.append(line);
            stderrOutput.append('\n');
        }
    }
    if (!stderrBuf.trimmed().isEmpty())
        stderrOutput.append(stderrBuf.trimmed());

    dlg.close();
    return {
        proc.exitCode(),
        QString::fromUtf8(proc.readAllStandardOutput()),
        QString::fromUtf8(stderrOutput).trimmed()
    };
}
