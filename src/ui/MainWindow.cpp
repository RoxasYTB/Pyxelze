#include "MainWindow.h"
#include "ThemeManager.h"
#include "IconProvider.h"
#include "ErrorDialog.h"
#include "AboutDialog.h"
#include "ArchiveInfoDialog.h"
#include "PassphraseDialog.h"
#include "ProgressDialog.h"
#include "archive/ArchiveParser.h"
#include "archive/CompressionService.h"
#include "archive/ExtractionService.h"
#include "core/AppConstants.h"
#include "core/Logger.h"
#include "core/ProcessHelper.h"
#include "core/RoxRunner.h"
#include "helpers/SizeFormatter.h"
#include "helpers/TempHelper.h"
#include "helpers/UpdateChecker.h"
#include "localization/Localization.h"
#include "platform/PlatformService.h"
#include "security/PassphraseManager.h"
#include <QTreeView>
#include <QStandardItemModel>
#include <QHeaderView>
#include <QMenuBar>
#include <QToolBar>
#include <QStatusBar>
#include <QLineEdit>
#include <QLabel>
#include <QProgressBar>
#include <QFileDialog>
#include <QMessageBox>
#include <QDragEnterEvent>
#include <QDropEvent>
#include <QMimeData>
#include <QDir>
#include <QFileInfo>
#include <QProcess>
#include <QApplication>
#include <QStyle>
#include <QKeyEvent>
#include <QUuid>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QMenu>

MainWindow::MainWindow(const QString& archivePath, QWidget* parent)
    : QMainWindow(parent) {
    setWindowTitle(QStringLiteral("Pyxelze"));
    setWindowIcon(IconProvider::appIcon());
    resize(1060, 680);
    setMinimumSize(640, 400);
    setAcceptDrops(true);

    ThemeManager::init();

    buildMenuBar();
    buildToolbar();
    buildAddressBar();
    buildFileList();
    buildStatusBar();

    ThemeManager::applyToWidget(this);

    if (!archivePath.isEmpty() && QFile::exists(archivePath))
        loadArchive(archivePath);
    else
        createEmptyArchive();

    UpdateChecker::checkAsync(this, true);
}

void MainWindow::buildMenuBar() {
    auto* mb = menuBar();

    auto* fileMenu = mb->addMenu(L::get("menu.file"));
    fileMenu->addAction(L::get("menu.new"), this, &MainWindow::newArchive);
    fileMenu->addAction(L::get("menu.open"), this, &MainWindow::openArchiveDialog);
    fileMenu->addSeparator();
    fileMenu->addAction(L::get("menu.quit"), this, &QMainWindow::close);

    auto* viewMenu = mb->addMenu(L::get("menu.view"));
    m_actDarkMode = viewMenu->addAction(L::get("menu.view.darkMode"));
    m_actDarkMode->setCheckable(true);
    m_actDarkMode->setChecked(ThemeManager::darkMode());
    connect(m_actDarkMode, &QAction::toggled, this, [this](bool on) {
        ThemeManager::setDarkMode(on);
    });

    auto* langMenu = viewMenu->addMenu(L::get("menu.view.language"));
    for (const auto& lang : L::availableLanguages()) {
        auto code = lang;
        auto* act = langMenu->addAction(L::languageDisplayName(code));
        act->setCheckable(true);
        act->setChecked(code == L::currentLang());
        connect(act, &QAction::triggered, this, [this, code] {
            L::setLanguage(code);
            rebuildUI();
        });
    }

    auto* toolsMenu = mb->addMenu(L::get("menu.tools"));
    if (PlatformService::canRegisterContextMenu()) {
        toolsMenu->addAction(L::get("menu.tools.contextMenuRegister"), [] { PlatformService::registerContextMenu(); });
        toolsMenu->addAction(L::get("menu.tools.contextMenuUnregister"), [] { PlatformService::unregisterContextMenu(); });
        toolsMenu->addSeparator();
    }
    toolsMenu->addAction(L::get("menu.tools.showLogs"), [] {
        PlatformService::openFile(Logger::logPath());
    });
    toolsMenu->addSeparator();
    toolsMenu->addAction(L::get("menu.tools.checkUpdates"), this, [this] {
        UpdateChecker::checkAsync(this, false);
    });

    auto* helpMenu = mb->addMenu(L::get("menu.help"));
    helpMenu->addAction(L::get("menu.help.about"), this, &MainWindow::showAboutDialog);
}

