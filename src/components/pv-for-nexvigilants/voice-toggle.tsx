"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface VoiceToggleProps {
  /** Relay WebSocket URL */
  relayUrl?: string;
  /** Called when transcript is received */
  onTranscript?: (text: string) => void;
  /** Called when AI response is received */
  onResponse?: (text: string) => void;
  /** Called when audio output is received (base64 mp3) */
  onAudio?: (base64: string) => void;
}

type VoiceState = "idle" | "recording" | "processing" | "speaking";

const DEFAULT_RELAY = "ws://localhost:8080/voice";

export function VoiceToggle({
  relayUrl = DEFAULT_RELAY,
  onTranscript,
  onResponse,
  onAudio,
}: VoiceToggleProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const connect = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }
      const ws = new WebSocket(relayUrl);
      ws.onopen = () => {
        wsRef.current = ws;
        resolve(ws);
      };
      ws.onerror = () => reject(new Error("WebSocket connection failed"));
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "status":
            if (msg.status === "thinking") setState("processing");
            if (msg.status === "speaking") setState("speaking");
            break;
          case "transcript":
            onTranscript?.(msg.text);
            break;
          case "response":
            onResponse?.(msg.text);
            break;
          case "audio":
            onAudio?.(msg.data);
            // Auto-play
            if (audioRef.current) {
              audioRef.current.src = `data:audio/mp3;base64,${msg.data}`;
              audioRef.current.play().catch(() => {});
            }
            setState("idle");
            break;
          case "error":
            console.error("[voice]", msg.message);
            setState("idle");
            break;
        }
      };
      ws.onclose = () => {
        wsRef.current = null;
        setState("idle");
      };
    });
  }, [relayUrl, onTranscript, onResponse, onAudio]);

  const startRecording = useCallback(async () => {
    try {
      const ws = await connect();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const buffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        setState("processing");
        ws.send(
          JSON.stringify({ type: "audio", data: base64, format: "webm" }),
        );
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch (e) {
      console.error("[voice] Failed to start recording:", e);
      setState("idle");
    }
  }, [connect]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle") {
      startRecording();
    }
  }, [state, startRecording, stopRecording]);

  const stateColors: Record<VoiceState, string> = {
    idle: "text-slate-500 hover:text-cyan-400 border-slate-700 hover:border-cyan-500/40",
    recording: "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse",
    processing: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    speaking: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  };

  const stateLabels: Record<VoiceState, string> = {
    idle: "Voice",
    recording: "Listening...",
    processing: "Thinking...",
    speaking: "Speaking...",
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={state === "processing" || state === "speaking"}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${stateColors[state]}`}
        title={stateLabels[state]}
      >
        {state === "recording" ? (
          <MicOff className="h-3.5 w-3.5" />
        ) : state === "speaking" ? (
          <Volume2 className="h-3.5 w-3.5" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
        {stateLabels[state]}
      </button>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
