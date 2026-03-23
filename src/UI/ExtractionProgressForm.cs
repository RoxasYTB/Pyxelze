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
        Text = L.Get("extraction.title");
        BackColor = ThemeManager.WindowBack;
        ForeColor = ThemeManager.WindowFore;
        MaximizeBox = false;
        MinimizeBox = false;

        lbl = new Label
        {
            AutoSize = false, Width = 400, Height = 20, Top = 15, Left = 15,
            Text = L.Get("extraction.progress"),
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
            Text = L.Get("extraction.cancel"), Top = 80, Left = 330, Width = 85, Height = 28,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };
        btnCancel.Click += (s, e) => { cts?.Cancel(); Close(); };
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
        lbl.Text = L.Get("extraction.status", current, bar.Maximum);
    }
}
