using System.Diagnostics;

namespace Pyxelze;

internal static class ExtractionService
{
    public static bool ExtractArchive(string archivePath, string outputDir)
    {
        Directory.CreateDirectory(outputDir);
        Logger.Log($"ExtractArchive: {archivePath} -> {outputDir}");

        if (!CanWriteTo(outputDir))
            return ExtractViaTempDir(archivePath, outputDir);

        var (exit, stdout, stderr) = ProcessHelper.RunRox($"decompress \"{archivePath}\" \"{outputDir}\"");

        if (PassphraseManager.NeedsPassphrase(stdout, stderr))
            return ExtractWithPassphraseLoop(archivePath, outputDir);

        if (exit == 0 && ProcessHelper.DirectoryHasEntries(outputDir))
            return true;

        if (AntivirusHelper.IsAccessDenied(stderr))
            return HandleAccessDenied(archivePath, outputDir);

        return false;
    }

    public static bool ExtractWithProgress(string archivePath, string outputDir)
    {
        Directory.CreateDirectory(outputDir);
        Logger.Log($"ExtractWithProgress: {archivePath} -> {outputDir}");

        if (ProcessHelper.DirectoryHasEntries(outputDir))
        {
            var result = MessageBox.Show(
                $"Le dossier de destination contient déjà des fichiers :\n{outputDir}\n\nVoulez-vous ré-extraire ?",
                "Fichiers existants", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.No) return true;
        }

        var psi = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{outputDir}\"");

        int exit = ProcessHelper.RunWithProgress(
            "Extraction en cours",
            $"Extraction de {Path.GetFileName(archivePath)}...",
            psi, out var stdout, out var stderr);

        Logger.Log($"ExtractWithProgress result: exit={exit} stdout={stdout?.Trim()} stderr={stderr?.Trim()} hasEntries={ProcessHelper.DirectoryHasEntries(outputDir)}");

        if (PassphraseManager.NeedsPassphrase(stdout ?? "", stderr ?? ""))
            return ExtractWithPassphraseLoop(archivePath, outputDir);

        if (exit == 0 && ProcessHelper.DirectoryHasEntries(outputDir))
            return true;

        if (AntivirusHelper.IsAccessDenied(stderr ?? ""))
            return HandleAccessDenied(archivePath, outputDir);

