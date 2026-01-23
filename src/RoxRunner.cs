using System.Diagnostics;
using System.Text.Json;

namespace Pyxelze;

internal static class RoxRunner
{
      private static string? _roxExePath;
      private static string? _nodeExePath;
      private static string? _bundlePath;

      static RoxRunner()
      {
            var appDir = AppDomain.CurrentDomain.BaseDirectory;

            var roxExe = Path.Combine(appDir, "roxify", "roxify_native.exe");
            if (File.Exists(roxExe))
            {
                  _roxExePath = roxExe;
            }

            var nodeExe = Path.Combine(appDir, "tools", "roxify", "node.exe");
            if (File.Exists(nodeExe))
            {
                  _nodeExePath = nodeExe;
            }

            var bundle = Path.Combine(appDir, "tools", "roxify", "build", "rox-bundle.cjs");
            if (File.Exists(bundle))
            {
                  _bundlePath = bundle;
            }
      }

      public static ProcessStartInfo CreateRoxProcess(string arguments)
      {
            if (!string.IsNullOrEmpty(_roxExePath))
            {
                  return new ProcessStartInfo
                  {
                        FileName = _roxExePath,
                        Arguments = arguments,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                  };
            }

            if (!string.IsNullOrEmpty(_nodeExePath) && !string.IsNullOrEmpty(_bundlePath))
            {
                  return new ProcessStartInfo
                  {
                        FileName = _nodeExePath,
                        Arguments = $"\"{_bundlePath}\" {arguments}",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                  };
            }

            throw new InvalidOperationException("Ni roxify_native.exe ni le bundle node ne sont disponibles");
      }

      public static bool TryCheckRox(out string error)
      {
            error = string.Empty;
            try
            {
                  var psi = CreateRoxProcess("--version");
                  using (var p = Process.Start(psi))
                  {
                        if (p == null)
                        {
                              error = "Impossible de démarrer le processus roxify";
                              return false;
                        }

                        bool exited = p.WaitForExit(5000);
                        if (!exited)
                        {
                              try { p.Kill(); } catch { }
                              error = "Timeout: roxify n'a pas répondu dans les 5 secondes";
                              return false;
                        }

                        var stdout = p.StandardOutput.ReadToEnd();
                        var stderr = p.StandardError.ReadToEnd();

                        if (p.ExitCode == 0)
                        {
                              return true;
                        }

                        error = !string.IsNullOrEmpty(stderr) ? stderr : $"Process exited with code {p.ExitCode}";
                        if (!string.IsNullOrEmpty(stdout))
                        {
                              error += "\nOutput: " + stdout;
                        }

                        try
                        {
                              var roxExe = _roxExePath ?? _bundlePath ?? _nodeExePath ?? string.Empty;
                              if (!string.IsNullOrEmpty(roxExe))
                              {
                                    var log = Path.Combine(Path.GetDirectoryName(roxExe) ?? string.Empty, "rox.err.txt");
                                    if (File.Exists(log))
                                    {
                                          var t = File.ReadAllText(log);
                                          error += "\nLogs:\n" + t;
                                    }
                              }
                        }
                        catch { }
                        return false;
                  }
            }
            catch (Exception ex)
            {
                  error = $"Erreur lors du lancement de roxify: {ex.Message}";
                  if (!string.IsNullOrEmpty(_roxExePath))
                  {
                        error += $"\nChemin roxify: {_roxExePath}";
                  }
                  return false;
            }
      }

      public static bool IsRoxAvailable()
      {
            return !string.IsNullOrEmpty(_roxExePath)
                   || (!string.IsNullOrEmpty(_nodeExePath) && !string.IsNullOrEmpty(_bundlePath));
      }

      public static string? GetRoxDirectory()
      {
            var exe = _roxExePath ?? _bundlePath ?? _nodeExePath ?? string.Empty;
            if (string.IsNullOrEmpty(exe)) return null;
            return Path.GetDirectoryName(exe);
      }

