// The report of `pnpm plan:order`: which stories of an epic are ready for each role, which are
// blocked and by what, and where the epic body disagrees with the dependency links on GitHub.
// Pure: GitHub data and the epic body in, the report out. plan-order.ts fetches the data.

type IssueState = "open" | "closed";

export type Issue = {
  number: number;
  title: string;
  state: IssueState;
  labels: string[];
};

export type PlanInput = {
  epic: number;
  body: string;
  subIssues: Issue[];
  // The blockers of each sub-issue, by its number. A blocker can be outside the epic.
  blockedBy: Record<number, Issue[]>;
};

type ReadyGroup = { role: string; issues: Issue[] };
type BlockedIssue = { issue: Issue; openBlockers: number[] };
type Layer = { layer: number; issues: BlockedIssue[] };

export type Report = {
  epic: number;
  cycles: number[][];
  ready: ReadyGroup[];
  blocked: Layer[];
  // Open issues whose blockers never clear because they are in or behind a cycle.
  blockedByCycle: BlockedIssue[];
  mismatches: string[];
};

const ROLE_PREFIX = "role:";
const NO_ROLE = "(no single role label)";
const ISSUE_REFERENCE = /#(\d+)/;
const DIAGRAM_START = "<!-- progress-diagram:start -->";
const DIAGRAM_END = "<!-- progress-diagram:end -->";
const DONE = "\u{1F7E2}";
const READY = "\u{1F535}";
const BLOCKED = "⚫";

// ---- Epic body ----

type EpicBody = {
  statuses: Map<number, string>;
  suggestedOrder: number[];
  diagramIssues: Set<number>;
  diagramBlocks: Array<[number, number]>;
};

const sections = (body: string, heading: RegExp): string[][] => {
  const result: string[][] = [];
  let current: string[] | null = null;
  for (const line of body.split("\n")) {
    if (/^#{1,6}\s/.test(line)) {
      current = heading.test(line) ? [] : null;
      if (current) result.push(current);
    } else if (current) {
      current.push(line);
    }
  }
  return result;
};

