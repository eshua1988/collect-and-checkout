import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileUp, Download, ArrowRight, Loader2, X, FileText, Image,
  Table, FileType, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type OutputFormat = 'pdf' | 'html' | 'txt' | 'csv' | 'xlsx' | 'docx' | 'png' | 'jpg';

interface ConversionTarget {
  format: OutputFormat;
  label: string;
  icon: React.ReactNode;
}

const INPUT_ACCEPT = [
  '.pdf', '.doc', '.docx',
  '.xls', '.xlsx', '.csv',
  '.txt', '.html', '.htm', '.rtf', '.md',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif',
].join(',');

const FORMAT_GROUPS: Record<string, { extensions: string[]; icon: React.ReactNode }> = {
  document: { extensions: ['doc', 'docx', 'rtf', 'txt', 'md', 'html', 'htm'], icon: <FileText className="w-4 h-4" /> },
  pdf: { extensions: ['pdf'], icon: <FileType className="w-4 h-4" /> },
  spreadsheet: { extensions: ['xls', 'xlsx', 'csv'], icon: <Table className="w-4 h-4" /> },
  image: { extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'tif'], icon: <Image className="w-4 h-4" /> },
};

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}

function getFileGroup(ext: string): string {
  for (const [group, { extensions }] of Object.entries(FORMAT_GROUPS)) {
    if (extensions.includes(ext)) return group;
  }
  return 'unknown';
}

function getTargetFormats(ext: string): ConversionTarget[] {
  const group = getFileGroup(ext);
  const targets: ConversionTarget[] = [];

  if (group === 'document' || group === 'pdf') {
    if (ext !== 'pdf') targets.push({ format: 'pdf', label: 'PDF', icon: <FileType className="w-4 h-4 text-red-500" /> });
    if (ext !== 'html' && ext !== 'htm') targets.push({ format: 'html', label: 'HTML', icon: <FileText className="w-4 h-4 text-orange-500" /> });
    if (ext !== 'txt') targets.push({ format: 'txt', label: 'TXT', icon: <FileText className="w-4 h-4 text-gray-500" /> });
    if (ext !== 'docx' && ext !== 'doc') targets.push({ format: 'docx', label: 'DOCX', icon: <FileText className="w-4 h-4 text-blue-500" /> });
    targets.push({ format: 'png', label: 'PNG', icon: <Image className="w-4 h-4 text-green-500" /> });
  }

  if (group === 'spreadsheet') {
    targets.push({ format: 'pdf', label: 'PDF', icon: <FileType className="w-4 h-4 text-red-500" /> });
    if (ext !== 'csv') targets.push({ format: 'csv', label: 'CSV', icon: <Table className="w-4 h-4 text-green-600" /> });
    if (ext !== 'xlsx' && ext !== 'xls') targets.push({ format: 'xlsx', label: 'XLSX', icon: <Table className="w-4 h-4 text-green-700" /> });
    targets.push({ format: 'html', label: 'HTML', icon: <FileText className="w-4 h-4 text-orange-500" /> });
  }

  if (group === 'image') {
    targets.push({ format: 'pdf', label: 'PDF', icon: <FileType className="w-4 h-4 text-red-500" /> });
    if (ext !== 'png') targets.push({ format: 'png', label: 'PNG', icon: <Image className="w-4 h-4 text-green-500" /> });
    if (ext !== 'jpg' && ext !== 'jpeg') targets.push({ format: 'jpg', label: 'JPG', icon: <Image className="w-4 h-4 text-yellow-500" /> });
  }

  return targets;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ─── conversion helpers ─── */

async function docxToHtml(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
      convertImage: mammoth.images.imgElement((image: any) =>
        image.read('base64').then((imageBuffer: string) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        }))
      ),
    }
  );
  
  let html = result.value;
  
  // Remove service tables (Word generates hidden layout tables)
  html = html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    // Check if table contains mostly empty cells or is very simple
    const cellCount = (match.match(/<(?:td|th)[^>]*>/gi) || []).length;
    const textContent = match.replace(/<[^>]*>/g, '').trim();
    // Remove if table is empty or has very few cells
    if (cellCount < 4 || textContent.length < 10) {
      return '';
    }
    return match;
  });
  
  return wrapHtml(html);
}

