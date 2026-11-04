<script lang="ts">
  import "@johnmorrisdotca/suido/element/define";

  let { grid = "7x7", level = 12 }: { grid?: string; level?: number } = $props();
</script>

<suido-board {grid} {level} hints></suido-board>
