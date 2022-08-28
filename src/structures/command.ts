export class Command {
    name: string;
    cache: Map<any, any>;

    constructor(cache: Map<any, any>, options: { name: string }) {
        this.cache = cache;
        this.name = options.name;
    }
}