import {
  Card,
  Settings,
  SystemAudio,
  Updater,
  DragButton,
  CustomCursor,
  Completion,
  ChatHistory,
  AudioVisualizer,
  StatusIndicator,
} from "@/components";
import { useApp } from "@/hooks";

const App = () => {
  const {
    isHidden,
    systemAudio,
    handleSelectConversation,
    handleNewConversation,
  } = useApp();
  return (
    <div
      className={`w-screen h-screen flex overflow-hidden justify-center items-start ${
        isHidden ? "hidden pointer-events-none" : ""
      }`}
    >
      <Card className="w-full flex flex-row items-center gap-2 p-2">
        <SystemAudio {...systemAudio} />
        {systemAudio?.capturing ? (
          <div className="flex flex-row items-center gap-2 justify-between w-full">
            <div className="flex flex-1 items-center gap-2">
              <AudioVisualizer
                stream={systemAudio?.stream}
                isRecording={systemAudio?.capturing}
              />
            </div>
            <div className="flex !w-fit items-center gap-2">
              <StatusIndicator
                setupRequired={systemAudio.setupRequired}
                error={systemAudio.error}
                isProcessing={systemAudio.isProcessing}
                isAIProcessing={systemAudio.isAIProcessing}
                capturing={systemAudio.capturing}
              />
            </div>
          </div>
        ) : null}

        <div
          className={`${
            systemAudio?.capturing
              ? "hidden w-full fade-out transition-all duration-300"
              : "w-full flex flex-row gap-2 items-center"
          }`}
        >
          <Completion isHidden={isHidden} />
          <ChatHistory
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            currentConversationId={null}
          />
          <Settings />
        </div>

        <Updater />
        <DragButton />
      </Card>
      <CustomCursor />
    </div>
  );
};

export default App;
