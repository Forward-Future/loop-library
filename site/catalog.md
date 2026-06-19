# Published Loop Library catalog

Generated from `scripts/loop-data.mjs` (catalog updated 2026-06-18).
Live catalog: https://signals.forwardfuture.ai/loop-library/catalog.md
Machine-readable catalog: https://signals.forwardfuture.ai/loop-library/catalog.json

Search by outcome, trigger, artifact, evidence, category, or keyword. Treat
adaptations and new designs as unpublished unless they appear at the live catalog
URL above.

## 001 — [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/)

- Category: Engineering
- Use when: Use this whenever implementation changes may have left READMEs, setup guides, API references, examples, or runbooks behind.
- Prompt: Whenever a documentation pass is needed, review the codebase in full and make sure all documentation reflects the current implementation. Update stale documentation, verify the changes, then open a pull request.
- Verify: Documentation matches the current implementation. Finish with a reviewable pull request.
- Keywords: AI coding agent, documentation audit, documentation drift, documentation maintenance, pull request workflow
- Related: [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/), [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/)

## 002 — [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/)

- Category: Engineering
- Use when: Use this for a deliberate architectural refactor where the destination can be stated in concrete terms and the current system can be tested after each meaningful change.
- Prompt: Refactor until you are happy with the architecture. After each significant step, live-test the system, run autoreview, and commit. Track progress in /tmp/refactor-{projectname}.md.
- Verify: The architecture is satisfactory and checks pass. Live-test, autoreview, and commit each significant step.
- Keywords: AI coding agent, architecture refactor, autoreview, incremental refactoring, coding agent workflow
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 003 — [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

- Category: Engineering
- Use when: Use this when a product has a defined set of routes, a stable performance harness, and a 50 ms target that maps to a specific metric and environment.
- Prompt: Continue optimizing the code for speed. After each significant change, measure page-load performance across every page under the same repeatable test conditions. Continue until every page loads in under 50 ms.
- Verify: Every page loads in under 50 ms. Use the same benchmark and confirm there are no regressions.
- Keywords: AI coding agent, page load optimization, performance benchmark, web performance workflow, 50 ms page load
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

## 004 — [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

- Category: Engineering
- Use when: Use this as a scheduled reliability pass when an agent can read production telemetry, trace failures into the repository, run the relevant tests, and prepare a reviewable fix.
- Prompt: Review our production logs for errors. If you find an actionable issue, trace it to its root cause, fix it, verify the fix, and open a pull request. If no actionable errors are present, stop without making changes.
- Verify: Actionable production errors are fixed and verified. Finish with a pull request, or stop when no actionable errors are present.
- Keywords: AI coding agent, production log review, error triage, root cause analysis, reliability workflow
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 005 — [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/)

- Category: Engineering
- Use when: Use this when 100% coverage is an explicit project requirement and the repository has a trustworthy coverage command, clear exclusions, and a test suite that can be run repeatedly.
- Prompt: Add tests until we have 100% test coverage.
- Verify: The full test suite passes at 100% coverage. Use the project's coverage report as the source of truth.
- Keywords: AI coding agent, 100 percent test coverage, test coverage workflow, automated testing, coding agent prompt
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

## 006 — [The SEO/GEO visibility loop](https://signals.forwardfuture.ai/loop-library/loops/seo-geo-visibility-loop/)

- Category: Content
- Use when: Use this when a site has a defined set of priority pages and target questions, and you can rerun the same technical crawl and search visibility checks after each change.
- Prompt: Run an SEO/GEO audit across crawlability, indexation, page intent, titles, internal links, structured data, source citations, and answer-first content. Rank the gaps by expected impact, fix the highest-leverage issue, then rerun the same crawl and target-query benchmark across search engines and AI answer engines. Repeat until no critical technical issues remain, every priority query maps to a clear answer-ready page, and the benchmark shows no high-impact gap left to fix.
- Verify: Priority pages are indexable, answer-ready, and technically sound. The repeatable crawl and query benchmark finds no remaining high-impact gaps.
- Keywords: SEO audit, generative engine optimization, GEO workflow, AI search visibility, answer engine optimization
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/)