// The tables of a section, each as its body rows split into cells. Header and separator rows are dropped.
const tables = (lines: string[]): string[][][] => {
  const result: string[][][] = [];
  let rows: string[][] | null = null;
  for (const line of lines) {
    const isRow = line.trim().startsWith("|");
    if (!isRow) {
      rows = null;
      continue;
    }
    if (!rows) {
      rows = [];
      result.push(rows);
    }
    rows.push(
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
  }
  return result.map((table) => table.slice(2));
};

const issueIn = (cell: string | undefined): number | null => {
  const match = ISSUE_REFERENCE.exec(cell ?? "");
  return match ? Number(match[1]) : null;
};

const parseStatuses = (body: string): Map<number, string> => {
  const statuses = new Map<number, string>();
  for (const section of sections(body, /^#{1,6}\s+All issues\b/i)) {
    for (const row of tables(section).flat()) {
      const issue = issueIn(row[0]);
      if (issue !== null) statuses.set(issue, row[3] ?? "");
    }
  }
  return statuses;
};

// A newer suggested-order table is added below the older ones, so the last table is the current one.
const parseSuggestedOrder = (body: string): number[] => {
  const all = sections(body, /^#{1,6}\s+Suggested order/i).flatMap(tables);
  const last = all.at(-1) ?? [];
  return last.map((row) => issueIn(row[1])).filter((issue) => issue !== null);
};

const parseDiagram = (body: string): Pick<EpicBody, "diagramIssues" | "diagramBlocks"> => {
  const start = body.indexOf(DIAGRAM_START);
  const end = body.indexOf(DIAGRAM_END);
  const diagram = start >= 0 && end > start ? body.slice(start, end) : "";
  const nodes = new Map<string, number>();
  for (const [, id, label] of diagram.matchAll(/(\w+)\["([^"]*)"\]/g)) {
    const issue = issueIn(label);
    if (id && issue !== null) nodes.set(id, issue);
  }
  const blocks: Array<[number, number]> = [];
  for (const line of diagram.replace(/(\w+)\["[^"]*"\]/g, "$1").split("\n")) {
    const parts = line.trim().split(/\s*(==>|-\.->|-->)\s*/);
    for (let index = 1; index + 1 < parts.length; index += 2) {
      const from = nodes.get(parts[index - 1] ?? "");
      const to = nodes.get(parts[index + 1] ?? "");
      if (parts[index] === "==>" && from !== undefined && to !== undefined) blocks.push([from, to]);
    }
  }
  return { diagramIssues: new Set(nodes.values()), diagramBlocks: blocks };
};

const parseEpicBody = (body: string): EpicBody => {
  const normalized = body.replaceAll("\r\n", "\n");
  return {
    statuses: parseStatuses(normalized),
    suggestedOrder: parseSuggestedOrder(normalized),
    ...parseDiagram(normalized),
  };
};

// ---- Dependency graph ----

type Graph = {
  issues: Map<number, Issue>;
  // blocker -> the issues it blocks
  blocks: Map<number, number[]>;
};

const buildGraph = (input: PlanInput): Graph => {
  const issues = new Map<number, Issue>();
  const blocks = new Map<number, number[]>();
  for (const issue of input.subIssues) issues.set(issue.number, issue);
  for (const [blocked, blockers] of Object.entries(input.blockedBy)) {
    for (const blocker of blockers) {
      if (!issues.has(blocker.number)) issues.set(blocker.number, blocker);
      blocks.set(blocker.number, [...(blocks.get(blocker.number) ?? []), Number(blocked)]);
    }
  }
  return { issues, blocks };
};

const blockersOf = (input: PlanInput, issue: number): Issue[] => input.blockedBy[issue] ?? [];

const openBlockersOf = (input: PlanInput, graph: Graph, issue: number): number[] =>
  blockersOf(input, issue)
    .map((blocker) => blocker.number)
    .filter((blocker) => graph.issues.get(blocker)?.state === "open")
    .toSorted((a, b) => a - b);

// Strongly connected components (Tarjan). A component with more than one issue, or an issue
// that blocks itself, is a cycle.
const findCycles = (graph: Graph): number[][] => {
  const index = new Map<number, number>();
  const lowLink = new Map<number, number>();
  const stack: number[] = [];
  const onStack = new Set<number>();
  const cycles: number[][] = [];
  let counter = 0;

  const visit = (node: number): void => {
    index.set(node, counter);
    lowLink.set(node, counter);
    counter += 1;
    stack.push(node);
    onStack.add(node);
    for (const next of graph.blocks.get(node) ?? []) {
      if (!index.has(next)) {
        visit(next);
        lowLink.set(node, Math.min(lowLink.get(node) ?? 0, lowLink.get(next) ?? 0));
      } else if (onStack.has(next)) {
        lowLink.set(node, Math.min(lowLink.get(node) ?? 0, index.get(next) ?? 0));
      }
    }
    if (lowLink.get(node) !== index.get(node)) return;
    const component: number[] = [];
    let member: number | undefined;
    do {
      member = stack.pop();
      if (member === undefined) break;
      onStack.delete(member);
      component.push(member);
    } while (member !== node);
    const blocksItself = (graph.blocks.get(node) ?? []).includes(node);
    if (component.length > 1 || blocksItself) cycles.push(component.toSorted((a, b) => a - b));
  };

  for (const node of [...graph.issues.keys()].toSorted((a, b) => a - b)) {
    if (!index.has(node)) visit(node);
  }
  return cycles.toSorted((a, b) => (a[0] ?? 0) - (b[0] ?? 0));
};

// Kahn's algorithm over the open issues, one layer at a time. An issue lands in layer N+1 when its
// last open blocker is in layer N. Issues in or behind a cycle never land in a layer.
const layerOpenIssues = (input: PlanInput, graph: Graph): Map<number, number> => {
  const open = [...graph.issues.values()].filter((issue) => issue.state === "open");
  const remaining = new Map(
    open.map((issue) => [issue.number, openBlockersOf(input, graph, issue.number).length]),
  );
  const layers = new Map<number, number>();
  let current = open.map((issue) => issue.number).filter((issue) => remaining.get(issue) === 0);
  let layer = 0;
  while (current.length > 0) {
    const next: number[] = [];
    for (const issue of current) {
      layers.set(issue, layer);
      for (const blocked of graph.blocks.get(issue) ?? []) {
        const count = remaining.get(blocked);
        if (count === undefined) continue;
        remaining.set(blocked, count - 1);
        if (count - 1 === 0) next.push(blocked);
      }
    }
    current = next;
    layer += 1;
  }
  return layers;
};

// ---- Report sections ----

const rolesOf = (issue: Issue): string[] =>
  issue.labels.filter((label) => label.startsWith(ROLE_PREFIX));

const bySuggestedOrder =
  (order: number[]) =>
  (a: Issue, b: Issue): number => {
    const position = (issue: Issue): number => {
      const found = order.indexOf(issue.number);
      return found === -1 ? Number.POSITIVE_INFINITY : found;
    };
    return position(a) - position(b) || a.number - b.number;
  };

const groupReady = (ready: Issue[], order: number[]): ReadyGroup[] => {
  const groups = new Map<string, Issue[]>();
  for (const issue of ready) {
    const roles = rolesOf(issue);
    const role = roles.length === 1 && roles[0] ? roles[0] : NO_ROLE;
    groups.set(role, [...(groups.get(role) ?? []), issue]);
  }
  return [...groups.entries()]
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([role, issues]) => ({ role, issues: issues.toSorted(bySuggestedOrder(order)) }));
};

const groupBlocked = (blocked: BlockedIssue[], layers: Map<number, number>): Layer[] => {
  const groups = new Map<number, BlockedIssue[]>();
  for (const entry of blocked) {
    const layer = layers.get(entry.issue.number) ?? 0;
    groups.set(layer, [...(groups.get(layer) ?? []), entry]);
  }
  return [...groups.entries()]
    .toSorted(([a], [b]) => a - b)
    .map(([layer, issues]) => ({
      layer,
      issues: issues.toSorted((a, b) => a.issue.number - b.issue.number),
    }));
};

const diagramMismatches = (input: PlanInput, epic: EpicBody): string[] => {
  const key = ([from, to]: [number, number]): string => `${from}>${to}`;
  const links: Array<[number, number]> = Object.entries(input.blockedBy).flatMap(
    ([blocked, blockers]) =>
      blockers.map((blocker): [number, number] => [blocker.number, Number(blocked)]),
  );
  const linkKeys = new Set(links.map(key));
  const arrowKeys = new Set(epic.diagramBlocks.map(key));
  return [
    ...epic.diagramBlocks
      .filter((arrow) => !linkKeys.has(key(arrow)))
      .map(([from, to]) => `diagram: thick arrow #${from} ==> #${to} has no dependency link`),
    ...links
      .filter((link) => !arrowKeys.has(key(link)))
      .map(([from, to]) => `diagram: #${from} blocks #${to}, but the diagram has no thick arrow`),
  ];
};

const statusMismatches = (input: PlanInput, graph: Graph, epic: EpicBody): string[] =>
  input.subIssues.flatMap((issue) => {
    const status = epic.statuses.get(issue.number);
    if (status === undefined) return [];
    const openBlockers = openBlockersOf(input, graph, issue.number);
    const where = `All issues table: #${issue.number}`;
    if (issue.state === "closed") {
      return status.startsWith(DONE) ? [] : [`${where} is closed, but its status is not ${DONE}`];
    }
    if (status.startsWith(DONE)) return [`${where} is ${DONE}, but the issue is open`];
    if (status.startsWith(READY) && openBlockers.length > 0) {
      const list = openBlockers.map((blocker) => `#${blocker}`).join(", ");
      return [`${where} is ${READY}, but it has open blockers: ${list}`];
    }
    if (status.startsWith(BLOCKED) && openBlockers.length === 0) {
      return [`${where} is ${BLOCKED}, but it has no open blocker`];
    }
    return [];
  });

const labelMismatches = (input: PlanInput): string[] =>
  input.subIssues
    .filter((issue) => issue.state === "open")
    .flatMap((issue) => {
      const roles = rolesOf(issue);
      if (roles.length === 0) return [`labels: #${issue.number} has no ${ROLE_PREFIX}* label`];
      if (roles.length > 1) {
        return [`labels: #${issue.number} has more than one ${ROLE_PREFIX}* label: ${roles.join(", ")}`];
      }
      return [];
    });

const missingMismatches = (input: PlanInput, epic: EpicBody): string[] =>
  input.subIssues.flatMap((issue) => [
    ...(epic.statuses.has(issue.number) ? [] : [`#${issue.number} is missing from the All issues table`]),
    ...(epic.suggestedOrder.includes(issue.number)
      ? []
      : [`#${issue.number} is missing from the last suggested-order table`]),
    ...(epic.diagramIssues.has(issue.number) ? [] : [`#${issue.number} is missing from the diagram`]),
  ]);

export const planOrder = (input: PlanInput): Report => {
  const epic = parseEpicBody(input.body);
  const graph = buildGraph(input);
  const layers = layerOpenIssues(input, graph);
  const open = input.subIssues.filter((issue) => issue.state === "open");
  const blockedEntry = (issue: Issue): BlockedIssue => ({
    issue,
    openBlockers: openBlockersOf(input, graph, issue.number),
  });
  return {
    epic: input.epic,
    cycles: findCycles(graph),
    ready: groupReady(
      open.filter((issue) => layers.get(issue.number) === 0),
      epic.suggestedOrder,
    ),
    blocked: groupBlocked(
      open.filter((issue) => (layers.get(issue.number) ?? 0) > 0).map(blockedEntry),
      layers,
    ),
    blockedByCycle: open.filter((issue) => !layers.has(issue.number)).map(blockedEntry),
    mismatches: [
      ...diagramMismatches(input, epic),
      ...statusMismatches(input, graph, epic),
      ...labelMismatches(input),
      ...missingMismatches(input, epic),
    ],
  };
};

export const hasProblems = (report: Report): boolean =>
  report.cycles.length > 0 || report.mismatches.length > 0;

// ---- Text ----

const NONE = "  none";

const describe = (issue: Issue): string => `#${issue.number} ${issue.title}`;

const describeBlocked = ({ issue, openBlockers }: BlockedIssue): string =>
  `    ${describe(issue)} (blocked by ${openBlockers.map((blocker) => `#${blocker}`).join(", ")})`;

export const formatReport = (report: Report): string => {
  const lines = [`Plan order for epic #${report.epic}`, "", "1. Cycles"];
  if (report.cycles.length === 0) lines.push(NONE);
  for (const cycle of report.cycles) lines.push(`  ${cycle.map((issue) => `#${issue}`).join(" -> ")}`);

  lines.push("", "2. Ready, by role");
  if (report.ready.length === 0) lines.push(NONE);
  for (const group of report.ready) {
    lines.push(`  ${group.role}`);
    group.issues.forEach((issue, position) =>
      lines.push(`    ${position === 0 ? "next: " : ""}${describe(issue)}`),
    );
  }

  lines.push("", "3. Blocked");
  if (report.blocked.length === 0 && report.blockedByCycle.length === 0) lines.push(NONE);
  for (const layer of report.blocked) {
    lines.push(`  layer ${layer.layer}`);
    lines.push(...layer.issues.map(describeBlocked));
  }
  if (report.blockedByCycle.length > 0) {
    lines.push("  in or behind a cycle");
    lines.push(...report.blockedByCycle.map(describeBlocked));
  }

  lines.push("", "4. Mismatches");
  if (report.mismatches.length === 0) lines.push(NONE);
  lines.push(...report.mismatches.map((mismatch) => `  ${mismatch}`));
  return `${lines.join("\n")}\n`;
};
