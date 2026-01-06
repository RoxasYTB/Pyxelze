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

            string? fileToOpen = args.Length > 0 ? args[0] : null;
            Application.Run(new Form1(fileToOpen));
        }
    }
}
