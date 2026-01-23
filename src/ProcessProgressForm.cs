using System;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Pyxelze
{
      internal class ProcessProgressForm : Form
      {
            private ProgressBar bar;
            private Label lbl;
            private Button btnCancel;
            private bool cancelled = false;

            public bool Cancelled => cancelled;

            public ProcessProgressForm(string title, string message)
            {
                  this.FormBorderStyle = FormBorderStyle.FixedDialog;
                  this.StartPosition = FormStartPosition.CenterParent;
                  this.Width = 420;
                  this.Height = 120;
                  this.Text = title;

                  lbl = new Label();
                  lbl.AutoSize = false;
                  lbl.Width = 380;
                  lbl.Height = 20;
                  lbl.Top = 10;
                  lbl.Left = 10;
                  lbl.Text = message;
                  this.Controls.Add(lbl);

                  bar = new ProgressBar();
                  bar.Style = ProgressBarStyle.Marquee;
                  bar.Width = 380;
                  bar.Height = 20;
                  bar.Top = 40;
                  bar.Left = 10;
                  this.Controls.Add(bar);

                  btnCancel = new Button();
                  btnCancel.Text = "Annuler";
                  btnCancel.Top = 70;
                  btnCancel.Left = 310;
                  btnCancel.Click += (s, e) => { cancelled = true; };
                  this.Controls.Add(btnCancel);
            }

            public int RunProcess(ProcessStartInfo psi, out string stdout, out string stderr)
            {
                  stdout = string.Empty;
                  stderr = string.Empty;

                  var sbOut = new StringBuilder();
                  var sbErr = new StringBuilder();

                  psi.UseShellExecute = false;
                  psi.RedirectStandardOutput = true;
                  psi.RedirectStandardError = true;
                  psi.CreateNoWindow = true;

                  using (var p = new Process())
                  {
                        p.StartInfo = psi;
                        p.OutputDataReceived += (s, e) => { if (e.Data != null) { lock (sbOut) { sbOut.AppendLine(e.Data); } } };
                        p.ErrorDataReceived += (s, e) => { if (e.Data != null) { lock (sbErr) { sbErr.AppendLine(e.Data); } } };

                        try
                        {
                              if (!p.Start())
                              {
                                    throw new InvalidOperationException("Impossible de démarrer le processus.");
                              }
                        }
                        catch (Exception ex)
                        {
                              stderr = ex.ToString();
                              return -1;
                        }

                        p.BeginOutputReadLine();
                        p.BeginErrorReadLine();

                        var tcs = new TaskCompletionSource<int>();

                        // Timer to poll for process exit and for cancellation
                        var timer = new System.Windows.Forms.Timer();
                        timer.Interval = 200;
                        timer.Tick += (s, e) =>
                        {
                              if (this.Cancelled)
                              {
                                    try { p.Kill(); } catch { }
                              }
                              if (p.HasExited)
                              {
                                    timer.Stop();
                                    tcs.SetResult(p.ExitCode);
                                    this.BeginInvoke((Action)(() => this.Close()));
                              }
                        };

                        timer.Start();

                        // Show modal dialog while process runs
                        this.ShowDialog();

                        // Wait for process to exit if not already
                        var exitCode = tcs.Task.GetAwaiter().GetResult();

                        // ensure we read remaining output
                        try { p.WaitForExit(1000); } catch { }

                        lock (sbOut) { stdout = sbOut.ToString(); }
                        lock (sbErr) { stderr = sbErr.ToString(); }

                        timer.Dispose();
                        return exitCode;
                  }
            }
      }
}
