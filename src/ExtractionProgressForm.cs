namespace Pyxelze;

internal class ExtractionProgressForm : Form
{
    private readonly ProgressBar bar;
    private readonly Label lbl;
    private CancellationTokenSource? cts;

    public bool Cancelled => cts?.IsCancellationRequested ?? false;

    public ExtractionProgressForm(int max)
    {
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        Width = 440;
        Height = 160;
        Text = "Extraction en cours";
        BackColor = ThemeManager.WindowBack;
        ForeColor = ThemeManager.WindowFore;
        MaximizeBox = false;
        MinimizeBox = false;

        lbl = new Label
        {
            AutoSize = false, Width = 400, Height = 20, Top = 15, Left = 15,
            Text = "Extraction des fichiers...",
            ForeColor = ThemeManager.ControlFore
        };
        Controls.Add(lbl);

        bar = new ProgressBar
        {
            Width = 400, Height = 22, Top = 45, Left = 15,
            Minimum = 0, Maximum = Math.Max(1, max)
        };
        Controls.Add(bar);

        var btnCancel = new Button
        {
            Text = "Annuler", Top = 80, Left = 330, Width = 85, Height = 28,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };
        btnCancel.Click += (s, e) => cts?.Cancel();
        Controls.Add(btnCancel);

        cts = new CancellationTokenSource();
    }

    public void UpdateProgress(int current)
    {
        if (bar.InvokeRequired)
        {
            Invoke(() => UpdateProgress(current));
            return;
        }
        bar.Value = Math.Min(current, bar.Maximum);
        lbl.Text = $"Extraction: {current}/{bar.Maximum} fichier(s)";
        Application.DoEvents();
    }

    public void RunExtraction(IList<string> files, Func<string, CancellationToken, Task<bool>> extractFunc)
    {
        cts = new CancellationTokenSource();
        Task.Run(async () =>
        {
            int i = 0;
            foreach (var f in files)
            {
                if (cts.IsCancellationRequested) break;
                await extractFunc(f, cts.Token);
                i++;
                UpdateProgress(i);
            }
            BeginInvoke(() => Close());
        });
        ShowDialog();
    }

    public Task<bool> StartExtractionAsync(IList<string> files, Func<string, CancellationToken, Task<bool>> extractFunc)
    {
        cts = new CancellationTokenSource();
        var tcs = new TaskCompletionSource<bool>();

        Show();

        Task.Run(async () =>
        {
            int i = 0;
            bool allOk = true;
            foreach (var f in files)
            {
                if (cts.IsCancellationRequested) { allOk = false; break; }
                bool ok = await extractFunc(f, cts.Token);
                if (!ok) allOk = false;
                i++;
                UpdateProgress(i);
            }
            BeginInvoke(() => { Close(); tcs.SetResult(allOk); });
        });

        return tcs.Task;
    }
}
