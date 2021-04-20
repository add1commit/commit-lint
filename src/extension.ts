import { GitExtension, Repository } from './git';
import { ExtensionContext, commands, window, extensions, WorkspaceFolder, workspace } from 'vscode';
import { StatusBar } from './StatusBar';
import { multiStepInput, State } from './multiStepInput';
/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 *
 * @param context - The context of the extension.
 */
export async function activate(context: ExtensionContext): Promise<void> {
    try {
        const workspaceFolder = await getWorkspaceFolder().catch((error) => {
            throw new Error();
        });

        const { name, uri } = workspaceFolder;

        new StatusBar();

        context.subscriptions.push(
            commands.registerCommand('commit-lint.init', async () => {
                const git = await getGitExtension();

                if (!git) {
                    window.showErrorMessage('Unable to load Git Extension');
                    return;
                }
                if (!uri) {
                    console.log(workspaceFolder);
                    return;
                }
                const selectedRepository = git.repositories.find((repo) => repo.rootUri.path === workspaceFolder.uri.fsPath);
                if (!selectedRepository) {
                    window.showInformationMessage(`The folder(${name}) needs to initialized Repo.`);
                    return;
                }
                const state = await multiStepInput(context);
                await modifyCommit(selectedRepository, state);
            }),
        );
    } catch (error) {
        window.showInformationMessage(error.message);
    }
}

export function deactivate() {}

/**
 * Modify the git commit.
 */
async function modifyCommit(repo: Repository, state: State) {
    console.log(state);
    repo.inputBox.value = '1111';
    window.showInformationMessage('');
}

/**
 * Gets the git extension.
 */
async function getGitExtension() {
    const vscodeGit = extensions.getExtension<GitExtension>('vscode.git');
    const gitExtension = vscodeGit && vscodeGit.exports;
    return gitExtension && gitExtension.getAPI(1);
}

/**
 * Gets the workspace path.
 */
async function getWorkspaceFolder(): Promise<WorkspaceFolder> {
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
