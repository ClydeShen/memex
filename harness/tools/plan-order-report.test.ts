import { describe, expect, test } from "vitest";
import {
  formatReport,
  hasProblems,
  type Issue,
  type PlanInput,
  planOrder,
  type Report,
} from "./plan-order-report.ts";

// A synthetic epic #10. #900 is a blocker in a different epic.
//
//   #11 (closed) blocks #12
//   #13 blocks #14, #14 blocks #15
//   #900 (open, other epic) blocks #16
//   #17 and #18 have no blockers
const issue = (number: number, state: Issue["state"], role?: string): Issue => ({
  number,
  title: `story ${number}`,
  state,
  labels: role ? [role, "type:story"] : ["type:story"],
});

const LOCAL = "role:local-impl";
const CLOUD = "role:cloud-impl";

const SUB_ISSUES: Issue[] = [
  issue(11, "closed", LOCAL),
  issue(12, "open", LOCAL),
  issue(13, "open", CLOUD),
  issue(14, "open", CLOUD),
  issue(15, "open", LOCAL),
  issue(16, "open", CLOUD),
  issue(17, "open", CLOUD),
  issue(18, "open", LOCAL),
];
const OUTSIDE = issue(900, "open", LOCAL);

const BLOCKED_BY: Record<number, number[]> = { 12: [11], 14: [13], 15: [14], 16: [900] };

const STATUSES: Record<number, string> = {
  11: "\u{1F7E2} closed (2026-10-29)",
  12: "\u{1F535} ready",
  13: "\u{1F535} ready",
  14: "⚫ blocked by #13",
  15: "⚫ blocked by #14",
  16: "⚫ blocked by #900",
  17: "\u{1F535} ready",
  18: "\u{1F535} ready",
};

const FIRST_ORDER = [11, 12, 13, 14, 15, 16, 17, 18];
const LAST_ORDER = [11, 18, 17, 13, 12, 14, 15, 16];
const ARROWS: Array<[number, number]> = [
  [11, 12],
  [13, 14],
  [14, 15],
  [900, 16],
];

type Body = {
  statuses: Record<number, string>;
  firstOrder: number[];
  lastOrder: number[];
  nodes: number[];
  arrows: Array<[number, number]>;
};

const DEFAULT_BODY: Body = {
  statuses: STATUSES,
  firstOrder: FIRST_ORDER,
  lastOrder: LAST_ORDER,
  nodes: [...FIRST_ORDER, 900],
  arrows: ARROWS,
};

const orderTable = (order: number[]): string[] => [
  "| # | Issue | Short name | Reason |",
  "|---|---|---|---|",
  ...order.map((number, index) => `| ${index + 1} | #${number} | story ${number} | reason |`),
];

const node = (number: number): string =>
  number === 900 ? `N${number}["#${number} outside (epic #20)"]` : `N${number}["#${number} story"]`;

// The epic body in the format the planner writes, with CRLF line endings as GitHub returns them.
const epicBody = (overrides: Partial<Body> = {}): string => {
  const body = { ...DEFAULT_BODY, ...overrides };
  return [
    "## Theme",
    "Foundation.",
    "",
    "## All issues",
    "",
    "| Issue | Title | Type | Status |",
    "|---|---|---|---|",
    ...Object.entries(body.statuses).map(
      ([number, status]) => `| #${number} | #${number} story | story | ${status} |`,
    ),
    "",
    "## Suggested order (2026-10-13)",
    "",
    ...orderTable(body.firstOrder),
    "",
    "## Suggested order (2026-10-29)",
    "",
    ...orderTable(body.lastOrder),
    "",
    "## Progress",
    "<!-- progress-diagram:start -->",
    "```mermaid",
    "flowchart TD",
    '    subgraph G1["Foundation"]',
    ...body.nodes.map((number) => `        ${node(number)}`),
    "    end",
    "    N11 -.-> N12",
    ...body.arrows.map(([from, to]) => `    N${from} ==> N${to}`),
    "    classDef done fill:#2f9e44",
    "```",
    "<!-- progress-diagram:end -->",
  ].join("\r\n");
};

const input = (
  changes: { subIssues?: Issue[]; blockedBy?: Record<number, number[]>; body?: Partial<Body> } = {},
): PlanInput => {
  const subIssues = changes.subIssues ?? SUB_ISSUES;
  const known = new Map([...subIssues, OUTSIDE].map((each) => [each.number, each]));
  const blockedBy = Object.fromEntries(
    Object.entries(changes.blockedBy ?? BLOCKED_BY).map(([blocked, blockers]) => [
      blocked,
      blockers.map((blocker) => known.get(blocker) ?? issue(blocker, "closed")),
    ]),
  );
  return { epic: 10, body: epicBody(changes.body), subIssues, blockedBy };
};

const readyOf = (report: Report, role: string): number[] =>
  report.ready.find((group) => group.role === role)?.issues.map((each) => each.number) ?? [];

const withIssue = (number: number, change: Partial<Issue>): Issue[] =>
  SUB_ISSUES.map((each) => (each.number === number ? { ...each, ...change } : each));

