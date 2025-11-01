import { Label } from "@/components";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description: string;
  isMainTitle?: boolean;
  titleClassName?: string;
  rightSlot?: React.ReactNode | null;
  removeBorder?: boolean;
  className?: string;
}

export const Header = ({
  title,
  description,
  isMainTitle = false,
  titleClassName,
  rightSlot = null,
  removeBorder = false,
  className,
}: HeaderProps) => {
  return (
    <div
      className={cn(
        `flex ${
          rightSlot ? "flex-row justify-between items-center" : "flex-col"
        } ${
          isMainTitle && !rightSlot && !removeBorder
            ? "border-b border-input/50 pb-2"
            : ""
        }`,
        className
      )}
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
          className={`select-none text-muted-foreground leading-relaxed ${
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
