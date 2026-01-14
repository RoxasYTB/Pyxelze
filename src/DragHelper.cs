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
            public static IList<string> PrepareDragTempForSelection(Form1 owner, IList<string> internalPaths, string dragTempRoot)
            {
                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PrepareDragTempForSelection: creating {dragTempRoot}\n"); } catch { }
                  Directory.CreateDirectory(dragTempRoot);

                  var rels = internalPaths.Distinct().ToList();
                  var extractedPaths = new List<string>();
                  var topLevelPaths = new HashSet<string>();

                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Creating ExtractionProgressForm for {rels.Count} files\n"); } catch { }

                  using (var dlg = new ExtractionProgressForm(rels.Count))
                  {
                        dlg.RunExtraction(rels, async (internalPath, token) =>
                        {
                              try
                              {
                                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Extracting: {internalPath}\n"); } catch { }
                                    if (token.IsCancellationRequested)
                                    {
                                          try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Extraction cancelled\n"); } catch { }
                                          return await Task.FromResult(false);
                                    }

                                    var rel = internalPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                                    var outPath = Path.Combine(dragTempRoot, rel);
                                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Output path: {outPath}\n"); } catch { }
                                    Directory.CreateDirectory(Path.GetDirectoryName(outPath) ?? dragTempRoot);

                                    var ok = owner.ExtractFileSingle(internalPath, outPath);
                                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] ExtractFileSingle returned: {ok}, file exists: {File.Exists(outPath)}\n"); } catch { }
                                    if (ok && File.Exists(outPath))
                                    {
                                          extractedPaths.Add(outPath);
                                          // Ajouter uniquement le chemin de premier niveau (fichier direct ou premier dossier)
                                          var parts = rel.Split(Path.DirectorySeparatorChar);
                                          if (parts.Length > 0)
                                          {
                                                var topLevel = Path.Combine(dragTempRoot, parts[0]);
                                                topLevelPaths.Add(topLevel);
                                                try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Added top-level: {topLevel}\n"); } catch { }
                                          }
                                          return await Task.FromResult(true);
                                    }
                                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Extraction failed or file not found\n"); } catch { }
                                    return await Task.FromResult(false);
                              }
                              catch (Exception ex)
                              {
                                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PrepareDragTemp failed for {internalPath}: {ex.Message}\n{ex.StackTrace}\n"); } catch { }
                                    return await Task.FromResult(false);
                              }
                        });
                  }

                  try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Extraction complete: {extractedPaths.Count} extracted, {topLevelPaths.Count} top-level\n"); } catch { }
                  return topLevelPaths.ToList();
            }
      }
}
