import { Button, Input, Textarea } from "@/components";

interface CreateSystemPromptProps {
  form: {
    name: string;
    prompt: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      prompt: string;
    }>
  >;
  onClose: () => void;
  onCreate: () => void;
}

export const CreateSystemPrompt = ({
  form,
  setForm,
  onClose,
  onCreate,
}: CreateSystemPromptProps) => {
  return (
    <div className="space-y-3">
      <Input
        className="h-11"
        placeholder="Enter a new name for the system prompt"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Textarea
        placeholder="You are a helpful AI assistant. Be concise, accurate, and friendly in your responses..."
        className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
        value={form.prompt}
        onChange={(e) => setForm({ ...form, prompt: e.target.value })}
      />
      <div className="flex flex-row w-full gap-2">
        <Button className="w-1/2" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button className="w-1/2" onClick={onCreate}>
          Create
        </Button>
      </div>
    </div>
  );
};
