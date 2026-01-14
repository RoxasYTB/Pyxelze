using System.Diagnostics;

namespace Pyxelze;

internal static class RoxRunner
{
      private static string? _roxExePath;
      private static string? _nodeExePath;
      private static string? _bundlePath;
      private static string? _roxCliExe;

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

            // Prefer a packaged rox CLI if present (some builds provide a standalone rox.exe)
            var roxCliA = Path.Combine(appDir, "tools", "roxify", "rox.exe");
            var roxCliB = Path.Combine(appDir, "tools", "roxify", "dist", "rox.exe");
            if (File.Exists(roxCliA)) _roxCliExe = roxCliA;
            else if (File.Exists(roxCliB)) _roxCliExe = roxCliB;
      }

      public static ProcessStartInfo CreateRoxProcess(string arguments)
      {
            var argTrim = (arguments ?? string.Empty).TrimStart();

            // If we have a packaged rox CLI, use it for commands that are only supported by the JS CLI (e.g. decode)
            if (!string.IsNullOrEmpty(_roxCliExe) && (argTrim.StartsWith("decode", StringComparison.OrdinalIgnoreCase)))
            {
                  return new ProcessStartInfo
                  {
                        FileName = _roxCliExe,
                        Arguments = arguments,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                  };
            }

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

            return new ProcessStartInfo
            {
                  FileName = "cmd.exe",
                  Arguments = $"/c rox {arguments}",
                  UseShellExecute = false,
                  CreateNoWindow = true,
                  RedirectStandardOutput = true,
                  RedirectStandardError = true
            };
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
}
