import { request } from "undici";

export type RequestOptions = Exclude<Parameters<typeof request>[1], undefined>;
