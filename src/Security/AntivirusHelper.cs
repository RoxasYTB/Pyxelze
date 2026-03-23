using System.Diagnostics;

namespace Pyxelze;

internal static class AntivirusHelper
{
    private static readonly int[] RetryDelays = [2000, 5000, 10000, 15000, 20000];

    public static bool IsAccessDenied(string? error)
    {
        if (string.IsNullOrEmpty(error)) return false;
        return error.Contains(L.Get("antivirus.accessDenied")) || error.Contains("access denied") || error.Contains("os error 5");
    }

    public static bool RetryWithDelays(string archivePath, string outputDir, string command = "decode")
    {
        for (int i = 0; i < RetryDelays.Length; i++)
        {
            Logger.Log($"AV retry attempt {i + 1}/{RetryDelays.Length}");
            if (i > 0) Thread.Sleep(RetryDelays[i - 1]);

            var psi = RoxRunner.CreateRoxProcess($"{command} \"{archivePath}\" \"{outputDir}\"");
            psi.WorkingDirectory = outputDir;
            try { psi.EnvironmentVariables["TMP"] = outputDir; psi.EnvironmentVariables["TEMP"] = outputDir; } catch { }

            int exit = ProcessHelper.RunWithProgress(
                "Analyse antivirus en cours",
                $"Tentative {i + 1}/{RetryDelays.Length}...",
                psi, out _, out _);

            if (exit == 0 && ProcessHelper.DirectoryHasEntries(outputDir))
                return true;
        }
        return false;
    }

    public static DialogResult ShowDefenderPrompt()
    {
        return MessageBox.Show(
            L.Get("antivirus.message"),
            L.Get("antivirus.detected"),
            MessageBoxButtons.YesNoCancel,
            MessageBoxIcon.Question);
    }

    public static bool TryAddDefenderExclusion(string path, out string message)
    {
        message = string.Empty;
        if (string.IsNullOrEmpty(path)) { message = L.Get("antivirus.pathNotFound"); return false; }

        var ps = Path.Combine(Environment.SystemDirectory, "WindowsPowerShell\\v1.0\\powershell.exe");
        if (!File.Exists(ps)) { message = L.Get("antivirus.powershellNotFound"); return false; }

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = ps,
                Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"try {{ Add-MpPreference -ExclusionPath '{path}' -ErrorAction Stop; exit 0 }} catch {{ exit 1 }}\"",
                UseShellExecute = true,
                Verb = "runas",
                WindowStyle = ProcessWindowStyle.Hidden
            };

            var p = Process.Start(psi);
            if (p == null) { message = L.Get("antivirus.launchFailed"); return false; }
            p.WaitForExit();
            message = $"ExitCode={p.ExitCode}";
            return p.ExitCode == 0;
        }
        catch (Exception ex)
        {
            message = ex.Message;
            return false;
        }
    }
}
