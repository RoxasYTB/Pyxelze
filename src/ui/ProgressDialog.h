#pragma once
#include "core/ProcessHelper.h"
#include <QDialog>
#include <QString>
#include <QStringList>
#include <QWidget>
#include <QLabel>
#include <QProgressBar>
#include <QElapsedTimer>
#include <QTimer>

class ProgressDialog : public QDialog {
    Q_OBJECT
public:
    explicit ProgressDialog(QWidget* parent, const QString& title, const QString& message);
    static ProcessResult runRoxWithProgress(QWidget* parent, const QString& title, const QString& message, const QStringList& args);

private:
    static ProcessResult runWithArgs(QWidget* parent, const QString& title, const QString& message, const QStringList& args, bool useProgress);
    void setTargetPercent(int percent);
    static QString formatDuration(qint64 ms);

    QLabel* m_label;
    QLabel* m_statsLabel;
    QProgressBar* m_bar;
    QTimer* m_animTimer;
    QElapsedTimer m_elapsed;
    QString m_baseMessage;
    int m_targetPercent = 0;
    int m_displayPercent = 0;
    bool m_hasProgress = false;
    bool m_cancelled = false;
};
