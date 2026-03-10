import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BotNodeData } from '@/types/bot';
import { MessageSquare, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const MessageNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  return (
    <div className={`min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'border-primary shadow-lg' : 'border-border'}`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-primary/10 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <MessageSquare className="w-3 h-3 text-primary-foreground" />
        </div>
        <span className="text-xs font-semibold text-primary">Сообщение</span>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-sm text-foreground whitespace-pre-wrap break-words min-h-[32px]">
          {data.text || <span className="text-muted-foreground italic">Введите текст...</span>}
        </p>

        {data.buttons && data.buttons.length > 0 && (
          <div className="space-y-1 pt-1">
            {data.buttons.map((btn) => (
              <div key={btn.id} className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                <span className="text-xs text-primary truncate">{btn.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
    </div>
  );
});

export const UserInputNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  return (
    <div className={`min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'border-destructive shadow-lg' : 'border-border'}`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-destructive !border-2 !border-background" />
      
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-destructive/10 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
          <span className="text-xs text-white font-bold">?</span>
        </div>
        <span className="text-xs font-semibold text-destructive">Ввод пользователя</span>
      </div>

      <div className="p-3 space-y-1">
        <p className="text-sm text-foreground">
          {data.text || <span className="text-muted-foreground italic">Вопрос...</span>}
        </p>
        {data.variableName && (
          <div className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
            → {data.variableName}
          </div>
        )}
        <div className="text-xs text-muted-foreground">Тип: {data.inputType || 'текст'}</div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-destructive !border-2 !border-background" />
    </div>
  );
});

export const ConditionNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  return (
    <div className={`min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'border-warning shadow-lg' : 'border-border'}`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-warning !border-2 !border-background" />
      
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-warning/10 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center">
          <span className="text-xs font-bold text-warning-foreground">IF</span>
        </div>
        <span className="text-xs font-semibold text-warning">Условие</span>
      </div>

      <div className="p-3">
        <p className="text-sm text-foreground">
          {data.variable
            ? `${data.variable} ${data.operator || '='} "${data.value || ''}"`
            : <span className="text-muted-foreground italic">Настройте условие...</span>
          }
        </p>
      </div>

      <Handle type="source" id="yes" position={Position.Right} style={{ top: '35%' }} className="!w-3 !h-3 !bg-success !border-2 !border-background" />
      <Handle type="source" id="no" position={Position.Right} style={{ top: '65%' }} className="!w-3 !h-3 !bg-destructive !border-2 !border-background" />
      
      <div className="absolute right-[-28px] top-[26%] text-[10px] text-success font-bold">Да</div>
      <div className="absolute right-[-28px] top-[56%] text-[10px] text-destructive font-bold">Нет</div>
    </div>
  );
});

export const ActionNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const actionLabels: Record<string, string> = {
    sendForm: '📋 Отправить форму',
    sendMessage: '✉️ Сообщение',
    webhook: '🔗 Webhook',
  };

  return (
    <div className={`min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'border-purple-500 shadow-lg' : 'border-border'}`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-background" />
      
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-purple-500/10 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <span className="text-xs text-white">⚡</span>
        </div>
        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Действие</span>
      </div>

      <div className="p-3">
        <p className="text-sm text-foreground">
          {data.actionType
            ? actionLabels[data.actionType]
            : <span className="text-muted-foreground italic">Выберите действие...</span>
          }
        </p>
        {data.actionType === 'sendForm' && data.formId && (
          <div className="text-xs text-muted-foreground mt-1 truncate">Форма: {data.formId}</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-background" />
    </div>
  );
});

export const StartNode = memo(({ selected }: NodeProps<BotNodeData>) => {
  return (
    <div className={`min-w-[140px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'border-success shadow-lg' : 'border-border'}`}>
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-success/10">
        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
          <span className="text-xs text-white font-bold">▶</span>
        </div>
        <span className="text-sm font-semibold text-success">Старт</span>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-success !border-2 !border-background" />
    </div>
  );
});
