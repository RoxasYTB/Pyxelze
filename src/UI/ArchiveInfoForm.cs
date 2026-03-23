using System.Drawing.Imaging;

namespace Pyxelze;

internal class ArchiveInfoForm : Form
{
    public ArchiveInfoForm(string archivePath, IList<VirtualFile> allFiles)
    {
        var fi = new FileInfo(archivePath);
        var totalFiles = allFiles.Count(f => !f.IsFolder);
        var totalFolders = allFiles.Count(f => f.IsFolder);
        var totalSize = allFiles.Where(f => !f.IsFolder).Sum(f => f.Size);
        var hasPass = DetectPassphrase(archivePath);
        var (imgWidth, imgHeight, bitDepth, colorType) = ReadPngInfo(archivePath);

        Text = $"Infos - {fi.Name}";
        Size = new Size(520, 560);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = false;
        MinimizeBox = false;
        BackColor = ThemeManager.WindowBack;
        ForeColor = ThemeManager.WindowFore;
        Font = new Font("Segoe UI", 9f);

        var accent = ThemeManager.AccentColor;
        var dimmed = Color.FromArgb(140, ThemeManager.WindowFore);
        int left = 28;
        int y = 20;

        var iconBox = new PictureBox
        {
            Size = new Size(48, 48),
            Location = new Point(left, y),
            SizeMode = PictureBoxSizeMode.Zoom,
            Image = TryLoadAppIcon()
        };

        var lblTitle = new Label
        {
            Text = fi.Name,
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            AutoSize = true,
            Location = new Point(left + 56, y + 4),
            ForeColor = accent,
            MaximumSize = new Size(380, 0)
        };

        var lblPath = new Label
        {
            Text = fi.DirectoryName ?? "",
            AutoSize = true,
            Location = new Point(left + 56, y + 34),
            ForeColor = dimmed,
            Font = new Font("Segoe UI", 8f),
            MaximumSize = new Size(380, 0)
        };

        y = 80;
        Controls.Add(CreateSeparator(left, y));
        y += 14;

        var rows = new List<(string label, string value)>
        {
            ("Taille de l'archive", SizeFormatter.Format(fi.Length)),
            ("Taille du contenu", SizeFormatter.Format(totalSize)),
        };

        if (fi.Length > 0 && totalSize > 0)
        {
            var saved = (1.0 - (double)fi.Length / totalSize) * 100;
            rows.Add(("Compression", saved > 0 ? $"{saved:0.#}% économisé" : $"{-saved:0.#}% plus lourd"));
        }

        rows.Add(("", ""));
        rows.Add(("Fichiers", totalFiles.ToString()));
        rows.Add(("Dossiers", totalFolders.ToString()));
        rows.Add(("Chiffrement", hasPass ? "Oui (passphrase)" : "Non"));
        rows.Add(("", ""));
        rows.Add(("Résolution image", $"{imgWidth} × {imgHeight} px"));
        rows.Add(("Profondeur", $"{bitDepth} bits"));
        rows.Add(("Type couleur", colorType));

        var infoPanel = CreateInfoPanel(left, y, dimmed, rows);
        y += infoPanel.Height + 10;
        Controls.Add(CreateSeparator(left, y));
        y += 14;

        var dateRows = new List<(string label, string value)>
        {
            ("Créé le", fi.CreationTime.ToString("dd/MM/yyyy HH:mm:ss")),
            ("Modifié le", fi.LastWriteTime.ToString("dd/MM/yyyy HH:mm:ss")),
        };

        var datePanel = CreateInfoPanel(left, y, dimmed, dateRows);
        y += datePanel.Height + 10;

        var btnClose = new Button
        {
            Text = "Fermer",
            DialogResult = DialogResult.OK,
            Location = new Point(Size.Width - 120, Size.Height - 80),
            Width = 88,
            Height = 32,
            FlatStyle = FlatStyle.Flat,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore
        };

        Controls.AddRange(new Control[] { iconBox, lblTitle, lblPath, infoPanel, datePanel, btnClose });
        AcceptButton = btnClose;
    }

    private Panel CreateInfoPanel(int left, int y, Color dimmed, List<(string label, string value)> rows)
    {
        var panel = new Panel
        {
            Location = new Point(left, y),
            Size = new Size(440, 20),
            BackColor = Color.Transparent
        };

        int rowY = 0;
        foreach (var (label, value) in rows)
        {
            if (string.IsNullOrEmpty(label))
            {
                rowY += 8;
                continue;
            }

            panel.Controls.Add(new Label
            {
                Text = label,
                AutoSize = true,
                Location = new Point(0, rowY),
                ForeColor = dimmed,
                Font = new Font("Segoe UI", 8.5f)
            });
            panel.Controls.Add(new Label
            {
                Text = value,
                AutoSize = true,
                Location = new Point(200, rowY),
                ForeColor = ThemeManager.WindowFore,
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold)
            });
            rowY += 20;
        }

        panel.Height = rowY;
        return panel;
    }

    private static Label CreateSeparator(int left, int y) => new()
    {
        BorderStyle = BorderStyle.Fixed3D,
        Height = 2,
        Width = 440,
        Location = new Point(left, y)
    };

    private static Image? TryLoadAppIcon()
    {
        try
        {
            var path = Path.Combine(AppContext.BaseDirectory, "appIcon.ico");
            if (File.Exists(path))
                return new Icon(path, 48, 48).ToBitmap();
        }
        catch { }
        return null;
    }

    private static bool DetectPassphrase(string archivePath)
    {
        try
        {
            var (exit, stdout, _) = ProcessHelper.RunRox($"havepassphrase \"{archivePath}\"", 5000);
            return exit == 0 && stdout.Contains("Passphrase detected");
        }
        catch { return false; }
    }

    private static (int width, int height, int bitDepth, string colorType) ReadPngInfo(string path)
    {
        try
        {
            using var img = Image.FromFile(path);
            var w = img.Width;
            var h = img.Height;
            var pf = img.PixelFormat;

            int bits = pf switch
            {
                PixelFormat.Format1bppIndexed => 1,
                PixelFormat.Format4bppIndexed => 4,
                PixelFormat.Format8bppIndexed => 8,
                PixelFormat.Format16bppGrayScale or PixelFormat.Format16bppRgb555 or PixelFormat.Format16bppRgb565 or PixelFormat.Format16bppArgb1555 => 16,
                PixelFormat.Format24bppRgb => 24,
                PixelFormat.Format32bppRgb or PixelFormat.Format32bppArgb or PixelFormat.Format32bppPArgb => 32,
                PixelFormat.Format48bppRgb => 48,
                PixelFormat.Format64bppArgb or PixelFormat.Format64bppPArgb => 64,
                _ => 32
            };

            string ct = pf switch
            {
                PixelFormat.Format1bppIndexed or PixelFormat.Format4bppIndexed or PixelFormat.Format8bppIndexed => "Palette indexée",
                PixelFormat.Format16bppGrayScale => "Niveaux de gris",
                PixelFormat.Format32bppArgb or PixelFormat.Format32bppPArgb or PixelFormat.Format64bppArgb or PixelFormat.Format64bppPArgb or PixelFormat.Format16bppArgb1555 => "RGBA",
                _ => "RGB"
            };

            return (w, h, bits, ct);
        }
        catch
        {
            return (0, 0, 0, "Inconnu");
        }
    }
}
