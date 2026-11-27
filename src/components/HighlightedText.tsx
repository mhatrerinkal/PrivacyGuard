import React from 'react';
import { CATEGORY_META } from '../engine/categories';
import { DetectedEntity } from '../types/pii';

interface HighlightedTextProps {
  text: string;
  entities: DetectedEntity[];
}

/**
 * Renders original text while preserving exact whitespace/line breaks
 * and highlighting each detected PII entity in its category-specific color.
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  entities,
}) => {
  if (!text) {
    return (
      <span className="text-slate-400 dark:text-slate-500 italic">
        No input text provided yet. Paste text, upload a file, or load sample noisy data above.
      </span>
    );
  }

  if (entities.length === 0) {
    return <>{text}</>;
  }

  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const entity of entities) {
    if (entity.startIndex > cursor) {
      segments.push(
        <React.Fragment key={`plain-${cursor}`}>
          {text.slice(cursor, entity.startIndex)}
        </React.Fragment>
      );
    }

    const meta = CATEGORY_META[entity.category];
    segments.push(
      <mark
        key={entity.id}
        title={`${meta.label} • ${entity.validationStatus}`}
        className={`inline rounded px-1 py-0.5 font-semibold transition-colors cursor-help ${meta.highlightClass}`}
      >
        {text.slice(entity.startIndex, entity.endIndex)}
      </mark>
    );

    cursor = entity.endIndex;
  }

  if (cursor < text.length) {
    segments.push(
      <React.Fragment key={`plain-end-${cursor}`}>
        {text.slice(cursor)}
      </React.Fragment>
    );
  }

  return <>{segments}</>;
};
