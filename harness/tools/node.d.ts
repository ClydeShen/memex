// The repository has no @types/node. These are the only Node APIs that harness/tools/ uses,
// declared as narrowly as they are used.

declare module "node:child_process" {
  export const execFileSync: (
    file: string,
    args: readonly string[],
    options: { encoding: "utf8"; maxBuffer?: number },
  ) => string;
}

declare const process: {
  argv: string[];
  exitCode: number | undefined;
  stdout: { write: (text: string) => boolean };
  stderr: { write: (text: string) => boolean };
};
