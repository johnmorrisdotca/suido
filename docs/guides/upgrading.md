---
title: "Upgrading and moving a host"
section: upgrading
order: 10
description: "Preserve fixed board identities and old element size aliases."
---

## Within version 1

Suido's current public major is 1. Follow [the changelog](../../CHANGELOG.md) for each minor and patch; there is no second-major migration to invent.

The native embed standard adds `grid`, display sizes, daily selection, themes, width and a text label. Existing `size="7x7"` still selects grid dimensions. New snippets separate `grid="7x7"` from `size="medium"`. A custom code takes precedence over daily mode; changing callbacks on `options` does not restart the board. Review [the embed contract](../embeds.md) when moving old host markup.

## Preserve a saved board

Keep its original code and native progress together. A current-facing board code alone has no tap count. Classic published rows keep their identities, while the big-piece set is separately selected. A generated puzzle should keep the returned seed, generation options and version when exact reproduction matters.

When coming from another pipe game, map its completion rule explicitly to `network`, `drains` or `inlet-outlet`. Do not translate a foreign tile code by guessing characters; create and validate a native layout, then encode it. Suido allows network loops and has its own spare-pipe and block rules; [the rule explanation](rules.md) is the migration starting point.
