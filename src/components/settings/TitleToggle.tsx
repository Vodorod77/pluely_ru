import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface TitleToggleProps {
  className?: string;
}

export const TitleToggle = ({ className }: TitleToggleProps) => {
  const { customizable, toggleTitlesVisibility } = useApp();

  const handleSwitchChange = (checked: boolean) => {
    toggleTitlesVisibility(checked);
  };

  return (
    <div id="titles" className={`space-y-2 ${className}`}>
      <Header
        title="Element Titles"
        description="Show or hide title attributes on buttons and interactive elements"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {!customizable?.titles?.isEnabled
                ? "Show Element Titles"
                : "Hide Element Titles"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {`Toggle to make titles ${
                !customizable?.titles?.isEnabled ? "Visible" : "Hidden"
              } on all elements`}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable?.titles?.isEnabled}
          onCheckedChange={handleSwitchChange}
          aria-label="Toggle element titles visibility"
        />
      </div>
    </div>
  );
};
