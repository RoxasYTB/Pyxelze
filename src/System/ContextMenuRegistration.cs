using System.Diagnostics;
using Microsoft.Win32;

namespace Pyxelze;

internal static class ContextMenuRegistration
{
    public static void Register()
    {
        try
        {
            RegisterDirect();
        }
        catch (UnauthorizedAccessException)
        {
            if (MessageBox.Show(
                L.Get("contextmenu.elevationRequired"),
                L.Get("contextmenu.elevationTitle"),
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question) == DialogResult.Yes)
            {
                RunElevated("register-contextmenu-ui");
            }
        }
    }

    public static void Unregister()
    {
        try
        {
            UnregisterDirect();
        }
        catch (UnauthorizedAccessException)
        {
            if (MessageBox.Show(
                L.Get("contextmenu.elevationRequired"),
                L.Get("contextmenu.elevationTitle"),
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question) == DialogResult.Yes)
            {
                RunElevated("unregister-contextmenu-ui");
            }
        }
    }

    public static void RegisterDirect()
    {
        RegisterKeys();
        MessageBox.Show(L.Get("contextmenu.registerSuccess"), L.Get("dialog.success"), MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    public static void RegisterSilent()
    {
        try { RegisterKeys(); } catch { }
    }

    public static void UnregisterDirect()
    {
        UnregisterKeys();
        MessageBox.Show(L.Get("contextmenu.unregisterSuccess"), L.Get("dialog.success"), MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    public static void UnregisterSilent()
    {
        try { UnregisterKeys(); } catch { }
    }

    private static void RegisterKeys()
    {
        var exePath = Environment.ProcessPath ?? Application.ExecutablePath;

        using (var key = Registry.ClassesRoot.CreateSubKey(@"*\shell\Pyxelze"))
        {
            key.SetValue("", "");
            key.SetValue("MUIVerb", "Pyxelze");
            key.SetValue("Icon", exePath);
            key.SetValue("SubCommands", "open;decode");
            using var shellKey = key.CreateSubKey("shell");
            using (var openKey = shellKey.CreateSubKey("open"))
            {
                openKey.SetValue("MUIVerb", L.Get("contextmenu.openArchive"));
                openKey.SetValue("Icon", exePath);
                using var cmdKey = openKey.CreateSubKey("command");
                cmdKey.SetValue("", $"\"{exePath}\" \"%1\"");
            }
            using (var decodeKey = shellKey.CreateSubKey("decode"))
            {
                decodeKey.SetValue("MUIVerb", L.Get("contextmenu.decode"));
                decodeKey.SetValue("Icon", exePath);
                using var cmdKey = decodeKey.CreateSubKey("command");
                cmdKey.SetValue("", $"\"{exePath}\" decode \"%1\"");
            }
        }

        using (var dirKey = Registry.ClassesRoot.CreateSubKey(@"Directory\shell\Pyxelze"))
        {
            dirKey.SetValue("", "");
            dirKey.SetValue("MUIVerb", "Pyxelze");
            dirKey.SetValue("Icon", exePath);
            dirKey.SetValue("SubCommands", "encode");
            using var shellKey = dirKey.CreateSubKey("shell");
            using (var encodeKey = shellKey.CreateSubKey("encode"))
            {
                encodeKey.SetValue("MUIVerb", L.Get("contextmenu.encode"));
                encodeKey.SetValue("Icon", exePath);
                using var cmdKey = encodeKey.CreateSubKey("command");
                cmdKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
            }
        }
    }

    private static void UnregisterKeys()
    {
        Registry.ClassesRoot.DeleteSubKeyTree(@"*\shell\Pyxelze", false);
        Registry.ClassesRoot.DeleteSubKeyTree(@"Directory\shell\Pyxelze", false);
    }

    public static bool IsInstalled()
    {
        try
        {
            using var k = Registry.ClassesRoot.OpenSubKey(@"*\shell\Pyxelze");
            return k != null;
        }
        catch { return false; }
    }

    private static void RunElevated(string args)
    {
        try
        {
            var psi = new ProcessStartInfo(Application.ExecutablePath, args)
            {
                UseShellExecute = true,
                Verb = "runas"
            };
            Process.Start(psi)?.WaitForExit();
        }
        catch (Exception ex)
        {
            MessageBox.Show(L.Get("contextmenu.relaunchError", ex.Message), L.Get("error.title"), MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
