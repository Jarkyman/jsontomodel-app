
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea, TextareaProps } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface LineNumberedTextareaProps extends Omit<TextareaProps, 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  containerClassName?: string;
}

const LineNumberedTextarea = React.forwardRef<HTMLTextAreaElement, LineNumberedTextareaProps>(
  ({ value, onChange, className, containerClassName, ...props }, ref) => {
    const [lineNumbers, setLineNumbers] = useState('1');
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleScroll = () => {
      if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };
    
    const updateLineNumbers = useCallback(() => {
        const lines = value.split('\n');
        const count = lines.length || 1;
        const numbers = Array.from({ length: count }, (_, i) => i + 1).join('\n');
        setLineNumbers(numbers);
    }, [value]);

    useEffect(() => {
        updateLineNumbers();
    }, [value, updateLineNumbers]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('scroll', handleScroll);
            handleScroll();
        }
        return () => {
            if (textarea) {
                textarea.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    useEffect(() => {
        if (typeof ref === 'function') {
            ref(textareaRef.current);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textareaRef.current;
        }
    }, [ref]);


    return (
      <div className={cn('line-numbered-textarea-container w-full rounded-md border', containerClassName)}>
        <div ref={lineNumbersRef} className="line-numbers">
          {lineNumbers}
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e);
            updateLineNumbers();
          }}
          className={cn("line-numbered-textarea resize-none", className)}
          {...props}
        />
      </div>
    );
  }
);

LineNumberedTextarea.displayName = 'LineNumberedTextarea';

export { LineNumberedTextarea };
