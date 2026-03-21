using Microsoft.Win32;

namespace Pyxelze;

internal static class ThemeManager
{
    public static bool DarkMode { get; private set; }

    public static Color WindowBack => DarkMode ? Color.FromArgb(30, 30, 30) : SystemColors.Window;
    public static Color WindowFore => DarkMode ? Color.FromArgb(230, 230, 230) : SystemColors.WindowText;
    public static Color ControlBack => DarkMode ? Color.FromArgb(45, 45, 48) : SystemColors.Control;
    public static Color ControlFore => WindowFore;
    public static Color AccentColor => DarkMode ? Color.FromArgb(100, 180, 255) : Color.FromArgb(0, 120, 215);
    public static Color ListViewHeaderBack => DarkMode ? Color.FromArgb(50, 50, 50) : SystemColors.Control;
    public static Color ListViewRowHover => DarkMode ? Color.FromArgb(60, 60, 60) : Color.FromArgb(229, 243, 255);
    public static Color ListViewSelectionBack => DarkMode ? Color.FromArgb(0, 120, 215) : Color.FromArgb(212, 232, 255);
    public static Color BorderColor => DarkMode ? Color.FromArgb(70, 70, 70) : Color.FromArgb(200, 200, 200);

    public static void InitializeFromRegistry()
    {
        using var key = Registry.CurrentUser.OpenSubKey(@"Software\Pyxelze");
        if (key == null) return;
        var v = key.GetValue("DarkMode");
        if (v is int i) DarkMode = i != 0;
        else if (v is string s && int.TryParse(s, out int j)) DarkMode = j != 0;
    }

    public static void SetDarkMode(bool on)
    {
        if (DarkMode == on) return;
        DarkMode = on;
        using var key = Registry.CurrentUser.CreateSubKey(@"Software\Pyxelze");
        key.SetValue("DarkMode", on ? 1 : 0, RegistryValueKind.DWord);
        ApplyToAllOpenForms();
    }

    public static void ApplyToAllOpenForms()
    {
        foreach (Form f in Application.OpenForms)
            ApplyToForm(f);
    }

    public static void ApplyToForm(Form f)
    {
        f.BackColor = WindowBack;
        f.ForeColor = WindowFore;
        foreach (Control c in f.Controls)
            ApplyToControl(c);
        f.Invalidate(true);
    }

    private static void ApplyToControl(Control c)
    {
        switch (c)
        {
            case MenuStrip ms:
                ms.BackColor = ControlBack;
                ms.ForeColor = ControlFore;
                foreach (ToolStripItem item in ms.Items) item.ForeColor = ControlFore;
                break;
            case StatusStrip ss:
                ss.BackColor = ControlBack;
                ss.ForeColor = ControlFore;
                foreach (ToolStripItem item in ss.Items) item.ForeColor = ControlFore;
                break;
            case ToolStrip ts:
                ts.BackColor = ControlBack;
                ts.ForeColor = ControlFore;
                RefreshToolbarIcons(ts);
                break;
            case TextBox tb when tb.ReadOnly:
                tb.BackColor = DarkMode ? Color.FromArgb(30, 30, 30) : Color.White;
                tb.ForeColor = ControlFore;
                break;
            default:
                c.BackColor = ControlBack;
                c.ForeColor = ControlFore;
                break;
        }
        foreach (Control child in c.Controls)
            ApplyToControl(child);
        c.Invalidate();
    }

    private static void RefreshToolbarIcons(ToolStrip ts)
    {
        int iconSize = (int)ts.ImageScalingSize.Width;
        foreach (ToolStripItem item in ts.Items)
        {
            if (item is ToolStripButton btn && btn.Image != null && btn.Tag is string glyph)
            {
                btn.Image.Dispose();
                btn.Image = ToolbarIcons.Render(glyph, iconSize, ToolbarIcons.GetGlyphColor(glyph));
            }
        }
    }
}
