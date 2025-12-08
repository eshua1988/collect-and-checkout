import { useNavigate } from 'react-router-dom';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Plus, Trash2, Eye, BarChart3, Copy, Link, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Home = () => {
  const navigate = useNavigate();
  const { forms, deleteForm, togglePublish } = useFormsStorage();
  const { t } = useLanguage();

  const handleCreateNew = () => {
    navigate('/form/new');
  };

  const handleEdit = (formId: string) => {
    navigate(`/form/${formId}`);
  };

  const handleViewResults = (formId: string) => {
    navigate(`/form/${formId}/results`);
  };

  const handleDelete = (formId: string) => {
    if (window.confirm(t('home.confirmDelete'))) {
      deleteForm(formId);
      toast.success(t('home.formDeleted'));
    }
  };

  const handlePublish = (formId: string) => {
    const form = togglePublish(formId);
    if (form?.published) {
      toast.success(t('home.formPublished'));
    } else {
      toast.info(t('home.formUnpublished'));
    }
  };

  const handleCopyLink = (formId: string) => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    toast.success(t('home.linkCopied'));
  };

  const handlePreview = (formId: string) => {
    window.open(`/f/${formId}`, '_blank');
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
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              {t('home.newForm')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">{t('home.myForms')}</h2>

        {forms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-medium mb-2">{t('home.noForms')}</h3>
              <p className="text-muted-foreground mb-6">{t('home.noFormsHint')}</p>
              <Button onClick={handleCreateNew}>
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
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      form.published 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted text-muted-foreground'
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
                    <Button variant="outline" size="sm" onClick={() => handleEdit(form.id)}>
                      {t('home.edit')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewResults(form.id)}>
                      <BarChart3 className="w-4 h-4 mr-1" />
                      {t('home.results')}
                    </Button>
                    <Button 
                      variant={form.published ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => handlePublish(form.id)}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      {form.published ? t('home.unpublish') : t('home.publish')}
                    </Button>
                    {form.published && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink(form.id)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePreview(form.id)}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(form.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;