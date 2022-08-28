import axios, { AxiosRequestConfig } from 'axios';
import * as vscode from 'vscode';

type METHODS = "put" | "get" | "post" | "del";

export async function requester(method: METHODS, url: string, config?: AxiosRequestConfig<any> | undefined, d?: any) {

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
	} catch(err: any) {
        if (err.response.status === 401) {
            return vscode.window.showErrorMessage(err.response.data.message);
        }
        if (err.response.status === 404) {
            return undefined;
        }
		return vscode.window.showErrorMessage(`${err.response.data ? err.response.data.message : err}`);
	}

    return data;
}