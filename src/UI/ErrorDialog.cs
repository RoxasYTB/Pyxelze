using System.Diagnostics;

namespace Pyxelze;

internal sealed class ErrorDialog : Form
{
    private ErrorDialog(string title, string message, string? details)
    {
        Text = title;
        Size = new Size(520, details != null ? 340 : 220);
        MinimumSize = new Size(400, 200);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = false;
        MinimizeBox = false;
        ShowInTaskbar = false;
        Font = new Font("Segoe UI", 9f);
        BackColor = ThemeManager.WindowBack;
        ForeColor = ThemeManager.WindowFore;

        var iconBox = new PictureBox
        {
            Image = SystemIcons.Error.ToBitmap(),
            SizeMode = PictureBoxSizeMode.Zoom,
            Size = new Size(40, 40),
            Location = new Point(16, 16)
        };

        var lblMessage = new Label
        {
            Text = message,
            Location = new Point(68, 16),
            Size = new Size(Width - 100, details != null ? 60 : 80),
            AutoEllipsis = true
        };

        var txtDetails = details != null ? new TextBox
        {
            Text = details,
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            Location = new Point(16, 80),
            Size = new Size(Width - 52, 140),
            BackColor = ThemeManager.DarkMode ? Color.FromArgb(25, 25, 25) : Color.FromArgb(245, 245, 245),
            ForeColor = ThemeManager.WindowFore,
            BorderStyle = BorderStyle.FixedSingle,
            Font = new Font("Consolas", 8.5f),
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom
        } : null;

        var fullText = details != null ? $"{message}\n\n{details}" : message;

        var btnCopy = new Button
        {
            Text = "Copier",
            Size = new Size(90, 30),
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };
        btnCopy.Click += (s, e) =>
        {
            Clipboard.SetText(fullText);
            btnCopy.Text = "Copié ✓";
        };

        var btnLogs = new Button
        {
            Text = "Ouvrir le journal",
            Size = new Size(120, 30),
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };
        btnLogs.Click += (s, e) => OpenLogFile();

        var btnOK = new Button
        {
            Text = "OK",
            Size = new Size(80, 30),
            DialogResult = DialogResult.OK,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };

        int btnY = details != null ? 260 : 130;
        btnCopy.Location = new Point(16, btnY);
        btnLogs.Location = new Point(116, btnY);
        btnOK.Location = new Point(Width - 110, btnY);

        AcceptButton = btnOK;
        Controls.AddRange(new Control[] { iconBox, lblMessage, btnCopy, btnLogs, btnOK });
        if (txtDetails != null)
            Controls.Add(txtDetails);
    }

    public static void Show(IWin32Window? owner, string message, string? details = null, string title = "Erreur")
    {
        Logger.Log($"[ERROR] {message}" + (details != null ? $"\n{details}" : ""));
        using var dlg = new ErrorDialog(title, message, details);
        dlg.ShowDialog(owner);
    }

    private static void OpenLogFile()
    {
        try
        {
            if (File.Exists(Logger.LogPath))
                Process.Start(new ProcessStartInfo(Logger.LogPath) { UseShellExecute = true });
        }
        catch { }
    }
}
