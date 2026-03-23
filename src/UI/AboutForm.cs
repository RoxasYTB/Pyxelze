using System.Diagnostics;

namespace Pyxelze;

internal class AboutForm : Form
{
    private static string AppVersion => AppConstants.Version;
    private const string RepoUrl = "https://github.com/RoxasYTB/Pyxelze";

    public AboutForm()
    {
        Text = "À propos de Pyxelze";
        Size = new Size(480, 490);
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
            Text = "Pyxelze",
            Font = new Font("Segoe UI", 24, FontStyle.Bold),
            AutoSize = true,
            Location = new Point(left + 56, y),
            ForeColor = accent
        };

        var lblVersion = new Label
        {
            Text = $"v{AppVersion}",
            Font = new Font("Segoe UI", 11, FontStyle.Regular),
            AutoSize = true,
            Location = new Point(left + 56, y + 42),
            ForeColor = dimmed
        };

        y = 84;
        var lblDesc = new Label
        {
            Text = "Explorateur et archiveur de fichiers ROX - stéganographie PNG\navec compression transparente via le moteur roxify.",
            Font = new Font("Segoe UI", 9.5f),
            Size = new Size(410, 40),
            Location = new Point(left, y),
            ForeColor = ThemeManager.WindowFore
        };

        y = 130;
        Controls.Add(CreateSeparator(left, y));

        y += 14;
        var infoPanel = CreateInfoPanel(left, y, dimmed);
        y += infoPanel.Height + 10;

        Controls.Add(CreateSeparator(left, y));
        y += 14;

        var lblAuthor = new Label
        {
            Text = "Développé par",
            AutoSize = true,
            Location = new Point(left, y),
            ForeColor = dimmed
        };

        var lblAuthorName = new Label
        {
            Text = "Yohan SANNIER",
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            AutoSize = true,
            Location = new Point(left, y + 18),
            ForeColor = ThemeManager.WindowFore
        };

        y += 48;
        var lnkGithub = new LinkLabel
        {
            Text = RepoUrl,
            AutoSize = true,
            Location = new Point(left, y),
            LinkColor = accent,
            ActiveLinkColor = accent,
            VisitedLinkColor = accent
        };
        lnkGithub.Click += (_, _) =>
        {
            try { Process.Start(new ProcessStartInfo(RepoUrl) { UseShellExecute = true }); } catch { }
        };

        y += 28;
        var lblCopyright = new Label
        {
            Text = $"© 2025-{DateTime.Now.Year} Yohan SANNIER. Tous droits réservés.",
            AutoSize = true,
            Location = new Point(left, y),
            ForeColor = dimmed
        };

        y += 30;
        Controls.Add(CreateSeparator(left, y));
        y += 12;

        var lblLicense = new Label
        {
            Text = "Distribué sous licence MIT",
            AutoSize = true,
            Location = new Point(left, y),
            ForeColor = dimmed,
            Font = new Font("Segoe UI", 8.5f)
        };

        var btnClose = new Button
        {
            Text = "Fermer",
            DialogResult = DialogResult.OK,
            Location = new Point(Size.Width - 120, Size.Height - 90),
            Width = 88,
            Height = 32,
            FlatStyle = FlatStyle.Flat,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore
        };

        Controls.AddRange(new Control[]
        {
            iconBox, lblTitle, lblVersion, lblDesc,
            infoPanel, lblAuthor, lblAuthorName,
            lnkGithub, lblCopyright, lblLicense, btnClose
        });
        AcceptButton = btnClose;
    }

    private Panel CreateInfoPanel(int left, int y, Color dimmed)
    {
        var panel = new Panel
        {
            Location = new Point(left, y),
            Size = new Size(410, 80),
            BackColor = Color.Transparent
        };

        var roxVersion = GetRoxVersion();
        string[][] rows =
        [
            ["Version de l'application", AppVersion],
            ["Build", Program.BuildStamp],
            ["Moteur roxify", roxVersion],
            [".NET Runtime", $"{Environment.Version}"]
        ];

        int rowY = 0;
        foreach (var row in rows)
        {
            panel.Controls.Add(new Label
            {
                Text = row[0],
                AutoSize = true,
                Location = new Point(0, rowY),
                ForeColor = dimmed,
                Font = new Font("Segoe UI", 8.5f)
            });
            panel.Controls.Add(new Label
            {
                Text = row[1],
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

    private Label CreateSeparator(int left, int y)
    {
        return new Label
        {
            BorderStyle = BorderStyle.Fixed3D,
            Height = 2,
            Width = 410,
            Location = new Point(left, y)
        };
    }

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

    private static string GetRoxVersion()
    {
        try
        {
            var (exit, stdout, _) = ProcessHelper.RunRox("--version", 5000);
            return exit == 0 && !string.IsNullOrWhiteSpace(stdout) ? stdout.Trim() : "non disponible";
        }
        catch { return "non disponible"; }
    }
}
