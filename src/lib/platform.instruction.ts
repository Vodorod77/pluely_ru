export interface PlatformInstructions {
  title: string;
  steps: string[];
  note: string;
  quickActions: {
    setupGuideUrl: string;
    troubleshootingTips: string[];
    recommendedMethod: string;
    alternativeMethods?: string[];
  };
  whyNeeded: string;
}

export const getPlatformInstructions = (
  platform: string
): PlatformInstructions => {
  switch (platform) {
    case "macos":
      return {
        title: "macOS Setup Required",
        steps: [
          "Install BlackHole (free virtual audio device)",
          "Option 1: Install via Homebrew: brew install blackhole-2ch",
          "Option 2: Download from https://existential.audio/blackhole/",
          "Create Multi-Output Device in Audio MIDI Setup",
          "Include both BlackHole and your speakers",
          "Grant Microphone & Screen Recording permissions to Pluely",
          "Restart Pluely after installation",
        ],
        note: "BlackHole creates a secure bridge for system audio capture. macOS blocks direct system audio access for security reasons.",
        quickActions: {
          setupGuideUrl:
            "https://github.com/iamsrikanthnani/pluely/blob/master/SYSTEM_AUDIO_SETUP.md#-macos-setup",
          troubleshootingTips: [
            "Ensure BlackHole appears in System Preferences → Sound → Output",
            "Check that Multi-Output Device includes both BlackHole and your speakers",
            "Grant both Microphone and Screen Recording permissions to Pluely",
            "Restart Pluely after any audio device changes",
          ],
          recommendedMethod: "BlackHole + Multi-Output Device (Free)",
          alternativeMethods: [
            "Loopback by Rogue Amoeba ($109, easier setup)",
            "SoundFlower (legacy, not recommended)",
          ],
        },
        whyNeeded:
          "macOS doesn't allow direct system audio capture for security. Virtual audio devices create a secure bridge to route audio to Pluely. This is the same requirement for OBS, Discord screen sharing, and other professional apps.",
      };
    case "windows":
      return {
        title: "Windows Setup Required",
        steps: [
          "Option 1: Enable Stereo Mix (Built-in, Free)",
          "Right-click speaker icon → Sounds → Recording",
          "Right-click empty space → Show Disabled Devices",
          "Right-click 'Stereo Mix' → Enable → Set as Default",
          "Option 2: Install VB-Audio Virtual Cable (Free)",
          "Download from https://vb-audio.com/Cable/",
          "Run as Administrator, restart computer",
        ],
        note: "Windows separates system audio from microphone input for security. These tools create a virtual audio bridge for Pluely.",
        quickActions: {
          setupGuideUrl:
            "https://github.com/iamsrikanthnani/pluely/blob/master/SYSTEM_AUDIO_SETUP.md#-windows-setup",
          troubleshootingTips: [
            "If Stereo Mix isn't visible, update your audio drivers",
            "Try showing all disabled and disconnected devices",
            "For VB-Cable, always run installer as Administrator",
            "Restart computer after installing virtual audio drivers",
          ],
          recommendedMethod:
            "Stereo Mix (if available) or VB-Audio Virtual Cable",
          alternativeMethods: [
            "VoiceMeeter (advanced audio mixing)",
            "Virtual Audio Cable by Eugene Muzychenko",
          ],
        },
        whyNeeded:
          "Windows separates system audio from microphone input for security. These tools create a virtual audio path for Pluely to access system audio. This is standard for all screen recording and streaming applications.",
      };
    case "linux":
      return {
        title: "Linux Setup Required",
        steps: [
          "Option 1: Use PulseAudio monitor devices",
          "Install: sudo apt install pulseaudio-utils",
          "List sources: pactl list sources short",
          "Look for devices ending with '.monitor'",
          "Option 2: Create loopback module",
          "Run: pactl load-module module-loopback latency_msec=1",
          "Or install pavucontrol for GUI: sudo apt install pavucontrol",
        ],
        note: "Linux requires explicit audio routing setup. Monitor devices capture what your speakers are playing for security reasons.",
        quickActions: {
          setupGuideUrl:
            "https://github.com/iamsrikanthnani/pluely/blob/master/SYSTEM_AUDIO_SETUP.md#-linux-setup",
          troubleshootingTips: [
            "Check if PulseAudio is running: systemctl --user status pulseaudio",
            "Look for '.monitor' devices in pactl list sources short",
            "Ensure your user is in the audio group: groups $USER",
            "Try creating a loopback module if no monitors found",
          ],
          recommendedMethod: "PulseAudio Monitor Devices (built-in)",
          alternativeMethods: [
            "Manual loopback module creation",
            "ALSA loopback for non-PulseAudio systems",
          ],
        },
        whyNeeded:
          "Linux requires explicit audio routing setup to capture system audio. Monitor devices capture what your speakers are playing. This is more transparent than Windows/macOS but still requires configuration.",
      };
    default:
      return {
        title: "Setup Required",
        steps: [
          "Install a virtual audio device for your platform",
          "Check the documentation for platform-specific instructions",
        ],
        note: "Virtual audio devices are required for system audio capture",
        quickActions: {
          setupGuideUrl:
            "https://github.com/iamsrikanthnani/pluely/blob/master/SYSTEM_AUDIO_SETUP.md",
          troubleshootingTips: [
            "Check platform-specific documentation",
            "Look for virtual audio device solutions for your OS",
          ],
          recommendedMethod: "Platform-specific virtual audio device",
        },
        whyNeeded:
          "Your platform requires a virtual audio device for system audio capture to maintain security and privacy.",
      };
  }
};