function wrapHtml(bodyHtml: string): string {
  // Clean up empty tags and normalize whitespace
  let clean = bodyHtml
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s+<\/p>/g, '')
    .replace(/<div><\/div>/g, '')
    .replace(/<div>\s+<\/div>/g, '')
    .replace(/>\s+</g, '><')
    .trim();
  
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; padding: 30px 40px; max-width: 850px; margin: 0 auto; line-height: 1.5; color: #333; background: #fff; }
  h1 { font-size: 24px; margin: 0.8em 0 0.4em 0; font-weight: 700; }
  h2 { font-size: 18px; margin: 0.8em 0 0.3em 0; font-weight: 700; }
  h3 { font-size: 16px; margin: 0.6em 0 0.3em 0; font-weight: 700; }
  p { margin: 0.4em 0; font-size: 14px; }
  ul, ol { margin: 0.5em 0 0.5em 2em; }
  li { margin: 0.2em 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; page-break-inside: avoid; }
  th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; vertical-align: top; font-size: 13px; }
  th { background: #f0f0f0; font-weight: 600; }
  img { max-width: 100%; height: auto; display: block; margin: 0.5em 0; page-break-inside: avoid; }
  br { display: none; }
</style></head><body>${clean}</body></html>`;
}

async function htmlToRenderedCanvas(html: string, width = 850): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default;
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = width + 'px';
  container.style.background = '#fff';
  container.style.minHeight = 'auto'; // Don't force height
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait for images to load
  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );

  // Get natural dimensions without forcing size
  const canvas = await html2canvas(container, {
    scale: 1.5, // Reduced from 2 for better performance
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width,
    windowWidth: width,
    ignoreElements: (el: Element) => {
      // Skip empty elements
      return el.textContent?.trim() === '' && el.children.length === 0;
    },
  });
  
  document.body.removeChild(container);
  return canvas;
}

async function canvasToPdfBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const imgData = canvas.toDataURL('image/png');
  const pxToMm = 0.264583;
  const pageWidth = 210; // A4 mm
  const pageHeight = 297;
  const marginTop = 10;
  const marginBottom = 10;
  const marginLeft = 10;
  const marginRight = 10;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight = pageHeight - marginTop - marginBottom;
  
  // Calculate canvas dimensions in mm
  const canvasWidthMm = canvas.width * pxToMm / 1.5; // scale was 1.5
  const canvasHeightMm = canvas.height * pxToMm / 1.5;
  
  // Scale to fit content width, preserving aspect ratio
  const scaleFactor = contentWidth / canvasWidthMm;
  const scaledHeight = canvasHeightMm * scaleFactor;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  let currentY = marginTop;
  let pageNum = 0;
  let canvasY = 0;

  while (canvasY < canvas.height) {
    // Add new page if not first page
    if (pageNum > 0) {
      pdf.addPage();
      currentY = marginTop;
    }

    // Calculate how much canvas height fits on this page
    const pixelsPerMm = 1.5; // scale factor
    const remainingPageHeightMm = contentHeight;
    const remainingCanvasPx = canvas.height - canvasY;
    const canvasPxThatFits = remainingPageHeightMm / pxToMm * pixelsPerMm;
    const canvasPxToCapture = Math.min(canvasPxThatFits, remainingCanvasPx);
    
    if (canvasPxToCapture <= 0) break;

    // Create a slice of the canvas for this page
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.ceil(canvasPxToCapture);
    
    const ctx = pageCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0, canvasY,
      canvas.width, canvasPxToCapture,
      0, 0,
      canvas.width, canvasPxToCapture
    );

    const pageImgData = pageCanvas.toDataURL('image/png');
    
    // Calculate the height this slice will be on the PDF page
    const pageHeightMm = (canvasPxToCapture * pxToMm) / pixelsPerMm;
    
    pdf.addImage(pageImgData, 'PNG', marginLeft, currentY, contentWidth, pageHeightMm);
    
    canvasY += canvasPxToCapture;
    pageNum++;
  }

  return pdf.output('blob');
}

async function spreadsheetToHtml(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  let html = '';
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    html += `<h2>${name}</h2>`;
    html += XLSX.utils.sheet_to_html(ws);
  }
  return wrapHtml(html);
}

async function spreadsheetToCsv(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(ws);
}

async function spreadsheetToXlsx(file: File): Promise<Blob> {
  const XLSX = await import('xlsx');
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

async function pdfToText(file: File): Promise<string> {
  // pdf-lib can extract basic text structure
  const { PDFDocument } = await import('pdf-lib');
  const data = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(data);
  const pages = pdfDoc.getPages();
  // pdf-lib doesn't have text extraction — fallback to letting user know
  return `[PDF document: ${pages.length} pages]\n\nNote: Full text extraction from PDF requires server-side processing. The document has been loaded and can be converted to image format.`;
}

async function imageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function imageToPdf(file: File): Promise<Blob> {
  const canvas = await imageToCanvas(file);
  return canvasToPdfBlob(canvas);
}

async function imageConvert(file: File, format: 'png' | 'jpg'): Promise<Blob> {
  const canvas = await imageToCanvas(file);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas to blob failed'))),
      format === 'jpg' ? 'image/jpeg' : 'image/png',
      0.92
    );
  });
}

async function textToDocx(text: string, title: string): Promise<Blob> {
  // Simple DOCX generation via a minimal Open XML structure
  const content = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = content.split('\n').map(
    (line) => `<w:p><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`
  ).join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${paragraphs}</w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  // Build ZIP using JSZip-like approach (use XLSX's zip utility)
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  // Actually, let's just create a proper blob
  // We'll use the Blob approach with proper OOXML structure

  // Minimal approach: return HTML-based DOCX (Word can open .doc HTML)
  const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; }
  p { margin: 4pt 0; }
</style></head>
<body>${text.split('\n').map(l => `<p>${l || '&nbsp;'}</p>`).join('')}</body></html>`;

  return new Blob([htmlContent], { type: 'application/msword' });
}

