import { useState } from "react";
import { TYPE_STT_PROVIDER } from "@/types";
import {
  addCustomSttProvider,
  updateCustomSttProvider,
  removeCustomSttProvider,
  getCustomSttProviders,
} from "@/lib";
import { SPEECH_TO_TEXT_PROVIDERS } from "@/config";
import { useApp } from "@/contexts";

export function useCustomSttProviders() {
  const { loadData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<TYPE_STT_PROVIDER>({
    id: "",
    name: "",
    baseUrl: "",
    endpoint: "",
    method: "POST",
    authType: "bearer",
    authParam: "",
    request: {
      bodyType: "formdata",
      audioFormat: "wav",
      audioKey: "file",
      fields: {},
      query: {},
      headers: {},
    },
    response: {
      contentPath: "",
    },
    streaming: false,
    isCustom: true,
  });

  const validateForm = (data: typeof formData) => {
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!data.name.trim()) {
      newErrors.name = "Provider name is required";
    }

    if (!data.baseUrl.trim()) {
      newErrors.baseUrl = "Base URL is required";
    } else if (
      !data.baseUrl.startsWith("http://") &&
      !data.baseUrl.startsWith("https://")
    ) {
      newErrors.baseUrl = "Base URL must start with http:// or https://";
    }

    if (!data.endpoint.trim()) {
      newErrors.endpoint = "Endpoint is required";
    }

    if (!data.response.contentPath.trim()) {
      newErrors["response.contentPath"] = "Content path is required";
    }

    // Auth validation
    if (
      data.authType === "custom" &&
      (!data.authParam || !data.authParam.trim())
    ) {
      newErrors.authParam = "Custom header parameter is required";
    }

    if (
      data.authType === "query" &&
      (!data.authParam || !data.authParam.trim())
    ) {
      newErrors.authParam = "Query parameter is required";
    }

    return newErrors;
  };

  const handleAutoFill = (providerId: string) => {
    const provider = SPEECH_TO_TEXT_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    setFormData({
      ...formData,
      name: provider.name,
      baseUrl: provider.baseUrl,
      endpoint: provider.endpoint,
      method: provider.method,
      authType: provider.authType,
      request: {
        bodyType: provider.request.bodyType,
        audioFormat: provider.request.audioFormat,
        audioKey: provider.request.audioKey,
        fields: (provider.request.fields || {}) as Record<string, any>,
        query: (provider.request.query || {}) as Record<string, any>,
        headers: (provider.request.headers || {}) as Record<string, any>,
      },
      response: {
        contentPath: provider.response.contentPath,
      },
      streaming: provider.streaming,
      isCustom: true,
    });
    setErrors({});
  };

  const handleEdit = (providerId: string) => {
    const provider = getCustomSttProviders().find((p) => p.id === providerId);
    if (!provider) return;

    setEditingProvider(providerId);
    setFormData({
      ...provider,
      authParam: provider.authParam || "",
    });
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (providerId: string) => {
    setDeleteConfirm(providerId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const result = removeCustomSttProvider(deleteConfirm);
      if (result) {
        loadData();
        setDeleteConfirm(null);
        if (editingProvider === deleteConfirm) {
          setShowForm(false);
          setEditingProvider(null);
          setFormData({
            name: "",
            baseUrl: "",
            endpoint: "",
            method: "POST",
            authType: "bearer",
            authParam: "",
            request: {
              bodyType: "formdata",
              audioFormat: "wav",
              audioKey: "file",
              fields: {},
              query: {},
              headers: {},
            },
            response: {
              contentPath: "",
            },
            streaming: false,
            id: "",
            isCustom: true,
          });
        }
      } else {
        setErrors({ general: "Failed to delete provider" });
      }
    } catch (error) {
      console.error("Error deleting custom STT provider:", error);
      setErrors({ general: "An unexpected error occurred while deleting" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    try {
      setErrors({});

      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const providerData = {
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        endpoint: formData.endpoint.trim(),
        method: formData.method,
        authType: formData.authType,
        authParam: formData.authParam,
        request: {
          bodyType: formData.request.bodyType,
          audioFormat: formData.request.audioFormat,
          audioKey: formData.request.audioKey,
          fields: formData.request.fields,
          query: formData.request.query,
          headers: formData.request.headers,
        },
        response: {
          contentPath: formData.response.contentPath.trim(),
        },
        streaming: formData.streaming,
      };

      let result;
      if (editingProvider) {
        result = updateCustomSttProvider(editingProvider, providerData);
      } else {
        result = addCustomSttProvider(providerData);
      }

      if (result) {
        loadData();
        setShowForm(false);
        setEditingProvider(null);
        setFormData({
          name: "",
          baseUrl: "",
          endpoint: "",
          method: "POST",
          authType: "bearer",
          authParam: "",
          request: {
            bodyType: "formdata",
            audioFormat: "wav",
            audioKey: "file",
            fields: {},
            query: {},
            headers: {},
          },
          response: {
            contentPath: "",
          },
          streaming: false,
          id: "",
          isCustom: true,
        });
      } else {
        const action = editingProvider ? "update" : "save";
        setErrors({ general: `Failed to ${action} provider` });
      }
    } catch (error) {
      console.error("Error saving custom STT provider:", error);
      setErrors({ general: "An unexpected error occurred" });
    }
  };

  return {
    errors,
    setErrors,
    showForm,
    setShowForm,
    editingProvider,
    setEditingProvider,
    deleteConfirm,
    formData,
    setFormData,
    handleSave,
    handleAutoFill,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
  };
}
