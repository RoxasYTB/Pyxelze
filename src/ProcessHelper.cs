using System.Diagnostics;

namespace Pyxelze;

internal static class ProcessHelper
{
    public static (int exitCode, string stdout, string stderr) RunRox(string arguments, int timeoutMs = 30000)
    {
        var psi = RoxRunner.CreateRoxProcess(arguments);
        return RunProcess(psi, timeoutMs);
    }

    public static (int exitCode, string stdout, string stderr) RunProcess(ProcessStartInfo psi, int timeoutMs = 30000)
    {
        psi.UseShellExecute = false;
        psi.CreateNoWindow = true;
        psi.RedirectStandardOutput = true;
        psi.RedirectStandardError = true;

        using var p = Process.Start(psi);
        if (p == null) return (-1, "", "Impossible de démarrer le processus");

        var outTask = Task.Run(() => p.StandardOutput.ReadToEnd());
        var errTask = Task.Run(() => p.StandardError.ReadToEnd());

        bool exited = p.WaitForExit(timeoutMs);
        if (!exited)
        {
            try { p.Kill(); } catch { }
            return (-1, "", "Timeout");
        }

        Task.WaitAll(new[] { outTask, errTask }, 2000);
        return (p.ExitCode, outTask.Result ?? "", errTask.Result ?? "");
    }

    public static int RunWithProgress(string title, string message, ProcessStartInfo psi, out string stdout, out string stderr)
    {
        using var f = new ProcessProgressForm(title, message);
        return f.RunProcess(psi, out stdout, out stderr);
    }

    public static bool DirectoryHasEntries(string path) =>
        Directory.Exists(path) && Directory.EnumerateFileSystemEntries(path).Any();
}
