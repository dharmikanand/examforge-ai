
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Copy, Check, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface IntelligenceCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      className={cn("prose prose-sm max-w-none text-foreground/90 leading-relaxed", className)}
    >
      {content}
    </ReactMarkdown>
  );
}

export function IntelligenceCard({ title, icon, children, className, delay = 0 }: IntelligenceCardProps) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    const text = typeof children === 'string' ? children : title;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Content is ready to be forwarded to your notes."
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      className={cn(
        "shadow-sm border-border overflow-hidden intelligence-card-enter", 
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/20">
        <div className="flex items-center gap-2">
          {icon && <div className="text-accent">{icon}</div>}
          <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {typeof children === 'string' ? <MarkdownContent content={children} /> : children}
      </CardContent>
    </Card>
  );
}

export function ContentList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground">No data available.</p>;
  
  return (
    <ul className="space-y-3">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 group">
          <div className="mt-1 flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-accent/60 group-hover:text-accent transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <MarkdownContent content={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function McqItem({ item, index }: { item: any; index: number }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isCorrect = selectedOption === item.answer;

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
  };

  return (
    <AccordionItem value={`item-${index}`} className="border-b-border/50">
      <AccordionTrigger className="text-left text-sm font-semibold py-4 hover:no-underline hover:text-accent">
        <div className="flex gap-3 items-start pr-4 w-full">
          <span className="text-accent font-bold mt-0.5">Q{index + 1}.</span>
          <div className="flex-1">
             <MarkdownContent content={item.question} />
          </div>
          {selectedOption && (
            <div className="ml-auto flex-shrink-0">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-6 px-4 bg-muted/10 rounded-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {item.options.map((opt: string, oIdx: number) => {
              const isSelected = selectedOption === opt;
              const isOptionCorrect = opt === item.answer;
              
              let styleClass = "bg-card border-border hover:border-accent/40 cursor-pointer";
              
              if (selectedOption) {
                styleClass = "bg-card border-border cursor-default opacity-60";
                if (isOptionCorrect) {
                  styleClass = "bg-green-500/10 border-green-500/50 text-green-700 font-medium opacity-100 ring-1 ring-green-500/20";
                }
                if (isSelected && !isCorrect) {
                  styleClass = "bg-destructive/10 border-destructive/50 text-destructive font-medium opacity-100 ring-1 ring-destructive/20";
                }
              }

              return (
                <button
                  key={oIdx}
                  disabled={!!selectedOption}
                  onClick={() => handleOptionSelect(opt)}
                  className={cn(
                    "p-3 rounded-md text-sm border text-left transition-all flex items-center gap-3",
                    styleClass
                  )}
                >
                  <span className="font-bold text-muted-foreground w-4">{String.fromCharCode(65 + oIdx)}.</span>
                  <div className="flex-1">
                    <MarkdownContent content={opt} />
                  </div>
                  {selectedOption && isOptionCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                  {selectedOption && isSelected && !isCorrect && (
                    <XCircle className="h-4 w-4 text-destructive ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption && (
            <div className="bg-white p-4 rounded border border-border shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-accent" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detailed Explanation</p>
              </div>
              <div className="text-sm leading-relaxed">
                <span className={cn("font-bold mr-1", isCorrect ? "text-green-600" : "text-destructive")}>
                  {isCorrect ? "Correct!" : "Incorrect."}
                </span>
                <MarkdownContent content={item.explanation} className="inline" />
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function McqList({ mcqs }: { mcqs: any[] }) {
  if (!mcqs || mcqs.length === 0) return <p className="text-sm text-muted-foreground">No questions generated.</p>;

  return (
    <Accordion type="single" collapsible className="w-full">
      {mcqs.map((item, idx) => (
        <McqItem key={idx} item={item} index={idx} />
      ))}
    </Accordion>
  );
}
