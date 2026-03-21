using System.Drawing.Drawing2D;
using System.Drawing.Text;

namespace Pyxelze;

internal static class ToolbarIcons
{
    private const string SegoeFluentFont = "Segoe Fluent Icons";
    private const string SegoeMdl2Font = "Segoe MDL2 Assets";

    public const string GlyphOpen = "\uE8E5";
    public const string GlyphExtractAll = "\uE896";
    public const string GlyphExtract = "\uE78C";
    public const string GlyphUp = "\uE70E";
    public const string GlyphHome = "\uEA8A";
    public const string GlyphFolder = "\uF12B";
    public const string GlyphChevronRight = "\uE76C";

    private static readonly Lazy<FontFamily?> _iconFontFamily = new(ResolveIconFont);

    private static readonly Dictionary<string, Color> DarkGlyphColors = new()
    {
        { GlyphOpen, Color.FromArgb(100, 200, 255) },
        { GlyphExtractAll, Color.FromArgb(120, 230, 150) },
        { GlyphExtract, Color.FromArgb(160, 220, 120) },
        { GlyphUp, Color.FromArgb(255, 200, 100) },
        { GlyphHome, Color.FromArgb(100, 180, 255) },
        { GlyphFolder, Color.FromArgb(255, 210, 90) },
    };

    private static readonly Dictionary<string, Color> LightGlyphColors = new()
    {
        { GlyphOpen, Color.FromArgb(0, 100, 200) },
        { GlyphExtractAll, Color.FromArgb(20, 140, 60) },
        { GlyphExtract, Color.FromArgb(40, 130, 40) },
        { GlyphUp, Color.FromArgb(180, 120, 0) },
        { GlyphHome, Color.FromArgb(0, 90, 180) },
        { GlyphFolder, Color.FromArgb(200, 160, 0) },
    };

    public static Color GetGlyphColor(string glyph)
    {
        var map = ThemeManager.DarkMode ? DarkGlyphColors : LightGlyphColors;
        return map.TryGetValue(glyph, out var c) ? c : ThemeManager.ControlFore;
    }

    private static FontFamily? ResolveIconFont()
    {
        foreach (var name in new[] { SegoeFluentFont, SegoeMdl2Font })
        {
            try
            {
                var family = new FontFamily(name);
                if (family.IsStyleAvailable(FontStyle.Regular))
                    return family;
            }
            catch { }
        }
        return null;
    }

    public static Image Render(string glyph, int size, Color color)
    {
        var bmp = new Bitmap(size, size, System.Drawing.Imaging.PixelFormat.Format32bppPArgb);
        using var g = Graphics.FromImage(bmp);
        g.SmoothingMode = SmoothingMode.HighQuality;
        g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

        var fontFamily = _iconFontFamily.Value;
        if (fontFamily == null)
            return RenderFallbackText(glyph, size, color);

        float fontSize = size * 0.82f;
        using var font = new Font(fontFamily, fontSize, FontStyle.Regular, GraphicsUnit.Pixel);
        using var brush = new SolidBrush(color);

        var sf = new StringFormat
        {
            Alignment = StringAlignment.Center,
            LineAlignment = StringAlignment.Center
        };

        g.DrawString(glyph, font, brush, new RectangleF(0, 0, size, size), sf);
        return bmp;
    }

    private static Image RenderFallbackText(string glyph, int size, Color color)
    {
        var bmp = new Bitmap(size, size);
        using var g = Graphics.FromImage(bmp);
        using var brush = new SolidBrush(color);
        using var font = new Font("Segoe UI", size * 0.4f, FontStyle.Bold, GraphicsUnit.Pixel);
        var sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
        g.DrawString("?", font, brush, new RectangleF(0, 0, size, size), sf);
        return bmp;
    }
}
