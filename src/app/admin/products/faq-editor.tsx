"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFaq } from "@/lib/db/schema";

export type FaqRow = {
  /** React key only — FAQs are saved as a whole list in this order. */
  key: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
};

export const toFaqRows = (faqs: ProductFaq[]): FaqRow[] =>
  faqs.map((f) => ({
    key: String(f.id),
    question: f.question,
    questionEn: f.questionEn ?? "",
    answer: f.answer,
    answerEn: f.answerEn ?? "",
  }));

let nextKey = 0;
const emptyRow = (): FaqRow => ({ key: `new-${++nextKey}`, question: "", questionEn: "", answer: "", answerEn: "" });

/** Questions and answers for the FAQ at the bottom of the product page. Posted as parallel arrays with the product form. */
export function FaqEditor({ rows, onChange }: { rows: FaqRow[]; onChange: (rows: FaqRow[]) => void }) {
  const set = (key: string, patch: Partial<FaqRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (from: number, to: number) => {
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
      <legend className="px-1 text-sm font-medium">FAQ</legend>
      <p className="text-xs text-muted-foreground">
        Optional — shown as “Česta pitanja” at the bottom of the product page, in this order. English is optional and
        falls back to Serbian. Line breaks in answers are kept.
      </p>

      {rows.map((r, i) => (
        <div key={r.key} className="space-y-3 rounded-xl border border-white/[0.06] bg-background/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Question {i + 1}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={`Move question ${i + 1} up`}
                className="rounded-lg"
              >
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, i + 1)}
                disabled={i === rows.length - 1}
                aria-label={`Move question ${i + 1} down`}
                className="rounded-lg"
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
                aria-label={`Remove question ${i + 1}`}
                className="rounded-lg text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              name="faqQuestion"
              value={r.question}
              onChange={(e) => set(r.key, { question: e.target.value })}
              placeholder="Pitanje — npr. Koliko traje aktivacija?"
              aria-label={`Question ${i + 1}, Serbian`}
              required
              maxLength={255}
              className="h-10 rounded-xl"
            />
            <Input
              name="faqQuestionEn"
              value={r.questionEn}
              onChange={(e) => set(r.key, { questionEn: e.target.value })}
              placeholder="Question — English (optional)"
              aria-label={`Question ${i + 1}, English`}
              maxLength={255}
              className="h-10 rounded-xl"
            />
            <Textarea
              name="faqAnswer"
              value={r.answer}
              onChange={(e) => set(r.key, { answer: e.target.value })}
              placeholder="Odgovor"
              aria-label={`Answer ${i + 1}, Serbian`}
              required
              rows={3}
              maxLength={5000}
              className="rounded-xl"
            />
            <Textarea
              name="faqAnswerEn"
              value={r.answerEn}
              onChange={(e) => set(r.key, { answerEn: e.target.value })}
              placeholder="Answer — English (optional)"
              aria-label={`Answer ${i + 1}, English`}
              rows={3}
              maxLength={5000}
              className="rounded-xl"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...rows, emptyRow()])} className="rounded-lg">
        <PlusIcon /> Add question
      </Button>
    </fieldset>
  );
}
