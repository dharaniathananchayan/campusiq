import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  Upload,
  Move,
  Image as ImageIcon,
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedDataUrl: string) => void;
  cropShape?: 'round' | 'rect' | 'banner';
  title?: string;
  outputSize?: number;
  outputWidth?: number;
  outputHeight?: number;
}

const CROP_SIZE = 240;

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  cropShape = 'round',
  title = 'Crop Photo',
  outputSize = 400,
  outputWidth,
  outputHeight,
}) => {
  const isBanner = cropShape === 'banner';
  const canvasWidth = isBanner ? 380 : 360;
  const canvasHeight = isBanner ? 240 : 360;
  const cropW = isBanner ? 320 : CROP_SIZE;
  const cropH = isBanner ? 180 : CROP_SIZE;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImgElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Render canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    // Base scale so shortest dimension covers crop window
    const baseScale = Math.max(cropW / imgElement.width, cropH / imgElement.height);
    const drawW = imgElement.width * baseScale;
    const drawH = imgElement.height * baseScale;

    // Draw transformed image
    ctx.save();
    ctx.translate(cx + pan.x, cy + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Dark outer mask with cutout
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 20, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth, canvasHeight);

    if (cropShape === 'round') {
      ctx.arc(cx, cy, CROP_SIZE / 2, 0, Math.PI * 2, true);
    } else {
      // Rounded rect / banner cutout
      const r = isBanner ? 12 : 16;
      const x = cx - cropW / 2;
      const y = cy - cropH / 2;
      const w = cropW;
      const h = cropH;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
    ctx.fill('evenodd');

    // Viewport border ring
    ctx.beginPath();
    if (cropShape === 'round') {
      ctx.arc(cx, cy, CROP_SIZE / 2, 0, Math.PI * 2);
    } else {
      const r = isBanner ? 12 : 16;
      const x = cx - cropW / 2;
      const y = cy - cropH / 2;
      const w = cropW;
      const h = cropH;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
    ctx.strokeStyle = '#d8fa57';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Grid guide crosshairs
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(216, 250, 87, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    // horizontal third lines inside viewport
    ctx.moveTo(cx - cropW / 2, cy - cropH / 6);
    ctx.lineTo(cx + cropW / 2, cy - cropH / 6);
    ctx.moveTo(cx - cropW / 2, cy + cropH / 6);
    ctx.lineTo(cx + cropW / 2, cy + cropH / 6);
    // vertical third lines inside viewport
    ctx.moveTo(cx - cropW / 6, cy - cropH / 2);
    ctx.lineTo(cx - cropW / 6, cy + cropH / 2);
    ctx.moveTo(cx + cropW / 6, cy - cropH / 2);
    ctx.lineTo(cx + cropW / 6, cy + cropH / 2);
    ctx.stroke();
    ctx.restore();
  }, [imgElement, zoom, pan, rotation, cropShape, canvasWidth, canvasHeight, cropW, cropH, isBanner]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse / Touch handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleApplyCrop = () => {
    if (!imgElement) return;

    const targetW = outputWidth || (isBanner ? 1200 : outputSize);
    const targetH = outputHeight || (isBanner ? 675 : outputSize);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = targetW;
    outCanvas.height = targetH;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    const outScale = targetW / cropW;
    const baseScale = Math.max(cropW / imgElement.width, cropH / imgElement.height);
    const drawW = imgElement.width * baseScale;
    const drawH = imgElement.height * baseScale;

    outCtx.save();
    outCtx.translate(targetW / 2 + pan.x * outScale, targetH / 2 + pan.y * outScale);
    outCtx.rotate((rotation * Math.PI) / 180);
    outCtx.scale(zoom * outScale, zoom * outScale);
    outCtx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
    outCtx.restore();

    const dataUrl = outCanvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md border border-[#dedbd4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#112b20] text-white px-5 py-4 flex items-center justify-between border-b border-[#1b3d2f]">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#d8fa57]" />
            <h3 className="font-extrabold text-base text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1b3d2f] hover:bg-[#25523f] text-[#c4d6cb] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-5 flex flex-col items-center justify-center bg-[#f7f5ed]">
          <div
            className="relative rounded-2xl overflow-hidden shadow-inner cursor-grab active:cursor-grabbing select-none touch-none"
            style={{ width: canvasWidth, height: canvasHeight }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full h-full block"
            />

            {/* Drag hint overlay */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-[#112b20]/80 text-[#d8fa57] text-[10px] font-mono px-2.5 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-xs">
              <Move className="w-3 h-3" />
              <span>Drag to reposition photo</span>
            </div>
          </div>

          {/* Controls: Zoom & Rotate */}
          <div className="w-full max-w-[360px] mt-4 space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#dedbd4] shadow-2xs">
              <ZoomOut className="w-4 h-4 text-[#738278] shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#112b20] cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-[#738278] shrink-0" />
              <span className="text-[11px] font-mono font-bold text-[#19231e] w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Quick Actions (Rotate, Reset) */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex-1 py-2 px-3 bg-white hover:bg-[#fbf9f4] border border-[#dedbd4] text-[#19231e] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#e65c36]" />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-3 bg-white hover:bg-[#fbf9f4] border border-[#dedbd4] text-[#526359] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#dedbd4] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#dcd9ce] text-xs font-bold text-[#4a574f] hover:bg-[#fbf9f4] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-5 py-2.5 rounded-xl bg-[#e65c36] hover:bg-[#d8522d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Crop & Set Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
