import {
  MessageSquare,
  Download,
  Trash2,
  Check,
  Loader2,
  Calendar,
  MessageCircleReplyIcon,
} from "lucide-react";
import { Button } from "@/components";
import { ChatConversation } from "@/types/completion";
import { UseHistoryType } from "@/hooks/useHistory";

interface ConversationItemProps extends UseHistoryType {
  conversation: ChatConversation;
  currentConversationId: string | null;
  onSelectConversation: (conversation: ChatConversation) => void;
}

export const ConversationItem = ({
  conversation,
  currentConversationId,
  selectedConversationId,
  downloadedConversations,
  handleViewConversation,
  onSelectConversation,
  handleDownloadConversation,
  handleDeleteConfirm,
  formatDate,
  setIsOpen,
}: ConversationItemProps) => {
  const handleViewClick = () => {
    handleViewConversation(conversation);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectConversation(conversation);
    setIsOpen(false);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    handleDownloadConversation(conversation, e);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDeleteConfirm(conversation.id);
  };

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
        conversation.id === currentConversationId
          ? "bg-muted border-primary/20"
          : "border-transparent hover:border-input/50"
      }`}
      onClick={handleViewClick}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />

      <div className="flex w-full flex-row items-start gap-2">
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-sm font-medium truncate leading-5 line-clamp-1">
            {conversation?.title?.length > 70
              ? conversation?.title?.slice(0, 70) + "..."
              : conversation?.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDate(conversation.updatedAt)}
            </span>
            <span className="text-xs text-muted-foreground">
              • {conversation.messages.length} messages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedConversationId === conversation.id && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleSelectClick}
            title="Reuse this conversation"
          >
            <MessageCircleReplyIcon className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant={
              downloadedConversations.has(conversation.id) ? "outline" : "ghost"
            }
            className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleDownloadClick}
            title="Download conversation as markdown"
            disabled={downloadedConversations.has(conversation.id)}
          >
            {downloadedConversations.has(conversation.id) ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleDeleteClick}
            title="Delete conversation"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