describe("a consistent epic", () => {
  const report = planOrder(input());

  test("has no cycle and no mismatch, so the exit code is 0", () => {
    expect(report.cycles).toEqual([]);
    expect(report.mismatches).toEqual([]);
    expect(hasProblems(report)).toBe(false);
  });

  test("lists the ready issues of each role in the sequence of the last suggested-order table", () => {
    expect(readyOf(report, LOCAL)).toEqual([18, 12]);
    expect(readyOf(report, CLOUD)).toEqual([17, 13]);
  });

  test("puts a ready issue that is not in the table after the others, by number", () => {
    const later = planOrder(input({ body: { lastOrder: [11, 13, 14, 15, 16, 17] } }));
    expect(readyOf(later, LOCAL)).toEqual([12, 18]);
  });

  test("layers the blocked issues by their last open blocker", () => {
    expect(
      report.blocked.map((layer) => ({
        layer: layer.layer,
        issues: layer.issues.map((entry) => [entry.issue.number, entry.openBlockers]),
      })),
    ).toEqual([
      {
        layer: 1,
        issues: [
          [14, [13]],
          [16, [900]],
        ],
      },
      { layer: 2, issues: [[15, [14]]] },
    ]);
  });

  test("treats an issue whose blocker outside the epic is closed as ready", () => {
    const closedOutside = input();
    closedOutside.blockedBy[16] = [issue(900, "closed", LOCAL)];
    expect(readyOf(planOrder(closedOutside), CLOUD)).toEqual([17, 13, 16]);
  });

  test("prints the four sections in order and marks the first ready issue as next", () => {
    const text = formatReport(report);
    const positions = ["1. Cycles", "2. Ready, by role", "3. Blocked", "4. Mismatches"].map(
      (heading) => text.indexOf(heading),
    );
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual(positions.toSorted((a, b) => a - b));
    expect(text).toContain("  role:cloud-impl\n    next: #17 story 17\n    #13 story 13\n");
    expect(text).toContain("    #16 story 16 (blocked by #900)\n");
  });
});

describe("a dependency cycle", () => {
  const report = planOrder(
    input({ blockedBy: { ...BLOCKED_BY, 14: [13, 15] }, body: { arrows: [...ARROWS, [15, 14]] } }),
  );

  test("is reported as the list of its issues, and the exit code is 1", () => {
    expect(report.cycles).toEqual([[14, 15]]);
    expect(report.mismatches).toEqual([]);
    expect(hasProblems(report)).toBe(true);
    expect(formatReport(report)).toContain("1. Cycles\n  #14 -> #15\n");
  });

  test("keeps the issues in the cycle out of the layers", () => {
    expect(report.blockedByCycle.map((entry) => entry.issue.number)).toEqual([14, 15]);
    expect(
      report.blocked.flatMap((layer) => layer.issues.map((entry) => entry.issue.number)),
    ).toEqual([16]);
  });

  test("is found when an issue blocks itself", () => {
    const self = planOrder(
      input({ blockedBy: { ...BLOCKED_BY, 17: [17] }, body: { arrows: [...ARROWS, [17, 17]] } }),
    );
    expect(self.cycles).toEqual([[17]]);
  });
});

describe("each kind of mismatch gives exit code 1", () => {
  const cases: Array<{ name: string; data: PlanInput; expected: string }> = [
    {
      name: "a thick arrow with no dependency link",
      data: input({ body: { arrows: [...ARROWS, [12, 17]] } }),
      expected: "diagram: thick arrow #12 ==> #17 has no dependency link",
    },
    {
      name: "a dependency link with no thick arrow",
      data: input({ body: { arrows: ARROWS.filter(([from]) => from !== 14) } }),
      expected: "diagram: #14 blocks #15, but the diagram has no thick arrow",
    },
    {
      name: "a done status on an open issue",
      data: input({ body: { statuses: { ...STATUSES, 17: "\u{1F7E2} closed (2026-10-29)" } } }),
      expected: "All issues table: #17 is \u{1F7E2}, but the issue is open",
    },
    {
      name: "a closed issue without the done status",
      data: input({ subIssues: withIssue(17, { state: "closed" }) }),
      expected: "All issues table: #17 is closed, but its status is not \u{1F7E2}",
    },
    {
      name: "a ready status on an issue with an open blocker",
      data: input({ body: { statuses: { ...STATUSES, 14: "\u{1F535} ready" } } }),
      expected: "All issues table: #14 is \u{1F535}, but it has open blockers: #13",
    },
    {
      name: "a blocked status on an issue without an open blocker",
      data: input({ body: { statuses: { ...STATUSES, 12: "⚫ blocked by #11" } } }),
      expected: "All issues table: #12 is ⚫, but it has no open blocker",
    },
    {
      name: "an open issue without a role label",
      data: input({ subIssues: withIssue(17, { labels: ["type:story"] }) }),
      expected: "labels: #17 has no role:* label",
    },
    {
      name: "an open issue with two role labels",
      data: input({ subIssues: withIssue(17, { labels: [LOCAL, CLOUD] }) }),
      expected: "labels: #17 has more than one role:* label: role:local-impl, role:cloud-impl",
    },
    {
      name: "an issue missing from the All issues table",
      data: input({
        body: {
          statuses: Object.fromEntries(Object.entries(STATUSES).filter(([n]) => n !== "17")),
        },
      }),
      expected: "#17 is missing from the All issues table",
    },
    {
      name: "an issue missing from the last suggested-order table, though it is in an older one",
      data: input({ body: { lastOrder: LAST_ORDER.filter((n) => n !== 17) } }),
      expected: "#17 is missing from the last suggested-order table",
    },
    {
      name: "an issue missing from the diagram",
      data: input({ body: { nodes: DEFAULT_BODY.nodes.filter((n) => n !== 17) } }),
      expected: "#17 is missing from the diagram",
    },
  ];

  test.each(cases)("$name", ({ data, expected }) => {
    const report = planOrder(data);
    expect(report.mismatches).toEqual([expected]);
    expect(report.cycles).toEqual([]);
    expect(hasProblems(report)).toBe(true);
    expect(formatReport(report)).toContain(`4. Mismatches\n  ${expected}\n`);
  });
});
