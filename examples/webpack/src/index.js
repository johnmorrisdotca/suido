import "@johnmorrisdotca/suido/element/define";

const board = document.createElement("suido-board");
board.setAttribute("grid", "7x7");
board.setAttribute("level", "12");
board.setAttribute("hints", "");
document.body.append(board);
