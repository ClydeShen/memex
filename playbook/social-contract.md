# Social Contract

The harness enforces some rules with tools: checks, branch rules, permissions. Other rules cannot be enforced, or are not worth a tool. A team keeps those rules by agreement. This file is a catalog of such agreements for teams of several people, each with their own agents.

An agreement is not a workflow step. The workflow is in [workflow.md](./workflow.md). Nobody tracks the agreements. Each member keeps them in mind and applies them at the moment they act.

## 1. The base principle

> **Leave all your work so that a person who never spoke to you can continue it.**

All agreements apply this principle at a specific moment. Use it to settle a question that no agreement answers.

The principle applies also to a team whose members never meet, or work in different time zones. The work is the only channel: the issues, the documents, and the code.

## 2. How to use this catalog

1. Read the catalog. Select the agreements for your team.
2. Copy them into your team's agreements file (for example, `docs/team-agreements.md`). Keep the IDs, so that people can refer to them. An ID is never used again; a removed agreement leaves a gap.
3. Copy the agreements that apply to agents into your AGENTS.md. An agent knows only what its context tells it.
4. Change the wording if necessary. Keep each agreement to one action.
5. Add your own agreements. Use the same form.

Each agreement has one of two levels:

| Level | Meaning |
|---|---|
| **Recommended** | Most teams get a benefit from it. Use it unless you have a reason not to. |
| **Good to know** | It helps in some teams or situations. Read it and decide. |

## 3. Agreements or settings

- If a tool can enforce a rule at a low cost, use the tool. Do not make it an agreement. Examples: who can merge, which paths need a review (for example, the shared agent context), the format of the code.
- If people often do not follow an agreement and a tool can check it, change it into a check ([feedback.md](./feedback.md), section 4.2).
- If a check is often bypassed or marked "not useful", examine it. It can become an agreement.
- If nobody uses an agreement, remove it.

## 4. The catalog

### A. Start and stop work

| ID | Agreement | Level | Why |
|---|---|---|---|
| A1 | Claim only the work that you do now. | Recommended | A claim on work that nobody does blocks other people. |
| A2 | Before you claim an issue, read all of it, including the decision log. | Good to know | The last decision can change the scope. |
| A3 | When you stop, write in the issue what you did and the next step. | Recommended | The next person can continue without asking you. |
| A4 | If you cannot continue, remove your claim. Write the reason in the issue. | Recommended | Other people can see that the work is free. |
| A5 | If somebody waits for you and you cannot act now, tell them in the issue. | Recommended | Silence looks like progress. |
| A6 | Before you go away for a long time, remove your claims. | Good to know | Work does not stop while you are away. |

### B. Continue the work of others

| ID | Agreement | Level | Why |
|---|---|---|---|
| B1 | Read what is written before you ask a question. | Recommended | The answer is often in the issue or the documents. |
| B2 | If the issue does not tell you enough to start, send it back with a list of what is missing. Do not guess. | Recommended | A guess hides a gap in the issue. |
| B3 | If you cannot continue the work of another person, write in the issue where you stopped and why. | Recommended | The gap shows a problem in the system, not in you. |
| B4 | Before you take an issue that another person claimed, ask in the issue. | Recommended | The claim can still be active. |
| B5 | If nobody answers in the time that your team set, take the issue. Write that you took it. | Good to know | Work does not stop when one person is away. |

### C. Records

| ID | Agreement | Level | Why |
|---|---|---|---|
| C1 | Write each decision where the work is: the issue, the ADR, or the code. | Recommended | Other people and their agents read only these places ([writing-standards.md](./writing-standards.md), section 4). |
| C2 | Write the result of each chat, call, or meeting in the issue. | Recommended | A result that is not written does not exist for the next person. |
| C3 | If you had to ask a question to continue, write the answer in the document. | Recommended | The next person does not have to ask. |
| C4 | Write for a reader who does not know the history. | Recommended | The reader can be a new member or a new agent session. |
| C5 | If you do not follow a default of the team, write the reason. | Recommended | Without the reason, the next person cannot tell a decision from a mistake. |
| C6 | Give the source of each fact that you write. | Good to know | A reader can check the fact. |
| C7 | Use the terms of the glossary. | Good to know | One thing has one name for all people and agents. |

### D. Decisions and disagreement

| ID | Agreement | Level | Why |
|---|---|---|---|
| D1 | If a decision is in your role and you can reverse it, write it and act. Other people can object with a reason. This does not apply to an ADR, a constraint, or the scope of an issue. | Recommended | Work does not wait for a meeting. |
| D2 | If you cannot reverse a decision, get the approval of the owner before you act. | Recommended | Some mistakes cannot be repaired. |
| D3 | When you object, give a reason and an alternative. | Recommended | An objection without an alternative only stops the work. |
| D4 | Settle an objection by its reason, not by the number of people who agree. | Good to know | A majority can be wrong about a technical fact. |
| D5 | To change a decision, write a new decision with the reason. Do not ignore the old decision. | Recommended | Two silent decisions contradict each other. |
| D6 | If two people cannot agree, give the question to the owner, or to the person that the owner named for the area. | Recommended | A disagreement must not stop the work without an end. |
| D7 | When a decision is made, follow it, also if you did not agree. | Good to know | A team that reopens each decision does not move. |

