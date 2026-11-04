import { checkSuidoAnswer, type SuidoCheck } from "@johnmorrisdotca/suido";
import { levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const row = rows[11]!; // level 12
const check: SuidoCheck = checkSuidoAnswer(row[0], levelAnswer(row)!);
console.log(check.ok, rows.length);

// @ts-expect-error a list of levels is not a board
const wrong: string = rows;
console.log(typeof wrong);
