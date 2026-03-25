import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { useBotsStorage } from '@/hooks/useBotsStorage';
import { useDocsStorage } from '@/hooks/useDocsStorage';
import { useProjectsStorage } from '@/hooks/useProjectsStorage';
import { useWebsitesStorage } from '@/hooks/useWebsitesStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FileText, Plus, Trash2, BarChart3, Copy, Link, ExternalLink,
  Bot, Settings, FileEdit, Layers, Globe, Menu, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type TabKey = 'forms' | 'bots' | 'docs' | 'projects' | 'websites';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'forms',    label: 'Формы',    icon: <FileText className="w-4 h-4" /> },
  { key: 'docs',     label: 'Документы', icon: <FileEdit className="w-4 h-4" /> },
  { key: 'bots',     label: 'Боты',     icon: <Bot className="w-4 h-4" /> },
  { key: 'projects', label: 'Проекты',  icon: <Layers className="w-4 h-4" /> },
  { key: 'websites', label: 'Сайты',    icon: <Globe className="w-4 h-4" /> },
];

const Home = () => {
  const navigate = useNavigate();
  const { forms, deleteForm, togglePublish } = useFormsStorage();
  const { bots, deleteBot } = useBotsStorage();
  const { docs, deleteDoc, togglePublish: toggleDocPublish } = useDocsStorage();
  const { projects, deleteProject } = useProjectsStorage();
  const { websites, deleteWebsite, togglePublish: toggleSitePublish } = useWebsitesStorage();
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabKey>('forms');
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const getCounts = () => ({
    forms: forms.length,
    docs: docs.length,
    bots: bots.length,
    projects: projects.length,
    websites: websites.length,
  });

  const counts = getCounts();

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

  const newRoutes: Record<TabKey, string> = {
    forms: '/form/new',
    bots: '/bot/new',
    docs: '/doc/new',
    projects: '/project/new',
    websites: '/site/new',
  };

  const newLabels: Record<TabKey, string> = {
    forms: t('home.newForm'),
    bots: 'Новый бот',
    docs: 'Новый документ',
    projects: 'Объединить',
    websites: 'Новый сайт',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-base sm:text-lg leading-tight">{t('header.title')}</h1>
              <p className="text-xs text-muted-foreground hidden md:block">{t('header.subtitle')}</p>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* New item button — desktop */}
            <Button
              size="sm"
              className="hidden sm:flex"
              onClick={() => navigate(newRoutes[tab])}
            >
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden md:inline">{newLabels[tab]}</span>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-9 sm:h-9" onClick={() => setShowSettings(true)} title="Настройки">
              <Settings className="w-4 h-4" />
            </Button>

            {/* User avatar */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center font-bold text-primary text-xs sm:text-sm transition-colors"
              title="Профиль"
            >
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </button>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-card px-3 pb-3 space-y-2">
            <LanguageSwitcher />
            <Button className="w-full" onClick={() => { navigate(newRoutes[tab]); setMobileMenuOpen(false); }}>
              <Plus className="w-4 h-4 mr-2" />
              {newLabels[tab]}
            </Button>
          </div>
        )}
      </header>

      {/* Settings Panel */}
      {showSettings && <SettingsPanel user={user} onClose={() => setShowSettings(false)} />}

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="border-b bg-card overflow-x-auto">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex gap-0 min-w-max sm:min-w-0">
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setMobileMenuOpen(false); }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {icon}
                <span className="hidden xs:inline sm:inline">{label}</span>
                {counts[key] > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">{counts[key]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">

        {/* FORMS TAB */}
        {tab === 'forms' && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('home.myForms')}</h2>
            {forms.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 sm:py-16 text-center">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg sm:text-xl font-medium mb-2">{t('home.noForms')}</h3>
                  <p className="text-muted-foreground mb-6 text-sm">{t('home.noFormsHint')}</p>
                  <Button onClick={() => navigate('/form/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('home.createFirst')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {forms.map((form) => (
                  <Card key={form.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">{form.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1 text-xs sm:text-sm">
                            {form.description || t('home.noDescription')}
                          </CardDescription>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full shrink-0 ${
                          form.published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                          {form.published ? t('home.published') : t('home.draft')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span>{t('home.fields')}: {form.fields.length}</span>
                        <span>•</span>
                        <span>{t('home.updated')}: {format(form.updatedAt, 'dd.MM.yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate(`/form/${form.id}`)}>
                          {t('home.edit')}
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate(`/form/${form.id}/results`)}>
                          <BarChart3 className="w-3.5 h-3.5 mr-1" />
                          {t('home.results')}
                        </Button>
                        <Button
                          variant={form.published ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={() => handlePublish(form.id)}
                        >
                          <Link className="w-3.5 h-3.5 mr-1" />
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
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Мои Документы</h2>
            <div className="mb-4 sm:mb-6 rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 flex gap-3">
              <div className="text-xl sm:text-2xl shrink-0">📄</div>
              <div>
                <p className="font-medium text-xs sm:text-sm mb-1">Конструктор документов, форм и таблиц</p>
                <p className="text-xs text-muted-foreground">
                  Создавайте документы, заполняемые формы и таблицы. 18+ готовых шаблонов. Экспорт в PDF и HTML.
                </p>
              </div>
            </div>
            {docs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 sm:py-16 text-center">
                  <FileEdit className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg sm:text-xl font-medium mb-2">Нет документов</h3>
                  <p className="text-muted-foreground mb-6 text-sm">Создайте первый документ или выберите готовый шаблон</p>
                  <Button onClick={() => navigate('/doc/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать документ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <Card key={doc.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">{doc.title}</CardTitle>
                          <CardDescription className="mt-1 text-xs sm:text-sm">
                            {doc.blocks.length} блоков{doc.allowFill ? ' · Форма для заполнения' : ''}
                          </CardDescription>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full shrink-0 ${
                          doc.published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                          {doc.published ? 'Опубликован' : 'Черновик'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span>Обновлён: {format(doc.updatedAt, 'dd.MM.yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate(`/doc/${doc.id}`)}>
                          Редактировать
                        </Button>
                        <Button
                          variant={doc.published ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs sm:text-sm"
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
                          <Link className="w-3.5 h-3.5 mr-1" />
                          {doc.published ? 'Снять' : 'Публиковать'}
                        </Button>
                        {doc.published && (
                          <>
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/d/${doc.id}`); toast.success('Ссылка скопирована'); }}>
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
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Мои Telegram Боты</h2>
            <div className="mb-4 sm:mb-6 rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 flex gap-3">
              <div className="text-xl sm:text-2xl shrink-0">🤖</div>
              <div>
                <p className="font-medium text-xs sm:text-sm mb-1">Конструктор Telegram-ботов</p>
                <p className="text-xs text-muted-foreground">
                  Создавайте визуальные сценарии диалогов. Подключите бота к своим формам — он будет автоматически отправлять ссылки и уведомлять об ответах.
                </p>
              </div>
            </div>
            {bots.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 sm:py-16 text-center">
                  <Bot className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg sm:text-xl font-medium mb-2">Нет ботов</h3>
                  <p className="text-muted-foreground mb-6 text-sm">Создайте первого Telegram-бота и подключите его к формам</p>
                  <Button onClick={() => navigate('/bot/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать бота
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                  <Card key={bot.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg sm:text-xl shrink-0">🤖</div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base truncate">{bot.name}</CardTitle>
                            {bot.username && (
                              <CardDescription className="text-xs">@{bot.username}</CardDescription>
                            )}
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full shrink-0 ${bot.token ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {bot.token ? 'Настроен' : 'Нет токена'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span>Узлов: {bot.nodes.length}</span>
                        <span>•</span>
                        <span>Обновлён: {format(bot.updatedAt, 'dd.MM.yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate(`/bot/${bot.id}`)}>
                          <Settings className="w-3.5 h-3.5 mr-1" />
                          Настроить
                        </Button>
                        {bot.username && (
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => window.open(`https://t.me/${bot.username}`, '_blank')}>
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

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Объединённые проекты</h2>
            <div className="mb-4 sm:mb-6 rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 flex gap-3">
              <div className="text-xl sm:text-2xl shrink-0">🔗</div>
              <div>
                <p className="font-medium text-xs sm:text-sm mb-1">Объединитель форм, ботов и документов</p>
                <p className="text-xs text-muted-foreground">
                  Создайте проект и объедините в нём формы, Telegram-боты и документы.
                </p>
              </div>
            </div>
            {projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 sm:py-16 text-center">
                  <Layers className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg sm:text-xl font-medium mb-2">Нет проектов</h3>
                  <p className="text-muted-foreground mb-6 text-sm">Создайте первый проект, объединив формы, бота и документы</p>
                  <Button onClick={() => navigate('/project/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать проект
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 border"
                            style={{ backgroundColor: (project.color || '#3b82f6') + '20', borderColor: (project.color || '#3b82f6') + '40' }}>
                            {project.icon || '🚀'}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base truncate">{project.name}</CardTitle>
                            {project.description && (
                              <CardDescription className="line-clamp-1 text-xs mt-0.5">{project.description}</CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        {project.formIds.length > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-blue-500" />{project.formIds.length} форм</span>}
                        {project.botIds.length > 0 && <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-violet-500" />{project.botIds.length} ботов</span>}
                        {project.docIds.length > 0 && <span className="flex items-center gap-1"><FileEdit className="w-3 h-3 text-emerald-500" />{project.docIds.length} докум.</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate(`/project/${project.id}`)}>
                          Редактировать
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive ml-auto"
                          onClick={() => { if (window.confirm('Удалить проект?')) { deleteProject(project.id); toast.success('Проект удалён'); } }}
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

        {/* WEBSITES TAB */}
        {tab === 'websites' && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Мои Сайты</h2>
            <div className="mb-4 sm:mb-6 rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 flex gap-3">
              <div className="text-xl sm:text-2xl shrink-0">🌐</div>
              <div>
                <p className="font-medium text-xs sm:text-sm mb-1">Конструктор сайтов</p>
                <p className="text-xs text-muted-foreground">
                  Создавайте полноценные сайты из блоков. 8+ готовых шаблонов. Публикация по ссылке.
                </p>
              </div>
            </div>
            {websites.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 sm:py-16 text-center">
                  <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg sm:text-xl font-medium mb-2">Нет сайтов</h3>
                  <p className="text-muted-foreground mb-6 text-sm">Создайте первый сайт или выберите готовый шаблон</p>
                  <Button onClick={() => navigate('/site/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать сайт
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {websites.map((site) => (
                  <Card key={site.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg sm:text-xl shrink-0">🌐</div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base truncate">{site.name}</CardTitle>
                            <CardDescription className="text-xs">{site.blocks.length} блоков</CardDescription>
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full shrink-0 ${site.published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {site.published ? 'Опубликован' : 'Черновик'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span>Обновлён: {format(site.updatedAt, 'dd.MM.yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate(`/site/edit/${site.id}`)}>
                          Редактировать
                        </Button>
                        <Button
                          variant={site.published ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={() => {
                            const updated = toggleSitePublish(site.id);
                            if (updated?.published) {
                              const url = `${window.location.origin}/site/${site.id}`;
                              navigator.clipboard.writeText(url).catch(() => {});
                              toast.success('Опубликован! Ссылка скопирована');
                            } else {
                              toast.info('Сайт снят с публикации');
                            }
                          }}
                        >
                          <Link className="w-3.5 h-3.5 mr-1" />
                          {site.published ? 'Снять' : 'Публиковать'}
                        </Button>
                        {site.published && (
                          <>
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/site/${site.id}`); toast.success('Ссылка скопирована'); }}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => window.open(`/site/${site.id}`, '_blank')}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive ml-auto"
                          onClick={() => { if (window.confirm('Удалить сайт?')) { deleteWebsite(site.id); toast.success('Сайт удалён'); } }}
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
