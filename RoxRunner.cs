using System.Diagnostics;

namespace Pyxelze;

internal static class RoxRunner
{
      private static string? _roxExePath;
      private static string? _nodeExePath;
      private static string? _bundlePath;

      static RoxRunner()
      {
            var appDir = AppDomain.CurrentDomain.BaseDirectory;

            var roxExe = Path.Combine(appDir, "rox.exe");
            if (File.Exists(roxExe))
            {
                  _roxExePath = roxExe;
            }

            var nodeExe = Path.Combine(appDir, "roxify", "node.exe");
            if (File.Exists(nodeExe))
            {
                  _nodeExePath = nodeExe;
            }

            var bundle = Path.Combine(appDir, "roxify", "build", "rox-bundle.cjs");
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

      public static bool IsRoxAvailable()
      {
            return !string.IsNullOrEmpty(_roxExePath)
                   || (!string.IsNullOrEmpty(_nodeExePath) && !string.IsNullOrEmpty(_bundlePath));
      }
}
