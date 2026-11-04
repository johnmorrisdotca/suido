import "@johnmorrisdotca/suido/element/define";

const board = document.querySelector("suido-board")!;
board.addEventListener("suido-solve", (event) => console.log((event as CustomEvent).detail.code));
