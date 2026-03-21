namespace Pyxelze;

internal static class TempHelper
{
    public static string CreateTempDir(string prefix = "pyxelze")
    {
        var path = Path.Combine(Path.GetTempPath(), $"{prefix}-{Guid.NewGuid():N}");
        Directory.CreateDirectory(path);
        return path;
    }

    public static void SafeDelete(string path)
    {
        try { if (Directory.Exists(path)) Directory.Delete(path, true); }
        catch { }
    }

    public static void SafeDeleteFile(string path)
    {
        try { if (File.Exists(path)) File.Delete(path); }
        catch { }
    }

    public static void MoveContents(string sourceDir, string destDir)
    {
        Directory.CreateDirectory(destDir);
        foreach (var entry in Directory.EnumerateFileSystemEntries(sourceDir))
        {
            var name = Path.GetFileName(entry);
            var dest = Path.Combine(destDir, name);
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
    }

    public static void CopyDirectory(string sourceDir, string destinationDir)
    {
        Directory.CreateDirectory(destinationDir);
        foreach (var file in Directory.GetFiles(sourceDir))
            File.Copy(file, Path.Combine(destinationDir, Path.GetFileName(file)), true);
        foreach (var dir in Directory.GetDirectories(sourceDir))
            CopyDirectory(dir, Path.Combine(destinationDir, Path.GetFileName(dir)));
    }
}
