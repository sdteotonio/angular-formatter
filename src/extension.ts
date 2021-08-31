"use strict";
import { ExtensionContext, languages } from "vscode";
import { AngularFormatter } from "./start";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      "html",
      new AngularFormatter()
    )
  );
}
