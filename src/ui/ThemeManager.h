#pragma once
#include <QColor>
#include <QString>
#include <QWidget>

namespace ThemeManager {
    void init();
    bool darkMode();
    void setDarkMode(bool on);
    void applyToWidget(QWidget* w);
    QString buildStyleSheet();

    QColor windowBack();
    QColor windowFore();
    QColor controlBack();
    QColor controlFore();
    QColor accentColor();
    QColor headerBack();
    QColor dimText();
    QColor rowHover();
    QColor selectionBack();
    QColor borderColor();
    QColor separatorColor();
}