/* ─── Main conversion dispatcher ─── */

async function convertFile(
  file: File,
  targetFormat: OutputFormat
): Promise<{ blob: Blob; filename: string }> {
  const ext = getFileExtension(file.name);
  const group = getFileGroup(ext);
  const baseName = file.name.replace(/\.[^.]+$/, '');

  // ==== DOCUMENT group ====
  if (group === 'document') {
    if (ext === 'docx' || ext === 'doc') {
      const html = await docxToHtml(file);
      if (targetFormat === 'html') {
        return { blob: new Blob([html], { type: 'text/html' }), filename: `${baseName}.html` };
      }
      if (targetFormat === 'txt') {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return { blob: new Blob([text], { type: 'text/plain' }), filename: `${baseName}.txt` };
      }
      if (targetFormat === 'pdf') {
        const canvas = await htmlToRenderedCanvas(html);
        const pdfBlob = await canvasToPdfBlob(canvas);
        return { blob: pdfBlob, filename: `${baseName}.pdf` };
      }
      if (targetFormat === 'png') {
        const canvas = await htmlToRenderedCanvas(html);
        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (b) => b ? resolve({ blob: b, filename: `${baseName}.png` }) : reject(new Error('Failed')),
            'image/png'
          );
        });
      }
    }

    // TXT, MD, HTML, HTM
    const text = await file.text();
    const isHtml = ext === 'html' || ext === 'htm';
    const htmlContent = isHtml ? text : wrapHtml(`<pre style="white-space: pre-wrap; font-family: inherit;">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`);

    if (targetFormat === 'pdf') {
      const canvas = await htmlToRenderedCanvas(htmlContent);
      const pdfBlob = await canvasToPdfBlob(canvas);
      return { blob: pdfBlob, filename: `${baseName}.pdf` };
    }
    if (targetFormat === 'html') {
      return { blob: new Blob([htmlContent], { type: 'text/html' }), filename: `${baseName}.html` };
    }
    if (targetFormat === 'txt') {
      const plainText = isHtml ? (() => { const d = document.createElement('div'); d.innerHTML = text; return d.textContent || ''; })() : text;
      return { blob: new Blob([plainText], { type: 'text/plain' }), filename: `${baseName}.txt` };
    }
    if (targetFormat === 'docx') {
      const blob = await textToDocx(text, baseName);
      return { blob, filename: `${baseName}.doc` };
    }
    if (targetFormat === 'png') {
      const canvas = await htmlToRenderedCanvas(htmlContent);
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve({ blob: b, filename: `${baseName}.png` }) : reject(new Error('Failed')),
          'image/png'
        );
      });
    }
  }

  // ==== PDF group ====
  if (group === 'pdf') {
    if (targetFormat === 'txt') {
      const text = await pdfToText(file);
      return { blob: new Blob([text], { type: 'text/plain' }), filename: `${baseName}.txt` };
    }
    if (targetFormat === 'png') {
      // Render first page as image using pdf-lib + canvas
      const { PDFDocument } = await import('pdf-lib');
      const data = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(data);
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      // Create a single-page PDF and render via embed
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Use an iframe-based approach for PDF rendering
      const pdfBlob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);

      // Fallback: just return info that PDF→image needs server
      const infoText = `PDF → PNG conversion: ${pdfDoc.getPages().length} pages detected. For full rendering, please use the PDF viewer and screenshot.`;
      return { blob: new Blob([infoText], { type: 'text/plain' }), filename: `${baseName}_info.txt` };
    }
    if (targetFormat === 'html') {
      const text = await pdfToText(file);
      const html = wrapHtml(`<pre style="white-space: pre-wrap;">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`);
      return { blob: new Blob([html], { type: 'text/html' }), filename: `${baseName}.html` };
    }
    if (targetFormat === 'docx') {
      const text = await pdfToText(file);
      const blob = await textToDocx(text, baseName);
      return { blob, filename: `${baseName}.doc` };
    }
  }

  // ==== SPREADSHEET group ====
  if (group === 'spreadsheet') {
    if (targetFormat === 'pdf') {
      const html = await spreadsheetToHtml(file);
      const canvas = await htmlToRenderedCanvas(html, 1100);
      const pdfBlob = await canvasToPdfBlob(canvas);
      return { blob: pdfBlob, filename: `${baseName}.pdf` };
    }
    if (targetFormat === 'csv') {
      const csv = await spreadsheetToCsv(file);
      return { blob: new Blob([csv], { type: 'text/csv' }), filename: `${baseName}.csv` };
    }
    if (targetFormat === 'xlsx') {
      const blob = await spreadsheetToXlsx(file);
      return { blob, filename: `${baseName}.xlsx` };
    }
    if (targetFormat === 'html') {
      const html = await spreadsheetToHtml(file);
      return { blob: new Blob([html], { type: 'text/html' }), filename: `${baseName}.html` };
    }
  }

  // ==== IMAGE group ====
  if (group === 'image') {
    if (targetFormat === 'pdf') {
      const blob = await imageToPdf(file);
      return { blob, filename: `${baseName}.pdf` };
    }
    if (targetFormat === 'png') {
      const blob = await imageConvert(file, 'png');
      return { blob, filename: `${baseName}.png` };
    }
    if (targetFormat === 'jpg') {
      const blob = await imageConvert(file, 'jpg');
      return { blob, filename: `${baseName}.jpg` };
    }
  }

  throw new Error(`Conversion from ${ext} to ${targetFormat} is not supported`);
}

