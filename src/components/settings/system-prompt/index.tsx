import { Button, Header, Textarea } from "@/components";
import { STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "@/lib";
import { UseSettingsReturn } from "@/types";
import { useState } from "react";
import { CreateSystemPrompt } from "./Create";
import { SelectSystemPrompt } from "./Select";
import { GenerateSystemPrompt } from "./Generate";

export const SystemPrompt = ({
  systemPrompt,
  setSystemPrompt,
}: UseSettingsReturn) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    prompt: "",
  });

  return (
    <div className="space-y-3">
      <Header
        title="System Prompt"
        description="Define the AI's behavior and personality."
        isMainTitle
        rightSlot={
          <div className="flex flex-row gap-2">
            {isAddingNew ? <GenerateSystemPrompt /> : <SelectSystemPrompt />}

            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsAddingNew(!isAddingNew)}
            >
              {isAddingNew ? "Close" : "Add New"}
            </Button>
          </div>
        }
      />

      {isAddingNew ? (
        <CreateSystemPrompt
          form={form}
          setForm={setForm}
          onClose={() => setIsAddingNew(false)}
          onCreate={() => {
            setIsAddingNew(false);
            setForm({
              name: "",
              prompt: "",
            });
          }}
        />
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="You are a helpful AI assistant. Be concise, accurate, and friendly in your responses..."
            value={systemPrompt}
            onChange={(e) => {
              setSystemPrompt(e.target.value);
              safeLocalStorage.setItem(
                STORAGE_KEYS.SYSTEM_PROMPT,
                e.target.value
              );
            }}
            className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
          />
          <p className="text-xs text-muted-foreground/70">
            💡 Tip: Be specific about tone, expertise level, and response format
          </p>
        </div>
      )}
    </div>
  );
};
