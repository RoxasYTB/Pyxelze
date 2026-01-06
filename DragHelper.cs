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

            // Prépare un dossier temporaire contenant les items sélectionnés.
            // Pour un fichier: copie le fichier source vers dragTempRoot\filename
            // Pour un dossier: utilise robocopy pour copier le dossier (très rapide) vers dragTempRoot\<foldername>
            public static IList<string> PrepareDragTempForSelection(Form1 owner, IList<string> internalPaths, string archiveExtractedRoot, string dragTempRoot)
            {
                  Directory.CreateDirectory(dragTempRoot);

                  var rels = internalPaths.Distinct().ToList();
                  var topLevelPaths = new List<string>();

                  using (var dlg = new ExtractionProgressForm(rels.Count))
                  {
                        dlg.RunExtraction(rels, async (internalPath, token) =>
                        {
                              try
                              {
                                    if (token.IsCancellationRequested) return await Task.FromResult(false);
                                    var rel = internalPath.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                                    // If selected is a folder (there is any entry in allFiles that is folder with this FullPath)
                                    var srcPath = Path.Combine(archiveExtractedRoot, rel);
                                    if (Directory.Exists(srcPath))
                                    {
                                          // destination is dragTempRoot\<folderName>
                                          var folderName = Path.GetFileName(rel.TrimEnd(Path.DirectorySeparatorChar));
                                          var destRoot = Path.Combine(dragTempRoot, folderName);
                                          Directory.CreateDirectory(destRoot);

                                          // robocopy source dest /E /MT:64 /R:1 /W:1 /NFL /NDL /NJH /NJS /nc /ns /np
                                          var args = $"\"{srcPath}\" \"{destRoot}\" /E /MT:64 /COPY:DAT /R:1 /W:1 /NFL /NDL /NJH /NJS /nc /ns /np";
                                          var psi = new System.Diagnostics.ProcessStartInfo
                                          {
                                                FileName = "robocopy",
                                                Arguments = args,
                                                UseShellExecute = false,
                                                CreateNoWindow = true,
                                                RedirectStandardOutput = true,
                                                RedirectStandardError = true
                                          };

                                          using (var p = System.Diagnostics.Process.Start(psi))
                                          {
                                                p!.WaitForExit();
                                                var rc = p.ExitCode;
                                                // robocopy exit codes: 0-7 are success
                                                if (rc <= 7)
                                                {
                                                      topLevelPaths.Add(destRoot);
                                                      return await Task.FromResult(true);
                                                }
                                                else
                                                {
                                                      try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Robocopy failed {srcPath} -> {destRoot}, exit={rc}{Environment.NewLine}"); } catch { }
                                                      return await Task.FromResult(false);
                                                }
                                          }
                                    }
                                    else if (File.Exists(srcPath))
                                    {
                                          var dest = Path.Combine(dragTempRoot, Path.GetFileName(srcPath));
                                          Directory.CreateDirectory(Path.GetDirectoryName(dest) ?? dragTempRoot);
                                          File.Copy(srcPath, dest, true);
                                          topLevelPaths.Add(dest);
                                          return await Task.FromResult(true);
                                    }
                                    else
                                    {
                                          try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] Source not found for {internalPath}{Environment.NewLine}"); } catch { }
                                          return await Task.FromResult(false);
                                    }
                              }
                              catch (Exception ex) { try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "pyxelze_dnd.log"), $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] PrepareDragTemp failed for {internalPath}: {ex.Message}{Environment.NewLine}"); } catch { } return await Task.FromResult(false); }
                        });
                  }

                  return topLevelPaths;
            }
      }
}
