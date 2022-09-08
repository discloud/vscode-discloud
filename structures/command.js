class Command {

    constructor(discloud, options) {
        this.discloud = discloud;
        this.name = options.name;
    }
}

module.exports = { Command }