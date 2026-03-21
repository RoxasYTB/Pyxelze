using System.Collections.Concurrent;
using System.Drawing.Imaging;

namespace Pyxelze;

internal class FileIconManager : IDisposable
{
    private readonly ConcurrentDictionary<string, CachedIcon> _iconCache = new();
    private readonly ImageList _imageList;
    private readonly ImageList? _largeImageList;
    private readonly System.Threading.Timer _cacheCleanupTimer;
    private readonly object _updateLock = new();
    private readonly Action<string> _onIconChanged;

    private class CachedIcon
    {
        public Bitmap SourceBitmap { get; set; } = null!;
        public DateTime LastAccessed { get; set; }
        public bool IsValid { get; set; } = true;
    }

    public FileIconManager(ImageList imageList, ImageList? largeImageList, Action<string> onIconChanged)
    {
        _imageList = imageList;
        _largeImageList = largeImageList;
        _onIconChanged = onIconChanged;
        _cacheCleanupTimer = new System.Threading.Timer(CleanupCache, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));

        AddDefaultIcon("folder", "C:\\", true);
        AddDefaultIcon("file", "file.txt", false);
    }

    private static Bitmap CreatePaddedIcon(Image src, Size targetSize)
    {
        int iconW = Math.Min(targetSize.Width, targetSize.Height) - 4;
        var padded = new Bitmap(targetSize.Width, targetSize.Height, System.Drawing.Imaging.PixelFormat.Format32bppPArgb);
        using var g = Graphics.FromImage(padded);
        g.Clear(Color.Transparent);
        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
        g.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
        int x = (targetSize.Width - iconW) / 2;
        int y = (targetSize.Height - iconW) / 2;
        g.DrawImage(src, x, y, iconW, iconW);
        return padded;
    }

    private void AddDefaultIcon(string key, string path, bool isFolder)
    {
        try
        {
            var bmp = IconHelper.GetSourceBitmap(path, isFolder, new Size(16, 16));
            _iconCache[key] = new CachedIcon { SourceBitmap = bmp, LastAccessed = DateTime.Now };
            if (!_imageList.Images.ContainsKey(key))
                _imageList.Images.Add(key, CreatePaddedIcon(bmp, _imageList.ImageSize));
            if (_largeImageList != null && !_largeImageList.Images.ContainsKey(key))
            {
                var largeBmp = IconHelper.GetSourceBitmap(path, isFolder, _largeImageList.ImageSize);
                _largeImageList.Images.Add(key, largeBmp);
            }
        }
        catch { }
    }

    public string GetIconKey(string fileName, bool isFolder) =>
        isFolder ? "folder" : Path.GetExtension(fileName).ToLower();

    public void EnsureIconLoaded(string fileName, bool isFolder)
    {
        string key = GetIconKey(fileName, isFolder);
        if (_imageList.Images.ContainsKey(key) && _iconCache.TryGetValue(key, out var cached) && cached.IsValid)
        {
            cached.LastAccessed = DateTime.Now;
            return;
        }
        LoadIcon(fileName, isFolder, key);
    }

    private void LoadIcon(string fileName, bool isFolder, string key)
    {
        lock (_updateLock)
        {
            try
            {
                var sourceBitmap = IconHelper.GetSourceBitmap(fileName, isFolder, new Size(32, 32));
                _iconCache[key] = new CachedIcon { SourceBitmap = sourceBitmap, LastAccessed = DateTime.Now };

                if (_imageList.Images.ContainsKey(key))
                    _imageList.Images.RemoveByKey(key);
                _imageList.Images.Add(key, CreatePaddedIcon(sourceBitmap, _imageList.ImageSize));

                if (_largeImageList != null)
                {
                    var largeSrc = IconHelper.GetSourceBitmap(fileName, isFolder, _largeImageList.ImageSize);
                    if (_largeImageList.Images.ContainsKey(key))
                        _largeImageList.Images.RemoveByKey(key);
                    _largeImageList.Images.Add(key, largeSrc);
                }
            }
            catch
            {
                if (!_imageList.Images.ContainsKey("file"))
                {
                    var fallback = IconHelper.GetSourceBitmap("file.txt", false, new Size(32, 32));
                    _iconCache[key] = new CachedIcon { SourceBitmap = fallback, LastAccessed = DateTime.Now };
                    _imageList.Images.Add(key, CreatePaddedIcon(fallback, _imageList.ImageSize));
                }
            }
        }
    }

    public void RefreshIcon(string extension)
    {
        string key = extension.ToLower();
        if (_iconCache.TryGetValue(key, out var cached)) cached.IsValid = false;

        lock (_updateLock)
        {
            if (_imageList.Images.ContainsKey(key))
                _imageList.Images.RemoveByKey(key);
            if (_iconCache.TryRemove(key, out var old))
                old.SourceBitmap?.Dispose();
        }

        if (!string.IsNullOrEmpty(key) && key != "folder")
            LoadIcon("dummy" + key, false, key);

        _onIconChanged?.Invoke(key);
    }

    public IEnumerable<string> CachedExtensions =>
        _iconCache.Keys.Where(k => k.StartsWith("."));

    private void CleanupCache(object? state)
    {
        var threshold = DateTime.Now.AddMinutes(-10);
        foreach (var key in _iconCache.Where(kvp => kvp.Value.LastAccessed < threshold).Select(kvp => kvp.Key).ToList())
        {
            if (_iconCache.TryRemove(key, out var cached))
                cached.SourceBitmap?.Dispose();
        }
    }

    public void Dispose()
    {
        _cacheCleanupTimer?.Dispose();
        foreach (var cached in _iconCache.Values)
            cached.SourceBitmap?.Dispose();
        _iconCache.Clear();
    }
}
