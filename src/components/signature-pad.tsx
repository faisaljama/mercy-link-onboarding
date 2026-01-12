"use client";

import { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { Eraser, Undo2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadComponentProps {
  onSignatureChange?: (dataUrl: string | null) => void;
  onSignatureSubmit?: (dataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
  initialSignature?: string;
}

export function SignaturePadComponent({
  onSignatureChange,
  onSignatureSubmit,
  width = 500,
  height = 200,
  className,
  disabled = false,
  initialSignature,
}: SignaturePadComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16,
    });

    signaturePadRef.current = signaturePad;

    // Load initial signature if provided
    if (initialSignature) {
      signaturePad.fromDataURL(initialSignature);
      setIsEmpty(false);
    }

    // Track changes
    signaturePad.addEventListener("endStroke", () => {
      const dataUrl = signaturePad.toDataURL();
      setHistory((prev) => [...prev, dataUrl]);
      setIsEmpty(signaturePad.isEmpty());
      onSignatureChange?.(dataUrl);
    });

    if (disabled) {
      signaturePad.off();
    }

    return () => {
      signaturePad.off();
    };
  }, [width, height, initialSignature, disabled, onSignatureChange]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      setHistory([]);
      onSignatureChange?.(null);
    }
  };

  const handleUndo = () => {
    if (signaturePadRef.current && history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      signaturePadRef.current.fromDataURL(newHistory[newHistory.length - 1]);
      onSignatureChange?.(newHistory[newHistory.length - 1]);
    } else if (history.length <= 1) {
      handleClear();
    }
  };

  const handleSubmit = () => {
    if (signaturePadRef.current && !isEmpty) {
      const dataUrl = signaturePadRef.current.toDataURL("image/png");
      onSignatureSubmit?.(dataUrl);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className={cn(
            "touch-none cursor-crosshair",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ width, height }}
        />
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-400 text-sm">Sign here</p>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isEmpty}
            >
              <Eraser className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          {onSignatureSubmit && (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isEmpty}
            >
              <Check className="h-4 w-4 mr-1" />
              Confirm Signature
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Mobile-optimized signature pad with larger touch targets
export function MobileSignaturePad({
  onSignatureChange,
  onSignatureSubmit,
  className,
  disabled = false,
}: Omit<SignaturePadComponentProps, "width" | "height">) {
  const [dimensions, setDimensions] = useState({ width: 350, height: 150 });

  useEffect(() => {
    const updateDimensions = () => {
      const maxWidth = Math.min(window.innerWidth - 48, 600);
      const height = Math.min(maxWidth * 0.4, 200);
      setDimensions({ width: maxWidth, height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <SignaturePadComponent
      width={dimensions.width}
      height={dimensions.height}
      onSignatureChange={onSignatureChange}
      onSignatureSubmit={onSignatureSubmit}
      className={className}
      disabled={disabled}
    />
  );
}
