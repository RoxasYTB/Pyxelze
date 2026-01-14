using System.Collections.Concurrent;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using Microsoft.Win32;

namespace Pyxelze
{
      internal class FileIconManager : IDisposable
      {
            private readonly ConcurrentDictionary<string, CachedIcon> _iconCache = new();
            private readonly ImageList _imageList;
            private readonly System.Threading.Timer _cacheCleanupTimer;
            private readonly object _updateLock = new();
            private readonly Action<string> _onIconChanged;

            private class CachedIcon
            {
                  public Bitmap SourceBitmap { get; set; } = null!;
                  public DateTime LastAccessed { get; set; }
                  public bool IsValid { get; set; } = true;
            }

            public FileIconManager(ImageList imageList, Action<string> onIconChanged)
            {
                  _imageList = imageList;
                  _onIconChanged = onIconChanged;
                  _cacheCleanupTimer = new System.Threading.Timer(CleanupCache, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
            }

            public string GetIconKey(string fileName, bool isFolder)
            {
                  return isFolder ? "folder" : Path.GetExtension(fileName).ToLower();
            }

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
                              var sourceBitmap = GetSourceBitmap(fileName, isFolder, new Size(32, 32));

                              _iconCache[key] = new CachedIcon
                              {
                                    SourceBitmap = sourceBitmap,
                                    LastAccessed = DateTime.Now,
                                    IsValid = true
                              };

                              if (_imageList.Images.ContainsKey(key))
                              {
                                    _imageList.Images.RemoveByKey(key);
                              }

                              _imageList.Images.Add(key, ResizeTo(sourceBitmap, _imageList.ImageSize));
                        }
                        catch
                        {
                              if (!_imageList.Images.ContainsKey("file"))
                              {
                                    var fallback = GetSourceBitmap("file.txt", false, new Size(32, 32));
                                    _iconCache[key] = new CachedIcon
                                    {
                                          SourceBitmap = fallback,
                                          LastAccessed = DateTime.Now,
                                          IsValid = true
                                    };
                                    _imageList.Images.Add(key, ResizeTo(fallback, _imageList.ImageSize));
                              }
                        }
                  }
            }

            public void RefreshIcon(string extension)
            {
                  string key = extension.ToLower();

                  if (_iconCache.TryGetValue(key, out var cached))
                  {
                        cached.IsValid = false;
                  }

                  lock (_updateLock)
                  {
                        if (_imageList.Images.ContainsKey(key))
                        {
                              _imageList.Images.RemoveByKey(key);
                        }

                        if (_iconCache.TryRemove(key, out var oldCached))
                        {
                              oldCached.SourceBitmap?.Dispose();
                        }
                  }

                  _onIconChanged?.Invoke(key);
            }

            public void RefreshAllIcons()
            {
                  var keys = _iconCache.Keys.ToList();
                  foreach (var key in keys)
                  {
                        RefreshIcon(key);
                  }
            }

            private void CleanupCache(object? state)
            {
                  var threshold = DateTime.Now.AddMinutes(-10);
                  var keysToRemove = _iconCache
                      .Where(kvp => kvp.Value.LastAccessed < threshold)
                      .Select(kvp => kvp.Key)
                      .ToList();

                  foreach (var key in keysToRemove)
                  {
                        if (_iconCache.TryRemove(key, out var cached))
                        {
                              cached.SourceBitmap?.Dispose();
                        }
                  }
            }

            private static Bitmap GetSourceBitmap(string path, bool isFolder, Size srcSize)
            {
                  var ico = NativeMethods.GetIcon(path, isFolder, large: false);
                  var bmp = new Bitmap(srcSize.Width, srcSize.Height, PixelFormat.Format32bppArgb);
                  using (var g = Graphics.FromImage(bmp))
                  {
                        g.Clear(Color.Transparent);
                        g.CompositingMode = CompositingMode.SourceOver;
                        g.CompositingQuality = CompositingQuality.HighQuality;
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.SmoothingMode = SmoothingMode.HighQuality;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.DrawIcon(ico, new Rectangle(0, 0, srcSize.Width, srcSize.Height));
                  }
                  return bmp;
            }

            private static Bitmap ResizeTo(Image src, Size size)
            {
                  var dest = new Bitmap(size.Width, size.Height, PixelFormat.Format32bppArgb);
                  using (var g = Graphics.FromImage(dest))
                  {
                        g.Clear(Color.Transparent);
                        g.CompositingMode = CompositingMode.SourceOver;
                        g.CompositingQuality = CompositingQuality.HighQuality;
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.SmoothingMode = SmoothingMode.HighQuality;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.DrawImage(src, 0, 0, size.Width, size.Height);
                  }
                  return dest;
            }

            public void Dispose()
            {
                  _cacheCleanupTimer?.Dispose();

                  foreach (var cached in _iconCache.Values)
                  {
                        cached.SourceBitmap?.Dispose();
                  }

                  _iconCache.Clear();
            }
      }
}