void MainWindow::buildToolbar() {
    m_toolbar = addToolBar(QStringLiteral("Main"));
    m_toolbar->setMovable(false);
    m_toolbar->setIconSize(QSize(24, 24));
    m_toolbar->setToolButtonStyle(Qt::ToolButtonTextUnderIcon);

    m_toolbar->addAction(IconProvider::toolbarIcon("new"), L::get("toolbar.new"), this, &MainWindow::newArchive);
    m_toolbar->addAction(IconProvider::toolbarIcon("open"), L::get("toolbar.open"), this, &MainWindow::openArchiveDialog);
    m_toolbar->addSeparator();
    m_toolbar->addAction(IconProvider::toolbarIcon("add"), L::get("toolbar.add"), this, &MainWindow::addFilesDialog);
    m_toolbar->addSeparator();
    m_toolbar->addAction(IconProvider::toolbarIcon("extract-all"), L::get("toolbar.extractAll"), this, &MainWindow::extractAll);
    m_toolbar->addAction(IconProvider::toolbarIcon("extract"), L::get("toolbar.extract"), this, &MainWindow::extractSelected);
    m_toolbar->addSeparator();
    m_toolbar->addAction(IconProvider::toolbarIcon("info"), L::get("toolbar.info"), this, &MainWindow::showArchiveInfo);
    m_actUp = m_toolbar->addAction(IconProvider::toolbarIcon("up"), L::get("toolbar.up"), this, &MainWindow::navigateUp);
    m_actUp->setEnabled(false);
}

void MainWindow::buildAddressBar() {
    m_addressBar = new QLineEdit;
    m_addressBar->setReadOnly(true);
    m_addressBar->setFixedHeight(28);

    auto* container = new QWidget;
    auto* layout = new QHBoxLayout(container);
    layout->setContentsMargins(8, 2, 8, 2);
    layout->addWidget(m_addressBar);

    auto* dockWidget = new QWidget;
    auto* dockLayout = new QVBoxLayout(dockWidget);
    dockLayout->setContentsMargins(0, 0, 0, 0);
    dockLayout->addWidget(container);

    setMenuWidget(nullptr);

    auto* centralWrapper = new QWidget;
    auto* mainLayout = new QVBoxLayout(centralWrapper);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);
    mainLayout->addWidget(container);

    m_treeView = nullptr;
    setCentralWidget(centralWrapper);
}

