# 🎧 System Audio Capture Setup Guide

This comprehensive guide will help you set up system audio capture for real-time transcription across different operating systems. System audio capture allows Pluely to listen to your computer's audio output (what you hear through speakers/headphones) and automatically transcribe speech.

## 🚀 Quick Start Options

Pluely offers **multiple capture methods** for different needs:

### 🎤 **Default Input Capture** (Basic - May Have Limitations)

- ✅ **No setup required** - works out of the box
- ⚠️ **May not work reliably** on all systems
- ✅ **Uses your microphone** for voice input
- ❌ **Cannot capture system audio** (videos, meetings, music)
- ❌ **Limited functionality** compared to system audio capture
- 🎯 **Best for**: Quick testing only - **we recommend using system audio capture below**

### 🔊 **System Audio Capture** (Recommended - Full Features)

- ⚠️ **Requires virtual audio device setup** (one-time setup)
- ✅ **Most reliable and stable method**
- ✅ **Captures everything your computer plays**
- ✅ **Perfect for meetings, videos, calls**
- ✅ **Full feature support and best performance**
- 🎯 **Recommended for**: All users - provides the best experience

---

## 🤔 Why Do I Need to Install Additional Software for System Audio?

**Here's the reality**: Your operating system doesn't allow applications to directly capture "system audio" (what you hear) for security and privacy reasons. This is intentional - imagine if any app could secretly record everything you listen to!

### The Technical Challenge

- **Your microphone** captures external sounds (your voice, room noise)
- **System audio** is internal (music, videos, meeting audio from speakers)
- **Operating systems separate these** to prevent unauthorized audio recording
- **There's no built-in way** for apps to access what your computer is playing

### Why Virtual Audio Devices Are Required

Think of virtual audio devices as a "bridge" that safely routes your system audio so Pluely can access it:

- 🔒 **Security**: You explicitly install and control this bridge
- 🎯 **Precision**: Only captures system audio, not microphone input
- 🛡️ **Privacy**: You decide when it's active and what it captures
- ⚡ **Performance**: Designed specifically for audio routing without quality loss

### This Isn't Just Pluely - It's Universal

**Every application** that captures system audio requires this setup:

- OBS (streaming software)
- Audacity (audio recording)
- Discord (screen sharing with audio)
- Zoom/Teams (screen sharing with computer audio)
- Any screen recording tool with system audio

**We wish there was a simpler way, but this is the only method that works reliably across all platforms while maintaining security.**

## 🎯 What Can You Capture?

### 🎤 **Default Input Capture** captures:

- Your voice through microphone
- Voice commands and dictation
- Personal audio notes

### 🔊 **System Audio Capture** captures:

- 🎥 Meeting audio (Zoom, Teams, Google Meet, Discord)
- 🎬 Video content (YouTube, Netflix, Twitch streams)
- 🎵 Music and podcasts (Spotify, Apple Music, etc.)
- 🎮 Game audio and commentary
- 📞 VoIP calls (Skype, WhatsApp, etc.)
- 📱 Any audio playing on your computer

---

## 🍎 macOS Setup

### 🎤 Method 1: Default Input (Basic - Not Recommended)

⚠️ **Note**: This method may not work reliably on all macOS systems and has limited functionality. **We strongly recommend using Method 2 (System Audio with BlackHole) below for the best experience.**

1. **Open Pluely**
2. **Click the system audio button** (headphones icon)
3. **Click "🎤 Default Input"**
4. **Grant microphone permissions** when prompted
5. **Start speaking** - transcription may work, but results can be inconsistent

### 🔊 Method 2: System Audio with BlackHole (Recommended)

#### Step 1: Install BlackHole (Free & Open Source)

1. **Download BlackHole**:

   - 🌐 **Visit**: https://existential.audio/blackhole/
   - 📥 **Download**: "BlackHole 2ch" (the free version)
   - 📦 **Install**: Run the downloaded `.pkg` file
   - 🔄 **Restart**: Your computer after installation (recommended)

2. **Verify Installation**:
   - Open **System Preferences** → **Sound** → **Output**
   - You should see **"BlackHole 2ch"** in the list
   - If not visible, restart your computer and check again

#### Step 2: Configure Audio Routing

You have **3 options** - choose based on your needs:

##### 🔇 **Option A: Simple Setup** (You won't hear audio)

