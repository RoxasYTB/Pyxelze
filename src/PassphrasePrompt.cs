using System.Runtime.Versioning;

namespace Pyxelze
{
      internal static class PassphrasePrompt
      {
            public static string? Prompt(string title, string message, string? errorMessage = null)
            {
                  using (var f = new Form())
                  {
                        f.FormBorderStyle = FormBorderStyle.FixedDialog;
                        f.StartPosition = FormStartPosition.CenterParent;
                        f.Width = 520;
                        f.Height = 200;
                        f.Text = title;

                        var lbl = new Label();
                        lbl.AutoSize = false;
                        lbl.Width = 480;
                        lbl.Height = 20;
                        lbl.Top = 10;
                        lbl.Left = 10;
                        lbl.Text = message;
                        f.Controls.Add(lbl);

                        var lblError = new Label();
                        lblError.AutoSize = false;
                        lblError.Width = 480;
                        lblError.Height = 20;
                        lblError.Top = 35;
                        lblError.Left = 10;
                        lblError.ForeColor = Color.Red;
                        lblError.Text = errorMessage ?? "";
                        lblError.Visible = !string.IsNullOrEmpty(lblError.Text);
                        f.Controls.Add(lblError);

                        var tb = new TextBox();
                        tb.Width = 440;
                        tb.Left = 10;
                        tb.Top = 65;
                        tb.UseSystemPasswordChar = true;
                        f.Controls.Add(tb);

                        var btnOk = new Button();
                        btnOk.Text = "OK";
                        btnOk.Top = 105;
                        btnOk.Left = 260;
                        btnOk.DialogResult = DialogResult.OK;
                        f.Controls.Add(btnOk);

                        var btnCancel = new Button();
                        btnCancel.Text = "Annuler";
                        btnCancel.Top = 105;
                        btnCancel.Left = 345;
                        btnCancel.DialogResult = DialogResult.Cancel;
                        f.Controls.Add(btnCancel);

                        f.AcceptButton = btnOk;
                        f.CancelButton = btnCancel;

                        if (lblError.Visible)
                        {
                              tb.Focus();
                              tb.SelectAll();
                              var origColor = tb.BackColor;
                              var flashTimer = new System.Windows.Forms.Timer();
                              int flashes = 0;
                              flashTimer.Interval = 150;
                              flashTimer.Tick += (s, e) =>
                              {
                                    flashes++;
                                    if (flashes > 5)
                                    {
                                          tb.BackColor = origColor;
                                          flashTimer.Stop();
                                          flashTimer.Dispose();
                                          return;
                                    }
                                    tb.BackColor = (flashes % 2 == 1) ? Color.LightPink : origColor;
                              };
                              flashTimer.Start();
                        }

                        var dr = f.ShowDialog();
                        if (dr == DialogResult.OK)
                        {
                              return tb.Text;
                        }
                        return null;
                  }
            }
      }
}