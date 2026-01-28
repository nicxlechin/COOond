'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Question, QuestionnaireResponses } from '@/lib/questionnaires/types';

interface QuestionRendererProps {
  question: Question;
  value: string | string[] | number | boolean | null | undefined;
  onChange: (value: string | string[] | number | boolean | null) => void;
  allAnswers: QuestionnaireResponses;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  allAnswers,
}: QuestionRendererProps) {
  // Check conditional display
  if (question.conditionalDisplay) {
    const conditionValue = allAnswers[question.conditionalDisplay.questionId];
    const shouldShow = Array.isArray(question.conditionalDisplay.value)
      ? question.conditionalDisplay.value.includes(conditionValue as string)
      : conditionValue === question.conditionalDisplay.value;

    if (!shouldShow) return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id} className="text-base font-medium">
        {question.label}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {question.description && (
        <p className="text-sm text-muted-foreground">{question.description}</p>
      )}

      {question.type === 'text' && (
        <Input
          id={question.id}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          required={question.required}
        />
      )}

      {question.type === 'textarea' && (
        <Textarea
          id={question.id}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          required={question.required}
          rows={4}
          className="resize-none"
        />
      )}

      {question.type === 'select' && (
        <Select
          value={(value as string) || ''}
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === 'multiselect' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options?.map((option) => {
            const selectedValues = (value as string[]) || [];
            const isSelected = selectedValues.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onChange(selectedValues.filter((v) => v !== option.value));
                  } else {
                    onChange([...selectedValues, option.value]);
                  }
                }}
                className={cn(
                  'flex flex-col items-start p-3 text-left border rounded-lg transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="font-medium text-sm">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'date' && (
        <Input
          id={question.id}
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
        />
      )}

      {question.type === 'currency' && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id={question.id}
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || null)}
            placeholder="0.00"
            required={question.required}
            className="pl-7"
          />
        </div>
      )}

      {question.type === 'scale' && (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={cn(
                'w-10 h-10 rounded-full border-2 font-medium transition-colors',
                value === num
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {question.type === 'yes-no' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              'flex-1 py-2 px-4 border rounded-lg font-medium transition-colors',
              value === true
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              'flex-1 py-2 px-4 border rounded-lg font-medium transition-colors',
              value === false
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}
