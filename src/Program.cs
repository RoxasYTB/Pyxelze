using System.Diagnostics;
using System.Runtime.Versioning;

namespace Pyxelze
{
    static class Program
    {
        [SupportedOSPlatform("windows")]
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
                    if (!OperatingSystem.IsWindows())
                    {
                        MessageBox.Show("L'opération d'intégration au menu contextuel est réservée à Windows.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        return;
                    }
                    RegisterContextMenu();
                    return;
                }
                else if (cmd == "unregister-contextmenu")
                {
                    if (!OperatingSystem.IsWindows())
                    {
                        MessageBox.Show("L'opération de suppression du menu contextuel est réservée à Windows.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        return;
                    }
                    UnregisterContextMenu();
                    return;
                }
            }

            if (args.Length >= 2)
            {
                string command = args[0].ToLower();
                string target = args[1];

                if (command == "extract" || command == "decode")
                {
                    // Run extraction headless (no main UI) and show only the minimal popups
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
        [SupportedOSPlatform("windows")]
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
                        try { shellKey.DeleteSubKeyTree("decompress", false); } catch { }
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
                            decodeKey.SetValue("MUIVerb", "Décoder");
                            decodeKey.SetValue("Icon", exePath);
                            using (var cmdKey = decodeKey.CreateSubKey("command"))
                            {
                                // Always route through the application so we can prompt for passphrase when necessary
                                cmdKey.SetValue("", $"\"{exePath}\" decode \"%1\"");
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
                            encodeKey.SetValue("MUIVerb", "Encoder");
                            encodeKey.SetValue("Icon", exePath);
                            using (var cmdKey = encodeKey.CreateSubKey("command"))
                            {
                                // Always route through the application so we can prompt for passphrase when encoding
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

        [SupportedOSPlatform("windows")]
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

        // Build stamp inserted at build time to help verify which build is running
        public const string BuildStamp = "20260117-1948";

        public static void AppendLog(string text)
        {
            try
            {
                File.AppendAllText(LogPath, $"[{DateTime.Now:O}] {text}\n");
            }
            catch { }
        }

        public static void CopyDirectory(string sourceDir, string destinationDir)
        {
            Directory.CreateDirectory(destinationDir);
            foreach (var file in Directory.GetFiles(sourceDir))
            {
                var destFile = Path.Combine(destinationDir, Path.GetFileName(file));
                File.Copy(file, destFile, true);
            }
            foreach (var dir in Directory.GetDirectories(sourceDir))
            {
                var destSub = Path.Combine(destinationDir, Path.GetFileName(dir));
                CopyDirectory(dir, destSub);
            }
        }

        // Collect diagnostics when extraction fails with an access denied error
        [SupportedOSPlatform("windows")]
        static string CollectExtractionDiagnostics(string archivePath, string outputDir, ProcessStartInfo psi)
        {
            var sb = new System.Text.StringBuilder();
            try
            {
                sb.AppendLine("--- Diagnostic extraction ---");
                sb.AppendLine($"User: {Environment.UserDomainName}\\{Environment.UserName}");
                try
                {
                    bool isAdmin = false;
                    try
                    {
                        var wi = System.Security.Principal.WindowsIdentity.GetCurrent();
                        var wp = new System.Security.Principal.WindowsPrincipal(wi);
                        isAdmin = wp.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
                    }
                    catch { }
                    sb.AppendLine($"IsAdmin: {isAdmin}");
                }
                catch { }

                sb.AppendLine($"ProcessFileName: {psi?.FileName}");
                sb.AppendLine($"ProcessWorkingDirectory: {psi?.WorkingDirectory}");
                try { sb.AppendLine($"ProcessENV TMP={psi?.EnvironmentVariables["TMP"]} TEMP={psi?.EnvironmentVariables["TEMP"]}"); } catch { }
                sb.AppendLine($"Env TMP={Environment.GetEnvironmentVariable("TMP")} TEMP={Environment.GetEnvironmentVariable("TEMP")}");

                try { sb.AppendLine($"Archive exists: {File.Exists(archivePath)}"); } catch { }
                try { sb.AppendLine($"Archive attributes: {File.GetAttributes(archivePath)}"); } catch { }
                try
                {
                    using (var fs = File.Open(archivePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                    {
                        sb.AppendLine($"Archive readable: yes (length={fs.Length})");
                        var buf = new byte[64];
                        int r = fs.Read(buf, 0, buf.Length);
                        sb.AppendLine($"Archive firstBytes: {BitConverter.ToString(buf, 0, Math.Min(r, 16))}");
                    }
                }
                catch (Exception ex)
                {
                    sb.AppendLine($"Archive read test failed: {ex.Message}");
                }

                try
                {
                    var zid = archivePath + ":Zone.Identifier";
                    try { var zidText = File.ReadAllText(zid); sb.AppendLine($"Archive Zone.Identifier: {zidText.Replace('\n', ' ')}"); } catch (Exception e) { sb.AppendLine($"Archive Zone check: {e.Message}"); }
                }
                catch { }

                try { sb.AppendLine($"Output exists: {Directory.Exists(outputDir)}"); } catch { }
                try
                {
                    var outAttr = Directory.Exists(outputDir) ? File.GetAttributes(outputDir).ToString() : "n/a";
                    sb.AppendLine($"Output attributes: {outAttr}");
                }
                catch { }

                try
                {
                    var isNetwork = outputDir != null && outputDir.StartsWith("\\\\");
                    sb.AppendLine($"Output is network share: {isNetwork}");
                }
                catch { }

                try
                {
                    var rox = RoxRunner.GetRoxPath() ?? string.Empty;
                    sb.AppendLine($"RoxPath: {rox}");
                    if (!string.IsNullOrEmpty(rox) && File.Exists(rox))
                    {
                        try { sb.AppendLine($"Rox attributes: {File.GetAttributes(rox)}"); } catch { }
                        try { var zidRox = rox + ":Zone.Identifier"; var zidText = File.ReadAllText(zidRox); sb.AppendLine($"Rox Zone.Identifier: {zidText.Replace('\n', ' ')}"); } catch (Exception e) { sb.AppendLine($"Rox Zone check: {e.Message}"); }
                    }
                }
                catch { }

                sb.AppendLine("--- End diagnostic ---");
            }
            catch (Exception ex)
            {
                sb.AppendLine("Diagnostics collection failed: " + ex.Message);
            }

            var diag = sb.ToString();
            AppendLog(diag);
            return diag;
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
            AppendLog($"ExtractDirectory start: archive={archivePath} output={outputDir} (build {BuildStamp})");

            // Quick test: verify we can create a file in the output directory without elevation.
            bool canWriteToOutput = true;
            try
            {
                var writeTest = Path.Combine(outputDir, ".pyxelze_write_test_" + Guid.NewGuid().ToString("N"));
                File.WriteAllText(writeTest, "test");
                File.Delete(writeTest);
                AppendLog($"Write test OK for {outputDir}");
            }
            catch (Exception exWrite)
            {
                AppendLog($"Write test FAILED for {outputDir}: {exWrite.Message}");
                canWriteToOutput = false;
            }

            if (!canWriteToOutput)
            {
                AppendLog("No direct write permission to output; attempting extraction via temporary directory fallback.");
                try
                {
                    string tempDir = Path.Combine(Path.GetTempPath(), "pyxelze-decompress-" + Guid.NewGuid().ToString("N"));
                    Directory.CreateDirectory(tempDir);
                    var psi2 = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" \"{tempDir}\"");
                    psi2.WorkingDirectory = tempDir;
                    try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }

                    string stdout2, stderr2;
                    using (var f2 = new ProcessProgressForm("Extraction (contournement)", $"Extraction vers un répertoire temporaire pour contourner un problème de permission..."))
                    {
                        int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                        AppendLog($"Temp extract result (pre-check): exit2={exit2} stdout2_len={stdout2?.Length ?? 0} stderr2_len={stderr2?.Length ?? 0}");
                        if (!string.IsNullOrEmpty(stderr2)) AppendLog("Temp stderr (pre-check): " + (stderr2.Length > 2000 ? stderr2.Substring(0, 2000) + "..." : stderr2));
                        if (!string.IsNullOrEmpty(stdout2)) AppendLog("Temp stdout (pre-check): " + (stdout2.Length > 2000 ? stdout2.Substring(0, 2000) + "..." : stdout2));

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
                                        CopyDirectory(entry, dest);
                                    }
                                    else if (File.Exists(entry))
                                    {
                                        if (File.Exists(dest)) File.Delete(dest);
                                        File.Copy(entry, dest, true);
                                    }
                                }
                                try { Directory.Delete(tempDir, true); } catch { }
                                MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: extraction effectuée via un répertoire temporaire (no admin needed).", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                return;
                            }
                            catch (Exception exMove)
                            {
                                AppendLog($"Move from temp failed (pre-check): {exMove}");
                                try { Directory.Delete(tempDir, true); } catch { }
                                MessageBox.Show($"Échec lors du déplacement depuis le répertoire temporaire: {exMove.Message}\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                return;
                            }
                        }
                        else
                        {
                            AppendLog("Pre-check temp extraction failed or produced no files; will proceed to normal attempt.");
                        }
                    }
                }
                catch (Exception exPre)
                {
                    AppendLog($"Pre-check fallback failed: {exPre}");
                }
            }

            try
            {
                // Prefer using --files with a full file list (avoids certain permission/AV issues)
                var filePaths = RoxRunner.GetFileList(archivePath);
                ProcessStartInfo psi;
                if (filePaths != null && filePaths.Count > 0)
                {
                    // Prefer a simple decode (avoids building long --files lists which may hit command-line or quoting issues)
                    psi = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" \"{outputDir}\"");
                    AppendLog($"Using decode to extract; files: {filePaths.Count} entries");
                }
                else
                {
                    psi = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" \"{outputDir}\"");
                    AppendLog("No files parsed from rox list; using decode (legacy fallback)");
                }

                AppendLog($"Run command: {psi.FileName} {psi.Arguments}");
                string stdout, stderr;
                using (var f = new ProcessProgressForm("Extraction en cours", $"Extraction de {Path.GetFileName(archivePath)}..."))
                {
                    int exit = f.RunProcess(psi, out stdout, out stderr);

                    // If roxify told us a passphrase is required, prompt once and retry with the provided passphrase
                    bool needsPassphrase = (stdout?.Contains("Passphrase required for AES decryption") == true) || (stderr?.Contains("Passphrase required for AES decryption") == true);
                    if (needsPassphrase)
                    {
                        var pass = PassphrasePrompt.Prompt("Passphrase requise", "Ce fichier est chiffré. Entrez la passphrase :");
                        if (pass == null)
                        {
                            MessageBox.Show("Opération annulée.", "Annulé", MessageBoxButtons.OK, MessageBoxIcon.Information);
                            return;
                        }

                        var esc = pass.Replace("\"", "\\\"");
                        var psiPass = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" --passphrase \"{esc}\" \"{outputDir}\"");

                        AppendLog($"Run command (with passphrase): {psiPass.FileName} {psiPass.Arguments}");
                        string stdout2, stderr2;
                        using (var f2 = new ProcessProgressForm("Déchiffrement en cours", "Déchiffrement en cours..."))
                        {
                            int exit2 = f2.RunProcess(psiPass, out stdout2, out stderr2);
                            AppendLog($"Decrypt attempt exit={exit2} stdout_len={stdout2?.Length ?? 0} stderr_len={stderr2?.Length ?? 0}");

                            bool hasEntries2 = false;
                            if (Directory.Exists(outputDir))
                            {
                                var enumerator2 = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                                hasEntries2 = enumerator2.MoveNext();
                            }
                            else if (File.Exists(outputDir))
                            {
                                var fi2 = new FileInfo(outputDir);
                                hasEntries2 = fi2.Length > 0;
                            }

                            if (exit2 == 0 && hasEntries2)
                            {
                                MessageBox.Show($"Extraction réussie vers :\n{outputDir}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                try { Directory.Delete(Path.Combine(Path.GetTempPath(), "pyxelze-decompress-" + Guid.NewGuid().ToString("N")), true); } catch { }
                                return;
                            }
                            else
                            {
                                var details2 = new System.Text.StringBuilder();
                                details2.AppendLine($"Commande: {psiPass.FileName} {psiPass.Arguments}");
                                details2.AppendLine($"Exit code: {exit2}");
                                if (!string.IsNullOrEmpty(stdout2)) { details2.AppendLine("--- Output ---"); details2.AppendLine(stdout2); }
                                if (!string.IsNullOrEmpty(stderr2)) { details2.AppendLine("--- Erreur ---"); details2.AppendLine(stderr2); }
                                MessageBox.Show($"Erreur lors du déchiffrement :\n\n{details2}\n\nVoir le journal: {LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                return;
                            }
                        }
                    }

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
                                try
                                {
                                    if (OperatingSystem.IsWindows())
                                    {
                                        var diag = CollectExtractionDiagnostics(archivePath, outputDir, psi);
                                        details.AppendLine();
                                        details.AppendLine("--- Diagnostic (auto-collect) ---");
                                        details.AppendLine(diag);
                                        details.AppendLine("--- End Diagnostic ---");
                                    }
                                }
                                catch { }

                                int[] delays = new[] { 2000, 5000, 10000, 15000, 20000 };
                                for (int attempt = 1; attempt <= delays.Length; attempt++)
                                {
                                    AppendLog($"AV retry attempt {attempt}/{delays.Length}: waiting {(attempt == 1 ? 0 : delays[attempt - 2])}ms");
                                    if (attempt > 1) Thread.Sleep(delays[attempt - 2]);

                                    var psiRetry = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");
                                    psiRetry.WorkingDirectory = outputDir;
                                    try { psiRetry.EnvironmentVariables["TMP"] = outputDir; psiRetry.EnvironmentVariables["TEMP"] = outputDir; } catch { }

                                    string stdoutR, stderrR;
                                    using (var fRetry = new ProcessProgressForm("Analyse antivirus en cours", $"Analyse antivirus en cours... tentative {attempt}/{delays.Length}"))
                                    {
                                        int exitR = fRetry.RunProcess(psiRetry, out stdoutR, out stderrR);
                                        AppendLog($"AV retry result attempt={attempt} exit={exitR} stderr_len={stderrR?.Length ?? 0}");
                                        if (exitR == 0)
                                        {
                                            bool hasEntriesR = false;
                                            if (Directory.Exists(outputDir))
                                            {
                                                var enumeratorR = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                                                hasEntriesR = enumeratorR.MoveNext();
                                            }

                                            if (hasEntriesR)
                                            {
                                                MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: l'opération a réussi après attente de l'analyse antivirus.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                                return;
                                            }
                                        }

                                        if (fRetry.Cancelled) break;
                                    }
                                }

                                AppendLog("AV retries exhausted; offering Defender exclusion prompt before temporary extraction fallback");

                                string roxPathLocal = RoxRunner.GetRoxPath() ?? string.Empty;
                                string roxDirLocal = !string.IsNullOrEmpty(roxPathLocal) ? Path.GetDirectoryName(roxPathLocal) ?? roxPathLocal : string.Empty;

                                var choice = MessageBox.Show("L'antivirus semble bloquer l'extraction (Accès refusé).\n\nSouhaitez-vous tenter d'ajouter une exclusion Windows Defender pour le dossier roxify (nécessite droits administrateur) ?\n\nOui : tenter d'ajouter l'exclusion (UAC demandé) puis réessayer.\nNon : ouvrir les paramètres Sécurité Windows pour l'ajouter manuellement.\nAnnuler : poursuivre le contournement temporaire.", "Antivirus détecté", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);

                                if (choice == DialogResult.Yes)
                                {
                                    AppendLog("User chose to attempt Add-MpPreference via elevation");
                                    string addMsg;
                                    bool addOk = TryAddWindowsDefenderExclusionElevated(roxDirLocal, out addMsg);
                                    AppendLog($"AddDefenderExclusion result: {addOk} msg={addMsg}");
                                    if (addOk)
                                    {
                                        int[] postDelays = new[] { 2000, 5000, 10000, 15000, 20000 };
                                        for (int attempt = 1; attempt <= postDelays.Length; attempt++)
                                        {
                                            AppendLog($"Post-exclusion AV retry attempt {attempt}/{postDelays.Length}");
                                            if (attempt > 1) Thread.Sleep(postDelays[attempt - 2]);

                                            var psiRetry = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");
                                            psiRetry.WorkingDirectory = outputDir;
                                            try { psiRetry.EnvironmentVariables["TMP"] = outputDir; psiRetry.EnvironmentVariables["TEMP"] = outputDir; } catch { }

                                            string stdoutR, stderrR;
                                            using (var fRetry = new ProcessProgressForm("Analyse antivirus en cours", $"Réessai après ajout d'exclusion... tentative {attempt}/{postDelays.Length}"))
                                            {
                                                int exitR = fRetry.RunProcess(psiRetry, out stdoutR, out stderrR);
                                                AppendLog($"Post-exclusion retry result attempt={attempt} exit={exitR} stderr_len={stderrR?.Length ?? 0}");
                                                if (exitR == 0)
                                                {
                                                    bool hasEntriesR = false;
                                                    if (Directory.Exists(outputDir))
                                                    {
                                                        var enumeratorR = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                                                        hasEntriesR = enumeratorR.MoveNext();
                                                    }

                                                    if (hasEntriesR)
                                                    {
                                                        MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: l'opération a réussi après ajout de l'exclusion antivirus.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                                        return;
                                                    }
                                                }

                                                if (fRetry.Cancelled) break;
                                            }
                                        }

                                        AppendLog("Post-exclusion retries exhausted");
                                    }
                                    else
                                    {
                                        MessageBox.Show("Impossible d'ajouter l'exclusion automatiquement : " + addMsg + "\n\nTu peux l'ajouter manuellement depuis Sécurité Windows → Protection contre les virus et menaces → Gérer les paramètres → Exclusions.", "Ajout d'exclusion échoué", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                    }
                                }
                                else if (choice == DialogResult.No)
                                {
                                    try { Process.Start(new ProcessStartInfo("ms-settings:windowsdefender") { UseShellExecute = true }); } catch { }
                                    var res = MessageBox.Show("Ajoute maintenant l'exclusion dans Sécurité Windows, puis clique Réessayer pour relancer l'extraction.", "Après ajout manuel", MessageBoxButtons.RetryCancel, MessageBoxIcon.Information);
                                    if (res == DialogResult.Retry)
                                    {
                                        int[] postDelays = new[] { 2000, 5000, 10000, 15000, 20000 };
                                        for (int attempt = 1; attempt <= postDelays.Length; attempt++)
                                        {
                                            AppendLog($"Post-manual AV retry attempt {attempt}/{postDelays.Length}");
                                            if (attempt > 1) Thread.Sleep(postDelays[attempt - 2]);

                                            var psiRetry = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");
                                            psiRetry.WorkingDirectory = outputDir;
                                            try { psiRetry.EnvironmentVariables["TMP"] = outputDir; psiRetry.EnvironmentVariables["TEMP"] = outputDir; } catch { }

                                            string stdoutR, stderrR;
                                            using (var fRetry = new ProcessProgressForm("Analyse antivirus en cours", $"Réessai après ajout manuel... tentative {attempt}/{postDelays.Length}"))
                                            {
                                                int exitR = fRetry.RunProcess(psiRetry, out stdoutR, out stderrR);
                                                AppendLog($"Post-manual retry result attempt={attempt} exit={exitR} stderr_len={stderrR?.Length ?? 0}");
                                                if (exitR == 0)
                                                {
                                                    bool hasEntriesR = false;
                                                    if (Directory.Exists(outputDir))
                                                    {
                                                        var enumeratorR = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                                                        hasEntriesR = enumeratorR.MoveNext();
                                                    }

                                                    if (hasEntriesR)
                                                    {
                                                        MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: l'opération a réussi après ajout manuel de l'exclusion antivirus.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                                        return;
                                                    }
                                                }

                                                if (fRetry.Cancelled) break;
                                            }
                                        }

                                        AppendLog("Post-manual retries exhausted");
                                    }
                                }

                                string tempDir = Path.Combine(Path.GetTempPath(), "pyxelze-decompress-" + Guid.NewGuid().ToString("N"));
                                Directory.CreateDirectory(tempDir);
                                AppendLog($"Attempting temp extract to {tempDir}");

                                string tempArchive = Path.Combine(tempDir, Path.GetFileName(archivePath));
                                try
                                {
                                    File.Copy(archivePath, tempArchive, true);
                                    AppendLog($"Copied archive to temp: {tempArchive}");
                                }
                                catch (Exception exCopyArc)
                                {
                                    AppendLog($"Failed to copy archive to temp: {exCopyArc}");
                                    tempArchive = archivePath;
                                }

                                string roxPath = RoxRunner.GetRoxPath() ?? string.Empty;
                                ProcessStartInfo psi2;
                                if (!string.IsNullOrEmpty(roxPath))
                                {
                                    try
                                    {
                                        var tempExe = Path.Combine(Path.GetTempPath(), "roxify_exec_" + Guid.NewGuid().ToString("N") + ".exe");
                                        File.Copy(roxPath, tempExe, true);
                                        try { File.SetAttributes(tempExe, FileAttributes.Normal); } catch { }
                                        try { File.Delete(tempExe + ":Zone.Identifier"); } catch { }
                                        psi2 = new ProcessStartInfo
                                        {
                                            FileName = tempExe,
                                            Arguments = $"decompress \"{tempArchive}\" \"{tempDir}\"",
                                            UseShellExecute = false,
                                            CreateNoWindow = true,
                                            RedirectStandardOutput = true,
                                            RedirectStandardError = true,
                                            WorkingDirectory = tempDir
                                        };
                                        try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }
                                    }
                                    catch (Exception exCopy)
                                    {
                                        AppendLog($"Failed to copy rox executable to temp: {exCopy}");
                                        psi2 = RoxRunner.CreateRoxProcess($"decompress \"{tempArchive}\" \"{tempDir}\"");
                                        psi2.WorkingDirectory = tempDir;
                                        try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }
                                    }
                                }
                                else
                                {
                                    psi2 = RoxRunner.CreateRoxProcess($"decompress \"{tempArchive}\" \"{tempDir}\"");
                                    psi2.WorkingDirectory = tempDir;
                                    try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }
                                }

                                string stdout2, stderr2;
                                using (var f2 = new ProcessProgressForm("Extraction (contournement)", $"Extraction vers un répertoire temporaire pour contourner un problème de permission..."))
                                {
                                    int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                                    AppendLog($"Temp extract result: exit2={exit2} stdout2_len={stdout2?.Length ?? 0} stderr2_len={stderr2?.Length ?? 0}");
                                    if (!string.IsNullOrEmpty(stderr2)) AppendLog("Temp stderr: " + (stderr2.Length > 2000 ? stderr2.Substring(0, 2000) + "..." : stderr2));
                                    if (!string.IsNullOrEmpty(stdout2)) AppendLog("Temp stdout: " + (stdout2.Length > 2000 ? stdout2.Substring(0, 2000) + "..." : stdout2));
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
                        // try to set WorkingDirectory to outputDir and re-run once without modifying destination
                        try
                        {
                            var psiRetry = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");
                            psiRetry.WorkingDirectory = outputDir;
                            try { psiRetry.EnvironmentVariables["TMP"] = outputDir; psiRetry.EnvironmentVariables["TEMP"] = outputDir; } catch { }
                            string stdoutRetry, stderrRetry;
                            using (var fRetry = new ProcessProgressForm("Extraction (réessai)", "Réessai d'extraction sans élévation..."))
                            {
                                int exitRetry = fRetry.RunProcess(psiRetry, out stdoutRetry, out stderrRetry);
                                AppendLog($"Retry extract: exit={exitRetry} stdout_len={stdoutRetry?.Length ?? 0} stderr_len={stderrRetry?.Length ?? 0}");
                                if (!string.IsNullOrEmpty(stderrRetry)) AppendLog("Retry stderr: " + (stderrRetry.Length > 2000 ? stderrRetry.Substring(0, 2000) + "..." : stderrRetry));
                                if (!string.IsNullOrEmpty(stdoutRetry)) AppendLog("Retry stdout: " + (stdoutRetry.Length > 2000 ? stdoutRetry.Substring(0, 2000) + "..." : stdoutRetry));
                                if (exitRetry == 0)
                                {
                                    MessageBox.Show($"Extraction réussie vers :\n{outputDir}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                    return;
                                }
                            }
                        }
                        catch (Exception exRetry)
                        {
                            AppendLog($"Retry extract failed: {exRetry}");
                        }
                    }
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
                        if (!string.IsNullOrEmpty(err) && (err.Contains("Accès refus     d") || err.Contains("access denied") || err.Contains("os error 5")))
                        {
                            details.AppendLine();
                            details.AppendLine("Astuce: Vérifie les permissions d'écriture sur le dossier cible, exécute l'application en tant qu'administrateur ou vérifie un antivirus qui bloquerait l'écriture.");
                            details.AppendLine("Conseil: installe Pyxelze en tant qu'administrateur et utilise l'option 'Ajouter une exclusion Windows Defender pour Pyxelze' dans l'installateur, ou ajoute manuellement une exclusion pour le dossier \"C:\\Program Files\\Pyxelze\\roxify\" et pour ton répertoire TEMP (%TEMP%).");
                            try
                            {
                                if (OperatingSystem.IsWindows())
                                {
                                    var diag = CollectExtractionDiagnostics(archivePath, outputDir, psi);
                                    details.AppendLine();
                                    details.AppendLine("--- Diagnostic (auto-collect) ---");
                                    details.AppendLine(diag);
                                    details.AppendLine("--- End Diagnostic ---");
                                }
                            }
                            catch { }

                            int[] delays = new[] { 2000, 5000, 10000, 15000, 20000 };
                            for (int attempt = 1; attempt <= delays.Length; attempt++)
                            {
                                AppendLog($"AV retry second-block attempt {attempt}/{delays.Length}");
                                if (attempt > 1) Thread.Sleep(delays[attempt - 2]);

                                var psiRetry = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");
                                psiRetry.WorkingDirectory = outputDir;
                                try { psiRetry.EnvironmentVariables["TMP"] = outputDir; psiRetry.EnvironmentVariables["TEMP"] = outputDir; } catch { }

                                string stdoutR, stderrR;
                                using (var fRetry = new ProcessProgressForm("Analyse antivirus en cours", $"Analyse antivirus en cours... tentative {attempt}/{delays.Length}"))
                                {
                                    int exitR = fRetry.RunProcess(psiRetry, out stdoutR, out stderrR);
                                    AppendLog($"AV retry second-block result attempt={attempt} exit={exitR} stderr_len={stderrR?.Length ?? 0}");
                                    if (exitR == 0)
                                    {
                                        bool hasEntriesR = false;
                                        if (Directory.Exists(outputDir))
                                        {
                                            var enumeratorR = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                                            hasEntriesR = enumeratorR.MoveNext();
                                        }

                                        if (hasEntriesR)
                                        {
                                            MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: l'opération a réussi après attente de l'analyse antivirus.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                            return;
                                        }
                                    }

                                    if (fRetry.Cancelled) break;
                                }
                            }

                            AppendLog("AV retries exhausted; offering Defender exclusion prompt before temporary extraction fallback");

                            string roxPathLocal2 = RoxRunner.GetRoxPath() ?? string.Empty;
                            string roxDirLocal2 = !string.IsNullOrEmpty(roxPathLocal2) ? Path.GetDirectoryName(roxPathLocal2) ?? roxPathLocal2 : string.Empty;

                            var choice2 = MessageBox.Show("L'antivirus semble bloquer l'extraction (Accès refusé).\n\nSouhaitez-vous tenter d'ajouter une exclusion Windows Defender pour le dossier roxify (nécessite droits administrateur) ?\n\nOui : tenter d'ajouter l'exclusion (UAC demandé) puis réessayer.\nNon : ouvrir les paramètres Sécurité Windows pour l'ajouter manuellement.\nAnnuler : poursuivre le contournement temporaire.", "Antivirus détecté", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);

                            if (choice2 == DialogResult.Yes)
                            {
                                AppendLog("User chose to attempt Add-MpPreference via elevation");
                                string addMsg;
                                bool addOk = TryAddWindowsDefenderExclusionElevated(roxDirLocal2, out addMsg);
                                AppendLog($"AddDefenderExclusion result: {addOk} msg={addMsg}");
                                if (addOk)
                                {
                                    int[] postDelays = new[] { 2000, 5000, 10000, 15000, 20000 };
                                    for (int attempt = 1; attempt <= postDelays.Length; attempt++)
                                    {
                                        AppendLog($"Post-exclusion AV retry attempt {attempt}/{postDelays.Length}");
                                        if (attempt > 1) Thread.Sleep(postDelays[attempt - 2]);

                                        var psiRetry = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");
                                        psiRetry.WorkingDirectory = outputDir;
                                        try { psiRetry.EnvironmentVariables["TMP"] = outputDir; psiRetry.EnvironmentVariables["TEMP"] = outputDir; } catch { }

                                        string stdoutR, stderrR;
                                        using (var fRetry = new ProcessProgressForm("Analyse antivirus en cours", $"Réessai après ajout d'exclusion... tentative {attempt}/{postDelays.Length}"))
                                        {
                                            int exitR = fRetry.RunProcess(psiRetry, out stdoutR, out stderrR);
                                            AppendLog($"Post-exclusion retry result attempt={attempt} exit={exitR} stderr_len={stderrR?.Length ?? 0}");
                                            if (exitR == 0)
                                            {
                                                bool hasEntriesR = false;
                                                if (Directory.Exists(outputDir))
                                                {
                                                    var enumeratorR = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                                                    hasEntriesR = enumeratorR.MoveNext();
                                                }

                                                if (hasEntriesR)
                                                {
                                                    MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: l'opération a réussi après ajout de l'exclusion antivirus.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                                    return;
                                                }
                                            }

                                            if (fRetry.Cancelled) break;
                                        }
                                    }

                                    AppendLog("Post-exclusion retries exhausted");
                                }
                                else
                                {
                                    MessageBox.Show("Impossible d'ajouter l'exclusion automatiquement : " + addMsg + "\n\nTu peux l'ajouter manuellement depuis Sécurité Windows → Protection contre les virus et menaces → Gérer les paramètres → Exclusions.", "Ajout d'exclusion échoué", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                }
                            }
                            else if (choice2 == DialogResult.No)
                            {
                                try { Process.Start(new ProcessStartInfo("ms-settings:windowsdefender") { UseShellExecute = true }); } catch { }
                                var res2 = MessageBox.Show("Ajoute maintenant l'exclusion dans Sécurité Windows, puis clique Réessayer pour relancer l'extraction.", "Après ajout manuel", MessageBoxButtons.RetryCancel, MessageBoxIcon.Information);
                                if (res2 == DialogResult.Retry)
                                {
                                    int[] postDelays = new[] { 2000, 5000, 10000, 15000, 20000 };
                                    for (int attempt = 1; attempt <= postDelays.Length; attempt++)
                                    {
                                        AppendLog($"Post-manual AV retry attempt {attempt}/{postDelays.Length}");
                                        if (attempt > 1) Thread.Sleep(postDelays[attempt - 2]);

                                        var psiRetry = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" \"{outputDir}\"");
                                        psiRetry.WorkingDirectory = outputDir;
                                        try { psiRetry.EnvironmentVariables["TMP"] = outputDir; psiRetry.EnvironmentVariables["TEMP"] = outputDir; } catch { }

                                        string stdoutR, stderrR;
                                        using (var fRetry = new ProcessProgressForm("Analyse antivirus en cours", $"Réessai après ajout manuel... tentative {attempt}/{postDelays.Length}"))
                                        {
                                            int exitR = fRetry.RunProcess(psiRetry, out stdoutR, out stderrR);
                                            AppendLog($"Post-manual retry result attempt={attempt} exit={exitR} stderr_len={stderrR?.Length ?? 0}");
                                            if (exitR == 0)
                                            {
                                                bool hasEntriesR = false;
                                                if (Directory.Exists(outputDir))
                                                {
                                                    var enumeratorR = Directory.EnumerateFileSystemEntries(outputDir).GetEnumerator();
                                                    hasEntriesR = enumeratorR.MoveNext();
                                                }

                                                if (hasEntriesR)
                                                {
                                                    MessageBox.Show($"Extraction réussie vers :\n{outputDir}\n\nRemarque: l'opération a réussi après ajout manuel de l'exclusion antivirus.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                                    return;
                                                }
                                            }

                                            if (fRetry.Cancelled) break;
                                        }
                                    }

                                    AppendLog("Post-manual retries exhausted");
                                }
                            }

                            string tempDir = Path.Combine(Path.GetTempPath(), "pyxelze-decompress-" + Guid.NewGuid().ToString("N"));
                            Directory.CreateDirectory(tempDir);
                            var psi2 = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" \"{tempDir}\"");
                            psi2.WorkingDirectory = tempDir;
                            try { psi2.EnvironmentVariables["TMP"] = tempDir; psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }
                            string stdout2, stderr2;
                            using (var f2 = new ProcessProgressForm("Extraction (contournement)", $"Extraction vers un répertoire temporaire pour contourner un problème de permission..."))
                            {
                                int exit2 = f2.RunProcess(psi2, out stdout2, out stderr2);
                                AppendLog($"Temp extract result: exit2={exit2} stdout2_len={stdout2?.Length ?? 0} stderr2_len={stderr2?.Length ?? 0}");
                                if (!string.IsNullOrEmpty(stderr2)) AppendLog("Temp stderr: " + (stderr2.Length > 2000 ? stderr2.Substring(0, 2000) + "..." : stderr2));
                                if (!string.IsNullOrEmpty(stdout2)) AppendLog("Temp stdout: " + (stdout2.Length > 2000 ? stdout2.Substring(0, 2000) + "..." : stdout2));
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
                                            try
                                            {
                                                if (Directory.Exists(entry))
                                                {
                                                    if (Directory.Exists(dest)) Directory.Delete(dest, true);
                                                    CopyDirectory(entry, dest);
                                                }
                                                else if (File.Exists(entry))
                                                {
                                                    if (File.Exists(dest)) File.Delete(dest);
                                                    File.Copy(entry, dest, true);
                                                }
                                            }
                                            catch (Exception exCopyMove)
                                            {
                                                AppendLog($"Failed to copy from temp to dest for entry={entry}: {exCopyMove}");
                                                throw;
                                            }
                                        }

                                        try { Directory.Delete(tempDir, true); } catch { }
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
                MessageBox.Show($"Impossible d'extraire : {ex.Message}\n\nVoir le journal: {LogPath}\n\nAstuce: si l'erreur contient 'Accès refusé', essaie d'exécuter 'Pyxelze' en dehors d'un dossier protégé (ou désactive temporairement l'antivirus) — mais l'app tente maintenant plusieurs contournements sans élévation.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static bool TryAddWindowsDefenderExclusionElevated(string path, out string message)
        {
            message = string.Empty;
            try
            {
                if (string.IsNullOrEmpty(path))
                {
                    message = "Chemin roxify introuvable";
                    return false;
                }

                var ps = Path.Combine(Environment.SystemDirectory, "WindowsPowerShell\\v1.0\\powershell.exe");
                if (!File.Exists(ps))
                {
                    message = "PowerShell introuvable";
                    return false;
                }

                var cmd = "-NoProfile -ExecutionPolicy Bypass -Command \"try { Add-MpPreference -ExclusionPath '" + path + "' -ErrorAction Stop; exit 0 } catch { exit 1 }\"";
                var psi = new ProcessStartInfo
                {
                    FileName = ps,
                    Arguments = cmd,
                    UseShellExecute = true,
                    Verb = "runas",
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                var p = Process.Start(psi);
                if (p == null)
                {
                    message = "Échec du lancement PowerShell";
                    return false;
                }
                p.WaitForExit();
                message = $"ExitCode={p.ExitCode}";
                return p.ExitCode == 0;
            }
            catch (System.ComponentModel.Win32Exception ex)
            {
                message = ex.Message;
                return false;
            }
            catch (Exception ex)
            {
                message = ex.Message;
                return false;
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
                string? pass = PassphrasePrompt.Prompt("Passphrase (optionnel)", "Saisir une passphrase pour chiffrer (laisser vide pour ne pas chiffrer) :");
                if (pass == null)
                {
                    AppendLog("Compress cancelled by user");
                    MessageBox.Show("Opération annulée.", "Annulé", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }
                var passArg = string.IsNullOrEmpty(pass) ? string.Empty : $" --passphrase \"{pass.Replace("\"", "\\\"")}\"";
                var psi = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{outputFile}\"{passArg}");
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
                                details.AppendLine("Conseil: installe Pyxelze en tant qu'administrateur et utilise l'option 'Ajouter une exclusion Windows Defender pour Pyxelze' dans l'installateur, ou ajoute manuellement une exclusion pour le dossier \"C:\\Program Files\\Pyxelze\\roxify\" et pour ton répertoire TEMP (%TEMP%).");

                                int[] delaysEnc = new[] { 2000, 5000, 10000, 15000, 20000 };
                                for (int attempt = 1; attempt <= delaysEnc.Length; attempt++)
                                {
                                    AppendLog($"AV retry encode attempt {attempt}/{delaysEnc.Length}");
                                    if (attempt > 1) Thread.Sleep(delaysEnc[attempt - 2]);

                                    var psiRetry = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{outputFile}\"");
                                    try { psiRetry.EnvironmentVariables["TMP"] = Path.GetTempPath(); psiRetry.EnvironmentVariables["TEMP"] = Path.GetTempPath(); } catch { }

                                    string stdoutR, stderrR;
                                    using (var fRetry = new ProcessProgressForm("Analyse antivirus en cours", $"Analyse antivirus en cours... tentative {attempt}/{delaysEnc.Length}"))
                                    {
                                        int exitR = fRetry.RunProcess(psiRetry, out stdoutR, out stderrR);
                                        AppendLog($"AV retry encode result attempt={attempt} exit={exitR} stderr_len={stderrR?.Length ?? 0}");
                                        if (exitR == 0 && File.Exists(outputFile))
                                        {
                                            MessageBox.Show($"Compression réussie :\n{outputFile}\n\nRemarque: l'opération a réussi après attente de l'analyse antivirus.", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                                            return;
                                        }

                                        if (fRetry.Cancelled) break;
                                    }
                                }

                                AppendLog("AV retries exhausted; proceeding to temporary encode fallback");
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
                            details.AppendLine("Conseil: installe Pyxelze en tant qu'administrateur et utilise l'option 'Ajouter une exclusion Windows Defender pour Pyxelze' dans l'installateur, ou ajoute manuellement une exclusion pour le dossier \"C:\\Program Files\\Pyxelze\\roxify\" et pour ton répertoire TEMP (%TEMP%).");

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
