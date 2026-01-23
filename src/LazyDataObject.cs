using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Pyxelze
{
      public class LazyDataObject : DataObject, IDataObject
      {
            private readonly Form1 owner;
            private readonly string archivePath;
            private readonly List<VirtualFile> dragSelection;
            private readonly List<VirtualFile> allFiles;
            private readonly string tempRoot;

            private bool prepared = false;
            private readonly object prepareLock = new object();

            public LazyDataObject(Form1 owner, string archivePath, List<VirtualFile> dragSelection, List<VirtualFile> allFiles, string tempRoot)
            {
                  this.owner = owner;
                  this.archivePath = archivePath;
                  this.dragSelection = dragSelection;
                  this.allFiles = allFiles;
                  this.tempRoot = tempRoot;
            }

            public override string[] GetFormats(bool autoConvert)
            {
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] GetFormats(autoConvert={autoConvert})\n"); } catch { }
                  var baseFormats = base.GetFormats(autoConvert).ToList();
                  if (!baseFormats.Contains(DataFormats.FileDrop)) baseFormats.Insert(0, DataFormats.FileDrop);
                  return baseFormats.ToArray();
            }

            public override bool GetDataPresent(string format, bool autoConvert)
            {
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] GetDataPresent(format={format}, autoConvert={autoConvert})\n"); } catch { }
                  if (format == DataFormats.FileDrop) return true;
                  return base.GetDataPresent(format, autoConvert);
            }

            public override object? GetData(string format, bool autoConvert)
            {
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] GetData(format={format}, autoConvert={autoConvert}) - START\n"); } catch { }
                  if (format == DataFormats.FileDrop)
                  {
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Calling EnsurePrepared()\n"); } catch { }
                        EnsurePrepared();
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] EnsurePrepared() DONE\n"); } catch { }
                  }
                  var result = base.GetData(format, autoConvert);
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] GetData() - END (result={(result as string[])?.Length ?? 0} files)\n"); } catch { }
                  return result;
            }

            public override object? GetData(string format)
            {
                  return GetData(format, true);
            }

            private void EnsurePrepared()
            {
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] EnsurePrepared: prepared={prepared}\n"); } catch { }
                  if (prepared) return;
                  lock (prepareLock)
                  {
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] EnsurePrepared: locked, prepared={prepared}\n"); } catch { }
                        if (prepared) return;
                        PerformPrepare();
                        prepared = true;
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] EnsurePrepared: prepared=true, unlocking\n"); } catch { }
                  }
            }

            private DragHelper.ExtractionJob? extractionJob = null;

            private void PerformPrepare()
            {
                  try
                  {
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PerformPrepare START - {dragSelection.Count} items to extract\n"); } catch { }
                        var toCopy = dragSelection.GroupBy(v => v.FullPath).Select(g => g.First()).ToList();
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Calling PrepareDragTempForSelection with {toCopy.Count} items\n"); } catch { }
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        var (actualTopLevel, job) = DragHelper.PrepareDragTempForSelection(owner, toCopy, tempRoot);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                        extractionJob = job;
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PrepareDragTempForSelection returned {actualTopLevel.Count} top-level paths (job started)\n"); } catch { }

                        var arr = actualTopLevel.Count > 0 ? actualTopLevel.ToArray() : new string[0];
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Setting FileDrop data with {arr.Length} paths\n"); } catch { }
                        base.SetData(DataFormats.FileDrop, arr);
                        try
                        {
                              base.SetData("Preferred DropEffect", new System.IO.MemoryStream(BitConverter.GetBytes((uint)System.Windows.Forms.DragDropEffects.Copy)));
                        }
                        catch { }
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PerformPrepare END - SUCCESS\n"); } catch { }
                  }
                  catch (Exception ex)
                  {
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PerformPrepare EXCEPTION: {ex}\n"); } catch { }
                        try { base.SetData(DataFormats.FileDrop, new string[0]); } catch { }
                  }
            }

            public async Task FinalizeAfterDropAsync(DragDropEffects result)
            {
                  // Called by owner after DoDragDrop returns. If drop occurred and extraction is still running, show progress UI and wait.
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] FinalizeAfterDropAsync called, result={result}\n"); } catch { }
                  if (extractionJob == null) return;

                  if (result == DragDropEffects.None)
                  {
                        // No drop: cancel background extraction
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        try { extractionJob.Cts.Cancel(); } catch { }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] No drop occurred - cancelled extraction\n"); } catch { }
                        return;
                  }

                  // If extraction already finished, nothing to do
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                  if (extractionJob.Finished) return;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme

                  // Show progress UI and wait for completion (allows user to cancel)
                  try
                  {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        using (var dlg = new ExtractionProgressForm(extractionJob.Total))
                        {
                              // Start a task that updates the progress bar periodically
                              var progressTask = Task.Run(async () =>
                              {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                                    while (!extractionJob.Finished)
                                    {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                                          try { dlg.UpdateProgress(extractionJob.Completed); } catch { }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                                          await Task.Delay(150);
                                    }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                                    try { dlg.UpdateProgress(extractionJob.Completed); } catch { }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                              });

                              // Create placeholders so StartExtractionAsync iterates the expected number of steps
                              var placeholderFiles = new List<string>();
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                              for (int i = 0; i < extractionJob.Total; i++) placeholderFiles.Add(i.ToString());
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme

                              // Show dialog (modal) while background extraction runs. The extractFunc will wait until the background job reports progress.
                              await dlg.StartExtractionAsync(placeholderFiles, async (f, token) =>
                              {
                                    // f contains the index as string. Wait until background extraction has progressed to at least index+1
                                    if (!int.TryParse(f, out int idx)) idx = 0;
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                                    while (!extractionJob.Finished && extractionJob.Completed <= idx && !token.IsCancellationRequested)
                                    {
                                          await Task.Delay(50);
                                    }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                                    if (token.IsCancellationRequested) extractionJob.Cts.Cancel();
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                                    return await Task.FromResult(extractionJob.Completed > idx && extractionJob.Error == null);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                              });

                              await progressTask;
                        }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                  }
                  catch (Exception ex)
                  {
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] FinalizeAfterDropAsync error: {ex}\n"); } catch { }
                  }
            }
      }
}
