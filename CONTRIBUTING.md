# Contributing

Ideas, bug reports and pull requests are welcome in the
[issues](https://github.com/johnmorrisdotca/suido/issues).

## Working on it

```sh
pnpm install
pnpm check          # lint, types and tests
pnpm test:package   # pack it as npm does, install it in an empty project, import every entry
pnpm test:demo      # build the demo and play it in real browsers (needs `pnpm exec playwright install chromium webkit` once)
```

A change to the generator or the difficulty measure changes the boards a seed
makes. Boards kept by their seed are not a promise of this package, but a
change that alters them should say so in the changelog, and
`scripts/suido-reference.ts` must be run again so that a difficulty still
means a place among the boards the generator makes.

A change to the rules is tested beside it, and must leave the solver agreeing
with trying every way (`src/brute.fixture.ts`) on small boards.

## Releasing

A version tag (`v1.2.3`, the same as `package.json`'s version) runs
`.github/workflows/release.yml`: it checks and builds the package, attaches the
tarball to a GitHub release, and publishes it to npm by trusted publishing,
with no token. Write the release in `CHANGELOG.md` first.
