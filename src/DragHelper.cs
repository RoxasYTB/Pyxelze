using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Pyxelze
{
      internal static class DragHelper
      {
            private static bool HasParentFolderInSelection(string filePath, IList<VirtualFile> selection)
            {
                  var parts = filePath.Split('/');
                  for (int i = 1; i < parts.Length; i++)
                  {
                        var parentPath = string.Join("/", parts.Take(i));
                        if (selection.Any(v => v.IsFolder && v.FullPath == parentPath))
                              return true;
                  }
                  return false;
            }

            public static IList<string> PrepareExtractedFilePaths(Form1 owner, IList<string> internalPaths, string tempRoot)
            {
                  // Legacy: keep for compatibility (extract individual files via ExtractFileSingle)
                  Directory.CreateDirectory(tempRoot);

                  var rels = internalPaths.Distinct().ToList();
                  var actual = new List<string>();

                  using (var dlg = new ExtractionProgressForm(rels.Count))
                  {
                        dlg.RunExtraction(rels, async (internalPath, token) =>
                        {
                              try
                              {
                                    if (token.IsCancellationRequested) return await Task.FromResult(false);
                                    var rel = internalPath.Replace('/', Path.DirectorySeparatorChar);
                                    var outPath = Path.Combine(tempRoot, rel);
                                    Directory.CreateDirectory(Path.GetDirectoryName(outPath) ?? tempRoot);
                                    var ok = owner.ExtractFileSingle(internalPath, outPath);
                                    if (ok && File.Exists(outPath)) actual.Add(outPath);
                                    return await Task.FromResult(ok);
                              }
                              catch { return await Task.FromResult(false); }
                        });
                  }

                  return actual;
            }

            // Prépare un dossier temporaire contenant les items sélectionnés en utilisant --files.
            // Extrait les fichiers en préservant leur structure mais retourne uniquement les chemins de premier niveau
            public class ExtractionJob
            {
                  public Task WorkTask = Task.CompletedTask;
                  public CancellationTokenSource Cts = new CancellationTokenSource();
                  public int Total = 0;
                  public int Completed = 0;
                  public List<string> ExtractedPaths = new List<string>();
                  public HashSet<string> TopLevelPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                  public bool Finished = false;
                  public Exception? Error = null;
            }

            public static (IList<string>, ExtractionJob) PrepareDragTempForSelection(Form1 owner, IList<VirtualFile> internalPaths, string dragTempRoot)
            {
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PrepareDragTempForSelection: creating {dragTempRoot}\n"); } catch { }
                  Directory.CreateDirectory(dragTempRoot);

                  var rels = internalPaths.GroupBy(v => v.FullPath).Select(g => g.First()).ToList();
                  var extractedPaths = new List<string>();
                  var topLevelPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                  // Create visible top-level directories or file placeholders immediately so Explorer has something to reference
                  foreach (var v in rels)
                  {
                        var parts = v.FullPath.Split('/');
                        if (parts.Length == 0) continue;

                        try
                        {
                              // If the selection item is an explicit folder, create that top-level folder
                              if (v.IsFolder)
                              {
                                    var top = Path.Combine(dragTempRoot, parts[0]);
                                    try { Directory.CreateDirectory(top); topLevelPaths.Add(top); } catch { }
                                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Placeholder folder created: {top}\n"); } catch { }
                              }
                              else if (parts.Length == 1)
                              {
                                    // A top-level file (e.g., package.json) — create an empty file placeholder
                                    var topFile = Path.Combine(dragTempRoot, parts[0]);
                                    try
                                    {
                                          if (Directory.Exists(topFile)) { try { Directory.Delete(topFile, true); } catch { } }
                                          if (!File.Exists(topFile)) File.WriteAllBytes(topFile, new byte[0]);
                                          topLevelPaths.Add(topFile);
                                          try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Placeholder file created: {topFile}\n"); } catch { }
                                    }
                                    catch { }
                              }
                              else
                              {
                                    // Nested file — check if parent folder is selected
                                    bool hasParent = HasParentFolderInSelection(v.FullPath, rels);
                                    if (hasParent)
                                    {
                                          // Create the containing top-level folder so Explorer sees a folder
                                          var top = Path.Combine(dragTempRoot, parts[0]);
                                          try { Directory.CreateDirectory(top); topLevelPaths.Add(top); } catch { }
                                          try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Placeholder top-level folder for nested file created: {top}\n"); } catch { }
                                    }
                                    else
                                    {
                                          // No parent selected, create file placeholder at root
                                          var fileName = Path.GetFileName(v.FullPath.Replace('/', Path.DirectorySeparatorChar));
                                          var topFile = Path.Combine(dragTempRoot, fileName);
                                          try
                                          {
                                                if (Directory.Exists(topFile)) { try { Directory.Delete(topFile, true); } catch { } }
                                                if (!File.Exists(topFile)) File.WriteAllBytes(topFile, new byte[0]);
                                                topLevelPaths.Add(topFile);
                                                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Placeholder file at root created: {topFile}\n"); } catch { }
                                          }
                                          catch { }
                                    }
                              }
                        }
                        catch { }
                  }

                  var job = new ExtractionJob();
                  job.Total = rels.Count;

                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Starting background extraction for {rels.Count} items\n"); } catch { }

                  // Start background extraction without showing UI. We'll only show UI if drop actually occurs and extraction hasn't finished.
                  job.WorkTask = Task.Run(async () =>
                  {
                        try
                        {
                              int i = 0;
                              foreach (var vf in rels)
                              {
                                    if (job.Cts.IsCancellationRequested) break;
                                    var internalPath = vf.FullPath;
                                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background Extracting: {internalPath}\n"); } catch { }

                                    if (vf.IsFolder)
                                    {
                                          var filesUnder = owner.GetFilesUnder(internalPath);
                                          if (filesUnder.Count == 0)
                                          {
                                                // ensure empty folder folder exists (already created top-level)
                                                var folderRel = internalPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                                                var top = Path.Combine(dragTempRoot, folderRel);
                                                try { Directory.CreateDirectory(top); } catch { }
                                                var parts = internalPath.Split('/');
                                                if (parts.Length > 0)
                                                {
                                                      var topLevel = Path.Combine(dragTempRoot, parts[0]);
                                                      job.TopLevelPaths.Add(topLevel);
                                                      try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Added empty top-level (folder): {topLevel}\n"); } catch { }
                                                }
                                          }
                                          else
                                          {
                                                var filePaths = filesUnder.Select(f => f.FullPath).ToList();
                                                int extracted = owner.ExtractMultipleFiles(filePaths, dragTempRoot);
                                                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background Batch extracted {extracted}/{filePaths.Count} files\n"); } catch { }

                                                if (extracted > 0)
                                                {
                                                      foreach (var f in filesUnder)
                                                      {
                                                            var rel = f.FullPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                                                            var outPath = Path.Combine(dragTempRoot, rel);
                                                            if (File.Exists(outPath)) job.ExtractedPaths.Add(outPath);
                                                      }
                                                      var parts = internalPath.Split('/');
                                                      if (parts.Length > 0)
                                                      {
                                                            var topLevel = Path.Combine(dragTempRoot, parts[0]);
                                                            job.TopLevelPaths.Add(topLevel);
                                                            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Added top-level (folder): {topLevel}\n"); } catch { }
                                                      }
                                                }
                                                else
                                                {
                                                      try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background folder extraction failed or no files for {internalPath}\n"); } catch { }
                                                }
                                          }
                                    }
                                    else
                                    {
                                          var relFile = internalPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                                          bool hasParent = HasParentFolderInSelection(internalPath, rels);
                                          string outFile;
                                          string fileName = Path.GetFileName(relFile);
                                          if (hasParent) outFile = Path.Combine(dragTempRoot, relFile);
                                          else outFile = Path.Combine(dragTempRoot, fileName);

                                          try { Directory.CreateDirectory(Path.GetDirectoryName(outFile) ?? dragTempRoot); } catch { }
                                          var okFile = owner.ExtractFileSingle(internalPath, outFile);
                                          try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background ExtractFileSingle returned: {okFile}, file exists: {File.Exists(outFile)}\n"); } catch { }
                                          if (okFile && File.Exists(outFile))
                                          {
                                                job.ExtractedPaths.Add(outFile);
                                                if (hasParent)
                                                {
                                                      var parts = relFile.Split(Path.DirectorySeparatorChar);
                                                      if (parts.Length > 0)
                                                      {
                                                            var topLevel = Path.Combine(dragTempRoot, parts[0]);
                                                            job.TopLevelPaths.Add(topLevel);
                                                            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background Added top-level: {topLevel}\n"); } catch { }
                                                      }
                                                }
                                                else
                                                {
                                                      job.TopLevelPaths.Add(outFile);
                                                      try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background Added flat file: {outFile}\n"); } catch { }
                                                }
                                          }
                                    }

                                    i++;
                                    job.Completed = i;
                              }
                              job.Finished = true;
                        }
                        catch (Exception ex)
                        {
                              job.Error = ex;
                              job.Finished = true;
                              try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background extraction error: {ex}\n"); } catch { }
                        }
                  });

                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Background extraction started (topLevelPaths={topLevelPaths.Count})\n"); } catch { }
                  return (topLevelPaths.ToList(), job);
            }
      }
}
