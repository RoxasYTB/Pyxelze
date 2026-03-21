using Microsoft.Win32;

namespace Pyxelze;

internal class FileAssociationWatcher : IDisposable
{
    private readonly FileIconManager _iconManager;
    private readonly System.Threading.Timer _timer;

    public FileAssociationWatcher(FileIconManager iconManager)
    {
        _iconManager = iconManager;
        SystemEvents.UserPreferenceChanged += OnUserPreferenceChanged;
        _timer = new System.Threading.Timer(RefreshAllIcons, null, Timeout.Infinite, Timeout.Infinite);
    }

    private void OnUserPreferenceChanged(object sender, UserPreferenceChangedEventArgs e)
    {
        if (e.Category == UserPreferenceCategory.General)
            _timer.Change(2000, Timeout.Infinite);
    }

    private void RefreshAllIcons(object? state)
    {
        foreach (var ext in _iconManager.CachedExtensions)
            _iconManager.RefreshIcon(ext);
    }

    public void Dispose()
    {
        SystemEvents.UserPreferenceChanged -= OnUserPreferenceChanged;
        _timer?.Dispose();
    }
}
