using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

namespace Pyxelze;

internal static class IconHelper
{
    public static Bitmap GetSourceBitmap(string path, bool isFolder, Size srcSize)
    {
        bool useLarge = srcSize.Width >= 32 || srcSize.Height >= 32;
        var ico = NativeMethods.GetIcon(path, isFolder, large: useLarge);
        try
        {
            var src = ico.ToBitmap();
            return ResizeTo(src, srcSize);
        }
        catch
        {
            var bmp = new Bitmap(srcSize.Width, srcSize.Height, PixelFormat.Format32bppArgb);
            using var g = Graphics.FromImage(bmp);
            g.Clear(Color.Transparent);
            return bmp;
        }
    }

    public static Bitmap ResizeTo(Image src, Size size)
    {
        var dest = new Bitmap(size.Width, size.Height, PixelFormat.Format32bppPArgb);
        using var g = Graphics.FromImage(dest);
        g.Clear(Color.Transparent);
        g.CompositingMode = CompositingMode.SourceOver;
        g.CompositingQuality = CompositingQuality.HighQuality;
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.SmoothingMode = SmoothingMode.HighQuality;
        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
        g.DrawImage(src, 0, 0, size.Width, size.Height);
        return dest;
    }
}
