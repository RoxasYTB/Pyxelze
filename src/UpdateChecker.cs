using System.Net.Http;
using System.Security.Cryptography;

namespace Pyxelze;

internal static class UpdateChecker
{
    private const string UpdateUrl = "https://aperture-sciences.com/pyxelze";
    private const string HashUrl = "https://aperture-sciences.com/pyxelze/sha256";
    private const string DownloadUrl = "https://aperture-sciences.com/pyxelze/Pyxelze.exe";

    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(15) };

    public static async Task<(bool updateAvailable, string? remoteHash)> CheckForUpdateAsync()
    {
        try
        {
            var localHash = GetLocalExecutableHash();
            if (localHash == null) return (false, null);

            var remoteHash = (await _httpClient.GetStringAsync(HashUrl)).Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(remoteHash)) return (false, null);

            bool needsUpdate = !string.Equals(localHash, remoteHash, StringComparison.OrdinalIgnoreCase);
            Logger.Log($"UpdateCheck: local={localHash}, remote={remoteHash}, needsUpdate={needsUpdate}");
            return (needsUpdate, remoteHash);
        }
        catch (Exception ex)
        {
            Logger.Log($"UpdateCheck failed: {ex.Message}");
            return (false, null);
        }
    }

    public static string? GetLocalExecutableHash()
    {
        try
        {
            using var sha256 = SHA256.Create();
            using var stream = File.OpenRead(Application.ExecutablePath);
            var hashBytes = sha256.ComputeHash(stream);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }
        catch { return null; }
    }

    public static async Task<bool> DownloadUpdateAsync(string destinationPath, Action<int>? onProgress = null)
    {
        try
        {
            using var response = await _httpClient.GetAsync(DownloadUrl, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();

            var totalBytes = response.Content.Headers.ContentLength ?? -1;
            using var stream = await response.Content.ReadAsStreamAsync();
            using var fileStream = File.Create(destinationPath);

            var buffer = new byte[81920];
            long totalRead = 0;
            int bytesRead;

            while ((bytesRead = await stream.ReadAsync(buffer)) > 0)
            {
                await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead));
                totalRead += bytesRead;
                if (totalBytes > 0)
                    onProgress?.Invoke((int)(totalRead * 100 / totalBytes));
            }

            Logger.Log($"Update downloaded: {totalRead} bytes to {destinationPath}");
            return true;
        }
        catch (Exception ex)
        {
            Logger.Log($"Update download failed: {ex.Message}");
            return false;
        }
    }

    public static void ShowUpdateNotification(Form parent)
    {
        Task.Run(async () =>
        {
            var (updateAvailable, remoteHash) = await CheckForUpdateAsync();
            if (!updateAvailable) return;

            parent.BeginInvoke(() =>
            {
                var result = MessageBox.Show(
                    "Une mise à jour de Pyxelze est disponible.\n\nVoulez-vous la télécharger maintenant ?",
                    "Mise à jour disponible",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Information);

                if (result == DialogResult.Yes)
                    PerformUpdate(parent);
            });
        });
    }

    private static async void PerformUpdate(Form parent)
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"Pyxelze-update-{Guid.NewGuid():N}.exe");

        using var progressForm = new ProcessProgressForm("Mise à jour", "Téléchargement de la mise à jour...");
        progressForm.Show(parent);

        bool success = await DownloadUpdateAsync(tempPath);
        progressForm.Close();

        if (!success)
        {
            MessageBox.Show("Échec du téléchargement de la mise à jour.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var currentExe = Application.ExecutablePath;
        var backupPath = currentExe + ".bak";

        try
        {
            if (File.Exists(backupPath)) File.Delete(backupPath);
            File.Move(currentExe, backupPath);
            File.Move(tempPath, currentExe);

            MessageBox.Show(
                "Mise à jour installée. L'application va redémarrer.",
                "Mise à jour",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);

            Application.Restart();
        }
        catch (Exception ex)
        {
            Logger.Log($"Update install failed: {ex}");
            try { if (File.Exists(backupPath) && !File.Exists(currentExe)) File.Move(backupPath, currentExe); } catch { }
            MessageBox.Show($"Échec de l'installation : {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
