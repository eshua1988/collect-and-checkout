import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'login' | 'register' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return toast.error('Заполните все поля');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Добро пожаловать!');
  };

  const handleRegister = async () => {
    if (!email || !password || !name) return toast.error('Заполните все поля');
    if (password.length < 6) return toast.error('Пароль минимум 6 символов');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Регистрация успешна! Проверьте почту для подтверждения.');
      setMode('login');
    }
  };

  const handleForgot = async () => {
    if (!email) return toast.error('Введите email');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Ссылка для сброса отправлена на почту');
  };

  const submit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">FormBot Studio</h1>
          <p className="text-muted-foreground text-sm mt-1">Формы, боты и документы в одном месте</p>
        </div>

        <Card className="shadow-xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {mode === 'login' ? 'Вход в аккаунт' : mode === 'register' ? 'Создать аккаунт' : 'Сброс пароля'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Введите данные для входа' : mode === 'register' ? 'Заполните форму регистрации' : 'Укажите email для получения ссылки'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-1">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} className="pr-10" />
                  <button className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            {mode === 'login' && (
              <div className="text-right">
                <button className="text-xs text-primary hover:underline" onClick={() => setMode('forgot')}>
                  Забыли пароль?
                </button>
              </div>
            )}
            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === 'login' ? 'Войти' : mode === 'register' ? 'Зарегистрироваться' : 'Отправить ссылку'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>Нет аккаунта? <button className="text-primary hover:underline font-medium" onClick={() => setMode('register')}>Зарегистрироваться</button></>
              ) : mode === 'register' ? (
                <>Уже есть аккаунт? <button className="text-primary hover:underline font-medium" onClick={() => setMode('login')}>Войти</button></>
              ) : (
                <button className="text-primary hover:underline font-medium" onClick={() => setMode('login')}>← Вернуться к входу</button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
