namespace Pyxelze;

internal class ExtendedListView : ListView
{
    private const int WM_ERASEBKGND = 0x0014;

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_ERASEBKGND)
            return;
        base.WndProc(ref m);
    }
}
