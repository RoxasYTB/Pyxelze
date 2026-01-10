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

                using (var key = Microsoft.Win32.Registry.ClassesRoot.CreateSubKey(@"*\shell\Pyxelze"))
                {
                    key.SetValue("", "");
                    key.SetValue("MUIVerb", "Pyxelze");
                    key.SetValue("Icon", exePath);
                    key.SetValue("SubCommands", "open;decode");
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
                        using (var decodeKey = shellKey.CreateSubKey("decode"))
                        {
                            decodeKey.SetValue("MUIVerb", "Décoder l'archive ROX");
                            decodeKey.SetValue("Icon", exePath);
                            using (var cmdKey = decodeKey.CreateSubKey("command"))
                            {
                                cmdKey.SetValue("", $"\"{exePath}\" extract \"%1\"");
                            }
                        }
                    }
                }

                using (var dirKey = Microsoft.Win32.Registry.ClassesRoot.CreateSubKey(@"Directory\shell\Pyxelze"))
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
                                cmdKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
                            }
                        }
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
                Microsoft.Win32.Registry.ClassesRoot.DeleteSubKeyTree(@"*\shell\Pyxelze", false);
                Microsoft.Win32.Registry.ClassesRoot.DeleteSubKeyTree(@"Directory\shell\Pyxelze", false);

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