## 007 — [The logging coverage loop](https://signals.forwardfuture.ai/loop-library/loops/exhaustive-logging-coverage-loop/)

- Category: Engineering
- Use when: Use this when important user flows, service boundaries, background jobs, or failure paths are difficult to trace because the system's logging is incomplete or inconsistent.
- Prompt: Review the system's logging and add missing coverage until every important path produces useful, tested logs.
- Verify: Every important path emits useful, tested logs. Representative success and failure tests prove coverage without exposing sensitive data.
- Keywords: AI coding agent, structured logging, observability coverage, logging tests, production diagnostics
- Related: [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/), [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/)

## 008 — [The nightly changelog loop](https://signals.forwardfuture.ai/loop-library/loops/nightly-changelog-sweep/)

- Category: Engineering
- Use when: Use this when a project changes frequently enough that user-facing release notes can drift from merged pull requests, commits, deployments, and product changes.
- Prompt: Each night, review changes from the previous day and update the changelog with anything users should know.
- Verify: Every user-relevant change from the previous day is accounted for. The changelog is updated and validated, or the no-change result is recorded.
- Keywords: AI coding agent, nightly changelog, release notes workflow, changelog automation, daily repository review
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/)

## 009 — [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

- Category: Evaluation
- Use when: Use this when product quality needs a strict consecutive-success bar and failures should permanently improve the test and benchmark suite.
- Prompt: Test realistic scenarios. When one fails, document it, add regression and benchmark coverage, fix it, and restart the streak. Stop after [N] successful cases in a row.
- Verify: The latest [N] realistic cases pass in a row. Every earlier failure is documented, fixed, and protected by regression and benchmark coverage.
- Keywords: AI product evaluation, quality streak, regression testing, benchmark coverage, realistic scenarios
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/)

## 010 — [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/)

- Category: Evaluation
- Use when: Use this for an end-to-end product evaluation when quality must be measured across the full feature set rather than a narrow regression or a few hand-picked examples.
- Prompt: Create [N] realistic scenarios covering every major capability. Before testing, define clear success criteria and choose a consistent evaluation method, such as pass/fail checks or a scoring rubric. Run every scenario under the same conditions and record evidence for each outcome. Fix the underlying cause of anything that does not meet the criteria, rerun the affected scenarios, and then rerun the complete set. Continue until every scenario meets the original quality bar.
- Verify: Every one of the [N] scenarios meets the defined quality bar. The final evaluated run covers every major capability under the original conditions.
- Keywords: AI product evaluation, full product testing, response scoring, quality benchmark, feature coverage
- Related: [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/), [The production data cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/production-data-cleanup-loop/)

## 011 — [The test-suite speed loop](https://signals.forwardfuture.ai/loop-library/loops/test-suite-speed-loop/)

