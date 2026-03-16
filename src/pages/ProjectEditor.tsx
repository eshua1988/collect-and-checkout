import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsStorage } from '@/hooks/useProjectsStorage';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { useBotsStorage } from '@/hooks/useBotsStorage';
import { useDocsStorage } from '@/hooks/useDocsStorage';
import { AppProject } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft, Save, Plus, FileText, Bot, FileEdit,
  ExternalLink, Trash2, Check, X, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const gen = () => Math.random().toString(36).substring(2, 9);

const ICONS = ['🚀', '💼', '📊', '🎯', '🛒', '📋', '🤝', '💡', '📱', '🌐', '🎓', '❤️', '🏢', '⚡', '🔥'];
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

interface ProjectEditorProps {
  projectId?: string;
}

export default function ProjectEditor({ projectId }: ProjectEditorProps) {
  const navigate = useNavigate();
  const { getProject, saveProject } = useProjectsStorage();
  const { forms } = useFormsStorage();
  const { bots } = useBotsStorage();
  const { docs } = useDocsStorage();

  const existing = projectId && projectId !== 'new' ? getProject(projectId) : undefined;

  const [project, setProject] = useState<AppProject>(existing || {
    id: gen(),
    name: 'Новый проект',
    description: '',
    icon: '🚀',
    color: '#3b82f6',
    formIds: [],
    botIds: [],
    docIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [activeSection, setActiveSection] = useState<'forms' | 'bots' | 'docs' | null>(null);

  const toggleItem = (field: 'formIds' | 'botIds' | 'docIds', id: string) => {
    setProject(p => ({
      ...p,
      [field]: p[field].includes(id) ? p[field].filter(x => x !== id) : [...p[field], id],
    }));
  };

  const handleSave = () => {
    saveProject(project);
    toast.success('Проект сохранён');
    navigate('/');
  };

  const linkedForms = forms.filter(f => project.formIds.includes(f.id));
  const linkedBots = bots.filter(b => project.botIds.includes(b.id));
  const linkedDocs = docs.filter(d => project.docIds.includes(d.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{project.icon}</span>
              <Input
                className="border-0 shadow-none text-base font-semibold h-8 px-1 focus-visible:ring-0 max-w-[300px]"
                value={project.name}
                onChange={e => setProject(p => ({ ...p, name: e.target.value }))}
                placeholder="Название проекта..."
              />
            </div>
          </div>
          <Button size="sm" onClick={handleSave}><Save className="w-3.5 h-3.5 mr-1.5" />Сохранить</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left – project settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Настройки проекта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Описание</label>
                  <Textarea
                    placeholder="Описание проекта..."
                    className="resize-none text-sm"
                    rows={3}
                    value={project.description || ''}
                    onChange={e => setProject(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Иконка</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setProject(p => ({ ...p, icon }))}
                        className={`w-9 h-9 text-lg rounded-lg border-2 flex items-center justify-center transition-all ${project.icon === icon ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/40'}`}
                      >{icon}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Цвет акцента</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setProject(p => ({ ...p, color }))}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${project.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { count: linkedForms.length, label: 'Форм', icon: FileText, color: 'text-blue-500' },
                    { count: linkedBots.length, label: 'Ботов', icon: Bot, color: 'text-violet-500' },
                    { count: linkedDocs.length, label: 'Докум.', icon: FileEdit, color: 'text-emerald-500' },
                  ].map(({ count, label, icon: Icon, color }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right – linked items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Forms section */}
            <SectionCard
              title="Формы"
              icon={<FileText className="w-4 h-4 text-blue-500" />}
              count={linkedForms.length}
              totalCount={forms.length}
              open={activeSection === 'forms'}
              onToggle={() => setActiveSection(s => s === 'forms' ? null : 'forms')}
              onNew={() => navigate('/form/new')}
              newLabel="Новая форма"
            >
              {activeSection === 'forms' && (
                <div className="space-y-2 pt-2">
                  {forms.length === 0 ? (
                    <EmptyState label="Нет форм" hint="Создайте первую форму" />
                  ) : forms.map(f => (
                    <SelectableItem
                      key={f.id}
                      selected={project.formIds.includes(f.id)}
                      onToggle={() => toggleItem('formIds', f.id)}
                      title={f.title}
                      badge={f.published ? 'Опубликована' : 'Черновик'}
                      badgeOk={f.published}
                      meta={`${f.fields.length} полей`}
                      onOpen={() => navigate(`/form/${f.id}`)}
                    />
                  ))}
                </div>
              )}
              {linkedForms.length > 0 && activeSection !== 'forms' && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {linkedForms.map(f => (
                    <span key={f.id} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                      {f.title}
                    </span>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Bots section */}
            <SectionCard
              title="Telegram Боты"
              icon={<Bot className="w-4 h-4 text-violet-500" />}
              count={linkedBots.length}
              totalCount={bots.length}
              open={activeSection === 'bots'}
              onToggle={() => setActiveSection(s => s === 'bots' ? null : 'bots')}
              onNew={() => navigate('/bot/new')}
              newLabel="Новый бот"
            >
              {activeSection === 'bots' && (
                <div className="space-y-2 pt-2">
                  {bots.length === 0 ? (
                    <EmptyState label="Нет ботов" hint="Создайте первого бота" />
                  ) : bots.map(b => (
                    <SelectableItem
                      key={b.id}
                      selected={project.botIds.includes(b.id)}
                      onToggle={() => toggleItem('botIds', b.id)}
                      title={b.name}
                      badge={b.token ? 'Настроен' : 'Нет токена'}
                      badgeOk={!!b.token}
                      meta={`${b.nodes.length} узлов`}
                      onOpen={() => navigate(`/bot/${b.id}`)}
                    />
                  ))}
                </div>
              )}
              {linkedBots.length > 0 && activeSection !== 'bots' && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {linkedBots.map(b => (
                    <span key={b.id} className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full border border-violet-200 dark:border-violet-800">
                      🤖 {b.name}
                    </span>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Docs section */}
            <SectionCard
              title="Документы и Таблицы"
              icon={<FileEdit className="w-4 h-4 text-emerald-500" />}
              count={linkedDocs.length}
              totalCount={docs.length}
              open={activeSection === 'docs'}
              onToggle={() => setActiveSection(s => s === 'docs' ? null : 'docs')}
              onNew={() => navigate('/doc/new')}
              newLabel="Новый документ"
            >
              {activeSection === 'docs' && (
                <div className="space-y-2 pt-2">
                  {docs.length === 0 ? (
                    <EmptyState label="Нет документов" hint="Создайте первый документ" />
                  ) : docs.map(d => (
                    <SelectableItem
                      key={d.id}
                      selected={project.docIds.includes(d.id)}
                      onToggle={() => toggleItem('docIds', d.id)}
                      title={d.title}
                      badge={d.published ? 'Опубликован' : 'Черновик'}
                      badgeOk={d.published}
                      meta={`${d.blocks.length} блоков`}
                      onOpen={() => navigate(`/doc/${d.id}`)}
                    />
                  ))}
                </div>
              )}
              {linkedDocs.length > 0 && activeSection !== 'docs' && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {linkedDocs.map(d => (
                    <span key={d.id} className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                      📄 {d.title}
                    </span>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Summary card */}
            {(linkedForms.length + linkedBots.length + linkedDocs.length) > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">Объединённый проект «{project.name}»</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {linkedForms.map(f => (
                      <a key={f.id} href={f.published ? `/f/${f.id}` : '#'} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 p-2 bg-background rounded-lg border hover:border-primary/30 truncate">
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate text-xs">{f.title}</span>
                      </a>
                    ))}
                    {linkedBots.map(b => (
                      <div key={b.id} className="flex items-center gap-1.5 p-2 bg-background rounded-lg border truncate">
                        <Bot className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span className="truncate text-xs">🤖 {b.name}</span>
                      </div>
                    ))}
                    {linkedDocs.map(d => (
                      <a key={d.id} href={d.published ? `/d/${d.id}` : '#'} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 p-2 bg-background rounded-lg border hover:border-primary/30 truncate">
                        <FileEdit className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate text-xs">{d.title}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionCard({ title, icon, count, totalCount, open, onToggle, onNew, newLabel, children }: {
  title: string; icon: React.ReactNode; count: number; totalCount: number;
  open: boolean; onToggle: () => void; onNew: () => void; newLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={`transition-all ${open ? 'border-primary/40 shadow-sm' : ''}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
            {count > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">{count}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={e => { e.stopPropagation(); onNew(); }}>
              <Plus className="w-3 h-3 mr-1" />{newLabel}
            </Button>
            <span className="text-xs text-muted-foreground">{totalCount} доступно</span>
            <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
          </div>
        </div>
      </CardHeader>
      {children && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

function SelectableItem({ selected, onToggle, title, badge, badgeOk, meta, onOpen }: {
  selected: boolean; onToggle: () => void; title: string;
  badge: string; badgeOk: boolean; meta: string; onOpen: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
      selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-accent/20'
    }`} onClick={onToggle}>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'bg-primary border-primary' : 'border-muted-foreground'
      }`}>
        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${badgeOk ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{badge}</span>
      <button className="text-muted-foreground hover:text-primary" onClick={e => { e.stopPropagation(); onOpen(); }}>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function EmptyState({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs">{hint}</p>
    </div>
  );
}
