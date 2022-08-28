import { Discloud } from "./extend";

export class Command {
    name: string;
    discloud: Discloud;

    constructor(discloud: Discloud, options: { name: string }) {
        this.discloud = discloud;
        this.name = options.name;
    }
}