- Category: Engineering
- Use when: Use this when slow tests are delaying local feedback or continuous integration and the project has stable commands for measuring runtime and coverage.
- Prompt: Optimize the test suite to run as quickly as possible without reducing coverage or changing behavior.
- Verify: The suite is faster with no coverage or behavior regression. Repeatable timing, the full passing suite, and the original coverage report prove the result.
- Keywords: AI coding agent, test suite performance, faster CI, test optimization, coverage preservation
- Related: [The 100% test coverage loop](https://signals.forwardfuture.ai/loop-library/loops/100-percent-test-coverage-loop/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 012 — [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/)

- Category: Engineering
- Use when: Use this when abandoned branches, old worktrees, unclear pull requests, or unmerged commits make it difficult to know which repository state still matters.
- Prompt: Inspect local and remote branches, pull requests, commits, and worktrees. Recover valuable work and clean everything stale until the repository is current and organized.
- Verify: Valuable work is recovered and remaining repository state is intentional. Branches, pull requests, commits, and worktrees are current, owned, or safely removed with evidence.
- Keywords: AI coding agent, repository cleanup, git worktree audit, branch hygiene, pull request triage
- Related: [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/), [The nightly changelog loop](https://signals.forwardfuture.ai/loop-library/loops/nightly-changelog-sweep/)

## 013 — [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/)

- Category: Operations
- Use when: Use this when several branches or pull requests may be ready at once and the release must avoid stale worktrees, partial overlays, and incomplete changes.
- Prompt: Review pending changes and pull requests, exclude stale or unfinished work, combine the valid changes, and release them together.
- Verify: Only current, complete changes ship in the combined release. The released revision is the latest integrated main that contains every selected change.
- Keywords: AI release operations, batch release, stale code prevention, pull request coordination, deployment safety
- Related: [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/), [The post-release baseline loop](https://signals.forwardfuture.ai/loop-library/loops/post-release-baseline-loop/)

## 014 — [The production data cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/production-data-cleanup-loop/)

- Category: Operations
- Use when: Use this when a production dataset contains records that no longer match a product, policy, taxonomy, or quality definition and the classifier allowed them through.
- Prompt: Review production records, remove anything that does not meet the allowed definition, improve the classification logic, and verify the remaining data.
- Verify: Every remaining record meets the allowed definition. Representative classification tests and a post-cleanup audit prove the retained data is valid.
- Keywords: AI data operations, production data cleanup, classification logic, data quality audit, regression examples
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The logging coverage loop](https://signals.forwardfuture.ai/loop-library/loops/exhaustive-logging-coverage-loop/)

## 015 — [The post-release baseline loop](https://signals.forwardfuture.ai/loop-library/loops/post-release-baseline-loop/)

- Category: Operations
- Use when: Use this immediately after a release when future regressions or improvements need to be measured against the exact version now in production.
- Prompt: After current releases finish, run the standard benchmarks and record the results as the new baseline.
- Verify: The new baseline belongs to the completed release. Revision, environment, benchmark version, conditions, and results are recorded together.
- Keywords: AI release operations, post-release benchmark, performance baseline, release verification, benchmark history
- Related: [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/), [The test-suite speed loop](https://signals.forwardfuture.ai/loop-library/loops/test-suite-speed-loop/)

## 016 — [The ticket-to-PR-ready loop](https://signals.forwardfuture.ai/loop-library/loops/ticket-to-pr-ready-loop/)

- Category: Engineering
- Use when: Use this when a real but loosely written ticket, bug report, or customer complaint needs to become a bounded engineering change with enough proof for a fast review.
- Prompt: Take this ticket, bug report, failing behavior, or customer complaint and turn it into a review-ready patch. Define the failure clearly and reproduce it in the smallest possible environment. Isolate the root cause and confirm it with evidence, not inference. Implement the smallest credible fix, then verify the before-and-after behavior. If verification fails, return to the root cause and iterate. If the issue cannot be reproduced after two serious attempts, say so clearly. Do not silently expand scope; split broader refactors or separate problems into named follow-ups. Finish with the failure summary, reproduction steps, root cause, fix summary, files changed, verification proof, risks, follow-ups, suggested PR title, and PR description draft.
- Verify: The failure is fixed, verified, and ready for review. The same behavior reproduces before the fix, no longer reproduces afterward, and the handoff explains the evidence in under two minutes.
- Keywords: AI coding agent, ticket to pull request, bug reproduction, root cause analysis, review-ready patch
- Related: [The production error sweep](https://signals.forwardfuture.ai/loop-library/loops/production-error-sweep/), [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

## 017 — [The customer AI deployment loop](https://signals.forwardfuture.ai/loop-library/loops/customer-ai-deployment-loop/)

- Category: Operations
- Use when: Use this when an AI workflow must live inside a real customer process and needs validation, approval, gradual rollout, monitoring, and a clear business outcome.
- Prompt: Manage one customer AI deployment from priority to production outcome. Run this loop when a customer shares a new priority, requests an AI workflow, gives feedback, reports a failure, or reaches a scheduled AI operations review. Start from the customer's current business priority and choose one concrete workflow or improvement to advance. Define the business goal, owner, affected users, systems and APIs, input data, expected output, approval gates, risk level, success criteria, and ROI hypothesis. Build or update the deployment, run a dry run on realistic customer data, record failures and edge cases, fix the smallest underlying issue, and rerun until the dry run passes or a blocker is clear. Release gradually and monitor production. Before stopping, produce a customer-facing update and store the reusable lessons for the next run.
- Verify: One customer priority reaches a proven terminal state. The workflow reaches its agreed rollout stage, a production issue is fixed, a blocker is escalated with an owner, or a healthy review records the next check.
- Keywords: customer AI deployment, AI workflow rollout, approval gates, production monitoring, AI ROI
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

## 018 — [The product update podcast loop](https://signals.forwardfuture.ai/loop-library/loops/product-update-podcast-loop/)

- Category: Content
- Use when: Use this when a product ships frequently enough that users would benefit from a short recurring audio explanation of what changed and how to use it.
- Prompt: Each night, review any new publicly released features or changes from the repository and identify the ones most meaningful to users. Verify each selected change against the released product, documentation, or release notes. Use the Jellypod MCP to generate a short three-to-five-minute podcast episode explaining how users can take advantage of the new features, why they are important, and how to try them. Review the script and audio for accuracy, clarity, and pronunciation; fix or regenerate anything that does not match the source material. If there were no meaningful public changes, record that result instead of manufacturing an episode.
- Verify: The episode accurately covers every meaningful public update. Finish with a review-ready three-to-five-minute episode, or a confirmed no-episode result when nothing meaningful shipped.
- Keywords: AI podcast workflow, product update podcast, Jellypod MCP, release communication, editorial automation
- Related: [The nightly changelog loop](https://signals.forwardfuture.ai/loop-library/loops/nightly-changelog-sweep/), [The post-release baseline loop](https://signals.forwardfuture.ai/loop-library/loops/post-release-baseline-loop/)

## 019 — [The Clodex adversarial-review loop](https://signals.forwardfuture.ai/loop-library/loops/clodex-adversarial-review-loop/)

- Category: Engineering
- Use when: Use this for a meaningful code change that benefits from an independent reviewer and may need several structured review-and-fix rounds.
- Prompt: Run /clodex [task] think hard --max-iter 5 --threshold medium. Plan the task, implement it, ship a pull request, run the Codex adversarial-review code path, fix every finding above the configured threshold, and repeat. Persist the plan, branch, pull request, findings, verdict, and iteration state so the run can resume safely. Remember that threshold names the highest acceptable severity. Stop when Codex approves, only sub-threshold findings remain, or max-iter is reached. Never report a stalled, errored, or exhausted run as approved.
- Verify: The pull request reaches the configured review bar. Codex approves, only explicitly acceptable findings remain, or the final report truthfully discloses that the iteration cap or an error stopped the loop.
- Keywords: Clodex, Codex adversarial review, Claude Code plugin, review fix loop, pull request automation
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The stale-safe batch release loop](https://signals.forwardfuture.ai/loop-library/loops/stale-safe-batch-release-loop/)

## 020 — [The Loop Harness verification loop](https://signals.forwardfuture.ai/loop-library/loops/loop-harness-verification-loop/)

- Category: Engineering
- Use when: Use this when a recurring repository task should run unattended but one agent must not be allowed to generate and approve the same output.
- Prompt: On the configured cadence, wake the due loop. Give a Claude session the task-specific skill and let it work in an isolated git worktree. Stage the resulting commits or output files without shipping them. Have a second Claude session verify the staged work against explicit acceptance criteria. If verification fails, ship nothing; preserve the findings and retry on the next cycle. If verification passes, ship the configured output—a pull request, review comments, or Slack message—and update the loop state. Finish with the source revision, staged artifacts, verifier result, delivery status, and next scheduled run.
- Verify: Only independently verified output ships. A second-agent pass releases the configured output; a failed verification preserves evidence and produces no external change.
- Keywords: Loop Harness, scheduled coding agent, git worktree isolation, second-agent verification, autonomous agent workflow
- Related: [The Clodex adversarial-review loop](https://signals.forwardfuture.ai/loop-library/loops/clodex-adversarial-review-loop/), [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/)

## 021 — [The Boeing 747 benchmark](https://signals.forwardfuture.ai/loop-library/loops/boeing-747-benchmark/)

- Category: Design
- Use when: Use this as a visual benchmark for an agent that can build a complex Three.js scene, inspect its own renders, and improve the result through repeated vision feedback.
- Prompt: /goal Create the most realistic Boeing 747 you can using Three.js. Use your vision capabilities to create a self-verifiable system, then enter a loop until you are 100% satisfied with the result. Build a repeatable camera system to inspect the aircraft from every required angle. After each significant change, render those same views, identify what looks least realistic, improve it, and inspect again. Preserve the best version as you iterate, and stop only when you are 100% satisfied that no visible issue remains worth fixing.
- Verify: You are 100% satisfied with the Boeing 747. The camera system shows every required angle, and you cannot identify another visible issue worth improving.
- Keywords: Boeing 747 benchmark, Three.js agent workflow, vision self-verification, 3D reconstruction loop, camera inspection system
- Related: [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/), [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/)

## 022 — [War Loops: Autonomous Frontend Designer](https://signals.forwardfuture.ai/loop-library/loops/war-loops-frontend-designer/)

- Category: Design
- Use when: Use this when a frontend must be reconstructed from a URL or image and fidelity needs to be measured across appearance, motion, and responsive behavior instead of judged from one screenshot.
- Prompt: Point War Loops at a URL or image. Capture the page with a genuine browser, extract a ground-truth design spec, and produce two self-correcting builds: a polished static mirror in Pencil and a moving code build in Forge. Judge each build against the original across static design, experiential motion, and responsive reflow. After each evaluation, use the surgical critic to target the weakest signals. Repair, do not rebuild: keep what already matches and change only the highest-impact gaps. Repeat until the measures say it matches, fidelity passes, progress stagnates, or the source capture is blocked. Return the best build with its spec, renders, scores, findings, and run metrics.
- Verify: The build matches the reference across every measured fidelity axis. Static design, experiential motion, and responsive reflow pass their gates, or the best result stops honestly on stagnation or a blocked capture.
- Keywords: War Loops, autonomous frontend designer, frontend fidelity, visual evaluation loop, responsive motion matching
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The sub-50 ms page-load loop](https://signals.forwardfuture.ai/loop-library/loops/sub-50ms-page-load-loop/)

## 023 — [The self-improving champion loop](https://signals.forwardfuture.ai/loop-library/loops/self-improving-champion-loop/)

- Category: Evaluation
- Use when: Use this to improve a prompt, policy, configuration, or other testable artifact when cheap iteration is useful but final acceptance must use fresh evidence.
- Prompt: Keep three pieces of state in memory: the champion (the best current genome plus its gate score), a budget starting at [N], and a log of every tried genome and score. Each cycle, if the budget is zero, stop and return the champion. Otherwise, reduce the budget by one, read the latest failure in the log, and propose one targeted change to the champion that addresses it. Skip any change already tried. Score the challenger on a working signal: a cheap measure you may tune against. If it is not better than the champion, log it and continue. If it is better, freeze the challenger and run the gate on fresh examples you did not inspect while editing, plus the guard checks in [safety]. Accept the challenger only if its gate score beats the champion by [minimum margin] and no guard regresses; otherwise keep the champion. Log the attempt and repeat. Keep the working signal and gate separate. Treat a suspiciously easy win as Goodhart's law in action and reject it. If you are uncertain, keep the champion.
- Verify: The budget is exhausted and the best verified champion is returned. Every challenger is logged, the final champion has the strongest accepted gate score, and no accepted change regresses a guard check.
- Keywords: self-improving loop, champion challenger evaluation, Goodhart prevention, independent evaluation gate, bounded optimization workflow
- Related: [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/), [The quality streak loop](https://signals.forwardfuture.ai/loop-library/loops/quality-streak-loop/)

## 024 — [The devil's-advocate loop](https://signals.forwardfuture.ai/loop-library/loops/devils-advocate-design-loop/)

- Category: Evaluation
- Use when: Use this before committing to an architecture, interface, rollout plan, or other consequential design that benefits from structured adversarial review.
- Prompt: Argue against your own design until it survives. In each round, a critic sub-agent writes the strongest case that the current approach is wrong and records every objection in /tmp/redteam-{projectname}.md with its evidence, impact, and status. The builder must either fix the weakness and verify the result or record why accepting it is reasonable under the project's stated criteria. The critic then reviews the change or acceptance rationale and may reopen anything that is not supported. Repeat until no new high-impact objection appears and every logged objection is either verified as resolved or explicitly accepted with evidence. Merely answering an objection in the log does not resolve it. If the same unresolved objections repeat for two rounds without new evidence or progress, stop and report the stalemate instead of claiming the design survived.
- Verify: No high-impact objection remains open. Every logged objection is verified as resolved or explicitly accepted with evidence, or the final report truthfully records a two-round stalemate.
- Keywords: devil's advocate loop, adversarial design review, critic builder workflow, architecture objection log, red team design process
- Related: [The architecture satisfaction loop](https://signals.forwardfuture.ai/loop-library/loops/architecture-satisfaction-loop/), [The Clodex adversarial-review loop](https://signals.forwardfuture.ai/loop-library/loops/clodex-adversarial-review-loop/)

## 025 — [The fresh-clone loop](https://signals.forwardfuture.ai/loop-library/loops/fresh-clone-loop/)

- Category: Engineering
- Use when: Use this to test whether a repository's onboarding instructions really work for a new contributor or a clean CI-style environment.
- Prompt: Clone the repository into a clean, empty environment with nothing preinstalled, then follow the README exactly as written to get the project running. Every time a step fails, is missing, or quietly assumes something the README never states, record the gap, fix the setup or documentation to remove that assumption, discard the environment, and start again from a fresh clone. Do not carry dependencies, configuration, credentials, or manual fixes from one attempt into the next. Keep a short log of each gap and how you closed it so it does not return. Stop when a brand-new environment goes from clone to running app in one uninterrupted pass using only the documented steps and no outside fix. Finish with the gaps closed and the exact commands a new contributor now runs from scratch.
- Verify: A clean environment reaches a running app using only the README. The final from-scratch run is uninterrupted and needs no unstated step, preinstalled tool, configuration, or manual repair.
- Keywords: fresh clone loop, README verification, developer onboarding test, clean environment setup, repository documentation workflow
- Related: [The docs sweep](https://signals.forwardfuture.ai/loop-library/loops/overnight-docs-sweep/), [The repository cleanup loop](https://signals.forwardfuture.ai/loop-library/loops/repository-cleanup-loop/)

## 026 — [The Infinite Clickbait loop](https://signals.forwardfuture.ai/loop-library/loops/infinite-clickbait-loop/)

- Category: Design
- Use when: Use this when a video topic and asset set are ready but the thumbnail needs several structured ideation and critique rounds before production.
- Prompt: The video is about [video subject]. Using [assets], make ten thumbnail concepts and score each one against [inspiration channel]'s YouTube thumbnails using a consistent rubric: clarity at small size, curiosity, emotional pull, visual contrast, and accuracy to the video. Select the top three, identify the weakest part of each concept, improve them, and rescore them with the same rubric. Continue iterating the strongest concept until you're satisfied it's click-baity enough without promising something the video does not deliver. Return the winning concept, two runners-up, their final scores, and the reasoning behind the choice.
- Verify: You are satisfied the winning thumbnail is click-baity enough. The winner outperforms the alternatives on the fixed rubric, remains legible at thumbnail size, and accurately represents the video.
- Keywords: Infinite Clickbait, YouTube thumbnail loop, thumbnail iteration workflow, clickbait scoring rubric, AI visual design
- Related: [The Boeing 747 benchmark](https://signals.forwardfuture.ai/loop-library/loops/boeing-747-benchmark/), [The full product evaluation loop](https://signals.forwardfuture.ai/loop-library/loops/full-product-evaluation-loop/)
