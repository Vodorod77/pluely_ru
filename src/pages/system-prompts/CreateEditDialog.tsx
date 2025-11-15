import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
} from "@/components";
import { GenerateSystemPrompt } from "./Generate";
import { SparklesIcon } from "lucide-react";
import { useTranslation } from "@/contexts";

interface CreateEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    id?: number;
    name: string;
    prompt: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      id?: number;
      name: string;
      prompt: string;
    }>
  >;
  onSave: () => void;
  onGenerate: (prompt: string, promptName: string) => void;
  isEditing?: boolean;
  isSaving?: boolean;
}

export const CreateEditDialog = ({
  isOpen,
  onOpenChange,
  form,
  setForm,
  onSave,
  onGenerate,
  isEditing = false,
  isSaving = false,
}: CreateEditDialogProps) => {
  const { t } = useTranslation();
  const isFormValid = form.name.trim() && form.prompt.trim();

  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? t("system_prompts.create_dialog.title_edit") : t("system_prompts.create_dialog.title_create")}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEditing
                  ? t("system_prompts.create_dialog.description_edit")
                  : t("system_prompts.create_dialog.description_create")}
              </DialogDescription>
            </div>
            <GenerateSystemPrompt onGenerate={onGenerate} />
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t("system_prompts.create_dialog.name_label")}
            </label>
            <Input
              placeholder={t("system_prompts.create_dialog.name_placeholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isSaving}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t("system_prompts.create_dialog.prompt_label")}
            </label>
            <Textarea
              placeholder={t("system_prompts.create_dialog.prompt_placeholder")}
              className="min-h-[200px] resize-none"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground/70">
              {t("system_prompts.create_dialog.tip")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("system_prompts.create_dialog.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
            {isSaving ? (
              <>
                <SparklesIcon className="h-4 w-4 animate-pulse" />
                {isEditing ? t("system_prompts.create_dialog.updating") : t("system_prompts.create_dialog.creating")}
              </>
            ) : isEditing ? (
              t("system_prompts.create_dialog.update")
            ) : (
              t("system_prompts.create_dialog.create")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
