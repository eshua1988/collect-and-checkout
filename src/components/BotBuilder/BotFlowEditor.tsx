import { useCallback, useState, useRef, memo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  MessageNode, UserInputNode, ConditionNode, ActionNode, StartNode,
  AiChatNode, DelayNode, MediaNode, VariableNode, RandomizerNode, JumpNode,
  TranslateNode, LangDetectNode, YoutubeMonitorNode, SocialShareNode,
  InstagramMonitorNode, FacebookMonitorNode, UserLangPrefNode, YandexTranslateNode,
} from './BotNodes';
import { NodeEditor } from './NodeEditor';
import { BotSimulator } from './BotSimulator';
import { BotTipsPanel } from './BotTipsPanel';
import { BotTemplatesPanel } from './BotTemplatesPanel';
import { BotNodeData, BotNodeType, BotNode, BotEdge, TelegramBot } from '@/types/bot';
import { FormData } from '@/types/form';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, GitBranch, Zap, HelpCircle, Save, Info,
  Brain, Clock, Image, SlidersHorizontal, Shuffle, CornerDownRight, Play,
  Languages, Globe, Youtube, Share2, Instagram, Facebook, Flag,
  Lightbulb, Layers,
} from 'lucide-react';
import { Handle, Position } from 'reactflow';
import { toast } from 'sonner';
import { getCustomNodeTypes } from '@/components/AIAssistant/useAIAssistant';

