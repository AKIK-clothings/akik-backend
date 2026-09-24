"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Scissors,
  CheckCircle2,
  Layers,
  Eye,
} from "lucide-react";

interface ProcessStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  videoSrc: string;
  duration: string;
  stepNumber: string;
  tag: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "step-1",
    title: "Cloth Making Process",
    subtitle: "Artisanal Fabric Crafting",
    description:
      "Witness our master artisans crafting luxury boutique fabrics from raw spun yarns through time-honored traditional techniques.",
    videoSrc: "https://res.cloudinary.com/suxqbbxr/video/upload/v1789927781/cloth_making_process.mp4",
    duration: "0:25",
    stepNumber: "01",
    tag: "Cloth Making",
  },
  {
    id: "step-2",
    title: "Zari Inlay & Needlework",
    subtitle: "Tested Metallic Thread Embroidery",
    description:
      "Traditional Kadhwa and Dabka embroidery techniques executed stitch by stitch using fine metallic zari ribbons and antique bullion wires.",
    videoSrc: "https://res.cloudinary.com/suxqbbxr/video/upload/v1789927783/cloth_making_reel_2.mp4",
    duration: "0:34",
    stepNumber: "02",
    tag: "Artisanal Detailing",
  },

];

export const CraftProcessShowcase: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeStep = PROCESS_STEPS[activeStepIndex];

  const handleStepChange = (index: number) => {
    setActiveStepIndex(index);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section className="bg-[#141312] text-[#FAF9F6] py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C47D5A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#C47D5A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1 rounded-full text-xs uppercase tracking-[0.25em] text-[#C47D5A] font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Behind The Loom</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-wide text-white leading-tight">
            The Art of Handcrafted Textiles
          </h2>

          <p className="text-xs sm:text-sm text-white/70 mt-3 font-sans max-w-xl mx-auto leading-relaxed">
            Witness the intimate journey from raw unspun Chanderi silk threads and hand-carved block prints to our boutique&apos;s tailored celebratory ensembles.
          </p>
        </div>

        {/* Video Player & Interactive Chapter Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Cinematic Video Player (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black/80 border border-white/15 shadow-2xl group">
              <AnimatePresence mode="wait">
                <motion.video
                  key={activeStep.videoSrc}
                  ref={videoRef}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.2 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full object-cover"
                >
                  <source src={activeStep.videoSrc} type="video/mp4" />
                </motion.video>
              </AnimatePresence>

              {/* Video Overlay Info Banner */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeStep.tag}
                </span>
                <span className="bg-white/10 backdrop-blur-md text-white/80 text-[10px] px-2.5 py-1 rounded-full font-mono">
                  Chapter {activeStep.stepNumber} of 02
                </span>
              </div>

              {/* Bottom Video Controls */}
              <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between bg-black/60 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                    className="p-2 rounded-full bg-[#C47D5A] hover:bg-[#A8623E] text-white transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <div className="hidden sm:block">
                    <span className="text-xs font-serif font-medium text-white block">
                      {activeStep.title}
                    </span>
                    <span className="text-[10px] text-white/60">
                      Duration {activeStep.duration}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#C47D5A]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Video Caption & Story */}
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed">
              <span className="font-semibold text-[#C47D5A] mr-1.5">
                Master Weaver Note:
              </span>
              {activeStep.description}
            </div>
          </div>

          {/* Interactive Chapter List (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3">
            <div className="text-xs uppercase tracking-widest text-[#C47D5A] font-bold px-1">
              Cloth Making Process Chapters
            </div>

            <div className="flex flex-col gap-3">
              {PROCESS_STEPS.map((step, idx) => {
                const isActive = activeStepIndex === idx;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepChange(idx)}
                    className={`text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 ${
                      isActive
                        ? "bg-white/15 border-[#C47D5A] shadow-lg scale-[1.01]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-serif text-base font-bold shrink-0 transition-colors ${
                        isActive
                          ? "bg-[#C47D5A] text-white"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {step.stepNumber}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm sm:text-base text-white font-medium">
                          {step.title}
                        </span>
                        <span className="text-[10px] font-mono text-white/50">
                          {step.duration}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1 line-clamp-1 font-sans">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Artisanal Quality Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-white/80">
                <CheckCircle2 className="w-4 h-4 text-[#C47D5A] shrink-0" />
                <span>Zero Machine Poly Blends</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-white/80">
                <Scissors className="w-4 h-4 text-[#C47D5A] shrink-0" />
                <span>2-Inch Alteration Seams</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
