import { Uri } from "vscode";
import app from "./app";
import * as path from "path";

export function flatten(items) {
  const accumulater = (result, item) => result.concat(item);
  return items.reduce(accumulater, []);
}

export function interpolate(str: string, props: { [x: string]: string }) {
  return str.replace(/\${([^{}]*)}/g, (match, expr) => {
    const value = props[expr];
    return typeof value === 'string' || typeof value === 'number' ? value : match;
  });
}

export function getIcon(name) {
  return {
    light: Uri.file(path.join(app.ctx.extensionPath, 'resources', 'light', name + '.svg')),
    dark: Uri.file(path.join(app.ctx.extensionPath, 'resources', 'dark', name + '.svg'))
  };
}