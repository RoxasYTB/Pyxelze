#include "ProgressDialog.h"
#include "ThemeManager.h"
#include "core/ProcessHelper.h"
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

static QString progressStepText(const QString& step) {
    if (step.isEmpty()) return {};
    return L::get(QStringLiteral("progress.step.%1").arg(step));
}

static void parseProgressLine(const QString& line, ProgressDialog& dlg) {
    if (!line.startsWith(QStringLiteral("PROGRESS:"))) return;

    const auto parts = line.mid(9).split(':');
    if (parts.size() < 2) return;

    const auto current = parts[0].toLongLong();
    const auto total = parts[1].toLongLong();
    const auto step = parts.size() >= 3 ? parts[2].trimmed() : QString();
    dlg.setProgressState(current, total, step);
}

static void consumeProgressBuffer(QByteArray& buffer, ProgressDialog& dlg) {
    while (buffer.contains('\n')) {
        const int idx = buffer.indexOf('\n');
        const auto line = QString::fromUtf8(buffer.left(idx)).trimmed();
        buffer.remove(0, idx + 1);
        parseProgressLine(line, dlg);
    }
}

ProgressDialog::ProgressDialog(QWidget* parent, const QString& title, const QString& message)
    : QDialog(parent), m_message(message) {
    setWindowTitle(title);
    setFixedSize(480, 190);
    setWindowFlags(windowFlags() & ~Qt::WindowContextHelpButtonHint);
    ThemeManager::applyToWidget(this);

    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(15, 15, 15, 15);
    layout->setSpacing(8);

    m_label = new QLabel(message);
    m_label->setWordWrap(true);
    layout->addWidget(m_label);

    m_stepLabel = new QLabel;
    m_stepLabel->setStyleSheet(QStringLiteral("color: %1; font-size: 9pt;").arg(ThemeManager::dimText().name()));
    layout->addWidget(m_stepLabel);

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
    setProgressState(0, 100, {});
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

    if (m_progressCurrent > 0 && m_progressTotal > 0 && m_progressCurrent < m_progressTotal) {
        const auto remainingUnits = m_progressTotal - m_progressCurrent;
        auto etaMs = static_cast<qint64>((elapsed * remainingUnits) / static_cast<double>(m_progressCurrent));
        m_etaLabel->setText(L::get("progress.remaining").replace(QStringLiteral("{0}"), formatDuration(etaMs)));
    } else {
        m_etaLabel->clear();
    }
}

void ProgressDialog::setProgressState(qint64 current, qint64 total, const QString& step) {
    m_progressCurrent = qMax<qint64>(0, current);
    m_progressTotal = total > 0 ? total : 100;
    const auto percent = m_progressTotal > 0
        ? static_cast<int>((m_progressCurrent * 100) / m_progressTotal)
        : static_cast<int>(m_progressCurrent);
    m_realPercent = qBound(0, percent, 100);
    m_bar->setValue(m_realPercent);
    updateElapsed();
    if (step == m_step) return;
    m_step = step;
    const auto translated = progressStepText(step);
    if (translated.isEmpty()) {
        m_stepLabel->clear();
        m_label->setText(m_message);
        return;
    }
    m_stepLabel->setText(L::get("progress.currentStep").replace(QStringLiteral("{0}"), translated));
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
    dlg.m_elapsedTimer.start(250);

    QByteArray stdoutBuf;
    QByteArray stderrBuf;

    while (!proc.waitForFinished(50)) {
        QApplication::processEvents();

        auto outData = proc.readAllStandardOutput();
        if (!outData.isEmpty()) {
            stdoutBuf.append(outData);
            consumeProgressBuffer(stdoutBuf, dlg);
        }

        auto errData = proc.readAllStandardError();
        if (!errData.isEmpty()) {
            stderrBuf.append(errData);
            consumeProgressBuffer(stderrBuf, dlg);
        }

        if (dlg.m_cancelled) {
            proc.kill();
            proc.waitForFinished(2000);
            ProcessHelper::logRoxTiming(args, dlg.m_clock.elapsed(), -1);
            dlg.close();
            return {-1, {}, QStringLiteral("Cancelled")};
        }
        if (dlg.m_clock.elapsed() > 1800000) {
            proc.kill();
            proc.waitForFinished(2000);
            ProcessHelper::logRoxTiming(args, dlg.m_clock.elapsed(), -1);
            dlg.close();
            return {-1, {}, QStringLiteral("Timeout")};
        }
    }

    stdoutBuf.append(proc.readAllStandardOutput());
    stderrBuf.append(proc.readAllStandardError());
    consumeProgressBuffer(stdoutBuf, dlg);
    consumeProgressBuffer(stderrBuf, dlg);
    parseProgressLine(QString::fromUtf8(stdoutBuf).trimmed(), dlg);
    parseProgressLine(QString::fromUtf8(stderrBuf).trimmed(), dlg);

    dlg.m_elapsedTimer.stop();
    dlg.setProgressState(100, 100, QStringLiteral("done"));
    ProcessHelper::logRoxTiming(args, dlg.m_clock.elapsed(), proc.exitCode());
    dlg.close();

    QString filteredStdout;
    for (const auto& line : QString::fromUtf8(stdoutBuf).split('\n')) {
        if (!line.trimmed().startsWith(QStringLiteral("PROGRESS:")))
            filteredStdout += line + '\n';
    }

    QString filteredStderr;
    for (const auto& line : QString::fromUtf8(stderrBuf).split('\n')) {
        if (!line.trimmed().startsWith(QStringLiteral("PROGRESS:")))
            filteredStderr += line + '\n';
    }

    return {
        proc.exitCode(),
        filteredStdout.trimmed(),
        filteredStderr.trimmed()
    };
}
