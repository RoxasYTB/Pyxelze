namespace Pyxelze;

public class VirtualFile
{
    public string FullPath { get; set; } = "";
    public string OriginalPath { get; set; } = "";
    public string Name { get; set; } = "";
    public long Size { get; set; }
    public bool IsFolder { get; set; }
}
