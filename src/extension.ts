import { ExtensionContext, commands, window, workspace } from 'vscode';
import { collectFlow } from './service/flowService';
import { LoggingService } from './service/loggingService';
import { StatusBarService } from './service/statusBarService';
import { CommitLintService } from './service/commitService';
import { getGitExtension, getWorkspaceFolder } from './utils';
import { State } from '../typings/commitrc';
import { Repository } from '../typings/git';

import { EXTENSION_DISABLED, GIT_NOT_ENABLED, REPO_NO_INIT, RESTART_TO_ENABLE } from './message';
import { setGlobalState, setWorkspaceState } from './utils/state';

const extensionPackage = require('../package.json');

const extensionName = extensionPackage.name || 'dev.commit-lint';
const extensionVersion = extensionPackage.version || '0.0.0';
const loggingService = new LoggingService();

/**
 * This method is called when commitLint is activated.
 *
 * @param context - The context of the extension.
 */
export async function activate(context: ExtensionContext): Promise<void> {
    const statusBarService = new StatusBarService();
    loggingService.info(`Extension Name: ${extensionName}.`);
    loggingService.info(`Extension Version: ${extensionVersion}.`);

    try {
        const workspaceFolder = await getWorkspaceFolder();

        const { name, uri } = workspaceFolder;

        const { enable, enableDebugLogs } = workspace.getConfiguration('commit-lint');

        if (enableDebugLogs) {
            loggingService.setOutputLevel('DEBUG');
        }

        if (!enable) {
            loggingService.info(EXTENSION_DISABLED);
            context.subscriptions.push(
                workspace.onDidChangeConfiguration((event) => {
                    if (event.affectsConfiguration('commit-lint.enable')) {
                        loggingService.info(RESTART_TO_ENABLE);
                    }
                }),
            );
            return;
        }
        setGlobalState(context.globalState);
        setWorkspaceState(context.workspaceState);
        const commitService = new CommitLintService(loggingService, statusBarService);

        commitService.handleConfiguration(uri);

        const openOutputCommand = commands.registerCommand('commit-lint.output', () => loggingService.show());

        const initCommand = commands.registerCommand('commit-lint.init', async () => {
            const gitExtension = await getGitExtension();

            if (!gitExtension || !uri) {
                throw new Error(GIT_NOT_ENABLED);
            }

            const currentRepo = gitExtension.repositories.find((repo) => repo.rootUri.fsPath === workspaceFolder.uri.fsPath);

            if (!currentRepo) {
                throw new Error(REPO_NO_INIT(name));
            }

            const state = await collectFlow(context, uri);
            await output(currentRepo, state);
        });

        context.subscriptions.push(commitService, openOutputCommand, initCommand, ...commitService.registerDisposables());
    } catch (error) {
        loggingService.error(error);
    }
}

export function deactivate() {}

/**
 * Modify the git commit.
 */
async function output(repo: Repository, state: State) {
    const { type, subject, scope, body, footer } = state;
    let value = `${type.label}: `;
    if (scope) {
        value = `${type.label}(${scope}): `;
    }
    if (subject) {
        value = value + `${subject}`;
    }
    if (body) {
        value = value + `\n\n${body}`;
    }
    if (footer) {
        value = value + `\n\n${footer}`;
    }
    repo.inputBox.value = value;
    loggingService.info('Output:', state);
}
