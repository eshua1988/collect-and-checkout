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
  | 'langDetect';

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
  translateSourceVar?: string;      // variable containing text to translate
  translateTargetLang?: string;     // target language code e.g. 'en', 'ru', 'de'
  translateSourceLang?: string;     // 'auto' or explicit lang code
  translateResultVar?: string;      // where to save translated text
  translateMode?: 'fixed' | 'userLang'; // fixed lang or follow user detected lang

  // langDetect node
  langDetectVar?: string;           // variable with text to analyze
  langResultVar?: string;           // where to save detected lang code e.g. 'user_lang'
  langSetAsDefault?: boolean;       // auto-apply detected lang for future translates

  // youtubeMonitor node
  ytChannelId?: string;             // YouTube channel ID (UCxxxxxxxx)
  ytChannelUrl?: string;            // or channel URL
  ytCheckInterval?: number;         // minutes between checks (15, 30, 60, 120)
  ytNotifyVideos?: boolean;         // notify on new videos
  ytNotifyStreams?: boolean;        // notify on live streams
  ytNotifyPremiere?: boolean;       // notify on premieres
  ytMessageTemplate?: string;       // message template with {{title}}, {{url}}, {{author}}
  ytSaveLastIdVar?: string;         // variable to track last video ID

  // socialShare node
  shareLinks?: SocialLink[];        // list of platform links to share
  shareText?: string;               // message text before links
  shareLayout?: 'buttons' | 'text' | 'mixed'; // how to display
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
}
