# Release Process

Manual release process for the DrRuby.ai website. No automation tooling
(changesets, commit-and-tag-version, release-please) is used; version bumps
and the changelog are written by hand on every release.

This process does **not** create git tags and does **not** create GitHub
Releases. It only updates `package.json` `version` and `CHANGELOG.md`.

> **Release branch:** `dev`. If releases are cut from another branch, replace
> `dev` below with that branch name.

## Versioning (SemVer 2.0.0)

- Current version: `0.1.0`. While in `0.x`, the API is considered unstable.
- The release owner **manually decides** the bump type. Decision guide:
  - **patch** (`x.y.Z`): bug fixes, copy/style tweaks, non-breaking changes.
  - **minor** (`x.Y.z`): backwards-compatible new features, new pages, new API endpoints.
  - **major** (`X.y.z`): breaking changes (incompatible API / data model).
    In `0.x`, a major milestone (e.g. `0.1.0 → 1.0.0`) may also be used to mark
    the first stable release.

## Steps (run by hand, in order)

1. Make sure the release branch is clean and quality checks pass:
   ```bash
   git checkout dev
   git pull
   pnpm type-check && pnpm lint && pnpm test
   ```
2. Decide the new version (e.g. `0.2.0`) and the release date `YYYY-MM-DD`.
3. Edit `package.json` and set `version` to the new value.
4. Edit `CHANGELOG.md`:
   - Move everything under `## [Unreleased]` into a new section
     `## [x.y.z] - YYYY-MM-DD`.
   - Leave `## [Unreleased]` empty for the next cycle.
   - Use the categories: `Added` / `Changed` / `Fixed` / `Removed` / `Dependencies`.
5. Commit:
   ```bash
   git commit -m "chore(release): vx.y.z"
   ```
6. (Optional) Push the release branch to trigger deployment
   (Railway standalone build). No tag, no GitHub Release.

## Changelog conventions

- Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
- Section heading per release: `## [x.y.z] - YYYY-MM-DD`.
- Group entries under these sub-headings:
  - `### Added` — new features / pages / endpoints.
  - `### Changed` — changes to existing behavior.
  - `### Fixed` — bug fixes.
  - `### Removed` — removed features / pages / endpoints.
  - `### Dependencies` — dependency upgrades.
- Keep entries concise; reference task/PR ids where helpful (e.g. `task-26`).
