import axios, { AxiosRequestConfig } from 'axios';
import * as vscode from 'vscode';

type METHODS = "put" | "get" | "post" | "del";
let { maxUses, uses, time, remain } = { maxUses: 60, uses: 0, time: 60000, remain: 60 };

setInterval(() => { uses > 0 ? uses-- : false; }, time);

export async function requester(method: METHODS, url: string, config?: AxiosRequestConfig<any> | undefined, d?: any) {

    const token = vscode.workspace
    .getConfiguration("discloud")
    .get("token") as string;

    //@ts-ignore
    const getProcess = global.actualProcess.get(`${token}`);
    
    if (getProcess) {
        return vscode.window.showInformationMessage(`Você já tem um processo de ${getProcess} em execução.`);
    } else {
        //@ts-ignore
        global.actualProcess.set(`${token}`, `${url.split('/')[-1]}`);
    }

    if (uses > maxUses || remain === 0) {
        return vscode.window.showInformationMessage(`Você atingiu o limite de requisições. Espere ${Math.floor(time/1000)} segundos para usar novamente.`);
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
        maxUses = parseInt(data.headers["ratelimit-limit"]);
        time = parseInt(data.headers["ratelimit-reset"]) * 1000;
        remain = parseInt(data.headers["ratelimit-remaining"]);
        
        data = data.data;
	} catch(err: any) {
        if (err?.response?.status === 401) {
            return vscode.window.showErrorMessage(err.response.data.message);
        }
        if (err?.response?.status === 404) {
            return undefined;
        }
		return vscode.window.showErrorMessage(`${err.response?.data ? err.response.data?.message : err}`);
	}

    return data;
}