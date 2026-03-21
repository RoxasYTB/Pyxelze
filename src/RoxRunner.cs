using System.Diagnostics;

namespace Pyxelze;

internal static class RoxRunner
{
    private static readonly string? _roxExePath;

    static RoxRunner()
    {
        var roxifyDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "roxify");
        var roxExe = Path.Combine(roxifyDir, "roxify_native.exe");
        if (File.Exists(roxExe)) _roxExePath = roxExe;
    }

    public static ProcessStartInfo CreateRoxProcess(string arguments)
    {
        if (!string.IsNullOrEmpty(_roxExePath))
            return BuildPsi(_roxExePath, arguments);

        throw new InvalidOperationException("roxify_native.exe introuvable");
    }

    public static bool IsAvailable() => !string.IsNullOrEmpty(_roxExePath);

    public static string? GetRoxDirectory() =>
        string.IsNullOrEmpty(_roxExePath) ? null : Path.GetDirectoryName(_roxExePath);

    public static string? GetRoxPath() => _roxExePath;

    public static bool TryCheckRox(out string error)
    {
        error = string.Empty;
        try
        {
            var (exit, _, stderr) = ProcessHelper.RunRox("--version", 5000);
            if (exit == 0) return true;
            error = !string.IsNullOrEmpty(stderr) ? stderr : $"Exit code {exit}";
            return false;
        }
        catch (Exception ex)
        {
            error = $"Erreur: {ex.Message}";
            return false;
        }
    }

    public static List<string> GetFileList(string archivePath)
    {
        if (string.IsNullOrEmpty(archivePath) || !File.Exists(archivePath))
            return new();

        var (exit, stdout, _) = ProcessHelper.RunRox($"list \"{archivePath}\"", 10000);
        if (exit == 0 && !string.IsNullOrEmpty(stdout))
            return ArchiveParser.ParseFileNames(stdout);

        return new();
    }

    private static ProcessStartInfo BuildPsi(string fileName, string arguments) => new()
    {
        FileName = fileName,
        Arguments = arguments,
        UseShellExecute = false,
        CreateNoWindow = true,
        RedirectStandardOutput = true,
        RedirectStandardError = true
    };
}
