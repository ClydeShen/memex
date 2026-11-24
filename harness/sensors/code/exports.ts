import { basename } from "node:path";
import ts from "typescript-scanner";

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false);

const declaredNames = (statement: ts.VariableStatement): string[] =>
  statement.declarationList.declarations.flatMap((declaration) =>
    ts.isIdentifier(declaration.name) ? [declaration.name.text] : [],
  );

const exportedNames = (statement: ts.Statement): string[] => {
  if (ts.isVariableStatement(statement) && hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
    return declaredNames(statement);
  }
  if (
    (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
    hasModifier(statement, ts.SyntaxKind.ExportKeyword)
  ) {
    return statement.name === undefined ? ["default"] : [statement.name.text];
  }
  if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
    const clause = statement.exportClause;
    if (clause === undefined) {
      return ["*"];
    }
    return ts.isNamedExports(clause)
      ? clause.elements.filter((element) => !element.isTypeOnly).map((element) => element.name.text)
      : [clause.name.text];
  }
  return ts.isExportAssignment(statement) ? ["default"] : [];
};

export const runtimeExports = (fileName: string, source: string): readonly string[] => {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  return [...new Set(sourceFile.statements.flatMap(exportedNames))];
};

const mainNameStem = (name: string): string =>
  name.replace(/^create(?=[A-Z])/, "").replace(/Schema$/, "");

export const kebabCase = (name: string): string =>
  name
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replaceAll("_", "-")
    .toLowerCase();

const ENTRY_FILE = /(?:^|\/)index\.ts$/;
const TEST_FILE = /\.test\.ts$/;

export type ExportProblem = { readonly message: string };

export const checkMainExport = (fileName: string, source: string): readonly ExportProblem[] => {
  if (ENTRY_FILE.test(fileName) || TEST_FILE.test(fileName)) {
    return [];
  }
  const names = runtimeExports(fileName, source);
  const fileStem = basename(fileName, ".ts");
  if (names.length > 1) {
    return [
      {
        message: `${fileName}: exports ${names.length} names (${names.join(", ")}). Split the file so that each file exports one main name.`,
      },
    ];
  }
  const [name] = names;
  if (name !== undefined && kebabCase(mainNameStem(name)) !== fileStem) {
    return [
      {
        message: `${fileName}: exports ${name}, so the file should be named ${kebabCase(mainNameStem(name))}.ts. Rename the file or the export.`,
      },
    ];
  }
  return [];
};
