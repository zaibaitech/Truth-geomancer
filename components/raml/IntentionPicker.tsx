'use client';

import { INTENTIONS } from '@/content/intentions';
import { INTENTION_ICONS } from './intentionIcons';

export function IntentionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {INTENTIONS.map((intention) => {
        const Icon = INTENTION_ICONS[intention.icon];
        const active = value === intention.id;
        return (
          <button
            key={intention.id}
            type="button"
            onClick={() => onChange(intention.id)}
            className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors ${
              active ? 'border-clay/60 bg-clay/10' : 'border-sand/12 bg-ink-card'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                active ? 'border-clay/40 text-clay-light' : 'border-sand/15 text-sand/60'
              }`}
            >
              <Icon size={15} />
            </div>
            <p className={`text-[13px] font-medium leading-tight ${active ? 'text-sand-light' : 'text-sand-light/90'}`}>
              {intention.label}
            </p>
            <p className="text-[11px] leading-snug text-sand/45">{intention.description}</p>
          </button>
        );
      })}
    </div>
  );
}