- **Best for**: When you don't need to hear the audio yourself
- **Steps**:
  1. **System Preferences** → **Sound** → **Output**
  2. Select **"BlackHole 2ch"** as your output device
  3. ⚠️ **Warning**: You won't hear any audio with this setup
  4. **Test**: Open Pluely → Click "🔄 System Audio" → Play music → Should see transcription

##### 🔊 **Option B: Multi-Output Setup** (Recommended - You can hear audio)

- **Best for**: When you want to hear audio AND capture it
- **Steps**:
  1. **Applications** → **Utilities** → **Audio MIDI Setup**
  2. Click the **"+"** button (bottom left) → **"Create Multi-Output Device"**
  3. **Name it**: "Speakers + BlackHole" (or any name you prefer)
  4. **Check both boxes**:
     - ✅ Your speakers/headphones (e.g., "MacBook Pro Speakers")
     - ✅ **"BlackHole 2ch"**
  5. **Set master device**: Click the dropdown next to your speakers and select "Master Device"
  6. **Use the device**: Right-click "Speakers + BlackHole" → **"Use This Device For Sound Output"**
  7. **Test**: Play music → You should hear it AND Pluely should capture it

##### 🎛️ **Option C: Aggregate Device** (Advanced)

- **Best for**: Complex audio setups with multiple inputs/outputs
- **Steps**:
  1. **Audio MIDI Setup** → **"+"** → **"Create Aggregate Device"**
  2. **Check devices** you want to include
  3. **Configure** sample rates and bit depths
  4. **Use in audio applications** that support aggregate devices

#### Step 3: Grant Permissions

When you first use Pluely, macOS will request permissions:

1. **🎤 Microphone Access**:

   - **Purpose**: Required for audio input (including system audio routing)
   - **Grant**: Click "OK" when prompted
   - **Manual**: **System Preferences** → **Security & Privacy** → **Privacy** → **Microphone** → Check "Pluely"

2. **📺 Screen Recording Access**:
   - **Purpose**: Required for system audio capture on macOS
   - **Grant**: Click "OK" when prompted
   - **Manual**: **System Preferences** → **Security & Privacy** → **Privacy** → **Screen Recording** → Check "Pluely"

#### Step 4: Test the Setup

1. **Open Pluely**
2. **Click the system audio button** (headphones icon)
3. **Click "🔄 System Audio"** (should detect BlackHole)
4. **Play some audio** (music, video, anything)
5. **Check console output** for: `Selected virtual audio device: BlackHole 2ch`
6. **Verify audio levels**: Click "🎵 Test Audio" - should show non-zero RMS values
7. **Test transcription**: Play speech/video with talking

#### 🔧 Troubleshooting macOS

**❌ "No system audio loopback device found"**

- BlackHole not installed properly → Reinstall and restart
- BlackHole not visible → Check System Preferences → Sound → Output

**❌ "Audio Debug - RMS: 0.000000" (no audio detected)**

- Audio not routed to BlackHole → Check your output device selection
- Wrong Multi-Output configuration → Recreate Multi-Output Device
- No audio playing → Play music/video while testing

**❌ "Selected virtual audio device: BlackHole 2ch" but no transcription**

- Check STT provider settings in Pluely
- Verify internet connection for cloud STT services
- Try speaking louder or adjusting VAD sensitivity

### 🎵 Alternative: Loopback (Paid but Easier)

If you prefer a more user-friendly (but paid) solution:

