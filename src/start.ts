import {
  DocumentFormattingEditProvider,
  Range,
  TextDocument,
  TextEdit,
  window,
  workspace
} from "vscode";
import { AngularFormatterConfig } from "./angular-formatter.config";
import { format } from "./formatter";

export class AngularFormatter implements DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
    const config: AngularFormatterConfig = {
      useSpaces: workspace
        .getConfiguration("angular-formatter")
        .get("useSpaces", true),
      indentation: workspace
        .getConfiguration("angular-formatter")
        .get<number>("indentWidth", 4),
      closeTagSameLine: workspace
        .getConfiguration("angular-formatter")
        .get("closeTagSameLine", true),
      attrOrder: workspace
        .getConfiguration("angular-formatter")
        .get("attributeOrder", ["*", "[", "("]),
    };

    try {
      if (document.fileName.endsWith(".scala.html")) {
        return [];
      }
      let text = document.getText();
      return [
        TextEdit.replace(
          new Range(document.positionAt(0), document.positionAt(text.length)),
          format(text, config)
        ),
      ];
    } catch (e) {
      window.showErrorMessage(e.message);
    }
  }
}
