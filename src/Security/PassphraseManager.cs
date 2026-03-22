namespace Pyxelze;

internal static class PassphraseManager
{
    private static readonly object _lock = new();
    private static string? _cachedPassphrase;

    public static string? CachedPassphrase
    {
        get { lock (_lock) return _cachedPassphrase; }
    }

    public static void Save(string pass)
    {
        lock (_lock) _cachedPassphrase = pass;
        Logger.Log("PassphraseManager: cached in memory");
    }

    public static void Clear()
    {
        lock (_lock) _cachedPassphrase = null;
        Logger.Log("PassphraseManager: cleared");
    }

    public static bool NeedsPassphrase(string stdout, string stderr)
    {
        return ContainsPassphraseIndicator(stdout) || ContainsPassphraseIndicator(stderr);
    }

    public static bool IsDecryptionFailure(string stdout, string stderr)
    {
        return Contains(stdout, "AES decryption failed") || Contains(stderr, "AES decryption failed")
            || Contains(stdout, "Encrypted payload") || Contains(stderr, "Encrypted payload");
    }

    private static bool ContainsPassphraseIndicator(string? text)
    {
        if (string.IsNullOrEmpty(text)) return false;
        return text.Contains("Passphrase required") || text.Contains("Encrypted payload") || text.Contains("AES decryption failed");
    }

    private static bool Contains(string? text, string value) =>
        text?.Contains(value) == true;

    public static string? PromptForPassphrase(string? errorMsg = null)
    {
        return PassphrasePrompt.Prompt("Passphrase requise", "Ce fichier est chiffré. Entrez la passphrase :", errorMsg);
    }

    public static string BuildPassphraseArg(string passphrase)
    {
        var escaped = passphrase.Replace("\"", "\\\"");
        return $"--passphrase \"{escaped}\"";
    }
}
