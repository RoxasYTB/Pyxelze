#pragma once
#include "core/VirtualFile.h"
#include <QMainWindow>
#include <QList>
#include <QPersistentModelIndex>
#include <QString>
#include <QStringList>
#include <QPoint>

class QTreeView;
class QListView;
class QAbstractItemView;
class QStandardItemModel;
class QLineEdit;
class QLabel;
class QProgressBar;
class QAction;
class QActionGroup;
class QMenu;
class QProcess;
class QToolBar;
class QStackedWidget;
class QTimer;

enum class ViewMode { Details, List, SmallIcons, MediumIcons, LargeIcons, Tiles };

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(const QString& archivePath = {}, QWidget* parent = nullptr);

protected:
    void closeEvent(QCloseEvent* e) override;
    void dragEnterEvent(QDragEnterEvent* e) override;
    void dropEvent(QDropEvent* e) override;
    void keyPressEvent(QKeyEvent* e) override;
    bool eventFilter(QObject* obj, QEvent* e) override;

private:
    void buildMenuBar();
    void buildToolbar();
    void buildAddressBar();
    void buildFileList();
    void buildStatusBar();
    void rebuildUI();

    void openArchiveDialog();
    void loadArchive(const QString& path);
    void refreshView();
    void navigateUp();
    void navigateInto(const QString& folderPath);
    void itemDoubleClicked(const QModelIndex& index);
    void openFileFromArchive(const VirtualFile& vf);
    void sortByColumn(int col, Qt::SortOrder order);
    void startFileDrag();

    void newArchive();
    void addFilesDialog();
    void extractAll();
    void extractSelected();
    void showArchiveInfo();
    void showAboutDialog();

    void addFilesToArchive(const QStringList& filePaths);
    void createEmptyArchive();
    void cleanupEmptyArchive();

    void updateAddressBar();
    void updateStatusBar();
    void scheduleDragPrefetch();
    void maybeStartDragPrefetch();
    void stopDragPrefetch();
    void clearDragCache();
    QString dragCacheDir();
    void applyDeferredSelection();

    void setViewMode(ViewMode mode);
    void showContextMenu(const QPoint& pos);
    QAbstractItemView* currentView() const;

    QTreeView* m_treeView = nullptr;
    QListView* m_listView = nullptr;
    QStackedWidget* m_viewStack = nullptr;
    QStandardItemModel* m_model = nullptr;
    QLineEdit* m_addressBar = nullptr;
    QLabel* m_statusFileCount = nullptr;
    QLabel* m_statusSelection = nullptr;
    QProgressBar* m_statusProgress = nullptr;
    QToolBar* m_toolbar = nullptr;
    QAction* m_actUp = nullptr;
    QAction* m_actDarkMode = nullptr;
    QActionGroup* m_viewModeGroup = nullptr;

    QList<VirtualFile> m_allFiles;
    QString m_currentPath;
    QString m_currentArchive;
    bool m_isEmptyArchive = false;
    QString m_emptyArchiveTempPath;
    int m_sortColumn = 0;
    Qt::SortOrder m_sortOrder = Qt::AscendingOrder;
    bool m_isDraggingFromSelf = false;
    QPoint m_dragStartPos;
    QString m_dragCacheDir;
    QStringList m_dragPrefetchFiles;
    QProcess* m_dragPrefetchProcess = nullptr;
    QTimer* m_dragPrefetchTimer = nullptr;
    QAbstractItemView* m_pressedView = nullptr;
    QPersistentModelIndex m_pressedIndex;
    bool m_deferSelectionOnRelease = false;
    ViewMode m_viewMode = ViewMode::Details;
};
