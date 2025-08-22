import { useState } from "react";
import { TrashIcon } from "lucide-react";
import { Button, Label } from "@/components";
import { deleteAllConversations } from "@/lib";

interface DeleteChatsProps {
  onDelete?: () => void;
}

export const DeleteChats = ({ onDelete }: DeleteChatsProps = {}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteAllChats = async () => {
    if (isDeleting) return;

    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    setShowConfirmDialog(false);
    setIsDeleting(true);
    setDeleteSuccess(false);

    try {
      const success = deleteAllConversations();

      if (success) {
        setDeleteSuccess(true);

        // Call optional callback
        if (onDelete) {
          onDelete();
        }

        // Reset success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess(false);
        }, 3000);
      } else {
        alert("Failed to delete chat history. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting chat history:", error);
      alert("An error occurred while deleting chat history.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="space-y-3 pt-6">
      <div className="border-b border-input/50 pb-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <TrashIcon className="h-4 w-4" />
          Chat History
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permanently delete all your chat conversations and history. This
          action cannot be undone and will remove all stored conversations from
          your local storage.
        </p>
      </div>

      <div className="space-y-2">
        {deleteSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700 font-medium">
              ✅ All chat history has been successfully deleted.
            </p>
          </div>
        )}

        <Button
          onClick={handleDeleteAllChats}
          disabled={isDeleting}
          variant="destructive"
          className="w-full h-11"
          title="Delete all chat history"
        >
          {isDeleting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Deleting...
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete All Chats
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Delete All Chat History
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete all chat history? This action
              cannot be undone and will permanently remove all stored
              conversations.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
