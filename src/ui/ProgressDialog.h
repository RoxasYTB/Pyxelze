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

private:
    void updateElapsed();
    void animateProgress();
    void applyProgressStyle();
    static QString formatDuration(qint64 ms);

    QLabel* m_label;
    QProgressBar* m_bar;
    QLabel* m_elapsedLabel;
    QLabel* m_etaLabel;
    QTimer m_elapsedTimer;
    QTimer m_animTimer;
    QElapsedTimer m_clock;
    int m_realPercent = 0;
    int m_displayPercent = 0;
    bool m_cancelled = false;
};
