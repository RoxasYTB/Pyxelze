/// <reference types="node" />
/// <reference types="node" />
export interface PackedFile {
    path: string;
    buf: Buffer;
}
export interface VFSIndexEntry {
    path: string;
    blockId: number;
    offset: number;
    size: number;
}
export declare function packPathsToParts(paths: string[], baseDir?: string, onProgress?: (readBytes: number, totalBytes: number, currentFile?: string) => void): {
    parts: Buffer[];
    list: string[];
};
export declare function packPaths(paths: string[], baseDir?: string, onProgress?: (readBytes: number, totalBytes: number, currentFile?: string) => void): {
    buf: Buffer;
    list: string[];
};
export declare function unpackBuffer(buf: Buffer, fileList?: string[]): {
    files: {
        path: string;
        buf: Buffer;
    }[];
} | null;
export declare function packPathsGenerator(paths: string[], baseDir?: string, onProgress?: (readBytes: number, totalBytes: number, currentFile?: string) => void): Promise<{
    index: VFSIndexEntry[];
    stream: AsyncGenerator<Buffer>;
    totalSize: number;
}>;
