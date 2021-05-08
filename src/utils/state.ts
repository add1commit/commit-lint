import { Memento } from 'vscode';

let globalState: Memento;
let workspaceState: Memento;

export function updateGlobalState(key: string, value: any) {
    if (!globalState) {
        return;
    }
    return globalState.update(key, value);
}

export function setGlobalState(state: Memento) {
    globalState = state;
}

export function getGlobalState() {
    return globalState.get('global');
}

export function getWorkspaceState(key: string) {
    return workspaceState.get(key);
}

export function updateWorkspaceState(key: string, value: any) {
    if (!workspaceState) {
        return;
    }
    return workspaceState.update(key, value);
}

export function setWorkspaceState(state: Memento) {
    workspaceState = state;
}
