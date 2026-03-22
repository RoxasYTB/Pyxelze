namespace Pyxelze;

internal static class ListViewRendering
{
    public static void DrawColumnHeader(object? sender, DrawListViewColumnHeaderEventArgs e)
    {
        var bounds = e.Bounds;
        var paddedBounds = new Rectangle(bounds.X, bounds.Y, bounds.Width, bounds.Height + 4);

        using var bgBrush = new SolidBrush(ThemeManager.ListViewHeaderBack);
        e.Graphics.FillRectangle(bgBrush, paddedBounds);

        using var borderPen = new Pen(ThemeManager.BorderColor);
        e.Graphics.DrawLine(borderPen, bounds.Right - 1, bounds.Top + 4, bounds.Right - 1, bounds.Bottom - 4);

        var textRect = new Rectangle(bounds.Left + 6, bounds.Top, bounds.Width - 12, bounds.Height);
        var flags = TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.EndEllipsis;
        if (e.Header!.TextAlign == HorizontalAlignment.Right) flags |= TextFormatFlags.Right;

        using var headerFont = new Font(e.Font!, FontStyle.Regular);
        TextRenderer.DrawText(e.Graphics, e.Header.Text, headerFont, textRect, ThemeManager.ControlFore, flags);

        using var bottomPen = new Pen(ThemeManager.AccentColor, 1);
        e.Graphics.DrawLine(bottomPen, bounds.Left, bounds.Bottom - 1, bounds.Right, bounds.Bottom - 1);
    }

    public static void PaintHeader(object? sender, PaintEventArgs e)
    {
        if (sender is not ListView lv) return;
        int textH = TextRenderer.MeasureText("Ag", lv.Font).Height;
        int headerHeight = textH + 12;
        var rect = new Rectangle(0, 0, lv.ClientSize.Width, headerHeight + 2);
        using var bgBrush = new SolidBrush(ThemeManager.ListViewHeaderBack);
        e.Graphics.FillRectangle(bgBrush, rect);
    }

    public static void DrawSubItem(DrawListViewSubItemEventArgs e, ListView listView, ImageList smallImageList,
        FileIconManager? iconManager, ListViewItem? hoverItem)
    {
        var item = e.Item!;
        var vf = item.Tag as VirtualFile;
        var bounds = e.Bounds;

        bool selected = item.Selected;
        bool hovered = item == hoverItem;

        Color back = listView.BackColor;
        Color fore = listView.ForeColor;

        if (selected)
        {
            back = ThemeManager.ListViewSelectionBack;
            fore = ThemeManager.WindowFore;
        }
        else if (hovered)
        {
            back = ThemeManager.ListViewRowHover;
        }

        using (var bgBrush = new SolidBrush(back))
            e.Graphics.FillRectangle(bgBrush, bounds);

        if (e.ColumnIndex == 0)
        {
            string key = item.Tag?.ToString() == "UP" ? "folder"
                : (vf != null ? (iconManager?.GetIconKey(vf.Name, vf.IsFolder) ?? "file") : "file");

            Image? img = smallImageList.Images.ContainsKey(key) ? smallImageList.Images[key]
                : (smallImageList.Images.ContainsKey("file") ? smallImageList.Images["file"]
                : (smallImageList.Images.Count > 0 ? smallImageList.Images[0] : null));

            int iconSize = smallImageList.ImageSize.Width;
            int iconPadding = 4;

            if (img != null)
            {
                int iconLeft = bounds.Left + iconPadding;
                int iconTop = bounds.Top + (bounds.Height - iconSize) / 2;
                e.Graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                e.Graphics.DrawImage(img, iconLeft, iconTop, iconSize, iconSize);
            }

            var textRect = new Rectangle(bounds.Left + iconSize + iconPadding + 2, bounds.Top, bounds.Width - iconSize - iconPadding - 2, bounds.Height);
            TextRenderer.DrawText(e.Graphics, item.Text, listView.Font, textRect, fore,
                TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.EndEllipsis);
        }
        else
        {
            var flags = TextFormatFlags.VerticalCenter | TextFormatFlags.Left | TextFormatFlags.EndEllipsis;
            if (e.Header!.TextAlign == HorizontalAlignment.Right) flags |= TextFormatFlags.Right;
            if (e.Header.TextAlign == HorizontalAlignment.Center) flags |= TextFormatFlags.HorizontalCenter;

            var textRect = new Rectangle(bounds.Left + 6, bounds.Top, bounds.Width - 12, bounds.Height);
            TextRenderer.DrawText(e.Graphics, e.SubItem!.Text, listView.Font, textRect, fore, flags);
        }
    }
}
