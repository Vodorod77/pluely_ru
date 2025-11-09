import { Badge, Card, Empty, Button, Markdown, Textarea } from "@/components";
import { getConversationById } from "@/lib";
import { ChatConversation } from "@/types";
import {
  Download,
  MessageCircleIcon,
  MessageCircleReplyIcon,
  Trash2,
  SparklesIcon,
  UserIcon,
  SendIcon,
  PaperclipIcon,
  MicIcon,
  Check,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/layouts";
import { DeleteConfirmationDialog } from "./DeleteConfirmation";
import { useHistory } from "@/hooks";

const View = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    handleDeleteConfirm,
    confirmDelete,
    cancelDelete,
    deleteConfirm,
    handleAttachToOverlay,
    handleDownload,
    isDownloaded,
    isAttached,
  } = useHistory();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const getMessages = async () => {
      const conversation = await getConversationById(conversationId as string);
      setMessages(conversation || null);
    };
    getMessages();
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages load
    if (messages?.messages.length) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages]);

  const handleDelete = async () => {
    await confirmDelete();
    navigate(-1);
  };

  return (
    <PageLayout
      allowBackButton={true}
      title={messages?.title || ""}
      description={`${messages?.messages.length} messages in this conversation`}
      rightSlot={
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            title="Open this conversation in overlay"
            onClick={() =>
              conversationId && handleAttachToOverlay(conversationId)
            }
            disabled={isAttached}
          >
            {isAttached ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                Attached
              </>
            ) : (
              <>
                Open in Overlay <MessageCircleReplyIcon className="h-3 w-3" />
              </>
            )}
          </Button>
          <Button
            variant={"outline"}
            title="Download conversation as markdown"
            onClick={(e) => handleDownload(messages, e)}
            disabled={isDownloaded}
          >
            {isDownloaded ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                Downloaded
              </>
            ) : (
              <>
                Download <Download className="h-3 w-3" />
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            title="Delete conversation"
            onClick={() =>
              conversationId && handleDeleteConfirm(conversationId)
            }
          >
            Delete <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      }
    >
      {messages?.messages.length === 0 ? (
        <Empty
          isLoading={false}
          icon={MessageCircleIcon}
          title="No messages found"
          description="Start a new message to get started"
        />
      ) : (
        <div className="flex flex-col gap-4 pb-24 px-2">
          {messages?.messages.map((message, index, array) => {
            const isUser = message.role === "user";
            const showDate =
              index === 0 ||
              moment(message.timestamp).format("YYYY-MM-DD") !==
                moment(array[index - 1]?.timestamp).format("YYYY-MM-DD");

            return (
              <div key={message.id}>
                {/* Date separator */}
                {showDate && (
                  <Badge
                    variant={"outline"}
                    className="flex items-center justify-center my-4 w-fit mx-auto"
                  >
                    {moment(message.timestamp).format("ddd, MMM D")}
                  </Badge>
                )}

                {/* Message */}
                <div
                  className={`flex gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar - Left side for bot */}
                  {!isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <SparklesIcon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  <div
                    className={`flex flex-col gap-1 max-w-[70%] ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <Card
                      className={`px-4 py-0 transition-all select-none shadow-none ${
                        isUser
                          ? "!bg-primary text-primary-foreground !border-primary rounded-tr-sm"
                          : "!bg-muted/50 dark:!bg-muted/30 rounded-tl-sm"
                      }`}
                    >
                      <Markdown>{message.content}</Markdown>
                    </Card>
                    <Badge
                      variant="outline"
                      className={`text-xs bg-transparent border-none ${
                        isUser ? "-mr-1" : "-ml-1"
                      }`}
                    >
                      {moment(message.timestamp).format("hh:mm A")}
                    </Badge>
                  </div>

                  {/* Avatar - Right side for user */}
                  {isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Sticky Footer Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/10 backdrop-blur">
        <div className="flex items-center gap-2 p-4 justify-center">
          {/* Input field */}
          <div className="flex-1 relative">
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                title="Attach image"
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                title="Voice input"
              >
                <MicIcon className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Type a message..."
              className="pr-10 resize-none pb-12"
              rows={2}
            />
            {/* Send button */}
            <Button
              size="icon"
              className="h-9 w-9 absolute right-2 bottom-2 justify-center items-center"
              title="Send message"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        deleteConfirm={deleteConfirm}
        cancelDelete={cancelDelete}
        confirmDelete={handleDelete}
      />
    </PageLayout>
  );
};

export default View;
