"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameModelProps {
  currentName: string;
  onRename: (newName: string) => void;
}

export function RenameModel({ currentName, onRename }: RenameModelProps) {
  const [name, setName] = useState(currentName);

  const handleRename = () => {
    if (name.trim()) {
      onRename(name.trim());
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter new name"
        className="h-8"
      />
      <Button onClick={handleRename} size="sm">
        Rename
      </Button>
    </div>
  );
}
