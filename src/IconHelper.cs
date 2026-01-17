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
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                  var bmp = new Bitmap(srcSize.Width, srcSize.Height, PixelFormat.Format32bppArgb);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                  using (var g = Graphics.FromImage(bmp))
                  {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.Clear(Color.Transparent);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.CompositingMode = CompositingMode.SourceOver;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.CompositingQuality = CompositingQuality.HighQuality;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.SmoothingMode = SmoothingMode.HighQuality;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.DrawIcon(ico, new Rectangle(0, 0, srcSize.Width, srcSize.Height));
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                  }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                  return bmp;
            }

            public static Bitmap ResizeTo(Image src, Size size)
            {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                  var dest = new Bitmap(size.Width, size.Height, PixelFormat.Format32bppArgb);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                  using (var g = Graphics.FromImage(dest))
                  {
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.Clear(Color.Transparent);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.CompositingMode = CompositingMode.SourceOver;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.CompositingQuality = CompositingQuality.HighQuality;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.SmoothingMode = SmoothingMode.HighQuality;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
#pragma warning disable CA1416 // Valider la compatibilité de la plateforme
                        g.DrawImage(src, 0, 0, size.Width, size.Height);
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                  }
#pragma warning restore CA1416 // Valider la compatibilité de la plateforme
                  return dest;
            }
      }
}
