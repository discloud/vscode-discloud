const { existsSync, lstatSync, readdirSync } = require('fs');
const { resolve } = require('path');

class TextsSystem {
    constructor({ pathToTexts, defaultLanguage }) {
        this.texts = {};
        this.defaultLanguage = defaultLanguage;
        this.pathToTexts = pathToTexts;
        this.languages = [];
        this.loadTexts();
    }

    async loadTexts() {
        if (!this.checkIfIsFolder(this.pathToTexts)) {
            throw new Error('Path to texts is not a folder');
        }

        const folders = readdirSync(this.pathToTexts);

        for (const folder of folders) {
            if (!folder || !this.checkIfIsFolder(resolve(this.pathToTexts, folder))) continue;
            Object.assign(this.texts, this.loadFolder(resolve(this.pathToTexts, folder), folder));
        }
    }

    checkIfIsFolder(path) {
        return existsSync(path) && lstatSync(path).isDirectory();
    }

    loadFolder(pathToFolder, folder) {
        const languages = [];
        const texts = {};

        const filesInsideFolder = readdirSync(pathToFolder);

        for (const file of filesInsideFolder) {
            if (!file) continue;

            if (this.checkIfIsFolder(resolve(pathToFolder, file))) {
                Object.assign(texts, this.loadFolder(resolve(pathToFolder, file), `${folder}/${file}`));
            } else {
                if (!file.endsWith('.json')) continue;

                if (!texts[folder]) texts[folder] = {};

                const language = file.split('.').shift();

                if (!language) continue;

                if (!languages.includes(language)) languages.push(language);

                if (this.languages.includes(language)) this.languages.push(language);

                texts[folder][language] = {};

                texts[folder][language] = require(resolve(pathToFolder, file));
            }
        }

        if (languages.length !== 0 && !languages.includes(this.defaultLanguage)) {
            throw new Error(`Default language "${this.defaultLanguage}" not found in folder "${folder}"`);
        }

        return texts;
    }

    getText({
        folder, text, language, variables}) {
        let textToReturn = '';

        if (!this.texts[folder]) {
            throw new Error(`Folder "${folder}" not found`);
        }

        const folderData = this.texts[folder];

        let textData = {};

        if (!language) textData = folderData[this.defaultLanguage];
        else if (folderData[language]) textData = folderData[language];
        else textData = folderData[this.defaultLanguage];

        if (!textData) {
            throw new Error(`Language "${language}" not found in folder "${folder}"`);
        }

        const partsToText = text.split('.');

        for (let i = 0; i < partsToText.length; i++) {
            if (i === partsToText.length - 1) {
                if (Array.isArray(textData[partsToText[i]])) textToReturn = textData[partsToText[i]].join('\n');
                else textToReturn = textData[partsToText[i]];
            }

            textData = textData[partsToText[i]];
        }

        if (variables) {
            for (const variable in variables) {
                if (!variable || !variables[variable]) continue;
                textToReturn = textToReturn.replace(new RegExp(`{{${variable}}}`, 'g'), variables[variable]);
            }
        }

        return textToReturn;
    }
}

module.exports = TextsSystem