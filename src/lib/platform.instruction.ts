export const getPlatformInstructions = (platform: string) => {
  switch (platform) {
    case "macos":
      return {
        title: "macOS Setup Required",
        steps: [
          "Install BlackHole (free virtual audio device)",
          "Visit: https://existential.audio/blackhole/",
          "Download and install 'BlackHole 2ch'",
          "Configure Multi-Output Device in Audio MIDI Setup",
          "Restart Pluely after installation",
        ],
        note: "BlackHole is required to capture system audio on macOS",
      };
    case "windows":
      return {
        title: "Windows Setup Required",
        steps: [
          "Enable Stereo Mix in Windows",
          "Right-click speaker icon → Sounds → Recording",
          "Right-click empty space → Show Disabled Devices",
          "Right-click 'Stereo Mix' → Enable",
          "Set as Default Device",
        ],
        note: "If Stereo Mix unavailable, install VB-Audio Virtual Cable",
      };
    case "linux":
      return {
        title: "Linux Setup Required",
        steps: [
          "Set up PulseAudio monitor device",
          "Run: pactl list sources | grep monitor",
          "If none found: sudo apt install pulseaudio-utils",
          "Create loopback: pactl load-module module-loopback",
          "Restart Pluely",
        ],
        note: "Monitor devices capture system audio output",
      };
    default:
      return {
        title: "Setup Required",
        steps: [
          "Install a virtual audio device for your platform",
          "Check the documentation for platform-specific instructions",
        ],
        note: "Virtual audio devices are required for system audio capture",
      };
  }
};
