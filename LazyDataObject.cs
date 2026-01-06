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
            private readonly string archiveExtractedRoot;

            private bool prepared = false;
            private readonly object prepareLock = new object();

            public LazyDataObject(Form1 owner, string archivePath, List<VirtualFile> dragSelection, List<VirtualFile> allFiles, string tempRoot, string archiveExtractedRoot)
            {
                  this.owner = owner;
                  this.archivePath = archivePath;
                  this.dragSelection = dragSelection;
                  this.allFiles = allFiles;
                  this.tempRoot = tempRoot;
                  this.archiveExtractedRoot = archiveExtractedRoot;
            }

            public override string[] GetFormats(bool autoConvert)
            {
                  var baseFormats = base.GetFormats(autoConvert).ToList();
                  if (!baseFormats.Contains(DataFormats.FileDrop)) baseFormats.Insert(0, DataFormats.FileDrop);
                  return baseFormats.ToArray();
            }

            public override bool GetDataPresent(string format, bool autoConvert)
            {
                  if (format == DataFormats.FileDrop) return true;
                  return base.GetDataPresent(format, autoConvert);
            }

            public override object? GetData(string format, bool autoConvert)
            {
                  if (format == DataFormats.FileDrop)
                  {
                        EnsurePrepared();
                  }
                  return base.GetData(format, autoConvert);
            }

            public override object? GetData(string format)
            {
                  return GetData(format, true);
            }

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
                        var toCopy = dragSelection.Select(v => v.FullPath).Distinct().ToList();
                        var actualTopLevel = DragHelper.PrepareDragTempForSelection(owner, toCopy, archiveExtractedRoot, tempRoot);

                        var arr = actualTopLevel.Count > 0 ? actualTopLevel.ToArray() : new string[0];
                        base.SetData(DataFormats.FileDrop, arr);
                        try
                        {
                              base.SetData("Preferred DropEffect", new System.IO.MemoryStream(BitConverter.GetBytes((uint)System.Windows.Forms.DragDropEffects.Copy)));
                        }
                        catch { }
                  }
                  catch { try { base.SetData(DataFormats.FileDrop, new string[0]); } catch { } }
            }
      }
}
