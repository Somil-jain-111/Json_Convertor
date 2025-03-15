import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "json-extension.generateClass",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      let jsonData: Record<string, any>;
      
      try {
        const cleanedJson = cleanJson(selectedText);
        jsonData = JSON.parse(cleanedJson);
      } catch (error) {
        vscode.window.showErrorMessage("Invalid JSON format.");
        return;
      }

      const className = await vscode.window.showInputBox({
        prompt: "Enter class name",
        placeHolder: "User",
      });

      if (!className) {
        vscode.window.showErrorMessage("No class name provided.");
        return;
      }

      const generatedClass = generateClass(className, jsonData);

      editor.edit((editBuilder) => {
        // Remove the selected JSON
        editBuilder.replace(selection, generatedClass);
      });

      vscode.window.showInformationMessage(`Class ${className} generated!`);
    }
  );

  context.subscriptions.push(disposable);
}

function cleanJson(jsonInput: string): string {
  return jsonInput
    .split("\n")
    .filter((line) => !line.trim().startsWith("//")) // Ignore lines that start with `//`
    .join("\n");
}

function generateClass(
  className: string,
  jsonData: Record<string, any>
): string {
  const classes: string[] = [];
  const mainClass = processObject(className, jsonData, classes);
  return classes.join("\n\n") + "\n\n" + mainClass;
}

function processObject(
  className: string,
  jsonData: Record<string, any>,
  classes: string[]
): string {
  const fields = Object.entries(jsonData).map(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "object") {
        const subClassName = capitalizeFirstLetter(key) + "Item"; // e.g., Product -> ProductItem
        const subClass = processObject(subClassName, value[0], classes);
        classes.push(subClass);
        return { name: key, type: `${subClassName}[]` };
      }
      return { name: key, type: inferType(value) };
    } else if (typeof value === "object" && value !== null) {
      const subClassName = capitalizeFirstLetter(key);
      const subClass = processObject(subClassName, value, classes);
      classes.push(subClass);
      return { name: key, type: subClassName };
    }
    return { name: key, type: inferType(value) };
  });

  return `
class ${className} {
  ${fields.map((f) => `public ${f.name}: ${f.type};`).join("\n  ")}

  constructor(${fields.map((f) => `${f.name}: ${f.type}`).join(", ")}) {
    ${fields.map((f) => `this.${f.name} = ${f.name};`).join("\n    ")}
  }
}`;
}

function inferType(value: any): string {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value))
    return value.length > 0 ? `${inferType(value[0])}[]` : "any[]";
  if (typeof value === "object" && value !== null) return "any";
  return "unknown";
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function deactivate() {}
