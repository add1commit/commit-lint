import { extensions, Memento, Uri, window, workspace, WorkspaceFolder } from 'vscode';
import { Commitrc } from '../../typings/commitrc';
import { GitExtension } from '../../typings/git';
import { existsSync, readFile } from 'fs';
import { CHECK_CONFIG, NO_WORKSPACE } from '../message';
import * as _ from 'lodash';
import { getConfiguration } from '../config';
/**
 * Gets the git extension.
 */
export async function getGitExtension() {
    const vscodeGit = extensions.getExtension<GitExtension>('vscode.git');
    const gitExtension = vscodeGit && vscodeGit.exports;
    return gitExtension && gitExtension.getAPI(1);
}

/**
 * Gets the workspace path.
 */
export async function getWorkspaceFolder(): Promise<WorkspaceFolder> {
    let workspaceFolder: WorkspaceFolder | undefined;
    if (workspace.workspaceFolders && workspace.workspaceFolders.length === 1) {
        workspaceFolder = workspace.workspaceFolders[0];
    } else {
        workspaceFolder = await window.showWorkspaceFolderPick();
    }
    if (!workspaceFolder) {
        throw new Error(NO_WORKSPACE);
    }
    return workspaceFolder;
}

export async function readConfig(uri: Uri): Promise<Commitrc> {
    const readConfigFile = async (): Promise<string> =>
        new Promise((resolve, reject) => {
            readFile(uri.fsPath, 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    try {
        let data = await readConfigFile();
        return JSON.parse(data);
    } catch (err) {
        throw new Error(CHECK_CONFIG(uri.fsPath));
    }
}

export function isFileExists(uri: Uri): boolean {
    return existsSync(uri.fsPath);
}

export async function mergeConfiguration(workspaceConfig: Memento | unknown = {}) {
    const mergeCommitrcOption = (origin: any[], source: any[]) => {
        const tempMap = new Map(),
            mergeResult = [];
        origin.forEach((item: any) => tempMap.set(item.label, item));
        source.forEach((item: any) => tempMap.set(item.label, item));
        for (let [{}, value] of tempMap) {
            if (_.isUndefined(value.visible) || value.visible) {
                mergeResult.push(value);
            }
        }
        return mergeResult;
    };
    const useConfiguration = (target: any, source: any = {}) => {
        if (_.isEmpty(source)) {
            return target;
        }
        let result: any = {};

        for (const key of Object.keys(target)) {
            if (key === 'types') {
                result[key] = !_.isEmpty(source[key]) ? mergeCommitrcOption(target[key], source[key]) : target[key];
            } else if (_.isObject(target[key])) {
                result[key] = { ...target[key], ...source[key] };
            } else {
                result[key] = source[key] ?? target[key];
            }
        }
        return result;
    };

    if (!workspaceConfig) {
        return getConfiguration();
    }
    return useConfiguration(getConfiguration(), workspaceConfig);
}