1. **Purchase & Install**: [Loopback by Rogue Amoeba](https://rogueamoeba.com/loopback/) ($109)
2. **Create a Pass-Thru**: System Audio → Virtual Device
3. **Route to Pluely**: Set the virtual device as input
4. **Advantages**: GUI-based, easier setup, more features
5. **Disadvantages**: Costs money, not open source

---

## 🪟 Windows Setup

### 🎤 Method 1: Default Input (Basic - Not Recommended)

⚠️ **Note**: This method may not work reliably on all Windows systems and has limited functionality. **We strongly recommend using Method 2 (System Audio) below for the best experience.**

1. **Open Pluely**
2. **Click the system audio button** (headphones icon)
3. **Click "🎤 Default Input"**
4. **Grant microphone permissions** when prompted
5. **Start speaking** - transcription may work, but results can be inconsistent

### 🔊 Method 2: System Audio Capture

Windows offers several options for system audio capture:

#### 🔇 **Option A: Enable Stereo Mix** (Free, Built-in)

**What is Stereo Mix?** A built-in Windows feature that captures "what you hear" - exactly what we need!

1. **Enable Stereo Mix**:

   - **Right-click** the **speaker icon** in the system tray (bottom right)
   - Select **"Sounds"** → **"Recording"** tab
   - **Right-click in empty space** → **"Show Disabled Devices"**
   - **Right-click "Stereo Mix"** → **"Enable"**
   - **Right-click "Stereo Mix"** → **"Set as Default Device"**
   - **Click "OK"** to save settings

2. **Test the Setup**:

   - **Open Pluely** → Click system audio button → **"🔄 System Audio"**
   - **Play some audio** (music, video, anything)
   - **Check console**: Should see `Selected virtual audio device: Stereo Mix`
   - **Verify levels**: Click "🎵 Test Audio" - should show non-zero values

3. **If Stereo Mix is NOT available**:
   - **Update audio drivers**: Visit your sound card manufacturer's website
   - **Check Windows version**: Some Windows 10/11 versions disable it
   - **Try different audio drivers**: Realtek, etc. often include Stereo Mix
   - **Use Method B or C below** if Stereo Mix isn't available

#### 🎵 **Option B: VB-Audio Virtual Cable** (Free, Reliable)

**Best for**: When Stereo Mix isn't available or doesn't work well.

1. **Download & Install**:

   - 🌐 **Visit**: https://vb-audio.com/Cable/
   - 📥 **Download**: "VB-CABLE Virtual Audio Device"
   - 📦 **Install**: Run as Administrator, restart computer
   - ✅ **Verify**: Check "Sound" settings for "CABLE Input/Output"

2. **Configure Audio Routing**:

   - **System audio to VB-Cable**:
     - Right-click speaker icon → **Sounds** → **Playback** tab
     - Right-click **"CABLE Input"** → **"Set as Default Device"**
   - **VB-Cable to your speakers** (so you can hear):
     - **Playback** tab → Right-click **your speakers** → **"Set as Default Communication Device"**
     - Or use VB-Audio's software to route CABLE Output to your speakers

3. **Test with Pluely**:
   - **Open Pluely** → **"🔄 System Audio"**
   - Should detect **"CABLE Output"** as input device
   - **Play audio** → Should capture and transcribe

#### 🎛️ **Option C: VoiceMeeter** (Free, Advanced)

**Best for**: Advanced users who want full audio mixing control.

1. **Download & Install**:

   - 🌐 **Visit**: https://vb-audio.com/Voicemeeter/
   - 📥 **Download**: "VoiceMeeter" (basic) or "VoiceMeeter Banana" (advanced)
   - 📦 **Install**: Run as Administrator, restart computer

2. **Configure VoiceMeeter**:

   - **Launch VoiceMeeter**
   - **Hardware Out A1**: Set to your speakers/headphones
   - **Virtual Input**: Route system audio through VoiceMeeter
   - **Virtual Output**: Available to Pluely as input device

3. **System Audio Setup**:
   - **Windows Sound Settings**:
     - **Output**: Set to "VoiceMeeter Input"
     - **Input**: VoiceMeeter Output available for Pluely
   - **VoiceMeeter Interface**: Route Virtual Input to A1 (your speakers) and to Pluely

#### 🔧 **Troubleshooting Windows**

**❌ "No system audio loopback device found"**

- Try all methods above in order
- Update/reinstall audio drivers
- Check Windows audio settings
- Restart Pluely after making changes

**❌ "Stereo Mix not available"**

- Update Realtek/audio drivers
- Enable in BIOS/UEFI settings (some systems)
- Use VB-Audio Virtual Cable instead

**❌ "Audio Debug - RMS: 0.000000"**

- Check Windows volume mixer - ensure audio is playing
- Verify default recording device is set correctly
- Test with different audio sources (music, video, etc.)

**❌ VB-Cable installation issues**

- **Run as Administrator** during installation
- **Restart computer** after installation
- **Temporarily disable antivirus** during installation
- **Check Windows Defender** - may block virtual audio drivers

---

## 🐧 Linux Setup

### 🎤 Method 1: Default Input (Basic - Not Recommended)

⚠️ **Note**: This method may not work reliably on all Linux systems and has limited functionality. **We strongly recommend using Method 2 (System Audio with PulseAudio) below for the best experience.**

1. **Open Pluely**
2. **Click the system audio button** (headphones icon)
3. **Click "🎤 Default Input"**
4. **Grant microphone permissions** when prompted
5. **Start speaking** - transcription may work, but results can be inconsistent

### 🔊 Method 2: System Audio with PulseAudio (Most Common)

**Most Linux distributions** use PulseAudio, which has built-in monitor devices for system audio capture.

#### 🔍 **Step 1: Check Available Monitor Devices**

```bash
# List all audio sources (including monitors)
pactl list sources short

# Look for lines ending with ".monitor" - these capture system audio
# Example output:
# 2    alsa_output.pci-0000_00_1f.3.analog-stereo.monitor    module-alsa-card.c    s16le 2ch 44100Hz    SUSPENDED
```

#### 🔧 **Step 2: Enable Monitor Device**

If you see monitor devices, they should work automatically with Pluely:

1. **Open Pluely** → Click system audio button → **"🔄 System Audio"**
2. **Should detect** monitor device automatically
3. **Play some audio** (music, video) to test
4. **Check console**: Should see something like `Selected virtual audio device: [Monitor device name]`

#### 🛠️ **Step 3: If No Monitor Devices Found**

Create a loopback device manually:

```bash
# Create a loopback module (temporary - until reboot)
pactl load-module module-loopback latency_msec=1

# Make it permanent by adding to PulseAudio config
echo "load-module module-loopback latency_msec=1" >> ~/.config/pulse/default.pa

# Restart PulseAudio
pulseaudio -k
pulseaudio --start
```

#### 🎛️ **Advanced: Using pavucontrol (GUI)**

Install and use PulseAudio Volume Control for easier management:

```bash
# Install pavucontrol (Ubuntu/Debian)
sudo apt install pavucontrol

# Install pavucontrol (Fedora)
sudo dnf install pavucontrol

# Install pavucontrol (Arch)
sudo pacman -S pavucontrol
```

**Usage**:

1. **Launch**: `pavucontrol`
2. **Recording tab**: Shows available input sources
3. **Output devices tab**: Shows where audio is going
4. **Playback tab**: Shows active audio streams
5. **Configuration tab**: Audio device settings

### 🔊 Method 3: System Audio with ALSA (Advanced)

For systems using ALSA directly (without PulseAudio):

#### **Step 1: Create ALSA Loopback**

```bash
# Load the loopback kernel module
sudo modprobe snd-aloop

# Make it permanent
echo "snd-aloop" | sudo tee -a /etc/modules

# Check if loopback devices are created
cat /proc/asound/cards
# Should show Loopback devices
```

#### **Step 2: Configure .asoundrc**

Create or edit `~/.asoundrc`:

```bash
# Create ALSA configuration for system audio capture
cat > ~/.asoundrc << 'EOF'
pcm.mix {
    type dmix
    ipc_key 1024
    slave {
        pcm "hw:0,0"
        period_time 0
        period_size 1024
        buffer_size 4096
        rate 44100
    }
    bindings {
        0 0
        1 1
    }
}

pcm.loopin {
    type plug
    slave.pcm "hw:Loopback,0,0"
}

pcm.loopout {
    type plug
    slave.pcm "hw:Loopback,1,0"
}
EOF
```

### 🔧 **Troubleshooting Linux**

**❌ "No system audio monitor device found"**

- **Install PulseAudio**: `sudo apt install pulseaudio pulseaudio-utils`
- **Restart PulseAudio**: `pulseaudio -k && pulseaudio --start`
- **Check audio system**: `ps aux | grep -E "(pulse|alsa)"`
- **Try manual loopback**: See Step 3 above

**❌ "Audio Debug - RMS: 0.000000"**

- **Check audio is playing**: `pactl list sink-inputs`
- **Verify monitor device**: `pactl list sources | grep -A5 monitor`
- **Test with arecord**: `arecord -f cd -t wav -D pulse test.wav` (Ctrl+C to stop)
- **Check permissions**: User should be in `audio` group

**❌ Permission denied errors**

```bash
# Add user to audio group
sudo usermod -a -G audio $USER

# Logout and login again for changes to take effect
```

**❌ PulseAudio not working**

```bash
# Check PulseAudio status
systemctl --user status pulseaudio

# Restart PulseAudio
systemctl --user restart pulseaudio

# Or kill and restart manually
pulseaudio -k
pulseaudio --start --log-target=syslog
```

**❌ ALSA/PulseAudio conflicts**

```bash
# Check what's using audio
sudo lsof /dev/snd/*

# Kill conflicting processes
sudo killall pulseaudio alsa

# Restart audio system
sudo systemctl restart alsa-state
systemctl --user restart pulseaudio
```

---

## 🎯 Quick Reference & Testing

### 🧪 **Testing Your Setup**

After configuring any method above:

1. **Open Pluely**
2. **Click system audio button** (headphones icon)
3. **Choose your method**:
   - **"🎤 Default Input"** - for microphone/voice input
   - **"🔄 System Audio"** - for system audio capture
4. **Test buttons**:
   - **"🔍 Debug"** - shows all available audio devices
   - **"🎵 Test Audio"** - tests audio levels for 3 seconds
5. **Play some audio** (music, video, speech)
6. **Check console output** for audio level changes

### 📊 **Expected Console Output**

**✅ Working correctly:**

```
Selected virtual audio device: BlackHole 2ch
Audio Debug - RMS: 0.012345, Peak: 0.045678, Threshold: 0.001000, Speech: true
AUDIO LOGGED
```

**❌ Not working:**

```
Audio Debug - RMS: 0.000000, Peak: 0.000000, Threshold: 0.001000, Speech: false
```

### 🚀 **Platform-Specific Quick Setup**

| Platform    | Basic Method (Not Recommended) | **Recommended Method** (Best Experience) |
| ----------- | ------------------------------ | ---------------------------------------- |
| **macOS**   | Default Input (may not work)   | **BlackHole + Multi-Output** ✅          |
| **Windows** | Default Input (may not work)   | **Stereo Mix or VB-Cable** ✅            |
| **Linux**   | Default Input (may not work)   | **PulseAudio Monitor** ✅                |

💡 **Pro Tip**: Skip the basic method and go straight to the recommended setup for reliable performance!

### 🔧 **Common Issues & Solutions**

| Issue                   | Solution                                               |
| ----------------------- | ------------------------------------------------------ |
| "Already running" error | Fixed automatically - app stops existing capture       |
| RMS: 0.000000           | No audio flowing - check routing setup                 |
| No devices found        | Try "Default Input" first, then setup virtual devices  |
| Permission denied       | Grant microphone/screen recording permissions          |
| Antivirus blocking      | Temporarily disable during virtual device installation |

### 💡 **Pro Tips**

1. **Skip Default Input**: Go straight to the recommended system audio setup for best results
2. **One Method at a Time**: Don't mix different virtual audio solutions
3. **Restart After Setup**: Reboot after installing virtual audio devices
4. **Check Permissions**: Ensure all required permissions are granted
5. **Test with Music**: Use music/videos to verify audio routing before testing speech

### 📚 **Additional Resources**

- **BlackHole Documentation**: https://existential.audio/blackhole/
- **VB-Audio Support**: https://vb-audio.com/Services/support.htm
- **PulseAudio Wiki**: https://wiki.archlinux.org/title/PulseAudio
- **Windows Audio Troubleshooting**: https://support.microsoft.com/en-us/windows/fix-sound-problems-in-windows-10-73025246-b61c-40fb-671a-2fcb4b25e5c0

### 🆘 **Still Need Help?**

If you're still having issues:

1. **Try "🎤 Default Input"** first - this should always work
2. **Use the debug tools** in Pluely to see what devices are available
3. **Check the console output** for specific error messages
4. **Follow platform-specific troubleshooting** sections above
5. **Report issues** with console output and your platform details

---

## 🎉 Conclusion

Pluely now supports **multiple audio capture methods** to work with your setup:

- **🎤 Default Input**: Works immediately, no setup required
- **🔊 System Audio**: Captures everything your computer plays (requires setup)
- **🔍 Debug Tools**: Help troubleshoot and verify your configuration
- **🎵 Audio Testing**: Verify audio levels and device detection

**The key insight**: You don't need BlackHole or virtual devices to use Pluely - the "Default Input" method works out of the box for voice input. System audio capture is an advanced feature that requires additional setup but enables powerful use cases like meeting transcription and video analysis.

Choose the method that best fits your needs and technical comfort level!
