using System;
using System.Drawing;
using System.Windows.Forms;

namespace Pyxelze
{
      internal static class ThemeManager
      {
            public static bool DarkMode { get; private set; } = false;

            public static Color WindowBack => DarkMode ? Color.FromArgb(30, 30, 30) : SystemColors.Window;
            public static Color WindowFore => DarkMode ? Color.FromArgb(230, 230, 230) : SystemColors.WindowText;
            public static Color ControlBack => DarkMode ? Color.FromArgb(45, 45, 48) : SystemColors.Control;
            public static Color ControlFore => WindowFore;
            public static Color ListViewHeaderBack => DarkMode ? Color.FromArgb(50, 50, 50) : SystemColors.Control;
            public static Color ListViewRowHover => DarkMode ? Color.FromArgb(60, 60, 60) : Color.FromArgb(229, 243, 255);
            public static Color ListViewSelectionBack => DarkMode ? Color.FromArgb(0, 120, 215) : Color.FromArgb(212, 232, 255);
            public static Color BorderColor => DarkMode ? Color.FromArgb(70, 70, 70) : Color.FromArgb(200, 200, 200);

            public static void InitializeFromRegistry()
            {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                  using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Pyxelze"))
                  {
                        if (key != null)
                        {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                              var v = key.GetValue("DarkMode");
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                              if (v is int i) DarkMode = i != 0;
                              else if (v is string s && int.TryParse(s, out int j)) DarkMode = j != 0;
                        }
                  }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
            }

            public static void SetDarkMode(bool on)
            {
                  if (DarkMode == on) return;
                  DarkMode = on;
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                  using (var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Pyxelze"))
                  {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        key.SetValue("DarkMode", on ? 1 : 0, Microsoft.Win32.RegistryValueKind.DWord);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                  }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                  ApplyToAllOpenForms();
            }

            public static void ApplyToAllOpenForms()
            {
                  foreach (Form f in Application.OpenForms)
                  {
                        ApplyToForm(f);
                  }
            }

            public static void ApplyToForm(Form f)
            {
                  f.BackColor = WindowBack;
                  f.ForeColor = WindowFore;
                  foreach (Control c in f.Controls)
                  {
                        ApplyToControl(c);
                  }
                  f.Invalidate(true);
            }

            private static void ApplyToControl(Control c)
            {
                  if (c is MenuStrip ms)
                  {
                        ms.BackColor = ControlBack;
                        ms.ForeColor = ControlFore;
                        foreach (ToolStripItem item in ms.Items) item.ForeColor = ControlFore;
                  }
                  else if (c is StatusStrip ss)
                  {
                        ss.BackColor = ControlBack;
                        ss.ForeColor = ControlFore;
                        foreach (ToolStripItem item in ss.Items) item.ForeColor = ControlFore;
                  }
                  else if (c is ProgressBar pb)
                  {
                        pb.BackColor = ControlBack;
                        pb.ForeColor = ControlFore;
                  }
                  else if (c is Button b)
                  {
                        b.BackColor = ControlBack;
                        b.ForeColor = ControlFore;
                  }
                  else
                  {
                        c.BackColor = ControlBack;
                        c.ForeColor = ControlFore;
                  }
                  foreach (Control child in c.Controls)
                        ApplyToControl(child);
                  c.Invalidate();
            }
      }
}