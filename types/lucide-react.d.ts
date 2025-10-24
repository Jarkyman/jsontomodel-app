import type {
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
} from "react";

export interface LucideProps extends SVGProps<SVGSVGElement> {
  color?: string;
  size?: string | number;
  strokeWidth?: string | number;
  absoluteStrokeWidth?: boolean;
}

export type LucideIcon = ForwardRefExoticComponent<
  LucideProps & RefAttributes<SVGSVGElement>
>;

export type IconNode = readonly (readonly [
  tag: string,
  attrs: Record<string, string>,
])[];

export declare function createLucideIcon(
  iconName: string,
  iconNode: IconNode,
): LucideIcon;

export declare const ArrowLeft: LucideIcon;
export declare const ArrowRight: LucideIcon;
export declare const Moon: LucideIcon;
export declare const Sun: LucideIcon;
export declare const Copy: LucideIcon;
export declare const Check: LucideIcon;
export declare const Code2: LucideIcon;
export declare const Loader2: LucideIcon;
export declare const Pencil: LucideIcon;
export declare const AlertCircle: LucideIcon;
export declare const Wand2: LucideIcon;
export declare const Sparkles: LucideIcon;
export declare const Layers: LucideIcon;
export declare const ShieldCheck: LucideIcon;
export declare const Timer: LucideIcon;
export declare const ChevronDown: LucideIcon;
export declare const ChevronUp: LucideIcon;
export declare const ChevronRight: LucideIcon;
export declare const Circle: LucideIcon;
export declare const X: LucideIcon;
export declare const PanelLeft: LucideIcon;
export declare const ChevronLeft: LucideIcon;

export declare const icons: Record<string, LucideIcon>;
