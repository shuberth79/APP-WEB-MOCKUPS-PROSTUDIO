
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';

interface ManualMontagePreviewProps {
  baseImage: string | null;
  designImage: string | null;
  designX: number;
  designY: number;
  designScale: number;
  designRotation: number;
  designOpacity: number;
  designPerspectiveX: number;
  designPerspectiveY: number;
  onUpdateX?: (val: number) => void;
  onUpdateY?: (val: number) => void;
  onUpdateScale?: (val: number) => void;
}

export interface ManualMontagePreviewHandles {
  getCompositeImage: () => Promise<string | null>;
}

const ManualMontagePreview = forwardRef<ManualMontagePreviewHandles, ManualMontagePreviewProps>(
  ({ baseImage, designImage, designX, designY, designScale, designRotation, designOpacity, designPerspectiveX, designPerspectiveY, onUpdateX, onUpdateY, onUpdateScale }, ref) => {
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const baseImgRef = useRef<HTMLImageElement>(null);
    const designImgRef = useRef<HTMLImageElement>(null);

    const [renderedBaseDimensions, setRenderedBaseDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

    useEffect(() => {
      const updateDimensions = () => {
        if (baseImgRef.current) {
          setRenderedBaseDimensions({
            width: baseImgRef.current.offsetWidth,
            height: baseImgRef.current.offsetHeight,
          });
        }
      };

      updateDimensions();
      const resizeObserver = new ResizeObserver(() => updateDimensions());
      if (baseImgRef.current) {
        resizeObserver.observe(baseImgRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [baseImage]);

    // Mouse Interactions
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!designImage || !renderedBaseDimensions) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        initialX: designX,
        initialY: designY
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !renderedBaseDimensions || !onUpdateX || !onUpdateY) return;

      const deltaX = ((e.clientX - dragStart.current.x) / renderedBaseDimensions.width) * 100;
      const deltaY = ((e.clientY - dragStart.current.y) / renderedBaseDimensions.height) * 100;

      onUpdateX(Math.max(0, Math.min(100, dragStart.current.initialX + deltaX)));
      onUpdateY(Math.max(0, Math.min(100, dragStart.current.initialY + deltaY)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // OMITIDO: Escalado con Scroll para evitar cambios involuntarios
    // const handleWheel = (e: React.WheelEvent) => { ... };

    useEffect(() => {
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging]);

    const getCompositeImage = async (): Promise<string | null> => {
      if (!baseImage) return null;

      const base = new Image();
      base.src = baseImage;
      await new Promise(resolve => base.onload = resolve);

      const canvas = document.createElement('canvas');
      canvas.width = base.width;
      canvas.height = base.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);

      if (designImage) {
        const design = new Image();
        design.src = designImage;
        await new Promise(resolve => design.onload = resolve);

        const baseOriginalWidth = base.width;
        const baseOriginalHeight = base.height;
        const designNaturalWidth = design.naturalWidth;
        const designNaturalHeight = design.naturalHeight;

        const targetDesignWidthCanvas = baseOriginalWidth * (designScale / 100);
        const targetDesignHeightCanvas = designNaturalHeight * (targetDesignWidthCanvas / designNaturalWidth);

        const pixelDesignCenterX = (designX / 100) * baseOriginalWidth;
        const pixelDesignCenterY = (designY / 100) * baseOriginalHeight;
        
        ctx.save();
        ctx.globalAlpha = designOpacity / 100;

        ctx.translate(pixelDesignCenterX, pixelDesignCenterY);

        const skewXAngle = designPerspectiveX * Math.PI / 180;
        const skewYAngle = designPerspectiveY * Math.PI / 180;
        ctx.transform(1, Math.tan(skewYAngle), Math.tan(skewXAngle), 1, 0, 0);

        ctx.rotate(designRotation * Math.PI / 180); 
        
        ctx.drawImage(design, -targetDesignWidthCanvas / 2, -targetDesignHeightCanvas / 2, targetDesignWidthCanvas, targetDesignHeightCanvas);
        ctx.restore();
      }
      return canvas.toDataURL('image/png');
    };

    useImperativeHandle(ref, () => ({
      getCompositeImage,
    }));

    const designStyle: React.CSSProperties = designImage && renderedBaseDimensions ? {
      position: 'absolute',
      left: `${designX}%`,
      top: `${designY}%`,
      width: `${renderedBaseDimensions.width * (designScale / 100)}px`,
      height: designImgRef.current?.naturalWidth 
        ? `${(designImgRef.current.naturalHeight / designImgRef.current.naturalWidth) * (renderedBaseDimensions.width * (designScale / 100))}px`
        : 'auto',
      transform: `
        translate(-50%, -50%) 
        skew(${designPerspectiveX}deg, ${designPerspectiveY}deg)
        rotate(${designRotation}deg) 
      `,
      opacity: designOpacity / 100,
      transformOrigin: 'center center',
      maxWidth: 'none',
      maxHeight: 'none',
      objectFit: 'contain',
      cursor: isDragging ? 'grabbing' : 'grab',
      pointerEvents: 'auto'
    } : {};


    return (
      <div 
        ref={previewContainerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
      >
        {baseImage && (
          <img 
            ref={baseImgRef}
            src={baseImage} 
            className="w-full h-full object-cover rounded-[2rem] shadow-2xl border border-white/5"
            alt="Base Mockup"
          />
        )}
        {designImage && (
          <img
            ref={designImgRef}
            src={designImage}
            alt="Design Overlay"
            style={designStyle}
            onMouseDown={handleMouseDown}
          />
        )}
        {!baseImage && !designImage && (
          <div className="text-center space-y-8 opacity-5">
            <span className="text-[200px] block leading-none select-none">🖌️</span>
          </div>
        )}
        {designImage && (
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-white/40 tracking-[0.2em] pointer-events-none">
             Arrastrar para mover • Usa los controles para escalar
           </div>
        )}
      </div>
    );
  }
);

export default ManualMontagePreview;