void MainWindow::buildFileList() {
    m_model = new QStandardItemModel(this);
    m_model->setHorizontalHeaderLabels({L::get("col.name"), L::get("col.size"), L::get("col.type")});

    m_treeView = new QTreeView;
    m_treeView->setModel(m_model);
    m_treeView->setRootIsDecorated(false);
    m_treeView->setAlternatingRowColors(false);
    m_treeView->setSelectionMode(QAbstractItemView::ExtendedSelection);
    m_treeView->setSelectionBehavior(QAbstractItemView::SelectRows);
    m_treeView->setSortingEnabled(true);
    m_treeView->setDragEnabled(true);
    m_treeView->setAcceptDrops(false);
    m_treeView->setEditTriggers(QAbstractItemView::NoEditTriggers);
    m_treeView->setContextMenuPolicy(Qt::CustomContextMenu);
    m_treeView->setUniformRowHeights(true);

    m_treeView->header()->setStretchLastSection(true);
    m_treeView->header()->setSectionResizeMode(0, QHeaderView::Stretch);
    m_treeView->header()->setSectionResizeMode(1, QHeaderView::Interactive);
    m_treeView->header()->setSectionResizeMode(2, QHeaderView::Interactive);
    m_treeView->header()->resizeSection(1, 120);
    m_treeView->header()->resizeSection(2, 200);

    connect(m_treeView, &QTreeView::doubleClicked, this, &MainWindow::itemDoubleClicked);
    connect(m_treeView->header(), &QHeaderView::sortIndicatorChanged, this, &MainWindow::sortByColumn);
    connect(m_treeView, &QWidget::customContextMenuRequested, this, [this](const QPoint& pos) {
        auto idx = m_treeView->indexAt(pos);
        if (!idx.isValid()) return;

        QMenu ctx(this);
        ctx.addAction(L::get("ctx.open"), this, [this] {
            auto idx = m_treeView->currentIndex();
            if (idx.isValid()) itemDoubleClicked(idx);
        });
        ctx.addSeparator();
        ctx.addAction(L::get("ctx.extractTo"), this, &MainWindow::extractSelected);
        ctx.addAction(L::get("ctx.extractHere"), this, [this] {
            if (!m_treeView->selectionModel()->hasSelection()) return;
            auto destPath = QFileInfo(m_currentArchive).absolutePath();
            auto extractTemp = TempHelper::createTempDir(QStringLiteral("pyxelze_loc_extract"));
            if (!ExtractionService::decompressArchiveToDir(m_currentArchive, extractTemp)) {
                ErrorDialog::show(this, L::get("dialog.extractFail"));
                TempHelper::safeDelete(extractTemp);
                return;
            }
            int ok = 0, fail = 0;
            for (const auto& idx : m_treeView->selectionModel()->selectedRows()) {
                auto vfVar = m_model->data(idx, Qt::UserRole + 1);
                if (!vfVar.isValid()) continue;
                auto fullPath = m_model->data(idx, Qt::UserRole + 2).toString();
                bool isFolder = m_model->data(idx, Qt::UserRole + 3).toBool();
                if (!isFolder) {
                    auto src = ExtractionService::findExtractedFile(extractTemp, fullPath);
                    if (!src.isEmpty()) {
                        auto dest = destPath + QStringLiteral("/") + QFileInfo(fullPath).fileName();
                        QFile::remove(dest);
                        if (QFile::copy(src, dest)) ++ok; else ++fail;
                    } else ++fail;
                }
            }
            TempHelper::safeDelete(extractTemp);
            if (fail == 0)
                QMessageBox::information(this, L::get("dialog.success"), L::get("dialog.extractSuccess").replace(QStringLiteral("{0}"), QString::number(ok)));
            else
                QMessageBox::warning(this, L::get("dialog.warning"), L::get("dialog.extractPartial").replace(QStringLiteral("{0}"), QString::number(ok)).replace(QStringLiteral("{1}"), QString::number(fail)));
        });
        ctx.exec(m_treeView->viewport()->mapToGlobal(pos));
    });

    connect(m_treeView->selectionModel(), &QItemSelectionModel::selectionChanged, this, [this] { updateStatusBar(); });

    auto* central = centralWidget();
    auto* layout = qobject_cast<QVBoxLayout*>(central->layout());
    if (layout) layout->addWidget(m_treeView);
}

void MainWindow::buildStatusBar() {
    auto* sb = statusBar();
    m_statusFileCount = new QLabel(L::get("status.noFiles"));
    m_statusSelection = new QLabel(L::get("status.noSelection"));
    m_statusProgress = new QProgressBar;
    m_statusProgress->setFixedWidth(150);
    m_statusProgress->setVisible(false);

    sb->addWidget(m_statusFileCount);
    sb->addPermanentWidget(m_statusSelection);
    sb->addPermanentWidget(m_statusProgress);
}

void MainWindow::openArchiveDialog() {
    auto path = QFileDialog::getOpenFileName(this, L::get("menu.open"),
        {}, QStringLiteral("PNG Rox (*.png);;All Files (*)"));
    if (!path.isEmpty()) loadArchive(path);
}

