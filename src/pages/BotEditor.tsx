import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBotsStorage } from '@/hooks/useBotsStorage';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { BotFlowEditor } from '@/components/BotBuilder/BotFlowEditor';
import { TelegramBot } from '@/types/bot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const generateId = () => Math.random().toString(36).substring(2, 9);

const BotEditor = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { getBot, saveBot } = useBotsStorage();
  const { forms } = useFormsStorage();

  const isNew = botId === 'new';
  const existing = !isNew ? getBot(botId!) : undefined;

  const [bot, setBot] = useState<TelegramBot>(existing || {
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

  const handleSaveBot = (updatedBot: TelegramBot) => {
    saveBot(updatedBot);
    setBot(updatedBot);
    if (isNew) navigate(`/bot/${updatedBot.id}`, { replace: true });
  };

  const handleSaveSettings = () => {
    saveBot(bot);
    toast.success('Настройки бота сохранены!');
    if (isNew) navigate(`/bot/${bot.id}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <h1 className="font-semibold leading-tight">{bot.name}</h1>
              <p className="text-xs text-muted-foreground">Telegram Bot Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 text-sm transition-colors ${activeTab === 'settings' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Настройки
              </button>
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-3 py-1.5 text-sm transition-colors ${activeTab === 'flow' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Поток
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'settings' && (
          <div className="container mx-auto px-4 py-6 max-w-xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Настройки Telegram Бота
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2 text-sm">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-primary mb-1">Как создать бота</p>
                    <ol className="text-muted-foreground text-xs space-y-0.5 list-decimal list-inside">
                      <li>Откройте @BotFather в Telegram</li>
                      <li>Отправьте /newbot</li>
                      <li>Введите название и username бота</li>
                      <li>Скопируйте полученный токен сюда</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <Label>Название бота</Label>
                  <Input
                    value={bot.name}
                    onChange={e => setBot(b => ({ ...b, name: e.target.value }))}
                    placeholder="Мой Telegram Бот"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Bot Token</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
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

                <div>
                  <Label>Username бота (необязательно)</Label>
                  <div className="flex mt-1">
                    <span className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">@</span>
                    <Input
                      value={bot.username || ''}
                      onChange={e => setBot(b => ({ ...b, username: e.target.value }))}
                      placeholder="my_awesome_bot"
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Что умеет ваш бот:</p>
                  <p>✅ Отправлять ссылки на ваши формы пользователям</p>
                  <p>✅ Получать уведомления об ответах</p>
                  <p>✅ Вести диалог по визуальному сценарию</p>
                  <p>✅ Спрашивать данные и сохранять в переменные</p>
                  <p>✅ Ветвить диалог по условиям</p>
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  Сохранить настройки
                </Button>

                {bot.token && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab('flow')}
                  >
                    Перейти к конструктору потока →
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="h-[calc(100vh-56px)]">
            {!bot.token ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="text-4xl">🤖</div>
                  <p className="text-muted-foreground">Сначала укажите токен бота в настройках</p>
                  <Button onClick={() => setActiveTab('settings')}>Перейти к настройкам</Button>
                </div>
              </div>
            ) : (
              <BotFlowEditor bot={bot} forms={forms} onSave={handleSaveBot} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BotEditor;
