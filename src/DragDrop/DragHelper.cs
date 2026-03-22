using System.Runtime.InteropServices;

namespace Pyxelze;

internal static class DragHelper
{
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern int GetShortPathName(string lpszLongPath, char[] lpszShortPath, int cchBuffer);

    public static IList<string> ExtractSelectionToDragTemp(
        string archivePath, IList<VirtualFile> allFiles, IList<VirtualFile> selection, string dragTempRoot)
    {
        Logger.LogDnd($"ExtractSelectionToDragTemp: {selection.Count} items -> {dragTempRoot}");
        Directory.CreateDirectory(dragTempRoot);

        var selectedItems = selection.GroupBy(v => v.FullPath).Select(g => g.First()).ToList();
        var extractTemp = TempHelper.CreateTempDir("pyxelze_drag_extract");

        try
        {
            if (!ExtractionService.DecompressArchiveToDir(archivePath, extractTemp))
            {
                Logger.LogDnd("DecompressArchiveToDir failed");
                return [];
            }

            var topLevelPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var vf in selectedItems)
            {
                if (vf.IsFolder)
                    CopyFolderFromExtracted(allFiles, vf, extractTemp, dragTempRoot, selectedItems, topLevelPaths);
                else
                    CopyFileFromExtracted(vf, extractTemp, dragTempRoot, selectedItems, topLevelPaths);
            }

            var result = topLevelPaths.Select(GetSafeDropPath).ToList();
            Logger.LogDnd($"ExtractSelectionToDragTemp done: {result.Count} top-level paths");
            return result;
        }
        finally
        {
            TempHelper.SafeDelete(extractTemp);
        }
    }

    private static string GetSafeDropPath(string path)
    {
        try
        {
            var buffer = new char[1024];
            int len = GetShortPathName(path, buffer, buffer.Length);
            if (len > 0)
                return new string(buffer, 0, len);
        }
        catch { }
        return path;
    }

    private static void CopyFolderFromExtracted(
        IList<VirtualFile> allFiles, VirtualFile vf, string extractTemp,
        string dragTempRoot, List<VirtualFile> selectedItems, HashSet<string> topLevelPaths)
    {
        var filesUnder = ExtractionService.GetFilesUnder(allFiles, vf.FullPath);
        var folderRel = vf.FullPath.Replace('/', Path.DirectorySeparatorChar);

        if (filesUnder.Count == 0)
        {
            try { Directory.CreateDirectory(Path.Combine(dragTempRoot, folderRel)); } catch { }
            AddTopLevel(vf.FullPath, dragTempRoot, topLevelPaths);
            return;
        }

        foreach (var f in filesUnder)
        {
            var relFile = f.FullPath.Replace('/', Path.DirectorySeparatorChar);
            var sourcePath = FindInExtracted(extractTemp, f);
            if (sourcePath == null) continue;

            var outPath = Path.Combine(dragTempRoot, relFile);
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(outPath) ?? dragTempRoot);
                File.Copy(sourcePath, outPath, true);
            }
            catch { }
        }
        AddTopLevel(vf.FullPath, dragTempRoot, topLevelPaths);
    }

    private static void CopyFileFromExtracted(
        VirtualFile vf, string extractTemp, string dragTempRoot,
        List<VirtualFile> selectedItems, HashSet<string> topLevelPaths)
    {
        var sourcePath = FindInExtracted(extractTemp, vf);
        if (sourcePath == null) return;

        var relFile = vf.FullPath.Replace('/', Path.DirectorySeparatorChar);
        bool hasParent = HasParentFolderInSelection(vf.FullPath, selectedItems);
        string outFile = hasParent
            ? Path.Combine(dragTempRoot, relFile)
            : Path.Combine(dragTempRoot, Path.GetFileName(relFile));

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(outFile) ?? dragTempRoot);
            File.Copy(sourcePath, outFile, true);
        }
        catch { return; }

        if (hasParent)
        {
            var parts = relFile.Split(Path.DirectorySeparatorChar);
            if (parts.Length > 0) topLevelPaths.Add(Path.Combine(dragTempRoot, parts[0]));
        }
        else
        {
            topLevelPaths.Add(outFile);
        }
    }

    private static string? FindInExtracted(string extractTemp, VirtualFile vf)
    {
        var origPath = string.IsNullOrEmpty(vf.OriginalPath) ? vf.FullPath : vf.OriginalPath;
        var rel = origPath.Replace('/', Path.DirectorySeparatorChar);
        var full = Path.Combine(extractTemp, rel);
        if (File.Exists(full)) return full;

        var matches = Directory.GetFiles(extractTemp, Path.GetFileName(origPath), SearchOption.AllDirectories);
        return matches.Length > 0 ? matches[0] : null;
    }

    private static bool HasParentFolderInSelection(string filePath, IList<VirtualFile> selection)
    {
        var parts = filePath.Split('/');
        for (int i = 1; i < parts.Length; i++)
        {
            var parentPath = string.Join("/", parts.Take(i));
            if (selection.Any(v => v.IsFolder && v.FullPath == parentPath))
                return true;
        }
        return false;
    }

    private static void AddTopLevel(string internalPath, string dragTempRoot, HashSet<string> topLevelPaths)
    {
        var parts = internalPath.Split('/');
        if (parts.Length > 0) topLevelPaths.Add(Path.Combine(dragTempRoot, parts[0]));
    }
}
