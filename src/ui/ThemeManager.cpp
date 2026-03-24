#include "ThemeManager.h"
#include "platform/PlatformService.h"
#include <QApplication>
#include <QPalette>
#include <QStyle>

static bool s_dark = false;

void ThemeManager::init() {
    s_dark = PlatformService::loadPreference(QStringLiteral("DarkMode"), false).toBool();
}

bool ThemeManager::darkMode() { return s_dark; }

void ThemeManager::setDarkMode(bool on) {
    if (s_dark == on) return;
    s_dark = on;
    PlatformService::savePreference(QStringLiteral("DarkMode"), on);
    for (auto* w : QApplication::topLevelWidgets())
        applyToWidget(w);
}

void ThemeManager::applyToWidget(QWidget* w) {
    if (!w) return;
    QPalette p;
    if (s_dark) {
        p.setColor(QPalette::Window, windowBack());
        p.setColor(QPalette::WindowText, windowFore());
        p.setColor(QPalette::Base, QColor(30, 30, 30));
        p.setColor(QPalette::AlternateBase, QColor(45, 45, 48));
        p.setColor(QPalette::Text, windowFore());
        p.setColor(QPalette::Button, controlBack());
        p.setColor(QPalette::ButtonText, controlFore());
        p.setColor(QPalette::Highlight, accentColor());
        p.setColor(QPalette::HighlightedText, Qt::white);
        p.setColor(QPalette::ToolTipBase, controlBack());
        p.setColor(QPalette::ToolTipText, windowFore());
    } else {
        p = QApplication::style()->standardPalette();
    }
    w->setPalette(p);
    w->update();
}

QColor ThemeManager::windowBack() { return s_dark ? QColor(30, 30, 30) : QColor(255, 255, 255); }
QColor ThemeManager::windowFore() { return s_dark ? QColor(230, 230, 230) : QColor(0, 0, 0); }
QColor ThemeManager::controlBack() { return s_dark ? QColor(45, 45, 48) : QColor(240, 240, 240); }
QColor ThemeManager::controlFore() { return windowFore(); }
QColor ThemeManager::accentColor() { return s_dark ? QColor(100, 180, 255) : QColor(0, 120, 215); }
QColor ThemeManager::headerBack() { return s_dark ? QColor(50, 50, 50) : QColor(240, 240, 240); }
QColor ThemeManager::rowHover() { return s_dark ? QColor(60, 60, 60) : QColor(229, 243, 255); }
QColor ThemeManager::selectionBack() { return s_dark ? QColor(0, 120, 215) : QColor(212, 232, 255); }
QColor ThemeManager::borderColor() { return s_dark ? QColor(70, 70, 70) : QColor(200, 200, 200); }
