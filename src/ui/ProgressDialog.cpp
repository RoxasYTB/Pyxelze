#include "ProgressDialog.h"
#include "ThemeManager.h"
#include "core/RoxRunner.h"
#include "core/Logger.h"
#include "localization/Localization.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QProgressBar>
#include <QPushButton>
#include <QProcess>
#include <QApplication>

ProgressDialog::ProgressDialog(QWidget* parent, const QString& title, const QString& message)
    : QDialog(parent) {
    setWindowTitle(title);
    setFixedSize(480, 170);
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
    m_bar->setFixedHeight(24);
    applyProgressStyle();
    layout->addWidget(m_bar);

    auto* timeLayout = new QHBoxLayout;
    m_elapsedLabel = new QLabel(L::get("progress.elapsed").replace(QStringLiteral("{0}"), QStringLiteral("0:00")));
    m_etaLabel = new QLabel;
    timeLayout->addWidget(m_elapsedLabel);
    timeLayout->addStretch();
    timeLayout->addWidget(m_etaLabel);
    layout->addLayout(timeLayout);

    auto* btnCancel = new QPushButton(L::get("process.cancel"));
    layout->addWidget(btnCancel, 0, Qt::AlignRight);
    connect(btnCancel, &QPushButton::clicked, this, [this]{ m_cancelled = true; });

    connect(&m_elapsedTimer, &QTimer::timeout, this, &ProgressDialog::updateElapsed);
    connect(&m_animTimer, &QTimer::timeout, this, &ProgressDialog::animateProgress);
}

void ProgressDialog::applyProgressStyle() {
    m_bar->setStyleSheet(QStringLiteral(
        "QProgressBar {"
        "  border: 1px solid #555;"
        "  border-radius: 4px;"
        "  text-align: center;"
        "  font-weight: bold;"
        "  color: white;"
        "}"
        "QProgressBar::chunk {"
        "  background: qlineargradient(x1:0,y1:0,x2:1,y2:0,"
        "    stop:0 #2ecc71, stop:1 #27ae60);"
        "  border-radius: 3px;"
        "}"
    ));
}

void ProgressDialog::updateElapsed() {
    auto elapsed = m_clock.elapsed();
    m_elapsedLabel->setText(L::get("progress.elapsed").replace(QStringLiteral("{0}"), formatDuration(elapsed)));

    if (m_realPercent > 2 && m_realPercent < 100) {
        auto etaMs = static_cast<qint64>(elapsed * (100.0 - m_realPercent) / m_realPercent);
        m_etaLabel->setText(L::get("progress.remaining").replace(QStringLiteral("{0}"), formatDuration(etaMs)));
    } else {
        m_etaLabel->clear();
    }
}

void ProgressDialog::animateProgress() {
    if (m_displayPercent < m_realPercent) {
        m_displayPercent++;
        m_bar->setValue(m_displayPercent);
    }
}

QString ProgressDialog::formatDuration(qint64 ms) {
    auto totalSec = ms / 1000;
    auto min = totalSec / 60;
    auto sec = totalSec % 60;
    if (min > 0)
        return QStringLiteral("%1:%2").arg(min).arg(sec, 2, 10, QLatin1Char('0'));
    return QStringLiteral("0:%1").arg(sec, 2, 10, QLatin1Char('0'));
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

    dlg.m_clock.start();
    dlg.m_elapsedTimer.start(1000);
    dlg.m_animTimer.start(250);

    QByteArray stderrBuf;

    while (!proc.waitForFinished(50)) {
        QApplication::processEvents();

        auto errData = proc.readAllStandardError();
        if (!errData.isEmpty()) {
            stderrBuf.append(errData);
            while (stderrBuf.contains('\n')) {
                int idx = stderrBuf.indexOf('\n');
                auto line = QString::fromUtf8(stderrBuf.left(idx)).trimmed();
                stderrBuf.remove(0, idx + 1);

                if (line.startsWith(QStringLiteral("PROGRESS:"))) {
                    auto parts = line.mid(9).split(':');
                    if (parts.size() >= 2) {
                        int current = parts[0].toInt();
                        dlg.m_realPercent = qBound(0, current, 100);
                    }
                }
            }
        }

        if (dlg.m_cancelled) {
            proc.kill();
            proc.waitForFinished(2000);
            dlg.close();
            return {-1, {}, QStringLiteral("Cancelled")};
        }
        if (dlg.m_clock.elapsed() > 1800000) {
            proc.kill();
            proc.waitForFinished(2000);
            dlg.close();
            return {-1, {}, QStringLiteral("Timeout")};
        }
    }

    stderrBuf.append(proc.readAllStandardError());

    dlg.m_elapsedTimer.stop();
    dlg.m_animTimer.stop();
    dlg.m_bar->setValue(100);
    dlg.close();

    QString filteredStderr;
    for (const auto& line : QString::fromUtf8(stderrBuf).split('\n')) {
        if (!line.trimmed().startsWith(QStringLiteral("PROGRESS:")))
            filteredStderr += line + '\n';
    }

    return {
        proc.exitCode(),
        QString::fromUtf8(proc.readAllStandardOutput()),
        filteredStderr.trimmed()
    };
}
