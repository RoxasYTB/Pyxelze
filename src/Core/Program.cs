using System.Runtime.Versioning;

namespace Pyxelze;

static class Program
{
    public const string BuildStamp = "20260322-000000";

    [SupportedOSPlatform("windows")]
    [STAThread]
    static void Main(string[] args)
    {
        if (args.Length >= 1)
        {
            var cmd = args[0].ToLower();
            if (cmd == "register-contextmenu")
            {
                ContextMenuRegistration.RegisterSilent();
                return;
            }
            if (cmd == "unregister-contextmenu")
            {
                ContextMenuRegistration.UnregisterSilent();
                return;
            }
        }

        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        if (args.Length >= 1)
        {
            switch (args[0].ToLower())
            {
                case "register-contextmenu-ui":
                    ContextMenuRegistration.RegisterDirect();
                    return;
                case "unregister-contextmenu-ui":
                    ContextMenuRegistration.UnregisterDirect();
                    return;
                case "version":
                    ShowVersion(args);
                    return;
            }
        }

        if (args.Length >= 2)
        {
            var command = args[0].ToLower();
            var target = args[1];

            if (command is "extract" or "decode")
            {
                HeadlessExtract(target);
                return;
            }
            if (command == "compress")
            {
                HeadlessCompress(target);
                return;
            }
        }

        string? fileToOpen = args.Length > 0 ? args[0] : null;

        Application.Run(new MainForm(fileToOpen));
    }

    private static void ShowVersion(string[] args)
    {
        if (args.Length >= 2 && args[1] is "--console" or "-c")
            Console.WriteLine(BuildStamp);
        else
            MessageBox.Show($"Build: {BuildStamp}", "Pyxelze version", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    private static void HeadlessExtract(string archivePath)
    {
        if (!File.Exists(archivePath))
        {
            MessageBox.Show($"Le fichier {archivePath} n'existe pas.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var outputDir = Path.Combine(
            Path.GetDirectoryName(archivePath) ?? "",
            Path.GetFileNameWithoutExtension(archivePath));

        bool success = ExtractionService.ExtractWithProgress(archivePath, outputDir);
        if (success)
            MessageBox.Show($"Extraction réussie vers :\n{outputDir}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
        else
            MessageBox.Show($"Échec de l'extraction.\nVoir le journal: {Logger.LogPath}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

    private static void HeadlessCompress(string dirPath)
    {
        if (!Directory.Exists(dirPath))
        {
            MessageBox.Show($"Le dossier {dirPath} n'existe pas.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        bool success = CompressionService.CompressDirectory(dirPath);
        if (success)
        {
            var output = Path.Combine(Path.GetDirectoryName(dirPath) ?? "", Path.GetFileName(dirPath) + ".png");
            MessageBox.Show($"Compression réussie :\n{output}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        else
            MessageBox.Show("Échec de la compression.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

}
