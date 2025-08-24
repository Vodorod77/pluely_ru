import { useState } from "react";
import { XIcon, SaveIcon } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
} from "@/components";
import { SpeechProviderFormData } from "@/types";

interface ManageSpeechProviderProps {
  editingProvider: string | null;
  saveError: string | null;
  formData: SpeechProviderFormData;
  setFormData: React.Dispatch<React.SetStateAction<SpeechProviderFormData>>;
  errors: { [key: string]: string };
  handleSave: () => void;
  resetForm: () => void;
}

export const ManageSpeechProvider = ({
  editingProvider,
  saveError,
  formData,
  setFormData,
  errors,
  handleSave,
  resetForm,
}: ManageSpeechProviderProps) => {
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");

  const addField = () => {
    if (newFieldKey && newFieldValue) {
      setFormData({
        ...formData,
        additionalFields: {
          ...formData.additionalFields,
          [newFieldKey]: newFieldValue,
        },
      });
      setNewFieldKey("");
      setNewFieldValue("");
    }
  };

  const removeField = (key: string) => {
    const updated = { ...formData.additionalFields };
    delete updated[key];
    setFormData({
      ...formData,
      additionalFields: updated,
    });
  };

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setFormData({
        ...formData,
        additionalHeaders: {
          ...formData.additionalHeaders,
          [newHeaderKey]: newHeaderValue,
        },
      });
      setNewHeaderKey("");
      setNewHeaderValue("");
    }
  };

  const removeHeader = (key: string) => {
    const updated = { ...formData.additionalHeaders };
    delete updated[key];
    setFormData({
      ...formData,
      additionalHeaders: updated,
    });
  };

  return (
    <div className="border border-input/50 rounded-lg p-4 space-y-4 bg-background">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {editingProvider ? "Edit" : "Add"} Speech Provider
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={resetForm}
          className="h-8 w-8 p-0"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {saveError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Configuration */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Provider Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Speech Provider"
            className={`h-11 border-1 border-input/50 focus:border-primary/50 transition-colors ${
              errors.name ? "border-destructive" : ""
            }`}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Audio Format *</Label>
          <Input
            value={formData.audioFormat}
            onChange={(e) =>
              setFormData({ ...formData, audioFormat: e.target.value })
            }
            placeholder="wav"
            className={`h-11 border-1 border-input/50 focus:border-primary/50 transition-colors ${
              errors.audioFormat ? "border-destructive" : ""
            }`}
          />
          {errors.audioFormat && (
            <p className="text-xs text-red-600">{errors.audioFormat}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Base URL *</Label>
          <Input
            value={formData.baseUrl}
            onChange={(e) =>
              setFormData({ ...formData, baseUrl: e.target.value })
            }
            placeholder="https://api.example.com"
            className={`h-11 border-1 border-input/50 focus:border-primary/50 transition-colors ${
              errors.baseUrl ? "border-destructive" : ""
            }`}
          />
          {errors.baseUrl && (
            <p className="text-xs text-red-600">{errors.baseUrl}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Endpoint *</Label>
          <Input
            value={formData.endpoint}
            onChange={(e) =>
              setFormData({ ...formData, endpoint: e.target.value })
            }
            placeholder="/v1/transcriptions"
            className={`h-11 border-1 border-input/50 focus:border-primary/50 transition-colors ${
              errors.endpoint ? "border-destructive" : ""
            }`}
          />
          {errors.endpoint && (
            <p className="text-xs text-red-600">{errors.endpoint}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">HTTP Method</Label>
          <Select
            value={formData.method}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                method: value as "POST" | "PUT" | "PATCH",
              })
            }
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Audio Field Name *</Label>
          <Input
            value={formData.audioFieldName}
            onChange={(e) =>
              setFormData({ ...formData, audioFieldName: e.target.value })
            }
            placeholder="file"
            className={`h-11 border-1 border-input/50 focus:border-primary/50 transition-colors ${
              errors.audioFieldName ? "border-destructive" : ""
            }`}
          />
          {errors.audioFieldName && (
            <p className="text-xs text-red-600">{errors.audioFieldName}</p>
          )}
        </div>

        {/* Authentication */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs font-medium">Auth Type *</Label>
          <Select
            value={formData.authType}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                authType: value as
                  | "bearer"
                  | "custom-header"
                  | "query"
                  | "none",
              })
            }
          >
            <SelectTrigger className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="custom-header">Custom Header</SelectItem>
              <SelectItem value="query">Query Parameter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.authType === "custom-header" && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Header Name</Label>
            <Input
              value={formData.customHeaderName}
              onChange={(e) =>
                setFormData({ ...formData, customHeaderName: e.target.value })
              }
              placeholder="x-api-key"
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <div className="mt-2 p-3 bg-muted/50 rounded-md border">
              <p className="text-xs font-medium text-foreground mb-1">
                📝 Custom Header Authentication
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Your API key will be sent as a custom header with the name you
                specify.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Example:</strong>
                </p>
                <p className="font-mono bg-background px-2 py-1 rounded border">
                  {formData.customHeaderName || "x-api-key"}: YOUR_API_KEY
                </p>
                <p className="mt-2">
                  <strong>Common header names:</strong> x-api-key,
                  x-goog-api-key, authorization, api-key
                </p>
                <p>
                  <strong>Use case:</strong> Many APIs use custom headers like
                  x-api-key, x-goog-api-key, or proprietary header names.
                </p>
              </div>
            </div>
          </div>
        )}

        {formData.authType === "query" && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Parameter Name</Label>
            <Input
              value={formData.authParam}
              onChange={(e) =>
                setFormData({ ...formData, authParam: e.target.value })
              }
              placeholder="key"
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <div className="mt-2 p-3 bg-muted/50 rounded-md border">
              <p className="text-xs font-medium text-foreground mb-1">
                📝 Query Parameter Authentication
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Instead of sending the API key in headers, it will be added as a
                URL parameter.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Example:</strong>
                </p>
                <p className="font-mono bg-background px-2 py-1 rounded border">
                  https://api.example.com/speech?
                  {formData.authParam || "key"}=YOUR_API_KEY
                </p>
                <p className="mt-2">
                  <strong>Common parameter names:</strong> key, apikey, api_key,
                  token
                </p>
                <p>
                  <strong>Use case:</strong> Some APIs (like Google's) require
                  the API key as a query parameter instead of in headers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Response Configuration */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs font-medium">Response Content Path</Label>
          <Input
            value={formData.contentPath}
            onChange={(e) =>
              setFormData({ ...formData, contentPath: e.target.value })
            }
            placeholder="text or result.transcription"
            className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            JSON path to extract transcription text (leave empty for direct text
            response)
          </p>
        </div>

        {/* Additional Fields */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs font-medium">
            Additional Request Fields
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Add extra fields to your speech-to-text request. Common examples:
            model (e.g., "whisper-1"), language (e.g., "en"), temperature (e.g.,
            "0.2"), response_format (e.g., "json")
          </p>
          <div className="flex gap-2">
            <Input
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value)}
              placeholder="Field name (e.g., model)"
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <Input
              value={newFieldValue}
              onChange={(e) => setNewFieldValue(e.target.value)}
              placeholder="Field value (e.g., whisper-1)"
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <Button onClick={addField} size="sm" className="h-8">
              Add
            </Button>
          </div>
          {Object.keys(formData.additionalFields).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.additionalFields).map(([key, value]) => (
                <div
                  key={key}
                  className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <span className="font-mono text-xs">
                    {key}: {value}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeField(key)}
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Headers */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs font-medium">Additional Headers</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Add custom headers to your requests. Common examples: Content-Type
            (e.g., "multipart/form-data"), User-Agent (e.g., "MyApp/1.0"),
            Accept (e.g., "application/json"), X-Custom-ID
          </p>
          <div className="flex gap-2">
            <Input
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              placeholder="Header name (e.g., User-Agent)"
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <Input
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              placeholder="Header value (e.g., MyApp/1.0)"
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            />
            <Button onClick={addHeader} size="sm" className="h-8">
              Add
            </Button>
          </div>
          {Object.keys(formData.additionalHeaders).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.additionalHeaders).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-secondary/10 text-secondary border border-secondary/20 rounded-full hover:bg-secondary/20 transition-colors"
                  >
                    <span className="font-mono text-xs">
                      {key}: {value}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeHeader(key)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    >
                      ×
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Streaming Support */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.supportsStreaming}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, supportsStreaming: checked })
              }
            />
            <Label className="text-xs font-medium">Supports Streaming</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-input/50">
        <Button
          variant="outline"
          onClick={resetForm}
          className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={
            !formData.name.trim() ||
            !formData.baseUrl.trim() ||
            !formData.endpoint.trim()
          }
          className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors gap-2"
        >
          <SaveIcon className="h-4 w-4" />
          {editingProvider ? "Update" : "Add"} Provider
        </Button>
      </div>
    </div>
  );
};
