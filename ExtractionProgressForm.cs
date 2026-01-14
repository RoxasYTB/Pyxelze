using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Pyxelze
{
      public class ExtractionProgressForm : Form
      {
            private ProgressBar bar;
            private Label lbl;
            private Button btnCancel;
            private CancellationTokenSource? cts;
            public bool Cancelled => cts?.IsCancellationRequested ?? false;

            public ExtractionProgressForm(int max)
            {
                  this.FormBorderStyle = FormBorderStyle.FixedDialog;
                  this.StartPosition = FormStartPosition.CenterParent;
                  this.Width = 420;
                  this.Height = 120;
                  this.Text = "Extraction en cours";

                  this.BackColor = ThemeManager.WindowBack;
                  this.ForeColor = ThemeManager.WindowFore;

                  lbl = new Label();
                  lbl.AutoSize = false;
                  lbl.BackColor = ThemeManager.ControlBack;
                  lbl.ForeColor = ThemeManager.ControlFore;
                  lbl.Width = 380;
                  lbl.Height = 20;
                  lbl.Top = 10;
                  lbl.Left = 10;
                  lbl.Text = "Extraction des fichiers...";
                  this.Controls.Add(lbl);

                  bar = new ProgressBar();
                  bar.Width = 380;
                  bar.Height = 20;
                  bar.Top = 40;
                  bar.Left = 10;
                  bar.Minimum = 0;
                  bar.Maximum = Math.Max(1, max);
                  bar.BackColor = ThemeManager.ControlBack;
                  bar.ForeColor = ThemeManager.ControlFore;
                  this.Controls.Add(bar);

                  btnCancel = new Button();
                  btnCancel.Text = "Annuler";
                  btnCancel.BackColor = ThemeManager.ControlBack;
                  btnCancel.ForeColor = ThemeManager.ControlFore;
                  btnCancel.Top = 70;
                  btnCancel.Left = 310;
                  btnCancel.Click += (s, e) => cts?.Cancel();
                  this.Controls.Add(btnCancel);

                  cts = new CancellationTokenSource();
            }

            public void UpdateProgress(int current)
            {
                  if (bar.InvokeRequired)
                  {
                        this.Invoke((Action)(() => UpdateProgress(current)));
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
                              bool ok = await extractFunc(f, cts.Token);
                              i++;
                              UpdateProgress(i);
                        }
                        this.BeginInvoke((Action)(() => this.Close()));
                  });

                  // modal run
                  this.ShowDialog();
            }

            public Task<bool> StartExtractionAsync(IList<string> files, Func<string, CancellationToken, Task<bool>> extractFunc)
            {
                  cts = new CancellationTokenSource();
                  var tcs = new TaskCompletionSource<bool>();

                  this.Show();

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
                        this.BeginInvoke((Action)(() => { this.Close(); tcs.SetResult(allOk); }));
                  });

                  return tcs.Task;
            }
      }
}
