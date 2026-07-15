#pragma once
#include "core/ProcessHelper.h"
#include <QDialog>
#include <QString>
#include <QStringList>
#include <QWidget>
#include <QTimer>
#include <QElapsedTimer>

class QLabel;
class QProgressBar;

class ProgressDialog : public QDialog {
    Q_OBJECT
public:
    explicit ProgressDialog(QWidget* parent, const QString& title, const QString& message);
    static ProcessResult runRoxWithProgress(QWidget* parent, const QString& title, const QString& message, const QStringList& args);
    void setProgressState(qint64 current, qint64 total, const QString& step);

private:
    void updateElapsed();
    void applyProgressStyle();
    static QString formatDuration(qint64 ms);

    QLabel* m_label;
    QLabel* m_stepLabel;
    QProgressBar* m_bar;
    QLabel* m_elapsedLabel;
    QLabel* m_etaLabel;
    QTimer m_elapsedTimer;
    QElapsedTimer m_clock;
    int m_realPercent = 0;
    qint64 m_progressCurrent = 0;
    qint64 m_progressTotal = 100;
    bool m_cancelled = false;
    QString m_message;
    QString m_step;
};
