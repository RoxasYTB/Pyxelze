using System;
using System.Collections;
using System.IO;

namespace Pyxelze
{
      public class ListViewFileSorter : IComparer
      {
            private Func<int> getSortColumn;
            private Func<System.Windows.Forms.SortOrder> getSortOrder;

            public ListViewFileSorter(Func<int> getSortColumn, Func<System.Windows.Forms.SortOrder> getSortOrder)
            {
                  this.getSortColumn = getSortColumn;
                  this.getSortOrder = getSortOrder;
            }

            public int Compare(object? x, object? y)
            {
                  var ix = x as System.Windows.Forms.ListViewItem;
                  var iy = y as System.Windows.Forms.ListViewItem;
                  if (ix == null || iy == null) return 0;
                  var a = ix.Tag as VirtualFile;
                  var b = iy.Tag as VirtualFile;
                  if (a == null || b == null) return string.Compare(ix.Text, iy.Text, StringComparison.OrdinalIgnoreCase);

                  // Folders always first
                  if (a.IsFolder && !b.IsFolder) return -1;
                  if (!a.IsFolder && b.IsFolder) return 1;

                  int col = getSortColumn();
                  var order = getSortOrder();

                  int cmp = 0;
                  switch (col)
                  {
                        case 0: // Name
                              cmp = string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase);
                              break;
                        case 1: // Size
                              cmp = a.Size.CompareTo(b.Size);
                              break;
                        case 2: // Type/extension
                              cmp = string.Compare(Path.GetExtension(a.Name), Path.GetExtension(b.Name), StringComparison.OrdinalIgnoreCase);
                              break;
                        default:
                              cmp = string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase);
                              break;
                  }

                  if (order == System.Windows.Forms.SortOrder.Descending) cmp = -cmp;
                  return cmp;
            }
      }
}
