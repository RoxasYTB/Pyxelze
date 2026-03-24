#pragma once
#include "core/VirtualFile.h"
#include <QMainWindow>
#include <QList>
#include <QString>

class QTreeView;
class QStandardItemModel;
class QLineEdit;
class QLabel;
class QProgressBar;
class QAction;
class QMenu;
class QToolBar;

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(const QString& archivePath = {}, QWidget* parent = nullptr);

protected:
    void dragEnterEvent(QDragEnterEvent* e) override;
    void dropEvent(QDropEvent* e) override;
    void keyPressEvent(QKeyEvent* e) override;

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

    QTreeView* m_treeView = nullptr;
    QStandardItemModel* m_model = nullptr;
    QLineEdit* m_addressBar = nullptr;
    QLabel* m_statusFileCount = nullptr;
    QLabel* m_statusSelection = nullptr;
    QProgressBar* m_statusProgress = nullptr;
    QToolBar* m_toolbar = nullptr;
    QAction* m_actUp = nullptr;
    QAction* m_actDarkMode = nullptr;

    QList<VirtualFile> m_allFiles;
    QString m_currentPath;
    QString m_currentArchive;
    bool m_isEmptyArchive = false;
    QString m_emptyArchiveTempPath;
    int m_sortColumn = 0;
    Qt::SortOrder m_sortOrder = Qt::AscendingOrder;
    bool m_isDraggingFromSelf = false;
};
