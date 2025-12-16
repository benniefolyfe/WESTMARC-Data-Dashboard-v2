
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface ClipboardButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  className?: string;
  ariaLabel?: string;
}

const ClipboardButton: React.FC<ClipboardButtonProps> = ({ targetRef, className, ariaLabel = "Copy content" }) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    const element = targetRef.current;
    if (!element) return;

    try {
      // 1. Check for SVG (Chart)
      const svg = element.querySelector('svg');
      if (svg) {
        await copyChart(svg as SVGSVGElement, element);
      } else {
        // 2. Fallback: Copy Text/HTML (Table or Text)
        await copyHtml(element);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert("Failed to copy content. Please try selecting and copying manually.");
    }
  };

  const copyChart = async (svg: SVGSVGElement, container: HTMLElement) => {
    // Basic SVG serialization
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // Add XML namespaces if missing
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    // Use container dimensions for higher resolution if available
    const width = container.offsetWidth || svg.clientWidth || 500;
    const height = container.offsetHeight || svg.clientHeight || 300;
    
    // Scale up for better quality on retina screens
    const scale = 2; 

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");
    
    // Fill white background (charts often have transparent background)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

    await new Promise((resolve, reject) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width * scale, height * scale);
            resolve(true);
        };
        img.onerror = (e) => reject(e);
    });

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error("Could not generate image blob");

    await navigator.clipboard.write([
        new ClipboardItem({
            'image/png': blob
        })
    ]);
  };

  const copyHtml = async (element: HTMLElement) => {
      // For tables, we want formatting. For text, plain text.
      const html = element.outerHTML;
      const text = element.innerText;

      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
  };

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        p-1.5 rounded-md transition-all duration-200 
        flex items-center gap-1.5 text-xs font-bold
        ${copied 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-white text-westmarc-mid-gray border border-westmarc-light-gray hover:text-westmarc-midnight hover:border-westmarc-midnight'
        }
        ${className || ''}
      `}
      title={ariaLabel}
      aria-label={ariaLabel}
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Copied</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5" />
          <span className={`${isHovered ? 'inline' : 'hidden'} sm:hidden transition-all duration-200`}>Copy</span>
          <span className="hidden sm:inline">Copy</span>
        </>
      )}
    </button>
  );
};

export default ClipboardButton;