void MainWindow::loadArchive(const QString& path) {
    auto prevArchive = m_currentArchive;
    auto prevFiles = m_allFiles;
    auto prevPath = m_currentPath;
    auto prevTitle = windowTitle();

    if (m_isEmptyArchive) cleanupEmptyArchive();

    m_currentArchive = path;
    setWindowTitle(QStringLiteral("Pyxelze - %1").arg(QFileInfo(path).fileName()));
    m_allFiles.clear();
    m_currentPath.clear();
    updateAddressBar();

    m_statusProgress->setVisible(true);
    m_statusProgress->setRange(0, 0);
    QApplication::processEvents();

    auto r = ProcessHelper::runRox(QStringList{QStringLiteral("list"), path}, 30000);

    if (r.exitCode == 0 && !r.stdOut.trimmed().isEmpty()) {
        m_allFiles = ArchiveParser::parse(r.stdOut);
        if (m_allFiles.isEmpty()) {
            m_currentArchive = prevArchive;
            m_allFiles = prevFiles;
            m_currentPath = prevPath;
            setWindowTitle(prevTitle);
            updateAddressBar();
            if (!prevArchive.isEmpty()) refreshView();
            ErrorDialog::show(this, L::get("dialog.invalidArchive"));
            m_statusProgress->setVisible(false);
            return;
        }

        auto hr = ProcessHelper::runRox(QStringList{QStringLiteral("havepassphrase"), path}, 5000);
        if (hr.exitCode == 0 && hr.stdOut.contains(QStringLiteral("Passphrase detected"))) {
            PassphraseManager::clear();
            QString errorMsg;
            while (true) {
                auto pass = PassphraseDialog::prompt(this, L::get("passphrase.required"), L::get("passphrase.prompt"), errorMsg);
                if (!pass.has_value()) break;
                auto tempDir = TempHelper::createTempDir(QStringLiteral("pyxelze_verify"));
                auto passArg = PassphraseManager::buildPassphraseArg(*pass);
                auto vr = ProcessHelper::runRox(QStringList{QStringLiteral("decompress"), path, passArg, tempDir}, 15000);
                TempHelper::safeDelete(tempDir);
                if (vr.exitCode == 0) { PassphraseManager::save(*pass); break; }
                if (PassphraseManager::isDecryptionFailure(vr.stdOut, vr.stdErr)) { errorMsg = L::get("dialog.wrongPassword"); continue; }
                break;
            }
        }
    } else if (r.stdErr == QStringLiteral("Timeout")) {
        m_currentArchive = prevArchive; m_allFiles = prevFiles; m_currentPath = prevPath; setWindowTitle(prevTitle);
        updateAddressBar(); if (!prevArchive.isEmpty()) refreshView();
        ErrorDialog::show(this, L::get("dialog.timeout"), {}, L::get("dialog.timeoutTitle"));
        m_statusProgress->setVisible(false);
        return;
    } else {
        m_currentArchive = prevArchive; m_allFiles = prevFiles; m_currentPath = prevPath; setWindowTitle(prevTitle);
        updateAddressBar(); if (!prevArchive.isEmpty()) refreshView();
        ErrorDialog::show(this, L::get("dialog.archiveReadError"), r.stdErr);
        m_statusProgress->setVisible(false);
        return;
    }

    m_statusProgress->setVisible(false);
    refreshView();
}

