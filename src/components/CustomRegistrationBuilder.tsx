'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  Hash,
  List,
  CheckSquare,
  Phone,
} from 'lucide-react';

type QuestionType = 'text' | 'number' | 'select' | 'checkbox' | 'phone' | 'textarea';

interface RegistrationQuestion {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select / checkbox types
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Short Text', icon: <AlignLeft className="h-3.5 w-3.5" /> },
  { value: 'textarea', label: 'Long Text', icon: <AlignLeft className="h-3.5 w-3.5" /> },
  { value: 'number', label: 'Number', icon: <Hash className="h-3.5 w-3.5" /> },
  { value: 'phone', label: 'Phone Number', icon: <Phone className="h-3.5 w-3.5" /> },
  { value: 'select', label: 'Dropdown', icon: <List className="h-3.5 w-3.5" /> },
  { value: 'checkbox', label: 'Checkbox Group', icon: <CheckSquare className="h-3.5 w-3.5" /> },
];

const generateId = () => `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_QUESTIONS: RegistrationQuestion[] = [
  {
    id: generateId(),
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    required: true,
  },
  {
    id: generateId(),
    label: 'Phone Number',
    type: 'phone',
    placeholder: '+234 xxx xxxx xxxx',
    required: true,
  },
];

interface CustomRegistrationBuilderProps {
  onChange?: (questions: RegistrationQuestion[]) => void;
}

export default function CustomRegistrationBuilder({
  onChange,
}: CustomRegistrationBuilderProps) {
  const [questions, setQuestions] = useState<RegistrationQuestion[]>(DEFAULT_QUESTIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const update = (updated: RegistrationQuestion[]) => {
    setQuestions(updated);
    onChange?.(updated);
  };

  const addQuestion = () => {
    const newQ: RegistrationQuestion = {
      id: generateId(),
      label: 'New Question',
      type: 'text',
      placeholder: '',
      required: false,
    };
    const updated = [...questions, newQ];
    update(updated);
    setExpandedId(newQ.id);
  };

  const removeQuestion = (id: string) => {
    update(questions.filter((q) => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateQuestion = (id: string, patch: Partial<RegistrationQuestion>) => {
    update(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const addOption = (id: string) => {
    const q = questions.find((q) => q.id === id);
    if (!q) return;
    updateQuestion(id, { options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`] });
  };

  const updateOption = (qId: string, optIndex: number, value: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q?.options) return;
    const opts = [...q.options];
    opts[optIndex] = value;
    updateQuestion(qId, { options: opts });
  };

  const removeOption = (qId: string, optIndex: number) => {
    const q = questions.find((q) => q.id === qId);
    if (!q?.options) return;
    updateQuestion(qId, { options: q.options.filter((_, i) => i !== optIndex) });
  };

  return (
    <div className="space-y-3">
      {/* Questions list */}
      {questions.map((q, index) => {
        const isExpanded = expandedId === q.id;
        const isLocked = index < 2; // Email + Name are always required & locked

        return (
          <div
            key={q.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            {/* Question Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50/60 transition"
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 truncate">{q.label || 'Untitled Question'}</span>
                  {q.required && (
                    <span className="rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-red-600">
                      Required
                    </span>
                  )}
                  {isLocked && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-500">
                      Default
                    </span>
                  )}
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 capitalize">
                    {QUESTION_TYPES.find((t) => t.value === q.type)?.label ?? q.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isLocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(q.id);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded Editor */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Label */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Question Label
                    </label>
                    <input
                      type="text"
                      value={q.label}
                      disabled={isLocked}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-violet-600 transition disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Question Type
                    </label>
                    <select
                      value={q.type}
                      disabled={isLocked}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          type: e.target.value as QuestionType,
                          options: e.target.value === 'select' || e.target.value === 'checkbox'
                            ? q.options ?? ['Option 1']
                            : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-violet-600 transition disabled:bg-slate-100 disabled:text-slate-400 appearance-none"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Placeholder */}
                {q.type !== 'select' && q.type !== 'checkbox' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      value={q.placeholder ?? ''}
                      onChange={(e) => updateQuestion(q.id, { placeholder: e.target.value })}
                      placeholder="e.g. Enter your answer here"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-violet-600 transition"
                    />
                  </div>
                )}

                {/* Options for select/checkbox */}
                {(q.type === 'select' || q.type === 'checkbox') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                      Answer Options
                    </label>
                    <div className="space-y-2">
                      {(q.options ?? []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-violet-600 transition"
                          />
                          <button
                            onClick={() => removeOption(q.id, optIdx)}
                            className="text-slate-400 hover:text-red-500 transition p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(q.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add option
                      </button>
                    </div>
                  </div>
                )}

                {/* Required Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Required field</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Guests must answer this before checking out.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      disabled={isLocked}
                      onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                  </label>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Question */}
      <button
        onClick={addQuestion}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/30 transition"
      >
        <Plus className="h-4 w-4" />
        Add Custom Question
      </button>

      {/* Preview Count */}
      <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          <strong className="text-slate-900">{questions.length}</strong> questions in registration form
          {' '}·{' '}
          <strong className="text-slate-900">{questions.filter((q) => q.required).length}</strong> required
        </span>
        <button
          onClick={() => alert('Preview registration form coming soon!')}
          className="text-xs font-bold text-violet-600 hover:text-violet-700 transition"
        >
          Preview Form
        </button>
      </div>
    </div>
  );
}
