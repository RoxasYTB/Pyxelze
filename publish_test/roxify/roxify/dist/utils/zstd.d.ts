/// <reference types="node" />
/// <reference types="node" />
export declare function compressStream(stream: AsyncGenerator<Buffer>, level?: number, onProgress?: (loaded: number, total: number) => void): Promise<{
    chunks: Buffer[];
    totalLength: number;
}>;
export declare function parallelZstdCompress(payload: Buffer | Buffer[], level?: number, onProgress?: (loaded: number, total: number) => void): Promise<Buffer[]>;
export declare function parallelZstdDecompress(payload: Buffer, onProgress?: (info: {
    phase: string;
    loaded?: number;
    total?: number;
}) => void): Promise<Buffer>;
export declare function tryZstdDecompress(payload: Buffer, onProgress?: (info: {
    phase: string;
    loaded?: number;
    total?: number;
}) => void): Promise<Buffer>;
