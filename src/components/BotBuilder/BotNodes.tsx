import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BotNodeData, SocialLink } from '@/types/bot';
import {
  MessageSquare, ChevronRight, Brain, Clock, Image, SlidersHorizontal,
  Shuffle, CornerDownRight, Languages, Youtube, Share2, Globe,
} from 'lucide-react';

// ─── Shared helpers ────────────────────────────────────────────────────────────

const NodeShell = ({
  selected,
  color,
  icon,
  label,
  children,
  handles = 'both',
}: {
  selected: boolean;
  color: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  handles?: 'both' | 'sourceOnly' | 'none';
}) => (
  <div
    className={`min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${
      selected ? `border-${color} shadow-lg` : 'border-border'
    }`}
    style={selected ? { borderColor: `hsl(var(--${color}))` } : {}}
  >
    {(handles === 'both') && (
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-background"
        style={{ background: `hsl(var(--${color}))` }}
      />
    )}
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border"
      style={{ background: `hsl(var(--${color}) / 0.1)` }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: `hsl(var(--${color}))` }}
      >
        {icon}
      </div>
      <span className="text-xs font-semibold" style={{ color: `hsl(var(--${color}))` }}>
        {label}
      </span>
    </div>
    <div className="p-3 space-y-2">{children}</div>
    {(handles === 'both' || handles === 'sourceOnly') && (
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-background"
        style={{ background: `hsl(var(--${color}))` }}
      />
    )}
  </div>
);

const EmptyText = ({ text }: { text: string }) => (
  <span className="text-muted-foreground italic">{text}</span>
);

// ─── Platform icons map ─────────────────────────────────────────────────────────

const platformEmoji: Record<string, string> = {
  telegram: '✈️',
  youtube: '▶️',
  instagram: '📸',
  tiktok: '🎵',
  twitter: '🐦',
  vk: '💬',
  facebook: '📘',
  website: '🌐',
  discord: '🎮',
  twitch: '🟣',
};

// ─── START ─────────────────────────────────────────────────────────────────────

export const StartNode = memo(({ selected }: NodeProps<BotNodeData>) => (
  <div
    className={`min-w-[140px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'shadow-lg' : 'border-border'}`}
    style={selected ? { borderColor: 'hsl(var(--success))' } : {}}
  >
    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'hsl(var(--success) / 0.1)' }}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--success))' }}>
        <span className="text-xs font-bold text-success-foreground">▶</span>
      </div>
      <span className="text-sm font-semibold" style={{ color: 'hsl(var(--success))' }}>Старт</span>
    </div>
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ background: 'hsl(var(--success))' }} />
  </div>
));

// ─── MESSAGE ───────────────────────────────────────────────────────────────────

