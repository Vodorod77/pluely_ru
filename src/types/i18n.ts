// Auto-generated types for translations
// This ensures type safety when using translations

export type Locale = 'en' | 'ru';

export interface TranslationCommon {
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  close: string;
  open: string;
  start: string;
  stop: string;
  enable: string;
  disable: string;
  settings: string;
  about: string;
  help: string;
  chat: string;
  chats: string;
  reload: string;
  confirm: string;
  back: string;
  next: string;
  search: string;
  clear: string;
  copy: string;
  copied: string;
  edit: string;
  remove: string;
  add: string;
  update: string;
  install: string;
  uninstall: string;
  download: string;
  upload: string;
  import: string;
  export: string;
  yes: string;
  no: string;
  ok: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface TranslationApp {
  name: string;
  tagline: string;
  description: string;
}

export interface TranslationError {
  title: string;
  description: string;
  reload_button: string;
  generic: string;
}

export interface TranslationShortcuts {
  dashboard: string;
  voice_recording: string;
  toggle_overlay: string;
  new_chat: string;
  search_chats: string;
}

export interface TranslationSettingsLanguage {
  title: string;
  description: string;
}

export interface TranslationSettingsTheme {
  title: string;
  description: string;
  system: string;
  system_description: string;
}

export interface TranslationSettingsWindowTransparency {
  title: string;
  description: string;
  tip: string;
}

export interface TranslationSettingsAutostart {
  title: string;
  description: string;
  label: string;
}

export interface TranslationSettingsAppIcon {
  title: string;
  description: string;
  label: string;
}

export interface TranslationSettingsAlwaysOnTop {
  title: string;
  description: string;
  label: string;
}

export interface TranslationSettingsDeleteChats {
  title: string;
  description: string;
  button: string;
  deleting: string;
  success: string;
  confirm_title: string;
  confirm_message: string;
}

export interface TranslationSettingsScreenshot {
  title: string;
  enabled: string;
  mode: string;
  quality: string;
  format: string;
}

export interface TranslationSettings {
  title: string;
  description: string;
  general: string;
  appearance: string;
  shortcuts: string;
  advanced: string;
  about: string;
  language: TranslationSettingsLanguage;
  theme: TranslationSettingsTheme;
  window_transparency: TranslationSettingsWindowTransparency;
  autostart: TranslationSettingsAutostart;
  app_icon: TranslationSettingsAppIcon;
  always_on_top: TranslationSettingsAlwaysOnTop;
  delete_chats: TranslationSettingsDeleteChats;
  screenshot: TranslationSettingsScreenshot;
  theme_customization_license_required: string;
}

export interface TranslationChat {
  title: string;
  new_chat: string;
  empty_title: string;
  empty_description: string;
  placeholder: string;
  send: string;
  clear_history: string;
  delete_conversation: string;
  rename_conversation: string;
  copy_message: string;
  regenerate: string;
  stop_generating: string;
}

export interface TranslationAIProviders {
  openai: string;
  anthropic: string;
  google: string;
  mistral: string;
  cohere: string;
  groq: string;
  perplexity: string;
  openrouter: string;
  ollama: string;
}

export interface TranslationAISettings {
  title: string;
  provider: string;
  api_key: string;
  model: string;
  temperature: string;
  max_tokens: string;
  system_prompt: string;
  default_system_prompt: string;
}

export interface TranslationAI {
  providers: TranslationAIProviders;
  settings: TranslationAISettings;
}

export interface TranslationSTTProviders {
  openai_whisper: string;
  groq: string;
}

export interface TranslationSTT {
  title: string;
  providers: TranslationSTTProviders;
  recording: string;
  processing: string;
  error: string;
}

export interface TranslationUpdater {
  checking: string;
  available: string;
  downloading: string;
  installing: string;
  ready: string;
  uptodate: string;
  error: string;
  failed: string;
  install_and_restart: string;
  download_update: string;
  check_for_updates: string;
}

export interface TranslationLicense {
  get: string;
  enter: string;
  valid: string;
  invalid: string;
  expired: string;
  loading: string;
}

export interface TranslationContribute {
  title: string;
  description: string;
  button: string;
}

export interface TranslationPromote {
  title: string;
  description: string;
  email: string;
  button: string;
  dismiss: string;
}

export interface TranslationDashboardPluelyApi {
  title_loading: string;
  title_loaded: string;
  model_singular: string;
  model_plural: string;
  description_loading: string;
  description_loaded_prefix: string;
  description_loaded_suffix: string;
  description_no_providers: string;
  select_model: string;
  select_placeholder: string;
  no_models: string;
  not_available: string;
  modality_text_image: string;
  modality_text_only: string;
  license_key: string;
  license_description: string;
  license_placeholder: string;
  activate_license: string;
  current_license: string;
  remove_license: string;
  contact_support: string;
  enable_api: string;
  disable_api: string;
  api_enabled_description: string;
  api_disabled_description: string;
  api_no_license_description: string;
  error_enter_key: string;
  error_activation_failed: string;
  error_save_model: string;
  success_activated: string;
  success_removed: string;
}

export interface TranslationDashboard {
  title: string;
  description: string;
  pluely_api: TranslationDashboardPluelyApi;
}

export interface TranslationResponsesResponseLength {
  title: string;
  description: string;
  short: string;
  short_description: string;
  medium: string;
  medium_description: string;
  auto: string;
  auto_description: string;
}

export interface TranslationResponsesResponseLanguage {
  title: string;
  description: string;
  english: string;
}

export interface TranslationResponsesAutoScroll {
  title: string;
  description: string;
  enabled: string;
  enabled_description: string;
  disabled: string;
  disabled_description: string;
}

export interface TranslationResponses {
  title: string;
  description: string;
  premium_features: string;
  premium_description: string;
  response_length: TranslationResponsesResponseLength;
  response_language: TranslationResponsesResponseLanguage;
  auto_scroll: TranslationResponsesAutoScroll;
}

export interface TranslationScreenshotPromote {
  title: string;
  description: string;
  email: string;
}

export interface TranslationScreenshotCaptureMethod {
  title: string;
  description: string;
  screenshot_mode: string;
}

export interface TranslationScreenshotProcessingMode {
  title: string;
  description: string;
  manual: string;
  tip: string;
}

export interface TranslationScreenshot {
  title: string;
  description: string;
  promote: TranslationScreenshotPromote;
  capture_method: TranslationScreenshotCaptureMethod;
  processing_mode: TranslationScreenshotProcessingMode;
}

export interface TranslationAudioPromote {
  title: string;
  description: string;
  email: string;
}

export interface TranslationAudioMicrophone {
  title: string;
  description: string;
  no_devices: string;
  refresh: string;
  click_refresh: string;
  click_refresh_description: string;
  tip: string;
}

export interface TranslationAudioSystemAudio {
  title: string;
  description: string;
  no_devices: string;
  refresh: string;
  click_refresh: string;
  click_refresh_description: string;
  tip: string;
}

export interface TranslationAudio {
  title: string;
  description: string;
  promote: TranslationAudioPromote;
  microphone: TranslationAudioMicrophone;
  system_audio: TranslationAudioSystemAudio;
}

export interface TranslationSidebar {
  dashboard: string;
  chats: string;
  system_prompts: string;
  app_settings: string;
  responses: string;
  screenshot: string;
  audio: string;
  cursor_shortcuts: string;
  dev_space: string;
  contact_support: string;
  report_bug: string;
  quit: string;
  loading: string;
}

export interface TranslationChats {
  title: string;
  description: string;
  no_conversations: string;
  start_conversation: string;
}

export interface TranslationSystemPrompts {
  title: string;
  description: string;
  search_placeholder: string;
  create_new: string;
  no_prompts: string;
  create_prompt: string;
}

export interface TranslationShortcutsCursor {
  title: string;
  description: string;
  invisible: string;
  not_supported: string;
}

export interface TranslationShortcutsKeyboard {
  title: string;
  description: string;
  reset: string;
  unlock: string;
  unlock_description: string;
  get_license: string;
  change: string;
  toggle_dashboard: string;
  toggle_dashboard_description: string;
  toggle_window: string;
  toggle_window_description: string;
  refocus_input: string;
  refocus_input_description: string;
  move_window: string;
  move_window_description: string;
  system_audio: string;
  system_audio_description: string;
}

export interface TranslationShortcutsPage {
  title: string;
  description: string;
  cursor: TranslationShortcutsCursor;
  keyboard: TranslationShortcutsKeyboard;
}

export interface TranslationDevSpaceContribute {
  title: string;
  description: string;
  button: string;
}

export interface TranslationDevSpaceAIProviders {
  title: string;
  description: string;
  custom: string;
  custom_description: string;
  add_custom: string;
  select: string;
  select_description: string;
  choose: string;
}

export interface TranslationDevSpaceSTTProviders {
  title: string;
  description: string;
  custom: string;
  custom_description: string;
  add_custom: string;
  select: string;
  select_description: string;
}

export interface TranslationDevSpace {
  title: string;
  description: string;
  contribute: TranslationDevSpaceContribute;
  ai_providers: TranslationDevSpaceAIProviders;
  stt_providers: TranslationDevSpaceSTTProviders;
}

export interface Translation {
  common: TranslationCommon;
  app: TranslationApp;
  error: TranslationError;
  settings: TranslationSettings;
  chat: TranslationChat;
  ai: TranslationAI;
  stt: TranslationSTT;
  updater: TranslationUpdater;
  license: TranslationLicense;
  contribute: TranslationContribute;
  promote: TranslationPromote;
  dashboard: TranslationDashboard;
  responses: TranslationResponses;
  screenshot: TranslationScreenshot;
  audio: TranslationAudio;
  sidebar: TranslationSidebar;
  chats: TranslationChats;
  system_prompts: TranslationSystemPrompts;
  shortcuts_page: TranslationShortcutsPage;
  dev_space: TranslationDevSpace;
}

// Type for translation keys with dot notation
export type TranslationKey = 
  | `common.${keyof TranslationCommon}`
  | `app.${keyof TranslationApp}`
  | `error.${keyof TranslationError}`
  | `settings.${keyof Omit<TranslationSettings, 'language' | 'theme' | 'window_transparency' | 'autostart' | 'app_icon' | 'always_on_top' | 'delete_chats' | 'screenshot'>}`
  | `settings.language.${keyof TranslationSettingsLanguage}`
  | `settings.theme.${keyof TranslationSettingsTheme}`
  | `settings.window_transparency.${keyof TranslationSettingsWindowTransparency}`
  | `settings.autostart.${keyof TranslationSettingsAutostart}`
  | `settings.app_icon.${keyof TranslationSettingsAppIcon}`
  | `settings.always_on_top.${keyof TranslationSettingsAlwaysOnTop}`
  | `settings.delete_chats.${keyof TranslationSettingsDeleteChats}`
  | `settings.screenshot.${keyof TranslationSettingsScreenshot}`
  | `chat.${keyof TranslationChat}`
  | `ai.providers.${keyof TranslationAIProviders}`
  | `ai.settings.${keyof TranslationAISettings}`
  | `stt.${keyof Omit<TranslationSTT, 'providers'>}`
  | `stt.providers.${keyof TranslationSTTProviders}`
  | `updater.${keyof TranslationUpdater}`
  | `license.${keyof TranslationLicense}`
  | `contribute.${keyof TranslationContribute}`
  | `promote.${keyof TranslationPromote}`
  | `dashboard.${keyof Omit<TranslationDashboard, 'pluely_api'>}`
  | `dashboard.pluely_api.${keyof TranslationDashboardPluelyApi}`
  | `responses.${keyof Omit<TranslationResponses, 'response_length' | 'response_language' | 'auto_scroll'>}`
  | `responses.response_length.${keyof TranslationResponsesResponseLength}`
  | `responses.response_language.${keyof TranslationResponsesResponseLanguage}`
  | `responses.auto_scroll.${keyof TranslationResponsesAutoScroll}`
  | `screenshot.${keyof Omit<TranslationScreenshot, 'promote' | 'capture_method' | 'processing_mode'>}`
  | `screenshot.promote.${keyof TranslationScreenshotPromote}`
  | `screenshot.capture_method.${keyof TranslationScreenshotCaptureMethod}`
  | `screenshot.processing_mode.${keyof TranslationScreenshotProcessingMode}`
  | `audio.${keyof Omit<TranslationAudio, 'promote' | 'microphone' | 'system_audio'>}`
  | `audio.promote.${keyof TranslationAudioPromote}`
  | `audio.microphone.${keyof TranslationAudioMicrophone}`
  | `audio.system_audio.${keyof TranslationAudioSystemAudio}`
  | `sidebar.${keyof TranslationSidebar}`
  | `chats.${keyof TranslationChats}`
  | `system_prompts.${keyof TranslationSystemPrompts}`
  | `shortcuts_page.${keyof Omit<TranslationShortcutsPage, 'cursor' | 'keyboard'>}`
  | `shortcuts_page.cursor.${keyof TranslationShortcutsCursor}`
  | `shortcuts_page.keyboard.${keyof TranslationShortcutsKeyboard}`
  | `dev_space.${keyof Omit<TranslationDevSpace, 'contribute' | 'ai_providers' | 'stt_providers'>}`
  | `dev_space.contribute.${keyof TranslationDevSpaceContribute}`
  | `dev_space.ai_providers.${keyof TranslationDevSpaceAIProviders}`
  | `dev_space.stt_providers.${keyof TranslationDevSpaceSTTProviders}`;
