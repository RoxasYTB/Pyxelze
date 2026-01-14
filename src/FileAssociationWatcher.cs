using Microsoft.Win32;

namespace Pyxelze
{
      internal class FileAssociationWatcher : IDisposable
      {
            private readonly FileIconManager _iconManager;
            private readonly System.Threading.Timer _pollTimer;
            private readonly Dictionary<string, DateTime> _lastModified = new();
            private const string HKCR_PATH = @"HKEY_CLASSES_ROOT";

            public FileAssociationWatcher(FileIconManager iconManager)
            {
                  _iconManager = iconManager;
                  _pollTimer = new System.Threading.Timer(CheckAssociations, null, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
            }

            private void CheckAssociations(object? state)
            {
                  try
                  {
                        var extensions = GetMonitoredExtensions();
                        bool anyChanged = false;

                        foreach (var ext in extensions)
                        {
                              if (HasAssociationChanged(ext))
                              {
                                    _iconManager.RefreshIcon(ext);
                                    anyChanged = true;
                              }
                        }

                        if (anyChanged)
                        {
                              System.Diagnostics.Debug.WriteLine("File associations changed, icons refreshed");
                        }
                  }
                  catch
                  {
                  }
            }

            private List<string> GetMonitoredExtensions()
            {
                  var extensions = new List<string>
            {
                ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx",
                ".jpg", ".jpeg", ".png", ".gif", ".bmp",
                ".mp3", ".mp4", ".avi", ".mkv",
                ".zip", ".rar", ".7z",
                ".exe", ".dll", ".bat", ".cmd"
            };
                  return extensions;
            }

            private bool HasAssociationChanged(string extension)
            {
                  if (!OperatingSystem.IsWindows()) return false;

                  try
                  {
                        using (var key = Registry.ClassesRoot.OpenSubKey(extension))
                        {
                              if (key == null) return false;

                              var defaultValue = key.GetValue("")?.ToString() ?? "";
                              var lastWrite = DateTime.Now;

                              if (!_lastModified.ContainsKey(extension))
                              {
                                    _lastModified[extension] = lastWrite;
                                    return false;
                              }

                              if (_lastModified[extension] != lastWrite)
                              {
                                    _lastModified[extension] = lastWrite;
                                    return true;
                              }
                        }
                  }
                  catch
                  {
                  }

                  return false;
            }

            public void Dispose()
            {
                  _pollTimer?.Dispose();
            }
      }
}
