using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Win32;
using System.Drawing.Drawing2D;
using System.Text.Json;

namespace Pyxelze
{


    public partial class Form1 : Form
    {
        private ListView listView = null!;
        private List<VirtualFile> allFiles = new List<VirtualFile>();
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

        // Column width adjustment
        private bool adjustingColumns = false;

        // Sorting state
        private int sortColumn = 0;
        private SortOrder sortOrder = SortOrder.Ascending;

        private Color hoverColor => ThemeManager.ListViewRowHover;

        // Hover state
        private ListViewItem? hoverItem = null;
        private bool autoExtractMode = false;

        public Form1(string? archivePath = null, bool autoExtract = false)
        {
            InitializeComponent();
            SetupInterface();
            ThemeManager.ApplyToForm(this);
            autoExtractMode = autoExtract;

            if (!string.IsNullOrEmpty(archivePath) && File.Exists(archivePath))
            {
                LoadArchive(archivePath);
                if (autoExtractMode)
                {
                    this.Shown += (s, e) => AutoExtractArchive();
                }
            }
        }

        private void SetupInterface()
        {
            this.Text = "Pyxelze";
            this.Size = new Size(900, 600);
            ThemeManager.InitializeFromRegistry();
            this.BackColor = ThemeManager.WindowBack;
            this.ForeColor = ThemeManager.WindowFore;

            // Menu Strip
            var menuStrip = new MenuStrip();
            menuStrip.BackColor = ThemeManager.ControlBack;
            menuStrip.ForeColor = ThemeManager.ControlFore;

            var fileMenu = new ToolStripMenuItem("Fichier");
            fileMenu.DropDownItems.Add("Ouvrir...", null, (s, e) => OpenArchiveDialog());
            fileMenu.DropDownItems.Add("Quitter", null, (s, e) => Close());
            menuStrip.Items.Add(fileMenu);

            var viewMenu = new ToolStripMenuItem("Affichage");
            var darkModeItem = new ToolStripMenuItem("Mode sombre") { CheckOnClick = true, Checked = ThemeManager.DarkMode };
            darkModeItem.Click += (s, e) => { ThemeManager.SetDarkMode(darkModeItem.Checked); };
            viewMenu.DropDownItems.Add(darkModeItem);
            menuStrip.Items.Add(viewMenu);

            this.MainMenuStrip = menuStrip;
            this.Controls.Add(menuStrip);

            // Application icon
            try
            {
                var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appIcon.ico");
                if (File.Exists(iconPath)) this.Icon = new Icon(iconPath);
            }
            catch { }

            // ListView
            listView = new ExtendedListView();
            listView.Parent = this;
            listView.Dock = DockStyle.Fill;
            listView.View = View.Details;
            listView.FullRowSelect = true;
            listView.GridLines = false;
            listView.BackColor = ThemeManager.WindowBack;
            listView.ForeColor = ThemeManager.WindowFore;
            listView.OwnerDraw = true;
            listView.HideSelection = false;
            listView.AllowColumnReorder = false;
            typeof(Control).GetProperty("DoubleBuffered", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.SetValue(listView, true, null); // Fix flickering

            // listView.Columns.Add("", 24); // Removed icon column
            listView.Columns.Add("Nom", 424);
            listView.Columns.Add("Taille", 100, HorizontalAlignment.Right);
            listView.Columns.Add("Type", 150);

            listView.ColumnWidthChanging += ListView_ColumnWidthChanging;
            listView.ColumnReordered += ListView_ColumnReordered;

            listView.DoubleClick += ListView_DoubleClick;
            listView.ItemDrag += ListView_ItemDrag;
            listView.ColumnClick += ListView_ColumnClick;
            listView.MouseMove += ListView_MouseMove;
            listView.MouseLeave += ListView_MouseLeave;

            // Tri personnalisé: dossiers toujours au-dessus, tri par nom croissant par défaut
            listView.ListViewItemSorter = new ListViewFileSorter(() => sortColumn, () => sortOrder);
            listView.Sorting = sortOrder;

            contextMenu = new ContextMenuStrip();
            contextMenu.Items.Add("Ouvrir", null, (s, e) => ListView_DoubleClick(s, e));
            contextMenu.Items.Add(new ToolStripSeparator());
            contextMenu.Items.Add("Extraire vers...", null, (s, e) => ExtractSelected());
            contextMenu.Items.Add("Extraire ici", null, (s, e) => ExtractToCurrentLocation());
            contextMenu.Opening += ContextMenu_Opening;
            listView.ContextMenuStrip = contextMenu;


            smallImageList = new ImageList();
            smallImageList.ColorDepth = ColorDepth.Depth32Bit;
            smallImageList.ImageSize = new Size(20, 20);
            listView.SmallImageList = smallImageList;

            iconManager = new FileIconManager(smallImageList, OnIconChanged);
            associationWatcher = new FileAssociationWatcher(iconManager);

            listView.DrawColumnHeader += ListView_DrawColumnHeader;
            listView.DrawItem += ListView_DrawItem;
            listView.DrawSubItem += ListView_DrawSubItem;
            listView.Paint += ListView_Paint;
            listView.Resize += (s, e) => { AdjustColumnWidths(); listView.Invalidate(); };
            listView.ColumnReordered += (s, e) => { if (!adjustingColumns) { AdjustColumnWidths(); listView.Invalidate(); } };

            // Ajout du ListView après le MenuStrip pour le Docking
            this.Controls.Add(listView);
            listView.BringToFront();
            AdjustColumnWidths();

            listView.GiveFeedback += ListView_GiveFeedback;
            listView.SelectedIndexChanged += (s, e) => UpdateSelectionStatus();

            statusStrip = new StatusStrip();
            statusStrip.BackColor = ThemeManager.ControlBack;
            statusStrip.SizingGrip = false;

            statusLabelFileCount = new ToolStripStatusLabel();
            statusLabelFileCount.Text = "0 fichiers, 0 dossiers";
            statusLabelFileCount.AutoSize = true;
            statusLabelFileCount.ForeColor = ThemeManager.ControlFore;
            statusStrip.Items.Add(statusLabelFileCount);

            var spring = new ToolStripStatusLabel();
            spring.Spring = true;
            statusStrip.Items.Add(spring);

            statusLabelSelection = new ToolStripStatusLabel();
            statusLabelSelection.Text = "0 sélectionné(s)";
            statusLabelSelection.AutoSize = true;
            statusLabelSelection.ForeColor = ThemeManager.ControlFore;
            statusStrip.Items.Add(statusLabelSelection);

            statusProgressBar = new ToolStripProgressBar();
            statusProgressBar.Size = new Size(150, 16);
            statusProgressBar.Visible = false;
            statusStrip.Items.Add(statusProgressBar);

            statusLabelProgress = new ToolStripStatusLabel();
            statusLabelProgress.Text = "";
            statusLabelProgress.AutoSize = true;
            statusLabelProgress.Visible = false;
            statusLabelProgress.ForeColor = ThemeManager.ControlFore;
            statusStrip.Items.Add(statusLabelProgress);

            this.Controls.Add(statusStrip);
        }

        private void OpenArchiveDialog()
        {
            using (var ofd = new OpenFileDialog())
            {
                ofd.Filter = "Fichiers PNG Rox (*.png)|*.png|Tous les fichiers (*.*)|*.*";
                if (ofd.ShowDialog() == DialogResult.OK)
                {
                    LoadArchive(ofd.FileName);
                }
            }
        }

        private void LoadArchive(string path)
        {
            currentArchive = path;
            this.Text = $"Pyxelze - {Path.GetFileName(path)}";
            allFiles.Clear();
            currentPath = "";

            statusProgressBar.Visible = true;
            statusLabelProgress.Visible = true;
            statusLabelProgress.Text = "Chargement...";
            Application.DoEvents();

            try
            {
                var psi = RoxRunner.CreateRoxProcess($"list \"{path}\"");

                using (var p = Process.Start(psi))
                {
                    // Read output/error asynchronously and wait with timeout to avoid UI hang
                    var outTask = Task.Run(() => p!.StandardOutput.ReadToEnd());
                    var errTask = Task.Run(() => p.StandardError.ReadToEnd());

                    const int timeoutMs = 10000; // 10 seconds
                    bool exited = p.WaitForExit(timeoutMs);
                    if (!exited)
                    {
                        try { p.Kill(); } catch { }
                        MessageBox.Show($"Erreur: la commande rox a expiré après {timeoutMs / 1000}s. La commande peut être bloquée ou le binaire est incompatible.", "Erreur rox", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }

                    // ensure tasks completed
                    Task.WaitAll(new[] { outTask, errTask }, 1000);
                    var output = outTask.Result ?? string.Empty;
                    var stderr = errTask.Result ?? string.Empty;

                    if (p.ExitCode == 0)
                    {
                        ParseData(output);
                    }
                    else
                    {
                        // try to show rox.err.txt if present next to the binary
                        string extra = string.Empty;
                        try
                        {
                            var roxDir = RoxRunner.GetRoxDirectory();
                            if (!string.IsNullOrEmpty(roxDir))
                            {
                                var log = Path.Combine(roxDir, "rox.err.txt");
                                if (File.Exists(log)) extra = "\nLogs:\n" + File.ReadAllText(log);
                            }
                        }
                        catch { }

                        MessageBox.Show("Erreur lors de la lecture de l'archive.\n" + stderr + extra, "Erreur rox", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Impossible de lancer rox: " + ex.Message, "Erreur rox", MessageBoxButtons.OK, MessageBoxIcon.Error);
                ParseData(@"
test_oom_data/file_0.bin (10485760 bytes)
test_oom_data/file_1.png (1024 bytes)
images/vacances.jpg (5000 bytes)
readme.txt (100 bytes)
");
            }
            finally
            {
                statusLabelProgress.Visible = false;
                statusProgressBar.Visible = false;
            }

            RefreshView();
        }

        private void ParseData(string data)
        {
            if (string.IsNullOrWhiteSpace(data)) return;

            data = data.Trim();
            if (data.StartsWith("[") && data.EndsWith("]"))
            {
                try
                {
                    var files = JsonSerializer.Deserialize<List<JsonElement>>(data);
                    if (files != null)
                    {
                        foreach (var file in files)
                        {
                            string name = file.GetProperty("name").GetString() ?? "";
                            long size = file.GetProperty("size").GetInt64();

                            allFiles.Add(new VirtualFile
                            {
                                FullPath = name,
                                Name = Path.GetFileName(name),
                                Size = size,
                                IsFolder = false
                            });

                            string? dir = Path.GetDirectoryName(name)?.Replace("\\", "/");
                            while (!string.IsNullOrEmpty(dir))
                            {
                                if (!allFiles.Any(f => f.FullPath == dir))
                                {
                                    allFiles.Add(new VirtualFile { FullPath = dir, Name = Path.GetFileName(dir) ?? "", IsFolder = true });
                                }
                                dir = Path.GetDirectoryName(dir)?.Replace("\\", "/");
                            }
                        }
                    }
                }
                catch
                {
                }
            }
            else
            {
                var lines = data.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                var regex = new Regex(@"(.*)\s\((\d+)\sbytes\)$");

                foreach (var line in lines)
                {
                    var trimmed = line.Trim();
                    if (trimmed.StartsWith("Files in")) continue;

                    var match = regex.Match(trimmed);
                    if (match.Success)
                    {
                        string fullPath = match.Groups[1].Value.Trim().Replace("\\", "/");
                        allFiles.Add(new VirtualFile
                        {
                            FullPath = fullPath,
                            Name = Path.GetFileName(fullPath),
                            Size = long.Parse(match.Groups[2].Value),
                            IsFolder = false
                        });

                        string? dir = Path.GetDirectoryName(fullPath)?.Replace("\\", "/");
                        while (!string.IsNullOrEmpty(dir))
                        {
                            if (!allFiles.Any(f => f.FullPath == dir))
                            {
                                allFiles.Add(new VirtualFile { FullPath = dir, Name = Path.GetFileName(dir) ?? "", IsFolder = true });
                            }
                            dir = Path.GetDirectoryName(dir)?.Replace("\\", "/");
                        }
                    }
                }
            }
            RefreshView();
        }

        private void OnIconChanged(string iconKey)
        {
            if (listView.InvokeRequired)
            {
                listView.Invoke(() => OnIconChanged(iconKey));
                return;
            }

            listView.Invalidate();
        }

        private void RefreshView()
        {
            listView.BeginUpdate();
            listView.Items.Clear();

            iconManager?.EnsureIconLoaded("C:\\DummyFolder", true);
            iconManager?.EnsureIconLoaded("file.txt", false);

            if (!string.IsNullOrEmpty(currentPath))
            {
                var upItem = new ListViewItem("...");
                upItem.Tag = "UP";
                upItem.ImageKey = "folder";
                listView.Items.Add(upItem);
            }
            var files = allFiles.Where(f => Path.GetDirectoryName(f.FullPath)?.Replace("\\", "/") == currentPath).OrderBy(f => f.IsFolder ? 0 : 1).ThenBy(f => f.Name, StringComparer.OrdinalIgnoreCase);
            foreach (var file in files)
            {
                AddItem(file);
            }

            listView.EndUpdate();
            AdjustColumnWidths();
            UpdateFileCountStatus();
            UpdateSelectionStatus();
        }



        private void UpdateFileCountStatus()
        {
            var currentFiles = allFiles.Where(f => Path.GetDirectoryName(f.FullPath)?.Replace("\\", "/") == currentPath).ToList();
            var fileCount = currentFiles.Count(f => !f.IsFolder);
            var folderCount = currentFiles.Count(f => f.IsFolder);
            statusLabelFileCount.Text = $"{fileCount} fichier(s), {folderCount} dossier(s)";
        }

        private void UpdateSelectionStatus()
        {
            statusLabelSelection.Text = $"{listView.SelectedItems.Count} sélectionné(s)";
        }

        private void AddItem(VirtualFile file)
        {
            iconManager?.EnsureIconLoaded(file.Name, file.IsFolder);
            string iconKey = iconManager?.GetIconKey(file.Name, file.IsFolder) ?? "file";

            // Column 0: Name (Text) + Icon (ImageKey)
            var item = new ListViewItem(file.Name, iconKey);
            // SubItems start from Column 1
            if (!file.IsFolder)
            {
                item.SubItems.Add(FormatSize(file.Size));
                item.SubItems.Add(NativeMethods.GetFileTypeName(file.Name));
            }
            else
            {
                item.SubItems.Add("");
                item.SubItems.Add("Dossier de fichiers");
            }
            item.Tag = file;
            listView.Items.Add(item);
        }

        private void ListView_MouseMove(object? sender, MouseEventArgs e)
        {
            var item = listView.GetItemAt(e.X, e.Y);
            if (item != hoverItem)
            {
                var oldHover = hoverItem;
                hoverItem = item;

                // Only invalidate changed items to reduce flickering
                if (oldHover != null) listView.Invalidate(oldHover.Bounds);
                if (hoverItem != null) listView.Invalidate(hoverItem.Bounds);
            }
        }

        private void ListView_MouseLeave(object? sender, EventArgs e)
        {
            if (hoverItem != null)
            {
                var oldHover = hoverItem;
                hoverItem = null;
                if (oldHover != null) listView.Invalidate(oldHover.Bounds);
            }
        }

        private void ListView_ColumnReordered(object? sender, ColumnReorderedEventArgs e)
        {
            if (e.OldDisplayIndex == 0 || e.NewDisplayIndex == 0)
            {
                e.Cancel = true;
            }
        }

        private void ListView_ColumnClick(object? sender, ColumnClickEventArgs e)
        {
            if (sortColumn == e.Column)
            {
                sortOrder = sortOrder == SortOrder.Ascending ? SortOrder.Descending : SortOrder.Ascending;
            }
            else
            {
                sortColumn = e.Column;
                sortOrder = SortOrder.Ascending;
            }

            listView.ListViewItemSorter = new ListViewFileSorter(() => sortColumn, () => sortOrder);
            listView.Sort();
        }

        private void ListView_ColumnWidthChanging(object? sender, ColumnWidthChangingEventArgs e)
        {
            if (adjustingColumns) return;
            e.Cancel = true;
            e.NewWidth = listView.Columns[e.ColumnIndex].Width;
        }

        private void ListView_GiveFeedback(object? sender, GiveFeedbackEventArgs e)
        {
            e.UseDefaultCursors = true;
        }

        private void AdjustColumnWidths()
        {
            if (adjustingColumns) return;
            if (listView.Columns.Count == 0) return;
            int total = Math.Max(0, listView.ClientSize.Width);
            int count = listView.Columns.Count;
            if (count == 0) return;

            adjustingColumns = true;
            try
            {
                int colWidth = total / count;
                for (int i = 0; i < count - 1; i++)
                {
                    listView.Columns[i].Width = colWidth;
                }
                listView.Columns[count - 1].Width = total - (colWidth * (count - 1));
            }
            finally
            {
                adjustingColumns = false;
            }
        }

        private void ListView_DrawColumnHeader(object? sender, DrawListViewColumnHeaderEventArgs e)
        {
            Color back = ThemeManager.ListViewHeaderBack;
            Color fore = ThemeManager.ControlFore;

            using (var b = new SolidBrush(back)) e.Graphics.FillRectangle(b, e.Bounds);
            TextFormatFlags flags = TextFormatFlags.VerticalCenter | TextFormatFlags.Left;
            TextRenderer.DrawText(e.Graphics, e.Header!.Text, e.Font!, e.Bounds, fore, flags);
        }

        private void ListView_Paint(object? sender, PaintEventArgs e)
        {
            // Ensure header background is fully painted (covers area to right of last column)
            int textH = TextRenderer.MeasureText("Ag", listView.Font).Height;
            int headerHeight = textH + 12;
            var rect = new Rectangle(0, 0, listView.ClientSize.Width, headerHeight + 2);
            Color back = ThemeManager.ListViewHeaderBack;
            using (var b = new SolidBrush(back)) e.Graphics.FillRectangle(b, rect);
        }

        private void ListView_DrawItem(object? sender, DrawListViewItemEventArgs e)
        {
            e.DrawDefault = false;
        }

        private void ListView_DrawSubItem(object? sender, DrawListViewSubItemEventArgs e)
        {
            var item = e.Item!;
            var vf = item.Tag as VirtualFile;
            Rectangle bounds = e.Bounds;

            bool selected = item.Selected;
            bool hovered = (item == hoverItem);

            Color back = listView.BackColor;
            Color fore = listView.ForeColor;

            if (selected)
            {
                back = ThemeManager.ListViewSelectionBack;
                fore = ThemeManager.WindowFore;
            }
            else if (hovered)
            {
                back = hoverColor;
            }

            using (var b = new SolidBrush(back)) e.Graphics.FillRectangle(b, bounds);

            if (e.ColumnIndex == 0)
            {
                Image? img = null;
                string key = "folder";
                if (item.Tag?.ToString() == "UP") key = "folder";
                else if (vf != null) key = iconManager?.GetIconKey(vf.Name, vf.IsFolder) ?? "file";

                if (smallImageList.Images.ContainsKey(key)) img = smallImageList.Images[key];
                else if (smallImageList.Images.ContainsKey("file")) img = smallImageList.Images["file"];
                else if (smallImageList.Images.Count > 0) img = smallImageList.Images[0];

                int iconWidth = smallImageList.ImageSize.Width;
                if (img != null)
                {
                    int iconLeft = bounds.Left + 2;
                    int iconTop = bounds.Top + (bounds.Height - smallImageList.ImageSize.Height) / 2;
                    e.Graphics.DrawImage(img, new Rectangle(iconLeft, iconTop, iconWidth, smallImageList.ImageSize.Height));
                }

                // Draw Text
                Rectangle textRect = new Rectangle(bounds.Left + iconWidth + 4, bounds.Top, bounds.Width - iconWidth - 4, bounds.Height);
                TextFormatFlags flags = TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.EndEllipsis;
                TextRenderer.DrawText(e.Graphics, item.Text, listView.Font, textRect, fore, flags);
            }
            else
            {
                TextFormatFlags flags = TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.EndEllipsis;
                if (e.Header!.TextAlign == HorizontalAlignment.Right) flags |= TextFormatFlags.Right;
                if (e.Header.TextAlign == HorizontalAlignment.Center) flags |= TextFormatFlags.HorizontalCenter;

                Rectangle textRect = new Rectangle(bounds.Left + 4, bounds.Top, bounds.Width - 8, bounds.Height);
                TextRenderer.DrawText(e.Graphics, e.SubItem!.Text, listView.Font, textRect, fore, flags);
            }
        }


        private void ListView_DoubleClick(object? sender, EventArgs e)
        {
            if (listView.SelectedItems.Count == 0) return;
            var tag = listView.SelectedItems[0].Tag;

            if (tag?.ToString() == "UP")
            {
                if (currentPath.Contains("/"))
                    currentPath = Path.GetDirectoryName(currentPath)?.Replace("\\", "/") ?? "";
                else
                    currentPath = "";

                RefreshView();
            }
            else if (tag is VirtualFile vf && vf.IsFolder)
            {
                currentPath = vf.FullPath;
                RefreshView();
            }
        }

        private void ListView_ItemDrag(object? sender, ItemDragEventArgs e)
        {
            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"\n\n[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ========== DRAG START ==========\n"); } catch { }

            if (listView.SelectedItems.Count == 0) return;

            var dragSelection = listView.SelectedItems.Cast<ListViewItem>().Select(i => i.Tag).OfType<VirtualFile>().ToList();
            if (dragSelection.Count == 0) return;

            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Selected {dragSelection.Count} items\n"); } catch { }

            var dragTempRoot = Path.Combine(Path.GetTempPath(), "pyxelze_drag_" + Guid.NewGuid().ToString());
            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Temp root: {dragTempRoot}\n"); } catch { }

            var dragDataObject = new LazyDataObject(this, currentArchive, dragSelection, allFiles, dragTempRoot);
            try
            {
                dragDataObject.SetData("Preferred DropEffect", new System.IO.MemoryStream(BitConverter.GetBytes((uint)DragDropEffects.Copy)));
            }
            catch { }

            DragDropEffects result = DragDropEffects.None;
            try
            {
                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Calling DoDragDrop()...\n"); } catch { }
                result = DoDragDrop(dragDataObject, DragDropEffects.Copy);
                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] DoDragDrop returned: {result}\n"); } catch { }
            }
            catch (Exception ex)
            {
                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] DoDragDrop failed: {ex}\n"); } catch { }
            }
            finally
            {
                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] DoDragDrop complete, scheduling cleanup\n"); } catch { }

                // Finalize extraction UI or cancel if no drop
                try
                {
                    if (dragDataObject is LazyDataObject ldo)
                    {
                        try { ldo.FinalizeAfterDropAsync(result).GetAwaiter().GetResult(); } catch { }
                    }
                }
                catch (Exception ex) { try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] FinalizeAfterDropAsync failed: {ex}\n"); } catch { } }

                // Delay cleanup: some targets may still be accessing the temp files after DoDragDrop returns.
                Task.Run(() =>
                {
                    try
                    {
                        Thread.Sleep(15000); // wait 15s to allow recipient to finish copying
                        if (Directory.Exists(dragTempRoot))
                        {
                            try { Directory.Delete(dragTempRoot, true); }
                            catch (Exception ex) { try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Delayed cleanup failed: {ex}\n"); } catch { } }
                        }
                    }
                    catch (Exception ex) { try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Delayed cleanup worker failed: {ex}\n"); } catch { } }
                });
            }
        }

        private void AutoExtractArchive()
        {
            if (string.IsNullOrEmpty(currentArchive)) return;

            string outputDir = Path.Combine(Path.GetDirectoryName(currentArchive) ?? "", Path.GetFileNameWithoutExtension(currentArchive));
            ExtractAllToFolder(outputDir);
        }

        private void ExtractAllToFolder(string destFolder)
        {
            if (string.IsNullOrEmpty(currentArchive))
            {
                MessageBox.Show("Aucune archive ouverte.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            try
            {
                Directory.CreateDirectory(destFolder);

                var filePaths = RoxRunner.GetFileList(currentArchive);
                if (filePaths == null || filePaths.Count == 0)
                {
                    // Try robust temporary extraction fallback (copy rox exe to temp and extract there, then move files)
                    var tempDir = Path.Combine(Path.GetTempPath(), "pyxelze-decompress-" + Guid.NewGuid().ToString("N"));
                    Directory.CreateDirectory(tempDir);
                    var roxPath = RoxRunner.GetRoxPath() ?? string.Empty;
                    ProcessStartInfo psi2;
                    if (!string.IsNullOrEmpty(roxPath))
                    {
                        try
                        {
                            var tempExe = Path.Combine(Path.GetTempPath(), "roxify_exec_" + Guid.NewGuid().ToString("N") + ".exe");
                            File.Copy(roxPath, tempExe, true);
                            try { File.SetAttributes(tempExe, FileAttributes.Normal); } catch { }
                            try { File.Delete(tempExe + ":Zone.Identifier"); } catch { }
                            psi2 = new ProcessStartInfo
                            {
                                FileName = tempExe,
                                Arguments = $"decompress \"{currentArchive}\" \"{tempDir}\"",
                                UseShellExecute = false,
                                CreateNoWindow = true,
                                RedirectStandardOutput = true,
                                RedirectStandardError = true,
                                WorkingDirectory = tempDir
                            };
                            try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }
                        }
                        catch
                        {
                            psi2 = RoxRunner.CreateRoxProcess($"decompress \"{currentArchive}\" \"{tempDir}\"");
                            psi2.WorkingDirectory = tempDir;
                            try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }
                        }
                    }
                    else
                    {
                        psi2 = RoxRunner.CreateRoxProcess($"decompress \"{currentArchive}\" \"{tempDir}\"");
                        psi2.WorkingDirectory = tempDir;
                        try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }
                    }

                    string stdout2, stderr2;
                    using (var f2 = new ProcessProgressForm("Extraction (contournement)", $"Extraction vers un répertoire temporaire pour contourner un problème de permission..."))
                    {
                        int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                        if (exit2 == 0)
                        {
                            // move contents from tempDir into destFolder
                            foreach (var entry in Directory.EnumerateFileSystemEntries(tempDir))
                            {
                                var name = Path.GetFileName(entry);
                                var dest = Path.Combine(destFolder, name);
                                if (Directory.Exists(entry))
                                {
                                    if (Directory.Exists(dest)) Directory.Delete(dest, true);
                                    Program.CopyDirectory(entry, dest);
                                }
                                else if (File.Exists(entry))
                                {
                                    if (File.Exists(dest)) File.Delete(dest);
                                    File.Copy(entry, dest, true);
                                }
                            }
                            try { Directory.Delete(tempDir, true); } catch { }
                            MessageBox.Show($"Extraction réussie vers :\n{destFolder}\n\nRemarque: extraction effectuée via un répertoire temporaire.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                            if (autoExtractMode) this.Close();
                            return;
                        }
                        else
                        {
                            try { Directory.Delete(tempDir, true); } catch { }
                            MessageBox.Show("Aucun fichier trouvé dans l'archive.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                            return;
                        }
                    }
                }

                var filesArg = string.Join(",", filePaths.Select(f => $"\"{f}\""));
                var psi = RoxRunner.CreateRoxProcess($"decompress \"{currentArchive}\" --files {filesArg} \"{destFolder}\"");

                string stdout, stderr;
                using (var f = new ProcessProgressForm("Extraction en cours", $"Extraction de {Path.GetFileName(currentArchive)}..."))
                {
                    int exit = f.RunProcess(psi, out stdout, out stderr);
                    if (exit == 0)
                    {
                        bool hasEntries = false;
                        if (Directory.Exists(destFolder))
                        {
                            var enumerator = Directory.EnumerateFileSystemEntries(destFolder).GetEnumerator();
                            hasEntries = enumerator.MoveNext();
                        }

                        if (hasEntries)
                        {
                            MessageBox.Show($"Extraction réussie vers :\n{destFolder}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                            if (autoExtractMode) this.Close();
                        }
                        else
                        {
                            MessageBox.Show($"Erreur lors de l'extraction : aucun fichier créé.\n\nErreur : {stderr}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        }
                    }
                    else if (f.Cancelled)
                    {
                        MessageBox.Show("Opération annulée.", "Annulé", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show($"Erreur lors de l'extraction.\n\nCode de sortie : {exit}\nErreur : {stderr}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erreur lors de l'extraction : {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ExtractSelected()
        {
            if (listView.SelectedItems.Count == 0) return;

            using (var fbd = new FolderBrowserDialog())
            {
                if (fbd.ShowDialog() == DialogResult.OK)
                {
                    foreach (ListViewItem item in listView.SelectedItems)
                    {
                        if (item.Tag is VirtualFile vf)
                        {
                            if (!vf.IsFolder)
                            {
                                string dest = Path.Combine(fbd.SelectedPath, vf.Name);
                                ExtractFile(vf.FullPath, dest);
                            }
                            else
                            {
                                string destFolder = Path.Combine(fbd.SelectedPath, vf.Name);
                                Directory.CreateDirectory(destFolder);
                                var filesToExtract = allFiles.Where(f => !f.IsFolder && f.FullPath.StartsWith(vf.FullPath + "/")).ToList();
                                foreach (var f in filesToExtract)
                                {
                                    string rel = f.FullPath.Substring(vf.FullPath.Length).TrimStart('/');
                                    string dest = Path.Combine(destFolder, rel);
                                    Directory.CreateDirectory(Path.GetDirectoryName(dest) ?? destFolder);
                                    ExtractFile(f.FullPath, dest);
                                }
                            }
                        }
                    }
                    MessageBox.Show("Extraction terminée !");
                }
            }
        }

        private void ExtractToCurrentLocation()
        {
            if (listView.SelectedItems.Count == 0) return;

            string destPath = Path.GetDirectoryName(currentArchive) ?? Environment.GetFolderPath(Environment.SpecialFolder.Desktop);

            foreach (ListViewItem item in listView.SelectedItems)
            {
                if (item.Tag is VirtualFile vf)
                {
                    if (!vf.IsFolder)
                    {
                        string dest = Path.Combine(destPath, vf.Name);
                        ExtractFile(vf.FullPath, dest);
                    }
                    else
                    {
                        string destFolder = Path.Combine(destPath, vf.Name);
                        Directory.CreateDirectory(destFolder);
                        var filesToExtract = allFiles.Where(f => !f.IsFolder && f.FullPath.StartsWith(vf.FullPath + "/")).ToList();
                        foreach (var f in filesToExtract)
                        {
                            string rel = f.FullPath.Substring(vf.FullPath.Length).TrimStart('/');
                            string dest = Path.Combine(destFolder, rel);
                            Directory.CreateDirectory(Path.GetDirectoryName(dest) ?? destFolder);
                            ExtractFile(f.FullPath, dest);
                        }
                    }
                }
            }
            MessageBox.Show("Extraction terminée !");
        }

        public bool ExtractFileSingle(string internalPath, string outputPath)
        {
            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractFileSingle: {internalPath} -> {outputPath}\n"); } catch { }

            if (string.IsNullOrEmpty(currentArchive))
            {
                try { File.WriteAllText(outputPath, "Contenu démo pour " + internalPath); return true; }
                catch { return false; }
            }

            try
            {
                // Use native decompress with --files to extract only the requested file
                var tempOut = Path.Combine(Path.GetTempPath(), "pyxelze_extract_" + Guid.NewGuid().ToString("N"));
                try
                {
                    Directory.CreateDirectory(tempOut);
                    var safeInternal = internalPath.Replace('\\', '/');
                    var psi = RoxRunner.CreateRoxProcess($"decompress \"{currentArchive}\" \"{tempOut}\" --files \"{safeInternal}\"");
                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Running: {psi.FileName} {psi.Arguments}\n"); } catch { }
                    using (var p = Process.Start(psi))
                    {
                        var stdout = p!.StandardOutput.ReadToEnd();
                        var stderr = p.StandardError.ReadToEnd();
                        p.WaitForExit();
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Exit={p.ExitCode}, stdout={stdout.Length} bytes, stderr={stderr.Length} bytes\n"); } catch { }
                        if (p.ExitCode != 0)
                        {
                            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Decompress failed:\nStdout:\n{stdout}\nStderr:\n{stderr}\n"); } catch { }
                            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_cache_errors.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Decompress failed: exit={p.ExitCode}\nStdout:\n{stdout}\nStderr:\n{stderr}\n"); } catch { }
                            return false;
                        }
                    }

                    var sourceRel = internalPath.Replace('/', Path.DirectorySeparatorChar);
                    var sourceFull = Path.Combine(tempOut, sourceRel);
                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Looking for: {sourceFull}, exists={File.Exists(sourceFull)}\n"); } catch { }
                    if (!File.Exists(sourceFull))
                    {
                        // try to find by name fallback
                        var nm = Path.GetFileName(internalPath);
                        var matches = Directory.GetFiles(tempOut, nm, SearchOption.AllDirectories);
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Fallback search for '{nm}': {matches.Length} matches\n"); } catch { }
                        if (matches.Length == 0) return false;
                        sourceFull = matches[0];
                    }

                    Directory.CreateDirectory(Path.GetDirectoryName(outputPath) ?? Path.GetTempPath());
                    File.Copy(sourceFull, outputPath, true);
                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] File copied successfully\n"); } catch { }
                    return true;
                }
                catch (Exception ex)
                {
                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractFileSingle exception: {ex}\n"); } catch { }
                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_cache_errors.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractFileSingle exception: {ex}\n"); } catch { }
                    return false;
                }
                finally
                {
                    try { Directory.Delete(tempOut, true); } catch { }
                }
            }
            catch
            {
                return false;
            }

        }

        public List<VirtualFile> GetFilesUnder(string folderInternalPath)
        {
            if (string.IsNullOrEmpty(folderInternalPath)) return new List<VirtualFile>();
            return allFiles.Where(f => !f.IsFolder && f.FullPath.StartsWith(folderInternalPath + "/")).ToList();
        }

        public int ExtractMultipleFiles(IList<string> internalPaths, string tempOut)
        {
            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractMultipleFiles: {internalPaths.Count} files -> {tempOut}\n"); } catch { }

            if (string.IsNullOrEmpty(currentArchive))
            {
                int created = 0;
                try
                {
                    Directory.CreateDirectory(tempOut);
                    foreach (var p in internalPaths)
                    {
                        var rel = p.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                        var outPath = Path.Combine(tempOut, rel);
                        try { Directory.CreateDirectory(Path.GetDirectoryName(outPath) ?? tempOut); } catch { }
                        try { File.WriteAllText(outPath, "Contenu démo pour " + p); created++; } catch { }
                    }
                }
                catch { }
                return created;
            }

            try
            {
                Directory.CreateDirectory(tempOut);
                var safeList = internalPaths.Select(s => s.Replace('\\', '/').Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList();
                var filesArg = string.Join(",", safeList);
                var psi = RoxRunner.CreateRoxProcess($"decompress \"{currentArchive}\" \"{tempOut}\" --files \"{filesArg}\"");
                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Running ExtractMultipleFiles: {psi.FileName} {psi.Arguments}\n"); } catch { }
                using (var p = Process.Start(psi))
                {
                    var stdout = p!.StandardOutput.ReadToEnd();
                    var stderr = p.StandardError.ReadToEnd();
                    p.WaitForExit();

                    // Truncate logs to avoid unbounded growth
                    int limit = 20000;
                    string truncStdout = stdout.Length > limit ? stdout.Substring(0, limit) + "\n...(truncated)..." : stdout;
                    string truncStderr = stderr.Length > limit ? stderr.Substring(0, limit) + "\n...(truncated)..." : stderr;

                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractMultipleFiles exit={p.ExitCode}, stdout_len={stdout.Length}, stderr_len={stderr.Length}\nStdout:\n{truncStdout}\nStderr:\n{truncStderr}\n"); } catch { }

                    if (p.ExitCode != 0)
                    {
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_cache_errors.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractMultipleFiles failed: exit={p.ExitCode}\nCommand: {psi.FileName} {psi.Arguments}\nStdout:\n{truncStdout}\nStderr:\n{truncStderr}\n"); } catch { }
                        return 0;
                    }
                }

                int found = 0;
                foreach (var pth in internalPaths)
                {
                    var sourceRel = pth.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                    var sourceFull = Path.Combine(tempOut, sourceRel);
                    if (!File.Exists(sourceFull))
                    {
                        var nm = Path.GetFileName(pth);
                        var matches = Directory.GetFiles(tempOut, nm, SearchOption.AllDirectories);
                        if (matches.Length == 0) continue;
                        sourceFull = matches[0];
                    }
                    if (File.Exists(sourceFull)) found++;
                }
                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractMultipleFiles found {found}/{internalPaths.Count}\n"); } catch { }
                return found;
            }
            catch (Exception ex)
            {
                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractMultipleFiles exception: {ex}\n"); } catch { }
                return 0;
            }
        }

        private bool ExtractFile(string internalPath, string outputPath)
        {
            return ExtractFileSingle(internalPath, outputPath);
        }

        private void RegisterShellExtension()
        {
            try
            {
                string exePath = Application.ExecutablePath;

                // Try to create keys directly
                try
                {
                    using (var key = Registry.ClassesRoot.CreateSubKey(@"*\\shell\\Pyxelze"))
                    {
                        key.SetValue("", "");
                        key.SetValue("MUIVerb", "Pyxelze");
                        key.SetValue("Icon", exePath);
                        key.SetValue("SubCommands", "open;decompress");
                        using (var shellKey = key.CreateSubKey(@"shell"))
                        {
                            using (var openKey = shellKey.CreateSubKey("open"))
                            {
                                openKey.SetValue("MUIVerb", "Ouvrir l'archive");
                                openKey.SetValue("Icon", exePath);
                                using (var cmdKey = openKey.CreateSubKey("command"))
                                {
                                    cmdKey.SetValue("", $"\"{exePath}\" \"%1\"");
                                }
                            }
                            using (var decodeKey = shellKey.CreateSubKey("decompress"))
                            {
                                decodeKey.SetValue("MUIVerb", "Décoder l'archive ROX");
                                decodeKey.SetValue("Icon", exePath);
                                using (var cmdKey = decodeKey.CreateSubKey("command"))
                                {
                                    var roxPath = Path.Combine(Path.GetDirectoryName(exePath) ?? string.Empty, "roxify", "roxify_native.exe");
                                    if (File.Exists(roxPath))
                                    {
                                        cmdKey.SetValue("", $"\"{exePath}\" decompress \"%1\"");
                                    }
                                    else
                                    {
                                        cmdKey.SetValue("", $"\"{exePath}\" extract \"%1\"");
                                    }
                                }
                            }
                        }
                    }

                    using (var dirKey = Registry.ClassesRoot.CreateSubKey(@"Directory\\shell\\Pyxelze"))
                    {
                        dirKey.SetValue("", "");
                        dirKey.SetValue("MUIVerb", "Pyxelze");
                        dirKey.SetValue("Icon", exePath);
                        dirKey.SetValue("SubCommands", "encode");
                        using (var shellKey = dirKey.CreateSubKey(@"shell"))
                        {
                            using (var encodeKey = shellKey.CreateSubKey("encode"))
                            {
                                encodeKey.SetValue("MUIVerb", "Encoder en archive ROX");
                                encodeKey.SetValue("Icon", exePath);
                                using (var cmdKey = encodeKey.CreateSubKey("command"))
                                {
                                    var roxPath = Path.Combine(Path.GetDirectoryName(exePath) ?? string.Empty, "roxify", "roxify_native.exe");
                                    if (File.Exists(roxPath))
                                    {
                                        cmdKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
                                    }
                                    else
                                    {
                                        cmdKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
                                    }
                                }
                            }
                        }
                    }

                    MessageBox.Show("Intégration réussie ! Faites un clic droit sur un fichier ou dossier pour voir les options.");
                    return;
                }
                catch (UnauthorizedAccessException)
                {
                    var res = MessageBox.Show("L'installation du menu contextuel nécessite des droits administrateur. Voulez-vous relancer l'application avec élévation pour installer l'intégration ?", "Élévation requise", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                    if (res == DialogResult.Yes)
                    {
                        try
                        {
                            var psi = new ProcessStartInfo(Application.ExecutablePath, "register-contextmenu") { UseShellExecute = true, Verb = "runas" };
                            var proc = Process.Start(psi);
                            proc?.WaitForExit();
                        }
                        catch (Exception ex) { MessageBox.Show("Impossible de relancer en mode administrateur: " + ex.Message); }
                    }
                }

                MessageBox.Show("Impossible d'installer l'intégration.");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur: " + ex.Message);
            }
        }

        private void UnregisterShellExtension()
        {
            try
            {
                // Try direct deletion
                try
                {
                    Registry.ClassesRoot.DeleteSubKeyTree(@"*\\shell\\Pyxelze", false);
                    Registry.ClassesRoot.DeleteSubKeyTree(@"Directory\\shell\\Pyxelze", false);
                    MessageBox.Show("Intégration supprimée.");
                    return;
                }
                catch (UnauthorizedAccessException)
                {
                    var res = MessageBox.Show("La suppression nécessite des droits administrateur. Voulez-vous relancer l'application avec élévation pour supprimer l'intégration ?", "Élévation requise", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                    if (res == DialogResult.Yes)
                    {
                        try
                        {
                            var psi = new ProcessStartInfo(Application.ExecutablePath, "unregister-contextmenu") { UseShellExecute = true, Verb = "runas" };
                            var proc = Process.Start(psi);
                            proc?.WaitForExit();
                        }
                        catch (Exception ex) { MessageBox.Show("Impossible de relancer en mode administrateur: " + ex.Message); }
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur: " + ex.Message);
            }
        }

        private bool IsContextMenuInstalled()
        {
            try
            {
                using (var k1 = Registry.ClassesRoot.OpenSubKey(@"*\\shell\\Pyxelze")) if (k1 != null) return true;
                using (var k2 = Registry.ClassesRoot.OpenSubKey(@"Directory\\shell\\Pyxelze")) if (k2 != null) return true;
            }
            catch { }
            return false;
        }

        private string FormatSize(long bytes)
        {
            if (bytes < 1024) return $"{bytes} o";
            double len = bytes;
            string[] units = { "o", "Ko", "Mo", "Go", "To" };
            int order = 0;
            while (len >= 1024 && order < units.Length - 1) { order++; len = len / 1024; }
            return string.Format("{0:0.##} {1}", len, units[order]);
        }


        private System.ComponentModel.IContainer? components = null;

        private void ContextMenu_Opening(object? sender, System.ComponentModel.CancelEventArgs e)
        {
            bool hasSelection = listView.SelectedItems.Count > 0;
            foreach (ToolStripItem item in contextMenu.Items)
            {
                if (item is ToolStripMenuItem menuItem)
                {
                    menuItem.Enabled = hasSelection;
                }
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (components != null) components.Dispose();
                associationWatcher?.Dispose();
                iconManager?.Dispose();
            }
            base.Dispose(disposing);
        }
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
        }
    }
}
