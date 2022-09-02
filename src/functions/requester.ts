import axios, { AxiosRequestConfig } from 'axios';
import * as vscode from 'vscode';
import { createLogs } from './toLogs';

type METHODS = "put" | "get" | "post" | "del";
let { maxUses, uses, time, remain } = { maxUses: 60, uses: 0, time: 60000, remain: 60 };

setInterval(() => { uses > 0 ? uses-- : false; }, time);

let hasProcess = { i: false, p: '' };

export async function requester(method: METHODS, url: string, config?: AxiosRequestConfig<any> | undefined, options?: { d?: any, isVS?: boolean }) {

    
    if (hasProcess.i && (options && !options.isVS)) {
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
		data = ((options && (options.d && Object.keys(options.d).length > 1)) ? await methods[method](url, options.d, config) : await methods[method](url, config));
        uses++;
        maxUses = await parseInt(data.headers["ratelimit-limit"]);
        time = await parseInt(data.headers["ratelimit-reset"]) * 1000;
        remain = await parseInt(data.headers["ratelimit-remaining"]);
        
        data = data.data;
        hasProcess.i = false;
	} catch(err: any) {
        hasProcess.i = false;
        if (err?.response?.status === 401) {
            vscode.window.showErrorMessage(err.response.data.message);
            return;
        }
        if (err?.response?.statusCode === 404) {
            return;
        }
        if (err === "ECONNREFUSED 127.0.0.1:80") {
            return vscode.window.showErrorMessage(`Algum erro com o Axios ocorreu, reinicie o VS Code, ou contate a staff.`);
        }

		return vscode.window.showErrorMessage(`${err.response?.data ? err.response.data?.message : err}`);
	}

    if ([504, 222].includes(data.statusCode) && data.status === "error") {
        createLogs(data.message, { text: data.logs }, "error_app.log");
        return 222;
    }

    return data;
}