void MainWindow::refreshView() {
    m_model->removeRows(0, m_model->rowCount());
    m_actUp->setEnabled(!m_currentPath.isEmpty());

    if (!m_currentPath.isEmpty()) {
        auto* nameItem = new QStandardItem(IconProvider::iconForFile({}, true), QStringLiteral("..."));
        nameItem->setData(QStringLiteral("UP"), Qt::UserRole + 1);
        m_model->appendRow({nameItem, new QStandardItem, new QStandardItem});
    }

    QList<const VirtualFile*> folders, files;
    for (const auto& f : m_allFiles) {
        auto parentDir = QFileInfo(f.fullPath).path().replace('\\', '/');
        if (parentDir == QStringLiteral(".")) parentDir.clear();
        if (parentDir != m_currentPath) continue;
        if (f.isFolder) folders.append(&f); else files.append(&f);
    }

    std::sort(folders.begin(), folders.end(), [](auto* a, auto* b) { return a->name.compare(b->name, Qt::CaseInsensitive) < 0; });
    std::sort(files.begin(), files.end(), [](auto* a, auto* b) { return a->name.compare(b->name, Qt::CaseInsensitive) < 0; });

    auto addVF = [this](const VirtualFile* vf) {
        auto icon = IconProvider::iconForFile(vf->name, vf->isFolder);
        auto* nameItem = new QStandardItem(icon, vf->name);
        nameItem->setData(true, Qt::UserRole + 1);
        nameItem->setData(vf->fullPath, Qt::UserRole + 2);
        nameItem->setData(vf->isFolder, Qt::UserRole + 3);
        nameItem->setData(vf->size, Qt::UserRole + 4);

        auto* sizeItem = new QStandardItem(vf->isFolder ? QString() : SizeFormatter::format(vf->size));
        sizeItem->setTextAlignment(Qt::AlignRight | Qt::AlignVCenter);
        sizeItem->setData(vf->size, Qt::UserRole);

        auto* typeItem = new QStandardItem(vf->isFolder ? L::get("dialog.folderType") : PlatformService::fileTypeName(vf->name));

        m_model->appendRow({nameItem, sizeItem, typeItem});
    };

    for (auto* f : folders) addVF(f);
    for (auto* f : files) addVF(f);

    updateAddressBar();
    updateStatusBar();
}

void MainWindow::navigateUp() {
    if (m_currentPath.isEmpty()) return;
    int slash = m_currentPath.lastIndexOf('/');
    m_currentPath = slash > 0 ? m_currentPath.left(slash) : QString();
    refreshView();
}

void MainWindow::navigateInto(const QString& folderPath) {
    m_currentPath = folderPath;
    refreshView();
}

void MainWindow::itemDoubleClicked(const QModelIndex& index) {
    if (!index.isValid()) return;
    auto upTag = m_model->data(m_model->index(index.row(), 0), Qt::UserRole + 1);
    if (upTag.toString() == QStringLiteral("UP")) { navigateUp(); return; }

    auto fullPath = m_model->data(m_model->index(index.row(), 0), Qt::UserRole + 2).toString();
    auto isFolder = m_model->data(m_model->index(index.row(), 0), Qt::UserRole + 3).toBool();

    if (isFolder) { navigateInto(fullPath); return; }

    for (const auto& f : m_allFiles) {
        if (f.fullPath == fullPath && !f.isFolder) {
            openFileFromArchive(f);
            return;
        }
    }
}

void MainWindow::openFileFromArchive(const VirtualFile& vf) {
    if (m_currentArchive.isEmpty()) return;

    auto tempDir = TempHelper::createTempDir(QStringLiteral("pyxelze_open"));
    auto outputPath = tempDir + QStringLiteral("/") + QFileInfo(vf.fullPath).fileName();

    if (!ExtractionService::extractFileSingle(m_currentArchive, vf.fullPath, outputPath)) {
        TempHelper::safeDelete(tempDir);
        ErrorDialog::show(this, L::get("dialog.extractFailed"));
        return;
    }
    PlatformService::openFile(outputPath);
}

void MainWindow::sortByColumn(int col, Qt::SortOrder order) {
    m_sortColumn = col;
    m_sortOrder = order;
    m_model->sort(col, order);
}

void MainWindow::newArchive() {
    if (!m_isEmptyArchive && !m_currentArchive.isEmpty()) {
        if (QMessageBox::question(this, L::get("dialog.newArchiveTitle"), L::get("dialog.confirmNew")) != QMessageBox::Yes)
            return;
    }
    cleanupEmptyArchive();
    m_currentArchive.clear();
    m_allFiles.clear();
    m_currentPath.clear();
    setWindowTitle(QStringLiteral("Pyxelze"));
    createEmptyArchive();
}

void MainWindow::addFilesDialog() {
    auto paths = QFileDialog::getOpenFileNames(this, L::get("dialog.addFiles"), {}, QStringLiteral("All Files (*)"));
    if (!paths.isEmpty()) addFilesToArchive(paths);
}

