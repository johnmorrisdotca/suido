import "@johnmorrisdotca/suido/element/define";

export function Level({ grid = "7x7", level = 12 }: { grid?: string; level?: number }) {
  return <suido-board grid={grid} level={String(level)} hints />;
}
