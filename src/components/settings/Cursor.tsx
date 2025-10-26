import {
  Header,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { useApp } from "@/contexts";
import { CursorType } from "@/lib/storage";
import { MousePointer, MousePointer2, Pointer, TextCursor } from "lucide-react";

interface CursorSelectionProps {
  className?: string;
}

export const CursorSelection = ({ className }: CursorSelectionProps) => {
  const { customizable, setCursorType } = useApp();

  return (
    <div id="cursor" className={`space-y-2 ${className}`}>
      <Header
        title="Cursor"
        description="Control pluely cursor visibility"
        isMainTitle
        rightSlot={
          <Select
            value={customizable.cursor.type}
            onValueChange={(value) => setCursorType(value as CursorType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a cursor type" />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="invisible">
                Invisible (<MousePointer2 className="size-3 px-0" />)
              </SelectItem>
              <SelectItem value="default">
                Default (<MousePointer className="size-3" />)
              </SelectItem>
              <SelectItem value="auto">
                Auto (
                <MousePointer className="size-3" />/
                <TextCursor className="size-3" /> /
                <Pointer className="size-3" />)
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
};
