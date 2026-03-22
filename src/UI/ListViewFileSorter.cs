namespace Pyxelze;

internal class ListViewFileSorter : System.Collections.IComparer
{
    private readonly Func<int> _getColumn;
    private readonly Func<SortOrder> _getOrder;

    public ListViewFileSorter(Func<int> getColumn, Func<SortOrder> getOrder)
    {
        _getColumn = getColumn;
        _getOrder = getOrder;
    }

    public int Compare(object? x, object? y)
    {
        if (x is not ListViewItem a || y is not ListViewItem b) return 0;

        if (a.Tag?.ToString() == "UP") return -1;
        if (b.Tag?.ToString() == "UP") return 1;

        var vfA = a.Tag as VirtualFile;
        var vfB = b.Tag as VirtualFile;

        if (vfA?.IsFolder == true && vfB?.IsFolder != true) return -1;
        if (vfA?.IsFolder != true && vfB?.IsFolder == true) return 1;

        int col = _getColumn();
        int result = col switch
        {
            1 => (vfA?.Size ?? 0).CompareTo(vfB?.Size ?? 0),
            _ => string.Compare(
                a.SubItems.Count > col ? a.SubItems[col].Text : "",
                b.SubItems.Count > col ? b.SubItems[col].Text : "",
                StringComparison.OrdinalIgnoreCase)
        };

        return _getOrder() == SortOrder.Descending ? -result : result;
    }
}