export const MessageNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const buttons = data.buttons || [];
  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'shadow-lg' : 'border-border'}`}
      style={selected ? { borderColor: 'hsl(var(--primary))' } : {}}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ background: 'hsl(var(--primary))' }} />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary))' }}>
          <MessageSquare className="w-3 h-3 text-primary-foreground" />
        </div>
        <span className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>Сообщение</span>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-sm text-foreground whitespace-pre-wrap break-words min-h-[32px]">
          {data.text || <EmptyText text="Введите текст..." />}
        </p>
        {buttons.length > 0 && (
          <div className="space-y-1 pt-1">
            {buttons.map((btn, i) => (
              <div key={btn.id} className="relative">
                <div className="flex items-center gap-1 px-2 py-1.5 rounded bg-primary/10 border border-primary/20 mr-2">
                  <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-xs text-primary truncate flex-1">{btn.label}</span>
                  <span className="text-[9px] text-primary/50 font-mono">→{i}</span>
                </div>
                <Handle
                  type="source"
                  id={String(i)}
                  position={Position.Right}
                  className="!w-3 !h-3 !border-2 !border-background"
                  style={{ background: 'hsl(var(--primary))', position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {buttons.length === 0 && (
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ background: 'hsl(var(--primary))' }} />
      )}
    </div>
  );
});

// ─── MEDIA ─────────────────────────────────────────────────────────────────────

const mediaEmoji: Record<string, string> = { photo: '🖼️', video: '🎬', audio: '🎵', document: '📄', sticker: '😀' };

export const MediaNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="secondary" icon={<Image className="w-3 h-3 text-secondary-foreground" />} label="Медиа">
    <div className="flex items-center gap-2">
      <span className="text-2xl">{mediaEmoji[data.mediaType || 'photo']}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium capitalize">{data.mediaType || 'photo'}</p>
        {data.mediaUrl ? (
          <p className="text-xs text-muted-foreground truncate">{data.mediaUrl}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">URL не задан</p>
        )}
      </div>
    </div>
    {data.caption && <p className="text-xs text-muted-foreground truncate">{data.caption}</p>}
  </NodeShell>
));

// ─── USER INPUT ────────────────────────────────────────────────────────────────

export const UserInputNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="destructive" icon={<span className="text-xs text-destructive-foreground font-bold">?</span>} label="Ввод пользователя">
    <p className="text-sm text-foreground">
      {data.text || <EmptyText text="Вопрос..." />}
    </p>
    {data.variableName && (
      <div className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">→ {data.variableName}</div>
    )}
    <div className="text-xs text-muted-foreground">Тип: {data.inputType || 'текст'}</div>
  </NodeShell>
));

// ─── CONDITION ─────────────────────────────────────────────────────────────────

export const ConditionNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <div
    className={`relative min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'shadow-lg' : 'border-border'}`}
    style={selected ? { borderColor: 'hsl(var(--warning))' } : {}}
  >
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ background: 'hsl(var(--warning))' }} />
    <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border" style={{ background: 'hsl(var(--warning) / 0.1)' }}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--warning))' }}>
        <span className="text-xs font-bold text-warning-foreground">IF</span>
      </div>
      <span className="text-xs font-semibold" style={{ color: 'hsl(var(--warning))' }}>Условие</span>
    </div>
    <div className="p-3">
      <p className="text-sm text-foreground">
        {data.variable
          ? `${data.variable} ${data.operator || '='} "${data.value || ''}"`
          : <EmptyText text="Настройте условие..." />}
      </p>
    </div>
    <Handle type="source" id="yes" position={Position.Right} style={{ top: '35%', background: 'hsl(var(--success))' }} className="!w-3 !h-3 !border-2 !border-background" />
    <Handle type="source" id="no" position={Position.Right} style={{ top: '65%', background: 'hsl(var(--destructive))' }} className="!w-3 !h-3 !border-2 !border-background" />
    <div className="absolute text-[10px] font-bold pointer-events-none" style={{ color: 'hsl(var(--success))', right: '-28px', top: '26%' }}>Да</div>
    <div className="absolute text-[10px] font-bold pointer-events-none" style={{ color: 'hsl(var(--destructive))', right: '-28px', top: '56%' }}>Нет</div>
  </div>
));

// ─── ACTION ────────────────────────────────────────────────────────────────────

export const ActionNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const actionLabels: Record<string, string> = {
    sendForm: '📋 Отправить форму',
    sendMessage: '✉️ Сообщение',
    webhook: '🔗 Webhook',
    email: '📧 Email',
    saveToSheet: '📊 Google Sheets',
    postToSocial: '📱 Пост в соц. сеть',
  };
  return (
    <NodeShell selected={selected} color="accent" icon={<span className="text-xs">⚡</span>} label="Действие">
      <p className="text-sm text-foreground">
        {data.actionType ? actionLabels[data.actionType] : <EmptyText text="Выберите действие..." />}
      </p>
      {data.actionType === 'sendForm' && data.formId && (
        <div className="text-xs text-muted-foreground truncate">Форма: {data.formId}</div>
      )}
      {data.actionType === 'webhook' && data.webhookUrl && (
        <div className="text-xs text-muted-foreground truncate">{data.webhookUrl}</div>
      )}
    </NodeShell>
  );
});

// ─── AI CHAT ───────────────────────────────────────────────────────────────────

export const AiChatNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="primary" icon={<Brain className="w-3 h-3 text-primary-foreground" />} label="🤖 ИИ Ответ">
    <p className="text-xs text-muted-foreground line-clamp-2">
      {data.aiPrompt || <EmptyText text="Системный промпт..." />}
    </p>
    {data.aiResponseVar && (
      <div className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">→ {data.aiResponseVar}</div>
    )}
    <div className="text-xs text-muted-foreground">
      Модель: {data.aiModel ? data.aiModel.split('/')[1] : 'gemini-flash'}
    </div>
  </NodeShell>
));

// ─── DELAY ─────────────────────────────────────────────────────────────────────

export const DelayNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="muted-foreground" icon={<Clock className="w-3 h-3 text-primary-foreground" />} label="Задержка">
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-semibold">{data.delaySeconds ?? 3} сек</span>
    </div>
    {data.delayMessage && (
      <p className="text-xs text-muted-foreground truncate">"{data.delayMessage}"</p>
    )}
  </NodeShell>
));

// ─── VARIABLE ──────────────────────────────────────────────────────────────────

export const VariableNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const opLabel: Record<string, string> = { set: '=', increment: '+=', decrement: '-=', append: '+', clear: '∅' };
  return (
    <NodeShell selected={selected} color="secondary" icon={<SlidersHorizontal className="w-3 h-3 text-secondary-foreground" />} label="Переменная">
      <div className="font-mono text-sm">
        {data.varName ? (
          <span>{data.varName} <span className="text-primary font-bold">{opLabel[data.varOperation || 'set']}</span> {data.varValue || '""'}</span>
        ) : (
          <EmptyText text="Настройте операцию..." />
        )}
      </div>
    </NodeShell>
  );
});

// ─── RANDOMIZER ────────────────────────────────────────────────────────────────

export const RandomizerNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const count = (data.randWeights || [1, 1]).length;
  return (
    <div
      className={`relative min-w-[200px] max-w-[260px] rounded-xl border-2 shadow-md bg-card transition-all ${selected ? 'shadow-lg' : 'border-border'}`}
      style={selected ? { borderColor: 'hsl(var(--primary))' } : {}}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ background: 'hsl(var(--primary))' }} />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border bg-primary/10">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Shuffle className="w-3 h-3 text-primary-foreground" />
        </div>
        <span className="text-xs font-semibold text-primary">Рандомайзер</span>
      </div>
      <div className="p-3">
        <p className="text-sm text-muted-foreground">{count} ветки</p>
      </div>
      {(data.randWeights || [1, 1]).map((_, i) => (
        <Handle
          key={i}
          type="source"
          id={String(i)}
          position={Position.Right}
          style={{ top: `${((i + 0.5) / count) * 100}%`, background: 'hsl(var(--primary))' }}
          className="!w-3 !h-3 !border-2 !border-background"
        />
      ))}
    </div>
  );
});

// ─── JUMP ──────────────────────────────────────────────────────────────────────

export const JumpNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="muted-foreground" icon={<CornerDownRight className="w-3 h-3 text-primary-foreground" />} label="Переход" handles="none">
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ background: 'hsl(var(--primary))' }} />
    <p className="text-sm text-foreground">
      {data.jumpTarget ? `→ ${data.jumpTarget}` : <EmptyText text="Укажите цель..." />}
    </p>
  </NodeShell>
));

// ─── TRANSLATE ─────────────────────────────────────────────────────────────────

export const TranslateNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const langName: Record<string, string> = {
    auto: 'авто', ru: '🇷🇺 RU', en: '🇬🇧 EN', de: '🇩🇪 DE', fr: '🇫🇷 FR',
    es: '🇪🇸 ES', it: '🇮🇹 IT', zh: '🇨🇳 ZH', ja: '🇯🇵 JA', ar: '🇸🇦 AR',
    pt: '🇧🇷 PT', ko: '🇰🇷 KO', tr: '🇹🇷 TR', uk: '🇺🇦 UK', pl: '🇵🇱 PL',
  };
  return (
    <NodeShell selected={selected} color="primary" icon={<Languages className="w-3 h-3 text-primary-foreground" />} label="🌐 Перевод">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{langName[data.translateSourceLang || 'auto'] || 'авто'}</span>
        <span className="text-primary font-bold">→</span>
        <span className="font-medium">{langName[data.translateTargetLang || 'ru'] || data.translateTargetLang}</span>
      </div>
      {data.translateMode === 'userLang' && (
        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">По языку пользователя</div>
      )}
      {data.translateResultVar && (
        <div className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">→ {data.translateResultVar}</div>
      )}
    </NodeShell>
  );
});

// ─── YANDEX TRANSLATE ──────────────────────────────────────────────────────────

export const YandexTranslateNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const langName: Record<string, string> = {
    auto: 'авто', ru: '🇷🇺 RU', en: '🇬🇧 EN', de: '🇩🇪 DE', fr: '🇫🇷 FR',
    es: '🇪🇸 ES', it: '🇮🇹 IT', zh: '🇨🇳 ZH', ja: '🇯🇵 JA', ar: '🇸🇦 AR',
    pt: '🇧🇷 PT', ko: '🇰🇷 KO', tr: '🇹🇷 TR', uk: '🇺🇦 UK', pl: '🇵🇱 PL',
  };
  return (
    <NodeShell selected={selected} color="warning" icon={<Languages className="w-3 h-3 text-warning-foreground" />} label="🔴 Яндекс Переводчик">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{langName[data.yandexSourceLang || ''] || 'авто'}</span>
        <span className="text-yellow-500 font-bold">→</span>
        <span className="font-medium">{langName[data.yandexTargetLang || 'ru'] || data.yandexTargetLang}</span>
      </div>
      {data.yandexSourceVar && (
        <div className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">📥 {`{{${data.yandexSourceVar}}}`}</div>
      )}
      {data.yandexResultVar && (
        <div className="text-xs bg-yellow-500/10 px-2 py-1 rounded font-mono text-yellow-600">→ {data.yandexResultVar}</div>
      )}
    </NodeShell>
  );
});

// ─── LANG DETECT ───────────────────────────────────────────────────────────────

export const LangDetectNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="accent" icon={<Globe className="w-3 h-3 text-accent-foreground" />} label="🔍 Определить язык">
    <p className="text-xs text-muted-foreground">
      {data.langDetectVar ? (
        <>Анализ: <span className="font-mono text-foreground">{`{{${data.langDetectVar}}}`}</span></>
      ) : (
        <EmptyText text="Укажите переменную..." />
      )}
    </p>
    {data.langResultVar && (
      <div className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">→ {data.langResultVar}</div>
    )}
    {data.langSetAsDefault && (
      <div className="text-xs text-primary">✓ Установить как язык бота</div>
    )}
  </NodeShell>
));

// ─── YOUTUBE MONITOR ───────────────────────────────────────────────────────────

export const YoutubeMonitorNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="destructive" icon={<Youtube className="w-3 h-3 text-destructive-foreground" />} label="▶ YouTube Monitor">
    {data.ytChannelId || data.ytChannelUrl ? (
      <p className="text-xs text-muted-foreground truncate">{data.ytChannelId || data.ytChannelUrl}</p>
    ) : (
      <p className="text-xs"><EmptyText text="Канал не задан..." /></p>
    )}
    <div className="flex gap-1 flex-wrap">
      {data.ytNotifyVideos && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">📹 Видео</span>}
      {data.ytNotifyStreams && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">🔴 Стримы</span>}
      {data.ytNotifyPremiere && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">🎬 Премьеры</span>}
    </div>
    <div className="text-xs text-muted-foreground">
      Каждые {data.ytCheckInterval || 30} мин
    </div>
  </NodeShell>
));

// ─── SOCIAL SHARE ──────────────────────────────────────────────────────────────

export const SocialShareNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const links: SocialLink[] = data.shareLinks || [];
  return (
    <NodeShell selected={selected} color="primary" icon={<Share2 className="w-3 h-3 text-primary-foreground" />} label="📱 Соц. сети">
      {data.shareText && (
        <p className="text-xs text-muted-foreground line-clamp-2">{data.shareText}</p>
      )}
      {links.length > 0 ? (
        <div className="flex gap-1 flex-wrap">
          {links.map(l => (
            <span key={l.id} className="text-sm" title={l.label}>{platformEmoji[l.platform] || '🔗'}</span>
          ))}
        </div>
      ) : (
        <p className="text-xs"><EmptyText text="Добавьте ссылки..." /></p>
      )}
    </NodeShell>
  );
});

// ─── INSTAGRAM MONITOR ─────────────────────────────────────────────────────────

export const InstagramMonitorNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="destructive" icon={<span className="text-xs text-destructive-foreground font-bold">IG</span>} label="📸 Instagram Monitor">
    {data.igAccountUrl || data.igAccountId ? (
      <p className="text-xs text-muted-foreground truncate">{data.igAccountUrl || data.igAccountId}</p>
    ) : (
      <p className="text-xs"><EmptyText text="Аккаунт не задан..." /></p>
    )}
    <div className="flex gap-1 flex-wrap">
      {data.igNotifyPosts && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">📝 Посты</span>}
      {data.igNotifyReels && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">🎬 Reels</span>}
      {data.igNotifyLive && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">🔴 Live</span>}
    </div>
    {data.igTranslateContent && (
      <div className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">🌐 Авто-перевод</div>
    )}
    <div className="text-xs text-muted-foreground">Каждые {data.igCheckInterval || 30} мин</div>
  </NodeShell>
));

// ─── FACEBOOK MONITOR ──────────────────────────────────────────────────────────

export const FacebookMonitorNode = memo(({ data, selected }: NodeProps<BotNodeData>) => (
  <NodeShell selected={selected} color="primary" icon={<span className="text-xs text-primary-foreground font-bold">FB</span>} label="📘 Facebook Monitor">
    {data.fbPageUrl || data.fbPageId ? (
      <p className="text-xs text-muted-foreground truncate">{data.fbPageUrl || data.fbPageId}</p>
    ) : (
      <p className="text-xs"><EmptyText text="Страница не задана..." /></p>
    )}
    <div className="flex gap-1 flex-wrap">
      {data.fbNotifyPosts && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">📝 Посты</span>}
      {data.fbNotifyVideos && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">🎬 Видео</span>}
      {data.fbNotifyLive && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">🔴 Live</span>}
    </div>
    {data.fbTranslateContent && (
      <div className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">🌐 Авто-перевод</div>
    )}
    <div className="text-xs text-muted-foreground">Каждые {data.fbCheckInterval || 30} мин</div>
  </NodeShell>
));

// ─── USER LANG PREF ────────────────────────────────────────────────────────────

export const UserLangPrefNode = memo(({ data, selected }: NodeProps<BotNodeData>) => {
  const langs = data.ulpLanguages || ['ru', 'en'];
  const flagMap: Record<string, string> = {
    ru: '🇷🇺', en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸',
    it: '🇮🇹', zh: '🇨🇳', ja: '🇯🇵', ar: '🇸🇦', pt: '🇧🇷',
    ko: '🇰🇷', tr: '🇹🇷', uk: '🇺🇦', pl: '🇵🇱',
  };
  return (
    <NodeShell selected={selected} color="primary" icon={<span className="text-xs text-primary-foreground">🗣</span>} label="Выбор языка">
      <p className="text-xs text-muted-foreground line-clamp-2">
        {data.ulpQuestion || <EmptyText text="Вопрос о языке..." />}
      </p>
      <div className="flex gap-1 flex-wrap">
        {langs.map(l => (
          <span key={l} className="text-sm" title={l}>{flagMap[l] || l.toUpperCase()}</span>
        ))}
      </div>
      {data.ulpSaveVar && (
        <div className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">→ {data.ulpSaveVar}</div>
      )}
    </NodeShell>
  );
});
