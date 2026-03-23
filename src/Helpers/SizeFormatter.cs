namespace Pyxelze;

internal static class SizeFormatter
{
    private static string[] Units => [L.Get("size.B"), L.Get("size.KB"), L.Get("size.MB"), L.Get("size.GB"), L.Get("size.TB")];

    public static string Format(long bytes)
    {
        if (bytes < 1024) return $"{bytes} {L.Get("size.B")}";
        double len = bytes;
        int order = 0;
        var units = Units;
        while (len >= 1024 && order < units.Length - 1) { order++; len /= 1024; }
        return $"{len:0.##} {units[order]}";
    }
}
