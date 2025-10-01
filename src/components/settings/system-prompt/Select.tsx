import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";

export const SelectSystemPrompt = () => {
  return (
    <Select>
      <SelectTrigger className="!h-8 ">
        <SelectValue placeholder="Select a system prompt" />
      </SelectTrigger>
      <SelectContent className="">
        <SelectItem value="1" className="h-8 ">
          System Prompt 1
        </SelectItem>
        <SelectItem value="2" className="h-8 ">
          System Prompt 2
        </SelectItem>
        <SelectItem value="3" className="h-8 ">
          System Prompt 3
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
