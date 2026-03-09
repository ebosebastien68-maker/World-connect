// ============================================================================
// WORLD CONNECT - MESSAGES.TSX
// Converti depuis messages.html — Version 3.0
// Chat temps réel, fichiers, voix, réactions
// ============================================================================

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import * as THREE from 'three';

// ============================================================================
// CSS INLINE
// ============================================================================
const MESSAGES_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg-primary:   #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary:  #2d3748;
  --text-primary:   #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary:  #64748b;
  --border-color: #334155;
  --accent-blue:   #3b82f6;
  --accent-cyan:   #06b6d4;
  --accent-purple: #8b5cf6;
  --accent-pink:   #ec4899;
  --accent-red:    #ef4444;
  --accent-kaki:   #6b7249;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  height: 100vh;
}

#three-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* ── Wrapper ─────────────────────────────────────────────── */
.messages-wrapper {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  height: 100vh;
  background: rgba(15,23,42,0.85);
  backdrop-filter: blur(10px);
}

.messages-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  background: rgba(30,41,59,0.95);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.messages-header h1 {
  font-size: 20px; font-weight: 700; color: var(--text-primary);
  display: flex; align-items: center; gap: 10px;
}
.messages-header h1 i { color: var(--accent-blue); }

.header-actions { display: flex; gap: 10px; }

.action-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 10px; border: none; cursor: pointer;
  font-size: 14px; font-weight: 600; transition: all 0.2s ease; font-family: inherit;
  background: var(--accent-blue); color: white;
}
.action-btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); }
.action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
.action-btn.secondary:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }

.messages-container { flex: 1; overflow: hidden; }

.chat-area { height: 100%; display: flex; flex-direction: column; }

/* ── Empty state ─────────────────────────────────────────── */
.empty-state {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: var(--text-tertiary); gap: 16px; padding: 40px;
}
.empty-state i { font-size: 64px; opacity: 0.4; }
.empty-state h3 { font-size: 20px; font-weight: 600; color: var(--text-secondary); }
.empty-state p { font-size: 14px; text-align: center; max-width: 300px; }

/* ── Chat header ─────────────────────────────────────────── */
.chat-header {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 20px;
  background: rgba(30,41,59,0.95);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.chat-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 16px; flex-shrink: 0;
}

.chat-user-info { flex: 1; min-width: 0; }
.chat-user-info h3 {
  font-size: 16px; font-weight: 700; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.chat-user-info p { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

.chat-header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.chat-header-btn {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: var(--bg-tertiary); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease; font-size: 15px;
}
.chat-header-btn:hover { background: var(--accent-blue); color: white; transform: translateY(-2px); }
.chat-header-btn.voice-enabled { background: rgba(59,130,246,0.2); color: var(--accent-blue); }

/* ── Messages area ───────────────────────────────────────── */
.chat-messages {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 4px;
}
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius: 2px; }

/* Date separator */
.date-separator {
  display: flex; align-items: center; text-align: center;
  margin: 16px 0; color: var(--text-tertiary); font-size: 12px; font-weight: 600;
}
.date-separator::before, .date-separator::after { content: ''; flex: 1; border-bottom: 1px solid var(--border-color); }
.date-separator span { padding: 4px 12px; background: rgba(15,23,42,0.8); border-radius: 20px; border: 1px solid var(--border-color); }

/* Message groups */
.message-group { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }

/* Message bubbles */
.message-bubble {
  position: relative; max-width: 75%; padding: 10px 14px; border-radius: 18px;
  word-wrap: break-word; cursor: pointer;
}
.message-bubble:hover .reaction-picker { opacity: 1; pointer-events: all; }

.message-sent {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--accent-blue), #1a56db);
  color: white; border-bottom-right-radius: 4px;
}
.message-received {
  align-self: flex-start;
  background: var(--bg-secondary); color: var(--text-primary);
  border: 1px solid var(--border-color); border-bottom-left-radius: 4px;
}

.message-sent.first-in-group    { border-radius: 18px 18px 4px 18px; }
.message-sent.middle-in-group   { border-radius: 18px 4px 4px 18px; }
.message-sent.last-in-group     { border-radius: 18px 4px 18px 18px; }
.message-received.first-in-group  { border-radius: 4px 18px 18px 4px; }
.message-received.middle-in-group { border-radius: 4px 18px 18px 4px; }
.message-received.last-in-group   { border-radius: 4px 18px 18px 18px; }

.message-text { font-size: 14px; line-height: 1.5; }

.message-image {
  max-width: 100%; max-height: 300px; border-radius: 12px;
  cursor: pointer; display: block; object-fit: cover;
}

.message-time {
  font-size: 11px; opacity: 0.7; margin-top: 4px;
  display: flex; align-items: center; gap: 4px; justify-content: flex-end;
}
.message-received .message-time { justify-content: flex-start; }
.message-status { display: inline-flex; align-items: center; font-size: 12px; }

/* Edit / delete */
.message-actions { display: flex; gap: 6px; margin-top: 6px; justify-content: flex-end; }
.message-action-btn {
  background: rgba(255,255,255,0.1); border: none; color: rgba(255,255,255,0.8);
  cursor: pointer; width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease; font-size: 12px;
}
.message-action-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
.message-action-btn.delete:hover { background: rgba(239,68,68,0.3); color: #ef4444; }

/* Audio */
.message-audio { display: flex; align-items: center; gap: 12px; min-width: 200px; padding: 6px 0; }
.audio-play-btn {
  width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.2);
  border: none; color: white; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all 0.2s ease; font-size: 14px; flex-shrink: 0;
}
.audio-play-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
.audio-duration { font-size: 13px; opacity: 0.9; }

/* File */
.message-file {
  display: flex; align-items: center; gap: 12px; padding: 8px;
  background: rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer;
  transition: all 0.2s ease; min-width: 220px;
}
.message-file:hover { background: rgba(255,255,255,0.15); }
.file-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(255,255,255,0.15); display: flex; align-items: center;
  justify-content: center; font-size: 18px; flex-shrink: 0;
}
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-meta { font-size: 11px; opacity: 0.7; display: flex; gap: 8px; margin-top: 2px; }
.file-download { opacity: 0.7; font-size: 16px; flex-shrink: 0; }

/* Reactions */
.reaction-picker {
  position: absolute; top: -44px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 4px; background: var(--bg-secondary);
  border: 1px solid var(--border-color); border-radius: 24px;
  padding: 6px 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  z-index: 10; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; white-space: nowrap;
}
.reaction-emoji { cursor: pointer; font-size: 18px; transition: transform 0.2s ease; user-select: none; }
.reaction-emoji:hover { transform: scale(1.3); }

.message-reactions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.reaction-item {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; background: var(--bg-tertiary);
  border: 1px solid var(--border-color); border-radius: 12px;
  font-size: 13px; cursor: pointer; transition: all 0.2s ease; color: var(--text-primary);
}
.reaction-item:hover, .reaction-item.user-reacted {
  background: rgba(59,130,246,0.2); border-color: var(--accent-blue);
}

/* Typing */
.typing-indicator { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-style: italic; }
.typing-indicator .dot {
  width: 4px; height: 4px; border-radius: 50%; background: var(--text-secondary);
  animation: typing-dot 1.2s infinite;
}
.typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-dot {
  0%,60%,100% { opacity: 0.3; transform: translateY(0); }
  30%          { opacity: 1;   transform: translateY(-3px); }
}

/* ── Input area ──────────────────────────────────────────── */
.chat-input-area {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: rgba(30,41,59,0.95);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0; position: relative;
}

