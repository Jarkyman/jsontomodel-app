
import { cn } from "@/lib/utils";

interface AdPlaceholderProps {
  type: 'banner' | 'footer';
  className?: string;
}

export default function AdPlaceholder({ type, className }: AdPlaceholderProps) {
  // In a real scenario, you would integrate AdSense scripts here.
  // This component serves as a visual placeholder.
  
  const styles = {
    banner: "h-24 w-full max-w-2xl", // e.g., 728x90 leaderboard
    footer: "h-24 w-full",
  };
  
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-muted/50 border border-dashed text-muted-foreground",
        styles[type],
        className
      )}
    >
      <div className="text-center">
        <p className="font-medium">Advertisement</p>
        <p className="text-xs">{type === 'banner' ? 'Responsive Banner Ad' : 'Footer Ad'}</p>
      </div>
    </div>
  );
}