        return false;
    }

    public static bool ExtractFileSingle(string archivePath, string internalPath, string outputPath)
    {
        Logger.LogDnd($"ExtractFileSingle: {internalPath} -> {outputPath}");
        if (string.IsNullOrEmpty(archivePath)) return false;

        var tempOut = TempHelper.CreateTempDir("pyxelze_extract");
        try
        {
            if (!DecompressFiles(archivePath, tempOut, internalPath))
            {
                Logger.LogDnd($"DecompressFiles failed, falling back to DecodeArchiveToDir");
                if (!DecodeArchiveToDir(archivePath, tempOut))
                {
                    Logger.LogDnd($"DecodeArchiveToDir also failed");
                    return false;
                }
            }

            var sourceFull = FindExtractedFile(tempOut, internalPath);
            Logger.LogDnd($"FindExtractedFile: {sourceFull}");
            if (sourceFull == null) return false;

            Directory.CreateDirectory(Path.GetDirectoryName(outputPath) ?? Path.GetTempPath());
            File.Copy(sourceFull, outputPath, true);
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogDnd($"ExtractFileSingle exception: {ex}");
            return false;
        }
        finally { TempHelper.SafeDelete(tempOut); }
    }

    private static bool DecompressFiles(string archivePath, string outputDir, string filePattern)
    {
        var escaped = filePattern.Replace("\"", "\\\"");
        string args = $"decompress \"{archivePath}\" \"{outputDir}\" --files \"{escaped}\"";
        var cachedPass = PassphraseManager.CachedPassphrase;
        if (!string.IsNullOrEmpty(cachedPass))
            args = $"decompress \"{archivePath}\" {PassphraseManager.BuildPassphraseArg(cachedPass)} \"{outputDir}\" --files \"{escaped}\"";
        var (exit, stdout, stderr) = ProcessHelper.RunRox(args);
        Logger.LogDnd($"DecompressFiles: exit={exit} stdout={stdout?.Trim()} stderr={stderr?.Trim()} hasEntries={ProcessHelper.DirectoryHasEntries(outputDir)}");
        return exit == 0 && ProcessHelper.DirectoryHasEntries(outputDir);
    }

    public static int ExtractMultipleFiles(string archivePath, IList<string> internalPaths, string tempOut)
    {
        Logger.LogDnd($"ExtractMultipleFiles: {internalPaths.Count} files -> {tempOut}");
        if (string.IsNullOrEmpty(archivePath)) return 0;

        Directory.CreateDirectory(tempOut);

        if (!DecodeArchiveToDir(archivePath, tempOut))
            return 0;

        int found = 0;
        foreach (var pth in internalPaths)
        {
            if (FindExtractedFile(tempOut, pth) != null)
                found++;
        }
        return found;
    }

    public static List<VirtualFile> GetFilesUnder(IList<VirtualFile> allFiles, string folderInternalPath) =>
        string.IsNullOrEmpty(folderInternalPath)
            ? new()
            : allFiles.Where(f => !f.IsFolder && f.FullPath.StartsWith(folderInternalPath + "/")).ToList();

    public static bool DecompressArchiveToDir(string archivePath, string outputDir)
    {
        Directory.CreateDirectory(outputDir);
        string args = $"decompress \"{archivePath}\" \"{outputDir}\"";
        var cachedPass = PassphraseManager.CachedPassphrase;
        if (!string.IsNullOrEmpty(cachedPass))
            args = $"decompress \"{archivePath}\" {PassphraseManager.BuildPassphraseArg(cachedPass)} \"{outputDir}\"";

        var (exit, stdout, stderr) = ProcessHelper.RunRox(args);
        Logger.Log($"DecompressArchiveToDir: exit={exit} stdout={stdout?.Trim()} stderr={stderr?.Trim()} hasEntries={ProcessHelper.DirectoryHasEntries(outputDir)}");

        if (PassphraseManager.NeedsPassphrase(stdout ?? "", stderr ?? "") && exit != 0)
            return RunPassphraseRetryLoop(archivePath, outputDir);

        return exit == 0;
    }

    public static string? FindExtractedFile(string tempOut, string internalPath)
    {
        var sourceRel = internalPath.Replace('/', Path.DirectorySeparatorChar);
        var sourceFull = Path.Combine(tempOut, sourceRel);
        if (File.Exists(sourceFull)) return sourceFull;

        var matches = Directory.GetFiles(tempOut, Path.GetFileName(internalPath), SearchOption.AllDirectories);
        return matches.Length > 0 ? matches[0] : null;
    }

    private static bool DecodeArchiveToDir(string archivePath, string outputDir)
    {
        string args = $"decompress \"{archivePath}\" \"{outputDir}\"";
        var cachedPass = PassphraseManager.CachedPassphrase;
        if (!string.IsNullOrEmpty(cachedPass))
            args = $"decompress \"{archivePath}\" {PassphraseManager.BuildPassphraseArg(cachedPass)} \"{outputDir}\"";

        var (exit, stdout, stderr) = ProcessHelper.RunRox(args);
        Logger.Log($"DecodeArchiveToDir: exit={exit} stdout={stdout?.Trim()} stderr={stderr?.Trim()} hasEntries={ProcessHelper.DirectoryHasEntries(outputDir)}");

        if (PassphraseManager.NeedsPassphrase(stdout ?? "", stderr ?? "") && exit != 0)
            return RunPassphraseRetryLoop(archivePath, outputDir);

        return exit == 0;
    }

    private static bool RunPassphraseRetryLoop(string archivePath, string outputDir)
    {
        string? errorMsg = null;
        while (true)
        {
            var pass = PassphraseManager.PromptForPassphrase(errorMsg);
            if (pass == null) return false;
            var passArg = PassphraseManager.BuildPassphraseArg(pass);
            var (exit, stdout, stderr) = ProcessHelper.RunRox($"decompress \"{archivePath}\" {passArg} \"{outputDir}\"");
            if (exit == 0) { PassphraseManager.Save(pass); return true; }
            if (PassphraseManager.IsDecryptionFailure(stdout, stderr)) { errorMsg = "Mot de passe incorrect"; continue; }
            return false;
        }
    }

    public static bool ExtractWithPassphraseLoop(string archivePath, string outputDir, string? initialPass = null)
    {
        string? pass = initialPass ?? PassphraseManager.CachedPassphrase;
        string? errorMsg = null;

        while (true)
        {
            if (string.IsNullOrEmpty(pass))
            {
                pass = PassphraseManager.PromptForPassphrase(errorMsg);
                if (pass == null) return false;
            }

            var passArg = PassphraseManager.BuildPassphraseArg(pass);
            var psi = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" {passArg} \"{outputDir}\"");

            int exit = ProcessHelper.RunWithProgress(
                "D\u00e9chiffrement en cours",
                "D\u00e9chiffrement en cours...",
                psi, out var stdout, out var stderr);

            if (exit == 0 && ProcessHelper.DirectoryHasEntries(outputDir))
            {
                PassphraseManager.Save(pass);
                return true;
            }

            if (PassphraseManager.IsDecryptionFailure(stdout, stderr))
            {
                if (PassphraseManager.CachedPassphrase == pass)
                    PassphraseManager.Clear();
                errorMsg = "Mot de passe incorrect";
                pass = null;
                continue;
            }

            Logger.Log($"ExtractWithPassphrase failed: exit={exit} stderr={stderr}");
            return false;
        }
    }

    private static bool HandleAccessDenied(string archivePath, string outputDir)
    {
        Logger.Log("Access denied detected, starting AV retry sequence");

        if (AntivirusHelper.RetryWithDelays(archivePath, outputDir))
            return true;

        var choice = AntivirusHelper.ShowDefenderPrompt();

        if (choice == DialogResult.Yes)
        {
            var roxDir = RoxRunner.GetRoxDirectory() ?? "";
            if (AntivirusHelper.TryAddDefenderExclusion(roxDir, out _) &&
                AntivirusHelper.RetryWithDelays(archivePath, outputDir))
                return true;
        }
        else if (choice == DialogResult.No)
        {
            try { Process.Start(new ProcessStartInfo("ms-settings:windowsdefender") { UseShellExecute = true }); } catch { }
            if (MessageBox.Show("Apr\u00e8s ajout de l'exclusion, cliquez R\u00e9essayer.",
                "Apr\u00e8s ajout manuel", MessageBoxButtons.RetryCancel, MessageBoxIcon.Information) == DialogResult.Retry
                && AntivirusHelper.RetryWithDelays(archivePath, outputDir))
                return true;
        }

        return ExtractViaTempDir(archivePath, outputDir);
    }

    public static bool ExtractViaTempDir(string archivePath, string outputDir)
    {
        var tempDir = TempHelper.CreateTempDir("pyxelze-extract");
        Logger.Log($"ExtractViaTempDir: {archivePath} -> temp={tempDir} -> final={outputDir}");

        try
        {
            var psi = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" \"{tempDir}\"");
            psi.WorkingDirectory = tempDir;

            int exit = ProcessHelper.RunWithProgress(
                "Extraction (contournement)",
                "Extraction via r\u00e9pertoire temporaire...",
                psi, out var stdout, out var stderr);

            if (PassphraseManager.NeedsPassphrase(stdout, stderr))
            {
                string? pass = PassphraseManager.CachedPassphrase;
                string? errorMsg = null;
                while (true)
                {
                    if (string.IsNullOrEmpty(pass))
                    {
                        pass = PassphraseManager.PromptForPassphrase(errorMsg);
                        if (pass == null) return false;
                    }

                    var passArg = PassphraseManager.BuildPassphraseArg(pass);
                    var psiP = RoxRunner.CreateRoxProcess($"decompress \"{archivePath}\" {passArg} \"{tempDir}\"");
                    psiP.WorkingDirectory = tempDir;

                    exit = ProcessHelper.RunWithProgress(
                        "D\u00e9chiffrement en cours", "D\u00e9chiffrement...",
                        psiP, out stdout, out stderr);

                    if (exit == 0 && ProcessHelper.DirectoryHasEntries(tempDir))
                    {
                        PassphraseManager.Save(pass);
                        break;
                    }
                    if (PassphraseManager.IsDecryptionFailure(stdout, stderr))
                    {
                        errorMsg = "Mot de passe incorrect";
                        pass = null;
                        continue;
                    }
                    return false;
                }
            }

            if (exit == 0 && ProcessHelper.DirectoryHasEntries(tempDir))
            {
                TempHelper.MoveContents(tempDir, outputDir);
                return true;
            }

            return false;
        }
        finally
        {
            TempHelper.SafeDelete(tempDir);
        }
    }

    private static bool CanWriteTo(string dir)
    {
        try
        {
            Directory.CreateDirectory(dir);
            var test = Path.Combine(dir, $".pyxelze_test_{Guid.NewGuid():N}");
            File.WriteAllText(test, "test");
            File.Delete(test);
            return true;
        }
        catch { return false; }
    }
}
