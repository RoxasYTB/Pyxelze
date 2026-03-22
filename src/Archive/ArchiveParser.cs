using System.Text.Json;
using System.Text.RegularExpressions;

namespace Pyxelze;

internal static class ArchiveParser
{
    private static readonly Regex LineSizeRegex = new(@"^(.+?)\s+\((\d+)\s+bytes\)$", RegexOptions.Compiled);

    public static List<VirtualFile> Parse(string data)
    {
        if (string.IsNullOrWhiteSpace(data)) return new();

        data = data.Trim();
        return IsJsonArray(data) ? ParseJson(data) : ParseText(data);
    }

    public static List<string> ParseFileNames(string data)
    {
        if (string.IsNullOrWhiteSpace(data)) return new();
        data = data.Trim();

        List<string> names;
        if (IsJsonArray(data))
            names = ParseJsonNames(data);
        else
            names = data.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(line => LineSizeRegex.Match(line.Trim()))
                .Where(m => m.Success)
                .Select(m => m.Groups[1].Value.Trim())
                .ToList();

        return names;
    }

    private static bool IsJsonArray(string data) =>
        data.StartsWith("[") && data.EndsWith("]");

    private static List<string> ParseJsonNames(string data)
    {
        try
        {
            using var doc = JsonDocument.Parse(data);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new();
            return doc.RootElement.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.Object && e.TryGetProperty("name", out _))
                .Select(e => e.GetProperty("name").GetString())
                .Where(n => !string.IsNullOrEmpty(n))
                .ToList()!;
        }
        catch { return new(); }
    }

    private static List<VirtualFile> ParseJson(string data)
    {
        var rawPaths = new List<(string name, long size)>();
        try
        {
            using var doc = JsonDocument.Parse(data);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new();

            foreach (var file in doc.RootElement.EnumerateArray())
                rawPaths.Add((file.GetProperty("name").GetString() ?? "", file.GetProperty("size").GetInt64()));
        }
        catch { return new(); }

        var result = new List<VirtualFile>();
        foreach (var (name, size) in rawPaths)
        {
            if (string.IsNullOrEmpty(name)) continue;

            result.Add(new VirtualFile
            {
                FullPath = name,
                OriginalPath = name,
                Name = Path.GetFileName(name),
                Size = size,
                IsFolder = false
            });

            AddParentDirectories(result, name);
        }
        return result;
    }

    private static List<VirtualFile> ParseText(string data)
    {
        var rawPaths = new List<(string path, long size)>();
        foreach (var line in data.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var trimmed = line.Trim();
            if (trimmed.StartsWith("Files in")) continue;

            var match = LineSizeRegex.Match(trimmed);
            if (!match.Success) continue;

            rawPaths.Add((match.Groups[1].Value.Trim().Replace("\\", "/"), long.Parse(match.Groups[2].Value)));
        }

        var result = new List<VirtualFile>();
        foreach (var (path, size) in rawPaths)
        {
            if (string.IsNullOrEmpty(path)) continue;

            result.Add(new VirtualFile
            {
                FullPath = path,
                OriginalPath = path,
                Name = Path.GetFileName(path),
                Size = size,
                IsFolder = false
            });

            AddParentDirectories(result, path);
        }
        return result;
    }

    private static void AddParentDirectories(List<VirtualFile> files, string filePath)
    {
        var dir = Path.GetDirectoryName(filePath)?.Replace("\\", "/");
        while (!string.IsNullOrEmpty(dir))
        {
            if (!files.Any(f => f.FullPath == dir))
            {
                files.Add(new VirtualFile
                {
                    FullPath = dir,
                    Name = Path.GetFileName(dir) ?? "",
                    IsFolder = true
                });
            }
            dir = Path.GetDirectoryName(dir)?.Replace("\\", "/");
        }
    }
}
