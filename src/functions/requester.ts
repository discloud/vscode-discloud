import axios, { AxiosRequestConfig } from 'axios';
import * as vscode from 'vscode';

type METHODS = "put" | "get" | "post" | "del";
let uses = 0;

setInterval(() => { uses > 0 ? uses-- : false; }, 60000);

export async function requester(method: METHODS, url: string, config?: AxiosRequestConfig<any> | undefined, d?: any) {

    if (uses > 5) {
        return vscode.window.showInformationMessage("Você atingiu o limite de requisições. Tente Novamente mais tarde.");
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
		data = ((d || d === {}) ? await methods[method](url, d, config) : await methods[method](url, config)).data;
        uses++;
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