### E. Shared and personal harness

| ID | Agreement | Level | Why |
|---|---|---|---|
| E1 | Keep your personal settings in the local layer of your tool. Do not commit them. | Recommended | Your preferences must not change the agents of other people. |
| E2 | Keep the details of your machine only in the uncommitted `.env`. | Recommended | Paths, hardware, and secrets are different on each machine (phase 3 of [framework.md](./framework.md)). |
| E3 | Do not put your personal tool names, skill names, or paths in shared files. | Recommended | Other people cannot use them. |
| E4 | If a task works only with your personal setup, move the setup to the shared layer or remove the dependency. | Recommended | Otherwise the task works only on your machine. |
| E6 | Write the reason for each change to the shared agent context. | Recommended | Other members can see why their agents behave differently. |
| E7 | Try a new instruction or skill in your local layer before you propose it for the shared layer. | Good to know | You find the problems before they reach other people. |
| E8 | Write a lesson that helps the team in the shared feedback log, not only in your personal memory. | Recommended | The agents of other people cannot read your memory. |
| E9 | Put the files of your editor and operating system in your personal ignore file. | Good to know | The shared ignore file contains only the files of the project. |

### F. Agents

| ID | Agreement | Level | Why |
|---|---|---|---|
| F1 | You are responsible for the output of each agent that you start. | Recommended | An agent cannot be accountable. A person must be. |
| F2 | Read and check the output of your agent before you give it to another person. | Recommended | Other people must not do your checks for you. |
| F3 | Mark the work that an agent wrote. | Recommended | Reviewers know what to examine with more care. |
| F4 | Do not put secrets or private data into a tool that the team did not approve. | Recommended | Data that leaves the team cannot be taken back. |
| F5 | If two agents disagree, give the question to a person. | Good to know | Agents can argue without an end. |
| F6 | Do not send more agent work for review than other people can review. | Good to know | The attention of reviewers is the limit, not the speed of agents. |
| F7 | Give your agent only the access that its task needs. | Good to know | A mistake or an attack does less damage. |
| F8 | Read the changes that your agents make to contracts, core logic, security, and data before you accept them. Read a sample of the other changes. | Recommended | Code that nobody read is comprehension debt: the team owns code that it cannot explain. |
| F9 | Do not accept an agent change that you cannot explain: what changed, why it is safe, and how to undo it. | Good to know | A person is accountable for agent output (F1), and accountability needs understanding. |

### G. Mistakes and incidents

| ID | Agreement | Level | Why |
|---|---|---|---|
| G1 | If you break the main branch, revert your change before other work. Then fix it. | Recommended | A broken main branch stops all members ([workflow.md](./workflow.md), section 4.2). |
| G2 | Report your own mistakes in the issue. | Recommended | A hidden mistake causes more damage later. |
| G3 | Do not blame a person for a reported mistake. | Recommended | People stop reporting if they get blame. |
| G4 | Revert a change that breaks the main branch, also if another person wrote it. Write the reason. | Good to know | A revert repairs the work. It is not an attack. |
| G5 | In a postmortem, write about the system, not about the person. | Recommended | You can fix a system. Blame fixes nothing. |

### H. The agreements themselves

| ID | Agreement | Level | Why |
|---|---|---|---|
| H1 | Any member can propose a change to the agreements. | Recommended | The people who use the agreements know their problems. |
| H2 | Copy the agreements that apply to agents into AGENTS.md. | Recommended | An agent follows only what is in its context. |
| H3 | Review the agreements at the end of each milestone. | Good to know | Agreements that nobody reads become false. |

## Sources

All pages were opened on 2026-10-14.

- Agent tools separate shared and personal settings: [Claude Code settings](https://code.claude.com/docs/en/settings), [Cursor rules](https://cursor.com/docs/context/rules).
- Personal ignore files: [git gitignore](https://git-scm.com/docs/gitignore).
- Configuration apart from code: [The Twelve-Factor App, III. Config](https://12factor.net/config).
- Coordination through the shared work (stigmergy): [Heylighen, Why is Open Access Development so Successful?](https://arxiv.org/abs/cs/0612071).
- Write it first, then announce it: [GitLab, handbook first](https://handbook.gitlab.com/handbook/company/culture/all-remote/handbook-first/), [GitLab, asynchronous communication](https://handbook.gitlab.com/handbook/company/culture/all-remote/asynchronous/).
- Act, and let others object (lazy consensus): [Apache, lazy consensus](https://community.apache.org/committers/lazyConsensus.html).
- Settle objections by their reasons: [RFC 7282, On Consensus and Humming in the IETF](https://www.rfc-editor.org/rfc/rfc7282.html).
- Release a claim that nobody works on: [zulipbot usage](https://zulip.readthedocs.io/en/latest/contributing/zulipbot-usage.html).
- A person is accountable for agent output: [Coder, AI contributing](https://coder.com/docs/v2.37/about/contributing/AI_CONTRIBUTING), [earthaccess, AI policy](https://earthaccess.readthedocs.io/en/latest/contributor/ai-policy/).
