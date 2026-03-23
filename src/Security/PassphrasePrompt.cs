namespace Pyxelze;

internal static class PassphrasePrompt
{
    public static string? Prompt(string title, string message, string? errorMessage = null)
    {
        int margin = 15;
        int y = margin;
        int formW = 420;

        using var form = new Form
        {
            Text = title,
            Width = formW,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            StartPosition = FormStartPosition.CenterParent,
            MaximizeBox = false,
            MinimizeBox = false,
            BackColor = ThemeManager.WindowBack,
            ForeColor = ThemeManager.WindowFore
        };

        var lbl = new Label
        {
            Text = message,
            Left = margin, Top = y,
            Width = formW - margin * 2 - 20,
            Height = 35,
            ForeColor = ThemeManager.WindowFore
        };
        form.Controls.Add(lbl);
        y += lbl.Height + 5;

        if (!string.IsNullOrEmpty(errorMessage))
        {
            var lblError = new Label
            {
                Text = errorMessage,
                Left = margin, Top = y,
                Width = formW - margin * 2 - 20,
                Height = 20,
                ForeColor = Color.Red
            };
            form.Controls.Add(lblError);
            y += lblError.Height + 5;
        }

        var txt = new TextBox
        {
            Left = margin, Top = y,
            Width = formW - margin * 2 - 20,
            UseSystemPasswordChar = true,
            BackColor = ThemeManager.WindowBack,
            ForeColor = ThemeManager.WindowFore
        };
        form.Controls.Add(txt);
        y += txt.Height + 20;

        var btnOk = new Button
        {
            Text = L.Get("passphrase.ok"), DialogResult = DialogResult.OK,
            Width = 85, Height = 28,
            Left = formW - margin - 20 - 85 - 10 - 85, Top = y,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };
        var btnCancel = new Button
        {
            Text = L.Get("passphrase.cancel"), DialogResult = DialogResult.Cancel,
            Width = 85, Height = 28,
            Left = formW - margin - 20 - 85, Top = y,
            BackColor = ThemeManager.ControlBack,
            ForeColor = ThemeManager.ControlFore,
            FlatStyle = FlatStyle.Flat
        };
        form.Controls.Add(btnOk);
        form.Controls.Add(btnCancel);
        y += btnCancel.Height + margin;

        form.Height = y + 40;
        form.AcceptButton = btnOk;
        form.CancelButton = btnCancel;

        return form.ShowDialog() == DialogResult.OK ? txt.Text : null;
    }
}
