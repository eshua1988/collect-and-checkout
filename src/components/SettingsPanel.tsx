import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Sun, Moon, Monitor, LogOut, User, Mail, Palette } from 'lucide-react';
import { toast } from 'sonner';
import type { User as SupaUser } from '@supabase/supabase-js';

interface SettingsPanelProps {
  user: SupaUser | null;
  onClose: () => void;
}

export function SettingsPanel({ user, onClose }: SettingsPanelProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Вы вышли из аккаунта');
    onClose();
  };

  const themeName = { light: 'Светлая', dark: 'Тёмная', system: 'Авто (системная)' };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 h-full bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-lg">Настройки</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Profile */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Профиль
            </h3>
            <div className="bg-muted/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.user_metadata?.full_name || 'Пользователь'}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 shrink-0" />
                    {user?.email || 'Нет email'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                Аккаунт создан: {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}
              </div>
            </div>
          </section>

          {/* Theme */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Тема оформления
            </h3>
            <div className="space-y-2">
              {([
                { value: 'light', label: 'Светлая', icon: Sun, desc: 'Всегда светлая тема' },
                { value: 'dark', label: 'Тёмная', icon: Moon, desc: 'Всегда тёмная тема' },
                { value: 'system', label: 'Авто', icon: Monitor, desc: 'Как на устройстве' },
              ] as const).map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    theme === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/30 hover:bg-accent/30'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${theme === value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  {theme === value && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">
              Сейчас активна: <span className="font-medium">{resolvedTheme === 'dark' ? 'тёмная' : 'светлая'}</span>
            </p>
          </section>

          {/* App info */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">О приложении</h3>
            <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Версия</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Формы</span>
                <span className="font-medium">✓ Активно</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telegram боты</span>
                <span className="font-medium">✓ Активно</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Документы</span>
                <span className="font-medium">✓ Активно</span>
              </div>
            </div>
          </section>
        </div>

        {/* Logout */}
        <div className="p-5 border-t">
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти из аккаунта
          </Button>
        </div>
      </div>
    </div>
  );
}
