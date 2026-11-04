// A server checks an answer with the same rules the board plays by: pure functions, no DOM, no browser globals.
import { checkSuidoAnswer } from "@johnmorrisdotca/suido";
import { dailySuidoLevel, levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const today = dailySuidoLevel("7x7", new Date()); // the level of the day at 7×7: 1 to 256
const row = rows[today - 1]; // send row[0], the board, to the browser; keep the answer
console.log(checkSuidoAnswer(row[0], levelAnswer(row)), rows.length); // { ok: true } 256
