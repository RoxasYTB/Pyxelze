using System.Runtime.InteropServices;

namespace Pyxelze;

public static class NativeMethods
{
    private const uint SHGFI_ICON = 0x100;
    private const uint SHGFI_SMALLICON = 0x1;
    private const uint SHGFI_USEFILEATTRIBUTES = 0x10;
    private const uint SHGFI_TYPENAME = 0x400;
    private const uint FILE_ATTRIBUTE_DIRECTORY = 0x10;
    private const uint FILE_ATTRIBUTE_NORMAL = 0x80;

    [StructLayout(LayoutKind.Sequential)]
    public struct SHFILEINFO
    {
        public IntPtr hIcon;
        public int iIcon;
        public uint dwAttributes;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
        public string szDisplayName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)]
        public string szTypeName;
    }

    [DllImport("shell32.dll")]
    private static extern IntPtr SHGetFileInfo(string pszPath, uint dwFileAttributes, ref SHFILEINFO psfi, uint cbSizeFileInfo, uint uFlags);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DestroyIcon(IntPtr hIcon);

    public static Icon GetIcon(string path, bool isFolder, bool large = false)
    {
        var shinfo = new SHFILEINFO();
        uint flags = SHGFI_ICON | SHGFI_USEFILEATTRIBUTES;
        if (!large) flags |= SHGFI_SMALLICON;

        uint attributes = isFolder ? FILE_ATTRIBUTE_DIRECTORY : FILE_ATTRIBUTE_NORMAL;
        string lookupPath = isFolder ? "C:\\DummyFolder" :
            (string.IsNullOrEmpty(Path.GetExtension(path)) ? "file.txt" : "file" + Path.GetExtension(path));

        SHGetFileInfo(lookupPath, attributes, ref shinfo, (uint)Marshal.SizeOf(shinfo), flags);

        if (shinfo.hIcon == IntPtr.Zero) return SystemIcons.Application;
        var icon = (Icon)Icon.FromHandle(shinfo.hIcon).Clone();
        DestroyIcon(shinfo.hIcon);
        return icon;
    }

    public static string GetFileTypeName(string fileName)
    {
        var shinfo = new SHFILEINFO();
        var ext = Path.GetExtension(fileName);
        var lookupPath = string.IsNullOrEmpty(ext) ? "file" : "file" + ext;
        SHGetFileInfo(lookupPath, FILE_ATTRIBUTE_NORMAL, ref shinfo, (uint)Marshal.SizeOf(shinfo), SHGFI_TYPENAME | SHGFI_USEFILEATTRIBUTES);
        return string.IsNullOrWhiteSpace(shinfo.szTypeName) ? "Fichier" : shinfo.szTypeName;
    }
}
