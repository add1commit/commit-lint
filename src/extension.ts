import * as vscode from 'vscode';
import { TreeViewProvider } from './view';
import { GitExtension, Repository } from './git';
import { multiStepInput } from './multiStepInput';
import { ExtensionContext, commands, window } from 'vscode';

// export function activate(context: ExtensionContext) {
//     console.log(vscode);
//     vscode.window.registerTreeDataProvider('commitLintActionsTreeView', new TreeViewProvider());
//     context.subscriptions.push(
//         commands.registerCommand('commit-lint.feat', async () => {
//             multiStepInput(context);
//         }),
//     );
// }

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 *
 * @param context - The context of the extension.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        const workspaceFolder = await getWorkspaceFolder().catch((error) => {
            throw new Error();
        });

        vscode.window.registerTreeDataProvider('commitLintActionsTreeView', new TreeViewProvider());

        const { name, uri } = workspaceFolder;

        let featCommand = vscode.commands.registerCommand('commit-lint.feat', async () => {
            const git = await getGitExtension();

            if (!git) {
                vscode.window.showErrorMessage('Unable to load Git Extension');
                return;
            }
            if (!uri) {
                console.log(workspaceFolder);
                return;
            }
            const selectedRepository = git.repositories.find((repo) => repo.rootUri.path === workspaceFolder.uri.fsPath);
            if (!selectedRepository) {
                vscode.window.showInformationMessage(`The folder(${name}) needs to initialized Repo.`);
                return;
            }
            // await onProcessFlow('Feat');
            await modifyCommit(selectedRepository);
        });

        let disposable = vscode.commands.registerCommand('commit-lint.helloWorld', async (tips?) => {
            vscode.window.showInformationMessage(tips);
            context.subscriptions.push(disposable, featCommand);
        });
    } catch (error) {
        vscode.window.showInformationMessage(error.message);
    }
}

export function deactivate() {}

/**
 * Modify the git commit.
 */
async function modifyCommit(repo: Repository) {
    repo.inputBox.visible = false;
    // repo.inputBox.value = content;
}

/**
 * Gets the git extension.
 */
async function getGitExtension() {
    const vscodeGit = vscode.extensions.getExtension<GitExtension>('vscode.git');
    const gitExtension = vscodeGit && vscodeGit.exports;
    return gitExtension && gitExtension.getAPI(1);
}

/**
 * Gets the workspace path.
 */
async function getWorkspaceFolder(): Promise<vscode.WorkspaceFolder> {
    let workspaceFolder: vscode.WorkspaceFolder | undefined;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
        workspaceFolder = vscode.workspace.workspaceFolders[0];
    } else {
        workspaceFolder = await vscode.window.showWorkspaceFolderPick();
    }
    if (!workspaceFolder) {
        throw new Error('No workspace folder was set.');
    }
    return workspaceFolder;
}