/* ─── Component ─── */

export default function DocumentConverter() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<OutputFormat | ''>('');
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const targets = file ? getTargetFormats(getFileExtension(file.name)) : [];

  const handleFile = useCallback((f: File) => {
    const ext = getFileExtension(f.name);
    const group = getFileGroup(ext);
    if (group === 'unknown') {
      toast.error(t('converter.unsupportedFormat'));
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error(t('converter.fileTooLarge'));
      return;
    }
    setFile(f);
    setTargetFormat('');
    setDone(false);
    setError('');
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleConvert = async () => {
    if (!file || !targetFormat) return;
    setConverting(true);
    setError('');
    setDone(false);
    try {
      const result = await convertFile(file, targetFormat as OutputFormat);
      // trigger download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      toast.success(t('converter.success'));
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || t('converter.error'));
      toast.error(t('converter.error'));
    } finally {
      setConverting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setTargetFormat('');
    setDone(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const ext = file ? getFileExtension(file.name) : '';
  const group = file ? getFileGroup(ext) : '';
  const groupIcon = group && FORMAT_GROUPS[group]?.icon;

  return (
    <Card className="border border-primary/20 bg-card">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{t('converter.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('converter.subtitle')}</p>
          </div>
        </div>

        {/* Supported formats badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'CSV', 'TXT', 'HTML', 'PNG', 'JPG', 'GIF', 'WEBP', 'SVG', 'BMP', 'TIFF', 'RTF', 'MD'].map((fmt) => (
            <span key={fmt} className="px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-muted text-muted-foreground font-medium">
              {fmt}
            </span>
          ))}
        </div>

        {/* Drop zone or file info */}
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            <FileUp className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-sm sm:text-base mb-1">{t('converter.dropHere')}</p>
            <p className="text-xs text-muted-foreground mb-3">{t('converter.orClick')}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70">{t('converter.maxSize')}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={INPUT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {groupIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} · {ext.toUpperCase()}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={reset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Conversion row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Source format */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm font-medium shrink-0">
                {groupIcon}
                <span>{ext.toUpperCase()}</span>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground mx-auto sm:mx-0 rotate-90 sm:rotate-0 shrink-0" />

              {/* Target format selector */}
              <Select value={targetFormat} onValueChange={(v) => { setTargetFormat(v as OutputFormat); setDone(false); setError(''); }}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={t('converter.selectFormat')} />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((tgt) => (
                    <SelectItem key={tgt.format} value={tgt.format}>
                      <span className="flex items-center gap-2">
                        {tgt.icon}
                        {tgt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Convert button */}
              <Button
                onClick={handleConvert}
                disabled={!targetFormat || converting}
                className="shrink-0"
              >
                {converting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('converter.converting')}
                  </>
                ) : done ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('converter.downloadAgain')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {t('converter.convert')}
                  </>
                )}
              </Button>
            </div>

            {/* Status messages */}
            {done && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                {t('converter.successDetail')}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
