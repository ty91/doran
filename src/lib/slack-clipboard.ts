import type { Element, Root as HastRoot } from "hast";
import type { BlockContent, DefinitionContent, PhrasingContent, Root, RootContent } from "mdast";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const headingTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function rehypeHeadingsToBold() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (!headingTags.has(node.tagName)) return;
      const strong: Element = {
        type: "element",
        tagName: "strong",
        properties: {},
        children: node.children,
      };
      node.tagName = "p";
      node.properties = {};
      node.children = [strong];
    });
  };
}

const htmlProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeHeadingsToBold)
  .use(rehypeStringify);

const mdastProcessor = unified().use(remarkParse);

export function markdownToSlackHtml(markdown: string): string {
  return String(htmlProcessor.processSync(markdown));
}

function phrasing(nodes: PhrasingContent[]): string {
  return nodes.map(phrasingNode).join("");
}

function phrasingNode(node: PhrasingContent): string {
  switch (node.type) {
    case "text":
      return node.value;
    case "strong":
      return `*${phrasing(node.children)}*`;
    case "emphasis":
      return `_${phrasing(node.children)}_`;
    case "delete":
      return `~${phrasing(node.children)}~`;
    case "inlineCode":
      return `\`${node.value}\``;
    case "link": {
      const label = phrasing(node.children);
      return label && label !== node.url ? `${label} (${node.url})` : node.url;
    }
    case "break":
      return "\n";
    case "image":
      return node.alt ?? "";
    default:
      return "children" in node ? phrasing(node.children as PhrasingContent[]) : "";
  }
}

function indentLines(text: string, indent: string): string {
  return text
    .split("\n")
    .map((line) => (line ? indent + line : line))
    .join("\n");
}

function block(node: RootContent | BlockContent | DefinitionContent, depth: number): string {
  switch (node.type) {
    case "heading":
      return `*${phrasing(node.children)}*`;
    case "paragraph":
      return phrasing(node.children);
    case "list": {
      const indent = "    ".repeat(depth);
      return node.children
        .map((item, index) => {
          const marker = node.ordered ? `${(node.start ?? 1) + index}. ` : "• ";
          const parts = item.children.map((child) =>
            child.type === "list" ? block(child, depth + 1) : block(child, depth),
          );
          const continuation = indent + " ".repeat(marker.length);
          const [first = "", ...rest] = parts;
          const [firstLine = "", ...firstRest] = first.split("\n");
          return [
            indent + marker + firstLine,
            ...firstRest.map((line) => (line ? continuation + line : line)),
            ...rest.map((part) => (part.startsWith(" ") ? part : indentLines(part, continuation))),
          ].join("\n");
        })
        .join("\n");
    }
    case "blockquote":
      return node.children.map((child) => indentLines(block(child, depth), "> ")).join("\n>\n");
    case "code":
      return `\`\`\`\n${node.value}\n\`\`\``;
    case "thematicBreak":
      return "———";
    case "html":
      return node.value;
    default:
      return "children" in node ? phrasing(node.children as PhrasingContent[]) : "";
  }
}

export function markdownToSlackText(markdown: string): string {
  const tree = mdastProcessor.parse(markdown) as Root;
  return tree.children
    .map((child) => block(child, 0))
    .filter(Boolean)
    .join("\n\n");
}
