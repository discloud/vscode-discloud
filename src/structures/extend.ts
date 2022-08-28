import { readdirSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';

interface Command {
    name: string,
    run: (cache: Map<any, any>, uri: vscode.Uri) => void
}

export class Discloud {
    commands: Command[];
    subscriptions: { dispose(): any; }[];
    cache: Map<any, any>;

    constructor(context: vscode.ExtensionContext) {
        this.commands = [];
        this.subscriptions = context.subscriptions;
        this.loadCommands();
        this.init();
        this.cache = new Map();
    }

    init() {
        for (const command of this.commands) {
            let disp = vscode.commands.registerCommand(`discloud.${command.name}`, async (uri: vscode.Uri) => {
                await command.run(this.cache, uri);
            });
            this.subscriptions.push(disp);
        }

        return console.log("[DISCLOUD] Extension has loaded all commands.");
    }

    loadCommands() {
        const categories = readdirSync(join(__filename, "..", "..", "commands"));
        for (const category of categories) {
            const commands = readdirSync(join(__filename, "..", "..", "commands", category)).filter(r => r.endsWith('.js'));
            for (const command of commands) {
                const commandClass = require(join(__filename, "..", "..", "commands", category, command));
                const cmd = new (commandClass)(this);

                this.commands.push(cmd);
            }
        }
    }
}