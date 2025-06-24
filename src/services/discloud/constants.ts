/** `256KB` */
export const DEFAULT_CHUNK_SIZE = 262_144;

/** `100MB` */
export const MAX_BUFFER_SIZE = 104_857_600;

/** `1MB` */
export const MAX_CHUNK_SIZE = 1_048_576;

/** `512MB` */
export const MAX_FILE_SIZE = 536_870_912;

/** `8KB` */
export const MIN_CHUNK_SIZE = 8_192;

export const NETWORK_UNREACHABLE_ERRNO = -3008 as const;

export const NETWORK_UNREACHABLE_CODE = "ENOTFOUND" as const;

export const SOCKET_UNAUTHORIZED_CODE = 3000 as const;
