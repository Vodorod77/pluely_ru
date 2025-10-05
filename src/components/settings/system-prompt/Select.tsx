import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { SystemPrompt } from "@/types";

interface SelectSystemPromptProps {
  prompts: SystemPrompt[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onManage: (id: number) => void;
  isLoading?: boolean;
}

export const SelectSystemPrompt = ({
  prompts,
  selectedId,
  onSelect,
  isLoading = false,
}: SelectSystemPromptProps) => {
  return (
    <Select
      value={selectedId?.toString() || ""}
      onValueChange={(value) => onSelect(Number(value))}
      disabled={isLoading}
    >
      <SelectTrigger className="!h-8 w-[200px]">
        <SelectValue placeholder="Select a system prompt" />
      </SelectTrigger>
      <SelectContent side="bottom" align="end">
        {prompts.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No system prompts yet.
            <br />
            <span className="text-xs">Create one to get started!</span>
          </div>
        ) : (
          prompts.map((prompt) => (
            <SelectItem
              key={prompt.id}
              value={prompt.id.toString()}
              className="h-auto py-2"
            >
              <span className="flex-1 truncate text-sm">{prompt.name}</span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