void MainWindow::extractAll() {
    if (m_currentArchive.isEmpty()) return;
    auto dir = QFileDialog::getExistingDirectory(this, L::get("toolbar.extractAll"));
    if (dir.isEmpty()) return;

    auto destFolder = dir + QStringLiteral("/") + QFileInfo(m_currentArchive).completeBaseName();
    if (ExtractionService::extractWithProgress(this, m_currentArchive, destFolder))
        QMessageBox::information(this, L::get("dialog.success"), L::get("dialog.extractSuccess").replace(QStringLiteral("{0}"), destFolder));
    else
        ErrorDialog::show(this, L::get("dialog.extractFail"));
}

void MainWindow::extractSelected() {
    if (!m_treeView->selectionModel()->hasSelection()) return;
    auto dir = QFileDialog::getExistingDirectory(this, L::get("ctx.extractTo"));
    if (dir.isEmpty()) return;

    auto extractTemp = TempHelper::createTempDir(QStringLiteral("pyxelze_sel_extract"));
    if (!ExtractionService::decompressArchiveToDir(m_currentArchive, extractTemp)) {
        ErrorDialog::show(this, L::get("dialog.extractFail"));
        TempHelper::safeDelete(extractTemp);
        return;
    }

    int ok = 0, fail = 0;
    for (const auto& idx : m_treeView->selectionModel()->selectedRows()) {
        auto fullPath = m_model->data(m_model->index(idx.row(), 0), Qt::UserRole + 2).toString();
        auto isFolder = m_model->data(m_model->index(idx.row(), 0), Qt::UserRole + 3).toBool();
        if (fullPath.isEmpty()) continue;

        if (!isFolder) {
            auto src = ExtractionService::findExtractedFile(extractTemp, fullPath);
            if (!src.isEmpty()) {
                auto dest = dir + QStringLiteral("/") + QFileInfo(fullPath).fileName();
                QFile::remove(dest);
                if (QFile::copy(src, dest)) ++ok; else ++fail;
            } else ++fail;
        } else {
            auto filesUnder = ExtractionService::getFilesUnder(m_allFiles, fullPath);
            auto folderName = QFileInfo(fullPath).fileName();
            for (const auto& f : filesUnder) {
                auto rel = f.fullPath.mid(fullPath.length() + 1);
                auto dest = dir + QStringLiteral("/") + folderName + QStringLiteral("/") + rel;
                QDir().mkpath(QFileInfo(dest).absolutePath());
                auto src = ExtractionService::findExtractedFile(extractTemp, f.fullPath);
                if (!src.isEmpty()) {
                    QFile::remove(dest);
                    if (QFile::copy(src, dest)) ++ok; else ++fail;
                } else ++fail;
            }
        }
    }
    TempHelper::safeDelete(extractTemp);
    if (fail == 0)
        QMessageBox::information(this, L::get("dialog.success"), L::get("dialog.extractSuccess").replace(QStringLiteral("{0}"), QString::number(ok)));
    else
        QMessageBox::warning(this, L::get("dialog.warning"), L::get("dialog.extractPartial").replace(QStringLiteral("{0}"), QString::number(ok)).replace(QStringLiteral("{1}"), QString::number(fail)));
}

void MainWindow::showArchiveInfo() {
    if (m_currentArchive.isEmpty() || m_isEmptyArchive) {
        QMessageBox::information(this, L::get("toolbar.info"), L::get("dialog.noArchiveOpen"));
        return;
    }
    ArchiveInfoDialog dlg(this, m_currentArchive, m_allFiles);
    dlg.exec();
}

void MainWindow::showAboutDialog() {
    AboutDialog dlg(this);
    dlg.exec();
}

