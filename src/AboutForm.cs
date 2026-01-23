using System.Security.Cryptography;
using System.Text;
using System.Runtime.Versioning;

namespace Pyxelze
{
      [SupportedOSPlatform("windows")]
      public partial class AboutForm : Form
      {
            public AboutForm()
            {
                  InitializeComponent();
                  ThemeManager.ApplyToForm(this);
            }

            private void InitializeComponent()
            {
                  this.Text = "À propos de Pyxelze";
                  this.Size = new Size(500, 400);
                  this.FormBorderStyle = FormBorderStyle.FixedDialog;
                  this.MaximizeBox = false;
                  this.MinimizeBox = false;
                  this.StartPosition = FormStartPosition.CenterParent;

                  var panel = new Panel
                  {
                        Dock = DockStyle.Fill,
                        Padding = new Padding(20),
                        AutoScroll = true,
                        BackColor = ThemeManager.WindowBack,
                        ForeColor = ThemeManager.WindowFore
                  };

                  var titleLabel = new Label
                  {
                        Text = "Pyxelze",
                        Font = new Font("Segoe UI", 18, FontStyle.Bold),
                        AutoSize = true,
                        Location = new Point(20, 20),
                        ForeColor = ThemeManager.WindowFore
                  };

                  var copyrightLabel = new Label
                  {
                        Text = "© 2026 Yohan SANNIER",
                        AutoSize = true,
                        Location = new Point(20, 60),
                        ForeColor = ThemeManager.WindowFore
                  };

                  var buildDateLabel = new Label
                  {
                        Text = $"Date de build : {Program.BuildStamp}",
                        AutoSize = true,
                        Location = new Point(20, 90),
                        ForeColor = ThemeManager.WindowFore
                  };

                  string exePath = Application.ExecutablePath;
                  string? executableHash = null;
                  try
                  {
                        using var sha256 = SHA256.Create();
                        using var stream = File.OpenRead(exePath);
                        var hashBytes = sha256.ComputeHash(stream);
                        executableHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                  }
                  catch
                  {
                        executableHash = "Indisponible";
                  }

                  var checksumLabel = new Label
                  {
                        Text = "Checksum de l'exécutable :",
                        AutoSize = true,
                        Location = new Point(20, 120),
                        ForeColor = ThemeManager.WindowFore
                  };

                  var checksumValueBox = new TextBox
                  {
                        Text = executableHash ?? "Indisponible",
                        ReadOnly = true,
                        Multiline = true,
                        Width = 440,
                        Height = 60,
                        Location = new Point(20, 145),
                        BackColor = ThemeManager.ControlBack,
                        ForeColor = ThemeManager.ControlFore,
                        Font = new Font("Consolas", 9)
                  };

                  string? releaseChecksum = null;
                  try
                  {
                        var releaseDir = Path.GetDirectoryName(exePath);
                        if (releaseDir != null)
                        {
                              var checksumFile = Path.Combine(releaseDir, "sha256sums.txt");
                              if (File.Exists(checksumFile))
                              {
                                    var firstLine = File.ReadLines(checksumFile).FirstOrDefault();
                                    if (!string.IsNullOrWhiteSpace(firstLine))
                                    {
                                          releaseChecksum = firstLine.Trim().ToLowerInvariant();
                                    }
                              }
                        }
                  }
                  catch { }

                  var releaseChecksumLabel = new Label
                  {
                        Text = "Checksum de release :",
                        AutoSize = true,
                        Location = new Point(20, 220),
                        ForeColor = ThemeManager.WindowFore
                  };

                  var releaseChecksumValueBox = new TextBox
                  {
                        Text = releaseChecksum ?? "Non trouvé",
                        ReadOnly = true,
                        Multiline = true,
                        Width = 440,
                        Height = 60,
                        Location = new Point(20, 245),
                        BackColor = ThemeManager.ControlBack,
                        ForeColor = ThemeManager.ControlFore,
                        Font = new Font("Consolas", 9)
                  };

                  bool checksumMatch = false;
                  if (executableHash != null && releaseChecksum != null && executableHash != "Indisponible" && releaseChecksum != "Non trouvé")
                  {
                        checksumMatch = executableHash.Equals(releaseChecksum, StringComparison.OrdinalIgnoreCase);
                  }

                  var verificationLabel = new Label
                  {
                        Text = checksumMatch ? "✓ Vérification : OK (version officielle)" : "⚠ Vérification : Différence détectée",
                        AutoSize = true,
                        Location = new Point(20, 315),
                        Font = new Font("Segoe UI", 9, FontStyle.Bold),
                        ForeColor = checksumMatch ? Color.Green : Color.Orange
                  };

                  var okButton = new Button
                  {
                        Text = "OK",
                        DialogResult = DialogResult.OK,
                        Location = new Point(200, 350),
                        Size = new Size(80, 30),
                        BackColor = ThemeManager.ControlBack,
                        ForeColor = ThemeManager.ControlFore
                  };

                  panel.Controls.Add(titleLabel);
                  panel.Controls.Add(copyrightLabel);
                  panel.Controls.Add(buildDateLabel);
                  panel.Controls.Add(checksumLabel);
                  panel.Controls.Add(checksumValueBox);
                  panel.Controls.Add(releaseChecksumLabel);
                  panel.Controls.Add(releaseChecksumValueBox);
                  panel.Controls.Add(verificationLabel);
                  panel.Controls.Add(okButton);

                  this.Controls.Add(panel);
                  this.AcceptButton = okButton;
            }
      }
}
