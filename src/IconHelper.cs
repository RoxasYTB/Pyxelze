using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

namespace Pyxelze
{
      internal static class IconHelper
      {
            public static Bitmap GetSourceBitmap(string path, bool isFolder, Size srcSize)
            {
                  var ico = NativeMethods.GetIcon(path, isFolder, large: false);
                  var bmp = new Bitmap(srcSize.Width, srcSize.Height, PixelFormat.Format32bppArgb);
                  using (var g = Graphics.FromImage(bmp))
                  {
                        g.Clear(Color.Transparent);
                        g.CompositingMode = CompositingMode.SourceOver;
                        g.CompositingQuality = CompositingQuality.HighQuality;
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.SmoothingMode = SmoothingMode.HighQuality;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.DrawIcon(ico, new Rectangle(0, 0, srcSize.Width, srcSize.Height));
                  }
                  return bmp;
            }

            public static Bitmap ResizeTo(Image src, Size size)
            {
                  var dest = new Bitmap(size.Width, size.Height, PixelFormat.Format32bppArgb);
                  using (var g = Graphics.FromImage(dest))
                  {
                        g.Clear(Color.Transparent);
                        g.CompositingMode = CompositingMode.SourceOver;
                        g.CompositingQuality = CompositingQuality.HighQuality;
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.SmoothingMode = SmoothingMode.HighQuality;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.DrawImage(src, 0, 0, size.Width, size.Height);
                  }
                  return dest;
            }
      }
}
