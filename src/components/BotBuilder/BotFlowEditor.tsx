import { useCallback, useState, useRef } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  MessageNode, UserInputNode, ConditionNode, ActionNode, StartNode,
  AiChatNode, DelayNode, MediaNode, VariableNode, RandomizerNode, JumpNode,
} from './BotNodes';
import { NodeEditor } from './NodeEditor';
import { BotSimulator } from './BotSimulator';
import { BotNodeData, BotNodeType, TelegramBot } from '@/types/bot';
import { FormData } from '@/types/form';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, GitBranch, Zap, HelpCircle, Save, Info,
  Brain, Clock, Image, SlidersHorizontal, Shuffle, CornerDownRight, Play,
} from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
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
};

const generateId = () => Math.random().toString(36).substring(2, 9);

interface BotFlowEditorProps {
  bot: TelegramBot;
  forms: FormData[];
  onSave: (bot: TelegramBot) => void;
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
};

const nodeAddButtons: { type: BotNodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'message',    label: 'Сообщение',   icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'userInput',  label: 'Ввод',         icon: <HelpCircle className="w-3.5 h-3.5" />,   color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { type: 'condition',  label: 'Условие',      icon: <GitBranch className="w-3.5 h-3.5" />,    color: 'bg-warning/10 text-warning border-warning/30' },
  { type: 'action',     label: 'Действие',     icon: <Zap className="w-3.5 h-3.5" />,          color: 'bg-accent/10 text-accent-foreground border-accent/30' },
  { type: 'aiChat',     label: '🤖 ИИ',        icon: <Brain className="w-3.5 h-3.5" />,        color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'delay',      label: 'Пауза',        icon: <Clock className="w-3.5 h-3.5" />,         color: 'bg-muted text-muted-foreground border-border' },
  { type: 'media',      label: 'Медиа',        icon: <Image className="w-3.5 h-3.5" />,         color: 'bg-secondary/80 text-secondary-foreground border-secondary' },
  { type: 'variable',   label: 'Переменная',   icon: <SlidersHorizontal className="w-3.5 h-3.5" />, color: 'bg-secondary/80 text-secondary-foreground border-secondary' },
  { type: 'randomizer', label: 'Рандом',       icon: <Shuffle className="w-3.5 h-3.5" />,       color: 'bg-primary/10 text-primary border-primary/30' },
  { type: 'jump',       label: 'Переход',      icon: <CornerDownRight className="w-3.5 h-3.5" />, color: 'bg-muted text-muted-foreground border-border' },
];

function BotFlowEditorInner({ bot, forms, onSave }: BotFlowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    bot.nodes.length > 0 ? bot.nodes as Node[] : [
      { id: 'start', type: 'start', position: { x: 60, y: 200 }, data: {} }
    ]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(bot.edges as Edge[]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: 'hsl(var(--primary))' } }, eds));
  }, [setEdges]);

  const addNode = useCallback((type: BotNodeType) => {
    const id = generateId();
    const pos = { x: 200 + Math.random() * 400, y: 100 + Math.random() * 300 };
    setNodes(nds => [...nds, { id, type, position: pos, data: { ...defaultData[type] } }]);
    setSelectedNodeId(id);
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, data: BotNodeData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data } : n));
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const handleSave = () => {
    onSave({ ...bot, nodes: nodes as any, edges: edges as any });
    toast.success('Поток бота сохранён!');
  };

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Toolbar: node types */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap max-w-[calc(100%-180px)]">
          {nodeAddButtons.map(btn => (
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

        {/* Toolbar: actions */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <Button
            size="sm"
            variant={showSimulator ? 'default' : 'outline'}
            onClick={() => setShowSimulator(v => !v)}
            className="shadow-md"
          >
            <Play className="w-4 h-4 mr-1.5" />
            Симулятор
          </Button>
          <Button size="sm" onClick={handleSave} className="shadow-md">
            <Save className="w-4 h-4 mr-1.5" />
            Сохранить
          </Button>
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
          onNodeClick={(_, node) => { setSelectedNodeId(node.id); setShowSimulator(false); }}
          onPaneClick={() => setSelectedNodeId(null)}
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
      {selectedNode && selectedNode.id !== 'start' && !showSimulator && (
        <div className="w-80 border-l bg-card overflow-y-auto shrink-0 flex flex-col">
          <NodeEditor
            nodeId={selectedNode.id}
            nodeType={selectedNode.type as BotNodeType}
            data={selectedNode.data}
            forms={forms}
            nodes={nodes as any}
            onUpdate={updateNodeData}
            onClose={() => setSelectedNodeId(null)}
            onDelete={deleteNode}
          />
        </div>
      )}

      {/* Simulator side panel */}
      {showSimulator && (
        <div className="w-80 border-l bg-card shrink-0 flex flex-col overflow-hidden">
          <BotSimulator
            nodes={nodes as any}
            edges={edges as any}
            botName={bot.name}
            onClose={() => setShowSimulator(false)}
          />
        </div>
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
