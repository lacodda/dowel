# ADR 0007: The documentation is generated for machines from the same source as for people

- Status: accepted
- Date: 2026-09-02

## Context

The people reading dowel's documentation are increasingly not people. An agent asked to add a screen to a product on dowel needs to know which components exist, what the tokens are called, and that writing a colour down is forbidden — and it will find all of that out by fetching pages, or it will guess.

The market has a settled answer, and a floor: `llms.txt` as an index, `llms-full.txt` as one document, a Markdown twin of every page, and a schema for anything structured. Base UI serves `llms.txt` only; Ark UI and HeroUI add an MCP server; Mantine does all of it. Below that set, "AI-ready" is a claim rather than a feature.

The obvious way to provide it is to write the files. That is also the way it rots: a second copy of the documentation, updated by whoever remembers, describing a version that has moved on. dowel already has one instance of this failure in its history — the front page said **v0.4.0 through eight releases**, naming one primitive when there were twenty-six, because nobody reads their own front page and no check looked at prose.

## Decision

**Everything machine-readable is generated from the MDX the site is built from.** `tools/build-llms.mjs` produces the index, the full text and one Markdown twin per page; it runs in the package build, so the artefacts cannot be older than the sources.

**Astro components are expanded, not stripped.** A page renders `<Stand>`, `<TokenTable>`, `<ScaleTable>` and `<AccentGallery>`. Deleting those tags would be the easy pass and would hand the reader a page with a hole in it — `<TokenTable>` is not decoration on the token reference, it *is* that page, and stripped output would read as prose about a vocabulary it never lists. So a component carrying data becomes that data as a list; one carrying a pointer becomes a sentence saying where it points. A component with no rule is reported by the generator and fails a gate.

**Code fences are held aside for the whole pass**, because every rule rewrites something the examples are made of — tags, and `import` lines. Seven pages have an `import` inside a fence; without the protection they ship snippets that will not compile.

**A page belonging to no section aborts the build.** Sections are how the index and the full text are ordered, and a page outside all of them was silently dropped from both while its Markdown twin still existed — the site would then have a page its machine-readable half denies. This is not hypothetical: it happened the moment `concepts/` was added.

**The registry gets a JSON Schema**, deliberately not a copy of shadcn's. That one describes what the CLI accepts; this one describes what dowel serves, and is narrower in the three places the registry tests already enforce: a file target stays inside the consumer project, a sibling is named by full URL, and a style item extends nothing. It is validated against every item actually served, and asserted to *reject* those three mistakes — a schema that accepts everything is decoration.

**The consumer briefing ships as a registry item**, `agents`, landing at the project root as `AGENTS.md`. A product on dowel has rules invisible from inside it: that its components were copied and re-adding overwrites edits, that no colour is ever written down, that a `dark:` utility means a missing token. None of that is inferable from a file in `components/ui` that looks ordinary. Making it an item rather than a passage in these docs means it installs with one command and is then the consumer's to edit.

**MCP and Agent Skills are deferred** to a version of their own (owner's decision, 2026-09-02). They are running code with their own failure modes and their own maintenance, unlike static artefacts that a build regenerates; and an MCP server written without a consumer asking for one is a guess.

## Consequences

Adding a documentation page now costs nothing extra: its twin, its index entry and its place in the full text are generated. Adding a *directory* of pages costs one line in the section list, and forgetting it fails the build rather than shipping a gap.

Adding a new Astro component to a page costs an expansion rule. The generator reports the unexpanded tag, and a gate asserts none remain, so the cost is visible rather than a silent hole in the Markdown.

`llms-full.txt` is 122 kB today and grows with the docs. That is a single request an agent makes once, and it is far cheaper than the same agent fetching thirty-seven pages — but it is not free, and if it doubles it should become sectioned rather than larger.

The schema pins three constraints in a published artefact. Loosening one later is a change someone else's tooling can notice, which is the point; it also means the schema has to be regenerated with the registry, and it is, in the same build step.

`AGENTS.md` at the project root is a convention, not a standard, and a consumer using a different filename will rename it. The content is what matters; the target is a default.

The front page's version claim is now a gate: any page naming a `vX.Y.Z` must name the current one. A page that names no version stays free to do so — the rule is against a stale claim, not a missing one.
