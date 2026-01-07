using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Win32;
using System.Drawing.Drawing2D;

namespace Pyxelze
{


    public partial class Form1 : Form
    {
        private ListView listView = null!;
        private List<VirtualFile> allFiles = new List<VirtualFile>();
        private string currentPath = "";
        private string currentArchive = "";
        private ImageList smallImageList = null!;
        private Dictionary<string, Image> iconSourceCache = new Dictionary<string, Image>(StringComparer.OrdinalIgnoreCase);
        private ContextMenuStrip contextMenu = null!;
        private StatusStrip statusStrip = null!;
        private ToolStripStatusLabel statusLabelFileCount = null!;
        private ToolStripStatusLabel statusLabelSelection = null!;
        private ToolStripProgressBar statusProgressBar = null!;
        private ToolStripStatusLabel statusLabelProgress = null!;

        private string? archiveExtractedRoot = null;

        // Logging for Drag & Drop diagnostics
        private readonly string dndLogPath = Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log");

        private void Log(string fmt, params object[] args)
        {
            try
            {
                var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] " + string.Format(fmt, args);
                File.AppendAllText(dndLogPath, line + Environment.NewLine);
            }
            catch { }
        }

        // Column width adjustment
        private bool adjustingColumns = false;

        // Sorting state
        private int sortColumn = 0;
        private SortOrder sortOrder = SortOrder.Ascending;

        private Color hoverColor => ThemeManager.ListViewRowHover;

        // Hover state
        private ListViewItem? hoverItem = null;