      public static string? GetRoxPath()
      {
            return _roxExePath;
      }

      public static List<string> GetFileList(string archivePath)
      {
            var results = new List<string>();
            try
            {
                  Program.AppendLog($"GetFileList start: {archivePath}");
            }
            catch { }

            if (string.IsNullOrEmpty(archivePath) || !File.Exists(archivePath))
            {
                  try { Program.AppendLog("GetFileList: archive missing or path invalid"); } catch { }
                  return results;
            }

            // First attempt: run normal 'list' using CreateRoxProcess
            try
            {
                  var psi = CreateRoxProcess($"list \"{archivePath}\"");
                  psi.WorkingDirectory = Path.GetDirectoryName(archivePath) ?? string.Empty;
                  try { psi.EnvironmentVariables["TMP"] = psi.EnvironmentVariables["TEMP"] = Path.GetDirectoryName(archivePath) ?? Path.GetTempPath(); } catch { }

                  using (var p = Process.Start(psi))
                  {
                        var stdout = p!.StandardOutput.ReadToEnd();
                        var stderr = p.StandardError.ReadToEnd();
                        p.WaitForExit(10000);
                        try { Program.AppendLog($"rox list attempt1: exit={p.ExitCode} stdout_len={stdout?.Length ?? 0} stderr_len={stderr?.Length ?? 0}"); } catch { }
                        try
                        {
                              if (!string.IsNullOrEmpty(stdout))
                              {
                                    var preview = stdout.Length > 500 ? stdout.Substring(0, 500) : stdout;
                                    preview = preview.Replace('\r', ' ').Replace('\n', ' ');
                                    try { Program.AppendLog($"rox list attempt1 preview: '{preview}'"); } catch { }
                              }
                        }
                        catch { }

                        if (p.ExitCode == 0 && !string.IsNullOrEmpty(stdout))
                        {
                              // Try parse JSON first (rox list may output JSON array of {name,size})
                              bool parsed = false;
                              try
                              {
                                    using var doc = JsonDocument.Parse(stdout);
                                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                                    {
                                          foreach (var el in doc.RootElement.EnumerateArray())
                                          {
                                                if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty("name", out var nameEl))
                                                {
                                                      var nm = nameEl.GetString();
                                                      if (!string.IsNullOrEmpty(nm)) results.Add(nm);
                                                }
                                          }
                                          if (results.Count > 0)
                                          {
                                                parsed = true;
                                                try { Program.AppendLog($"GetFileList JSON parsed: {results.Count} entries (attempt1)"); } catch { }
                                                return results;
                                          }
                                    }
                              }
                              catch (Exception exJson)
                              {
                                    try { Program.AppendLog($"GetFileList JSON parse failed (attempt1): {exJson.Message}"); } catch { }
                              }

                              if (!parsed)
                              {
                                    foreach (var line in stdout.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                                    {
                                          var m = System.Text.RegularExpressions.Regex.Match(line, @"^(.+?)\s+\(\d+\s+bytes\)");
                                          if (m.Success) results.Add(m.Groups[1].Value.Trim());
                                    }
                                    if (results.Count > 0)
                                    {
                                          try { Program.AppendLog($"GetFileList: found {results.Count} entries on attempt1 (regex fallback)"); } catch { }
                                          return results;
                                    }
                              }
                        }
                  }
            }
            catch (Exception ex)
            {
                  try { Program.AppendLog($"GetFileList attempt1 exception: {ex.Message}"); } catch { }
            }

            // Second attempt: copy rox executable to temp location and run it there (helps with AV / Zone.Identifier issues)
            try
            {
                  var roxPath = GetRoxPath() ?? string.Empty;
                  if (!string.IsNullOrEmpty(roxPath) && File.Exists(roxPath))
                  {
                        string tempDir = Path.Combine(Path.GetTempPath(), "pyxelze-rox-list");
                        Directory.CreateDirectory(tempDir);
                        var tempExe = Path.Combine(tempDir, "roxify_list_" + Guid.NewGuid().ToString("N") + ".exe");
                        File.Copy(roxPath, tempExe, true);
                        try { File.SetAttributes(tempExe, FileAttributes.Normal); } catch { }
                        try { File.Delete(tempExe + ":Zone.Identifier"); } catch { }

                        var psi2 = new ProcessStartInfo
                        {
                              FileName = tempExe,
                              Arguments = $"list \"{archivePath}\"",
                              UseShellExecute = false,
                              CreateNoWindow = true,
                              RedirectStandardOutput = true,
                              RedirectStandardError = true,
                              WorkingDirectory = tempDir
                        };
                        try { psi2.EnvironmentVariables["TMP"] = psi2.EnvironmentVariables["TEMP"] = tempDir; } catch { }

                        using (var p2 = Process.Start(psi2))
                        {
                              var stdout = p2!.StandardOutput.ReadToEnd();
                              var stderr = p2.StandardError.ReadToEnd();
                              p2.WaitForExit(10000);
                              try { Program.AppendLog($"rox list attempt2: exit={p2.ExitCode} stdout_len={stdout?.Length ?? 0} stderr_len={stderr?.Length ?? 0}"); } catch { }
                              try
                              {
                                    if (!string.IsNullOrEmpty(stdout))
                                    {
                                          var preview = stdout.Length > 500 ? stdout.Substring(0, 500) : stdout;
                                          preview = preview.Replace('\r', ' ').Replace('\n', ' ');
                                          try { Program.AppendLog($"rox list attempt2 preview: '{preview}'"); } catch { }
                                    }
                              }
                              catch { }

                              if (p2.ExitCode == 0 && !string.IsNullOrEmpty(stdout))
                              {
                                    // Try parse JSON first
                                    bool parsed2 = false;
                                    try
                                    {
                                          using var doc2 = JsonDocument.Parse(stdout);
                                          if (doc2.RootElement.ValueKind == JsonValueKind.Array)
                                          {
                                                foreach (var el in doc2.RootElement.EnumerateArray())
                                                {
                                                      if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty("name", out var nameEl))
                                                      {
                                                            var nm = nameEl.GetString();
                                                            if (!string.IsNullOrEmpty(nm)) results.Add(nm);
                                                      }
                                                }
                                                if (results.Count > 0)
                                                {
                                                      parsed2 = true;
                                                      try { Program.AppendLog($"GetFileList JSON parsed: {results.Count} entries (attempt2)"); } catch { }
                                                      try { File.Delete(tempExe); } catch { }
                                                      return results;
                                                }
                                          }
                                    }
                                    catch (Exception exJson2)
                                    {
                                          try { Program.AppendLog($"GetFileList JSON parse failed (attempt2): {exJson2.Message}"); } catch { }
                                    }

                                    if (!parsed2)
                                    {
                                          foreach (var line in stdout.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                                          {
                                                var m = System.Text.RegularExpressions.Regex.Match(line, @"^(.+?)\s+\(\d+\s+bytes\)");
                                                if (m.Success) results.Add(m.Groups[1].Value.Trim());
                                          }
                                          if (results.Count > 0)
                                          {
                                                try { Program.AppendLog($"GetFileList: found {results.Count} entries on attempt2 (regex fallback)"); } catch { }
                                                try { File.Delete(tempExe); } catch { }
                                                return results;
                                          }
                                    }
                              }
                        }

                        try { File.Delete(tempExe); } catch { }
                  }
            }
            catch (Exception ex)
            {
                  try { Program.AppendLog($"GetFileList attempt2 exception: {ex.Message}"); } catch { }
            }

            try { Program.AppendLog($"GetFileList finished: found {results.Count} entries"); } catch { }
            return results;
      }
}
