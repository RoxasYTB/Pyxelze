namespace Pyxelze;

internal static class Logger
{
    private static readonly string _logPath = Path.Combine(Path.GetTempPath(), "pyxelze.log");
    private static readonly object _lock = new();

    public static string LogPath => _logPath;

    public static void Log(string text)
    {
        WriteEntry(text);
    }

    public static void LogDnd(string text)
    {
        WriteEntry($"[DND] {text}");
    }

    private static void WriteEntry(string text)
    {
        lock (_lock)
        {
            try { File.AppendAllText(_logPath, $"[{DateTime.Now:O}] {text}\n"); }
            catch { }
        }
    }
}
