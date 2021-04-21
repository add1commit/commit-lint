import { Repository } from './types/git';
import { ExtensionContext, commands, window } from 'vscode';
import { initCommitLint, State } from './service/stepService';
import CommitLintService from './service/commitService';
import { getGitExtension, getWorkspaceFolder } from './utils';

/**
 * This method is called when commitLint is activated.
 *
 * @param context - The context of the extension.
 */
export async function activate(context: ExtensionContext): Promise<void> {
    try {
        const workspaceFolder = await getWorkspaceFolder().catch((error) => {
            throw new Error();
        });

        const { name, uri } = workspaceFolder;

        new CommitLintService().registerDisposables();

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
                const state = await initCommitLint(context);
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
