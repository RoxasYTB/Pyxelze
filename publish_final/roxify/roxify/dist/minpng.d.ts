/// <reference types="node" />
/// <reference types="node" />
export declare function encodeMinPng(rgb: Buffer, width: number, height: number): Promise<Buffer>;
export declare function decodeMinPng(pngBuf: Buffer): Promise<{
    buf: Buffer;
    width: number;
    height: number;
} | null>;
