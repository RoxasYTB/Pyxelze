namespace Pyxelze
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.SetHighDpiMode(HighDpiMode.SystemAware);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            if (args.Length >= 2)
            {
                string command = args[0].ToLower();
                string target = args[1];

                if (command == "extract")
                {
                    ExtractDirectory(target);
                    return;
                }
                else if (command == "compress")
                {
                    CompressDirectory(target);
                    return;
                }
            }

            string? fileToOpen = args.Length > 0 ? args[0] : null;
            Application.Run(new Form1(fileToOpen));
        }

        static void ExtractDirectory(string archivePath)
        {
            if (!File.Exists(archivePath))
            {
                MessageBox.Show($"Le fichier {archivePath} n'existe pas.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string outputDir = Path.Combine(Path.GetDirectoryName(archivePath) ?? "", Path.GetFileNameWithoutExtension(archivePath));
            Directory.CreateDirectory(outputDir);

            try
            {
                var psi = RoxRunner.CreateRoxProcess($"decode \"{archivePath}\" \"{outputDir}\"");
                using (var p = System.Diagnostics.Process.Start(psi))
                {
                    p!.WaitForExit();
                    if (p.ExitCode == 0)
                    {
                        MessageBox.Show($"Extraction réussie vers :\n{outputDir}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show($"Erreur lors de l'extraction.\n{p.StandardError.ReadToEnd()}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Impossible d'extraire : {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void CompressDirectory(string dirPath)
        {
            if (!Directory.Exists(dirPath))
            {
                MessageBox.Show($"Le dossier {dirPath} n'existe pas.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string outputFile = Path.Combine(Path.GetDirectoryName(dirPath) ?? "", Path.GetFileName(dirPath) + ".png");

            try
            {
                var psi = RoxRunner.CreateRoxProcess($"encode \"{dirPath}\" \"{outputFile}\"");
                using (var p = System.Diagnostics.Process.Start(psi))
                {
                    p!.WaitForExit();
                    if (p.ExitCode == 0)
                    {
                        MessageBox.Show($"Compression réussie :\n{outputFile}", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show($"Erreur lors de la compression.\n{p.StandardError.ReadToEnd()}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Impossible de compresser : {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