void MainWindow::addFilesToArchive(const QStringList& filePaths) {
    QStringList valid;
    for (const auto& p : filePaths) {
        if (QFileInfo::exists(p)) valid.append(p);
    }
    if (valid.isEmpty()) return;

    if (m_isEmptyArchive) {
        auto savePath = QFileDialog::getSaveFileName(this, L::get("dialog.saveNewArchive"), {}, QStringLiteral("PNG Rox (*.png)"));
        if (savePath.isEmpty()) return;

        auto buildTemp = TempHelper::createTempDir(QStringLiteral("pyxelze_new_archive"));
        for (const auto& src : valid) {
            QFileInfo fi(src);
            auto dest = buildTemp + QStringLiteral("/") + fi.fileName();
            if (fi.isDir())
                TempHelper::copyDirectory(src, dest);
            else
                QFile::copy(src, dest);
        }

        auto pass = PassphraseDialog::prompt(this, L::get("dialog.passphraseTitle"), L::get("dialog.passphrasePrompt"));
        if (!pass.has_value()) { TempHelper::safeDelete(buildTemp); return; }

        QString passArg;
        if (!pass->isEmpty())
            passArg = QStringLiteral(" ") + PassphraseManager::buildPassphraseArg(*pass);

        auto args = QStringLiteral("encode \"%1\" \"%2\"%3").arg(buildTemp, savePath, passArg);
        auto r = ProgressDialog::runRoxWithProgress(this, L::get("dialog.creating"), L::get("dialog.encoding"), args);
        TempHelper::safeDelete(buildTemp);

        if (r.exitCode != 0) {
            ErrorDialog::show(this, L::get("dialog.createFailed"), r.stdErr);
            return;
        }

        if (!pass->isEmpty()) PassphraseManager::save(*pass);
        cleanupEmptyArchive();
        loadArchive(savePath);
        QMessageBox::information(this, L::get("dialog.success"), L::get("dialog.createSuccess").replace(QStringLiteral("{0}"), QString::number(valid.size())));
        return;
    }

    auto msg = L::get("dialog.confirmAdd").replace(QStringLiteral("{0}"), QString::number(valid.size()));
    if (QMessageBox::question(this, L::get("dialog.addTitle"), msg) != QMessageBox::Yes) return;

    auto extractTemp = TempHelper::createTempDir(QStringLiteral("pyxelze_add_extract"));
    if (!ExtractionService::decompressArchiveToDir(m_currentArchive, extractTemp)) {
        ErrorDialog::show(this, L::get("dialog.decompressFailed"));
        TempHelper::safeDelete(extractTemp);
        return;
    }

    for (const auto& src : valid) {
        QFileInfo fi(src);
        auto dest = extractTemp + QStringLiteral("/") + fi.fileName();
        if (fi.isDir())
            TempHelper::copyDirectory(src, dest);
        else {
            QFile::remove(dest);
            QFile::copy(src, dest);
        }
    }

    auto cached = PassphraseManager::cachedPassphrase();
    QString passArg;
    if (!cached.isEmpty()) passArg = QStringLiteral(" ") + PassphraseManager::buildPassphraseArg(cached);

    auto args = QStringLiteral("encode \"%1\" \"%2\"%3").arg(extractTemp, m_currentArchive, passArg);
    auto r = ProgressDialog::runRoxWithProgress(this, L::get("dialog.reencoding"), L::get("dialog.reencodingProgress"), args);
    TempHelper::safeDelete(extractTemp);

    if (r.exitCode != 0) {
        ErrorDialog::show(this, L::get("dialog.reencodeFailed"), r.stdErr);
        return;
    }

    loadArchive(m_currentArchive);
    QMessageBox::information(this, L::get("dialog.success"), L::get("dialog.addSuccess").replace(QStringLiteral("{0}"), QString::number(valid.size())));
}

void MainWindow::createEmptyArchive() {
    m_isEmptyArchive = true;
    auto tempDir = TempHelper::createTempDir(QStringLiteral("pyxelze_empty"));
    QFile f(tempDir + QStringLiteral("/.pyxelze_empty"));
    if (f.open(QIODevice::WriteOnly)) { f.write(""); f.close(); }

    auto tempArchive = QDir::tempPath() + QStringLiteral("/pyxelze_empty_%1.png").arg(QUuid::createUuid().toString(QUuid::Id128));
    auto args = QStringLiteral("encode \"%1\" \"%2\"").arg(tempDir, tempArchive);
    auto r = ProcessHelper::runRox(QStringList{args}, 15000);
    TempHelper::safeDelete(tempDir);

    if (r.exitCode == 0 && QFile::exists(tempArchive)) {
        m_emptyArchiveTempPath = tempArchive;
        m_currentArchive = tempArchive;
        m_allFiles.clear();
        m_currentPath.clear();
        setWindowTitle(L::get("dialog.title.newArchive"));
        updateAddressBar();
        refreshView();
    }
}

