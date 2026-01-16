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
                else if (command == "decompress")
                {
                    // backward-compat shortcut if registry uses 'decompress' verb
                    ExtractDirectory(target);
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
                    key.SetValue("SubCommands", "open;decompress");
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
                        using (var decodeKey = shellKey.CreateSubKey("decompress"))
                        {
                            decodeKey.SetValue("MUIVerb", "Décoder l'archive ROX");
                            decodeKey.SetValue("Icon", exePath);
                            using (var cmdKey = decodeKey.CreateSubKey("command"))
                            {
                                var roxPath = Path.Combine(Path.GetDirectoryName(exePath) ?? string.Empty, "roxify", "roxify_native.exe");
                                if (File.Exists(roxPath))
                                {
                                    // Use cmd loop to compute output directory from input file: output -> same folder, same name as file without extension
                                    // e.g. for %1 -> for %I in ("%1") do "C:\...\roxify_native.exe" decompress "%~I" "%~dpnI"
                                    cmdKey.SetValue("", $"\"{exePath}\" decompress \"%1\"");
                                }
                                else
                                {
                                    // fall back to using Pyxelze's internal handler
                                    cmdKey.SetValue("", $"\"{exePath}\" extract \"%1\"");
                                }
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
                                var roxPath = Path.Combine(Path.GetDirectoryName(exePath) ?? string.Empty, "roxify", "roxify_native.exe");
                                if (File.Exists(roxPath))
                                {
                                    // Compute output file as <parent>\<dirname>.png using cmd for loop: %~dpnI expands to drive+path+name
                                    cmdKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
                                }
                                else
                                {
                                    cmdKey.SetValue("", $"\"{exePath}\" compress \"%1\"");
                                }
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

        static string LogPath => Path.Combine(Path.GetTempPath(), "pyxelze-debug.log");

        static void AppendLog(string text)
        {
            try
            {
                File.AppendAllText(LogPath, $"[{DateTime.Now:O}] {text}\n");
            }
            catch { }
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
            AppendLog($"ExtractDirectory start: archive={archivePath} output={outputDir}");

            try
            {
                var psi = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");
                AppendLog($"Run command: {psi.FileName} {psi.Arguments}");
                string stdout, stderr;
                using (var f = new ProcessProgressForm("Extraction en cours", $"Extraction de {Path.GetFileName(archivePath)}..."))
                {
                    int exit = f.RunProcess(psi, out stdout, out stderr);
                    if (exit == 0)
                    {
                        bool hasEntries = false;
                        if (Directory.Exists(outputDir))
                        {
                            var enumerator = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                            hasEntries = enumerator.MoveNext();
                        }
                        else if (File.Exists(outputDir))
                        {
                            var fi = new FileInfo(outputDir);
                            hasEntries = fi.Length > 0;
                        }

                        if (!hasEntries)
                        {
                            var err = stderr;
                            if (string.IsNullOrEmpty(err))
                            {
                                string roxError;
                                if (!RoxRunner.TryCheckRox(out roxError)) err = roxError;
                            }

                            var details = new System.Text.StringBuilder();
                            details.AppendLine($"Commande: {psi.FileName} {psi.Arguments}");
                            details.AppendLine($"Exit code: {exit}");
                            if (!string.IsNullOrEmpty(stdout)) { details.AppendLine("--- Output ---"); details.AppendLine(stdout); }
                            if (!string.IsNullOrEmpty(stderr)) { details.AppendLine("--- Erreur ---"); details.AppendLine(stderr); }
                            if (!string.IsNullOrEmpty(err) && (err.Contains("Accès refusé") || err.Contains("access denied") || err.Contains("os error 5")))
                            {
                                details.AppendLine();
                                details.AppendLine("Astuce: Vérifie les permissions d'écriture sur le dossier cible, exécute l'application en tant qu'administrateur ou vérifie un antivirus qui bloquerait l'écriture.");

                                string tempDir = Path.Combine(Path.GetTempPath(), "pyxelze-decompress-" + Guid.NewGuid().ToString("N"));
                                Directory.CreateDirectory(tempDir);
                                AppendLog($"Attempting temp extract to {tempDir}");
                                var psi2 = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{tempDir}\"");
                                string stdout2, stderr2;
                                using (var f2 = new ProcessProgressForm("Extraction (contournement)", $"Extraction vers un répertoire temporaire pour contourner un problème de permission..."))
                                {
                                    int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                                    AppendLog($"Temp extract result: exit2={exit2} stdout2_len={stdout2?.Length ?? 0} stderr2_len={stderr2?.Length ?? 0}");
                                    bool hasTempEntries = false;
                                    if (Directory.Exists(tempDir))
                                    {
                                        var en = Directory.EnumerateFileSystemEntries(tempDir).GetEnumerator();
                                        hasTempEntries = en.MoveNext();
                                    }

                                    if (exit2 == 0 && hasTempEntries)
                                    {
                                        try
                                        {
                                            foreach (var entry in Directory.EnumerateFileSystemEntries(tempDir))
                                            {
                                                var name = Path.GetFileName(entry);
                                                var dest = Path.Combine(outputDir, name);
                                                if (Directory.Exists(entry))
                                                {
                                                    if (Directory.Exists(dest)) Directory.Delete(dest, true);
                                                    Directory.Move(entry, dest);
                                                }
                                                else if (File.Exists(entry))
                                                {
                                                    if (File.Exists(dest)) File.Delete(dest);
                                                    File.Move(entry, dest);
                                                }
                                            }
                                            Directory.Delete(tempDir, true);
                                            MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: extraction effectuée via un répertoire temporaire.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                            return;
                                        }
                                        catch (Exception exMove)
                                        {
                                            AppendLog($"Move from temp failed: {exMove}");
                                            details.AppendLine();
                                            details.AppendLine("Échec du déplacement depuis le répertoire temporaire: " + exMove.Message);
                                            if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                            if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                        }
                                    }
                                    else
                                    {
                                        details.AppendLine();
                                        details.AppendLine("Tentative de contournement échouée.");
                                        details.AppendLine($"Commande de contournement: {psi2.FileName} {psi2.Arguments}");
                                        if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                        if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                    }
                                }
                            }

                            MessageBox.Show($"Erreur lors de l'extraction : aucun fichier créé.\n\n{details}\n\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        }
                        else
                        {
                            MessageBox.Show($"Extraction réussie vers :\n{outputDir}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        }
                    }
                    else if (f.Cancelled)
                    {
                        MessageBox.Show("Opération annulée.", "Annulé", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        var err = stderr;
                        if (string.IsNullOrEmpty(err))
                        {
                            string roxError;
                            if (!RoxRunner.TryCheckRox(out roxError)) err = roxError;
                        }

                        var details = new System.Text.StringBuilder();
                        details.AppendLine($"Commande: {psi.FileName} {psi.Arguments}");
                        details.AppendLine($"Exit code: {exit}");
                        if (!string.IsNullOrEmpty(stdout)) { details.AppendLine("--- Output ---"); details.AppendLine(stdout); }
                        if (!string.IsNullOrEmpty(stderr)) { details.AppendLine("--- Erreur ---"); details.AppendLine(stderr); }
                        if (!string.IsNullOrEmpty(err) && (err.Contains("Accès refusé") || err.Contains("access denied") || err.Contains("os error 5")))
                        {
                            details.AppendLine();
                            details.AppendLine("Astuce: Vérifie les permissions d'écriture sur le dossier cible, exécute l'application en tant qu'administrateur ou vérifie un antivirus qui bloquerait l'écriture.");

                            string tempDir = Path.Combine(Path.GetTempPath(), "pyxelze-decompress-" + Guid.NewGuid().ToString("N"));
                            Directory.CreateDirectory(tempDir);
                            var psi2 = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{tempDir}\"");
                            string stdout2, stderr2;
                            using (var f2 = new ProcessProgressForm("Extraction (contournement)", $"Extraction vers un répertoire temporaire pour contourner un problème de permission..."))
                            {
                                int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                                bool hasTempEntries = false;
                                if (Directory.Exists(tempDir))
                                {
                                    var en = Directory.EnumerateFileSystemEntries(tempDir).GetEnumerator();
                                    hasTempEntries = en.MoveNext();
                                }

                                if (exit2 == 0 && hasTempEntries)
                                {
                                    try
                                    {
                                        foreach (var entry in Directory.EnumerateFileSystemEntries(tempDir))
                                        {
                                            var name = Path.GetFileName(entry);
                                            var dest = Path.Combine(outputDir, name);
                                            if (Directory.Exists(entry))
                                            {
                                                if (Directory.Exists(dest)) Directory.Delete(dest, true);
                                                Directory.Move(entry, dest);
                                            }
                                            else if (File.Exists(entry))
                                            {
                                                if (File.Exists(dest)) File.Delete(dest);
                                                File.Move(entry, dest);
                                            }
                                        }
                                        Directory.Delete(tempDir, true);
                                        MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: extraction effectuée via un répertoire temporaire.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                        return;
                                    }
                                    catch (Exception exMove)
                                    {
                                        details.AppendLine();
                                        details.AppendLine("Échec du déplacement depuis le répertoire temporaire: " + exMove.Message);
                                        if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                        if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                    }
                                }
                                else
                                {
                                    details.AppendLine();
                                    details.AppendLine("Tentative de contournement échouée.");
                                    details.AppendLine($"Commande de contournement: {psi2.FileName} {psi2.Arguments}");
                                    if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                    if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                }
                            }
                        }

                        MessageBox.Show($"Erreur lors de l'extraction.\n\n{details}\n\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                AppendLog($"Extract threw: {ex}");
                MessageBox.Show($"Impossible d'extraire : {ex.Message}\n\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
            AppendLog($"CompressDirectory start: dir={dirPath} output={outputFile}");

            try
            {
                var psi = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{outputFile}\"");
                AppendLog($"Run command: {psi.FileName} {psi.Arguments}");
                string stdout, stderr;
                using (var f = new ProcessProgressForm("Encodage en cours", $"Encodage de {Path.GetFileName(dirPath)}..."))
                {
                    int exit = f.RunProcess(psi, out stdout, out stderr);
                    if (exit == 0)
                    {
                        if (!File.Exists(outputFile))
                        {
                            var err = stderr;
                            if (string.IsNullOrEmpty(err))
                            {
                                string roxError;
                                if (!RoxRunner.TryCheckRox(out roxError)) err = roxError;
                            }

                            var details = new System.Text.StringBuilder();
                            details.AppendLine($"Commande: {psi.FileName} {psi.Arguments}");
                            details.AppendLine($"Exit code: {exit}");
                            details.AppendLine($"Fichier attendu: {outputFile}");
                            if (!string.IsNullOrEmpty(stdout)) { details.AppendLine("--- Output ---"); details.AppendLine(stdout); }
                            if (!string.IsNullOrEmpty(stderr)) { details.AppendLine("--- Erreur ---"); details.AppendLine(stderr); }
                            if (!string.IsNullOrEmpty(err) && (err.Contains("Accès refusé") || err.Contains("access denied") || err.Contains("os error 5")))
                            {
                                details.AppendLine();
                                details.AppendLine("Astuce: Vérifie les permissions d'écriture sur le dossier cible, exécute l'application en tant qu'administrateur ou vérifie un antivirus qui bloquerait l'écriture.");

                                string tempFile = Path.Combine(Path.GetTempPath(), "pyxelze-encode-" + Guid.NewGuid().ToString("N") + ".png");
                                AppendLog($"Attempting temp encode to {tempFile}");
                                var psi2 = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{tempFile}\"");
                                string stdout2, stderr2;
                                using (var f2 = new ProcessProgressForm("Encodage (contournement)", $"Encodage vers un fichier temporaire pour contourner un problème de permission..."))
                                {
                                    int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                                    AppendLog($"Temp encode result: exit2={exit2} stdout2_len={stdout2?.Length ?? 0} stderr2_len={stderr2?.Length ?? 0}");
                                    if (exit2 == 0 && File.Exists(tempFile))
                                    {
                                        try
                                        {
                                            if (File.Exists(outputFile)) File.Delete(outputFile);
                                            File.Move(tempFile, outputFile);
                                            MessageBox.Show($"Compression réussie :\n{outputFile}\n\nRemarque: créé via un fichier temporaire.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                            return;
                                        }
                                        catch (Exception exMove)
                                        {
                                            AppendLog($"Move temp file failed: {exMove}");
                                            details.AppendLine();
                                            details.AppendLine("Échec du déplacement du fichier temporaire: " + exMove.Message);
                                            if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                            if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                        }
                                    }
                                    else
                                    {
                                        details.AppendLine();
                                        details.AppendLine("Tentative de contournement échouée.");
                                        details.AppendLine($"Commande de contournement: {psi2.FileName} {psi2.Arguments}");
                                        if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                        if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                    }
                                }
                            }

                            MessageBox.Show($"Erreur lors de la compression : le fichier de sortie n'a pas été créé.\n\n{details}\n\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        }
                        else
                        {
                            MessageBox.Show($"Compression réussie :\n{outputFile}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        }
                    }
                    else if (f.Cancelled)
                    {
                        MessageBox.Show("Opération annulée.", "Annulé", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        var err = stderr;
                        if (string.IsNullOrEmpty(err))
                        {
                            string roxError;
                            if (!RoxRunner.TryCheckRox(out roxError)) err = roxError;
                        }

                        var details = new System.Text.StringBuilder();
                        details.AppendLine($"Commande: {psi.FileName} {psi.Arguments}");
                        details.AppendLine($"Exit code: {exit}");
                        if (!string.IsNullOrEmpty(stdout)) { details.AppendLine("--- Output ---"); details.AppendLine(stdout); }
                        if (!string.IsNullOrEmpty(stderr)) { details.AppendLine("--- Erreur ---"); details.AppendLine(stderr); }
                        if (!string.IsNullOrEmpty(err) && (err.Contains("Accès refusé") || err.Contains("access denied") || err.Contains("os error 5")))
                        {
                            details.AppendLine();
                            details.AppendLine("Astuce: Vérifie les permissions d'écriture sur le dossier cible, exécute l'application en tant qu'administrateur ou vérifie un antivirus qui bloquerait l'écriture.");

                            string tempFile = Path.Combine(Path.GetTempPath(), "pyxelze-encode-" + Guid.NewGuid().ToString("N") + ".png");
                            var psi2 = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{tempFile}\"");
                            string stdout2, stderr2;
                            using (var f2 = new ProcessProgressForm("Encodage (contournement)", $"Encodage vers un fichier temporaire pour contourner un problème de permission..."))
                            {
                                int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                                if (exit2 == 0 && File.Exists(tempFile))
                                {
                                    try
                                    {
                                        if (File.Exists(outputFile)) File.Delete(outputFile);
                                        File.Move(tempFile, outputFile);
                                        MessageBox.Show($"Compression réussie :\n{outputFile}\n\nRemarque: créé via un fichier temporaire.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                        return;
                                    }
                                    catch (Exception exMove)
                                    {
                                        details.AppendLine();
                                        details.AppendLine("Échec du déplacement du fichier temporaire: " + exMove.Message);
                                        if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                        if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                    }
                                }
                                else
                                {
                                    details.AppendLine();
                                    details.AppendLine("Tentative de contournement échouée.");
                                    details.AppendLine($"Commande de contournement: {psi2.FileName} {psi2.Arguments}");
                                    if (!string.IsNullOrEmpty(stdout2)) { details.AppendLine("--- Output (contournement) ---"); details.AppendLine(stdout2); }
                                    if (!string.IsNullOrEmpty(stderr2)) { details.AppendLine("--- Erreur (contournement) ---"); details.AppendLine(stderr2); }
                                }
                            }
                        }

                        MessageBox.Show($"Erreur lors de la compression.\n\n{details}\n\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                AppendLog($"Compress threw: {ex}");
                MessageBox.Show($"Impossible de compresser : {ex.Message}\n\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
