# AGENTS

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>api-patterns</name>
<description>API design principles and decision-making. REST vs GraphQL vs tRPC selection, response formats, versioning, pagination.</description>
<location>project</location>
</skill>

<skill>
<name>app-builder</name>
<description>Main application building orchestrator. Creates full-stack applications from natural language requests. Determines project type, selects tech stack, coordinates agents.</description>
<location>project</location>
</skill>

<skill>
<name>architecture</name>
<description>Architectural decision-making framework. Requirements analysis, trade-off evaluation, ADR documentation. Use when making architecture decisions or analyzing system design.</description>
<location>project</location>
</skill>

<skill>
<name>bash-linux</name>
<description>Bash/Linux terminal patterns. Critical commands, piping, error handling, scripting. Use when working on macOS or Linux systems.</description>
<location>project</location>
</skill>

<skill>
<name>batch-operations</name>
<description>Apply operations across multiple files simultaneously. Pattern-based bulk modifications, search-and-replace across codebases, consistent changes to many files at once.</description>
<location>project</location>
</skill>

<skill>
<name>behavioral-modes</name>
<description>AI operational modes (brainstorm, implement, debug, review, teach, ship, orchestrate). Use to adapt behavior based on task type.</description>
<location>project</location>
</skill>

<skill>
<name>brainstorming</name>
<description>Socratic questioning protocol + user communication. MANDATORY for complex requests, new features, or unclear requirements. Includes progress reporting and error handling.</description>
<location>project</location>
</skill>

<skill>
<name>clean-code</name>
<description>Pragmatic coding standards - concise, direct, no over-engineering, no unnecessary comments</description>
<location>project</location>
</skill>

<skill>
<name>code-review-checklist</name>
<description>Code review guidelines covering code quality, security, and best practices.</description>
<location>project</location>
</skill>

<skill>
<name>code-review-graph</name>
<description>Token-efficient code review using Tree-sitter AST graphs and MCP. Reduces AI assistant token usage by 6.8–49x by computing blast radius of changes instead of reading entire codebases. Uses SQLite graph database for structural analysis.</description>
<location>project</location>
</skill>

<skill>
<name>context-compression</name>
<description>Manage and compress conversation context in long sessions. Detect when context is growing large, summarize completed work phases, archive old findings while preserving key decisions. Prevents context degradation.</description>
<location>project</location>
</skill>

<skill>
<name>coordinator-mode</name>
<description>Advanced multi-agent orchestration with parallel workers, synthesis protocols, and coordinator lifecycle. Use when complex tasks require multiple agents working in parallel with intelligent result synthesis.</description>
<location>project</location>
</skill>

<skill>
<name>database-design</name>
<description>Database design principles and decision-making. Schema design, indexing strategy, ORM selection, serverless databases.</description>
<location>project</location>
</skill>

<skill>
<name>deployment-procedures</name>
<description>Production deployment principles and decision-making. Safe deployment workflows, rollback strategies, and verification. Teaches thinking, not scripts.</description>
<location>project</location>
</skill>

<skill>
<name>documentation-templates</name>
<description>Documentation templates and structure guidelines. README, API docs, code comments, and AI-friendly documentation.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Design thinking and decision-making for web UI. Use when designing components, layouts, color schemes, typography, or creating aesthetic interfaces. Teaches principles, not fixed values.</description>
<location>project</location>
</skill>

<skill>
<name>game-development</name>
<description>Game development orchestrator. Routes to platform-specific skills based on project needs.</description>
<location>project</location>
</skill>

<skill>
<name>geo-fundamentals</name>
<description>Generative Engine Optimization for AI search engines (ChatGPT, Claude, Perplexity).</description>
<location>project</location>
</skill>

<skill>
<name>i18n-localization</name>
<description>Internationalization and localization patterns. Detecting hardcoded strings, managing translations, locale files, RTL support.</description>
<location>project</location>
</skill>

<skill>
<name>intelligent-routing</name>
<description>Automatic agent selection and intelligent task routing. Analyzes user requests and automatically selects the best specialist agent(s) without requiring explicit user mentions.</description>
<location>project</location>
</skill>

<skill>
<name>lint-and-validate</name>
<description>Automatic quality control, linting, and static analysis procedures. Use after every code modification to ensure syntax correctness and project standards. Triggers onKeywords: lint, format, check, validate, types, static analysis.</description>
<location>project</location>
</skill>

<skill>
<name>mcp-builder</name>
<description>MCP (Model Context Protocol) server building principles. Tool design, resource patterns, best practices.</description>
<location>project</location>
</skill>

