"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    let disposable = vscode.commands.registerCommand("json-extension.generateClass", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        let jsonData;
        try {
            const cleanedJson = cleanJson(selectedText);
            jsonData = JSON.parse(cleanedJson);
        }
        catch (error) {
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
    });
    context.subscriptions.push(disposable);
}
function cleanJson(jsonInput) {
    return jsonInput
        .split("\n")
        .filter((line) => !line.trim().startsWith("//")) // Ignore lines that start with `//`
        .join("\n");
}
function generateClass(className, jsonData) {
    const classes = [];
    const mainClass = processObject(className, jsonData, classes);
    return classes.join("\n\n") + "\n\n" + mainClass;
}
function processObject(className, jsonData, classes) {
    const fields = Object.entries(jsonData).map(([key, value]) => {
        if (typeof value === "object" && !Array.isArray(value) && value !== null) {
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
function inferType(value) {
    if (typeof value === "string")
        return "string";
    if (typeof value === "number")
        return "number";
    if (typeof value === "boolean")
        return "boolean";
    if (Array.isArray(value))
        return value.length > 0 ? `${inferType(value[0])}[]` : "any[]";
    if (typeof value === "object" && value !== null)
        return "any";
    return "unknown";
}
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function deactivate() { }