// ── Generic custom node renderer for AI-registered types ───────────────────────
function makeCustomNode(label: string, icon: string) {
  return memo(({ data, selected }: NodeProps<BotNodeData>) => (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'shadow-lg border-primary' : 'border-border'}`}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background !bg-primary" />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border bg-primary/10">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-primary truncate">{label}</span>
      </div>
      <div className="p-3 space-y-1">
        {data.text && <p className="text-sm text-foreground truncate">{data.text}</p>}
        {data.label && <p className="text-xs text-muted-foreground truncate">{data.label}</p>}
        {!data.text && !data.label && (
          <span className="text-xs text-muted-foreground italic">Нет данных</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background !bg-primary" />
    </div>
  ));
}

const BASE_NODE_TYPES: NodeTypes = {
  message: MessageNode,
  userInput: UserInputNode,
  condition: ConditionNode,
  action: ActionNode,
  start: StartNode,
  aiChat: AiChatNode,
  delay: DelayNode,
  media: MediaNode,
  variable: VariableNode,
  randomizer: RandomizerNode,
  jump: JumpNode,
  translate: TranslateNode,
  langDetect: LangDetectNode,
  youtubeMonitor: YoutubeMonitorNode,
  socialShare: SocialShareNode,
  instagramMonitor: InstagramMonitorNode,
  facebookMonitor: FacebookMonitorNode,
  userLangPref: UserLangPrefNode,
  yandexTranslate: YandexTranslateNode,
};

const generateId = () => Math.random().toString(36).substring(2, 9);

interface BotFlowEditorProps {
  bot: TelegramBot;
  forms: FormData[];
  onSave: (bot: TelegramBot) => void;
  sidePanel: SidePanel;
  onSidePanelChange: (panel: SidePanel) => void;
  saveRef: React.MutableRefObject<(() => void) | null>;
}

const defaultData: Record<BotNodeType, BotNodeData> = {
  message: { text: '', buttons: [] },
  userInput: { text: '', inputType: 'text', variableName: '' },
  condition: { variable: '', operator: 'equals', value: '' },
  action: { actionType: undefined },
  start: {},
  aiChat: { aiPrompt: '', aiModel: 'google/gemini-3-flash-preview', aiResponseVar: 'ai_response', aiTemperature: 0.7 },
  delay: { delaySeconds: 3 },
  media: { mediaType: 'photo', mediaUrl: '', caption: '' },
  variable: { varOperation: 'set', varName: '', varValue: '' },
  randomizer: { randWeights: [1, 1] },
  jump: { jumpTarget: '' },
  translate: { translateSourceLang: 'auto', translateTargetLang: 'ru', translateMode: 'userLang', translateSourceVar: 'content_text', translateResultVar: 'translated_text', translateContentType: 'post' },
  langDetect: { langDetectVar: 'user_message', langResultVar: 'user_lang', langSetAsDefault: true },
  youtubeMonitor: { ytNotifyVideos: true, ytNotifyStreams: true, ytCheckInterval: 30, ytMessageTemplate: '🎬 Новое видео: {{title}}\n▶️ {{url}}', ytAutoTranslate: true },
  socialShare: { shareLinks: [], shareText: '', shareLayout: 'buttons' },
  instagramMonitor: { igCheckInterval: 30, igNotifyPosts: true, igNotifyReels: true, igTranslateContent: true, igTranslateContentType: 'both', igMessageTemplate: '📸 Новый пост от {{author}}!\n\n{{caption}}\n\n🔗 {{url}}' },
  facebookMonitor: { fbCheckInterval: 30, fbNotifyPosts: true, fbNotifyVideos: true, fbTranslateContent: true, fbMessageTemplate: '📘 Новый пост от {{author}}!\n\n{{text}}\n\n🔗 {{url}}' },
  userLangPref: { ulpQuestion: 'Выберите язык / Choose your language:', ulpSaveVar: 'user_lang', ulpDefaultLang: 'ru', ulpShowFlags: true, ulpLanguages: ['ru', 'en', 'de', 'fr', 'es'] },
  yandexTranslate: { yandexSourceLang: '', yandexTargetLang: 'ru', yandexSourceVar: 'user_message', yandexResultVar: 'translated_text', yandexFolderId: '', yandexApiKey: '' },
};

const nodeAddButtons: { type: BotNodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'message',          label: 'Сообщение',   icon: <MessageSquare className="w-3.5 h-3.5" />,     color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'userInput',        label: 'Ввод',         icon: <HelpCircle className="w-3.5 h-3.5" />,        color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { type: 'condition',        label: 'Условие',      icon: <GitBranch className="w-3.5 h-3.5" />,         color: 'bg-warning/10 text-warning border-warning/30' },
  { type: 'action',           label: 'Действие',     icon: <Zap className="w-3.5 h-3.5" />,               color: 'bg-accent/10 text-accent-foreground border-accent/30' },
  { type: 'aiChat',           label: '🤖 ИИ',        icon: <Brain className="w-3.5 h-3.5" />,             color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'userLangPref',     label: '🗣 Язык юзера', icon: <Flag className="w-3.5 h-3.5" />,              color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'translate',        label: '🌐 Перевод',   icon: <Languages className="w-3.5 h-3.5" />,         color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'yandexTranslate',  label: '🔴 Яндекс',    icon: <Languages className="w-3.5 h-3.5" />,         color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  { type: 'langDetect',       label: '🔍 Авто-язык', icon: <Globe className="w-3.5 h-3.5" />,             color: 'bg-accent/10 text-accent-foreground border-accent/30' },
  { type: 'instagramMonitor', label: '📸 Instagram',  icon: <Instagram className="w-3.5 h-3.5" />,         color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { type: 'facebookMonitor',  label: '📘 Facebook',   icon: <Facebook className="w-3.5 h-3.5" />,          color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'youtubeMonitor',   label: '▶ YouTube',    icon: <Youtube className="w-3.5 h-3.5" />,           color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { type: 'socialShare',      label: '📱 Соц.сети',  icon: <Share2 className="w-3.5 h-3.5" />,            color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'delay',            label: 'Пауза',        icon: <Clock className="w-3.5 h-3.5" />,             color: 'bg-muted text-muted-foreground border-border' },
  { type: 'media',            label: 'Медиа',        icon: <Image className="w-3.5 h-3.5" />,             color: 'bg-secondary/80 text-secondary-foreground border-secondary' },
  { type: 'variable',         label: 'Переменная',   icon: <SlidersHorizontal className="w-3.5 h-3.5" />, color: 'bg-secondary/80 text-secondary-foreground border-secondary' },
  { type: 'randomizer',       label: 'Рандом',       icon: <Shuffle className="w-3.5 h-3.5" />,           color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'jump',             label: 'Переход',      icon: <CornerDownRight className="w-3.5 h-3.5" />,   color: 'bg-muted text-muted-foreground border-border' },
];

export type SidePanel = 'nodeEditor' | 'simulator' | 'tips' | 'templates' | null;

function BotFlowEditorInner({ bot, forms, onSave, sidePanel, onSidePanelChange, saveRef }: BotFlowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Build merged node types: base + AI-registered custom types
  const [customNodeMeta, setCustomNodeMeta] = useState<Record<string, { label: string; icon: string; color: string; description: string }>>(() => getCustomNodeTypes());

  // Live-refresh toolbar when AI registers a new node type (via CustomEvent from saveCustomNodeType)
  useEffect(() => {
    const handler = () => setCustomNodeMeta(getCustomNodeTypes());
    window.addEventListener('customNodeTypesUpdated', handler);
    return () => window.removeEventListener('customNodeTypesUpdated', handler);
  }, []);

  // Re-read custom types from localStorage (when AI adds new ones)
  const nodeTypes: NodeTypes = {
    ...BASE_NODE_TYPES,
    ...Object.fromEntries(
      Object.entries(customNodeMeta).map(([type, meta]) => [type, makeCustomNode(meta.label, meta.icon)])
    ),
  };

  // Custom node buttons for toolbar
  const customNodeButtons = Object.entries(customNodeMeta).map(([type, meta]) => ({
    type: type as BotNodeType,
    label: meta.label,
    icon: <span>{meta.icon}</span>,
    color: meta.color || 'bg-muted text-muted-foreground border-border',
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(
    bot.nodes.length > 0
      ? (bot.nodes as Node[]).map((n, i) => ({
          ...n,
          position: {
            x: n.position?.x ?? 100 + (i % 3) * 250,
            y: n.position?.y ?? 100 + Math.floor(i / 3) * 180,
          },
        }))
      : [{ id: 'start', type: 'start', position: { x: 60, y: 200 }, data: {} }]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(bot.edges as Edge[]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // sidePanel is controlled by parent via props
  const setSidePanel = onSidePanelChange;

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const togglePanel = (panel: SidePanel) => {
    setSidePanel(sidePanel === panel ? null : panel);
    if (panel !== 'nodeEditor') setSelectedNodeId(null);
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: 'hsl(var(--primary))' } }, eds));
  }, [setEdges]);

  const addNode = useCallback((type: BotNodeType | string) => {
    const id = generateId();
    const pos = { x: 200 + Math.random() * 400, y: 100 + Math.random() * 300 };
    const data = defaultData[type as BotNodeType] ?? {};
    setNodes(nds => [...nds, { id, type, position: pos, data: { ...data } }]);
    setSelectedNodeId(id);
    setSidePanel('nodeEditor');

    // Refresh custom nodes in case new ones were added
    setCustomNodeMeta(getCustomNodeTypes());
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, data: BotNodeData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data } : n));
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
    setSidePanel(null);
  }, [setNodes, setEdges]);

  const handleSave = () => {
    onSave({ ...bot, nodes: nodes as any, edges: edges as any });
    toast.success('Поток бота сохранён!');
  };

  // Always keep saveRef up-to-date so the parent header button can trigger save
  saveRef.current = handleSave;

  const handleLoadTemplate = (tplNodes: BotNode[], tplEdges: BotEdge[]) => {
    setNodes(tplNodes as Node[]);
    setEdges(tplEdges as Edge[]);
    setSelectedNodeId(null);
    setSidePanel(null);
  };

  const handleMergeTemplate = (tplNodes: BotNode[], tplEdges: BotEdge[]) => {
    setNodes(nds => [...nds, ...(tplNodes as Node[])]);
    setEdges(eds => [...eds, ...(tplEdges as Edge[])]);
  };

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Toolbar: node types */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[calc(100%-260px)]">
          {[...nodeAddButtons, ...customNodeButtons].map(btn => (
            <button
              key={btn.type}
              onClick={() => addNode(btn.type)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shadow-sm bg-card hover:shadow-md transition-all ${btn.color}`}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Hint */}
        <div className="absolute bottom-16 left-3 z-10">
          <div className="flex items-start gap-1.5 bg-card/90 backdrop-blur text-xs text-muted-foreground px-3 py-2 rounded-lg border shadow-sm max-w-[260px]">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Тяните узлы. Соединяйте точки. Нажмите на узел для редактирования.</span>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSidePanel('nodeEditor'); }}
          onPaneClick={() => { setSelectedNodeId(null); if (sidePanel === 'nodeEditor') setSidePanel(null); }}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
          <Controls className="!bg-card !border-border !shadow-md" />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'start') return 'hsl(var(--success))';
              if (node.type === 'message') return 'hsl(var(--primary))';
              if (node.type === 'userInput') return 'hsl(var(--destructive))';
              if (node.type === 'condition') return 'hsl(var(--warning))';
              if (node.type === 'aiChat') return 'hsl(var(--primary))';
              if (node.type === 'delay') return 'hsl(var(--muted-foreground))';
              return 'hsl(var(--accent))';
            }}
            className="!bg-card !border-border !rounded-lg"
          />
        </ReactFlow>
      </div>

      {/* Node Editor side panel */}
      {sidePanel === 'nodeEditor' && selectedNode && selectedNode.id !== 'start' && (
        <div className="w-80 border-l bg-card overflow-y-auto shrink-0 flex flex-col">
          <NodeEditor
            nodeId={selectedNode.id}
            nodeType={selectedNode.type as BotNodeType}
            data={selectedNode.data}
            forms={forms}
            nodes={nodes as any}
            onUpdate={updateNodeData}
            onClose={() => setSidePanel(null)}
            onDelete={deleteNode}
          />
        </div>
      )}

      {/* Simulator side panel */}
      {sidePanel === 'simulator' && (
        <div className="w-80 border-l bg-card shrink-0 flex flex-col overflow-hidden">
          <BotSimulator
            nodes={nodes as any}
            edges={edges as any}
            botName={bot.name}
            onClose={() => setSidePanel(null)}
          />
        </div>
      )}

      {/* Tips side panel */}
      {sidePanel === 'tips' && (
        <BotTipsPanel onClose={() => setSidePanel(null)} />
      )}

      {/* Templates side panel */}
      {sidePanel === 'templates' && (
        <BotTemplatesPanel
          bot={bot}
          onLoad={handleLoadTemplate}
          onMerge={handleMergeTemplate}
          onClose={() => setSidePanel(null)}
        />
      )}
    </div>
  );
}

export function BotFlowEditor(props: BotFlowEditorProps) {
  return (
    <ReactFlowProvider>
      <BotFlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