<skill>
<name>memory-system</name>
<description>Persistent cross-session memory management. Enables agents to remember user preferences, project conventions, and past decisions across different sessions using a structured MEMORY.md index and topic files.</description>
<location>project</location>
</skill>

<skill>
<name>mobile-design</name>
<description>Mobile-first design thinking and decision-making for iOS and Android apps. Touch interaction, performance patterns, platform conventions. Teaches principles, not fixed values. Use when building React Native, Flutter, or native mobile apps.</description>
<location>project</location>
</skill>

<skill>
<name>nextjs-react-expert</name>
<description>React and Next.js performance optimization from Vercel Engineering. Use when building React components, optimizing performance, eliminating waterfalls, reducing bundle size, reviewing code for performance issues, or implementing server/client-side optimizations.</description>
<location>project</location>
</skill>

<skill>
<name>nodejs-best-practices</name>
<description>Node.js development principles and decision-making. Framework selection, async patterns, security, and architecture. Teaches thinking, not copying.</description>
<location>project</location>
</skill>

<skill>
<name>parallel-agents</name>
<description>Multi-agent orchestration patterns. Use when multiple independent tasks can run with different domain expertise or when comprehensive analysis requires multiple perspectives.</description>
<location>project</location>
</skill>

<skill>
<name>performance-profiling</name>
<description>Performance profiling principles. Measurement, analysis, and optimization techniques.</description>
<location>project</location>
</skill>

<skill>
<name>plan-writing</name>
<description>Structured task planning with clear breakdowns, dependencies, and verification criteria. Use when implementing features, refactoring, or any multi-step work.</description>
<location>project</location>
</skill>

<skill>
<name>powershell-windows</name>
<description>PowerShell Windows patterns. Critical pitfalls, operator syntax, error handling.</description>
<location>project</location>
</skill>

<skill>
<name>python-patterns</name>
<description>Python development principles and decision-making. Framework selection, async patterns, type hints, project structure. Teaches thinking, not copying.</description>
<location>project</location>
</skill>

<skill>
<name>red-team-tactics</name>
<description>Red team tactics principles based on MITRE ATT&CK. Attack phases, detection evasion, reporting.</description>
<location>project</location>
</skill>

<skill>
<name>rust-pro</name>
<description>Master Rust 1.75+ with modern async patterns, advanced type system</description>
<location>project</location>
</skill>

<skill>
<name>seo-fundamentals</name>
<description>SEO fundamentals, E-E-A-T, Core Web Vitals, and Google algorithm principles.</description>
<location>project</location>
</skill>

<skill>
<name>server-management</name>
<description>Server management principles and decision-making. Process management, monitoring strategy, and scaling decisions. Teaches thinking, not commands.</description>
<location>project</location>
</skill>

<skill>
<name>simplify-code</name>
<description>Reduce complexity of over-engineered code. Identify unnecessary abstractions, remove dead code, flatten deep nesting, and simplify logic while preserving behavior.</description>
<location>project</location>
</skill>

<skill>
<name>skillify</name>
<description>Auto-create new skills from repetitive workflows. When you notice yourself doing the same multi-step process repeatedly, extract it into a reusable SKILL.md that any agent can use.</description>
<location>project</location>
</skill>

<skill>
<name>systematic-debugging</name>
<description>4-phase systematic debugging methodology with root cause analysis and evidence-based verification. Use when debugging complex issues.</description>
<location>project</location>
</skill>

<skill>
<name>tailwind-patterns</name>
<description>Tailwind CSS v4 principles. CSS-first configuration, container queries, modern patterns, design token architecture.</description>
<location>project</location>
</skill>

<skill>
<name>tdd-workflow</name>
<description>Test-Driven Development workflow principles. RED-GREEN-REFACTOR cycle.</description>
<location>project</location>
</skill>

<skill>
<name>testing-patterns</name>
<description>Testing patterns and principles. Unit, integration, mocking strategies.</description>
<location>project</location>
</skill>

<skill>
<name>verify-changes</name>
<description>Prove code works by running it, not just checking it exists. Verification through execution rather than inspection. Use after writing or modifying code to ensure it actually functions correctly.</description>
<location>project</location>
</skill>

<skill>
<name>vulnerability-scanner</name>
<description>Advanced vulnerability analysis principles. OWASP 2025, Supply Chain Security, attack surface mapping, risk prioritization.</description>
<location>project</location>
</skill>

<skill>
<name>web-design-guidelines</name>
<description>Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".</description>
<location>project</location>
</skill>

<skill>
<name>webapp-testing</name>
<description>Web application testing principles. E2E, Playwright, deep audit strategies.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
