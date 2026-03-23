namespace Pyxelze;

internal static class CompressionService
{
    public static bool CompressDirectory(string dirPath, string? outputFile = null)
    {
        outputFile ??= Path.Combine(Path.GetDirectoryName(dirPath) ?? "", Path.GetFileName(dirPath) + ".png");
        Logger.Log($"CompressDirectory: {dirPath} -> {outputFile}");

        var pass = PassphrasePrompt.Prompt(
            L.Get("compression.passphraseTitle"),
            L.Get("compression.passphrasePrompt"));
        if (pass == null) return false;

        var passArg = string.IsNullOrEmpty(pass) ? "" : $" {PassphraseManager.BuildPassphraseArg(pass)}";
        var psi = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{outputFile}\"{passArg}");

        int exit = ProcessHelper.RunWithProgress(
            L.Get("compression.encoding"),
            L.Get("compression.encodingFile", Path.GetFileName(dirPath)),
            psi, out var stdout, out var stderr);

        if (exit == 0 && File.Exists(outputFile))
            return true;

        if (AntivirusHelper.IsAccessDenied(stderr))
            return CompressViaTempFile(dirPath, outputFile, passArg);

        return false;
    }

    private static bool CompressViaTempFile(string dirPath, string outputFile, string passArg)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"pyxelze-encode-{Guid.NewGuid():N}.png");
        Logger.Log($"CompressViaTempFile: {dirPath} -> {tempFile}");

        var psi = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{tempFile}\"{passArg}");

        int exit = ProcessHelper.RunWithProgress(
            L.Get("compression.fallback"),
            L.Get("compression.fallbackProgress"),
            psi, out _, out _);

        if (exit == 0 && File.Exists(tempFile))
        {
            try
            {
                if (File.Exists(outputFile)) File.Delete(outputFile);
                File.Move(tempFile, outputFile);
                return true;
            }
            catch (Exception ex)
            {
                Logger.Log($"CompressViaTempFile move failed: {ex}");
            }
        }

        TempHelper.SafeDeleteFile(tempFile);
        return false;
    }
}
