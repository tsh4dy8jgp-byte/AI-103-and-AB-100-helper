"use client";

import { useState, type DragEvent } from "react";
import { EMPTY_SLOT, emptyAnswer, isChoice, optionLetter, slotCount, templateSegments } from "@/lib/grading";
import type { ChoiceQuestion, DragDropQuestion, DropdownQuestion, Question } from "@/lib/questions";

interface InputProps<Q extends Question> {
  question: Q;
  answer: number[];
  /** Once checked, the input is read-only and shows which parts were right. */
  checked: boolean;
  onChange: (next: number[]) => void;
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five"];

/** Microsoft's standard item instructions, so the wording itself is exam practice. */
export function instructionFor(question: Question): string {
  if (question.type === "dragdrop") {
    if (question.ordered) return "Move the appropriate actions to the answer area and arrange them in the correct order. Each correct position is worth one point.";
    return `Drag the appropriate values to the correct targets. Each value may be used once${question.reuse ? ", more than once," : ""} or not at all. Each correct match is worth one point.`;
  }
  if (question.type === "dropdown") {
    return `Select the appropriate option in each list to complete the ${question.language ? "code" : "statement"}. Each correct selection is worth one point.`;
  }
  const count = question.correct.length;
  return count > 1 ? `Select ${NUMBER_WORDS[count] ?? count} answers. Each correct selection is worth one point.` : "Select one answer.";
}

/** Positional formats keep one entry per slot; tolerate a missing or short answer. */
function slots(question: Question, answer: number[]): number[] {
  return answer.length === slotCount(question) ? answer : emptyAnswer(question);
}

export function QuestionInput({ question, answer, checked, onChange }: InputProps<Question>) {
  return (
    <>
      <p className="select-instruction">{instructionFor(question)}</p>
      {question.type === "dragdrop" ? <DragDropInput question={question} answer={answer} checked={checked} onChange={onChange} />
        : question.type === "dropdown" ? <DropdownInput question={question} answer={answer} checked={checked} onChange={onChange} />
        : isChoice(question) ? <ChoiceInput question={question} answer={answer} checked={checked} onChange={onChange} />
        : null}
    </>
  );
}

function ChoiceInput({ question, answer, checked, onChange }: InputProps<ChoiceQuestion>) {
  const multi = question.correct.length > 1;
  const toggle = (index: number) => {
    if (checked) return;
    if (!multi) return onChange([index]);
    if (answer.includes(index)) return onChange(answer.filter((item) => item !== index));
    if (answer.length < question.correct.length) onChange([...answer, index]);
  };
  return (
    <div className="exam-options">
      {question.options.map((option, index) => {
        const selected = answer.includes(index);
        const correctOption = checked && question.correct.includes(index);
        const wrongSelected = checked && selected && !question.correct.includes(index);
        return (
          <button key={index} disabled={checked} aria-pressed={selected} className={`${selected ? "selected" : ""} ${correctOption ? "correct" : ""} ${wrongSelected ? "wrong" : ""}`} onClick={() => toggle(index)}>
            <span>{optionLetter(index)}</span><p>{option}</p>{selected && <i>{multi ? "✓" : "●"}</i>}
          </button>
        );
      })}
    </div>
  );
}

const TILE = "application/x-northstar-tile";
const FROM_TARGET = "application/x-northstar-from";

function DragDropInput({ question, answer, checked, onChange }: InputProps<DragDropQuestion>) {
  const placed = slots(question, answer);
  // Click-to-pick then click-to-place works with a keyboard and on touch screens,
  // where native drag and drop is unreliable.
  const [picked, setPicked] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const inUse = new Set(placed.filter((tile) => tile >= 0));
  const pool = question.tiles.map((tile, index) => ({ tile, index })).filter(({ index }) => question.reuse || !inUse.has(index));

  const place = (target: number, tile: number, from: number | null = null) => {
    if (checked || tile < 0 || tile >= question.tiles.length) return;
    const next = [...placed];
    if (from !== null && from !== target) next[from] = EMPTY_SLOT;
    else if (!question.reuse) next.forEach((value, index) => { if (value === tile) next[index] = EMPTY_SLOT; });
    next[target] = tile;
    onChange(next);
    setPicked(null);
  };
  const clear = (target: number) => {
    if (checked) return;
    const next = [...placed];
    next[target] = EMPTY_SLOT;
    onChange(next);
  };
  const onDrop = (event: DragEvent, target: number) => {
    event.preventDefault();
    setOver(null);
    const tile = event.dataTransfer.getData(TILE);
    const from = event.dataTransfer.getData(FROM_TARGET);
    if (tile !== "") place(target, Number(tile), from === "" ? null : Number(from));
  };
  const startDrag = (event: DragEvent, tile: number, from: number | null) => {
    event.dataTransfer.setData(TILE, String(tile));
    if (from !== null) event.dataTransfer.setData(FROM_TARGET, String(from));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="dnd-board">
      <div className="dnd-column">
        <h2 id={`${question.id}-pool`}>{question.ordered ? "Actions" : "Values"}</h2>
        <div
          className="dnd-pool"
          aria-labelledby={`${question.id}-pool`}
          onDragOver={(event) => { if (!checked) event.preventDefault(); }}
          onDrop={(event) => {
            event.preventDefault();
            const from = event.dataTransfer.getData(FROM_TARGET);
            if (from !== "") clear(Number(from));
          }}
        >
          {pool.map(({ tile, index }) => (
            <button
              key={index}
              type="button"
              className={`dnd-tile ${picked === index ? "picked" : ""}`}
              draggable={!checked}
              disabled={checked}
              aria-pressed={picked === index}
              onDragStart={(event) => startDrag(event, index, null)}
              onClick={() => setPicked((value) => (value === index ? null : index))}
            >{tile}</button>
          ))}
          {!pool.length && <p className="dnd-empty">All values placed.</p>}
        </div>
      </div>
      <div className="dnd-column">
        <h2>Answer area</h2>
        <ol className={`dnd-targets ${question.ordered ? "ordered" : ""}`}>
          {question.targets.map((target, index) => {
            const tile = placed[index];
            const filled = tile >= 0;
            const ok = checked && tile === question.correct[index];
            return (
              <li
                key={index}
                className={`dnd-target ${over === index ? "over" : ""} ${checked ? (ok ? "correct" : "wrong") : ""}`}
                onDragOver={(event) => { if (!checked) { event.preventDefault(); setOver(index); } }}
                onDragLeave={() => setOver((value) => (value === index ? null : value))}
                onDrop={(event) => onDrop(event, index)}
              >
                <span className="dnd-target-label">{target}</span>
                <div className={`dnd-slot ${filled ? "filled" : ""} ${picked !== null && !checked ? "ready" : ""}`}>
                  <button
                    type="button"
                    className="dnd-slot-main"
                    disabled={checked}
                    draggable={filled && !checked}
                    onDragStart={(event) => startDrag(event, tile, index)}
                    onClick={() => { if (picked !== null) place(index, picked); }}
                    aria-label={`${target}: ${filled ? question.tiles[tile] : "empty"}${picked !== null ? ". Place the selected value here" : ""}`}
                  >{filled ? question.tiles[tile] : picked !== null ? "Place here" : "Drop a value here"}</button>
                  {filled && !checked && <button type="button" className="dnd-clear" onClick={() => clear(index)} aria-label={`Clear ${target}`}>×</button>}
                  {checked && <i aria-hidden="true">{ok ? "✓" : "✗"}</i>}
                </div>
                {checked && !ok && <span className="dnd-fix">Correct: {question.tiles[question.correct[index]]}</span>}
              </li>
            );
          })}
        </ol>
      </div>
      {picked !== null && !checked && <p className="dnd-hint" role="status">Selected “{question.tiles[picked]}”. Now choose a target.</p>}
    </div>
  );
}

function DropdownInput({ question, answer, checked, onChange }: InputProps<DropdownQuestion>) {
  const chosen = slots(question, answer);
  const choose = (blank: number, value: string) => {
    if (checked) return;
    const next = [...chosen];
    next[blank] = value === "" ? EMPTY_SLOT : Number(value);
    onChange(next);
  };
  const body = templateSegments(question.template).map((segment, index) => {
    if (typeof segment === "string") return <span key={index}>{segment}</span>;
    const value = chosen[segment];
    const ok = checked && value === question.correct[segment];
    return (
      <span key={index} className="gap">
        <select
          className={`gap-select ${value >= 0 ? "filled" : ""} ${checked ? (ok ? "correct" : "wrong") : ""}`}
          value={value >= 0 ? String(value) : ""}
          disabled={checked}
          aria-label={`Blank ${segment + 1}`}
          onChange={(event) => choose(segment, event.target.value)}
        >
          <option value="" disabled>{`Select… (${segment + 1})`}</option>
          {question.blanks[segment].map((option, optionIndex) => <option key={optionIndex} value={optionIndex}>{option}</option>)}
        </select>
        {checked && !ok && <em className="gap-fix">→ {question.blanks[segment][question.correct[segment]]}</em>}
      </span>
    );
  });
  return question.language
    ? <pre className="question-code gap-code" data-language={question.language}><code>{body}</code></pre>
    : <p className="gap-template">{body}</p>;
}
