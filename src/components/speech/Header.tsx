type Props = {
  setupRequired: boolean;
};

export const Header = ({ setupRequired }: Props) => {
  return (
    <div className="border-b border-input/50 pb-3">
      <div>
        <h2 className="font-semibold text-sm">System Audio Capture</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {setupRequired
            ? "Setup virtual audio device to capture system audio"
            : "Real-time AI assistant using system audio, until and unless sound is detected from your audio speakers no api calls will be made (expect responses in ~2-4 seconds)"}
        </p>
      </div>
    </div>
  );
};