.attach-btn, .voice-btn {
  width: 40px; height: 40px; border-radius: 50%; border: none;
  background: var(--bg-tertiary); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease; font-size: 16px; flex-shrink: 0;
}
.attach-btn:hover, .voice-btn:hover { background: var(--accent-blue); color: white; transform: scale(1.1); }
.voice-btn.recording { background: #ef4444; color: white; animation: pulse-red 1s infinite; }
@keyframes pulse-red {
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
}

.attach-menu {
  position: absolute; bottom: 62px; left: 10px;
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 16px; padding: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 100; display: none; min-width: 160px;
}
.attach-menu.show { display: block; }

.attach-option {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: 10px; cursor: pointer;
  font-size: 14px; color: var(--text-primary); transition: all 0.2s ease;
}
.attach-option:hover { background: var(--bg-tertiary); }
.attach-option.admin-only { opacity: 0.5; cursor: not-allowed; }
.attach-option i { width: 20px; text-align: center; color: var(--accent-blue); }

.input-wrapper {
  flex: 1; background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 20px; padding: 10px 16px; cursor: pointer;
  transition: all 0.2s ease; min-height: 40px; display: flex; align-items: center;
}
.input-wrapper:hover { border-color: var(--accent-blue); }
.message-input-placeholder { color: var(--text-tertiary); font-size: 14px; user-select: none; }

.send-btn {
  width: 40px; height: 40px; border-radius: 50%; border: none;
  background: linear-gradient(135deg, var(--accent-blue), #1a56db);
  color: white; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all 0.2s ease; font-size: 16px; flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 4px 12px rgba(59,130,246,0.4); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Image preview */
.image-preview-container {
  padding: 10px 16px 0;
  background: rgba(30,41,59,0.95);
  flex-shrink: 0;
}
.image-preview { position: relative; display: inline-block; }
.image-preview img { height: 80px; border-radius: 10px; object-fit: cover; }
.remove-preview {
  position: absolute; top: -6px; right: -6px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #ef4444; color: white; border: none;
  cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;
}

/* File preview */
.file-preview-container {
  padding: 10px 16px 0;
  background: rgba(30,41,59,0.95);
  flex-shrink: 0;
}
.file-preview {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-tertiary); padding: 8px 12px;
  border-radius: 10px; max-width: 280px;
}
.file-preview-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: var(--accent-blue); display: flex; align-items: center;
  justify-content: center; color: white; font-size: 16px; flex-shrink: 0;
}
.file-preview-info { flex: 1; min-width: 0; }
.file-preview-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-preview-size { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.remove-file-preview { background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 18px; padding: 0 4px; }
.remove-file-preview:hover { color: #ef4444; }

/* ── Recording indicator ─────────────────────────────────── */
.recording-indicator {
  position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
  background: rgba(239,68,68,0.95); color: white;
  padding: 16px 24px; border-radius: 16px;
  display: none; flex-direction: column; align-items: center; gap: 8px;
  z-index: 1000; box-shadow: 0 8px 24px rgba(239,68,68,0.4); backdrop-filter: blur(10px);
}
.recording-indicator.show { display: flex; }
.recording-wave { display: flex; align-items: center; gap: 3px; height: 30px; }
.wave-bar { width: 4px; background: white; border-radius: 2px; animation: wave 0.8s ease-in-out infinite alternate; }
.wave-bar:nth-child(1) { animation-delay: 0.0s; }
.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }
.wave-bar:nth-child(6) { animation-delay: 0.5s; }
@keyframes wave {
  from { height: 6px; }
  to   { height: 28px; }
}
.recording-time { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
.recording-text { font-size: 13px; text-align: center; opacity: 0.9; line-height: 1.4; }

/* ── Modals ──────────────────────────────────────────────── */
.modal {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  z-index: 500; display: none; align-items: center; justify-content: center; padding: 20px;
}
.modal.show { display: flex; }

.modal-content {
  background: var(--bg-secondary); border-radius: 20px;
  width: 100%; max-width: 460px; max-height: 80vh;
  display: flex; flex-direction: column;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modalSlide 0.3s cubic-bezier(0.16,1,0.3,1);
}
@keyframes modalSlide {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;
}
.modal-header h3 { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
.modal-header h3 i { color: var(--accent-blue); }

.close-modal {
  background: none; border: none; font-size: 24px; color: var(--text-tertiary);
  cursor: pointer; width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease; line-height: 1;
}
.close-modal:hover { background: var(--bg-tertiary); color: var(--text-primary); transform: rotate(90deg); }

.modal-search { padding: 12px 16px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.modal-search input {
  width: 100%; padding: 10px 16px;
  background: var(--bg-primary); border: 1px solid var(--border-color);
  border-radius: 10px; color: var(--text-primary);
  font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.2s;
}
.modal-search input:focus { border-color: var(--accent-blue); }
.modal-search input::placeholder { color: var(--text-tertiary); }

.list-container { flex: 1; overflow-y: auto; padding: 8px; }
.list-container::-webkit-scrollbar { width: 4px; }
.list-container::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius: 2px; }

/* List items */
.list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease;
}
.list-item:hover, .list-item.active { background: var(--bg-tertiary); }

.item-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 16px; flex-shrink: 0;
}
.item-info { flex: 1; min-width: 0; }
.item-header { display: flex; align-items: center; gap: 8px; }
.item-name { font-size: 15px; font-weight: 600; color: var(--text-primary); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-role { font-size: 11px; padding: 2px 8px; border-radius: 20px; background: rgba(59,130,246,0.2); color: var(--accent-blue); font-weight: 600; flex-shrink: 0; }
.item-time { font-size: 12px; color: var(--text-tertiary); flex-shrink: 0; }
.item-preview { font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
.item-preview.unread { color: var(--text-primary); font-weight: 600; }
.item-unread {
  min-width: 22px; height: 22px; border-radius: 11px; padding: 0 6px;
  background: var(--accent-blue); color: white; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: var(--text-tertiary); gap: 12px; }
.loading i { font-size: 32px; }
.loading p { font-size: 14px; }

/* ── Message popup ───────────────────────────────────────── */
.message-popup-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  z-index: 600; display: none; align-items: flex-end; justify-content: center; padding: 20px;
}
.message-popup-overlay.show { display: flex; }

.message-popup {
  background: var(--bg-secondary); border-radius: 20px;
  width: 100%; max-width: 600px;
  border: 1px solid var(--border-color); box-shadow: 0 -8px 32px rgba(0,0,0,0.4);
  animation: popupUp 0.3s cubic-bezier(0.16,1,0.3,1); overflow: hidden;
}
@keyframes popupUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

.message-popup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
}
.message-popup-header h4 { font-size: 16px; font-weight: 700; color: var(--text-primary); }

.popup-close-btn {
  background: none; border: none; color: var(--text-tertiary);
  cursor: pointer; width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
}
.popup-close-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }

.message-popup-body { padding: 16px 20px; }

.message-popup-input {
  width: 100%; min-height: 100px; max-height: 300px;
  background: var(--bg-primary); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 12px 16px;
  color: var(--text-primary); font-size: 15px; font-family: inherit;
  resize: vertical; outline: none; transition: border-color 0.2s; line-height: 1.5;
}
.message-popup-input:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.message-popup-input::placeholder { color: var(--text-tertiary); }

.message-popup-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px 16px; border-top: 1px solid var(--border-color);
}

.popup-emoji-btn {
  background: none; border: none; font-size: 24px; cursor: pointer;
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
}
.popup-emoji-btn:hover { background: var(--bg-tertiary); transform: scale(1.1); }

.popup-send-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, var(--accent-blue), #1a56db);
  color: white; border: none; border-radius: 12px; cursor: pointer;
  font-size: 14px; font-weight: 600; transition: all 0.2s ease; font-family: inherit;
}
.popup-send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.4); }
.popup-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.popup-send-btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); }
.popup-send-btn.secondary:hover:not(:disabled) { box-shadow: none; background: var(--border-color); }

