// See https://aka.ms/new-console-template for more information
using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

// Test: instantiate Form1, populate it with sample files, and verify icons and lazy extraction

namespace dnd_test
{
      internal static class Program
      {
            [STAThread]
            static void Main()
            {
                  AppDomain.CurrentDomain.SetData("APP_CONFIG_FILE", "");

                  // Run UI-affecting code on STA thread
                  var t = new Thread(() =>
                  {
                        try
                        {
                              var formType = typeof(Pyxelze.Form1);
                              var form = (Form)Activator.CreateInstance(formType, new object?[] { (string?)null })!;

                              // Add sample files via reflection
                              var allFilesField = formType.GetField("allFiles", BindingFlags.NonPublic | BindingFlags.Instance);
                              var files = new System.Collections.Generic.List<Pyxelze.VirtualFile>
            {
                  new Pyxelze.VirtualFile { FullPath = "file_a.txt", Name = "file_a.txt", IsFolder = false, Size = 123 },
                  new Pyxelze.VirtualFile { FullPath = "folder1", Name = "folder1", IsFolder = true, Size = 0 },
                  new Pyxelze.VirtualFile { FullPath = "folder1/file_b.png", Name = "file_b.png", IsFolder = false, Size = 456 }
            };
                              if (allFilesField != null) allFilesField.SetValue(form, files);

                              // Force refresh (call private RefreshView)
                              var refresh = formType.GetMethod("RefreshView", BindingFlags.NonPublic | BindingFlags.Instance);
                              if (refresh != null) refresh.Invoke(form, Array.Empty<object?>());

                              // Inspect ImageList
                              var imageListField = formType.GetField("smallImageList", BindingFlags.NonPublic | BindingFlags.Instance);
                              var ilObj = imageListField?.GetValue(form);
                              if (ilObj is ImageList il)
                              {
                                    Console.WriteLine($"ImageList contains {il.Images.Count} images. Size: {il.ImageSize.Width}x{il.ImageSize.Height}");
                              }
                              else Console.WriteLine("ImageList not available");

                              // Verify source cache sizes
                              var cacheField = formType.GetField("iconSourceCache", BindingFlags.NonPublic | BindingFlags.Instance);
                              var cacheObj = cacheField?.GetValue(form);
                              if (cacheObj is System.Collections.IDictionary cache)
                              {
                                    foreach (var key in cache.Keys)
                                    {
                                          var img = cache[key] as Image;
                                          if (img != null) Console.WriteLine($"Cache[{key}] = {img.Width}x{img.Height}");
                                    }
                              }
                              else Console.WriteLine("Icon cache not available");

                              // Test LazyDataObject extraction
                              var dragSelection = new System.Collections.Generic.List<Pyxelze.VirtualFile> { files[0] };
                              var tempRoot = Path.Combine(Path.GetTempPath(), "pyxelze_test_" + Guid.NewGuid().ToString());
                              var lazy = new Pyxelze.LazyDataObject((Pyxelze.Form1)form, "", dragSelection, files, tempRoot);

                              Console.WriteLine("Formats present: " + string.Join(",", lazy.GetFormats(true)));
                              var present = lazy.GetDataPresent(DataFormats.FileDrop);
                              Console.WriteLine("GetDataPresent(FileDrop) = " + present);

                              var data = lazy.GetData(DataFormats.FileDrop) as string[];
                              Console.WriteLine("Extracted paths count: " + (data?.Length ?? 0));
                              if (data != null)
                              {
                                    foreach (var p in data) Console.WriteLine("Extracted: " + p + " exist=" + File.Exists(p));
                              }

                              // Check Preferred DropEffect
                              try
                              {
                                    var stream = lazy.GetData("Preferred DropEffect") as System.IO.Stream;
                                    if (stream != null)
                                    {
                                          byte[] buf = new byte[4];
                                          stream.Read(buf, 0, 4);
                                          uint val = BitConverter.ToUInt32(buf, 0);
                                          Console.WriteLine("Preferred DropEffect: " + val);
                                    }
                                    else Console.WriteLine("Preferred DropEffect not set");
                              }
                              catch (Exception ex) { Console.WriteLine("Preferred DropEffect read error: " + ex.Message); }

                              // Clean up
                              try { Directory.Delete(tempRoot, true); } catch { }

                              Application.Exit();
                        }
                        catch (Exception ex)
                        {
                              Console.WriteLine("Test exception: " + ex);
                        }
                  });
                  t.SetApartmentState(ApartmentState.STA);
                  t.Start();
                  t.Join();
            }
      }
}
