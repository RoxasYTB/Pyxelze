namespace Pyxelze;

internal class LazyDataObject : DataObject, IDataObject
{
    private readonly string archivePath;
    private readonly List<VirtualFile> dragSelection;
    private readonly List<VirtualFile> allFiles;
    private readonly string tempRoot;
    private bool prepared;
    private readonly object prepareLock = new();
    private DragHelper.ExtractionJob? extractionJob;

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
        Logger.LogDnd($"GetFormats(autoConvert={autoConvert})");
        var baseFormats = base.GetFormats(autoConvert).ToList();
        if (!baseFormats.Contains(DataFormats.FileDrop))
            baseFormats.Insert(0, DataFormats.FileDrop);
        return baseFormats.ToArray();
    }

    public override bool GetDataPresent(string format, bool autoConvert)
    {
        Logger.LogDnd($"GetDataPresent(format={format}, autoConvert={autoConvert})");
        return format == DataFormats.FileDrop || base.GetDataPresent(format, autoConvert);
    }

    public override object? GetData(string format, bool autoConvert)
    {
        Logger.LogDnd($"GetData(format={format}, autoConvert={autoConvert}) - START");
        if (format == DataFormats.FileDrop)
        {
            Logger.LogDnd("Calling EnsurePrepared()");
            EnsurePrepared();
            Logger.LogDnd("EnsurePrepared() DONE");
        }
        var result = base.GetData(format, autoConvert);
        Logger.LogDnd($"GetData() - END (result={(result as string[])?.Length ?? 0} files)");
        return result;
    }

    public override object? GetData(string format) => GetData(format, true);

    private void EnsurePrepared()
    {
        Logger.LogDnd($"EnsurePrepared: prepared={prepared}");
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
            Logger.LogDnd($"PerformPrepare START - {dragSelection.Count} items to extract");
            var toCopy = dragSelection.GroupBy(v => v.FullPath).Select(g => g.First()).ToList();

            var (actualTopLevel, job) = DragHelper.PrepareDragTempForSelection(archivePath, allFiles, toCopy, tempRoot);
            extractionJob = job;
            Logger.LogDnd($"PrepareDragTempForSelection returned {actualTopLevel.Count} top-level paths");

            var arr = actualTopLevel.Count > 0 ? actualTopLevel.ToArray() : [];
            base.SetData(DataFormats.FileDrop, arr);
            try
            {
                base.SetData("Preferred DropEffect",
                    new MemoryStream(BitConverter.GetBytes((uint)DragDropEffects.Copy)));
            }
            catch { }
            Logger.LogDnd("PerformPrepare END - SUCCESS");
        }
        catch (Exception ex)
        {
            Logger.LogDnd($"PerformPrepare EXCEPTION: {ex}");
            try { base.SetData(DataFormats.FileDrop, Array.Empty<string>()); } catch { }
        }
    }

    public async Task FinalizeAfterDropAsync(DragDropEffects result)
    {
        Logger.LogDnd($"FinalizeAfterDropAsync called, result={result}");
        if (extractionJob == null) return;

        if (result == DragDropEffects.None)
        {
            try { extractionJob.Cts.Cancel(); } catch { }
            Logger.LogDnd("No drop occurred - cancelled extraction");
            return;
        }

        if (extractionJob.Finished) return;

        try
        {
            using var dlg = new ExtractionProgressForm(extractionJob.Total);
            var progressTask = Task.Run(async () =>
            {
                while (!extractionJob.Finished)
                {
                    try { dlg.UpdateProgress(extractionJob.Completed); } catch { }
                    await Task.Delay(150);
                }
                try { dlg.UpdateProgress(extractionJob.Completed); } catch { }
            });

            var placeholderFiles = Enumerable.Range(0, extractionJob.Total).Select(i => i.ToString()).ToList();

            await dlg.StartExtractionAsync(placeholderFiles, async (f, token) =>
            {
                if (!int.TryParse(f, out int idx)) idx = 0;
                while (!extractionJob.Finished && extractionJob.Completed <= idx && !token.IsCancellationRequested)
                    await Task.Delay(50);
                if (token.IsCancellationRequested) extractionJob.Cts.Cancel();
                return extractionJob.Completed > idx && extractionJob.Error == null;
            });

            await progressTask;
        }
        catch (Exception ex)
        {
            Logger.LogDnd($"FinalizeAfterDropAsync error: {ex}");
        }
    }
}
