export type BotNodeType =
  | 'start'
  | 'message'
  | 'userInput'
  | 'condition'
  | 'action'
  | 'aiChat'
  | 'delay'
  | 'media'
  | 'variable'
  | 'randomizer'
  | 'jump'
  | 'translate'
  | 'youtubeMonitor'
  | 'socialShare'
  | 'langDetect'
  | 'instagramMonitor'
  | 'facebookMonitor'
  | 'userLangPref'
  | 'yandexTranslate';

export interface BotButton {
  id: string;
  label: string;
  url?: string;
  callbackData?: string;
}

export interface BotNodeData {
  label?: string;
  text?: string;

  // message node
  buttons?: BotButton[];
  parseMode?: 'Markdown' | 'HTML' | 'plain';
  disablePreview?: boolean;

  // media node
  mediaType?: 'photo' | 'video' | 'audio' | 'document' | 'sticker';
  mediaUrl?: string;
  caption?: string;

  // userInput node
  inputType?: 'text' | 'number' | 'email' | 'phone' | 'date' | 'choice';
  variableName?: string;
  choices?: string[];
  validation?: string;

  // condition node
  variable?: string;
  operator?: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greater' | 'less' | 'isEmpty' | 'isNotEmpty';
  value?: string;

  // action node
  actionType?: 'sendForm' | 'sendMessage' | 'webhook' | 'email' | 'saveToSheet' | 'postToSocial';
  formId?: string;
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT';
  webhookHeaders?: string;
  webhookBody?: string;
  message?: string;
  emailTo?: string;
  emailSubject?: string;

  // aiChat node
  aiPrompt?: string;
  aiModel?: string;
  aiResponseVar?: string;
  aiContext?: string;
  aiTemperature?: number;

  // delay node
  delaySeconds?: number;
  delayMessage?: string;

  // variable node
  varOperation?: 'set' | 'increment' | 'decrement' | 'append' | 'clear';
  varName?: string;
  varValue?: string;

  // randomizer node
  randWeights?: number[];

  // jump node
  jumpTarget?: string;

  // translate node
  translateSourceVar?: string;
  translateTargetLang?: string;
  translateSourceLang?: string;
  translateResultVar?: string;
  translateMode?: 'fixed' | 'userLang';
  translateContentType?: 'text' | 'post' | 'caption' | 'video_description' | 'audio_transcript';
  translateCaptionVar?: string;
  translateCaptionResultVar?: string;
  translateAutoSend?: boolean;      // auto-send translated result immediately

  // yandexTranslate node
  yandexSourceVar?: string;          // variable with text to translate
  yandexTargetLang?: string;         // target language code (ru, en, de...)
  yandexSourceLang?: string;         // source lang (empty = auto-detect)
  yandexResultVar?: string;          // variable to store result
  yandexFolderId?: string;           // Yandex Cloud folder ID (from bot settings)
  yandexApiKey?: string;             // IAM or API key (from bot settings)

  // langDetect node
  langDetectVar?: string;
  langResultVar?: string;
  langSetAsDefault?: boolean;

  // youtubeMonitor node
  ytChannelId?: string;
  ytChannelUrl?: string;
  ytCheckInterval?: number;
  ytNotifyVideos?: boolean;
  ytNotifyStreams?: boolean;
  ytNotifyPremiere?: boolean;
  ytMessageTemplate?: string;
  ytSaveLastIdVar?: string;
  ytAutoTranslate?: boolean;        // auto-translate to user lang

  // socialShare node
  shareLinks?: SocialLink[];
  shareText?: string;
  shareLayout?: 'buttons' | 'text' | 'mixed';

  // instagramMonitor node
  igAccountId?: string;             // Instagram account/page ID
  igAccountUrl?: string;            // or account URL e.g. @username
  igAccessToken?: string;           // Meta Graph API access token (from settings)
  igCheckInterval?: number;         // minutes between checks
  igNotifyPosts?: boolean;          // notify on new feed posts
  igNotifyReels?: boolean;          // notify on new reels
  igNotifyStories?: boolean;        // notify on stories (limited API)
  igNotifyLive?: boolean;           // notify on live streams
  igTranslateContent?: boolean;     // auto-translate text/caption to user lang
  igTranslateContentType?: 'caption' | 'post' | 'both';
  igMessageTemplate?: string;       // {{type}} {{author}} {{caption}} {{url}} {{media_url}}
  igSaveLastIdVar?: string;

  // facebookMonitor node
  fbPageId?: string;                // Facebook Page ID
  fbPageUrl?: string;               // or page URL
  fbAccessToken?: string;           // Meta Graph API page access token
  fbCheckInterval?: number;
  fbNotifyPosts?: boolean;
  fbNotifyVideos?: boolean;
  fbNotifyLive?: boolean;
  fbTranslateContent?: boolean;     // auto-translate post text to user lang
  fbMessageTemplate?: string;       // {{type}} {{author}} {{text}} {{url}} {{media_url}}
  fbSaveLastIdVar?: string;

  // userLangPref node — ask user to choose their language
  ulpQuestion?: string;             // question to ask
  ulpSaveVar?: string;              // variable to save lang code e.g. 'user_lang'
  ulpDefaultLang?: string;          // default if user doesn't respond
  ulpShowFlags?: boolean;           // show flag emoji on buttons
  ulpLanguages?: string[];          // language codes to offer ['ru','en','de',...]
}

export interface SocialLink {
  id: string;
  platform: 'telegram' | 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'vk' | 'facebook' | 'website' | 'discord' | 'twitch';
  label: string;
  url: string;
}

export interface BotNode {
  id: string;
  type: BotNodeType;
  position: { x: number; y: number };
  data: BotNodeData;
}

export interface BotEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export interface TelegramBot {
  id: string;
  name: string;
  token: string;
  username?: string;
  nodes: BotNode[];
  edges: BotEdge[];
  createdAt: number;
  updatedAt: number;
  /** Whether the bot is currently deployed to Telegram */
  isLaunched?: boolean;
  /** Telegram @username of the launched bot */
  launchedBotName?: string;
}
