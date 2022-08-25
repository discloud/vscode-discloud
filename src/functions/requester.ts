import axios, { AxiosRequestConfig } from 'axios';
import * as vscode from 'vscode';

type METHODS = "put" | "get" | "post";

export async function requester(method: METHODS, url: string, config?: AxiosRequestConfig<any> | undefined, d?: any) {

    const methods = {
        put: axios.put,
        get: axios.get,
        post: axios.post
    };
    
    config ? config['baseURL'] = "https://api.discloud.app/v2" : config = { baseURL: "https://api.discloud.app/v2" };

	let data;
	try {
		data = ((d || d === {}) ? await methods[method](url, d, config) : await methods[method](url, config)).data;
	} catch(err) {
		return vscode.window.showErrorMessage(`${err}`);
	}

    return data.message;
}