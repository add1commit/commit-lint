import { Disposable, Uri, workspace } from 'vscode';
import { CommitLintStatus, StatusBarService } from './statusBarService';
import { readFileSync } from 'fs';

/**
 * CommitLint reads configuration from files
 */
const COMMITLINT_CONFIG_FILES = ['.commitrc', 'commit.config.js'];

export default class CommitLintService implements Disposable {
    constructor() {}

    public registerDisposables(): Disposable[] {
        const commitLintConfigWatcher = workspace.createFileSystemWatcher(`**/{${COMMITLINT_CONFIG_FILES.join(',')}}`);

        commitLintConfigWatcher.onDidCreate(this.commitLintConfigChanged);
        commitLintConfigWatcher.onDidChange(this.commitLintConfigChanged);
        commitLintConfigWatcher.onDidDelete(this.commitLintConfigChanged);

        return [commitLintConfigWatcher];
    }

    public commitLintConfigChanged = async (uri: Uri) => this.resetCommitLint(uri);

    private resetCommitLint = async (uri: Uri) => {
        if (!uri) {
            this.statusBarService.update(CommitLintStatus.enable);
            return;
        }
        const res = readFileSync(uri.fsPath, 'utf-8');
        this.commitLintConfigGenerate(res);
        this.statusBarService.update(CommitLintStatus.withProfile);
    };

    private commitLintConfigGenerate(data: string) {
        this;
    }

    private statusBarService = new StatusBarService();

    public dispose = () => {};
}
