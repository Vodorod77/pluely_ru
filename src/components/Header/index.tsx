import { Label } from "@/components";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description: string;
  isMainTitle?: boolean;
  titleClassName?: string;
}

export const Header = ({
  title,
  description,
  isMainTitle = false,
  titleClassName,
}: HeaderProps) => {
  return (
    <div
      className={`flex flex-col ${
        isMainTitle ? "border-b border-input/50 pb-2" : ""
      }`}
    >
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
  );
};
