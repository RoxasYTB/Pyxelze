using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace Pyxelze;

internal static class UpdateChecker
{
    private const string GitHubApiUrl = "https://api.github.com/repos/RoxasYTB/Pyxelze/releases/latest";
    private const string CurrentVersion = "1.2.5";

    private static readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(15),
        DefaultRequestHeaders =
        {
            { "User-Agent", "Pyxelze-Updater" },
            { "Accept", "application/vnd.github.v3+json" }
        }
    };

    public static async Task<(bool updateAvailable, string? latestVersion, string? downloadUrl)> CheckForUpdateAsync()
    {
        try
        {
            var json = await _httpClient.GetStringAsync(GitHubApiUrl);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var tagName = root.GetProperty("tag_name").GetString()?.TrimStart('v', 'V') ?? "";
            Logger.Log($"UpdateCheck: current={CurrentVersion}, remote={tagName}");

            if (!Version.TryParse(CurrentVersion, out var local) || !Version.TryParse(tagName, out var remote))
                return (false, null, null);

            if (remote <= local)
                return (false, tagName, null);

            string? downloadUrl = null;
            if (root.TryGetProperty("assets", out var assets))
            {
                foreach (var asset in assets.EnumerateArray())
                {
                    var name = asset.GetProperty("name").GetString() ?? "";
                    if (name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                    {
                        downloadUrl = asset.GetProperty("browser_download_url").GetString();
                        break;
                    }
                }
            }

            downloadUrl ??= root.GetProperty("html_url").GetString();

            return (true, tagName, downloadUrl);
        }
        catch (Exception ex)
        {
            Logger.Log($"UpdateCheck failed: {ex.Message}");
            return (false, null, null);
        }
    }

    public static async Task<bool> DownloadUpdateAsync(string url, string destinationPath, Action<int>? onProgress = null)
    {
        try
        {
            using var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
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

    public static void ShowUpdateNotification(Form parent, string? version = null, string? downloadUrl = null)
    {
        if (version == null || downloadUrl == null)
        {
            Task.Run(async () =>
            {
                var (available, ver, url) = await CheckForUpdateAsync();
                if (!available || ver == null || url == null) return;
                parent.BeginInvoke(() => PromptAndUpdate(parent, ver, url));
            });
            return;
        }

        PromptAndUpdate(parent, version, downloadUrl);
    }

    private static void PromptAndUpdate(Form parent, string version, string downloadUrl)
    {
        var result = MessageBox.Show(
            $"Une mise à jour de Pyxelze est disponible (v{version}).\n\nVoulez-vous la télécharger maintenant ?",
            "Mise à jour disponible",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Information);

        if (result == DialogResult.Yes)
        {
            if (downloadUrl.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                PerformInstallerUpdate(parent, downloadUrl);
            else
                Process.Start(new ProcessStartInfo(downloadUrl) { UseShellExecute = true });
        }
    }

    private static async void PerformInstallerUpdate(Form parent, string downloadUrl)
    {
        var tempPath = Path.Combine(Path.GetTempPath(), $"Pyxelze-Setup-update.exe");

        using var progressForm = new ProcessProgressForm("Mise à jour", "Téléchargement de la mise à jour...");
        progressForm.Show(parent);

        bool success = await DownloadUpdateAsync(downloadUrl, tempPath);
        progressForm.Close();

        if (!success)
        {
            MessageBox.Show("Échec du téléchargement de la mise à jour.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo(tempPath) { UseShellExecute = true });
            Application.Exit();
        }
        catch (Exception ex)
        {
            Logger.Log($"Update launch failed: {ex}");
            MessageBox.Show($"Échec du lancement de l'installateur : {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
