import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Download, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange?: (data: string) => void;
  label?: string;
  readOnly?: boolean;
}

export function SignaturePad({ value, onChange, label = 'Подпись', readOnly = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [color, setColor] = useState('#1a1a2e');
  const [size, setSize] = useState(2);

  useEffect(() => {
    if (value && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || readOnly) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    const data = canvasRef.current?.toDataURL();
    if (data) onChange?.(data);
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
    onChange?.('');
  };

  const downloadSignature = () => {
    const data = canvasRef.current?.toDataURL('image/png');
    if (!data) return;
    const a = document.createElement('a');
    a.href = data;
    a.download = 'signature.png';
    a.click();
  };

  return (
    <div className="border rounded-lg p-3 bg-background">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {['#1a1a2e', '#1565c0', '#c62828', '#2e7d32'].map(c => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <select
              className="text-xs border rounded px-1 py-0.5 bg-background"
              value={size}
              onChange={e => setSize(Number(e.target.value))}
            >
              <option value={1}>Тонкая</option>
              <option value={2}>Обычная</option>
              <option value={4}>Жирная</option>
            </select>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clear} title="Очистить">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            {hasSignature && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadSignature} title="Скачать">
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        className={`w-full border rounded bg-card ${!readOnly ? 'cursor-crosshair' : ''}`}
        style={{ touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      {!hasSignature && !readOnly && (
        <p className="text-xs text-muted-foreground text-center mt-1">Нарисуйте подпись мышью или пальцем</p>
      )}
    </div>
  );
}
