import axios, { AxiosRequestConfig } from 'axios';
import * as vscode from 'vscode';

type METHODS = "put" | "get" | "post" | "del";
let { maxUses, uses, time, remain } = { maxUses: 60, uses: 0, time: 60000, remain: 60 };

setInterval(() => { uses > 0 ? uses-- : false; }, time);

let hasProcess = { i: false, p: '' };

export async function requester(method: METHODS, url: string, config?: AxiosRequestConfig<any> | undefined, d?: any) {

    const token = vscode.workspace
    .getConfiguration("discloud")
    .get("token") as string;
    
    if (hasProcess.i) {
        vscode.window.showErrorMessage(`Você já tem um processo de ${hasProcess.p} em execução.`);
        return;
    } else {
        hasProcess = { i: true, p: `${url.split('/')[url.split('/').length - 1]}` };
    }

    if (uses > maxUses || remain === 0) {
        vscode.window.showInformationMessage(`Você atingiu o limite de requisições. Espere ${Math.floor(time/1000)} segundos para usar novamente.`);
        return;
    }

    const methods = {
        put: axios.put,
        get: axios.get,
        post: axios.post,
        del: axios.delete
    };
    
    config ? config['baseURL'] = "https://api.discloud.app/v2" : config = { baseURL: "https://api.discloud.app/v2" };

	let data;
	try {
		data = ((d || d === {}) ? await methods[method](url, d, config) : await methods[method](url, config));
        uses++;
        maxUses = await parseInt(data.headers["ratelimit-limit"]);
        time = await parseInt(data.headers["ratelimit-reset"]) * 1000;
        remain = await parseInt(data.headers["ratelimit-remaining"]);
        
        data = data.data;
        hasProcess.i = false;
	} catch(err: any) {
        if (err?.response?.status === 401) {
            vscode.window.showErrorMessage(err.response.data.message);
            return;
        }
        if (err?.response?.status === 404) {
            return;
        }
		return vscode.window.showErrorMessage(`${err.response?.data ? err.response.data?.message : err}`);
	}

    return data;
}