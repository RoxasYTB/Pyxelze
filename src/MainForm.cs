using System.Diagnostics;
using System.Runtime.Versioning;

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

        var fileMenu = new ToolStripMenuItem("Fichier");
        fileMenu.DropDownItems.Add("Ouvrir...", null, (s, e) => OpenArchiveDialog());
        fileMenu.DropDownItems.Add(new ToolStripSeparator());
        fileMenu.DropDownItems.Add("Quitter", null, (s, e) => Close());

        var toolsMenu = new ToolStripMenuItem("Outils");
        toolsMenu.DropDownItems.Add("Intégrer au menu contextuel", null, (s, e) => ContextMenuRegistration.Register());
        toolsMenu.DropDownItems.Add("Supprimer du menu contextuel", null, (s, e) => ContextMenuRegistration.Unregister());
        toolsMenu.DropDownItems.Add(new ToolStripSeparator());
        toolsMenu.DropDownItems.Add("Vérifier les mises à jour...", null, async (s, e) =>
        {
            var (available, _) = await UpdateChecker.CheckForUpdateAsync();
            if (available)
                UpdateChecker.ShowUpdateNotification(this);
            else
                MessageBox.Show("Pyxelze est à jour.", "Mise à jour", MessageBoxButtons.OK, MessageBoxIcon.Information);
        });

        var viewMenu = new ToolStripMenuItem("Affichage");
        var darkModeItem = new ToolStripMenuItem("Mode sombre") { CheckOnClick = true, Checked = ThemeManager.DarkMode };
        darkModeItem.Click += (s, e) => ThemeManager.SetDarkMode(darkModeItem.Checked);
        viewMenu.DropDownItems.Add(darkModeItem);

        var helpMenu = new ToolStripMenuItem("Aide");
        helpMenu.DropDownItems.Add("À propos de Pyxelze", null, (s, e) => ShowAboutDialog());

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
            MakeBtn("Ouvrir", ToolbarIcons.GlyphOpen, OpenArchiveDialog),
            new ToolStripSeparator(),
            MakeBtn("Tout extraire", ToolbarIcons.GlyphExtractAll, ExtractAll),
            MakeBtn("Extraire", ToolbarIcons.GlyphExtract, ExtractSelected),
            new ToolStripSeparator(),
            MakeBtn("Remonter", ToolbarIcons.GlyphUp, NavigateUp)
        });

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

        listView.Columns.Add("Nom", 500);
        listView.Columns.Add("Taille", 120, HorizontalAlignment.Right);
        listView.Columns.Add("Type", 200);

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
        contextMenu.Items.Add("Ouvrir", ToolbarIcons.Render(ToolbarIcons.GlyphOpen, ctxIconSize, ToolbarIcons.GetGlyphColor(ToolbarIcons.GlyphOpen)), (s, e) => ListView_DoubleClick(s, e));
        contextMenu.Items.Add(new ToolStripSeparator());
        contextMenu.Items.Add("Extraire vers...", ToolbarIcons.Render(ToolbarIcons.GlyphExtract, ctxIconSize, ToolbarIcons.GetGlyphColor(ToolbarIcons.GlyphExtract)), (s, e) => ExtractSelected());
        contextMenu.Items.Add("Extraire ici", ToolbarIcons.Render(ToolbarIcons.GlyphExtractAll, ctxIconSize, ToolbarIcons.GetGlyphColor(ToolbarIcons.GlyphExtractAll)), (s, e) => ExtractToCurrentLocation());
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
        this.DragEnter += (s, e) =>
        {
            if (e.Data?.GetDataPresent(DataFormats.FileDrop) == true)
                e.Effect = DragDropEffects.Copy;
        };
        this.DragDrop += (s, e) =>
        {
            if (e.Data?.GetData(DataFormats.FileDrop) is string[] files && files.Length > 0)
            {
                var file = files[0];
                if (File.Exists(file))
                    LoadArchive(file);
            }
        };
    }

    private void BuildStatusStrip()
    {
        statusStrip = new StatusStrip
        {
            BackColor = ThemeManager.ControlBack,
            SizingGrip = false,
            Font = new Font("Segoe UI", 8.5f)
        };

        statusLabelFileCount = new ToolStripStatusLabel("0 fichiers, 0 dossiers") { AutoSize = true, ForeColor = ThemeManager.ControlFore };
        var spring = new ToolStripStatusLabel { Spring = true };
        statusLabelSelection = new ToolStripStatusLabel("0 sélectionné(s)") { AutoSize = true, ForeColor = ThemeManager.ControlFore };
        statusProgressBar = new ToolStripProgressBar { Size = new Size(150, 16), Visible = false };
        statusLabelProgress = new ToolStripStatusLabel("") { AutoSize = true, Visible = false, ForeColor = ThemeManager.ControlFore };

        statusStrip.Items.AddRange(new ToolStripItem[] { statusLabelFileCount, spring, statusLabelSelection, statusProgressBar, statusLabelProgress });
        this.Controls.Add(statusStrip);
    }

    private void OpenArchiveDialog()
    {
        using var ofd = new OpenFileDialog { Filter = "Fichiers PNG Rox (*.png)|*.png|Tous les fichiers (*.*)|*.*" };
        if (!ofd.ShowDialog().Equals(DialogResult.OK)) return;
        LoadArchive(ofd.FileName);
    }

    private void LoadArchive(string path)
    {
        currentArchive = path;
        this.Text = $"Pyxelze - {Path.GetFileName(path)}";
        allFiles.Clear();
        currentPath = "";
        UpdateAddressBar();

        statusProgressBar.Visible = true;
        statusLabelProgress.Visible = true;
        statusLabelProgress.Text = "Chargement...";
        Application.DoEvents();

        try
        {
            var (exit, stdout, stderr) = ProcessHelper.RunRox($"list \"{path}\"", 30000);

            if (exit == 0 && !string.IsNullOrWhiteSpace(stdout))
            {
                allFiles = ArchiveParser.Parse(stdout);

            }
            else if (stderr == "Timeout")
            {
                MessageBox.Show("Le chargement de l'archive a expiré (timeout).", "Timeout", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            else
            {
                MessageBox.Show("Erreur lors de la lecture de l'archive.\n" + stderr, "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show("Impossible de lancer roxify: " + ex.Message, "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        finally
        {
            statusLabelProgress.Visible = false;
            statusProgressBar.Visible = false;
        }

        RefreshView();
    }

    private void RefreshView()
    {
        listView.BeginUpdate();
        listView.Items.Clear();

        iconManager?.EnsureIconLoaded("C:\\DummyFolder", true);
        iconManager?.EnsureIconLoaded("file.txt", false);

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
        item.SubItems.Add(file.IsFolder ? "Dossier de fichiers" : NativeMethods.GetFileTypeName(file.Name));
        item.Tag = file;
        listView.Items.Add(item);
    }

    private void UpdateAddressBar()
    {
        if (addressBar == null) return;
        var archivePart = string.IsNullOrEmpty(currentArchive) ? "" : currentArchive.Replace("\\", "/");
        var virtualPart = string.IsNullOrEmpty(currentPath) ? "" : "/" + currentPath;
        addressBar.Text = archivePart + virtualPart;
    }

    private void UpdateFileCountStatus()
    {
        var currentFiles = allFiles.Where(f => Path.GetDirectoryName(f.FullPath)?.Replace("\\", "/") == currentPath).ToList();
        statusLabelFileCount.Text = $"{currentFiles.Count(f => !f.IsFolder)} fichier(s), {currentFiles.Count(f => f.IsFolder)} dossier(s)";
    }

    private void UpdateSelectionStatus() =>
        statusLabelSelection.Text = $"{listView.SelectedItems.Count} sélectionné(s)";

    private void AdjustColumnWidths()
    {
        if (adjustingColumns || listView.Columns.Count < 3) return;
        adjustingColumns = true;
        try
        {
            int total = Math.Max(0, listView.ClientSize.Width);
            int sizeCol = Math.Max(80, (int)(total * 0.14));
            int typeCol = Math.Max(100, (int)(total * 0.22));
            int nameCol = total - sizeCol - typeCol;
            listView.Columns[0].Width = nameCol;
            listView.Columns[1].Width = sizeCol;
            listView.Columns[2].Width = typeCol;
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
        if (tag is VirtualFile vf && vf.IsFolder) { currentPath = vf.FullPath; RefreshView(); }
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
            dragDataObject.SetData("Preferred DropEffect", new MemoryStream(BitConverter.GetBytes((uint)DragDropEffects.Copy)));
            var result = DoDragDrop(dragDataObject, DragDropEffects.Copy);
            try { if (dragDataObject is LazyDataObject ldo) ldo.FinalizeAfterDropAsync(result).GetAwaiter().GetResult(); } catch { }
        }
        finally
        {
            Task.Run(() => { Thread.Sleep(15000); TempHelper.SafeDelete(dragTempRoot); });
        }
    }

    private void ExtractAll()
    {
        if (string.IsNullOrEmpty(currentArchive)) return;
        using var fbd = new FolderBrowserDialog();
        if (fbd.ShowDialog() != DialogResult.OK) return;

        var destFolder = Path.Combine(fbd.SelectedPath, Path.GetFileNameWithoutExtension(currentArchive));
        bool success = ExtractionService.ExtractWithProgress(currentArchive, destFolder);
        if (success)
            MessageBox.Show($"Extraction réussie vers :\n{destFolder}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    private void AutoExtractArchive()
    {
        if (string.IsNullOrEmpty(currentArchive)) return;
        var outputDir = Path.Combine(Path.GetDirectoryName(currentArchive) ?? "", Path.GetFileNameWithoutExtension(currentArchive));
        bool success = ExtractionService.ExtractWithProgress(currentArchive, outputDir);
        if (success) { MessageBox.Show($"Extraction réussie vers :\n{outputDir}"); this.Close(); }
    }

    private void ExtractSelected()
    {
        if (listView.SelectedItems.Count == 0) return;
        using var fbd = new FolderBrowserDialog();
        if (fbd.ShowDialog() != DialogResult.OK) return;

        foreach (ListViewItem item in listView.SelectedItems)
        {
            if (item.Tag is not VirtualFile vf) continue;
            if (!vf.IsFolder)
            {
                var origPath = string.IsNullOrEmpty(vf.OriginalPath) ? vf.FullPath : vf.OriginalPath;
                ExtractionService.ExtractFileSingle(currentArchive, origPath, Path.Combine(fbd.SelectedPath, vf.Name));
            }
            else
            {
                var destFolder = Path.Combine(fbd.SelectedPath, vf.Name);
                Directory.CreateDirectory(destFolder);
                foreach (var f in ExtractionService.GetFilesUnder(allFiles, vf.FullPath))
                {
                    var rel = f.FullPath[(vf.FullPath.Length + 1)..];
                    var dest = Path.Combine(destFolder, rel);
                    Directory.CreateDirectory(Path.GetDirectoryName(dest) ?? destFolder);
                    var origPath = string.IsNullOrEmpty(f.OriginalPath) ? f.FullPath : f.OriginalPath;
                    ExtractionService.ExtractFileSingle(currentArchive, origPath, dest);
                }
            }
        }
        MessageBox.Show("Extraction termin\u00e9e !");
    }

    private void ExtractToCurrentLocation()
    {
        if (listView.SelectedItems.Count == 0) return;
        var destPath = Path.GetDirectoryName(currentArchive) ?? Environment.GetFolderPath(Environment.SpecialFolder.Desktop);

        foreach (ListViewItem item in listView.SelectedItems)
        {
            if (item.Tag is not VirtualFile vf) continue;
            if (!vf.IsFolder)
            {
                var origPath = string.IsNullOrEmpty(vf.OriginalPath) ? vf.FullPath : vf.OriginalPath;
                ExtractionService.ExtractFileSingle(currentArchive, origPath, Path.Combine(destPath, vf.Name));
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
                    ExtractionService.ExtractFileSingle(currentArchive, origPath, dest);
                }
            }
        }
        MessageBox.Show("Extraction termin\u00e9e !");
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