void MainWindow::cleanupEmptyArchive() {
    m_isEmptyArchive = false;
    if (!m_emptyArchiveTempPath.isEmpty()) {
        TempHelper::safeDeleteFile(m_emptyArchiveTempPath);
        m_emptyArchiveTempPath.clear();
    }
}

void MainWindow::updateAddressBar() {
    if (!m_addressBar) return;
    if (m_isEmptyArchive) {
        m_addressBar->setText(L::get("dialog.emptyArchive"));
        return;
    }
    auto archivePart = m_currentArchive;
    archivePart.replace('\\', '/');
    auto virtualPart = m_currentPath.isEmpty() ? QString() : QStringLiteral("/") + m_currentPath;
    m_addressBar->setText(archivePart + virtualPart);
}

void MainWindow::updateStatusBar() {
    int fileCount = 0, folderCount = 0;
    for (const auto& f : m_allFiles) {
        auto parentDir = QFileInfo(f.fullPath).path().replace('\\', '/');
        if (parentDir == QStringLiteral(".")) parentDir.clear();
        if (parentDir != m_currentPath) continue;
        if (f.isFolder) ++folderCount; else ++fileCount;
    }
    m_statusFileCount->setText(L::get("status.filesAndFolders").replace(QStringLiteral("{0}"), QString::number(fileCount)).replace(QStringLiteral("{1}"), QString::number(folderCount)));

    int sel = m_treeView && m_treeView->selectionModel() ? m_treeView->selectionModel()->selectedRows().size() : 0;
    m_statusSelection->setText(L::get("status.selected").replace(QStringLiteral("{0}"), QString::number(sel)));
}

void MainWindow::rebuildUI() {
    menuBar()->clear();
    removeToolBar(m_toolbar);
    delete m_toolbar;
    m_toolbar = nullptr;

    buildMenuBar();
    buildToolbar();

    if (m_model)
        m_model->setHorizontalHeaderLabels({L::get("col.name"), L::get("col.size"), L::get("col.type")});

    ThemeManager::applyToWidget(this);
    if (!m_currentArchive.isEmpty()) refreshView();
    else if (m_isEmptyArchive) updateAddressBar();
}

void MainWindow::dragEnterEvent(QDragEnterEvent* e) {
    if (m_isDraggingFromSelf) { e->ignore(); return; }
    if (e->mimeData()->hasUrls()) e->acceptProposedAction();
}

void MainWindow::dropEvent(QDropEvent* e) {
    if (m_isDraggingFromSelf) return;
    auto urls = e->mimeData()->urls();
    if (urls.isEmpty()) return;

    QStringList paths;
    for (const auto& url : urls) {
        if (url.isLocalFile()) paths.append(url.toLocalFile());
    }
    if (paths.isEmpty()) return;

    if (m_isEmptyArchive || (!m_currentArchive.isEmpty() && QFile::exists(m_currentArchive))) {
        addFilesToArchive(paths);
        return;
    }
    if (paths.size() == 1 && QFile::exists(paths.first()))
        loadArchive(paths.first());
}

void MainWindow::keyPressEvent(QKeyEvent* e) {
    if (e->modifiers() == Qt::ControlModifier && e->key() == Qt::Key_O) { openArchiveDialog(); e->accept(); return; }
    if (e->key() == Qt::Key_Backspace) { navigateUp(); e->accept(); return; }
    if (e->modifiers() == Qt::AltModifier && e->key() == Qt::Key_Up) { navigateUp(); e->accept(); return; }
    QMainWindow::keyPressEvent(e);
}
