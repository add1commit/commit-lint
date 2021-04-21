import { extensions, window, workspace, WorkspaceFolder } from 'vscode';
import { GitExtension, Repository } from '../types/git';

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
        throw new Error('No workspace folder was set.');
    }
    return workspaceFolder;
}
