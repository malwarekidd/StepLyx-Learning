import type { ReactNode } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getRule, type Curriculum, type Unit } from "@/data/curriculum";
import { RuleContent } from "./RuleContent";

export function UnitGuideDialog({ unit, curriculum, children }: { unit: Unit; curriculum: Curriculum; children: ReactNode }) {
  const ruleIds = [...new Set(unit.lessons.flatMap((l) => l.questions.map((q) => q.ruleId)))];
  const rules = ruleIds.map((id) => getRule(id, curriculum)).filter((r) => r !== undefined);
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-surface sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {unit.subtitle}: {unit.title}
          </DialogTitle>
          <DialogDescription>PDF-dən çıxarılmış {rules.length} qayda</DialogDescription>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full">
          {rules.map((r) => (
            <AccordionItem key={r.id} value={r.id}>
              <AccordionTrigger className="text-left font-bold">{r.title}</AccordionTrigger>
              <AccordionContent>
                <RuleContent rule={r} curriculum={curriculum} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
