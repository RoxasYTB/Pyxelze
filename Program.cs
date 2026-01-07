namespace Pyxelze
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.SetHighDpiMode(HighDpiMode.SystemAware);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Handle non-interactive registry operations (run elevated)
            if (args.Length >= 1)
            {
                var cmd = args[0].ToLower();
                if (cmd == "register-contextmenu")
                {
                    RegisterContextMenu();
                    return;
                }
                else if (cmd == "unregister-contextmenu")
                {
                    UnregisterContextMenu();
                    return;
                }
            }

            if (args.Length >= 2)
            {
                string command = args[0].ToLower();
                string target = args[1];

                if (command == "extract")
                {
                    ExtractDirectory(target);
                    return;
                }
                else if (command == "compress")
                {
                    CompressDirectory(target);
                    return;
                }
            }

            string? fileToOpen = args.Length > 0 ? args[0] : null;
            Application.Run(new Form1(fileToOpen));
        }

        // These methods are executed when the app is relaunched with elevation
        // as e.g. `Pyxelze.exe register-contextmenu`
        static void RegisterContextMenu()
        {
            try
            {
                string exePath = Application.ExecutablePath;

                using (var key = Microsoft.Win32.Registry.ClassesRoot.CreateSubKey(@"*\\shell\\PyxelzeOpen"))
                {
                    key.SetValue("", "Ouvrir avec Pyxelze");
                    key.SetValue("Icon", exePath);
                    using (var commandKey = key.CreateSubKey("command"))
                    {
                        commandKey.SetValue("", $"\\"{exePath}\\" \\\"%1\\\"");
                    }
                }

                using (var dirKey = Microsoft.Win32.Registry.ClassesRoot.CreateSubKey(@"Directory\\shell\\PyxelzeExtract"))
                {
                    dirKey.SetValue("", "Extraire vers dossier");
                    dirKey.SetValue("Icon", exePath);
                    using (var commandKey = dirKey.CreateSubKey("command"))
                    {
                        commandKey.SetValue("", $"\\"{exePath}\\" extract \\\"%1\\\"");
                    }
                }

                using (var dirKey2 = Microsoft.Win32.Registry.ClassesRoot.CreateSubKey(@"Directory\\shell\\PyxelzeCompress"))
                {
                    dirKey2.SetValue("", "Compresser vers archive.png");
                    dirKey2.SetValue("Icon", exePath);
                    using (var commandKey = dirKey2.CreateSubKey("command"))
                    {
                        commandKey.SetValue("", $"\\"{exePath}\\" compress \\\"%1\\\"");
                    }
                }

                MessageBox.Show("Intégration au menu contextuel installée avec succès.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur lors de l'installation du menu contextuel: " + ex.Message, "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void UnregisterContextMenu()
        {
            try
            {
                Microsoft.Win32.Registry.ClassesRoot.DeleteSubKeyTree(@"*\\shell\\PyxelzeOpen", false);
                Microsoft.Win32.Registry.ClassesRoot.DeleteSubKeyTree(@"Directory\\shell\\PyxelzeExtract", false);
                Microsoft.Win32.Registry.ClassesRoot.DeleteSubKeyTree(@"Directory\\shell\\PyxelzeCompress", false);

                MessageBox.Show("Intégration au menu contextuel supprimée.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur lors de la suppression de l'intégration: " + ex.Message, "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void ExtractDirectory(string archivePath)
        {
            if (!File.Exists(archivePath))
            {
                MessageBox.Show($"Le fichier {archivePath} n'existe pas.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string outputDir = Path.Combine(Path.GetDirectoryName(archivePath) ?? "", Path.GetFileNameWithoutExtension(archivePath));
            Directory.CreateDirectory(outputDir);

            try
            {
                var psi = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" \"{outputDir}\"");
                using (var p = System.Diagnostics.Process.Start(psi))
                {
                    p!.WaitForExit();
                    if (p.ExitCode == 0)
                    {
                        MessageBox.Show($"Extraction réussie vers :\n{outputDir}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show($"Erreur lors de l'extraction.\n{p.StandardError.ReadToEnd()}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Impossible d'extraire : {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void CompressDirectory(string dirPath)
        {
            if (!Directory.Exists(dirPath))
            {
                MessageBox.Show($"Le dossier {dirPath} n'existe pas.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string outputFile = Path.Combine(Path.GetDirectoryName(dirPath) ?? "", Path.GetFileName(dirPath) + ".png");

            try
            {
                var psi = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{outputFile}\"");
                using (var p = System.Diagnostics.Process.Start(psi))
                {
                    p!.WaitForExit();
                    if (p.ExitCode == 0)
                    {
                        MessageBox.Show($"Compression réussie :\n{outputFile}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show($"Erreur lors de la compression.\n{p.StandardError.ReadToEnd()}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Impossible de compresser : {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
