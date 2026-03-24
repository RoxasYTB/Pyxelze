#pragma once
#include <QColor>
#include <QWidget>

namespace ThemeManager {
    void init();
    bool darkMode();
    void setDarkMode(bool on);
    void applyToWidget(QWidget* w);

    QColor windowBack();
    QColor windowFore();
    QColor controlBack();
    QColor controlFore();
    QColor accentColor();
    QColor headerBack();
    QColor rowHover();
    QColor selectionBack();
    QColor borderColor();
}
