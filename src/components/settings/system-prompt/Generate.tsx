import { Button, Textarea } from "@/components";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SparklesIcon } from "lucide-react";

export const GenerateSystemPrompt = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Generate with AI"
          size="sm"
          variant="outline"
          className="w-fit"
        >
          <SparklesIcon /> Generate with AI
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-94 p-4 border shadow-lg overflow-hidden"
      >
        <div className="space-y-2">
          <p className="text-sm font-medium">Generate a new system prompt</p>
          <Textarea
            placeholder="You are a helpful AI assistant. Be concise, accurate, and friendly in your responses..."
            className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
          />
          <Button className="w-full">Generate</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
