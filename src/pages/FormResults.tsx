import { useParams, useNavigate } from 'react-router-dom';
import { useFormsStorage } from '@/hooks/useFormsStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ArrowLeft, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const FormResults = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getForm, getFormSubmissions } = useFormsStorage();
  const { t } = useLanguage();
  
  const form = getForm(formId!);
  const submissions = getFormSubmissions(formId!);

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">{t('formView.notFound')}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    
    const headers = ['ID', t('results.submittedAt'), ...form.fields.map(f => f.label), t('results.paymentAmount'), t('results.paymentMethod')];
    const rows = submissions.map(sub => {
      const row = [
        sub.id,
        format(sub.submittedAt, 'dd.MM.yyyy HH:mm'),
        ...form.fields.map(field => {
          const value = sub.responses[field.id];
          if (Array.isArray(value)) return value.join(', ');
          return String(value || '');
        }),
        sub.paymentAmount ? `${sub.paymentAmount} PLN` : '',
        sub.paymentMethod || '',
      ];
      return row.join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form.title}_results.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/form/${formId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{form.title}</h1>
              <p className="text-xs text-muted-foreground">{t('results.title')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={submissions.length === 0}>
              <Download className="w-4 h-4 mr-1" />
              {t('results.export')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('results.responses')}</span>
              <span className="text-base font-normal text-muted-foreground">
                {t('results.total')}: {submissions.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">{t('results.noResponses')}</p>
                <p className="text-sm">{t('results.noResponsesHint')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{t('results.submittedAt')}</TableHead>
                      {form.fields.slice(0, 5).map(field => (
                        <TableHead key={field.id} className="min-w-32">
                          {field.label}
                        </TableHead>
                      ))}
                      {form.paymentEnabled && (
                        <>
                          <TableHead>{t('results.paymentAmount')}</TableHead>
                          <TableHead>{t('results.paymentMethod')}</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub, index) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(sub.submittedAt, 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        {form.fields.slice(0, 5).map(field => {
                          const value = sub.responses[field.id];
                          return (
                            <TableCell key={field.id} className="max-w-48 truncate">
                              {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                            </TableCell>
                          );
                        })}
                        {form.paymentEnabled && (
                          <>
                            <TableCell>
                              {sub.paymentAmount ? `${sub.paymentAmount} PLN` : '-'}
                            </TableCell>
                            <TableCell className="uppercase">
                              {sub.paymentMethod || '-'}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FormResults;