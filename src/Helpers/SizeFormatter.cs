namespace Pyxelze;

internal static class SizeFormatter
{
    private static readonly string[] Units = ["o", "Ko", "Mo", "Go", "To"];

    public static string Format(long bytes)
    {
        if (bytes < 1024) return $"{bytes} o";
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < Units.Length - 1) { order++; len /= 1024; }
        return $"{len:0.##} {Units[order]}";
    }
}
