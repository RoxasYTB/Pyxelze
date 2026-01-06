/// <reference types="node" />
/// <reference types="node" />
export declare const CHUNK_TYPE = "rXDT";
export declare const MAGIC: Buffer;
export declare const PIXEL_MAGIC: Buffer;
export declare const ENC_NONE = 0;
export declare const ENC_AES = 1;
export declare const ENC_XOR = 2;
export declare const FILTER_ZERO: Buffer;
export declare const PNG_HEADER: Buffer;
export declare const PNG_HEADER_HEX: string;
export declare const MARKER_COLORS: {
    r: number;
    g: number;
    b: number;
}[];
export declare const MARKER_START: {
    r: number;
    g: number;
    b: number;
}[];
export declare const MARKER_END: {
    r: number;
    g: number;
    b: number;
}[];
export declare const COMPRESSION_MARKERS: {
    zstd: {
        r: number;
        g: number;
        b: number;
    }[];
    lzma: {
        r: number;
        g: number;
        b: number;
    }[];
};
