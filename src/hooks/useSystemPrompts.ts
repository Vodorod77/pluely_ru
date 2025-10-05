import { useCallback, useEffect, useState } from "react";
import {
  createSystemPrompt,
  getAllSystemPrompts,
  updateSystemPrompt,
  deleteSystemPrompt,
} from "@/lib/database";
import type {
  SystemPrompt,
  SystemPromptInput,
  UpdateSystemPromptInput,
} from "@/types";

export interface UseSystemPromptsReturn {
  prompts: SystemPrompt[];
  isLoading: boolean;
  error: string | null;
  createPrompt: (input: SystemPromptInput) => Promise<SystemPrompt>;
  updatePrompt: (
    id: number,
    input: UpdateSystemPromptInput
  ) => Promise<SystemPrompt>;
  deletePrompt: (id: number) => Promise<void>;
  refreshPrompts: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing system prompts with full CRUD operations
 */
export const useSystemPrompts = (): UseSystemPromptsReturn => {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all system prompts from database
   */
  const fetchPrompts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getAllSystemPrompts();
      setPrompts(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch system prompts";
      setError(errorMessage);
      console.error("Error fetching system prompts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new system prompt
   */
  const createPrompt = useCallback(
    async (input: SystemPromptInput): Promise<SystemPrompt> => {
      try {
        setError(null);
        const result = await createSystemPrompt(input);
        await fetchPrompts(); // Refresh list
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create system prompt";
        setError(errorMessage);
        console.error("Error creating system prompt:", err);
        throw err;
      }
    },
    [fetchPrompts]
  );

  /**
   * Update an existing system prompt
   */
  const updatePrompt = useCallback(
    async (
      id: number,
      input: UpdateSystemPromptInput
    ): Promise<SystemPrompt> => {
      try {
        setError(null);
        const result = await updateSystemPrompt(id, input);
        await fetchPrompts(); // Refresh list
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update system prompt";
        setError(errorMessage);
        console.error("Error updating system prompt:", err);
        throw err;
      }
    },
    [fetchPrompts]
  );

  /**
   * Delete a system prompt
   */
  const deletePrompt = useCallback(
    async (id: number): Promise<void> => {
      try {
        setError(null);
        await deleteSystemPrompt(id);
        await fetchPrompts(); // Refresh list
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete system prompt";
        setError(errorMessage);
        console.error("Error deleting system prompt:", err);
        throw err;
      }
    },
    [fetchPrompts]
  );

  /**
   * Refresh prompts list
   */
  const refreshPrompts = useCallback(async () => {
    await fetchPrompts();
  }, [fetchPrompts]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch prompts on mount
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    prompts,
    isLoading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refreshPrompts,
    clearError,
  };
};
