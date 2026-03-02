"use client";

import { useState, useCallback, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropZoneProps {
    onFileDrop: (content: string) => void;
    children: React.ReactNode;
}

export function DragDropZone({ onFileDrop, children }: DragDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // We only want to set isDragging to false if we are leaving the main container,
        // not if we are just entering a child element.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Required to allow drop
        if (!isDragging) {
            setIsDragging(true);
        }
    }, [isDragging]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length === 0) return;

            const file = files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                const text = event.target?.result;
                if (typeof text === "string") {
                    onFileDrop(text);
                }
            };

            reader.readAsText(file);
        },
        [onFileDrop]
    );

    // Fallback to prevent default behavior if something goes wrong and drops outside our component
    useEffect(() => {
        const handleWindowDragOver = (e: DragEvent) => e.preventDefault();
        const handleWindowDrop = (e: DragEvent) => e.preventDefault();

        window.addEventListener("dragover", handleWindowDragOver);
        window.addEventListener("drop", handleWindowDrop);

        return () => {
            window.removeEventListener("dragover", handleWindowDragOver);
            window.removeEventListener("drop", handleWindowDrop);
        };
    }, []);

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative w-full h-full min-h-screen"
        >
            {isDragging && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200">
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-primary/50 bg-muted/50 p-12 text-center animate-in fade-in zoom-in-95">
                        <div className="rounded-full bg-primary/10 p-4">
                            <Check className="h-12 w-12 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-headline text-2xl font-bold tracking-tight">Drop file here</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                We accept .json and .csv files. File contents will be instantly pasted.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}
