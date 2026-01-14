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

            private void PerformPrepare()
            {
                  try
                  {
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PerformPrepare START - {dragSelection.Count} items to extract\n"); } catch { }
                        var toCopy = dragSelection.Select(v => v.FullPath).Distinct().ToList();
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Calling PrepareDragTempForSelection with {toCopy.Count} files\n"); } catch { }
                        var actualTopLevel = DragHelper.PrepareDragTempForSelection(owner, toCopy, tempRoot);
                        try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PrepareDragTempForSelection returned {actualTopLevel.Count} top-level paths\n"); } catch { }

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
      }
}
