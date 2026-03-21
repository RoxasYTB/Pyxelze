namespace Pyxelze;

internal static class DragHelper
{
    public class ExtractionJob
    {
        public Task WorkTask = Task.CompletedTask;
        public CancellationTokenSource Cts = new();
        public int Total;
        public int Completed;
        public List<string> ExtractedPaths = new();
        public HashSet<string> TopLevelPaths = new(StringComparer.OrdinalIgnoreCase);
        public bool Finished;
        public Exception? Error;
    }

    public static IList<string> PrepareExtractedFilePaths(string archivePath, IList<string> internalPaths, string tempRoot)
    {
        Directory.CreateDirectory(tempRoot);
        var selectedItems = internalPaths.Distinct().ToList();
        var actual = new List<string>();

        using var dlg = new ExtractionProgressForm(selectedItems.Count);
        dlg.RunExtraction(selectedItems, async (internalPath, token) =>
        {
            if (token.IsCancellationRequested) return false;
            var rel = internalPath.Replace('/', Path.DirectorySeparatorChar);
            var outPath = Path.Combine(tempRoot, rel);
            Directory.CreateDirectory(Path.GetDirectoryName(outPath) ?? tempRoot);
            var ok = ExtractionService.ExtractFileSingle(archivePath, internalPath, outPath);
            if (ok && File.Exists(outPath)) actual.Add(outPath);
            return await Task.FromResult(ok);
        });

        return actual;
    }

    public static (IList<string>, ExtractionJob) PrepareDragTempForSelection(
        string archivePath, IList<VirtualFile> allFiles, IList<VirtualFile> selection, string dragTempRoot)
    {
        Logger.LogDnd($"PrepareDragTempForSelection: creating {dragTempRoot}");
        Directory.CreateDirectory(dragTempRoot);

        var selectedItems = selection.GroupBy(v => v.FullPath).Select(g => g.First()).ToList();
        var topLevelPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        CreatePlaceholders(selectedItems, dragTempRoot, topLevelPaths);

        var job = new ExtractionJob { Total = selectedItems.Count };

        Logger.LogDnd($"Starting background extraction for {selectedItems.Count} items");

        job.WorkTask = Task.Run(() =>
        {
            try
            {
                int i = 0;
                foreach (var vf in selectedItems)
                {
                    if (job.Cts.IsCancellationRequested) break;
                    Logger.LogDnd($"Background Extracting: {vf.FullPath}");

                    if (vf.IsFolder)
                        ExtractFolder(archivePath, allFiles, vf, selectedItems, dragTempRoot, job);
                    else
                        ExtractFile(archivePath, vf, selectedItems, dragTempRoot, job);

                    i++;
                    job.Completed = i;
                }
                job.Finished = true;
            }
            catch (Exception ex)
            {
                job.Error = ex;
                job.Finished = true;
                Logger.LogDnd($"Background extraction error: {ex}");
            }
        });

        Logger.LogDnd($"Background extraction started (topLevelPaths={topLevelPaths.Count})");
        return (topLevelPaths.ToList(), job);
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

    private static void CreatePlaceholders(List<VirtualFile> selectedItems, string dragTempRoot,
        HashSet<string> topLevelPaths)
    {
        foreach (var v in selectedItems)
        {
            var parts = v.FullPath.Split('/');
            if (parts.Length == 0) continue;

            try
            {
                if (v.IsFolder)
                {
                    var top = Path.Combine(dragTempRoot, parts[0]);
                    try { Directory.CreateDirectory(top); topLevelPaths.Add(top); } catch { }
                }
                else if (parts.Length == 1)
                {
                    CreateFilePlaceholder(dragTempRoot, parts[0], topLevelPaths);
                }
                else
                {
                    if (HasParentFolderInSelection(v.FullPath, selectedItems))
                    {
                        var top = Path.Combine(dragTempRoot, parts[0]);
                        try { Directory.CreateDirectory(top); topLevelPaths.Add(top); } catch { }
                    }
                    else
                    {
                        CreateFilePlaceholder(dragTempRoot, Path.GetFileName(v.FullPath), topLevelPaths);
                    }
                }
            }
            catch { }
        }
    }

    private static void CreateFilePlaceholder(string root, string fileName, HashSet<string> topLevelPaths)
    {
        var topFile = Path.Combine(root, fileName);
        try
        {
            if (Directory.Exists(topFile)) try { Directory.Delete(topFile, true); } catch { }
            if (!File.Exists(topFile)) File.WriteAllBytes(topFile, []);
            topLevelPaths.Add(topFile);
        }
        catch { }
    }

    private static void ExtractFolder(string archivePath, IList<VirtualFile> allFiles,
        VirtualFile vf, List<VirtualFile> selectedItems, string dragTempRoot, ExtractionJob job)
    {
        try
        {
            var filesUnder = ExtractionService.GetFilesUnder(allFiles, vf.FullPath);
            if (filesUnder.Count == 0)
            {
                var folderRel = vf.FullPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                try { Directory.CreateDirectory(Path.Combine(dragTempRoot, folderRel)); } catch { }
                AddTopLevel(vf.FullPath, dragTempRoot, job);
                return;
            }

            foreach (var f in filesUnder)
            {
                if (job.Cts.IsCancellationRequested) break;
                var origPath = string.IsNullOrEmpty(f.OriginalPath) ? f.FullPath : f.OriginalPath;
                var relFile = f.FullPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                var outPath = Path.Combine(dragTempRoot, relFile);
                try { Directory.CreateDirectory(Path.GetDirectoryName(outPath) ?? dragTempRoot); } catch { }
                var ok = ExtractionService.ExtractFileSingle(archivePath, origPath, outPath);
                if (ok && File.Exists(outPath)) job.ExtractedPaths.Add(outPath);
            }
            AddTopLevel(vf.FullPath, dragTempRoot, job);
        }
        catch (Exception ex)
        {
            Logger.LogDnd($"ExtractFolder error: {ex}");
        }
    }

    private static void ExtractFile(string archivePath, VirtualFile vf, List<VirtualFile> selectedItems,
        string dragTempRoot, ExtractionJob job)
    {
        var relFile = vf.FullPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
        bool hasParent = HasParentFolderInSelection(vf.FullPath, selectedItems);
        string fileName = Path.GetFileName(relFile);
        string outFile = hasParent ? Path.Combine(dragTempRoot, relFile) : Path.Combine(dragTempRoot, fileName);

        try { Directory.CreateDirectory(Path.GetDirectoryName(outFile) ?? dragTempRoot); } catch { }

        var ok = ExtractionService.ExtractFileSingle(archivePath, string.IsNullOrEmpty(vf.OriginalPath) ? vf.FullPath : vf.OriginalPath, outFile);
        Logger.LogDnd($"Background ExtractFileSingle returned: {ok}, file exists: {File.Exists(outFile)}");

        if (!ok || !File.Exists(outFile)) return;

        job.ExtractedPaths.Add(outFile);
        if (hasParent)
        {
            var parts = relFile.Split(Path.DirectorySeparatorChar);
            if (parts.Length > 0) job.TopLevelPaths.Add(Path.Combine(dragTempRoot, parts[0]));
        }
        else
        {
            job.TopLevelPaths.Add(outFile);
        }
    }

    private static void AddTopLevel(string internalPath, string dragTempRoot, ExtractionJob job)
    {
        var parts = internalPath.Split('/');
        if (parts.Length > 0) job.TopLevelPaths.Add(Path.Combine(dragTempRoot, parts[0]));
    }
}
