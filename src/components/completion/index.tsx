import { MicIcon, Loader2, XIcon, CopyIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Input,
} from "@/components";
import { useCompletion } from "@/hooks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Speech } from "./Speech";
import { MessageHistory } from "../history";
import { Screenshot } from "./Screenshot";
import { Files } from "./Files";

export const Completion = () => {
  const {
    input,
    setInput,
    response,
    isLoading,
    error,
    attachedFiles,
    removeFile,
    submit,
    cancel,
    reset,
    isOpenAIKeyAvailable,
    enableVAD,
    setEnableVAD,
    setState,
    micOpen,
    setMicOpen,
    currentConversationId,
    conversationHistory,
    startNewConversation,
    messageHistoryOpen,
    setMessageHistoryOpen,
    isPopoverOpen,
    scrollAreaRef,
    screenshotConfig,
    handleScreenshotSubmit,
    handleFileSelect,
    handleKeyPress,
    isFilesPopoverOpen,
    setIsFilesPopoverOpen,
  } = useCompletion();

  return (
    <>
      <Popover open={micOpen} onOpenChange={setMicOpen}>
        <PopoverTrigger asChild>
          {isOpenAIKeyAvailable() && enableVAD ? (
            <Speech
              submit={submit}
              setState={setState}
              setEnableVAD={setEnableVAD}
            />
          ) : (
            <Button
              size="icon"
              onClick={() => {
                setEnableVAD(!enableVAD);
              }}
              className="cursor-pointer"
              title="Toggle voice input"
            >
              <MicIcon className="h-4 w-4" />
            </Button>
          )}
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="center"
          className={`w-80 p-3 ${isOpenAIKeyAvailable() ? "hidden" : ""}`}
          sideOffset={8}
        >
          <div className="text-sm">
            <div className="font-semibold text-orange-600 mb-1">
              OpenAI Key Required
            </div>
            <p className="text-muted-foreground">
              Speech-to-text requires an OpenAI API key for Whisper. Please
              configure it in settings to enable voice input.
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative flex-1">
        <Popover
          open={isPopoverOpen}
          onOpenChange={(open) => {
            if (!open && !isLoading) {
              reset();
            }
          }}
        >
          <PopoverTrigger asChild className="!border-none">
            <div className="relative select-none">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className={`${
                  currentConversationId && conversationHistory.length > 0
                    ? "pr-14"
                    : "pr-12"
                }`}
              />

              {/* Conversation thread indicator */}
              {currentConversationId &&
                conversationHistory.length > 0 &&
                !isLoading && (
                  <div className="absolute select-none right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <MessageHistory
                      conversationHistory={conversationHistory}
                      currentConversationId={currentConversationId}
                      onStartNewConversation={startNewConversation}
                      messageHistoryOpen={messageHistoryOpen}
                      setMessageHistoryOpen={setMessageHistoryOpen}
                    />
                  </div>
                )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </PopoverTrigger>

          {/* Response Panel */}
          <PopoverContent
            align="center"
            side="bottom"
            className="w-screen p-0 border shadow-lg overflow-hidden"
            sideOffset={8}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
              <h3 className="font-semibold text-sm select-none">AI Response</h3>
              <div className="flex items-center gap-2 select-none">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(response);
                  }}
                  disabled={isLoading}
                  className="cursor-pointer"
                  title="Copy response to clipboard"
                >
                  <CopyIcon />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (isLoading) {
                      cancel();
                    } else {
                      reset();
                    }
                  }}
                  className="cursor-pointer"
                  title={isLoading ? "Cancel loading" : "Clear conversation"}
                >
                  <XIcon />
                </Button>
              </div>
            </div>

            <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-7rem)]">
              <div className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {response && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ node, ...props }) => (
                        <pre
                          {...props}
                          className="whitespace-pre-wrap break-words"
                        />
                      ),
                      code: ({ node, ...props }) => (
                        <code
                          {...props}
                          className="whitespace-pre-wrap break-words"
                        />
                      ),
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 mt-4 text-muted-foreground animate-pulse select-none">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating response...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {screenshotConfig.enabled && (
        <Screenshot
          screenshotConfig={screenshotConfig}
          onScreenshotSubmit={handleScreenshotSubmit}
          attachedFiles={attachedFiles}
        />
      )}

      <Files
        attachedFiles={attachedFiles}
        onFileSelect={handleFileSelect}
        onRemoveFile={removeFile}
        onRemoveAllFiles={() => {
          setState((prev) => ({ ...prev, attachedFiles: [] }));
          setIsFilesPopoverOpen(false);
        }}
        isLoading={isLoading}
        isFilesPopoverOpen={isFilesPopoverOpen}
        setIsFilesPopoverOpen={setIsFilesPopoverOpen}
      />
    </>
  );
};
