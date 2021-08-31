import {
  Attribute,
  Comment,
  Expansion,
  ExpansionCase,
  HtmlParser,
  I18NHtmlParser,
  Node,
  ParseSourceSpan,
  Text,
  Visitor
} from "@angular/compiler";
import { AngularFormatterConfig } from "./angular-formatter.config";
import { SELF_CLOSING, SKIP_FORM_CHILDREN } from "./formatter.utils";

function formatElementName(name: string) {
  return name.replace(/^:svg:/, "");
}

export function format(src: string, config: AngularFormatterConfig): string {
  const rawHtmlParser = new HtmlParser();
  const htmlParser = new I18NHtmlParser(rawHtmlParser);
  const htmlResult = htmlParser.parse(src, "");

  let result: string[] = [];
  let indent = 0;
  let attrNewLines = false;

  if (htmlResult.errors && htmlResult.errors.length > 0) {
    return src;
  }

  const detectedDoctype = src.match(/^\s*<!DOCTYPE((.|\n|\r)*?)>/i);

  if (detectedDoctype) {
    result.push(detectedDoctype[0].trim());
  }

  let getIndent = (i: number): string => {
    if (config.useSpaces) {
      return new Array(i * config.indentation).fill(" ").join("");
    } else {
      return new Array(i).fill("\t").join("");
    }
  };

  function getFromSource(parseLocation: ParseSourceSpan) {
    return parseLocation.start.file.content.substring(
      parseLocation.start.offset,
      parseLocation.end.offset
    );
  }

  let visitor: Visitor = {
    visitElement: function (element) {
      if (result.length > 0) {
        result.push("\n");
      }

      result.push(getIndent(indent) + "<" + formatElementName(element.name));

      attrNewLines = element.attrs.length > 1 && element.name != "link";

      element.attrs = attrsSort(element.attrs, config.attrOrder);
      element.attrs.forEach((attr, index) => {
        attr.visit(visitor, {
          first: index == 0,
        });
      });

      if (!config.closeTagSameLine && attrNewLines) {
        result.push("\n" + getIndent(indent));
      }

      result.push(">");

      indent++;

      let ctx = {
        inlineTextNode: false,
        textNodeInlined: false,
        skipFormattingChildren: SKIP_FORM_CHILDREN.includes(element.name),
      };

      if (!attrNewLines && element.children.length == 1) {
        ctx.inlineTextNode = true;
      }

      element.children.forEach((element) => {
        element.visit(visitor, ctx);
      });

      indent--;

      if (!ctx.textNodeInlined && !ctx.skipFormattingChildren) {
        result.push("\n" + getIndent(indent));
      }

      if (!SELF_CLOSING.includes(element.name)) {
        result.push(`</${formatElementName(element.name)}>`);
      }
    },

    visit: function (node: Node, context: any) {
      console.error("IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED");
    },
    visitAttribute: function (attribute: Attribute, context: any) {
      let prefix =
        attrNewLines && !context.first ? "\n" + getIndent(indent + 1) : " ";
      result.push(prefix + attribute.name);
      if (attribute.value.length) {
        const value = getFromSource(attribute.valueSpan);
        result.push(`="${value.trim()}"`);
      }
    },
    visitComment: function (comment: Comment, context: any) {
      result.push(
        "\n" + getIndent(indent) + "<!-- " + comment.value.trim() + " -->"
      );
    },
    visitExpansion: function (expansion: Expansion, context: any) {
      console.error("IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED");
    },
    visitExpansionCase: function (expansionCase: ExpansionCase, context: any) {
      console.error("IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED");
    },
    visitText: function (text: Text, context: any) {
      const value = getFromSource(text.sourceSpan);
      if (context.skipFormattingChildren) {
        result.push(value);
        return;
      }
      let shouldInline =
        context.inlineTextNode &&
        value.trim().length < 40 &&
        value.trim().length + result[result.length - 1].length < 140;

      context.textNodeInlined = shouldInline;
      if (value.trim().length > 0) {
        let prefix = shouldInline ? "" : "\n" + getIndent(indent);
        result.push(prefix + value.trim());
      } else if (!shouldInline) {
        result.push(
          value
            .replace("\n", "")
            .replace(/ /g, "")
            .replace(/\t/g, "")
            .replace(/\n+/, "\n")
        );
      }
    },
  };

  htmlResult.rootNodes.forEach((node) => {
    node.visit(visitor, {});
  });

  return result.join("").trim() + "\n";
}

function attrsSort(attrs: Attribute[], attrOrder): Attribute[] {
  if (attrs) {
    let attrGroups = {};
    attrOrder.forEach((key) => {
      attrGroups[key] = [];
    });

    const result = [];
    attrGroups["others"] = [];
    attrs.forEach((attr) => {
      const index = attrOrder.indexOf(attr.name[0]);
      if (index >= 0) {
        attrGroups[attrOrder[index]].push(attr);
      } else {
        attrGroups["others"].push(attr);
      }
    });

    Object.keys(attrGroups).forEach((key) => {
      result.push(...attrGroups[key]);
    });
    attrGroups = {};

    return result;
  }
  return [];
}
