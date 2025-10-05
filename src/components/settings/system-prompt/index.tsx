import { Button, Header, Textarea } from "@/components";
import { DEFAULT_SYSTEM_PROMPT, STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "@/lib";
import { UseSettingsReturn } from "@/types";
import { useState, useEffect, useCallback } from "react";
import { CreateSystemPrompt } from "./Create";
import { SelectSystemPrompt } from "./Select";
import { GenerateSystemPrompt } from "./Generate";
import { DeleteSystemPrompt } from "./Delete";
import { useSystemPrompts } from "@/hooks";
import { Settings2 } from "lucide-react";

type ViewMode = "default" | "create" | "edit";

export const SystemPrompt = ({
  systemPrompt,
  setSystemPrompt,
}: UseSettingsReturn) => {
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [form, setForm] = useState<{
    id?: number;
    name: string;
    prompt: string;
  }>({
    name: "",
    prompt: "",
  });
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(
    () => {
      const stored = safeLocalStorage.getItem(
        STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID
      );
      return stored ? Number(stored) : null;
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    prompts,
    isLoading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    clearError,
  } = useSystemPrompts();

  /**
   * Load selected prompt on mount and when prompts change
   */
  useEffect(() => {
    if (selectedPromptId && prompts.length > 0) {
      const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
      if (selectedPrompt) {
        setSystemPrompt(selectedPrompt.prompt);
      } else {
        // Selected prompt was deleted, reset to default
        setSelectedPromptId(null);
        safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID);
        const currentPrompt = safeLocalStorage.getItem(
          STORAGE_KEYS.SYSTEM_PROMPT
        );
        if (!currentPrompt) {
          setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
          safeLocalStorage.setItem(
            STORAGE_KEYS.SYSTEM_PROMPT,
            DEFAULT_SYSTEM_PROMPT
          );
        }
      }
    }
  }, [prompts, selectedPromptId, setSystemPrompt]);

  /**
   * Handle selecting a prompt from dropdown
   */
  const handleSelectPrompt = useCallback(
    (promptId: number) => {
      const selectedPrompt = prompts.find((p) => p.id === promptId);
      if (selectedPrompt) {
        setSystemPrompt(selectedPrompt.prompt);
        setSelectedPromptId(promptId);
        safeLocalStorage.setItem(
          STORAGE_KEYS.SYSTEM_PROMPT,
          selectedPrompt.prompt
        );
        safeLocalStorage.setItem(
          STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID,
          promptId.toString()
        );
      }
    },
    [prompts, setSystemPrompt]
  );

  /**
   * Handle creating a new prompt
   */
  const handleCreate = useCallback(async () => {
    try {
      setIsSaving(true);
      clearError();
      const newPrompt = await createPrompt({
        name: form.name,
        prompt: form.prompt,
      });

      // Auto-select the newly created prompt
      setSystemPrompt(newPrompt.prompt);
      setSelectedPromptId(newPrompt.id);
      safeLocalStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, newPrompt.prompt);
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID,
        newPrompt.id.toString()
      );

      // Reset form and close
      setForm({ name: "", prompt: "" });
      setViewMode("default");
    } catch (err) {
      console.error("Failed to create prompt:", err);
    } finally {
      setIsSaving(false);
    }
  }, [form, createPrompt, setSystemPrompt, clearError]);

  /**
   * Handle updating an existing prompt
   */
  const handleUpdate = useCallback(async () => {
    if (!form.id) return;

    try {
      setIsSaving(true);
      clearError();
      const updatedPrompt = await updatePrompt(form.id, {
        name: form.name,
        prompt: form.prompt,
      });

      // Update if this is the selected prompt
      if (selectedPromptId === form.id) {
        setSystemPrompt(updatedPrompt.prompt);
        safeLocalStorage.setItem(
          STORAGE_KEYS.SYSTEM_PROMPT,
          updatedPrompt.prompt
        );
      }

      // Reset form and close
      setForm({ name: "", prompt: "" });
      setViewMode("default");
    } catch (err) {
      console.error("Failed to update prompt:", err);
    } finally {
      setIsSaving(false);
    }
  }, [form, updatePrompt, selectedPromptId, setSystemPrompt, clearError]);

  /**
   * Handle opening delete confirmation dialog
   */
  const handleDeleteClick = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handle delete confirmation
   */
  const handleDelete = useCallback(
    async (id: number) => {
      clearError();
      await deletePrompt(id);

      // If deleted prompt was selected, reset to default
      if (selectedPromptId === id) {
        setSelectedPromptId(null);
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_SYSTEM_PROMPT_ID);
        safeLocalStorage.setItem(
          STORAGE_KEYS.SYSTEM_PROMPT,
          DEFAULT_SYSTEM_PROMPT
        );
      }

      // Reset form and close
      setForm({ name: "", prompt: "" });
      setViewMode("default");
    },
    [deletePrompt, selectedPromptId, setSystemPrompt, clearError]
  );

  /**
   * Handle opening edit mode
   */
  const handleManage = useCallback(
    (promptId: number) => {
      const promptToEdit = prompts.find((p) => p.id === promptId);
      if (promptToEdit) {
        setForm({
          id: promptToEdit.id,
          name: promptToEdit.name,
          prompt: promptToEdit.prompt,
        });
        setViewMode("edit");
      }
    },
    [prompts]
  );

  /**
   * Handle closing create/edit mode
   */
  const handleClose = useCallback(() => {
    setForm({ name: "", prompt: "" });
    setViewMode("default");
    clearError();
  }, [clearError]);

  /**
   * Handle AI generation
   */
  const handleGenerate = useCallback(
    (generatedPrompt: string, generatedPromptName: string) => {
      setForm((prev) => ({
        ...prev,
        prompt: generatedPrompt,
        name: generatedPromptName,
      }));
    },
    []
  );

  /**
   * Handle manual textarea changes
   */
  const handleTextareaChange = useCallback(
    (newValue: string) => {
      setSystemPrompt(newValue);
      safeLocalStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, newValue);

      // If a prompt is selected, update it in the database
      if (selectedPromptId) {
        const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
        if (selectedPrompt) {
          updatePrompt(selectedPromptId, { prompt: newValue }).catch((err) => {
            console.error("Failed to auto-update prompt:", err);
          });
        }
      }
    },
    [setSystemPrompt, selectedPromptId, prompts, updatePrompt]
  );

  return (
    <>
      <div className="space-y-3">
        <Header
          title="System Prompt"
          description="Define the AI's behavior and personality."
          isMainTitle
          rightSlot={
            <div className="flex flex-row gap-2">
              {viewMode !== "default" ? (
                <GenerateSystemPrompt onGenerate={handleGenerate} />
              ) : (
                <SelectSystemPrompt
                  prompts={prompts}
                  selectedId={selectedPromptId}
                  onSelect={handleSelectPrompt}
                  onManage={handleManage}
                  isLoading={isLoading}
                />
              )}

              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  if (viewMode !== "default") {
                    handleClose();
                  } else {
                    setViewMode("create");
                  }
                }}
                disabled={isSaving}
              >
                {viewMode !== "default" ? "Close" : "Add New"}
              </Button>
            </div>
          }
        />

        {viewMode !== "default" ? (
          <CreateSystemPrompt
            form={form}
            setForm={setForm}
            onClose={handleClose}
            onSave={viewMode === "edit" ? handleUpdate : handleCreate}
            onDelete={viewMode === "edit" ? handleDeleteClick : undefined}
            isEditing={viewMode === "edit"}
            isSaving={isSaving}
          />
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="You are a helpful AI assistant. Be concise, accurate, and friendly in your responses..."
              value={systemPrompt}
              onChange={(e) => handleTextareaChange(e.target.value)}
              className="min-h-[100px] resize-none border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <div className="flex flex-row gap-2 w-full justify-between">
              <p className="text-xs text-muted-foreground/70">
                💡 Tip: Be specific about tone, expertise level, and response
                format
              </p>
              {selectedPromptId ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="!h-6"
                  onClick={() => {
                    setViewMode("edit");
                    handleManage(selectedPromptId);
                  }}
                >
                  Manage <Settings2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteSystemPrompt
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        promptId={form.id}
        promptName={form.name}
        onDelete={handleDelete}
      />
    </>
  );
};
