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
        p.setColor(QPalette::Window, QColor(250, 250, 250));
        p.setColor(QPalette::Base, QColor(255, 255, 255));
        p.setColor(QPalette::AlternateBase, QColor(245, 245, 245));
        p.setColor(QPalette::Button, QColor(245, 245, 245));
        p.setColor(QPalette::Highlight, accentColor());
        p.setColor(QPalette::HighlightedText, Qt::white);
    }
    w->setPalette(p);
    w->setStyleSheet(buildStyleSheet());
    w->update();
}

QString ThemeManager::buildStyleSheet() {
    auto bg = windowBack().name();
    auto fg = windowFore().name();
    auto ctrl = controlBack().name();
    auto accent = accentColor().name();
    auto border = borderColor().name();
    auto header = headerBack().name();
    auto hover = rowHover().name();
    auto sel = selectionBack().name();
    auto dim = dimText().name();
    auto sep = separatorColor().name();

    return QStringLiteral(
        "QMainWindow, QDialog { background: %1; color: %2; }"

        "QMenuBar { background: %3; color: %2; border-bottom: 1px solid %4; padding: 1px; }"
        "QMenuBar::item { background: transparent; padding: 4px 8px; }"
        "QMenuBar::item:selected { background: %5; }"
        "QMenu { background: %3; color: %2; border: 1px solid %4; padding: 2px 0; }"
        "QMenu::item { padding: 3px 24px 3px 28px; }"
        "QMenu::item:selected { background: %6; color: white; }"
        "QMenu::separator { height: 1px; background: %4; margin: 2px 0; }"
        "QMenu::icon { padding-left: 6px; }"

        "QToolBar { background: %3; border-bottom: 1px solid %4; spacing: 2px; padding: 1px 4px; }"
        "QToolBar QToolButton { color: %2; border: none; border-radius: 3px; padding: 4px 6px; font-size: 11px; }"
        "QToolBar QToolButton:hover { background: %5; }"
        "QToolBar QToolButton:pressed { background: %6; color: white; }"
        "QToolBar::separator { width: 1px; background: %4; margin: 2px 2px; }"

        "QHeaderView::section { background: %7; color: %2; border: none; border-right: 1px solid %4; border-bottom: 1px solid %4; padding: 2px 6px; font-weight: 600; font-size: 11px; }"
        "QHeaderView::section:hover { background: %5; }"

        "QTreeView { background: %1; color: %2; border: 1px solid %4; outline: none; font-size: 12px; }"
        "QTreeView::item { padding: 1px 0; height: 20px; }"
        "QTreeView::item:hover { background: %5; }"
        "QTreeView::item:selected { background: %8; color: white; }"

        "QListView { background: %1; color: %2; border: 1px solid %4; outline: none; font-size: 12px; }"
        "QListView::item { padding: 2px; }"
        "QListView::item:hover { background: %5; }"
        "QListView::item:selected { background: %8; color: white; }"

        "QStatusBar { background: %3; color: %2; border-top: 1px solid %4; padding: 0; }"
        "QStatusBar::item { border: none; }"
        "QStatusBar QLabel { color: %9; padding: 0 6px; font-size: 11px; }"

        "QLineEdit { background: %1; color: %2; border: 1px solid %4; border-radius: 2px; padding: 2px 6px; selection-background-color: %6; font-size: 12px; }"
        "QLineEdit:read-only { background: %3; }"

        "QPushButton { background: %3; color: %2; border: 1px solid %4; border-radius: 2px; padding: 4px 12px; font-size: 12px; }"
        "QPushButton:hover { background: %5; border-color: %6; }"
        "QPushButton:pressed { background: %6; color: white; }"

        "QProgressBar { background: %3; border: 1px solid %4; border-radius: 2px; text-align: center; color: %2; height: 14px; }"
        "QProgressBar::chunk { background: %6; border-radius: 1px; }"

        "QScrollBar:vertical { background: %3; width: 8px; border: none; }"
        "QScrollBar::handle:vertical { background: %4; border-radius: 4px; min-height: 20px; }"
        "QScrollBar::handle:vertical:hover { background: %9; }"
        "QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }"
        "QScrollBar:horizontal { background: %3; height: 8px; border: none; }"
        "QScrollBar::handle:horizontal { background: %4; border-radius: 4px; min-width: 20px; }"
        "QScrollBar::handle:horizontal:hover { background: %9; }"
        "QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal { width: 0; }"

        "QFrame[frameShape=\"4\"] { color: %10; }"
        "QFrame[frameShape=\"5\"] { color: %10; }"

        "QTextEdit { background: %1; color: %2; border: 1px solid %4; border-radius: 2px; }"
    ).arg(bg, fg, ctrl, border, hover, accent, header, sel, dim, sep);
}

QColor ThemeManager::windowBack() { return s_dark ? QColor(30, 30, 30) : QColor(250, 250, 250); }
QColor ThemeManager::windowFore() { return s_dark ? QColor(230, 230, 230) : QColor(30, 30, 30); }
QColor ThemeManager::controlBack() { return s_dark ? QColor(45, 45, 48) : QColor(240, 240, 240); }
QColor ThemeManager::controlFore() { return windowFore(); }
QColor ThemeManager::accentColor() { return s_dark ? QColor(100, 180, 255) : QColor(0, 120, 215); }
QColor ThemeManager::headerBack() { return s_dark ? QColor(50, 50, 50) : QColor(235, 235, 235); }
QColor ThemeManager::dimText() { return s_dark ? QColor(160, 160, 160) : QColor(120, 120, 120); }
QColor ThemeManager::rowHover() { return s_dark ? QColor(60, 60, 60) : QColor(229, 243, 255); }
QColor ThemeManager::selectionBack() { return s_dark ? QColor(0, 120, 215) : QColor(0, 120, 215); }
QColor ThemeManager::borderColor() { return s_dark ? QColor(70, 70, 70) : QColor(210, 210, 210); }
QColor ThemeManager::separatorColor() { return s_dark ? QColor(60, 60, 60) : QColor(220, 220, 220); }
