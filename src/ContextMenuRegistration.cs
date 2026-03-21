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
                "Droits administrateur requis. Relancer avec élévation ?",
                "Élévation requise",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question) == DialogResult.Yes)
            {
                RunElevated("register-contextmenu");
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
                "Droits administrateur requis. Relancer avec élévation ?",
                "Élévation requise",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question) == DialogResult.Yes)
            {
                RunElevated("unregister-contextmenu");
            }
        }
    }

    public static void RegisterDirect()
    {
        var exePath = Application.ExecutablePath;

        using (var key = Registry.ClassesRoot.CreateSubKey(@"*\shell\Pyxelze"))
        {
            key.SetValue("", "");
            key.SetValue("MUIVerb", "Pyxelze");
            key.SetValue("Icon", exePath);
            key.SetValue("SubCommands", "open;decode");
            using var shellKey = key.CreateSubKey("shell");
            using (var openKey = shellKey.CreateSubKey("open"))
            {
                openKey.SetValue("MUIVerb", "Ouvrir l'archive");
                openKey.SetValue("Icon", exePath);
                using var cmdKey = openKey.CreateSubKey("command");
                cmdKey.SetValue("", $"\"{exePath}\" \"%1\"");
            }
            using (var decodeKey = shellKey.CreateSubKey("decode"))
            {
                decodeKey.SetValue("MUIVerb", "Décoder");
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
                encodeKey.SetValue("MUIVerb", "Encoder");
                encodeKey.SetValue("Icon", exePath);
                using var cmdKey = encodeKey.CreateSubKey("command");
                cmdKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
            }
        }

        MessageBox.Show("Intégration au menu contextuel installée.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    public static void UnregisterDirect()
    {
        Registry.ClassesRoot.DeleteSubKeyTree(@"*\shell\Pyxelze", false);
        Registry.ClassesRoot.DeleteSubKeyTree(@"Directory\shell\Pyxelze", false);
        MessageBox.Show("Intégration supprimée.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
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
            MessageBox.Show($"Impossible de relancer en mode administrateur: {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
