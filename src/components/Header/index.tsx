import { Label } from "@/components";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description: string;
  isMainTitle?: boolean;
  titleClassName?: string;
  rightSlot?: React.ReactNode | null;
}

export const Header = ({
  title,
  description,
  isMainTitle = false,
  titleClassName,
  rightSlot = null,
}: HeaderProps) => {
  return (
    <div
      className={`flex ${
        rightSlot ? "flex-row justify-between items-center" : "flex-col"
      } ${isMainTitle && !rightSlot ? "border-b border-input/50 pb-2" : ""}`}
    >
      <div className="flex flex-col">
        <Label
          className={`${cn(
            "font-semibold",
            isMainTitle ? "text-lg" : "text-sm "
          )} ${titleClassName}`}
        >
          {title}
        </Label>
        <p
          className={`text-muted-foreground leading-relaxed ${
            isMainTitle ? "text-sm" : "text-xs"
          }`}
        >
          {description}
        </p>
      </div>
      {rightSlot}
    </div>
  );
};
