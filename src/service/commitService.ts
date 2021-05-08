import { Disposable, Uri, workspace } from 'vscode';
import { CommitLintStatus, StatusBarService } from './statusBarService';
import { LoggingService } from './loggingService';
import { RESTART_TO_ENABLE, USE_GLOBAL_CONFIG } from '../message';
import { isFileExists, readConfig } from '../utils';
import { updateWorkspaceState } from '../utils/state';

/**
 * CommitLint reads configuration from files
 */
export const COMMITLINT_CONFIG_FILES = ['.commitrc', 'commit.config.js'];

export class CommitLintService implements Disposable {
    constructor(private loggingService: LoggingService, private statusBarService: StatusBarService) {}

    public handleConfiguration = async (uri: Uri) => {
        const [files] = await workspace.findFiles(`**/{${COMMITLINT_CONFIG_FILES.join(',')}}`);
        if (!files) {
            updateWorkspaceState(uri.fsPath, null);
            this.statusBarService.update(CommitLintStatus.enable);
            this.loggingService.info(USE_GLOBAL_CONFIG);
            return;
        }
        this.resetConfig(files);
    };

    public registerDisposables(): Disposable[] {
        const configurationWatcher = workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('commit-lint.enable')) {
                this.loggingService.warning(RESTART_TO_ENABLE);
            } else if (event.affectsConfiguration('commit-lint')) {
                this.resetConfig();
            }
        });

        const commitLintConfigWatcher = workspace.createFileSystemWatcher(`**/{${COMMITLINT_CONFIG_FILES.join(',')}}`);

        commitLintConfigWatcher.onDidCreate(this.commitLintConfigChanged);
        commitLintConfigWatcher.onDidChange(this.commitLintConfigChanged);
        commitLintConfigWatcher.onDidDelete(this.commitLintConfigChanged);

        return [configurationWatcher, commitLintConfigWatcher];
    }

    public commitLintConfigChanged = async (uri: Uri) => this.resetConfig(uri);

    private resetConfig = async (uri?: Uri) => {
        try {
            if (uri) {
                const workspaceFolder = workspace.getWorkspaceFolder(uri);
                const isExist = await isFileExists(uri);
                if (!isExist) {
                    updateWorkspaceState(workspaceFolder?.uri.fsPath ?? 'temp', null);
                    this.statusBarService.update(CommitLintStatus.enable);
                    this.loggingService.info(USE_GLOBAL_CONFIG);
                    return;
                }
                const config = await readConfig(uri);

                updateWorkspaceState(workspaceFolder?.uri.fsPath ?? 'temp', config);
                this.loggingService.info(`Configuration File: ${uri.fsPath}`);
                this.statusBarService.update(CommitLintStatus.withProfile);
            } else {
                // VS Code config change, reset everything
                this.statusBarService.hide();
            }
        } catch (error) {
            this.loggingService.error(error);
        }
    };

    public dispose = () => {};
}
