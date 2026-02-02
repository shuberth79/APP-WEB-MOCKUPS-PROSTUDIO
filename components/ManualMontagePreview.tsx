
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';

interface ManualMontagePreviewProps {
  baseImage: string | null;
  designImage: string | null;
  designX: number; // % of base image width for position
  designY: number; // % of base image height for position
  designScale: number; // % (as percentage of base image width)
  designRotation: number; // degrees
  designOpacity: number; // 0-100%
  designPerspectiveX: number; // degrees for skewX
  designPerspectiveY: number; // degrees for skewY
}

export interface ManualMontagePreviewHandles {
  getCompositeImage: () => Promise<string | null>;
}

const ManualMontagePreview = forwardRef<ManualMontagePreviewHandles, ManualMontagePreviewProps>(
  ({ baseImage, designImage, designX, designY, designScale, designRotation, designOpacity, designPerspectiveX, designPerspectiveY }, ref) => {
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const baseImgRef = useRef<HTMLImageElement>(null);
    const designImgRef = useRef<HTMLImageElement>(null);

    // State to hold the rendered dimensions of the base image for CSS scaling
    const [renderedBaseDimensions, setRenderedBaseDimensions] = useState<{ width: number; height: number } | null>(null);

    // Effect to update renderedBaseDimensions when the base image or container resizes
    useEffect(() => {
      const updateDimensions = () => {
        if (baseImgRef.current) {
          setRenderedBaseDimensions({
            width: baseImgRef.current.offsetWidth,
            height: baseImgRef.current.offsetHeight,
          });
        }
      };

      // Set initial dimensions
      updateDimensions();

      // Set up ResizeObserver for responsive updates
      const resizeObserver = new ResizeObserver(() => updateDimensions());
      if (baseImgRef.current) {
        resizeObserver.observe(baseImgRef.current);
      } else if (previewContainerRef.current) {
        // If baseImgRef isn't present yet, observe the container
        resizeObserver.observe(previewContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [baseImage]); // Re-run effect if baseImage URL changes

    // This function composites the base and design images onto an offscreen canvas
    // and returns the data URL.
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

        // Calculate actual position/scale/rotation relative to the *original base image dimensions*
        const baseOriginalWidth = base.width;
        const baseOriginalHeight = base.height;
        const designNaturalWidth = design.naturalWidth;
        const designNaturalHeight = design.naturalHeight;

        // designScale is now interpreted as percentage of base image's width
        const targetDesignWidthCanvas = baseOriginalWidth * (designScale / 100);
        const targetDesignHeightCanvas = designNaturalHeight * (targetDesignWidthCanvas / designNaturalWidth); // Maintain aspect ratio

        // designX, designY are percentages for the *center* of the design relative to the top-left of the base image
        const pixelDesignCenterX = (designX / 100) * baseOriginalWidth;
        const pixelDesignCenterY = (designY / 100) * baseOriginalHeight;
        
        ctx.save();
        ctx.globalAlpha = designOpacity / 100; // Apply opacity

        // Translate to the center of the design for transformations
        ctx.translate(pixelDesignCenterX, pixelDesignCenterY);

        // Apply perspective (skew)
        const skewXAngle = designPerspectiveX * Math.PI / 180;
        const skewYAngle = designPerspectiveY * Math.PI / 180;
        ctx.transform(1, Math.tan(skewYAngle), Math.tan(skewXAngle), 1, 0, 0);

        // Rotate around its center
        ctx.rotate(designRotation * Math.PI / 180); 
        
        // Draw the image, offset by half its scaled width/height to center it on the translated point
        ctx.drawImage(design, -targetDesignWidthCanvas / 2, -targetDesignHeightCanvas / 2, targetDesignWidthCanvas, targetDesignHeightCanvas);
        ctx.restore();
      }
      return canvas.toDataURL('image/png');
    };

    useImperativeHandle(ref, () => ({
      getCompositeImage,
    }));

    // Calculate display styles for the design image to match slider values
    const designStyle: React.CSSProperties = designImage && renderedBaseDimensions ? {
      position: 'absolute',
      left: `${designX}%`,
      top: `${designY}%`,
      // Dynamically set width and height based on designScale as a percentage of rendered base image width
      width: `${renderedBaseDimensions.width * (designScale / 100)}px`,
      height: designImgRef.current?.naturalWidth 
        ? `${(designImgRef.current.naturalHeight / designImgRef.current.naturalWidth) * (renderedBaseDimensions.width * (designScale / 100))}px`
        : 'auto',
      transform: `
        translate(-50%, -50%) 
        skew(${designPerspectiveX}deg, ${designPerspectiveY}deg)
        rotate(${designRotation}deg) 
      `,
      opacity: designOpacity / 100, // Apply opacity
      transformOrigin: 'center center',
      maxWidth: 'none',
      maxHeight: 'none',
      pointerEvents: 'none', // Ensure clicks go to parent for zoom
      objectFit: 'contain'
    } : {};


    return (
      <div 
        ref={previewContainerRef}
        className="relative w-full h-full flex items-center justify-center"
      >
        {baseImage && (
          <img 
            ref={baseImgRef}
            src={baseImage} 
            // Use w-full h-full object-cover to fill container, removing max-w/h for flexibility
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
          />
        )}
        {!baseImage && !designImage && (
          <div className="text-center space-y-8 opacity-5">
            <span className="text-[200px] block leading-none select-none">🖌️</span>
          </div>
        )}
      </div>
    );
  }
);

export default ManualMontagePreview;