# ADR 0006: Sets install in one command, and each minor is served frozen

- Status: accepted
- Date: 2026-09-02

## Context

Two gaps showed up once the registry had twenty-six components in it and a real consumer installing from it.

**Starting a product is a dozen commands.** kilna's move onto dowel was thirteen separate `shadcn add` invocations, each of them a small decision about whether this component was needed yet. Nothing about that is hard, and all of it is friction at exactly the moment a product is deciding whether the system is worth adopting.

**An install cannot be repeated.** A registry is not a package. `shadcn add` copies a file in and leaves no record of where it came from: no version in the lockfile, no marker in the file, nothing. "Install what I installed last month" has no answer, and neither does "set this screen up the way the other one is". The URL in someone's notes describes a path, not a version — `/r/dialog.json` means something different every release.

The second gap has a sharper edge than it first appears. A component that reuses a sibling (Textarea shares the Input's field styling) names that sibling by URL. If those URLs move, then even a perfectly pinned Textarea drags in whatever Input is current — the one arrangement pinning was supposed to rule out.

## Decision

**Sets are `registry:style` items carrying only `registryDependencies`.** Three of them: `app` (what kilna installed), `forms`, `feedback`. Each names its components in full, transitive siblings included, and carries no file of its own.

Carrying no file is the substantive part. A set resolves into exactly the per-component installs the reader could have typed; the copied files are identical either way, and nothing of the set survives in the consumer's project. There is no membership to leave — having installed `app`, deleting the Drawer is an ordinary edit, and no upstream disagrees. A set is a starting point, not a subscription.

They are listed in full rather than left to recursive resolution because a set is *read* as well as executed: `shadcn list` prints these names, and a set whose printed contents differ from what lands on disk has to be traced through three files to understand.

`extends: none`, for the reason ADR 0004 gives: a set of dowel components must not restore shadcn's stock palette underneath.

**The registry is served twice.** `/r/<name>.json` is unpinned and always the newest build — what the README and the docs tell people to type, and what someone installing today should get. `/r/v<major>.<minor>/<name>.json` is a snapshot, written once per minor and never rewritten.

Inside a snapshot, every cross-reference points into that same snapshot. This is the property the pinning exists for, and it is enforced by a test rather than by care.

Snapshots are committed, like the rest of the registry: the docs workflow publishes `docs/public` as it stands and never runs the generator.

**The catalogue also ships inside the npm package**, at `dowel-ui/registry.json`. Not to install from — `shadcn add` wants a URL, and the site serves one. It answers "what is in this registry" for a reader with the package and without the network: a namespace registered in `components.json`, a script checking whether a component exists before shelling out, an agent handed the dependency rather than the docs site. Only the catalogue, not the per-item files: those carry every component's full source, and a package is not a mirror of a registry.

## Consequences

The unpinned path keeps working, and every URL published so far still resolves. Nothing about this release breaks an existing install.

Each minor leaves about forty-five files behind in `docs/public`, permanently. At the 1.0 horizon that is roughly a thousand files of registry in the repository. That is the price of the promise, and it is paid in a directory nobody reads by hand.

The snapshot is named from the version in the package manifest, so a release cut without rebuilding the registry produces a snapshot named for the wrong version. A test asserts the directory for the current version exists.

A pinned path is a promise about the registry, not about the consumer's project. Once copied, a component is their file; a later `add` of the same component overwrites it, edits included. That is the trade the distribution model makes in both directions — no upstream reaches in, and no upstream merges for you.

Sets are maintained by hand: a component added to the registry does not join one. That is deliberate. A set is a claim about what a product actually starts from, and it should change when that claim changes, not when the catalogue grows.
