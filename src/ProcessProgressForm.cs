using System.Diagnostics;

namespace Pyxelze;

internal class ProcessProgressForm : Form
{
    private readonly Label lblMessage;
    private readonly ProgressBar progressBar;
    private CancellationTokenSource? _cts;

    public ProcessProgressForm(string title, string message)
    {
        Text = title;
        Size = new Size(420, 170);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MaximizeBox = false;
        MinimizeBox = false;
        ControlBox = false;
        BackColor = ThemeManager.WindowBack;
        ForeColor = ThemeManager.WindowFore;

        lblMessage = new Label
        {
            Text = message,
            Dock = DockStyle.Top,
            Height = 40,
            Padding = new Padding(10, 15, 10, 0),
            ForeColor = ThemeManager.WindowFore
        };

        progressBar = new ProgressBar
        {
            Height = 25,
            Left = 10, Top = 50,
            Width = 385,
            Style = ProgressBarStyle.Marquee,
            MarqueeAnimationSpeed = 30
        };

        var btnCancel = new Button
        {
            Text = "Annuler", Top = 90, Left = 310, Width = 85, Height = 28,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };
        btnCancel.Click += (s, e) => _cts?.Cancel();

        Controls.Add(progressBar);
        Controls.Add(lblMessage);
        Controls.Add(btnCancel);
    }

    public void UpdateMessage(string msg) =>
        lblMessage.Text = msg;

    public void UpdateProgress(int percent)
    {
        progressBar.Style = ProgressBarStyle.Continuous;
        progressBar.Value = Math.Clamp(percent, 0, 100);
    }

    public int RunProcess(ProcessStartInfo psi, out string stdout, out string stderr)
    {
        string capturedOut = "", capturedErr = "";
        int exitCode = -1;
        var processLock = new object();
        _cts = new CancellationTokenSource();
        Process? proc = null;

        psi.UseShellExecute = false;
        psi.CreateNoWindow = true;
        psi.RedirectStandardOutput = true;
        psi.RedirectStandardError = true;

        var task = Task.Run(() =>
        {
            proc = Process.Start(psi);
            if (proc == null) return;
            var outResult = proc.StandardOutput.ReadToEnd();
            var errResult = proc.StandardError.ReadToEnd();
            proc.WaitForExit(60000);
            lock (processLock)
            {
                capturedOut = outResult;
                capturedErr = errResult;
                exitCode = proc.ExitCode;
            }
            proc.Dispose();
        });

        Show();
        Application.DoEvents();

        var sw = System.Diagnostics.Stopwatch.StartNew();
        while (!task.IsCompleted)
        {
            Application.DoEvents();
            Thread.Sleep(30);
            if (_cts.IsCancellationRequested)
            {
                try { proc?.Kill(); } catch { }
                break;
            }
            if (sw.ElapsedMilliseconds > 120000) break;
        }

        Close();
        lock (processLock)
        {
            stdout = capturedOut;
            stderr = capturedErr;
            return _cts.IsCancellationRequested ? -1 : exitCode;
        }
    }
}
