import { StatusBarAlignment, StatusBarItem, window } from 'vscode';

export enum CommitLintStatus {
    enable = 'check',
    withProfile = 'check-all',
}

export class StatusBarService {
    private statusBarItem: StatusBarItem;

    constructor() {
        // Setup the statusBarItem
        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, -1);
        this.statusBarItem.text = 'Commit-Lint';
        this.statusBarItem.command = 'commit-lint.output';
        this.update(CommitLintStatus.enable);
        this.statusBarItem.show();
    }
    /**
     * Update the statusBarItem message and show the statusBarItem
     *
     * @param icon The the icon to use
     */
    public update(result: CommitLintStatus): void {
        this.statusBarItem.text = `$(${result.toString()}) CommitLint`;

        this.statusBarItem.show();
    }

    public hide() {
        this.statusBarItem.hide();
    }
}
