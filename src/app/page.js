"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import NextImage from "next/image";
import {
  Image as ImageIcon,
  VideoCamera,
  UploadSimple,
  Spinner,
  CheckCircle,
  XCircle,
  Download,
  MagicWand,
  Palette,
  FadersHorizontal,
  Crosshair,
  Trash,
  ArrowRight,
  Sparkle,
  BookOpen,
} from "@phosphor-icons/react";

const TABS = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: VideoCamera },
];

const METHODS = [
  { id: "inpaint", label: "Smart Inpaint", desc: "AI-powered fill", icon: Sparkle },
  { id: "threshold", label: "Color Threshold", desc: "For light watermarks", icon: Palette },
  { id: "frequency", label: "Frequency Filter", desc: "Pattern remover", icon: FadersHorizontal },
];

function calcDisplaySize(nw, nh, maxW, maxH) {
  let w = nw, h = nh;
  if (w > maxW) { h = h * maxW / w; w = maxW; }
  if (h > maxH) { w = w * maxH / h; h = maxH; }
  return { w: Math.round(w), h: Math.round(h) };
}

function RegionSelector({ src, fileType, onRegionChange }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRef = useRef(null);
  const fitRef = useRef(null);
  const [selecting, setSelecting] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [region, setRegion] = useState(null);
  const [capturedFrame, setCapturedFrame] = useState(null);
  const [displaySize, setDisplaySize] = useState(null);
  const [mediaInfo, setMediaInfo] = useState(null);
  const startRef = useRef(null);

  const getMediaSize = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return null;
    const nw = el.naturalWidth || el.videoWidth;
    const nh = el.naturalHeight || el.videoHeight;
    if (nw && nh) return { w: nw, h: nh };
    return null;
  }, []);

  useEffect(() => {
    if (!selecting) return;
    const timer = setTimeout(() => {
      const info = getMediaSize();
      if (info) {
        setMediaInfo(info);
        setDisplaySize(calcDisplaySize(info.w, info.h, window.innerWidth < 640 ? window.innerWidth - 64 : 800, 320));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selecting, capturedFrame, src, getMediaSize]);

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displaySize) return;
    canvas.width = displaySize.w;
    canvas.height = displaySize.h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!region) return;
    const { x, y, w, h } = region;
    ctx.fillStyle = "rgba(26,26,46,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(x, y, w, h);
    ctx.strokeStyle = "#c9a96e";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([dx, dy]) => {
      ctx.fillStyle = "#c9a96e";
      ctx.beginPath();
      ctx.arc(dx, dy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [region, displaySize]);

  useEffect(() => { if (selecting && displaySize) drawOverlay(); }, [selecting, displaySize, drawOverlay]);

  const getPos = (e) => {
    const fit = fitRef.current;
    if (!fit) return { x: 0, y: 0 };
    const rect = fit.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  const onStart = (e) => {
    if (!selecting || !displaySize) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos(e);
    if (region) {
      const { x, y, w, h } = region;
      if (pos.x >= x - 12 && pos.x <= x + w + 12 && pos.y >= y - 12 && pos.y <= y + h + 12) {
        setDrawing(true);
        startRef.current = { ...region, type: "drag", ox: pos.x, oy: pos.y };
        return;
      }
    }
    setRegion(null);
    onRegionChange(null);
    setDrawing(true);
    startRef.current = { x: pos.x, y: pos.y, type: "draw" };
  };

  const onMove = (e) => {
    if (!drawing || !startRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const s = startRef.current;
    if (s.type === "draw") {
      setRegion({ x: Math.min(s.x, pos.x), y: Math.min(s.y, pos.y), w: Math.abs(pos.x - s.x), h: Math.abs(pos.y - s.y) });
    } else {
      setRegion({ x: s.x + pos.x - s.ox, y: s.y + pos.y - s.oy, w: s.w, h: s.h });
    }
  };

  const onEnd = () => {
    if (!drawing || !displaySize || !mediaInfo) return;
    setDrawing(false);
    if (region && region.w > 10 && region.h > 10) {
      const sx = mediaInfo.w / displaySize.w;
      const sy = mediaInfo.h / displaySize.h;
      onRegionChange({ x: Math.round(region.x * sx), y: Math.round(region.y * sy), w: Math.round(region.w * sx), h: Math.round(region.h * sy) });
    } else { setRegion(null); onRegionChange(null); }
  };

  const toggleSelect = () => {
    if (selecting) {
      setSelecting(false); setDisplaySize(null); setMediaInfo(null);
    } else {
      if (fileType === "video" && mediaRef.current) {
        const video = mediaRef.current;
        const c = document.createElement("canvas");
        c.width = video.videoWidth || video.clientWidth;
        c.height = video.videoHeight || video.clientHeight;
        c.getContext("2d").drawImage(video, 0, 0);
        setCapturedFrame(c.toDataURL());
      }
      setSelecting(true);
    }
  };

  const clearRegion = () => { setRegion(null); onRegionChange(null); };

  const selImg = selecting && capturedFrame ? capturedFrame : (selecting && fileType === "image" ? src : null);
  const showCanvas = selecting && displaySize;
  const previewStyle = displaySize ? { width: displaySize.w, height: displaySize.h } : {};

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={toggleSelect}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selecting
              ? "bg-[#1a1a2e] text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
          }`}
        >
          <Crosshair size={14} weight={selecting ? "fill" : "regular"} />
          {selecting ? "Done Selecting" : "Select Region"}
        </motion.button>
        {selecting && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearRegion}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <Trash size={13} /> Clear
          </motion.button>
        )}
        {selecting && (
          <span className="text-[11px] text-gray-400 ml-auto hidden sm:block">Drag on preview to mark area</span>
        )}
      </div>
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="relative rounded-xl overflow-hidden w-full sm:w-auto"
          style={selecting && displaySize ? { maxWidth: "100%", height: displaySize.h } : { maxHeight: 300 }}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
        >
          {selImg ? (
            <div ref={fitRef} style={{ ...(previewStyle || {}), maxWidth: "100%" }} className="relative bg-gray-50 mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={mediaRef} src={selImg} alt="Preview" className="block w-full h-auto max-h-[300px] object-contain" draggable={false}
                onLoad={() => {
                  const info = getMediaSize();
                  if (info) {
                    setMediaInfo(info);
                    const ww = window.innerWidth < 640 ? window.innerWidth - 64 : 800;
                    setDisplaySize(calcDisplaySize(info.w, info.h, ww, 300));
                  }
                }}
              />
              {showCanvas && <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair w-full h-full" />}
            </div>
          ) : fileType === "video" ? (
            <video ref={mediaRef} src={src} controls playsInline className="max-h-[300px] w-full object-contain block bg-gray-50" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img ref={mediaRef} src={src} alt="Preview" className="max-h-[300px] w-full object-contain block bg-gray-50" draggable={false} />
          )}
        </div>
      </div>
      {region && !selecting && (
        <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-gray-500">
          Region selected &mdash; {region.w}&times;{region.h}px
        </motion.p>
      )}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("image");
  const [method, setMethod] = useState("inpaint");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [region, setRegion] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    setError(null); setResultUrl(null); setRegion(null); setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const handleTabChange = (id) => {
    setActiveTab(id); setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setResultUrl(null); setError(null); setRegion(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResultUrl(null);
    const form = new FormData();
    form.append("file", file);
    form.append("method", method);
    if (region) {
      form.append("x", String(region.x)); form.append("y", String(region.y));
      form.append("w", String(region.w)); form.append("h", String(region.h));
    }
    try {
      const res = await fetch(`http://localhost:8000/api/${activeTab}s/remove`, { method: "POST", body: form });
      const resText = await res.text();
      let data;
      try { data = JSON.parse(resText); } catch { throw new Error(resText || `Server error (${res.status})`); }
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setResultUrl(`http://localhost:8000${data.output_url}`);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const isImage = activeTab === "image";
  const isVideo = activeTab === "video";
  const hasPreview = preview && (isImage || isVideo);
  const acceptMap = { image: "image/*", video: "video/*" };
  const hintMap = { image: "PNG, JPG, WebP", video: "MP4, AVI, MOV, WebM" };

  return (
    <div className="min-h-dvh bg-[#f8f7f4] text-[#1a1a2e] flex flex-col relative overflow-x-hidden">
      <div className="hero-subtle-bg" />

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-white/80 backdrop-blur-md border-b border-black/[0.04]"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0">
              <MagicWand size={13} weight="duotone" className="text-[#c9a96e] sm:text-[15px]" />
            </div>
            <h1 className="text-[13px] sm:text-[14px] font-semibold tracking-tight truncate">Free Video Watermark Remover</h1>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8 sm:mb-12"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] text-[10px] sm:text-[11px] font-medium tracking-wide uppercase mb-4 sm:mb-6"
          >
            <Sparkle size={11} weight="fill" className="sm:text-[13px]" />
            Smart Watermark Removal
          </motion.span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.08] mb-3 sm:mb-4">
            Remove Watermarks.
            <br />
            <span className="text-gray-400">Clean as new.</span>
          </h2>
          <p className="text-gray-500 text-[14px] sm:text-[15px] max-w-sm mx-auto leading-relaxed px-2 sm:px-0">
            Upload your image or video and let our AI remove unwanted watermarks in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10 sm:mb-14"
        >
          <div className="text-center mb-6 sm:mb-8">
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 tracking-wider uppercase">How It Works</span>
            <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a2e] mt-1.5 sm:mt-2">Three simple steps</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {[
              {
                step: "01",
                icon: UploadSimple,
                title: "Upload your file",
                desc: "Drag & drop or browse to select an image or video containing a watermark.",
              },
              {
                step: "02",
                icon: MagicWand,
                title: "AI removes watermark",
                desc: "Our engine detects and removes the watermark using smart inpainting or frequency analysis.",
              },
              {
                step: "03",
                icon: Download,
                title: "Download clean result",
                desc: "Preview the result and download your watermark-free file in its original format.",
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="glass-card rounded-xl p-4 sm:p-6 text-center flex sm:block items-center gap-4 sm:gap-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center shrink-0 sm:mx-auto sm:mb-4">
                    <Icon size={16} weight="duotone" className="text-[#c9a96e]" />
                  </div>
                  <div className="text-left sm:text-center">
                    <span className="text-[10px] sm:text-[11px] font-mono text-gray-400 mb-0.5 sm:mb-1 block mt-0 sm:mt-0">{s.step}</span>
                    <h4 className="text-sm sm:text-sm font-semibold text-[#1a1a2e] mb-0.5 sm:mb-1.5">{s.title}</h4>
                    <p className="text-[12px] sm:text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 text-[11px] sm:text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><ImageIcon size={12} /> Images</span>
            <span className="flex items-center gap-1.5"><VideoCamera size={12} /> Videos</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl p-4 sm:p-8"
        >
          <div className="overflow-x-auto hide-scrollbar -mx-1 sm:mx-0 mb-6 sm:mb-8">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit min-w-max sm:min-w-0 mx-1 sm:mx-0">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <motion.button
                    key={t.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabChange(t.id)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                      active ? "text-[#1a1a2e]" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="tab-bg"
                        className="absolute inset-0 bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                      <Icon size={14} weight={active ? "fill" : "regular"} />
                      {t.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all ${
              hasPreview ? "p-3 sm:p-4" : "p-8 sm:p-14 cursor-pointer"
            } ${
              dragOver ? "border-[#c9a96e]/50 bg-[#c9a96e]/5" : file
                ? "border-gray-200 bg-gray-50/50" : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
            }`}
          >
            {hasPreview && (isImage || isVideo) ? (
              <RegionSelector src={preview} fileType={activeTab} onRegionChange={setRegion} />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-4 sm:mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <UploadSimple size={22} weight="light" className="text-gray-400 sm:text-[26px]" />
                </div>
                <p className="font-medium text-xs sm:text-sm text-gray-600 text-center">
                  Drop your {activeTab} here or click to browse
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">{hintMap[activeTab]}</p>
              </div>
            )}
            <input ref={inputRef} type="file" hidden accept={acceptMap[activeTab]}
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
          </div>

          <div className="mt-5 sm:mt-6">
            <label className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-2.5 sm:mb-3 block tracking-wider uppercase">Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setMethod(m.id)}
                    className={`relative flex items-start gap-3 p-3 sm:p-3.5 rounded-xl text-left transition-all ${
                      active
                        ? "bg-[#1a1a2e] text-white shadow-md"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                    }`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      active ? "bg-white/10" : "bg-white border border-gray-100"
                    }`}>
                      <Icon size={14} weight={active ? "fill" : "regular"} className={active ? "text-[#c9a96e]" : "text-gray-400"} />
                    </div>
                    <div className="text-left min-w-0">
                      <span className={`text-xs sm:text-sm font-medium block truncate ${active ? "text-white" : "text-gray-700"}`}>
                        {m.label}
                      </span>
                      <span className={`text-[11px] sm:text-xs mt-0.5 block leading-normal ${active ? "text-white/60" : "text-gray-500"}`}>
                        {m.desc}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.button
            whileTap={!file || loading ? {} : { scale: 0.99 }}
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-5 sm:mt-6 w-full py-3 sm:py-3.5 rounded-xl font-medium text-xs sm:text-sm transition-all bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
          >
            {loading ? (
              <>
                <Spinner size={16} weight="bold" className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MagicWand size={14} weight="duotone" />
                {region ? "Remove Selected Area" : "Remove Watermark"}
                <ArrowRight size={13} weight="bold" />
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="mt-3 sm:mt-4 p-3 sm:p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 sm:gap-3"
              >
                <XCircle size={16} weight="fill" className="text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-red-600">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {resultUrl && (
              <motion.div
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                transition={{ duration: 0.4 }}
                className="mt-4 sm:mt-6 p-3 sm:p-4 bg-emerald-50 border border-emerald-100 rounded-xl"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                  <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-emerald-700">Watermark removed successfully</span>
                </div>
                {isImage ? (
                  <div className="relative w-full max-h-48 sm:max-h-64 aspect-video mx-auto mb-3 sm:mb-4">
                    <NextImage src={resultUrl} alt="Result" fill className="object-contain rounded-lg" unoptimized />
                  </div>
                ) : (
                  <video src={resultUrl} controls playsInline className="max-h-48 sm:max-h-64 mx-auto rounded-lg mb-3 sm:mb-4 w-full" />
                )}
                <motion.a
                  whileTap={{ scale: 0.99 }}
                  href={resultUrl} download
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#1a1a2e] text-white text-xs sm:text-sm font-medium hover:bg-[#2a2a4e] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                >
                  <Download size={14} weight="regular" />
                  Download
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="border-t border-black/[0.04] py-4 sm:py-6 px-4 sm:px-6 text-center relative z-10"
      >
        <p className="text-xs sm:text-sm text-gray-400">
          <Link href="/blog" className="hover:text-gray-600 transition-colors inline-flex items-center gap-1">
            <BookOpen size={12} /> Guides
          </Link>
          <span className="mx-2 sm:mx-3">·</span>
          Built with FastAPI + Next.js
        </p>
      </motion.footer>
    </div>
  );
}
