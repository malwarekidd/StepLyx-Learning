import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Curriculum, Question, Rule } from "@/data/curriculum";
import { useIsMobile } from "@/hooks/use-mobile";
import { RuleContent } from "./RuleContent";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rule: Rule | undefined;
  question: Question;
  questionNumber: number;
  curriculum: Curriculum;
}

export function RuleDrawer({ open, onOpenChange, rule, question, questionNumber, curriculum }: Props) {
  const isMobile = useIsMobile();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-h-[88vh] overflow-y-auto rounded-t-3xl border-border bg-surface p-5"
            : "w-full overflow-y-auto border-border bg-surface p-6 sm:max-w-lg"
        }
      >
        <SheetHeader className="mb-5 text-left">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <BookOpen className="size-3.5" /> Sual {questionNumber} üçün qayda
          </span>
          <SheetTitle className="font-display text-2xl">{rule?.title ?? "Qayda tapılmadı"}</SheetTitle>
          <SheetDescription className="text-left">{question.prompt}</SheetDescription>
        </SheetHeader>
        {rule && <RuleContent rule={rule} steps={question.steps} curriculum={curriculum} />}
        <Button variant="brand" size="xl" className="mt-6 w-full" onClick={() => onOpenChange(false)}>
          Anladım, suala qayıt
        </Button>
      </SheetContent>
    </Sheet>
  );
}
