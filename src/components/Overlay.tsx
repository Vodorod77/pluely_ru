import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MousePointer2 } from "lucide-react";

interface SelectionCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Overlay: React.FC = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [selectionStyle, setSelectionStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    display: "none" as "none" | "block",
  });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  const selectionRef = useRef<HTMLDivElement>(null);

  // Handle cancellation (ESC key, cancel button)
  const handleCancel = async () => {
    setIsSelecting(false);
    try {
      await invoke("close_overlay_window", { reason: "User cancelled" });
    } catch (err) {
      console.error("Failed to emit cancel event:", err);
    }
  };

  // Handle selection completion
  const handleSelectionComplete = async (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    try {
      const scaleFactor = window.devicePixelRatio || 1;
      const coords: SelectionCoords = {
        x: Math.round(x * scaleFactor),
        y: Math.round(y * scaleFactor),
        width: Math.round(width * scaleFactor),
        height: Math.round(height * scaleFactor),
      };

      // Backend will handle closing the overlay and emitting the event
      await invoke("capture_selected_area", { coords });
    } catch (err) {
      console.error("Failed to capture selected area:", err);
    }
  };

  // Handle mouse selection logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSelecting(true);
    setStartCoords({ x: e.clientX, y: e.clientY });
    setCursorPosition({ x: e.clientX, y: e.clientY });

    setSelectionStyle({
      left: e.clientX,
      top: e.clientY,
      width: 0,
      height: 0,
      display: "block",
    });

    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Always update cursor position
    setCursorPosition({ x: e.clientX, y: e.clientY });

    if (!cursorVisible) {
      setCursorVisible(true);
    }

    if (!isSelecting) return;

    const width = Math.abs(e.clientX - startCoords.x);
    const height = Math.abs(e.clientY - startCoords.y);
    const left = Math.min(e.clientX, startCoords.x);
    const top = Math.min(e.clientY, startCoords.y);

    setSelectionStyle((prev) => ({
      ...prev,
      width,
      height,
      left,
      top,
    }));

    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Update cursor position
    setCursorPosition({ x: e.clientX, y: e.clientY });

    if (!isSelecting) return;

    setIsSelecting(false);

    const x = Math.min(e.clientX, startCoords.x);
    const y = Math.min(e.clientY, startCoords.y);
    const width = Math.abs(e.clientX - startCoords.x);
    const height = Math.abs(e.clientY - startCoords.y);

    e.preventDefault();
    e.stopPropagation();

    if (width >= 10 && height >= 10) {
      handleSelectionComplete(x, y, width, height);
    } else {
      handleCancel();
    }
  };

  // Handle ESC key
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" || e.keyCode === 27) {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleCancel();
    }
  };

  // Event listeners setup
  useEffect(() => {
    // ESC key listeners (multiple levels for reliability)
    document.addEventListener("keydown", handleEscapeKey, true);
    document.body.addEventListener("keydown", handleEscapeKey, true);
    window.addEventListener("keydown", handleEscapeKey, true);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey, true);
      document.body.removeEventListener("keydown", handleEscapeKey, true);
      window.removeEventListener("keydown", handleEscapeKey, true);
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 w-screen h-screen bg-black/0.5 bg-opacity-10 overflow-hidden"
        style={{ cursor: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Instructions */}
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-black/50 bg-opacity-10 text-white px-6 py-3 rounded-lg font-sans text-xs pointer-events-none z-[5000]">
          Click and drag to select area, press ESC to cancel
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCancel();
          }}
          style={{ cursor: "none" }}
          className="fixed top-5 right-5 bg-red-500 hover:bg-red-600 hover:bg-opacity-95 text-white border-none px-4 py-2 rounded-md font-sans text-sm z-[5000] transition-colors duration-200"
        >
          Cancel (ESC)
        </button>

        {/* Selection Rectangle */}
        <div
          ref={selectionRef}
          className="absolute border-2 border-white bg-white/10 rounded-3xl rounded-br-none pointer-events-none"
          style={{
            left: selectionStyle.left,
            top: selectionStyle.top,
            width: selectionStyle.width,
            height: selectionStyle.height,
            display: selectionStyle.display,
            zIndex: 4000,
          }}
        />

        {/* Custom Cursor */}
        <div
          className="fixed pointer-events-none z-[9999] transition-opacity duration-100"
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y,
            transform: "translate(-2px, -2px)",
            opacity: cursorVisible ? 1 : 0,
          }}
        >
          <MousePointer2 className="w-5 h-5 drop-shadow-2xl fill-secondary stroke-primary" />
        </div>
      </div>
    </>
  );
};

export default Overlay;