        public Form1(string? archivePath = null)
        {
            InitializeComponent();
            SetupInterface();
            ThemeManager.ApplyToForm(this);

            if (!string.IsNullOrEmpty(archivePath) && File.Exists(archivePath))
            {
                LoadArchive(archivePath);
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

            var toolsMenu = new ToolStripMenuItem("Outils");
            toolsMenu.DropDownItems.Add("Installer l'intégration Explorateur (Admin)", null, (s, e) => RegisterShellExtension());
            toolsMenu.DropDownItems.Add("Ouvrir log DnD", null, (s, e) =>
            {
                try
                {
                    if (File.Exists(dndLogPath)) Process.Start("notepad.exe", dndLogPath);
                    else MessageBox.Show("Aucun log trouvé : " + dndLogPath);
                }
                catch (Exception ex) { MessageBox.Show("Impossible d'ouvrir le log: " + ex.Message); }
            });
            menuStrip.Items.Add(toolsMenu);

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
            listView.ContextMenuStrip = contextMenu;


            smallImageList = new ImageList();
            smallImageList.ColorDepth = ColorDepth.Depth32Bit;
            smallImageList.ImageSize = new Size(20, 20);
            listView.SmallImageList = smallImageList;

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
                    string output = p!.StandardOutput.ReadToEnd();
                    p.WaitForExit();

                    if (p.ExitCode == 0)
                    {
                        ParseData(output);
                    }
                    else
                    {
                        MessageBox.Show("Erreur lors de la lecture de l'archive.\n" + p.StandardError.ReadToEnd());
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Impossible de lancer rox: " + ex.Message);
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

            ExtractFullArchive();

            RefreshView();
        }

        private void ParseData(string data)
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
            // Populate view after parsing
            RefreshView();
        }

        private void RefreshView()
        {
            listView.BeginUpdate();
            listView.Items.Clear();
            iconSourceCache.Clear();

            if (!smallImageList.Images.ContainsKey("folder"))
            {
                var folderSrc = IconHelper.GetSourceBitmap("C:\\DummyFolder", true, new Size(32, 32));
                iconSourceCache["folder"] = folderSrc;
                var folderIcon = IconHelper.ResizeTo(folderSrc, new Size(20, 20));
                smallImageList.Images.Add("folder", folderIcon);
            }
            if (!smallImageList.Images.ContainsKey("file"))
            {
                var fileSrc = IconHelper.GetSourceBitmap("file.txt", false, new Size(32, 32));
                iconSourceCache["file"] = fileSrc;
                var fileIcon = IconHelper.ResizeTo(fileSrc, new Size(20, 20));
                smallImageList.Images.Add("file", fileIcon);
            }

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

        private void ExtractFullArchive()
        {
            if (string.IsNullOrEmpty(currentArchive)) return;

            archiveExtractedRoot = Path.Combine(Path.GetTempPath(), "pyxelze_archive_" + Guid.NewGuid().ToString());
            Directory.CreateDirectory(archiveExtractedRoot);

            statusProgressBar.Visible = true;
            statusLabelProgress.Visible = true;
            statusProgressBar.Value = 0;
            statusProgressBar.Maximum = 100;
            statusLabelProgress.Text = "Mise en cache en cours...";
            Application.DoEvents();

            Task.Run(() =>
            {
                try
                {
                    var psi = RoxRunner.CreateRoxProcess($"decode \"{currentArchive}\" \"{archiveExtractedRoot}\"");

                    using (var p = Process.Start(psi))
                    {
                        p!.WaitForExit();

                        this.Invoke((Action)(() =>
                        {
                            if (p.ExitCode == 0)
                            {
                                statusLabelProgress.Text = "Mise en cache terminée";
                            }
                            else
                            {
                                statusLabelProgress.Text = "Erreur mise en cache";
                                Log("Mise en cache failed: {0}", p.StandardError.ReadToEnd());
                            }
                            statusProgressBar.Visible = false;
                            Task.Delay(2000).ContinueWith(_ => this.Invoke((Action)(() => statusLabelProgress.Visible = false)));
                        }));
                    }
                }
                catch (Exception ex)
                {
                    this.Invoke((Action)(() =>
                    {
                        statusLabelProgress.Text = "Erreur: " + ex.Message;
                        statusProgressBar.Visible = false;
                        Log("ExtractFullArchive exception: {0}", ex.Message);
                    }));
                }
            });
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
            string iconKey = file.IsFolder ? "folder" : Path.GetExtension(file.Name).ToLower();
            if (!smallImageList.Images.ContainsKey(iconKey))
            {
                try
                {
                    var src = IconHelper.GetSourceBitmap(file.Name, file.IsFolder, new Size(32, 32));
                    iconSourceCache[iconKey] = src;
                    smallImageList.Images.Add(iconKey, IconHelper.ResizeTo(src, smallImageList.ImageSize));
                }
                catch
                {
                    // Fallback to generic file icon if something goes wrong
                    var src = IconHelper.GetSourceBitmap("file.txt", false, new Size(32, 32));
                    iconSourceCache[iconKey] = src;
                    smallImageList.Images.Add(iconKey, IconHelper.ResizeTo(src, smallImageList.ImageSize));
                }
            }

            // Column 0: Name (Text) + Icon (ImageKey)
            var item = new ListViewItem(file.Name, iconKey);
            // SubItems start from Column 1
            if (!file.IsFolder)
            {
                item.SubItems.Add(FormatSize(file.Size));
                item.SubItems.Add(Path.GetExtension(file.Name).ToUpper() + " Fichier");
            }
            else
            {
                item.SubItems.Add("");
                item.SubItems.Add("Dossier");
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
                else if (vf != null) key = vf.IsFolder ? "folder" : Path.GetExtension(vf.Name).ToLower();

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
            if (listView.SelectedItems.Count == 0) return;
            Log("ListView_ItemDrag: {0} items selected", listView.SelectedItems.Count);

            var dragSelection = listView.SelectedItems.Cast<ListViewItem>().Select(i => i.Tag).OfType<VirtualFile>().ToList();
            if (dragSelection.Count == 0) return;

            if (string.IsNullOrEmpty(archiveExtractedRoot) || !Directory.Exists(archiveExtractedRoot))
            {
                MessageBox.Show("Archive non mise en cache. Veuillez patienter.");
                return;
            }

            var dragTempRoot = Path.Combine(Path.GetTempPath(), "pyxelze_drag_" + Guid.NewGuid().ToString());

            Log("Preparing lazy drag for {0} files", dragSelection.Count);

            var dragDataObject = new LazyDataObject(this, currentArchive, dragSelection, allFiles, dragTempRoot, archiveExtractedRoot);
            try
            {
                dragDataObject.SetData("Preferred DropEffect", new System.IO.MemoryStream(BitConverter.GetBytes((uint)DragDropEffects.Copy)));
            }
            catch { }

            Log("Calling DoDragDrop");
            try
            {
                DoDragDrop(dragDataObject, DragDropEffects.Copy);
                Log("DoDragDrop returned");
            }
            catch (Exception ex)
            {
                Log("DoDragDrop threw: {0}", ex.Message);
            }
            finally
            {
                try
                {
                    if (Directory.Exists(dragTempRoot))
                    {
                        try { Directory.Delete(dragTempRoot, true); Log("Cleaned temp folder {0}", dragTempRoot); }
                        catch (Exception ex) { Log("Failed to clean temp folder: {0}", ex.Message); }
                    }
                }
                catch { }
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
            if (string.IsNullOrEmpty(currentArchive))
            {
                try { File.WriteAllText(outputPath, "Contenu démo pour " + internalPath); return true; }
                catch { return false; }
            }

            try
            {
                Log("ExtractFileSingle start: {0} -> {1}", internalPath, outputPath);
                var psi = RoxRunner.CreateRoxProcess($"decode \"{currentArchive}\" \"{Path.GetDirectoryName(outputPath)}\" --files \"{internalPath}\"");

                using (var p = Process.Start(psi))
                {
                    string stdout = p!.StandardOutput.ReadToEnd();
                    string stderr = p.StandardError.ReadToEnd();
                    p.WaitForExit();
                    Log("ExtractFileSingle done: {0} exit={1}", internalPath, p.ExitCode);
                    return p.ExitCode == 0;
                }
            }
            catch (Exception ex)
            {
                Log("ExtractFileSingle exception for {0}: {1}", internalPath, ex.Message);
                return false;
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

                using (var key = Registry.ClassesRoot.CreateSubKey(@"*\shell\PyxelzeOpen"))
                {
                    key.SetValue("", "Ouvrir avec Pyxelze");
                    key.SetValue("Icon", exePath);

                    using (var commandKey = key.CreateSubKey("command"))
                    {
                        commandKey.SetValue("", $"\"{exePath}\" \"%1\"");
                    }
                }

                using (var dirKey = Registry.ClassesRoot.CreateSubKey(@"Directory\shell\PyxelzeExtract"))
                {
                    dirKey.SetValue("", "Extraire vers dossier");
                    dirKey.SetValue("Icon", exePath);

                    using (var commandKey = dirKey.CreateSubKey("command"))
                    {
                        commandKey.SetValue("", $"\"{exePath}\" extract \"%1\"");
                    }
                }

                using (var dirKey2 = Registry.ClassesRoot.CreateSubKey(@"Directory\shell\PyxelzeCompress"))
                {
                    dirKey2.SetValue("", "Compresser vers archive.png");
                    dirKey2.SetValue("Icon", exePath);

                    using (var commandKey = dirKey2.CreateSubKey("command"))
                    {
                        commandKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
                    }
                }

                MessageBox.Show("Intégration réussie ! Faites un clic droit sur un fichier ou dossier pour voir les options.");
            }
            catch (UnauthorizedAccessException)
            {
                MessageBox.Show("Veuillez lancer l'application en tant qu'administrateur pour effectuer cette action.");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur: " + ex.Message);
            }
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
        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (components != null) components.Dispose();
                try
                {
                    foreach (var img in iconSourceCache.Values)
                    {
                        img.Dispose();
                    }
                }
                catch { }
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
