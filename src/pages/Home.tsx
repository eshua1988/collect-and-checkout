import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { useBotsStorage } from '@/hooks/useBotsStorage';
import { useDocsStorage } from '@/hooks/useDocsStorage';
import { useProjectsStorage } from '@/hooks/useProjectsStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Plus, Trash2, BarChart3, Copy, Link, ExternalLink, Bot, Settings, FileEdit, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Home = () => {
  const navigate = useNavigate();
  const { forms, deleteForm, togglePublish } = useFormsStorage();
  const { bots, deleteBot } = useBotsStorage();
  const { docs, deleteDoc, togglePublish: toggleDocPublish } = useDocsStorage();
  const { projects, deleteProject } = useProjectsStorage();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'forms' | 'bots' | 'docs' | 'projects'>('forms');
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleDeleteForm = (formId: string) => {
    if (window.confirm(t('home.confirmDelete'))) {
      deleteForm(formId);
      toast.success(t('home.formDeleted'));
    }
  };

  const handlePublish = (formId: string) => {
    const form = togglePublish(formId);
    if (form?.published) toast.success(t('home.formPublished'));
    else toast.info(t('home.formUnpublished'));
  };

  const handleCopyLink = (formId: string) => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    toast.success(t('home.linkCopied'));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{t('header.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('header.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {tab === 'forms' && (
              <Button onClick={() => navigate('/form/new')}>
                <Plus className="w-4 h-4 mr-2" />
                {t('home.newForm')}
              </Button>
            )}
            {tab === 'bots' && (
              <Button onClick={() => navigate('/bot/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Новый бот
              </Button>
            )}
            {tab === 'docs' && (
              <Button onClick={() => navigate('/doc/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Новый документ
              </Button>
            )}
            {tab === 'projects' && (
              <Button onClick={() => navigate('/project/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Объединить
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('forms')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'forms' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4" />
              {t('home.myForms')}
              {forms.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">{forms.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('docs')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'docs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              Документы
              {docs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">{docs.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('bots')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'bots' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-4 h-4" />
              Telegram Боты
              {bots.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">{bots.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* FORMS TAB */}
        {tab === 'forms' && (
          <>
            <h2 className="text-2xl font-bold mb-6">{t('home.myForms')}</h2>
            {forms.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-medium mb-2">{t('home.noForms')}</h3>
                  <p className="text-muted-foreground mb-6">{t('home.noFormsHint')}</p>
                  <Button onClick={() => navigate('/form/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('home.createFirst')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {forms.map((form) => (
                  <Card key={form.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{form.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {form.description || t('home.noDescription')}
                          </CardDescription>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full shrink-0 ml-2 ${
                          form.published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                          {form.published ? t('home.published') : t('home.draft')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <span>{t('home.fields')}: {form.fields.length}</span>
                        <span>•</span>
                        <span>{t('home.updated')}: {format(form.updatedAt, 'dd.MM.yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/form/${form.id}`)}>
                          {t('home.edit')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/form/${form.id}/results`)}>
                          <BarChart3 className="w-4 h-4 mr-1" />
                          {t('home.results')}
                        </Button>
                        <Button
                          variant={form.published ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePublish(form.id)}
                        >
                          <Link className="w-4 h-4 mr-1" />
                          {form.published ? t('home.unpublish') : t('home.publish')}
                        </Button>
                        {form.published && (
                          <>
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => handleCopyLink(form.id)}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => window.open(`/f/${form.id}`, '_blank')}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive ml-auto"
                          onClick={() => handleDeleteForm(form.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* DOCS TAB */}
        {tab === 'docs' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Мои Документы</h2>
            <div className="mb-6 rounded-xl bg-primary/5 border border-primary/20 p-4 flex gap-3">
              <div className="text-2xl shrink-0">📄</div>
              <div>
                <p className="font-medium text-sm mb-1">Конструктор документов, форм и таблиц</p>
                <p className="text-xs text-muted-foreground">
                  Создавайте документы, заполняемые формы и таблицы. 18+ готовых шаблонов. Экспорт в PDF и HTML. Подписи, изображения, видео.
                </p>
              </div>
            </div>
            {docs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <FileEdit className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-medium mb-2">Нет документов</h3>
                  <p className="text-muted-foreground mb-6">Создайте первый документ или выберите готовый шаблон</p>
                  <Button onClick={() => navigate('/doc/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать документ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <Card key={doc.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {doc.blocks.length} блоков{doc.allowFill ? ' · Форма для заполнения' : ''}
                          </CardDescription>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full shrink-0 ml-2 ${
                          doc.published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                          {doc.published ? 'Опубликован' : 'Черновик'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <span>Обновлён: {format(doc.updatedAt, 'dd.MM.yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/doc/${doc.id}`)}>
                          Редактировать
                        </Button>
                        <Button
                          variant={doc.published ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const updated = toggleDocPublish(doc.id);
                            if (updated?.published) {
                              const url = `${window.location.origin}/d/${doc.id}`;
                              navigator.clipboard.writeText(url);
                              toast.success('Опубликован! Ссылка скопирована');
                            } else {
                              toast.info('Документ снят с публикации');
                            }
                          }}
                        >
                          <Link className="w-4 h-4 mr-1" />
                          {doc.published ? 'Снять' : 'Публиковать'}
                        </Button>
                        {doc.published && (
                          <>
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/d/${doc.id}`);
                              toast.success('Ссылка скопирована');
                            }}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => window.open(`/d/${doc.id}`, '_blank')}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive ml-auto"
                          onClick={() => { if (window.confirm('Удалить документ?')) { deleteDoc(doc.id); toast.success('Документ удалён'); } }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* BOTS TAB */}
        {tab === 'bots' && (
          <>
            <h2 className="text-2xl font-bold mb-6">Мои Telegram Боты</h2>

            {/* Tip banner */}
            <div className="mb-6 rounded-xl bg-primary/5 border border-primary/20 p-4 flex gap-3">
              <div className="text-2xl shrink-0">🤖</div>
              <div>
                <p className="font-medium text-sm mb-1">Конструктор Telegram-ботов</p>
                <p className="text-xs text-muted-foreground">
                  Создавайте визуальные сценарии диалогов. Подключите бота к своим формам — 
                  он будет автоматически отправлять ссылки пользователям и уведомлять вас об ответах.
                </p>
              </div>
            </div>

            {bots.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-medium mb-2">Нет ботов</h3>
                  <p className="text-muted-foreground mb-6">Создайте первого Telegram-бота и подключите его к формам</p>
                  <Button onClick={() => navigate('/bot/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать бота
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                  <Card key={bot.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">🤖</div>
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{bot.name}</CardTitle>
                            {bot.username && (
                              <CardDescription className="text-xs">@{bot.username}</CardDescription>
                            )}
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full shrink-0 ml-2 ${bot.token ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {bot.token ? 'Настроен' : 'Нет токена'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <span>Узлов: {bot.nodes.length}</span>
                        <span>•</span>
                        <span>Обновлён: {format(bot.updatedAt, 'dd.MM.yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/bot/${bot.id}`)}>
                          <Settings className="w-3.5 h-3.5 mr-1" />
                          Настроить
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { navigate(`/bot/${bot.id}`); }}>
                          Поток
                        </Button>
                        {bot.username && (
                          <Button variant="outline" size="sm" onClick={() => window.open(`https://t.me/${bot.username}`, '_blank')}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Открыть
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive ml-auto"
                          onClick={() => { if (window.confirm('Удалить этого бота?')) { deleteBot(bot.id); toast.success('Бот удалён'); } }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
