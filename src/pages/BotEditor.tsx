import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBotsStorage } from '@/hooks/useBotsStorage';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { BotFlowEditor, type SidePanel } from '@/components/BotBuilder/BotFlowEditor';
import { TelegramBot } from '@/types/bot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, Eye, EyeOff, Info, ChevronRight, Rocket, CheckCircle2, AlertCircle, RefreshCw, StopCircle, Lightbulb, Layers, Play, Save } from 'lucide-react';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const generateId = () => Math.random().toString(36).substring(2, 9);

const BotEditor = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { getBot, saveBot } = useBotsStorage();
  const { forms } = useFormsStorage();

  const isNew = botId === 'new';
  const existing = !isNew ? getBot(botId!) : undefined;

  const [bot, setBot] = useState<TelegramBot>(() => existing || {
    id: generateId(),
    name: 'Новый бот',
    token: '',
    username: '',
    nodes: [],
    edges: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'flow'>('settings');
  const [saving, setSaving] = useState(false);

  // Telegram launch state
  type LaunchStatus = 'idle' | 'loading' | 'launched' | 'error';
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus>(
    existing?.isLaunched ? 'launched' : 'idle',
  );
  const [launchedBotName, setLaunchedBotName] = useState<string>(
    existing?.launchedBotName ?? '',
  );
  const [launchError, setLaunchError] = useState('');

  // Flow panel state lifted up so header buttons can control it
  const [flowSidePanel, setFlowSidePanel] = useState<SidePanel>(null);
  const flowSaveRef = useRef<(() => void) | null>(null);
  const toggleFlowPanel = (panel: Exclude<SidePanel, null>) => {
    setFlowSidePanel(prev => prev === panel ? null : panel);
  };

  const handleSaveBot = useCallback((updatedBot: TelegramBot) => {
    saveBot(updatedBot);
    setBot(updatedBot);
    if (isNew) navigate(`/bot/${updatedBot.id}`, { replace: true });
  }, [saveBot, isNew, navigate]);

  const handleSaveSettings = useCallback(() => {
    if (!bot.name.trim()) {
      toast.error('Введите название бота');
      return;
    }
    setSaving(true);
    try {
      saveBot({ ...bot, updatedAt: Date.now() });
      toast.success('Настройки бота сохранены!');
      if (isNew) navigate(`/bot/${bot.id}`, { replace: true });
    } catch (e) {
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  }, [bot, saveBot, isNew, navigate]);

  const handleGoToFlow = useCallback(() => {
    // Save first, then switch tab
    saveBot({ ...bot, updatedAt: Date.now() });
    if (isNew) navigate(`/bot/${bot.id}`, { replace: true });
    setActiveTab('flow');
  }, [bot, saveBot, isNew, navigate]);

  const handleLaunch = useCallback(async () => {
    if (!bot.token.trim()) {
      toast.error('Сначала введите Bot Token');
      return;
    }
    setLaunchStatus('loading');
    setLaunchError('');
    try {
      // Save settings first
      const savedBot = { ...bot, updatedAt: Date.now() };
      saveBot(savedBot);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-runner?action=setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:     bot.id,
          name:   bot.name,
          token:  bot.token,
          nodes:  bot.nodes,
          edges:  bot.edges,
          userId: '',
        }),
      });
      const data = await res.json();

      if (data.ok) {
        const bname = data.botName || '';
        setLaunchStatus('launched');
        setLaunchedBotName(bname);
        const updatedBot = { ...savedBot, isLaunched: true, launchedBotName: bname };
        saveBot(updatedBot);
        setBot(updatedBot);
        toast.success(`Бот ${bname} запущен в Telegram!`);
      } else {
        setLaunchStatus('error');
        setLaunchError(data.error || 'Неизвестная ошибка');
        toast.error(data.error || 'Ошибка запуска бота');
      }
    } catch (e: any) {
      setLaunchStatus('error');
      setLaunchError(e.message || 'Ошибка сети');
      toast.error('Ошибка соединения с сервером');
    }
  }, [bot, saveBot]);

  const handleStop = useCallback(async () => {
    if (!bot.token.trim()) return;
    setLaunchStatus('loading');
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/telegram-runner?action=stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bot.id, token: bot.token }),
      });
      const updatedBot = { ...bot, isLaunched: false, launchedBotName: '' };
      saveBot(updatedBot);
      setBot(updatedBot);
      setLaunchStatus('idle');
      setLaunchedBotName('');
      toast.success('Бот отключён от Telegram');
    } catch {
      setLaunchStatus('error');
      toast.error('Ошибка при остановке бота');
    }
  }, [bot, saveBot]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-3 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-lg flex items-center justify-center text-base sm:text-lg shrink-0">
              🤖
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold leading-tight text-sm sm:text-base truncate">{bot.name}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Telegram Bot Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-wrap justify-end">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm transition-colors ${activeTab === 'settings' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Настройки
              </button>
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm transition-colors ${activeTab === 'flow' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Поток
              </button>
            </div>
            {activeTab === 'flow' && (
              <>
                <Button size="sm" variant={flowSidePanel === 'tips' ? 'default' : 'outline'} onClick={() => toggleFlowPanel('tips')}>
                  <Lightbulb className="w-4 h-4 mr-1.5" />Подсказки
                </Button>
                <Button size="sm" variant={flowSidePanel === 'templates' ? 'default' : 'outline'} onClick={() => toggleFlowPanel('templates')}>
                  <Layers className="w-4 h-4 mr-1.5" />Шаблоны
                </Button>
                <Button size="sm" variant={flowSidePanel === 'simulator' ? 'default' : 'outline'} onClick={() => toggleFlowPanel('simulator')}>
                  <Play className="w-4 h-4 mr-1.5" />Симулятор
                </Button>
                <Button size="sm" onClick={() => flowSaveRef.current?.()}>
                  <Save className="w-4 h-4 mr-1.5" />Сохранить
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'settings' && (
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Настройки Telegram Бота
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* How-to banner */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2 text-sm">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-primary mb-1 text-xs sm:text-sm">Как создать бота</p>
                    <ol className="text-muted-foreground text-xs space-y-0.5 list-decimal list-inside">
                      <li>Откройте @BotFather в Telegram</li>
                      <li>Отправьте /newbot</li>
                      <li>Введите название и username бота</li>
                      <li>Скопируйте полученный токен сюда</li>
                    </ol>
                  </div>
                </div>

                {/* Bot name */}
                <div>
                  <Label htmlFor="bot-name">Название бота</Label>
                  <Input
                    id="bot-name"
                    value={bot.name}
                    onChange={e => setBot(b => ({ ...b, name: e.target.value }))}
                    placeholder="Мой Telegram Бот"
                    className="mt-1"
                  />
                </div>

                {/* Token */}
                <div>
                  <Label htmlFor="bot-token">Bot Token</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="bot-token"
                      type={showToken ? 'text' : 'password'}
                      value={bot.token}
                      onChange={e => setBot(b => ({ ...b, token: e.target.value }))}
                      placeholder="1234567890:AAFxxxxxxxx..."
                      className="font-mono text-sm"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowToken(v => !v)}>
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Получите токен у @BotFather</p>
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="bot-username">Username бота (необязательно)</Label>
                  <div className="flex mt-1">
                    <span className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">@</span>
                    <Input
                      id="bot-username"
                      value={bot.username || ''}
                      onChange={e => setBot(b => ({ ...b, username: e.target.value }))}
                      placeholder="my_awesome_bot"
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                {/* Capabilities */}
                <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-xs sm:text-sm">Что умеет ваш бот:</p>
                  <p>✅ Отправлять ссылки на ваши формы пользователям</p>
                  <p>✅ Получать уведомления об ответах</p>
                  <p>✅ Вести диалог по визуальному сценарию</p>
                  <p>✅ Спрашивать данные и сохранять в переменные</p>
                  <p>✅ Ветвить диалог по условиям</p>
                </div>

                {/* Save button */}
                <Button onClick={handleSaveSettings} className="w-full" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить настройки'}
                </Button>

                {/* Go to flow */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoToFlow}
                >
                  Перейти к конструктору потока
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                {/* ── Telegram Launch ───────────────────────────────────────── */}
                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-primary" />
                    Запуск в Telegram
                  </h3>

                  {/* Status indicator */}
                  {launchStatus === 'launched' && (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Бот активен{launchedBotName ? ` (${launchedBotName})` : ''}</span>
                    </div>
                  )}
                  {launchStatus === 'error' && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{launchError}</span>
                    </div>
                  )}
                  {launchStatus === 'idle' && (
                    <p className="text-xs text-muted-foreground">
                      После запуска бот начнёт отвечать в Telegram согласно построенному потоку.
                    </p>
                  )}

                  {/* Launch / Update / Stop buttons */}
                  {launchStatus !== 'launched' ? (
                    <Button
                      onClick={handleLaunch}
                      disabled={launchStatus === 'loading' || !bot.token.trim()}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {launchStatus === 'loading' ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Запуск...</>
                      ) : (
                        <><Rocket className="w-4 h-4 mr-2" />Запустить бота в Telegram</>
                      )}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleLaunch}
                        disabled={launchStatus === 'loading'}
                        variant="outline"
                        className="flex-1"
                      >
                        {launchStatus === 'loading' ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Обновить поток
                      </Button>
                      <Button
                        onClick={handleStop}
                        disabled={launchStatus === 'loading'}
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <StopCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="h-[calc(100vh-56px)]">
            {!bot.token ? (
              <div className="flex items-center justify-center h-full px-4">
                <div className="text-center space-y-3">
                  <div className="text-4xl">🤖</div>
                  <p className="text-muted-foreground text-sm">Сначала укажите токен бота в настройках</p>
                  <Button onClick={() => setActiveTab('settings')}>Перейти к настройкам</Button>
                </div>
              </div>
            ) : (
              <BotFlowEditor
                bot={bot}
                forms={forms}
                onSave={handleSaveBot}
                sidePanel={flowSidePanel}
                onSidePanelChange={setFlowSidePanel}
                saveRef={flowSaveRef}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BotEditor;
