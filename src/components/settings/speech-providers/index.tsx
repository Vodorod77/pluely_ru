import { PlusIcon, TrashIcon, EditIcon } from "lucide-react";
import { Button, Label, Card } from "@/components";

import { SpeechProviderSelection } from "./SpeechProviderSelection";
import { SpeechProvider, SpeechProviderFormData } from "@/types";
import { ManageSpeechProvider } from "./Manage";
import { DeleteSpeechProvider } from "./deleteSpeechProvider";

interface SpeechProviderProps {
  speechProviders: SpeechProvider[];
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingProvider: string | null;
  errors: { [key: string]: string };
  saveError: string | null;
  deleteConfirm: string | null;
  formData: SpeechProviderFormData;
  setFormData: React.Dispatch<React.SetStateAction<SpeechProviderFormData>>;
  handleEdit: (provider: SpeechProvider) => void;
  handleSave: () => void;
  handleDelete: (id: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  resetForm: () => void;
  refreshKey?: number;
}

export const SpeechProviderComponent = ({
  speechProviders,
  selectedProvider,
  onProviderChange,
  showForm,
  setShowForm,
  editingProvider,
  errors,
  saveError,
  deleteConfirm,
  formData,
  setFormData,
  handleEdit,
  handleSave,
  handleDelete,
  confirmDelete,
  cancelDelete,
  resetForm,
  refreshKey,
}: SpeechProviderProps) => {
  return (
    <div className="space-y-3">
      <div className="border-b border-input/50 pb-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          Speech-to-Text Providers
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure speech-to-text providers for voice input. You can use
          built-in providers or add custom ones with their own endpoints and
          authentication.
        </p>
      </div>

      <div className="space-y-2">
        {/* Speech Provider Selection */}
        <SpeechProviderSelection
          value={selectedProvider}
          onChange={onProviderChange}
          refreshKey={refreshKey}
        />

        {/* Existing Custom Speech Providers */}
        {speechProviders.filter((provider) => provider.isCustom).length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Your Custom Providers
            </Label>
            {speechProviders
              .filter((provider) => provider.isCustom)
              .map((provider) => (
                <Card key={provider.id} className="p-3 border border-input/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{provider.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {provider.baseUrl}
                        {provider.endpoint}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(provider)}
                        title="Edit Provider"
                      >
                        <EditIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          handleDelete(provider.id);
                        }}
                        title="Delete Provider"
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* Add/Edit Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Custom Speech Provider
          </Button>
        ) : (
          <ManageSpeechProvider
            editingProvider={editingProvider}
            saveError={saveError}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleSave={handleSave}
            resetForm={resetForm}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <DeleteSpeechProvider
            cancelDelete={cancelDelete}
            confirmDelete={confirmDelete}
          />
        )}
      </div>
    </div>
  );
};
