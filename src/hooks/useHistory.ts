import { useState, useEffect, useCallback } from "react";
import {
  getAllConversations,
  deleteConversation,
  DOWNLOAD_SUCCESS_DISPLAY_MS,
} from "@/lib";
import { ChatConversation } from "@/types/completion";
import { useWindowResize } from "@/hooks";

export type UseHistoryType = ReturnType<typeof useHistory>;

export interface UseHistoryReturn {
  // State
  conversations: ChatConversation[];
  isOpen: boolean;
  selectedConversationId: string | null;
  viewingConversation: ChatConversation | null;
  downloadedConversations: Set<string>;
  deleteConfirm: string | null;

  // Actions
  setIsOpen: (open: boolean) => void;
  handleViewConversation: (conversation: ChatConversation) => void;
  handleDownloadConversation: (
    conversation: ChatConversation,
    e: React.MouseEvent
  ) => void;
  handleDeleteConfirm: (conversationId: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  formatDate: (timestamp: number) => string;

  // Utilities
  refreshConversations: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [viewingConversation, setViewingConversation] =
    useState<ChatConversation | null>(null);

  const [downloadedConversations, setDownloadedConversations] = useState<
    Set<string>
  >(new Set());

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { resizeWindow } = useWindowResize();

  // Function to refresh conversations
  const refreshConversations = useCallback(async () => {
    try {
      const loadedConversations = await getAllConversations();
      setConversations(loadedConversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    }
  }, []);

  // Load conversations when component mounts or popover opens
  useEffect(() => {
    if (isOpen) {
      refreshConversations();
    } else {
      // Reset viewing state when popover closes
      setViewingConversation(null);
    }
  }, [isOpen, refreshConversations]);

  useEffect(() => {
    resizeWindow(isOpen);
  }, [isOpen, resizeWindow]);

  const handleViewConversation = (conversation: ChatConversation) => {
    setViewingConversation(conversation);
  };

  const handleDownloadConversation = (
    conversation: ChatConversation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Show download success state
    setDownloadedConversations((prev) => new Set(prev).add(conversation.id));

    try {
      // Convert conversation to markdown format
      const markdown = generateConversationMarkdown(conversation);

      // Create and download the file
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFilename(conversation.title);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download conversation:", error);
      // Remove from success state if download failed
      setDownloadedConversations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conversation.id);
        return newSet;
      });
      return;
    }

    // Clear success state after display timeout
    setTimeout(() => {
      setDownloadedConversations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conversation.id);
        return newSet;
      });
    }, DOWNLOAD_SUCCESS_DISPLAY_MS);
  };

  const handleDeleteConfirm = (conversationId: string) => {
    setDeleteConfirm(conversationId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setSelectedConversationId(null);
      setViewingConversation(null);
      await deleteConversation(deleteConfirm);
      setConversations((prev) => prev.filter((c) => c.id !== deleteConfirm));

      // Emit event to notify other components about deletion
      window.dispatchEvent(
        new CustomEvent("conversationDeleted", {
          detail: deleteConfirm,
        })
      );
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Helper functions
  const generateConversationMarkdown = (
    conversation: ChatConversation
  ): string => {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Created:** ${new Date(
      conversation.createdAt
    ).toLocaleString()}\n`;
    markdown += `**Updated:** ${new Date(
      conversation.updatedAt
    ).toLocaleString()}\n`;
    markdown += `**Messages:** ${conversation.messages.length}\n\n---\n\n`;

    conversation.messages.forEach((message, index) => {
      const roleLabel = message.role.toUpperCase();
      markdown += `## ${roleLabel}: ${message.content}\n`;

      if (index < conversation.messages.length - 1) {
        markdown += "\n";
      }
    });

    return markdown;
  };

  const generateFilename = (title: string): string => {
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    return `${sanitizedTitle.substring(0, 16)}.md`;
  };

  return {
    // State
    conversations,
    isOpen,
    selectedConversationId,
    viewingConversation,
    downloadedConversations,
    deleteConfirm,

    // Actions
    setIsOpen,
    handleViewConversation,
    handleDownloadConversation,
    handleDeleteConfirm,
    confirmDelete,
    cancelDelete,
    formatDate,

    // Utilities
    refreshConversations,
  };
}