/* Spinner */
.spinner {
  width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 600px) {
  .messages-header { padding: 12px 16px; }
  .messages-header h1 { font-size: 17px; }
  .action-btn span { display: none; }
  .action-btn { padding: 8px 12px; }
  .chat-messages { padding: 12px; }
  .message-bubble { max-width: 88%; }
  .modal-content { max-height: 90vh; }
  .message-popup { border-radius: 20px 20px 0 0; }
  .message-popup-overlay { padding: 0; align-items: flex-end; }
}
`;

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile  { prenom: string; nom: string; role: 'admin' | 'user'; }
interface ChatUser     { user_id: string; prenom: string; nom: string; role: 'admin' | 'user'; }
interface SupabaseUser { id: string; }

interface MessageFile {
  message_id: string; file_url: string; file_name: string;
  file_type: string;  file_size: number; mime_type: string;
}

interface Message {
  message_id: string; sender_id: string; receiver_id?: string;
  texte: string | null; image_url: string | null;
  date_created: string; delivery_status: string; read_status: boolean;
  files?: MessageFile[];
}

interface Conversation {
  user: ChatUser; lastMessage: Message & { files?: MessageFile[] }; unread: number;
}

type ReactionData = { count: number; users: string[]; hasCurrentUser: boolean };
type ReactionMap   = Record<string, ReactionData>;

declare global {
  interface Window {
    supabaseClient: {
      supabase: any;
      getCurrentUser: () => Promise<SupabaseUser | null>;
      getUserProfile:  (id: string) => Promise<UserProfile | null>;
    };
  }
}

// ============================================================================
// STATIC HELPERS
// ============================================================================

function escapeHtml(text: string | null): string {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML.replace(/\n/g, '<br>');
}

function formatFileSize(bytes: number): string {
  if (!bytes) return 'Taille inconnue';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(t: string): string {
  const icons: Record<string, string> = {
    video: 'fa-file-video', audio: 'fa-file-audio', pdf: 'fa-file-pdf',
    zip: 'fa-file-archive', document: 'fa-file-word', other: 'fa-file',
  };
  return icons[t] || 'fa-file';
}

function getFileTypeFromMime(mime: string, name: string): string {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('zip')) return 'zip';
  if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
  if (mime.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'document';
  return 'other';
}

function formatTime(d: string): string {
  const date = new Date(d), now = new Date(), diff = now.getTime() - date.getTime();
  if (diff < 60_000) return "À l'instant";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (date.toDateString() === yest.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatMessageTime(d: string): string {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSep(d: string): string {
  const date = new Date(d), now = new Date();
  if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (date.toDateString() === yest.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function initials(user: ChatUser | UserProfile): string {
  return `${(user.prenom || 'U')[0]}${(user.nom || '')[0] || ''}`.toUpperCase();
}

// ============================================================================
// MESSAGE GROUPING HELPER
// ============================================================================
interface MsgGroup {
  id: string;
  showDateSep: boolean;
  dateLabel: string;
  senderId: string;
  messages: Message[];
}

function buildGroups(msgs: Message[]): MsgGroup[] {
  const groups: MsgGroup[] = [];
  let curDate = '';
  let curGroup: MsgGroup | null = null;

  msgs.forEach((msg) => {
    const msgDate = new Date(msg.date_created).toDateString();
    const newDate  = msgDate !== curDate;
    const newGroup = newDate || msg.sender_id !== curGroup?.senderId;

    if (newGroup) {
      if (curGroup) groups.push(curGroup);
      curGroup = {
        id: msg.message_id,
        showDateSep: newDate,
        dateLabel: newDate ? formatDateSep(msg.date_created) : '',
        senderId: msg.sender_id,
        messages: [],
      };
      if (newDate) curDate = msgDate;
    }
    curGroup!.messages.push(msg);
  });

  if (curGroup) groups.push(curGroup);
  return groups;
}

// ============================================================================
// MESSAGES PAGE COMPONENT
// ============================================================================

const MessagesPage: React.FC = () => {
  // ── CSS injection ──────────────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.id = 'messages-styles';
    s.textContent = MESSAGES_STYLES;
    document.head.appendChild(s);
    document.title = 'World Connect - Messages';
    return () => { document.getElementById('messages-styles')?.remove(); };
  }, []);

  // ── Three.js ───────────────────────────────────────────────────────────────
  const threeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!threeRef.current) return;
    const canvas = threeRef.current;
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.z = 50;

    // Particles
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(3000 * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 150;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.3, color: 0x4a90e2, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Lines
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);
    for (let i = 0; i < 80; i++) {
      const lg = new THREE.BufferGeometry();
      const lp = new Float32Array(6);
      for (let j = 0; j < 6; j++) lp[j] = (Math.random() - 0.5) * 100;
      lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
      linesGroup.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x3a7bc8, transparent: true, opacity: 0.2 })));
    }

    // Sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(8, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x2e5c8a, wireframe: true, transparent: true, opacity: 0.3 })
    );
    scene.add(sphere);

    let t = 0, animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.001;
      particles.rotation.y = t * 0.3; particles.rotation.x = t * 0.2;
      sphere.rotation.y = t * 0.5; sphere.rotation.x = t * 0.3;
      linesGroup.rotation.y = t * 0.2; linesGroup.rotation.z = t * 0.1;
      mat.opacity = 0.5 + Math.sin(t * 2) * 0.3;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); renderer.dispose(); };
  }, []);

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentUser,    setCurrentUser]    = useState<SupabaseUser | null>(null);
  const [userProfile,    setUserProfile]    = useState<UserProfile | null>(null);
  const [currentChat,    setCurrentChat]    = useState<ChatUser | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [reactions,      setReactions]      = useState<Record<string, ReactionMap>>({});
  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [contacts,       setContacts]       = useState<ChatUser[]>([]);

  // UI
  const [showConvModal,     setShowConvModal]     = useState(false);
  const [showContModal,     setShowContModal]     = useState(false);
  const [showMsgPopup,      setShowMsgPopup]      = useState(false);
  const [editingMsg,        setEditingMsg]        = useState<{ id: string; text: string } | null>(null);
  const [popupText,         setPopupText]         = useState('');
  const [editText,          setEditText]          = useState('');
  const [convSearch,        setConvSearch]        = useState('');
  const [contSearch,        setContSearch]        = useState('');
  const [showAttachMenu,    setShowAttachMenu]    = useState(false);
  const [otherTyping,       setOtherTyping]       = useState(false);
  const [voicePerm,         setVoicePerm]         = useState(false);
  const [targetVoiceOn,     setTargetVoiceOn]     = useState(false);
  const [isSendingPopup,    setIsSendingPopup]    = useState(false);
  const [isLoading,         setIsLoading]         = useState(true);

  // File/image
  const [selImage,    setSelImage]    = useState<File | null>(null);
  const [selFile,     setSelFile]     = useState<File | null>(null);
  const [imgPreview,  setImgPreview]  = useState('');
  const [filePreview, setFilePreview] = useState<{ name: string; size: string; icon: string } | null>(null);

  // Voice
  const [isRecording,   setIsRecording]   = useState(false);
  const [recTime,       setRecTime]       = useState('00:00');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const sb             = useRef<any>(null);          // supabase instance
  const chatMsgRef     = useRef<HTMLDivElement>(null);
  const msgSubRef      = useRef<any>(null);
  const typSubRef      = useRef<any>(null);
  const delSubRef      = useRef<any>(null);
  const reacSubRef     = useRef<any>(null);
  const typTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef    = useRef(false);
  const mediaRecRef    = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recStartRef    = useRef<number | null>(null);
  const recTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable refs for callbacks (avoid stale closures in subscriptions)
  const currentUserRef   = useRef<SupabaseUser | null>(null);
  const userProfileRef   = useRef<UserProfile | null>(null);
  const currentChatRef   = useRef<ChatUser | null>(null);
  const messagesRef      = useRef<Message[]>([]);
  const voicePermRef     = useRef(false);

  useEffect(() => { currentUserRef.current  = currentUser;  }, [currentUser]);
  useEffect(() => { userProfileRef.current  = userProfile;  }, [userProfile]);
  useEffect(() => { currentChatRef.current  = currentChat;  }, [currentChat]);
  useEffect(() => { messagesRef.current     = messages;     }, [messages]);
  useEffect(() => { voicePermRef.current    = voicePerm;    }, [voicePerm]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatMsgRef.current) {
      chatMsgRef.current.scrollTop = chatMsgRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Click outside attach menu ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const menu = document.getElementById('attach-menu-inner');
      const btn  = document.getElementById('attach-btn-inner');
      if (menu && btn && !menu.contains(e.target as Node) && !btn.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tryInit = () => {
      if (window.supabaseClient?.supabase) {
        sb.current = window.supabaseClient.supabase;
        initApp();
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();

    const interval = setInterval(() => {
      if (!document.hidden && currentUserRef.current) {
        loadConversations(currentUserRef.current, userProfileRef.current);
      }
    }, 30_000);

    const beforeUnload = () => {
      updateTypingStatus(false);
      if (mediaRecRef.current && isRecording) stopVoiceRecording();
      [msgSubRef, typSubRef, delSubRef, reacSubRef].forEach(r => {
        if (r.current) sb.current?.removeChannel(r.current);
      });
    };
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', beforeUnload);
      [msgSubRef, typSubRef, delSubRef, reacSubRef].forEach(r => {
        if (r.current) sb.current?.removeChannel(r.current);
      });
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

  // ── INIT APP ───────────────────────────────────────────────────────────────
  const initApp = async () => {
    const user    = await window.supabaseClient.getCurrentUser();
    if (!user) { window.location.href = 'connexion.tsx'; return; }

    const profile = await window.supabaseClient.getUserProfile(user.id);
    if (!profile) { window.location.href = 'connexion.tsx'; return; }

    setCurrentUser(user);
    setUserProfile(profile);
    currentUserRef.current  = user;
    userProfileRef.current  = profile;

    await loadVoicePermission(user, profile);

    if (profile.role === 'user') {
      await initUserChat(user, profile);
    } else {
      await initAdminChat(user, profile);
    }

    setIsLoading(false);
    subscribeToReactions();
  };

  // ── VOICE PERMISSION ───────────────────────────────────────────────────────
  const loadVoicePermission = async (user: SupabaseUser, profile: UserProfile) => {
    if (profile.role === 'admin') { setVoicePerm(true); voicePermRef.current = true; return; }
    try {
      const { data, error } = await sb.current
        .from('user_voice_permissions').select('voice_enabled').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') return;
      const v = data?.voice_enabled || false;
      setVoicePerm(v); voicePermRef.current = v;
    } catch { /* ignore */ }
  };

  const toggleUserVoicePermission = async (userId: string, enable: boolean) => {
    if (userProfileRef.current?.role !== 'admin') return;
    try {
      const { error } = await sb.current
        .from('user_voice_permissions')
        .upsert({ user_id: userId, voice_enabled: enable }, { onConflict: 'user_id' });
      if (error) throw error;
      alert(`Permission vocale ${enable ? 'activée' : 'désactivée'}`);
      setTargetVoiceOn(enable);
    } catch (err) {
      console.error('❌ toggleUserVoicePermission:', err);
      alert('Erreur lors de la modification');
    }
  };

  // ── INIT CHAT ──────────────────────────────────────────────────────────────
  const initUserChat = async (user: SupabaseUser, profile: UserProfile) => {
    const storedId = localStorage.getItem(`default_admin_${user.id}`);
    let admin: ChatUser | null = null;

    if (storedId) {
      const { data } = await sb.current
        .from('users_profile').select('*').eq('user_id', storedId).eq('role', 'admin').single();
      admin = data;
    }

    if (!admin) {
      const { data: admins } = await sb.current
        .from('users_profile').select('user_id,prenom,nom,role').eq('role', 'admin').limit(10);
      if (admins && admins.length > 0) {
        admin = admins[Math.floor(Math.random() * admins.length)];
        localStorage.setItem(`default_admin_${user.id}`, admin!.user_id);
      }
    }

    await loadConversations(user, profile);

    if (admin) {
      await openChat(admin, user, profile);
    }
  };

  const initAdminChat = async (user: SupabaseUser, profile: UserProfile) => {
    await loadConversations(user, profile);
    if (conversations.length > 0) {
      await openChat(conversations[0].user, user, profile);
    }
  };

  // ── LOAD CONVERSATIONS ─────────────────────────────────────────────────────
  const loadConversations = useCallback(async (
    user: SupabaseUser | null = currentUserRef.current,
    profile: UserProfile | null = userProfileRef.current
  ) => {
    if (!user || !profile) return;
    try {
      const [sent, recv] = await Promise.all([
        sb.current.from('messages')
          .select('message_id,sender_id,receiver_id,texte,image_url,date_created,read_status,delivery_status')
          .eq('sender_id', user.id).order('date_created', { ascending: false }).limit(100),
        sb.current.from('messages')
          .select('message_id,sender_id,receiver_id,texte,image_url,date_created,read_status,delivery_status')
          .eq('receiver_id', user.id).order('date_created', { ascending: false }).limit(100),
      ]);

      if (sent.error || recv.error) return;

      const allMsgs = [...(sent.data || []), ...(recv.data || [])]
        .sort((a: Message, b: Message) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

      const userIds = new Set<string>();
      allMsgs.forEach((m: Message) => {
        userIds.add(m.sender_id === user.id ? m.receiver_id! : m.sender_id);
      });

      if (!userIds.size) { setConversations([]); return; }

      const { data: users, error: usersErr } = await sb.current
        .from('users_profile').select('user_id,prenom,nom,role').in('user_id', Array.from(userIds));
      if (usersErr) return;

      const usersMap: Record<string, ChatUser> = {};
      (users || []).forEach((u: ChatUser) => { usersMap[u.user_id] = u; });

      const convMap: Record<string, Conversation> = {};
      allMsgs.forEach((msg: Message) => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id! : msg.sender_id;
        const other   = usersMap[otherId];
        if (!other) return;
        if (profile.role === 'user' && other.role !== 'admin') return;
        if (!convMap[otherId]) convMap[otherId] = { user: other, lastMessage: msg, unread: 0 };
        if (msg.receiver_id === user.id && !msg.read_status) convMap[otherId].unread++;
      });

      setConversations(
        Object.values(convMap).sort((a, b) =>
          new Date(b.lastMessage.date_created).getTime() - new Date(a.lastMessage.date_created).getTime()
        )
      );
    } catch (err) {
      console.error('loadConversations:', err);
    }
  }, []);

  // ── LOAD MESSAGES ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (otherUserId: string) => {
    const user = currentUserRef.current;
    if (!user) return;
    try {
      const [sent, recv] = await Promise.all([
        sb.current.from('messages')
          .select('message_id,sender_id,texte,image_url,date_created,delivery_status,read_status')
          .eq('sender_id', user.id).eq('receiver_id', otherUserId)
          .order('date_created', { ascending: true }).limit(100),
        sb.current.from('messages')
          .select('message_id,sender_id,texte,image_url,date_created,delivery_status,read_status')
          .eq('sender_id', otherUserId).eq('receiver_id', user.id)
          .order('date_created', { ascending: true }).limit(100),
      ]);

      if (sent.error || recv.error) return;

      const sorted: Message[] = [...(sent.data || []), ...(recv.data || [])]
        .sort((a, b) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());

      if (sorted.length > 0) {
        const ids = sorted.map((m: Message) => m.message_id);
        const { data: files } = await sb.current.from('message_files').select('*').in('message_id', ids);
        if (files) sorted.forEach((m: Message) => {
          m.files = (files as MessageFile[]).filter(f => f.message_id === m.message_id);
        });

        // Load reactions
        const reacMap: Record<string, ReactionMap> = {};
        for (const m of sorted) {
          reacMap[m.message_id] = await fetchReactionsForMessage(m.message_id, user.id);
        }
        setReactions(reacMap);
      }

      setMessages(sorted);
      messagesRef.current = sorted;
    } catch (err) {
      console.error('loadMessages:', err);
    }
  }, []);

  // ── LOAD CONTACTS ──────────────────────────────────────────────────────────
  const loadContacts = async () => {
    const user = currentUserRef.current, profile = userProfileRef.current;
    if (!user || !profile) return;
    try {
      let q = sb.current.from('users_profile')
        .select('user_id,prenom,nom,role').neq('user_id', user.id).order('prenom').limit(100);
      if (profile.role === 'user') q = q.eq('role', 'admin');
      const { data, error } = await q;
      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('loadContacts:', err);
    }
  };

  // ── OPEN CHAT ──────────────────────────────────────────────────────────────
  const openChat = async (
    user: ChatUser,
    currentU: SupabaseUser | null = currentUserRef.current,
    profile: UserProfile | null   = userProfileRef.current
  ) => {
    if (!currentU || !profile) return;

    // Reset file/image selection
    setSelImage(null); setSelFile(null); setImgPreview(''); setFilePreview(null);
    setCurrentChat(user); currentChatRef.current = user;

    // Load voice permission for target (admin view)
    if (profile.role === 'admin' && user.role === 'user') {
      const { data } = await sb.current
        .from('user_voice_permissions').select('voice_enabled').eq('user_id', user.user_id).single();
      setTargetVoiceOn(data?.voice_enabled || false);
    }

    await loadMessages(user.user_id);
    await markMessagesAsRead(user.user_id, currentU);
    subscribeToMessages(user.user_id, currentU);
    subscribeToTypingStatus(user.user_id, currentU);
    subscribeToDeliveryStatus(user.user_id, currentU);
  };

  // ── SEND MESSAGE (file / image) ────────────────────────────────────────────
  const sendMessage = async () => {
    const user = currentUserRef.current, chat = currentChatRef.current, profile = userProfileRef.current;
    if (!user || !chat || (!selImage && !selFile)) return;

    try {
      let imageUrl: string | null = null;

      if (selImage) {
        const fileName = `${Date.now()}_${selImage.name}`;
        const { error: upErr } = await sb.current.storage
          .from('messages-images').upload(fileName, selImage, { contentType: selImage.type, upsert: false });
        if (upErr) throw upErr;
        const { data } = sb.current.storage.from('messages-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { data: msgData, error: insErr } = await sb.current
        .from('messages')
        .insert({ sender_id: user.id, receiver_id: chat.user_id, texte: null, image_url: imageUrl, delivery_status: 'sent' })
        .select().single();
      if (insErr) throw insErr;

      if (selFile && (profile?.role === 'admin' || voicePermRef.current)) {
        const bucket   = profile?.role === 'admin' ? 'messages-files' : 'messages-filesuser';
        const fileName = `${Date.now()}_${selFile.name}`;
        const { error: fErr } = await sb.current.storage
          .from(bucket).upload(fileName, selFile, { contentType: selFile.type, upsert: false });
        if (fErr) throw fErr;
        const { data: urlData } = sb.current.storage.from(bucket).getPublicUrl(fileName);
        const fileType = getFileTypeFromMime(selFile.type, selFile.name);
        const { error: metaErr } = await sb.current.from('message_files').insert({
          message_id: msgData.message_id, file_url: urlData.publicUrl,
          file_name: selFile.name, file_type: fileType,
          file_size: selFile.size, mime_type: selFile.type, uploaded_by: user.id,
        });
        if (metaErr) throw metaErr;
      }

      setSelImage(null); setSelFile(null); setImgPreview(''); setFilePreview(null);

    } catch (err: any) {
      console.error('sendMessage:', err);
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    }
  };

  // ── SEND FROM POPUP ────────────────────────────────────────────────────────
  const sendFromPopup = async () => {
    const user = currentUserRef.current, chat = currentChatRef.current;
    if (!user || !chat || !popupText.trim()) return;

    setIsSendingPopup(true);
    updateTypingStatus(false);

    try {
      const { error } = await sb.current.from('messages').insert({
        sender_id: user.id, receiver_id: chat.user_id,
        texte: popupText.trim(), image_url: null, delivery_status: 'sent',
      });
      if (error) throw error;
      setPopupText(''); setShowMsgPopup(false);
    } catch (err) {
      console.error('sendFromPopup:', err);
      alert("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSendingPopup(false);
    }
  };

  // ── MARK AS READ ──────────────────────────────────────────────────────────
  const markMessagesAsRead = async (
    otherId: string,
    user: SupabaseUser | null = currentUserRef.current
  ) => {
    if (!user) return;
    try {
      await sb.current.from('messages')
        .update({ read_status: true, delivery_status: 'read', read_at: new Date().toISOString() })
        .eq('sender_id', otherId).eq('receiver_id', user.id).eq('read_status', false);
      loadConversations();
    } catch { /* ignore */ }
  };

  // ── TYPING ────────────────────────────────────────────────────────────────
  const updateTypingStatus = useCallback(async (typing: boolean) => {
    const user = currentUserRef.current, chat = currentChatRef.current;
    if (!user || !chat) return;
    isTypingRef.current = typing;
    try {
      if (typing) {
        await sb.current.from('typing_status')
          .upsert({ user_id: user.id, chat_with_user_id: chat.user_id, is_typing: true });
      } else {
        await sb.current.from('typing_status')
          .delete().eq('user_id', user.id).eq('chat_with_user_id', chat.user_id);
      }
    } catch { /* ignore */ }
  }, []);

  const handlePopupInput = (val: string) => {
    setPopupText(val);
    if (val.trim() && !isTypingRef.current) updateTypingStatus(true);
    if (typTimerRef.current) clearTimeout(typTimerRef.current);
    typTimerRef.current = setTimeout(() => updateTypingStatus(false), 2000);
  };

  // ── VOICE RECORDING ────────────────────────────────────────────────────────
  const toggleVoiceRecording = async () => {
    const profile = userProfileRef.current;
    if (profile?.role !== 'admin' && !voicePermRef.current) {
      alert("Vous n'avez pas la permission d'envoyer des messages vocaux.");
      return;
    }
    if (!isRecording) await startVoiceRecording();
    else               await stopVoiceRecording();
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadVoiceMessage(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecRef.current = mr;
      setIsRecording(true);
      recStartRef.current = Date.now();
      recTimerRef.current = setInterval(() => {
        if (!recStartRef.current) return;
        const el = Math.floor((Date.now() - recStartRef.current) / 1000);
        const m  = Math.floor(el / 60).toString().padStart(2, '0');
        const s  = (el % 60).toString().padStart(2, '0');
        setRecTime(`${m}:${s}`);
      }, 1000);
    } catch {
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopVoiceRecording = async () => {
    if (!mediaRecRef.current || !isRecording) return;
    mediaRecRef.current.stop();
    setIsRecording(false);
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
    setRecTime('00:00');
  };

  const uploadVoiceMessage = async (blob: Blob) => {
    const user = currentUserRef.current, chat = currentChatRef.current, profile = userProfileRef.current;
    if (!user || !chat) return;
    try {
      const bucket   = profile?.role === 'admin' ? 'messages-files' : 'messages-filesuser';
      const { data: msgData, error: insErr } = await sb.current
        .from('messages').insert({ sender_id: user.id, receiver_id: chat.user_id, texte: null, image_url: null, delivery_status: 'sent' })
        .select().single();
      if (insErr) throw insErr;

      const fileName = `voice_${Date.now()}_${user.id}.wav`;
      const { error: upErr } = await sb.current.storage
        .from(bucket).upload(fileName, blob, { contentType: 'audio/wav', upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = sb.current.storage.from(bucket).getPublicUrl(fileName);
      const { error: metaErr } = await sb.current.from('message_files').insert({
        message_id: msgData.message_id, file_url: urlData.publicUrl,
        file_name: fileName, file_type: 'audio', file_size: blob.size, mime_type: 'audio/wav',
      });
      if (metaErr) throw metaErr;
    } catch (err: any) {
      alert('Erreur lors de l\'envoi du message vocal: ' + (err.message || 'Erreur inconnue'));
    }
  };

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
  const subscribeToMessages = (otherId: string, user: SupabaseUser) => {
    if (msgSubRef.current) sb.current.removeChannel(msgSubRef.current);
    msgSubRef.current = sb.current
      .channel(`chat-${user.id}-${otherId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
        const n = payload.new;
        if ((n.sender_id === otherId && n.receiver_id === user.id) ||
            (n.sender_id === user.id && n.receiver_id === otherId)) {
          const { data: files } = await sb.current.from('message_files').select('*').eq('message_id', n.message_id);
          n.files = files || [];
          setMessages(prev => {
            const next = [...prev, n]; messagesRef.current = next; return next;
          });
          if (n.receiver_id === user.id) markMessagesAsRead(otherId, user);
          loadConversations(user, userProfileRef.current);
        }
      })
      .subscribe();
  };

  const subscribeToTypingStatus = (otherId: string, user: SupabaseUser) => {
    if (typSubRef.current) sb.current.removeChannel(typSubRef.current);
    typSubRef.current = sb.current
      .channel(`typing-${user.id}-${otherId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_status', filter: `user_id=eq.${otherId}` }, (payload: any) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new.is_typing && payload.new.chat_with_user_id === user.id) setOtherTyping(true);
        } else if (payload.eventType === 'DELETE') {
          setOtherTyping(false);
        }
      })
      .subscribe();
  };

  const subscribeToDeliveryStatus = (otherId: string, user: SupabaseUser) => {
    if (delSubRef.current) sb.current.removeChannel(delSubRef.current);
    delSubRef.current = sb.current
      .channel(`delivery-${user.id}-${otherId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, (payload: any) => {
        const { message_id, delivery_status, read_status } = payload.new;
        setMessages(prev => prev.map(m =>
          m.message_id === message_id ? { ...m, delivery_status, read_status } : m
        ));
      })
      .subscribe();
  };

  // ── REACTIONS ─────────────────────────────────────────────────────────────
  const fetchReactionsForMessage = async (msgId: string, userId: string): Promise<ReactionMap> => {
    const { data, error } = await sb.current
      .from('message_reactions').select('emoji,user_id').eq('message_id', msgId);
    if (error || !data) return {};
    const map: ReactionMap = {};
    (data as { emoji: string; user_id: string }[]).forEach(r => {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [], hasCurrentUser: false };
      map[r.emoji].count++;
      map[r.emoji].users.push(r.user_id);
      if (r.user_id === userId) map[r.emoji].hasCurrentUser = true;
    });
    return map;
  };

  const loadMsgReactions = async (msgId: string) => {
    const user = currentUserRef.current;
    if (!user) return;
    const map = await fetchReactionsForMessage(msgId, user.id);
    setReactions(prev => ({ ...prev, [msgId]: map }));
  };

  const addReaction = async (msgId: string, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = currentUserRef.current;
    if (!user) return;
    try {
      const { data: existing } = await sb.current.from('message_reactions')
        .select('id,emoji').eq('message_id', msgId).eq('user_id', user.id).single();
      if (existing) {
        if (existing.emoji === emoji) {
          await sb.current.from('message_reactions').delete().eq('id', existing.id);
        } else {
          await sb.current.from('message_reactions').update({ emoji }).eq('id', existing.id);
        }
      } else {
        await sb.current.from('message_reactions').insert({ message_id: msgId, user_id: user.id, emoji });
      }
      loadMsgReactions(msgId);
    } catch (err) {
      console.error('addReaction:', err);
    }
  };

  const subscribeToReactions = () => {
    if (reacSubRef.current) sb.current.removeChannel(reacSubRef.current);
    reacSubRef.current = sb.current
      .channel('message-reactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (payload: any) => {
        const id = payload.new?.message_id || payload.old?.message_id;
        if (id) loadMsgReactions(id);
      })
      .subscribe();
  };

  // ── EDIT / DELETE ─────────────────────────────────────────────────────────
  const openEditMessage = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(text);
    setEditingMsg({ id, text });
  };

  const saveEditedMessage = async () => {
    if (!editingMsg || !editText.trim()) return;
    const user = currentUserRef.current;
    if (!user) return;
    try {
      const { data: check, error: chkErr } = await sb.current
        .from('messages').select('read_status,sender_id').eq('message_id', editingMsg.id).single();
      if (chkErr) throw chkErr;
      if (check.read_status) { alert('❌ Ce message a déjà été lu, impossible de le modifier'); setEditingMsg(null); return; }
      if (check.sender_id !== user.id) { alert("❌ Vous n'êtes pas l'auteur de ce message"); setEditingMsg(null); return; }

      const { error } = await sb.current.from('messages')
        .update({ texte: editText.trim() }).eq('message_id', editingMsg.id);
      if (error) throw error;

      setMessages(prev => prev.map(m => m.message_id === editingMsg.id ? { ...m, texte: editText.trim() } : m));
      setEditingMsg(null);
    } catch (err: any) {
      alert('Erreur lors de la modification: ' + (err.message || 'Erreur inconnue'));
    }
  };

  const deleteMessage = async (msgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('❌ Supprimer définitivement ce message ?')) return;
    const profile = userProfileRef.current;
    try {
      const msg = messagesRef.current.find(m => m.message_id === msgId);
      if (msg?.files?.length) {
        const bucket = profile?.role === 'admin' ? 'messages-files' : 'messages-filesuser';
        for (const f of msg.files) {
          const name = f.file_url.split('/').pop()!;
          await sb.current.storage.from(bucket).remove([name]);
        }
      }
      const { error } = await sb.current.rpc('delete_message_with_files', { msg_id: msgId });
      if (error) {
        if (error.message.includes('déjà été lu')) alert('❌ Ce message a déjà été lu, impossible de le supprimer');
        else throw error;
        return;
      }
      setMessages(prev => { const next = prev.filter(m => m.message_id !== msgId); messagesRef.current = next; return next; });
      loadConversations();
    } catch (err) {
      console.error('deleteMessage:', err); alert('Erreur lors de la suppression du message');
    }
  };

  // ── FILE HANDLERS ─────────────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) { alert("L'image est trop volumineuse (max 5MB)"); return; }
    setSelImage(file);
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (userProfileRef.current?.role !== 'admin' && !voicePermRef.current) {
      alert("Vous n'avez pas la permission d'envoyer des fichiers."); e.target.value = ''; return;
    }
    if (file.size > 50_000_000) { alert('Le fichier est trop volumineux (max 50MB)'); e.target.value = ''; return; }
    setSelFile(file);
    setFilePreview({ name: file.name, size: formatFileSize(file.size), icon: getFileIcon(getFileTypeFromMime(file.type, file.name)) });
  };

  const playAudio = (url: string, btn: HTMLButtonElement) => {
    const audio = new Audio(url);
    const icon  = btn.querySelector('i');
    if (!icon) return;
    icon.className = 'fas fa-spinner fa-spin';
    audio.onloadeddata = () => { icon.className = 'fas fa-pause'; audio.play(); };
    audio.onended      = () => { icon.className = 'fas fa-play'; };
    audio.onerror      = () => { icon.className = 'fas fa-exclamation-triangle'; alert('Erreur de lecture'); };
  };

  const downloadFile = async (url: string, name: string) => {
    try {
      const blob = await fetch(url).then(r => r.blob());
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(a.href); document.body.removeChild(a);
    } catch { alert('Erreur lors du téléchargement'); }
  };

  // ── DERIVED DATA ──────────────────────────────────────────────────────────
  const filteredConversations = useMemo(() =>
    conversations.filter(c => `${c.user.prenom} ${c.user.nom}`.toLowerCase().includes(convSearch.toLowerCase())),
    [conversations, convSearch]
  );

  const filteredContacts = useMemo(() =>
    contacts.filter(u => `${u.prenom} ${u.nom}`.toLowerCase().includes(contSearch.toLowerCase())),
    [contacts, contSearch]
  );

  const msgGroups = useMemo(() => buildGroups(messages), [messages]);

  const showVoiceBtn = (userProfile?.role === 'admin') || voicePerm;
  const hasContent   = selImage !== null || selFile !== null;

  // ── RENDER HELPERS ────────────────────────────────────────────────────────
  const renderStatusIcon = (msg: Message) => {
    if (!currentUser || msg.sender_id !== currentUser.id) return null;
    if (msg.read_status)                    return <i className="fas fa-check-double" style={{ color: '#8a9b56' }} />;
    if (msg.delivery_status === 'delivered') return <i className="fas fa-check-double" />;
    if (msg.delivery_status === 'sent')      return <i className="fas fa-check" />;
    return null;
  };

  const canEdit   = (msg: Message) => currentUser && msg.sender_id === currentUser.id && !msg.read_status && msg.texte;
  const canDelete = (msg: Message) => currentUser && msg.sender_id === currentUser.id && !msg.read_status;

  const renderMessageBubble = (msg: Message, idx: number, groupLen: number) => {
    const isSent    = currentUser ? msg.sender_id === currentUser.id : false;
    const isFirst   = groupLen > 1 && idx === 0;
    const isLast    = groupLen > 1 && idx === groupLen - 1;
    const isMiddle  = groupLen > 1 && idx > 0 && idx < groupLen - 1;
    const isLastMsg = idx === groupLen - 1;

    const posClass = isFirst ? (isSent ? 'first-in-group' : 'first-in-group')
                   : isMiddle ? 'middle-in-group'
                   : isLast   ? 'last-in-group'
                   : '';

    const msgReactions = reactions[msg.message_id] || {};

    return (
      <div
        key={msg.message_id}
        className={`message-bubble ${isSent ? 'message-sent' : 'message-received'} ${posClass}`}
        data-message-id={msg.message_id}
      >
        {/* Reaction picker */}
        <div className="reaction-picker">
          {['😊', '😂', '❤️', '👍', '🎉', '🔥'].map(emoji => (
            <span key={emoji} className="reaction-emoji" onClick={e => addReaction(msg.message_id, emoji, e)}>{emoji}</span>
          ))}
        </div>

        {/* Text */}
        {msg.texte && (
          <div className="message-text" dangerouslySetInnerHTML={{ __html: escapeHtml(msg.texte) }} />
        )}

        {/* Image */}
        {msg.image_url && (
          <img src={msg.image_url} className="message-image"
            onClick={() => window.open(msg.image_url!, '_blank')} alt="" />
        )}

        {/* Files */}
        {msg.files?.map(file => file.file_type === 'audio' ? (
          <div key={file.file_url} className="message-audio">
            <button className="audio-play-btn" onClick={e => playAudio(file.file_url, e.currentTarget)}>
              <i className="fas fa-play" />
            </button>
            <div className="audio-waveform"><div className="audio-duration">🎵 Message vocal</div></div>
          </div>
        ) : (
          <div key={file.file_url} className="message-file" onClick={() => downloadFile(file.file_url, file.file_name)}>
            <div className="file-icon"><i className={`fas ${getFileIcon(file.file_type)}`} /></div>
            <div className="file-info">
              <div className="file-name">{file.file_name}</div>
              <div className="file-meta"><span>{file.file_type}</span><span>{formatFileSize(file.file_size)}</span></div>
            </div>
            <div className="file-download"><i className="fas fa-download" /></div>
          </div>
        ))}

        {/* Time + status (last in group only) */}
        {isLastMsg && (
          <>
            <div className="message-time">
              {formatMessageTime(msg.date_created)}
              <span className="message-status">{renderStatusIcon(msg)}</span>
            </div>
            {isSent && (canEdit(msg) || canDelete(msg)) && (
              <div className="message-actions">
                {canEdit(msg) && (
                  <button className="message-action-btn" title="Modifier"
                    onClick={e => openEditMessage(msg.message_id, msg.texte || '', e)}>
                    <i className="fas fa-edit" />
                  </button>
                )}
                {canDelete(msg) && (
                  <button className="message-action-btn delete" title="Supprimer"
                    onClick={e => deleteMessage(msg.message_id, e)}>
                    <i className="fas fa-trash" />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Reactions display */}
        {Object.keys(msgReactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(msgReactions).map(([emoji, data]) => (
              <span key={emoji}
                className={`reaction-item${data.hasCurrentUser ? ' user-reacted' : ''}`}
                onClick={e => addReaction(msg.message_id, emoji, e)}>
                {emoji} {data.count}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── JSX RETURN ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Three.js canvas */}
      <canvas ref={threeRef} id="three-canvas" />

      {/* Main wrapper */}
      <div className="messages-wrapper">

        {/* Header */}
        <div className="messages-header">
          <h1><i className="fas fa-globe" /> <span>{currentChat ? `${currentChat.prenom} ${currentChat.nom}` : 'World Connect'}</span></h1>
          <div className="header-actions">
            <button className="action-btn secondary" onClick={() => setShowConvModal(true)}>
              <i className="fas fa-list" /><span>Conversations</span>
            </button>
            <button className="action-btn" onClick={async () => {
              if (contacts.length === 0) await loadContacts();
              setShowContModal(true);
            }}>
              <i className="fas fa-user-plus" />
              <span>{userProfile?.role === 'user' ? 'Admins' : 'Contacts'}</span>
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="messages-container">
          <div className="chat-area">
            {isLoading ? (
              <div className="empty-state">
                <i className="fas fa-spinner fa-spin" />
                <h3>Chargement...</h3>
              </div>
            ) : !currentChat ? (
              <div className="empty-state">
                <i className="fas fa-comments" />
                <h3>Aucune conversation</h3>
                <p>Sélectionnez un contact pour démarrer</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="chat-header">
                  <div className="chat-avatar">{initials(currentChat)}</div>
                  <div className="chat-user-info">
                    <h3>{currentChat.prenom} {currentChat.nom}</h3>
                    <p id="user-status">
                      {otherTyping
                        ? <span className="typing-indicator">En train d'écrire<span className="dot" /><span className="dot" /><span className="dot" /></span>
                        : currentChat.role === 'admin' ? 'Administrateur' : 'Utilisateur'
                      }
                    </p>
                  </div>
                  <div className="chat-header-actions">
                    {userProfile?.role === 'admin' && currentChat.role === 'user' && (
                      <button
                        className={`chat-header-btn${targetVoiceOn ? ' voice-enabled' : ''}`}
                        title={`${targetVoiceOn ? 'Désactiver' : 'Activer'} les messages vocaux`}
                        onClick={() => toggleUserVoicePermission(currentChat.user_id, !targetVoiceOn)}>
                        <i className={`fas fa-microphone${targetVoiceOn ? '' : '-slash'}`} />
                      </button>
                    )}
                    <button className="chat-header-btn" title="Actualiser"
                      onClick={() => { loadMessages(currentChat.user_id); loadConversations(); }}>
                      <i className="fas fa-sync-alt" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-messages" ref={chatMsgRef}>
                  {msgGroups.map((group, gi) => (
                    <React.Fragment key={`${group.id}-${gi}`}>
                      {group.showDateSep && (
                        <div className="date-separator"><span>{group.dateLabel}</span></div>
                      )}
                      <div className="message-group">
                        {group.messages.map((msg, mi) => renderMessageBubble(msg, mi, group.messages.length))}
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* Image preview */}
                {imgPreview && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={imgPreview} alt="preview" />
                      <button className="remove-preview"
                        onClick={() => { setSelImage(null); setImgPreview(''); }}>×</button>
                    </div>
                  </div>
                )}

                {/* File preview */}
                {filePreview && (
                  <div className="file-preview-container">
                    <div className="file-preview">
                      <div className="file-preview-icon"><i className={`fas ${filePreview.icon}`} /></div>
                      <div className="file-preview-info">
                        <div className="file-preview-name">{filePreview.name}</div>
                        <div className="file-preview-size">{filePreview.size}</div>
                      </div>
                      <button className="remove-file-preview"
                        onClick={() => { setSelFile(null); setFilePreview(null); }}>×</button>
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="chat-input-area">
                  <input type="file" id="image-input" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                  <input type="file" id="file-input"
                    accept=".pdf,.zip,.mp3,.mp4,.wav,.doc,.docx,.xls,.xlsx,.avi,.mov,.rar,.7z"
                    style={{ display: 'none' }} onChange={handleFileSelect} />

                  {/* Attach button + menu */}
                  <div style={{ position: 'relative' }}>
                    <button id="attach-btn-inner" className="attach-btn"
                      onClick={() => setShowAttachMenu(v => !v)} title="Joindre">
                      <i className="fas fa-paperclip" />
                    </button>
                    <div id="attach-menu-inner" className={`attach-menu${showAttachMenu ? ' show' : ''}`}>
                      <div className="attach-option" onClick={() => {
                        (document.getElementById('image-input') as HTMLInputElement).click();
                        setShowAttachMenu(false);
                      }}>
                        <i className="fas fa-image" /><span>Photo</span>
                      </div>
                      <div className={`attach-option${!showVoiceBtn ? ' admin-only' : ''}`}
                        onClick={() => {
                          if (!showVoiceBtn) { alert('Permission requise. Contactez un administrateur.'); return; }
                          (document.getElementById('file-input') as HTMLInputElement).click();
                          setShowAttachMenu(false);
                        }}
                        title={!showVoiceBtn ? 'Permission requise' : 'Fichiers PDF, ZIP, vidéos…'}>
                        <i className="fas fa-file" /><span>Fichier {!showVoiceBtn ? '🔒' : ''}</span>
                      </div>
                      {showVoiceBtn && (
                        <div className="attach-option" onClick={() => { toggleVoiceRecording(); setShowAttachMenu(false); }}>
                          <i className="fas fa-microphone" /><span>Audio vocal</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voice button */}
                  {showVoiceBtn && (
                    <button className={`voice-btn${isRecording ? ' recording' : ''}`}
                      onClick={toggleVoiceRecording} title="Enregistrement vocal">
                      <i className={`fas fa-${isRecording ? 'stop' : 'microphone'}`} />
                    </button>
                  )}

                  {/* Input placeholder → opens popup (hidden when file selected) */}
                  {!hasContent && (
                    <div className="input-wrapper" onClick={() => setShowMsgPopup(true)}>
                      <div className="message-input-placeholder">Aa</div>
                    </div>
                  )}

                  {/* Send button (only when file/image selected) */}
                  {hasContent && (
                    <button className="send-btn" onClick={sendMessage}>
                      <i className="fas fa-paper-plane" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recording indicator */}
      <div className={`recording-indicator${isRecording ? ' show' : ''}`}>
        <div className="recording-wave">
          {[...Array(6)].map((_, i) => <div key={i} className="wave-bar" />)}
        </div>
        <div className="recording-time">{recTime}</div>
        <div className="recording-text">🎤 Enregistrement vocal en cours…<br />Cliquez à nouveau pour arrêter</div>
      </div>

      {/* ── CONVERSATIONS MODAL ── */}
      <div className={`modal${showConvModal ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowConvModal(false); }}>
        <div className="modal-content">
          <div className="modal-header">
            <h3><i className="fas fa-comments" /> Conversations récentes</h3>
            <button className="close-modal" onClick={() => setShowConvModal(false)}>×</button>
          </div>
          <div className="modal-search">
            <input type="text" placeholder="Rechercher une conversation…"
              value={convSearch} onChange={e => setConvSearch(e.target.value)} />
          </div>
          <div className="list-container">
            {filteredConversations.length === 0 ? (
              <div className="loading"><i className="fas fa-inbox" /><p>Aucune conversation</p></div>
            ) : filteredConversations.map(conv => {
              let lastMsg = '📎 Fichier';
              if (conv.lastMessage.files?.length) {
                const ft = conv.lastMessage.files[0].file_type;
                lastMsg = ft === 'audio' ? '🎵 Message vocal' : ft === 'video' ? '🎥 Vidéo' : ft === 'pdf' ? '📄 PDF' : '📎 Fichier';
              } else if (conv.lastMessage.image_url) {
                lastMsg = '📷 Photo';
              } else {
                lastMsg = (conv.lastMessage.texte || '').substring(0, 50) || '📎 Fichier';
              }
              const isActive = currentChat?.user_id === conv.user.user_id;
              return (
                <div key={conv.user.user_id} className={`list-item${isActive ? ' active' : ''}`}
                  onClick={() => { setShowConvModal(false); openChat(conv.user); }}>
                  <div className="item-avatar">{initials(conv.user)}</div>
                  <div className="item-info">
                    <div className="item-header">
                      <span className="item-name">{conv.user.prenom} {conv.user.nom}</span>
                      {conv.user.role === 'admin' && <span className="item-role">Admin</span>}
                      <span className="item-time">{formatTime(conv.lastMessage.date_created)}</span>
                    </div>
                    <div className={`item-preview${conv.unread > 0 ? ' unread' : ''}`}>{lastMsg}</div>
                  </div>
                  {conv.unread > 0 && <div className="item-unread">{conv.unread}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTACTS MODAL ── */}
      <div className={`modal${showContModal ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowContModal(false); }}>
        <div className="modal-content">
          <div className="modal-header">
            <h3><i className="fas fa-address-book" />
              {userProfile?.role === 'user' ? ' Administrateurs' : ' Tous les contacts'}
            </h3>
            <button className="close-modal" onClick={() => setShowContModal(false)}>×</button>
          </div>
          <div className="modal-search">
            <input type="text" placeholder="Rechercher un contact…"
              value={contSearch} onChange={e => setContSearch(e.target.value)} />
          </div>
          <div className="list-container">
            {contacts.length === 0 ? (
              <div className="loading"><i className="fas fa-spinner fa-spin" /><p>Chargement…</p></div>
            ) : filteredContacts.length === 0 ? (
              <div className="loading"><i className="fas fa-user-slash" /><p>Aucun contact disponible</p></div>
            ) : filteredContacts.map(user => (
              <div key={user.user_id} className="list-item"
                onClick={() => { setShowContModal(false); openChat(user); }}>
                <div className="item-avatar">{initials(user)}</div>
                <div className="item-info">
                  <div className="item-header">
                    <span className="item-name">{user.prenom} {user.nom}</span>
                    {user.role === 'admin' && <span className="item-role">Admin</span>}
                  </div>
                  <div className="item-preview">Démarrer une conversation</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MESSAGE POPUP (text input) ── */}
      <div className={`message-popup-overlay${showMsgPopup ? ' show' : ''}`}
        onClick={() => { setShowMsgPopup(false); setPopupText(''); updateTypingStatus(false); }}>
        <div className="message-popup" onClick={e => e.stopPropagation()}>
          <div className="message-popup-header">
            <h4>Nouveau message</h4>
            <button className="popup-close-btn" onClick={() => { setShowMsgPopup(false); setPopupText(''); updateTypingStatus(false); }}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="message-popup-body">
            <textarea
              className="message-popup-input"
              placeholder="Écrivez votre message…"
              value={popupText}
              autoFocus={showMsgPopup}
              onChange={e => handlePopupInput(e.target.value)}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); sendFromPopup(); } }}
            />
          </div>
          <div className="message-popup-footer">
            <button className="popup-emoji-btn" onClick={() => {
              const emojis = ['😊','😂','❤️','👍','🎉','🔥','😍','🤔','👏','🙏'];
              handlePopupInput(popupText + emojis[Math.floor(Math.random() * emojis.length)]);
            }}>😊</button>
            <button className="popup-send-btn" disabled={!popupText.trim() || isSendingPopup}
              onClick={sendFromPopup}>
              {isSendingPopup ? <span className="spinner" /> : <i className="fas fa-paper-plane" />}
              <span>{isSendingPopup ? 'Envoi…' : 'Envoyer'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── EDIT MESSAGE POPUP ── */}
      {editingMsg && (
        <div className="message-popup-overlay show" onClick={() => setEditingMsg(null)}>
          <div className="message-popup" onClick={e => e.stopPropagation()}>
            <div className="message-popup-header">
              <h4>Modifier le message</h4>
              <button className="popup-close-btn" onClick={() => setEditingMsg(null)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="message-popup-body">
              <textarea className="message-popup-input" autoFocus
                value={editText} onChange={e => setEditText(e.target.value)} />
            </div>
            <div className="message-popup-footer">
              <button className="popup-send-btn secondary" onClick={() => setEditingMsg(null)}>Annuler</button>
              <button className="popup-send-btn" disabled={!editText.trim()} onClick={saveEditedMessage}>
                <i className="fas fa-check" /><span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagesPage;
