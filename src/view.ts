import * as vscode from 'vscode';

class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;

  constructor(label: string, contextValue: string, iconPath?: vscode.ThemeIcon) {
    super(label);
    this.contextValue = contextValue;
    this.iconPath = iconPath;
  }
}

export class TreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private data: TreeItem[] = [
    new TreeItem('Feat', 'commit-feat', new vscode.ThemeIcon('beaker')),
    new TreeItem('Fix', 'commit-fix', new vscode.ThemeIcon('bug')),
    new TreeItem('Refactor', 'commit-refactor', new vscode.ThemeIcon('zap')),
    new TreeItem('Chore', 'commit-chore', new vscode.ThemeIcon('package')),
    new TreeItem('Build', 'commit-build', new vscode.ThemeIcon('star')),
    new TreeItem('Revert', 'commit-revert', new vscode.ThemeIcon('plug')),
    new TreeItem('Perf', 'commit-perf', new vscode.ThemeIcon('beaker')),
    new TreeItem('Test', 'commit-test', new vscode.ThemeIcon('debug-alt-small')),

  ];

  public getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}
