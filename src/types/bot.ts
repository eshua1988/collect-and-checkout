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
  | 'jump';

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
  actionType?: 'sendForm' | 'sendMessage' | 'webhook' | 'email' | 'saveToSheet';
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
