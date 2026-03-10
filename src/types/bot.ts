export type BotNodeType = 'message' | 'userInput' | 'condition' | 'action' | 'start';

export interface BotNodeData {
  label?: string;
  text?: string;
  // message node
  buttons?: BotButton[];
  // userInput node
  inputType?: 'text' | 'number' | 'email' | 'phone';
  variableName?: string;
  // condition node
  variable?: string;
  operator?: 'equals' | 'contains' | 'greater' | 'less';
  value?: string;
  // action node
  actionType?: 'sendForm' | 'sendMessage' | 'webhook';
  formId?: string;
  webhookUrl?: string;
  message?: string;
}

export interface BotButton {
  id: string;
  label: string;
  url?: string;
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
