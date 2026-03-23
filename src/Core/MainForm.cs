using System.Diagnostics;
using System.Runtime.Versioning;
using System.Text;

namespace Pyxelze;

[SupportedOSPlatform("windows")]
public partial class MainForm : Form
{
    private ListView listView = null!;
    private List<VirtualFile> allFiles = new();
    private string currentPath = "";
    private string currentArchive = "";
    private ImageList smallImageList = null!;
    private FileIconManager? iconManager;
    private FileAssociationWatcher? associationWatcher;
    private ContextMenuStrip contextMenu = null!;
    private StatusStrip statusStrip = null!;
    private ToolStripStatusLabel statusLabelFileCount = null!;
    private ToolStripStatusLabel statusLabelSelection = null!;
    private ToolStripProgressBar statusProgressBar = null!;
    private ToolStripStatusLabel statusLabelProgress = null!;
    private ToolStrip toolbar = null!;
    private TextBox addressBar = null!;
    private Panel addressBarPanel = null!;
    private bool adjustingColumns = false;
    private int sortColumn = 0;
    private SortOrder sortOrder = SortOrder.Ascending;
    private ListViewItem? hoverItem = null;
    private bool autoExtractMode = false;
    private System.ComponentModel.IContainer? components = null;
    private ImageList largeImageList = null!;
    private int zoomLevel = 0;
    private static readonly View[] ViewModes = { View.Details, View.List, View.SmallIcon, View.LargeIcon };
    private bool isDraggingFromSelf = false;
    private ToolStripButton btnUp = null!;
    private bool isEmptyArchive = false;
    private string? emptyArchiveTempPath = null;

    public MainForm(string? archivePath = null, bool autoExtract = false)
    {
        InitializeComponent();
        BuildUI();
        ThemeManager.ApplyToForm(this);
        autoExtractMode = autoExtract;
        this.KeyPreview = true;
        this.KeyDown += MainForm_KeyDown;

        if (!string.IsNullOrEmpty(archivePath) && File.Exists(archivePath))
        {
            LoadArchive(archivePath);
            if (autoExtractMode)
                this.Shown += (s, e) => AutoExtractArchive();
        }
        else
        {
            CreateEmptyArchive();
        }

        UpdateChecker.ShowUpdateNotification(this);
    }

