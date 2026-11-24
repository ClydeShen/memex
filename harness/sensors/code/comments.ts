import ts from "typescript-scanner";

export type Comment = { readonly line: number; readonly text: string };

export type CommentProblem = { readonly line: number; readonly message: string };

const DIRECTIVE = /^\/\/\s*(biome-ignore\S*|@ts-expect-error|@ts-ignore)(.*)$/;
const ISSUE = /#\d+/;
const BIOME_CATEGORY = /^\s*[\w/-]+\s*:/;

const REMOVE_MESSAGE =
  "Express this fact as a name, a type, a test or a document. See harness/rules/coding.md.";
const DIRECTIVE_MESSAGE =
  "Write the reason and the issue number (#123) on the same line as the directive, or fix the cause.";

export const findComments = (fileName: string, source: string): readonly Comment[] => {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const found = new Map<number, Comment>();
  const add = (range: ts.CommentRange): void => {
    found.set(range.pos, {
      line: sourceFile.getLineAndCharacterOfPosition(range.pos).line + 1,
      text: source.slice(range.pos, range.end),
    });
  };
  const visit = (node: ts.Node): void => {
    for (const range of ts.getLeadingCommentRanges(source, node.getFullStart()) ?? []) {
      add(range);
    }
    for (const range of ts.getTrailingCommentRanges(source, node.getEnd()) ?? []) {
      add(range);
    }
    for (const child of node.getChildren(sourceFile)) {
      visit(child);
    }
  };
  visit(sourceFile);
  return [...found.values()].sort((first, second) => first.line - second.line);
};

const hasReasonAndIssue = (rest: string): boolean => {
  const reason = rest.replaceAll(/#\d+/g, "").replace(BIOME_CATEGORY, "").trim();
  return ISSUE.test(rest) && reason !== "";
};

export const checkComments = (fileName: string, source: string): readonly CommentProblem[] =>
  findComments(fileName, source).flatMap(({ line, text }) => {
    const directive = DIRECTIVE.exec(text);
    if (directive === null) {
      return [{ line, message: REMOVE_MESSAGE }];
    }
    return hasReasonAndIssue(directive[2] ?? "") ? [] : [{ line, message: DIRECTIVE_MESSAGE }];
  });
