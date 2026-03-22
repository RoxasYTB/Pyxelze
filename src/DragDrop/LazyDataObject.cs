namespace Pyxelze;

internal class LazyDataObject : DataObject, IDataObject
{
    private readonly string archivePath;
    private readonly List<VirtualFile> dragSelection;
    private readonly List<VirtualFile> allFiles;
    private readonly string tempRoot;
    private bool prepared;
    private readonly object prepareLock = new();

    public LazyDataObject(string archivePath, List<VirtualFile> dragSelection,
        List<VirtualFile> allFiles, string tempRoot)
    {
        this.archivePath = archivePath;
        this.dragSelection = dragSelection;
        this.allFiles = allFiles;
        this.tempRoot = tempRoot;
    }

    public override string[] GetFormats(bool autoConvert)
    {
        var baseFormats = base.GetFormats(autoConvert).ToList();
        if (!baseFormats.Contains(DataFormats.FileDrop))
            baseFormats.Insert(0, DataFormats.FileDrop);
        return baseFormats.ToArray();
    }

    public override bool GetDataPresent(string format, bool autoConvert) =>
        format == DataFormats.FileDrop || base.GetDataPresent(format, autoConvert);

    public override object? GetData(string format, bool autoConvert)
    {
        if (format == DataFormats.FileDrop)
            EnsurePrepared();
        return base.GetData(format, autoConvert);
    }

    public override object? GetData(string format) => GetData(format, true);

    private void EnsurePrepared()
    {
        if (prepared) return;
        lock (prepareLock)
        {
            if (prepared) return;
            PerformPrepare();
            prepared = true;
        }
    }

    private void PerformPrepare()
    {
        try
        {
            Logger.LogDnd($"PerformPrepare START - {dragSelection.Count} items");
            var topLevelPaths = DragHelper.ExtractSelectionToDragTemp(
                archivePath, allFiles, dragSelection, tempRoot);

            base.SetData(DataFormats.FileDrop, topLevelPaths.Count > 0 ? topLevelPaths.ToArray() : Array.Empty<string>());
            try
            {
                base.SetData("Preferred DropEffect",
                    new MemoryStream(BitConverter.GetBytes((uint)DragDropEffects.Copy)));
            }
            catch { }
            Logger.LogDnd($"PerformPrepare END - {topLevelPaths.Count} paths");
        }
        catch (Exception ex)
        {
            Logger.LogDnd($"PerformPrepare EXCEPTION: {ex}");
            try { base.SetData(DataFormats.FileDrop, Array.Empty<string>()); } catch { }
        }
    }
}
