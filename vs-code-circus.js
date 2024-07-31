const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand("pluto-syntax-highlighting.run", function () {
		vscode.tasks.executeTask(new vscode.Task(
			{ type: "shell" },
			vscode.TaskScope.Workspace,
			"Pluto: Run Script",
			"pluto-syntax-highlighting",
			new vscode.ShellExecution("pluto", [vscode.window.activeTextEditor.document.fileName])
		));
	}));
	context.subscriptions.push(vscode.commands.registerCommand("pluto-syntax-highlighting.lint", function () {
		vscode.tasks.executeTask(new vscode.Task(
			{ type: "shell" },
			vscode.TaskScope.Workspace,
			"Pluto: Lint Script",
			"pluto-syntax-highlighting",
			new vscode.ShellExecution("plutoc", ["-p", vscode.window.activeTextEditor.document.fileName])
		));
	}));
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