    private void MainForm_KeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Control && e.KeyCode == Keys.O) { OpenArchiveDialog(); e.Handled = true; }
        else if (e.KeyCode == Keys.Back) { NavigateUp(); e.Handled = true; }
        else if (e.Alt && e.KeyCode == Keys.Up) { NavigateUp(); e.Handled = true; }
    }

    private void BuildUI()
    {
        this.Text = "Pyxelze";
        this.Size = new Size(1060, 680);
        this.MinimumSize = new Size(640, 400);
        this.Font = new Font("Segoe UI", 9f);
        ThemeManager.InitializeFromRegistry();
        this.BackColor = ThemeManager.WindowBack;
        this.ForeColor = ThemeManager.WindowFore;

        this.SuspendLayout();
        BuildMenuStrip();
        BuildToolbar();
        BuildAddressBar();
        BuildListView();
        BuildStatusStrip();

        listView.Dock = DockStyle.Fill;
        statusStrip.Dock = DockStyle.Bottom;
        addressBarPanel.Dock = DockStyle.Top;
        toolbar.Dock = DockStyle.Top;

        this.Controls.SetChildIndex(statusStrip, 0);
        this.Controls.SetChildIndex(listView, 1);
        this.Controls.SetChildIndex(addressBarPanel, 2);
        this.Controls.SetChildIndex(toolbar, 3);
        this.ResumeLayout(true);

        try
        {
            var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appIcon.ico");
            if (File.Exists(iconPath)) this.Icon = new Icon(iconPath);
        }
        catch { }
    }

    private void BuildMenuStrip()
    {
        var menuStrip = new MenuStrip
        {
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore
        };

        var fileMenu = new ToolStripMenuItem(L.Get("menu.file"));
        fileMenu.DropDownItems.Add(L.Get("menu.new"), null, (s, e) => NewArchive());
        fileMenu.DropDownItems.Add(L.Get("menu.open"), null, (s, e) => OpenArchiveDialog());
        fileMenu.DropDownItems.Add(new ToolStripSeparator());
        fileMenu.DropDownItems.Add(L.Get("menu.quit"), null, (s, e) => Close());

        var toolsMenu = new ToolStripMenuItem(L.Get("menu.tools"));
        toolsMenu.DropDownItems.Add(L.Get("menu.tools.contextMenuRegister"), null, (s, e) => ContextMenuRegistration.Register());
        toolsMenu.DropDownItems.Add(L.Get("menu.tools.contextMenuUnregister"), null, (s, e) => ContextMenuRegistration.Unregister());
        toolsMenu.DropDownItems.Add(new ToolStripSeparator());
        toolsMenu.DropDownItems.Add(L.Get("menu.tools.showLogs"), null, (s, e) =>
        {
            try
            {
                if (File.Exists(Logger.LogPath))
                    Process.Start(new ProcessStartInfo(Logger.LogPath) { UseShellExecute = true });
                else
                    MessageBox.Show(L.Get("dialog.noLogFile"), L.Get("dialog.information"), MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch { }
        });
        toolsMenu.DropDownItems.Add(new ToolStripSeparator());
        toolsMenu.DropDownItems.Add(L.Get("menu.tools.checkUpdates"), null, async (s, e) =>
        {
            var (available, version, downloadUrl) = await UpdateChecker.CheckForUpdateAsync();
            if (available)
                UpdateChecker.ShowUpdateNotification(this, version, downloadUrl);
            else
                MessageBox.Show(L.Get("dialog.upToDate"), L.Get("dialog.update"), MessageBoxButtons.OK, MessageBoxIcon.Information);
        });

        var viewMenu = new ToolStripMenuItem(L.Get("menu.view"));
        var darkModeItem = new ToolStripMenuItem(L.Get("menu.view.darkMode")) { CheckOnClick = true, Checked = ThemeManager.DarkMode };
        darkModeItem.Click += (s, e) => ThemeManager.SetDarkMode(darkModeItem.Checked);
        viewMenu.DropDownItems.Add(darkModeItem);

        var langMenu = new ToolStripMenuItem(L.Get("menu.view.language"));
        foreach (var lang in L.AvailableLanguages)
        {
            var code = lang;
            var item = new ToolStripMenuItem(L.LanguageDisplayName(code)) { Checked = code == L.CurrentLang };
            item.Click += (s, e) => { L.SetLanguage(code); RebuildUI(); };
            langMenu.DropDownItems.Add(item);
        }
        viewMenu.DropDownItems.Add(langMenu);

        var helpMenu = new ToolStripMenuItem(L.Get("menu.help"));
        helpMenu.DropDownItems.Add(L.Get("menu.help.about"), null, (s, e) => ShowAboutDialog());

        menuStrip.Items.AddRange(new ToolStripItem[] { fileMenu, viewMenu, toolsMenu, helpMenu });
        this.MainMenuStrip = menuStrip;
        this.Controls.Add(menuStrip);
    }

    private void BuildToolbar()
    {
        int iconSize = 32;

        toolbar = new ToolStrip
        {
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            GripStyle = ToolStripGripStyle.Hidden,
            Padding = new Padding(4, 2, 4, 2),
            ImageScalingSize = new Size(iconSize, iconSize),
            RenderMode = ToolStripRenderMode.System,
            Font = new Font("Segoe UI", 8f),
            AutoSize = false,
            Height = iconSize + 28,
            Dock = DockStyle.Top
        };

        ToolStripButton MakeBtn(string text, string glyph, Action onClick)
        {
            var btn = new ToolStripButton(text)
            {
                Image = ToolbarIcons.Render(glyph, iconSize, ToolbarIcons.GetGlyphColor(glyph)),
                DisplayStyle = ToolStripItemDisplayStyle.ImageAndText,
                TextImageRelation = TextImageRelation.ImageAboveText,
                ImageScaling = ToolStripItemImageScaling.None,
                Tag = glyph,
                AutoSize = true
            };
            btn.Click += (s, e) => onClick();
            return btn;
        }

        toolbar.Items.AddRange(new ToolStripItem[]
        {
            MakeBtn(L.Get("toolbar.new"), ToolbarIcons.GlyphNew, NewArchive),
            MakeBtn(L.Get("toolbar.open"), ToolbarIcons.GlyphOpen, OpenArchiveDialog),
            new ToolStripSeparator(),
            MakeBtn(L.Get("toolbar.add"), ToolbarIcons.GlyphAdd, AddFilesDialog),
            new ToolStripSeparator(),
            MakeBtn(L.Get("toolbar.extractAll"), ToolbarIcons.GlyphExtractAll, ExtractAll),
            MakeBtn(L.Get("toolbar.extract"), ToolbarIcons.GlyphExtract, ExtractSelected),
            new ToolStripSeparator(),
            MakeBtn(L.Get("toolbar.info"), ToolbarIcons.GlyphInfo, ShowArchiveInfo),
            MakeBtn(L.Get("toolbar.up"), ToolbarIcons.GlyphUp, NavigateUp)
        });

        btnUp = (ToolStripButton)toolbar.Items[^1];
        btnUp.Enabled = false;

        this.Controls.Add(toolbar);
    }

    private void BuildAddressBar()
    {
        addressBarPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 30,
            Padding = new Padding(8, 4, 8, 4),
            BackColor = ThemeManager.ControlBack
        };

        addressBar = new TextBox
        {
            Dock = DockStyle.Fill,
            ReadOnly = true,
            BackColor = ThemeManager.DarkMode ? Color.FromArgb(30, 30, 30) : Color.White,
            ForeColor = ThemeManager.ControlFore,
            BorderStyle = BorderStyle.FixedSingle,
            Font = new Font("Segoe UI", 9f)
        };

        addressBarPanel.Controls.Add(addressBar);
        this.Controls.Add(addressBarPanel);
    }

    private void BuildListView()
    {
        listView = new ExtendedListView
        {
            Dock = DockStyle.Fill,
            View = View.Details,
            FullRowSelect = true,
            GridLines = false,
            BackColor = ThemeManager.WindowBack,
            ForeColor = ThemeManager.WindowFore,
            OwnerDraw = true,
            HideSelection = false,
            AllowColumnReorder = false,
            Font = new Font("Segoe UI", 9f),
            BorderStyle = BorderStyle.None
        };

        typeof(Control).GetProperty("DoubleBuffered",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
            ?.SetValue(listView, true, null);

        listView.Columns.Add(L.Get("col.name"), 500);
        listView.Columns.Add(L.Get("col.size"), 120, HorizontalAlignment.Right);
        listView.Columns.Add(L.Get("col.type"), 200);

        listView.ColumnWidthChanged += ListView_ColumnWidthChanged;
        listView.ColumnWidthChanging += (s, e) => { if (adjustingColumns) e.Cancel = true; };
        listView.ColumnReordered += (s, e) => { if (e.OldDisplayIndex == 0 || e.NewDisplayIndex == 0) e.Cancel = true; };
        listView.DoubleClick += ListView_DoubleClick;
        listView.ItemDrag += ListView_ItemDrag;
        listView.ColumnClick += ListView_ColumnClick;
        listView.MouseMove += ListView_MouseMove;
        listView.MouseLeave += (s, e) => { if (hoverItem != null) { var old = hoverItem; hoverItem = null; listView.Invalidate(old.Bounds); } };
        listView.ListViewItemSorter = new ListViewFileSorter(() => sortColumn, () => sortOrder);
        listView.Sorting = sortOrder;

        var ctxIconSize = 16;
        contextMenu = new ContextMenuStrip();
        contextMenu.Items.Add(L.Get("ctx.open"), ToolbarIcons.Render(ToolbarIcons.GlyphOpen, ctxIconSize, ToolbarIcons.GetGlyphColor(ToolbarIcons.GlyphOpen)), (s, e) => ListView_DoubleClick(s, e));
        contextMenu.Items.Add(new ToolStripSeparator());
        contextMenu.Items.Add(L.Get("ctx.extractTo"), ToolbarIcons.Render(ToolbarIcons.GlyphExtract, ctxIconSize, ToolbarIcons.GetGlyphColor(ToolbarIcons.GlyphExtract)), (s, e) => ExtractSelected());
        contextMenu.Items.Add(L.Get("ctx.extractHere"), ToolbarIcons.Render(ToolbarIcons.GlyphExtractAll, ctxIconSize, ToolbarIcons.GetGlyphColor(ToolbarIcons.GlyphExtractAll)), (s, e) => ExtractToCurrentLocation());
        contextMenu.Opening += (s, e) => { foreach (ToolStripItem item in contextMenu.Items) if (item is ToolStripMenuItem m) m.Enabled = listView.SelectedItems.Count > 0; };
        listView.ContextMenuStrip = contextMenu;

        smallImageList = new ImageList { ColorDepth = ColorDepth.Depth32Bit, ImageSize = new Size(20, 20) };
        largeImageList = new ImageList { ColorDepth = ColorDepth.Depth32Bit, ImageSize = new Size(48, 48) };
        listView.SmallImageList = smallImageList;
        listView.LargeImageList = largeImageList;
        iconManager = new FileIconManager(smallImageList, largeImageList, key => { if (listView.InvokeRequired) listView.Invoke(() => listView.Invalidate()); else listView.Invalidate(); });
        associationWatcher = new FileAssociationWatcher(iconManager);

        listView.DrawColumnHeader += ListViewRendering.DrawColumnHeader;
        listView.DrawItem += (s, e) => e.DrawDefault = false;
        listView.DrawSubItem += (s, e) => ListViewRendering.DrawSubItem(e, listView, smallImageList, iconManager, hoverItem);
        listView.Paint += ListViewRendering.PaintHeader;
        listView.Resize += (s, e) => { AdjustColumnWidths(); listView.Invalidate(); };

        listView.MouseWheel += ListView_MouseWheel;
        listView.GiveFeedback += (s, e) => e.UseDefaultCursors = true;
        listView.SelectedIndexChanged += (s, e) => UpdateSelectionStatus();

        this.Controls.Add(listView);
        AdjustColumnWidths();

        this.AllowDrop = true;
        this.DragEnter += MainForm_DragEnter;
        this.DragDrop += MainForm_DragDrop;
    }

    private void BuildStatusStrip()
    {
        statusStrip = new StatusStrip
        {
            BackColor = ThemeManager.ControlBack,
            SizingGrip = false,
            Font = new Font("Segoe UI", 8.5f)
        };

        statusLabelFileCount = new ToolStripStatusLabel(L.Get("status.noFiles")) { AutoSize = true, ForeColor = ThemeManager.ControlFore };
        var spring = new ToolStripStatusLabel { Spring = true };
        statusLabelSelection = new ToolStripStatusLabel(L.Get("status.noSelection")) { AutoSize = true, ForeColor = ThemeManager.ControlFore };
        statusProgressBar = new ToolStripProgressBar { Size = new Size(150, 16), Visible = false };
        statusLabelProgress = new ToolStripStatusLabel("") { AutoSize = true, Visible = false, ForeColor = ThemeManager.ControlFore };

        statusStrip.Items.AddRange(new ToolStripItem[] { statusLabelFileCount, spring, statusLabelSelection, statusProgressBar, statusLabelProgress });
        this.Controls.Add(statusStrip);
    }

    private void OpenArchiveDialog()
    {
        using var ofd = new OpenFileDialog { Filter = L.Get("dialog.filterPng") };
        if (!ofd.ShowDialog().Equals(DialogResult.OK)) return;
        LoadArchive(ofd.FileName);
    }

    private void LoadArchive(string path)
    {
        var previousArchive = currentArchive;
        var previousFiles = allFiles.ToList();
        var previousPath = currentPath;
        var previousTitle = this.Text;
        var wasEmpty = isEmptyArchive;

        if (isEmptyArchive)
            CleanupEmptyArchive();

        currentArchive = path;
        this.Text = $"Pyxelze - {Path.GetFileName(path)}";
        allFiles.Clear();
        currentPath = "";
        UpdateAddressBar();

        statusProgressBar.Visible = true;
        statusLabelProgress.Visible = true;
        statusLabelProgress.Text = L.Get("status.loading");
        Application.DoEvents();

        try
        {
            var (exit, stdout, stderr) = ProcessHelper.RunRox($"list \"{path}\"", 30000);

            if (exit == 0 && !string.IsNullOrWhiteSpace(stdout))
            {
                allFiles = ArchiveParser.Parse(stdout);
                if (allFiles.Count == 0)
                {
                    RollbackLoadArchive(previousArchive, previousFiles, previousPath, previousTitle);
                    ErrorDialog.Show(this, L.Get("dialog.invalidArchive"));
                    return;
                }
                DetectAndPromptPassphrase(path);
            }
            else if (stderr == "Timeout")
            {
                RollbackLoadArchive(previousArchive, previousFiles, previousPath, previousTitle);
                ErrorDialog.Show(this, L.Get("dialog.timeout"), title: L.Get("dialog.timeoutTitle"));
                return;
            }
            else
            {
                RollbackLoadArchive(previousArchive, previousFiles, previousPath, previousTitle);
                ErrorDialog.Show(this, L.Get("dialog.archiveReadError"), stderr);
                return;
            }
        }
        catch (Exception ex)
        {
            RollbackLoadArchive(previousArchive, previousFiles, previousPath, previousTitle);
            ErrorDialog.Show(this, L.Get("dialog.cannotLaunchRoxify"), ex.Message);
            return;
        }
        finally
        {
            statusLabelProgress.Visible = false;
            statusProgressBar.Visible = false;
        }

        RefreshView();
    }

    private void RollbackLoadArchive(string prevArchive, List<VirtualFile> prevFiles, string prevPath, string prevTitle)
    {
        currentArchive = prevArchive;
        allFiles = prevFiles;
        currentPath = prevPath;
        this.Text = prevTitle;
        UpdateAddressBar();
        if (!string.IsNullOrEmpty(prevArchive))
            RefreshView();
    }

    private void DetectAndPromptPassphrase(string archivePath)
    {
        var (exit, stdout, _) = ProcessHelper.RunRox($"havepassphrase \"{archivePath}\"", 5000);
        if (exit != 0 || !stdout.Contains("Passphrase detected")) return;

        PassphraseManager.Clear();
        string? errorMsg = null;
        while (true)
        {
            var pass = PassphraseManager.PromptForPassphrase(errorMsg);
            if (pass == null) return;

            var tempDir = TempHelper.CreateTempDir("pyxelze_verify_pass");
            try
            {
                var passArg = PassphraseManager.BuildPassphraseArg(pass);
                var (vExit, vStdout, vStderr) = ProcessHelper.RunRox($"decompress \"{archivePath}\" {passArg} \"{tempDir}\"", 15000);
                if (vExit == 0)
                {
                    PassphraseManager.Save(pass);
                    return;
                }
                if (PassphraseManager.IsDecryptionFailure(vStdout, vStderr))
                {
                    errorMsg = L.Get("dialog.wrongPassword");
                    continue;
                }
                return;
            }
            finally
            {
                TempHelper.SafeDelete(tempDir);
            }
        }
    }

    private void RefreshView()
    {
        listView.BeginUpdate();
        listView.Items.Clear();

        iconManager?.EnsureIconLoaded("C:\\DummyFolder", true);
        iconManager?.EnsureIconLoaded("file.txt", false);

        btnUp.Enabled = !string.IsNullOrEmpty(currentPath);

        if (!string.IsNullOrEmpty(currentPath))
        {
            var upItem = new ListViewItem("...") { Tag = "UP", ImageKey = "folder" };
            listView.Items.Add(upItem);
        }

        var files = allFiles
            .Where(f => Path.GetDirectoryName(f.FullPath)?.Replace("\\", "/") == currentPath)
            .OrderBy(f => f.IsFolder ? 0 : 1)
            .ThenBy(f => f.Name, StringComparer.OrdinalIgnoreCase);

        foreach (var file in files) AddItem(file);

        listView.EndUpdate();
        AdjustColumnWidths();
        UpdateFileCountStatus();
        UpdateSelectionStatus();
        UpdateAddressBar();
    }

    private void AddItem(VirtualFile file)
    {
        iconManager?.EnsureIconLoaded(file.Name, file.IsFolder);
        var iconKey = iconManager?.GetIconKey(file.Name, file.IsFolder) ?? "file";
        var item = new ListViewItem(file.Name, iconKey);
        item.SubItems.Add(file.IsFolder ? "" : SizeFormatter.Format(file.Size));
        item.SubItems.Add(file.IsFolder ? L.Get("dialog.folderType") : NativeMethods.GetFileTypeName(file.Name));
        item.Tag = file;
        listView.Items.Add(item);
    }

    private void UpdateAddressBar()
    {
        if (addressBar == null) return;
        if (isEmptyArchive)
        {
            addressBar.Text = L.Get("dialog.emptyArchive");
            return;
        }
        var archivePart = string.IsNullOrEmpty(currentArchive) ? "" : currentArchive.Replace("\\", "/");
        var virtualPart = string.IsNullOrEmpty(currentPath) ? "" : "/" + currentPath;
        addressBar.Text = archivePart + virtualPart;
    }

    private void UpdateFileCountStatus()
    {
        var currentFiles = allFiles.Where(f => Path.GetDirectoryName(f.FullPath)?.Replace("\\", "/") == currentPath).ToList();
        statusLabelFileCount.Text = L.Get("status.filesAndFolders", currentFiles.Count(f => !f.IsFolder), currentFiles.Count(f => f.IsFolder));
    }

    private void UpdateSelectionStatus() =>
        statusLabelSelection.Text = L.Get("status.selected", listView.SelectedItems.Count);

    private void AdjustColumnWidths()
    {
        if (adjustingColumns || listView.Columns.Count < 3) return;
        adjustingColumns = true;
        try
        {
            int total = Math.Max(0, listView.ClientSize.Width);
            int sizeCol = listView.Columns[1].Width;
            int typeCol = listView.Columns[2].Width;
            int nameCol = total - sizeCol - typeCol;
            if (nameCol < 100)
            {
                nameCol = 100;
                int remaining = total - nameCol;
                sizeCol = Math.Max(60, remaining * sizeCol / Math.Max(1, sizeCol + typeCol));
                typeCol = remaining - sizeCol;
            }
            listView.Columns[0].Width = nameCol;
            listView.Columns[1].Width = sizeCol;
            listView.Columns[2].Width = typeCol;
        }
        finally { adjustingColumns = false; }
    }

    private void ListView_ColumnWidthChanged(object? sender, ColumnWidthChangedEventArgs e)
    {
        if (adjustingColumns || listView.Columns.Count < 3) return;
        adjustingColumns = true;
        try
        {
            int total = Math.Max(0, listView.ClientSize.Width);
            int nameCol = listView.Columns[0].Width;
            int sizeCol = listView.Columns[1].Width;
            int typeCol = listView.Columns[2].Width;

            if (e.ColumnIndex == 0)
            {
                typeCol = total - nameCol - sizeCol;
                if (typeCol < 60) typeCol = 60;
                listView.Columns[2].Width = typeCol;
                listView.Columns[0].Width = total - sizeCol - typeCol;
            }
            else
            {
                nameCol = total - sizeCol - typeCol;
                if (nameCol < 100) nameCol = 100;
                listView.Columns[0].Width = nameCol;
            }
        }
        finally { adjustingColumns = false; }
    }

    private void NavigateUp()
    {
        if (string.IsNullOrEmpty(currentPath)) return;
        currentPath = currentPath.Contains("/")
            ? Path.GetDirectoryName(currentPath)?.Replace("\\", "/") ?? ""
            : "";
        RefreshView();
    }

    private void ListView_DoubleClick(object? sender, EventArgs e)
    {
        if (listView.SelectedItems.Count == 0) return;
        var tag = listView.SelectedItems[0].Tag;

        if (tag?.ToString() == "UP") { NavigateUp(); return; }
        if (tag is VirtualFile vf)
        {
            if (vf.IsFolder) { currentPath = vf.FullPath; RefreshView(); return; }
            OpenFileFromArchive(vf);
        }
    }

    private void OpenFileFromArchive(VirtualFile vf)
    {
        if (string.IsNullOrEmpty(currentArchive)) return;

        var tempDir = TempHelper.CreateTempDir("pyxelze_open");
        var outputPath = Path.Combine(tempDir, Path.GetFileName(vf.FullPath));

        if (!ExtractionService.ExtractFileSingle(currentArchive, vf.FullPath, outputPath))
        {
            TempHelper.SafeDelete(tempDir);
            ErrorDialog.Show(this, L.Get("dialog.extractFailed"));
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo(outputPath) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            ErrorDialog.Show(this, L.Get("dialog.openFailed"), ex.Message);
        }
    }

    private void ListView_ColumnClick(object? sender, ColumnClickEventArgs e)
    {
        if (sortColumn == e.Column)
            sortOrder = sortOrder == SortOrder.Ascending ? SortOrder.Descending : SortOrder.Ascending;
        else
        {
            sortColumn = e.Column;
            sortOrder = SortOrder.Ascending;
        }
        listView.ListViewItemSorter = new ListViewFileSorter(() => sortColumn, () => sortOrder);
        listView.Sort();
    }

    private void ListView_MouseMove(object? sender, MouseEventArgs e)
    {
        var item = listView.GetItemAt(e.X, e.Y);
        if (item == hoverItem) return;
        var oldHover = hoverItem;
        hoverItem = item;
        if (oldHover != null) listView.Invalidate(oldHover.Bounds);
        if (hoverItem != null) listView.Invalidate(hoverItem.Bounds);
    }

    private void ListView_MouseWheel(object? sender, MouseEventArgs e)
    {
        if (ModifierKeys != Keys.Control) return;
        ((HandledMouseEventArgs)e).Handled = true;
        int dir = e.Delta > 0 ? 1 : -1;
        zoomLevel = Math.Clamp(zoomLevel + dir, 0, ViewModes.Length - 1);
        var newView = ViewModes[zoomLevel];
        listView.View = newView;
        listView.OwnerDraw = newView == View.Details;
    }

    private void ListView_ItemDrag(object? sender, ItemDragEventArgs e)
    {
        Logger.LogDnd("========== DRAG START ==========");
        if (listView.SelectedItems.Count == 0) return;

        var dragSelection = listView.SelectedItems.Cast<ListViewItem>()
            .Select(i => i.Tag).OfType<VirtualFile>().ToList();
        if (dragSelection.Count == 0) return;

        var dragTempRoot = Path.Combine(Path.GetTempPath(), "pyxelze_drag_" + Guid.NewGuid());
        var dragDataObject = new LazyDataObject(currentArchive, dragSelection, allFiles.ToList(), dragTempRoot);

        try
        {
            isDraggingFromSelf = true;
            dragDataObject.SetData("Preferred DropEffect", new MemoryStream(BitConverter.GetBytes((uint)DragDropEffects.Copy)));
            DoDragDrop(dragDataObject, DragDropEffects.Copy);
        }
        finally
        {
            isDraggingFromSelf = false;
            Task.Run(() => { Thread.Sleep(15000); TempHelper.SafeDelete(dragTempRoot); });
        }
    }

    private void MainForm_DragEnter(object? sender, DragEventArgs e)
    {
        if (isDraggingFromSelf)
        {
            e.Effect = DragDropEffects.None;
            return;
        }
        if (e.Data?.GetDataPresent(DataFormats.FileDrop) == true)
            e.Effect = DragDropEffects.Copy;
    }

    private void MainForm_DragDrop(object? sender, DragEventArgs e)
    {
        if (isDraggingFromSelf) return;
        if (e.Data?.GetData(DataFormats.FileDrop) is not string[] files || files.Length == 0) return;

        if (isEmptyArchive || (!string.IsNullOrEmpty(currentArchive) && File.Exists(currentArchive)))
        {
            AddFilesToArchive(files);
            return;
        }

        var file = files[0];
        if (File.Exists(file))
            LoadArchive(file);
    }

    private void AddFilesToArchive(string[] filePaths)
    {
        var validFiles = filePaths.Where(f => File.Exists(f) || Directory.Exists(f)).ToArray();
        if (validFiles.Length == 0) return;

        if (isEmptyArchive)
        {
            var savePath = PromptSaveNewArchive();
            if (savePath == null) return;

            var buildTemp = TempHelper.CreateTempDir("pyxelze_new_archive");
            try
            {
                foreach (var src in validFiles)
                {
                    var dest = Path.Combine(buildTemp, Path.GetFileName(src));
                    if (Directory.Exists(src))
                        TempHelper.CopyDirectory(src, dest);
                    else
                        File.Copy(src, dest, true);
                }

                var pass = PassphrasePrompt.Prompt(
                    L.Get("dialog.passphraseTitle"),
                    L.Get("dialog.passphrasePrompt"));
                if (pass == null) return;

                var passArg = string.IsNullOrEmpty(pass) ? "" : $" {PassphraseManager.BuildPassphraseArg(pass)}";
                var psi = RoxRunner.CreateRoxProcess($"encode \"{buildTemp}\" \"{savePath}\"{passArg}");

                int exit = ProcessHelper.RunWithProgress(
                    L.Get("dialog.creating"),
                    L.Get("dialog.encoding"),
                    psi, out _, out var stderr);

                if (exit != 0)
                {
                    ErrorDialog.Show(this, L.Get("dialog.createFailed"), stderr);
                    return;
                }

                if (!string.IsNullOrEmpty(pass))
                    PassphraseManager.Save(pass);

                CleanupEmptyArchive();
                LoadArchive(savePath);
                MessageBox.Show(L.Get("dialog.createSuccess", validFiles.Length), L.Get("dialog.success"), MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            finally
            {
                TempHelper.SafeDelete(buildTemp);
            }
            return;
        }

        var archiveName = Path.GetFileName(currentArchive);
        var msg = L.Get("dialog.confirmAdd", validFiles.Length);

        if (MessageBox.Show(msg, L.Get("dialog.addTitle"), MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
            return;

        var extractTemp = TempHelper.CreateTempDir("pyxelze_add_extract");
        try
        {
            if (!ExtractionService.DecompressArchiveToDir(currentArchive, extractTemp))
            {
                ErrorDialog.Show(this, L.Get("dialog.decompressFailed"));
                return;
            }

            foreach (var src in validFiles)
            {
                var destName = Path.GetFileName(src);
                var dest = Path.Combine(extractTemp, destName);

                if (Directory.Exists(src))
                    TempHelper.CopyDirectory(src, dest);
                else
                    File.Copy(src, dest, true);
            }

            var cachedPass = PassphraseManager.CachedPassphrase;
            var passArg2 = string.IsNullOrEmpty(cachedPass) ? "" : $" {PassphraseManager.BuildPassphraseArg(cachedPass)}";
            var psi2 = RoxRunner.CreateRoxProcess($"encode \"{extractTemp}\" \"{currentArchive}\"{passArg2}");

            int exit2 = ProcessHelper.RunWithProgress(
                L.Get("dialog.reencoding"),
                L.Get("dialog.reencodingProgress"),
                psi2, out _, out var stderr2);

            if (exit2 != 0)
            {
                ErrorDialog.Show(this, L.Get("dialog.reencodeFailed"), stderr2);
                return;
            }

            LoadArchive(currentArchive);
            MessageBox.Show(L.Get("dialog.addSuccess", validFiles.Length), L.Get("dialog.success"), MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        finally
        {
            TempHelper.SafeDelete(extractTemp);
        }
    }

    private void CreateEmptyArchive()
    {
        isEmptyArchive = true;
        var tempDir = TempHelper.CreateTempDir("pyxelze_empty");
        var dummyFile = Path.Combine(tempDir, ".pyxelze_empty");
        File.WriteAllText(dummyFile, "");

        var tempArchive = Path.Combine(Path.GetTempPath(), $"pyxelze_empty_{Guid.NewGuid():N}.png");
        var psi = RoxRunner.CreateRoxProcess($"encode \"{tempDir}\" \"{tempArchive}\"");
        var (exit, _, _) = ProcessHelper.RunProcess(psi, 15000);

        TempHelper.SafeDelete(tempDir);

        if (exit == 0 && File.Exists(tempArchive))
        {
            emptyArchiveTempPath = tempArchive;
            currentArchive = tempArchive;
            allFiles.Clear();
            currentPath = "";
            this.Text = L.Get("dialog.title.newArchive");
            UpdateAddressBar();
            RefreshView();
        }
    }

    private void CleanupEmptyArchive()
    {
        isEmptyArchive = false;
        if (!string.IsNullOrEmpty(emptyArchiveTempPath))
        {
            TempHelper.SafeDeleteFile(emptyArchiveTempPath);
            emptyArchiveTempPath = null;
        }
    }

    private string? PromptSaveNewArchive()
    {
        using var sfd = new SaveFileDialog
        {
            Filter = L.Get("dialog.filterPngSave"),
            Title = L.Get("dialog.saveNewArchive"),
            DefaultExt = "png"
        };
        return sfd.ShowDialog() == DialogResult.OK ? sfd.FileName : null;
    }

    private void NewArchive()
    {
        if (!isEmptyArchive && !string.IsNullOrEmpty(currentArchive))
        {
            if (MessageBox.Show(L.Get("dialog.confirmNew"),
                L.Get("dialog.newArchiveTitle"), MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
                return;
        }
        CleanupEmptyArchive();
        currentArchive = "";
        allFiles.Clear();
        currentPath = "";
        this.Text = "Pyxelze";
        CreateEmptyArchive();
    }

    private void ShowArchiveInfo()
    {
        if (string.IsNullOrEmpty(currentArchive) || isEmptyArchive)
        {
            MessageBox.Show(L.Get("dialog.noArchiveOpen"), L.Get("toolbar.info"), MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        using var infoForm = new ArchiveInfoForm(currentArchive, allFiles);
        infoForm.ShowDialog(this);
    }

    private void AddFilesDialog()
    {
        using var ofd = new OpenFileDialog
        {
            Title = L.Get("dialog.addFiles"),
            Multiselect = true,
            Filter = L.Get("dialog.filterAll")
        };
        if (ofd.ShowDialog() != DialogResult.OK) return;
        AddFilesToArchive(ofd.FileNames);
    }

    private void ExtractAll()
    {
        if (string.IsNullOrEmpty(currentArchive)) return;
        using var fbd = new FolderBrowserDialog();
        if (fbd.ShowDialog() != DialogResult.OK) return;

        var destFolder = Path.Combine(fbd.SelectedPath, Path.GetFileNameWithoutExtension(currentArchive));
        bool success = ExtractionService.ExtractWithProgress(currentArchive, destFolder);
        if (success)
            MessageBox.Show(L.Get("dialog.extractSuccess", destFolder), L.Get("dialog.success"), MessageBoxButtons.OK, MessageBoxIcon.Information);
        else
            ErrorDialog.Show(this, L.Get("dialog.extractFail"));
    }

    private void AutoExtractArchive()
    {
        if (string.IsNullOrEmpty(currentArchive)) return;
        var outputDir = Path.Combine(Path.GetDirectoryName(currentArchive) ?? "", Path.GetFileNameWithoutExtension(currentArchive));
        bool success = ExtractionService.ExtractWithProgress(currentArchive, outputDir);
        if (success) { MessageBox.Show(L.Get("dialog.extractSuccess", outputDir)); this.Close(); }
    }

    private void ExtractSelected()
    {
        if (listView.SelectedItems.Count == 0) return;
        using var fbd = new FolderBrowserDialog();
        if (fbd.ShowDialog() != DialogResult.OK) return;

        var extractTemp = TempHelper.CreateTempDir("pyxelze_sel_extract");
        try
        {
            if (!ExtractionService.DecompressArchiveToDir(currentArchive, extractTemp))
            {
                ErrorDialog.Show(this, L.Get("dialog.extractFail"));
                return;
            }

            var (selSuccess, selFail) = ExtractSelectedItems(listView.SelectedItems, extractTemp, fbd.SelectedPath);

            if (selFail == 0)
                MessageBox.Show(L.Get("dialog.extractSuccess", selSuccess), L.Get("dialog.success"), MessageBoxButtons.OK, MessageBoxIcon.Information);
            else
                MessageBox.Show(L.Get("dialog.extractPartial", selSuccess, selFail), L.Get("dialog.warning"), MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
        finally
        {
            TempHelper.SafeDelete(extractTemp);
        }
    }

    private (int successCount, int failCount) ExtractSelectedItems(ListView.SelectedListViewItemCollection items, string extractTemp, string destPath)
    {
        int successCount = 0, failCount = 0;
        foreach (ListViewItem item in items)
        {
            if (item.Tag is not VirtualFile vf) continue;
            if (!vf.IsFolder)
            {
                var origPath = string.IsNullOrEmpty(vf.OriginalPath) ? vf.FullPath : vf.OriginalPath;
                var src = ExtractionService.FindExtractedFile(extractTemp, origPath);
                if (src != null)
                {
                    var dest = Path.Combine(destPath, vf.Name);
                    try { File.Copy(src, dest, true); successCount++; } catch { failCount++; }
                }
                else failCount++;
            }
            else
            {
                var destFolder = Path.Combine(destPath, vf.Name);
                Directory.CreateDirectory(destFolder);
                foreach (var f in ExtractionService.GetFilesUnder(allFiles, vf.FullPath))
                {
                    var rel = f.FullPath[(vf.FullPath.Length + 1)..];
                    var dest = Path.Combine(destFolder, rel);
                    Directory.CreateDirectory(Path.GetDirectoryName(dest) ?? destFolder);
                    var origPath = string.IsNullOrEmpty(f.OriginalPath) ? f.FullPath : f.OriginalPath;
                    var src = ExtractionService.FindExtractedFile(extractTemp, origPath);
                    if (src != null)
                    {
                        try { File.Copy(src, dest, true); successCount++; } catch { failCount++; }
                    }
                    else failCount++;
                }
            }
        }
        return (successCount, failCount);
    }

    private void ExtractToCurrentLocation()
    {
        if (listView.SelectedItems.Count == 0) return;
        var destPath = Path.GetDirectoryName(currentArchive) ?? Environment.GetFolderPath(Environment.SpecialFolder.Desktop);

        var extractTemp = TempHelper.CreateTempDir("pyxelze_loc_extract");
        try
        {
            if (!ExtractionService.DecompressArchiveToDir(currentArchive, extractTemp))
            {
                ErrorDialog.Show(this, L.Get("dialog.extractFail"));
                return;
            }

            var (selSuccess, selFail) = ExtractSelectedItems(listView.SelectedItems, extractTemp, destPath);

            if (selFail == 0)
                MessageBox.Show(L.Get("dialog.extractSuccess", selSuccess), L.Get("dialog.success"), MessageBoxButtons.OK, MessageBoxIcon.Information);
            else
                MessageBox.Show(L.Get("dialog.extractPartial", selSuccess, selFail), L.Get("dialog.warning"), MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
        finally
        {
            TempHelper.SafeDelete(extractTemp);
        }
    }

    private void RebuildUI()
    {
        this.SuspendLayout();
        var menuToRemove = this.MainMenuStrip;
        if (menuToRemove != null) this.Controls.Remove(menuToRemove);
        this.Controls.Remove(toolbar);
        this.Controls.Remove(addressBarPanel);
        this.Controls.Remove(listView);
        this.Controls.Remove(statusStrip);

        BuildMenuStrip();
        BuildToolbar();
        BuildAddressBar();
        BuildListView();
        BuildStatusStrip();

        listView.Dock = DockStyle.Fill;
        statusStrip.Dock = DockStyle.Bottom;
        addressBarPanel.Dock = DockStyle.Top;
        toolbar.Dock = DockStyle.Top;

        this.Controls.SetChildIndex(statusStrip, 0);
        this.Controls.SetChildIndex(listView, 1);
        this.Controls.SetChildIndex(addressBarPanel, 2);
        this.Controls.SetChildIndex(toolbar, 3);
        this.ResumeLayout(true);

        ThemeManager.ApplyToForm(this);
        if (!string.IsNullOrEmpty(currentArchive))
            RefreshView();
        else if (isEmptyArchive)
            UpdateAddressBar();
    }

    public string CurrentArchive => currentArchive;
    public IList<VirtualFile> AllFiles => allFiles;

    private void ShowAboutDialog()
    {
        using var aboutForm = new AboutForm();
        aboutForm.ShowDialog(this);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            CleanupEmptyArchive();
            components?.Dispose();
            associationWatcher?.Dispose();
            iconManager?.Dispose();
        }
        base.Dispose(disposing);
    }

    private void InitializeComponent()
    {
        this.components = new System.ComponentModel.Container();
        this.AutoScaleMode = AutoScaleMode.Font;
    }
}
