import * as vscode from 'vscode';
import { TreeViewProvider } from './view';

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 *
 * @param context - The context of the extension.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  vscode.window.registerTreeDataProvider('commitLintActionsTreeView', new TreeViewProvider());

  const workspaceFolder = await getWorkspaceFolder();
  console.log('Congratulations, your extension "commit-lint" is now active!');

  console.log(workspaceFolder);
  let disposable = vscode.commands.registerCommand('commit-lint.helloWorld', async () => {
    vscode.window.showInformationMessage('Hello World from Commit-Lint!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

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
