"use client"

import React from 'react';
import { Zap, ShieldAlert, Target, GraduationCap } from 'lucide-react';
import { IntelligenceMode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
  selectedMode: IntelligenceMode;
  onModeSelect: (mode: IntelligenceMode) => void;
}

const MODES = [
  {
    id: 'survival',
    title: '5-Min Survival',
    description: 'Ultra-condensed revision, formulas & definitions.',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  {
    id: 'weaponizer',
    title: 'Exam Weaponizer',
    description: 'Probable questions, weightage & strategies.',
    icon: Target,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  {
    id: 'trap-detector',
    title: 'Trap Detector',
    description: 'Common mistakes & frequently confused concepts.',
    icon: ShieldAlert,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    id: 'mcq-generator',
    title: 'Generate MCQs',
    description: '10-15 high-quality practice questions.',
    icon: GraduationCap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
] as const;

export function ModeSelector({ selectedMode, onModeSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = selectedMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg flex flex-col items-start gap-3",
              isActive 
                ? "border-accent bg-accent/5 ring-1 ring-accent" 
                : "border-border bg-card hover:border-accent/40"
            )}
          >
            <div className={cn("p-2 rounded-lg", mode.bgColor)}>
              <Icon className={cn("w-6 h-6", mode.color)} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{mode.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mode.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}