import { useParams } from 'react-router-dom';
import { useWebsitesStorage } from '@/hooks/useWebsitesStorage';
import { WebsitePreview } from '@/components/WebsiteBuilder/WebsitePreview';

export default function WebsiteView() {
  const { siteId } = useParams<{ siteId: string }>();
  const { getWebsite } = useWebsitesStorage();

  if (!siteId) return <div className="flex items-center justify-center min-h-screen">Сайт не найден</div>;

  const site = getWebsite(siteId);

  if (!site) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <div className="text-6xl mb-4">🌐</div>
      <h1 className="text-2xl font-bold mb-2">Сайт не найден</h1>
      <p className="text-muted-foreground">Возможно, сайт был удалён или ещё не опубликован</p>
    </div>
  );

  if (!site.published) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold mb-2">Сайт не опубликован</h1>
      <p className="text-muted-foreground">Этот сайт ещё не был опубликован</p>
    </div>
  );

  const hasPages = !!(site.pages && site.pages.length > 0);

  return (
    <>
      {site.seoTitle && <title>{site.seoTitle}</title>}
      <WebsitePreview
        blocks={site.blocks}
        pages={hasPages ? site.pages : undefined}
        globalStyles={site.globalStyles}
        translations={site.translations}
        languages={site.languages}
        defaultLanguage={site.defaultLanguage}
      />
    </>
  );
}
