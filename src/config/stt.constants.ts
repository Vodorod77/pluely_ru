export const SPEECH_TO_TEXT_PROVIDERS = [
  {
    id: "openai-whisper",
    curl: `curl https://api.openai.com/v1/audio/transcriptions \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: multipart/form-data" \\
  -F model="{{MODEL}}" \\
  -F file="<(base64 -d <<< {{AUDIO_BASE64}});filename=audio.wav"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "groq-whisper",
    curl: `curl https://api.groq.com/openai/v1/audio/transcriptions \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: multipart/form-data" \\
  -F model="{{MODEL}}" \\
  -F file="<(base64 -d <<< {{AUDIO_BASE64}});filename=audio.wav"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "elevenlabs-stt",
    curl: `curl https://api.elevenlabs.io/v1/speech-to-text \\
  -H "xi-api-key: {{API_KEY}}" \\
  -H "Content-Type: multipart/form-data" \\
  -F model_id="{{MODEL}}" \\
  -F file="<(base64 -d <<< {{AUDIO_BASE64}});filename=audio.wav"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "google-stt",
    curl: `curl https://speech.googleapis.com/v1/speech:recognize \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -d '{
    "config": {
      "encoding": "LINEAR16",
      "sampleRateHertz": 16000,
      "languageCode": "en-US"
    },
    "audio": {
      "content": "{{AUDIO_BASE64}}"
    }
  }'`,
    responseContentPath: "results[0].alternatives[0].transcript",
    streaming: false,
  },
  {
    id: "deepgram-stt",
    curl: `curl https://api.deepgram.com/v1/listen?model="{{MODEL}}" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: audio/wav" \\
  --data-binary "$(base64 -d <<< {{AUDIO_BASE64}})"`,
    responseContentPath: "results.channels[0].alternatives[0].transcript",
    streaming: false,
  },
  {
    id: "ibm-watson-stt",
    curl: `curl https://api.us-south.speech-to-text.watson.cloud.ibm.com/v1/recognize?model="{{MODEL}}" \\
  -u "apikey:{{API_KEY}}" \\
  -H "Content-Type: audio/wav" \\
  --data-binary "$(base64 -d <<< {{AUDIO_BASE64}})"`,
    responseContentPath: "results[0].alternatives[0].transcript",
    streaming: false,
  },
  {
    id: "azure-stt",
    curl: `curl https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US \\
  -H "Ocp-Apim-Subscription-Key: {{API_KEY}}" \\
  -H "Content-Type: audio/wav; codecs=audio/pcm; samplerate=16000" \\
  --data-binary "$(base64 -d <<< {{AUDIO_BASE64}})"`,
    responseContentPath: "DisplayText",
    streaming: false,
  },
  {
    id: "speechmatics-stt",
    curl: `curl https://asr.api.speechmatics.com/v2/jobs \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: multipart/form-data" \\
  -F config='{"type": "transcription", "transcription_config": {"language": "en"}}' \\
  -F data_file="<(base64 -d <<< {{AUDIO_BASE64}});filename=audio.wav"`,
    responseContentPath: "job.id",
    streaming: false,
  },
  {
    id: "zhipu-glm-asr",
    curl: `curl https://open.bigmodel.cn/api/paas/v4/audio/transcriptions \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: multipart/form-data" \\
  -F model="{{MODEL}}" \\
  -F file="<(base64 -d <<< {{AUDIO_BASE64}});filename=audio.wav"`,
    responseContentPath: "text",
    streaming: false,
  },
  {
    id: "doubao-stt",
    curl: `curl https://ark.volcengine.com/api/v3/audio/transcriptions \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -H "Content-Type: multipart/form-data" \\
  -F model="{{MODEL}}" \\
  -F file="<(base64 -d <<< {{AUDIO_BASE64}});filename=audio.wav"`,
    responseContentPath: "text",
    streaming: false,
  },
];
