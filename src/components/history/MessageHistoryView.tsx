import {
  ArrowLeft,
  Check,
  Download,
  Trash2,
  MessageCircleReplyIcon,
} from "lucide-react";
import { Button, ScrollArea, Markdown } from "@/components";
import { ChatConversation } from "@/types/completion";
import { UseHistoryType } from "@/hooks/useHistory";

interface MessageHistoryViewProps extends UseHistoryType {
  viewingConversation: ChatConversation;
  onBackToConversations: () => void;
  onSelectConversation: (conversation: ChatConversation) => void;
  downloadedConversations: Set<string>;
}

export const MessageHistoryView = ({
  viewingConversation,
  onBackToConversations,
  onSelectConversation,
  handleDownloadConversation,
  handleDeleteConfirm,
  setIsOpen,
  downloadedConversations,
}: MessageHistoryViewProps) => {
  const handleUseChat = () => {
    onSelectConversation(viewingConversation);
    onBackToConversations();
    setIsOpen(false);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    handleDownloadConversation(viewingConversation, e);
  };

  const handleDeleteClick = () => {
    handleDeleteConfirm(viewingConversation.id);
  };

  return (
    <>
      <div className="border-b border-input/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={onBackToConversations}
              title="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text line-clamp-1 text-transparent">
                {viewingConversation.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {viewingConversation.messages.length} messages in this
                conversation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={"outline"}
              onClick={handleUseChat}
              className="text-xs"
              title="Use this conversation"
            >
              <MessageCircleReplyIcon className="h-3 w-3" />
              Use Chat
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadClick}
              className="text-xs"
              title="Download conversation"
              disabled={downloadedConversations.has(viewingConversation.id)}
            >
              {downloadedConversations.has(viewingConversation.id) ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  Downloaded
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  Download
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteClick}
              className="text-xs"
              title="Delete conversation"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="p-4 space-y-4">
          {viewingConversation.messages
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary/10 border-l-4 border-primary"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {message.role === "user" ? "You" : "AI"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <Markdown>{message.content}</Markdown>
              </div>
            ))}
        </div>
      </ScrollArea>
    </>
  );
};
