#pragma once
#include "core/ProcessHelper.h"
#include <QDialog>
#include <QString>
#include <QStringList>
#include <QWidget>

class ProgressDialog : public QDialog {
    Q_OBJECT
public:
    explicit ProgressDialog(QWidget* parent, const QString& title, const QString& message);
    static ProcessResult runRoxWithProgress(QWidget* parent, const QString& title, const QString& message, const QStringList& args);

private:
    class QLabel* m_label;
    class QProgressBar* m_bar;
    bool m_cancelled = false;
};
