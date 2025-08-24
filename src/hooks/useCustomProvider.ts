import { useState } from "react";
import { TYPE_AI_PROVIDER } from "@/types";
import {
  addCustomAiProvider,
  updateCustomAiProvider,
  removeCustomAiProvider,
  getCustomAiProviders,
} from "@/lib";
import { AI_PROVIDERS } from "@/config";
import { useApp } from "@/contexts";

export function useCustomAiProviders() {
  const { loadData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<TYPE_AI_PROVIDER>({
    name: "",
    baseUrl: "",
    chatEndpoint: "",
    authType: "bearer",
    authParam: "",
    defaultModel: "",
    streaming: false,
    response: {
      contentPath: "",
      usagePath: "",
    },
    input: {
      text: {
        messages: [],
      },
      image: {
        type: "",
        messages: [],
      },
    },
    id: "",
    isCustom: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAutoFill = (providerId: string) => {
    const provider = AI_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    setFormData({
      ...formData,
      name: provider.name,
      baseUrl: provider.baseUrl,
      chatEndpoint: provider.chatEndpoint,
      authType: provider.authType,
      defaultModel: provider.defaultModel,
      streaming: provider.streaming || false,
      response: {
        contentPath: provider.response.contentPath,
        usagePath: provider.response.usagePath,
      },
      input: {
        text: {
          messages: (provider.input.text.messages || []) as any[],
        },
        image: provider.input.image
          ? {
              type: provider.input.image.type,
              messages: (provider.input.image.messages || []) as any[],
            }
          : null,
      },
      authParam: (provider as any).authParam || "",
      compat: (provider as any).compat || "openai",
      isCustom: true,
    });
    setErrors({});
  };

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

    if (!data.chatEndpoint.trim()) {
      newErrors.chatEndpoint = "Chat endpoint is required";
    }

    if (!data.defaultModel.trim()) {
      newErrors.defaultModel = "Default model is required";
    }

    // Response validation
    if (!data.response.contentPath.trim()) {
      newErrors["response.contentPath"] = "Content path is required";
    }

    if (!data.response.usagePath.trim()) {
      newErrors["response.usagePath"] = "Usage path is required";
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

  const handleEdit = (providerId: string) => {
    // Clear any existing errors
    setErrors({});

    // Set editing state first
    setEditingProvider(providerId);

    // Find the provider from custom providers
    const customProviders = getCustomAiProviders();
    const provider = customProviders.find((p) => p.id === providerId);

    if (!provider) {
      setErrors({ general: "Provider not found" });
      return;
    }

    // Populate form with provider data
    setFormData({
      ...provider,
      authParam: provider.authParam || "",
    });

    // Show the form
    setShowForm(true);
  };

  const handleDelete = (providerId: string) => {
    setDeleteConfirm(providerId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const result = removeCustomAiProvider(deleteConfirm);
      if (result) {
        loadData();
        setDeleteConfirm(null);
        // If we're editing the deleted provider, reset form
        if (editingProvider === deleteConfirm) {
          setShowForm(false);
          setEditingProvider(null);
          setFormData({
            name: "",
            baseUrl: "",
            chatEndpoint: "",
            authType: "bearer",
            authParam: "",
            defaultModel: "",
            streaming: false,
            response: {
              contentPath: "",
              usagePath: "",
            },
            input: {
              text: {
                messages: [],
              },
              image: {
                type: "",
                messages: [],
              },
            },
            id: "",
            isCustom: true,
          });
        }
      } else {
        setErrors({ general: "Failed to delete provider" });
      }
    } catch (error) {
      console.error("Error deleting custom provider:", error);
      setErrors({ general: "An unexpected error occurred while deleting" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    try {
      // Clear previous errors
      setErrors({});

      // Validate form data
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Prepare provider data
      const providerData = {
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        chatEndpoint: formData.chatEndpoint.trim(),
        authType: formData.authType,
        authParam: formData.authParam,
        defaultModel: formData.defaultModel.trim(),
        streaming: formData.streaming,
        response: {
          contentPath: formData.response.contentPath.trim(),
          usagePath: formData.response.usagePath.trim(),
        },
        input: {
          text: {
            messages: formData.input.text.messages,
          },
          image: formData.input.image,
        },
        models: null, // Custom providers don't need models
      };

      let result;
      if (editingProvider) {
        // Update existing provider
        result = updateCustomAiProvider(editingProvider, providerData);
      } else {
        // Add new provider
        result = addCustomAiProvider(providerData);
      }

      if (result) {
        loadData();
        // Success - close form and reset
        setShowForm(false);
        setEditingProvider(null);

        // Reset form data
        setFormData({
          name: "",
          baseUrl: "",
          chatEndpoint: "",
          authType: "bearer",
          authParam: "",
          defaultModel: "",
          streaming: false,
          response: {
            contentPath: "",
            usagePath: "",
          },
          input: {
            text: {
              messages: [],
            },
            image: {
              type: "",
              messages: [],
            },
          },
          id: "",
          isCustom: true,
        });
      } else {
        // Failed to save provider
        const action = editingProvider ? "update" : "save";
        setErrors({ general: `Failed to ${action} provider` });
      }
    } catch (error) {
      console.error("Error saving custom provider:", error);
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
