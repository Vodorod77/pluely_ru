import { History } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { useHistory } from "@/hooks";
import {
  ConversationListView,
  MessageHistoryView,
  DeleteConfirmationDialog,
} from "./";
import { ChatConversation } from "@/types/completion";

interface ChatHistoryProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
}

export const ChatHistory = ({
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ChatHistoryProps) => {
  const historyHook = useHistory();

  const handleBackToConversations = () => {
    historyHook.handleViewConversation(null as any);
  };

  return (
    <>
      <Popover open={historyHook.isOpen} onOpenChange={historyHook.setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            aria-label="View All Chat History"
            className="cursor-pointer"
            title="View All Chat History"
          >
            <History className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="bottom"
          className="select-none w-screen p-0 border overflow-hidden border-input/50"
          sideOffset={8}
        >
          {historyHook.viewingConversation ? (
            <MessageHistoryView
              {...historyHook}
              viewingConversation={historyHook.viewingConversation}
              onBackToConversations={handleBackToConversations}
              onSelectConversation={onSelectConversation}
              downloadedConversations={historyHook.downloadedConversations}
            />
          ) : (
            <ConversationListView
              {...historyHook}
              currentConversationId={currentConversationId}
              onNewConversation={onNewConversation}
              onClosePopover={() => historyHook.setIsOpen(false)}
              onSelectConversation={onSelectConversation}
            />
          )}

          <DeleteConfirmationDialog {...historyHook} />
        </PopoverContent>
      </Popover>
    </>
  );
};
