/**
 * FrameWatch
 * Copyright (c) 2026 Pierre Guillemot
 * Licensed under AGPL-3.0
 */

import type { PopupStatus } from '@/src/shared/types';

export const FRAMEWATCH_MESSAGE = {
  GET_STATUS: 'framewatch:get-status',
  SET_HUD_ENABLED: 'framewatch:set-hud-enabled',
  TOGGLE_HUD: 'framewatch:toggle-hud',
} as const;

export interface GetStatusMessage {
  type: typeof FRAMEWATCH_MESSAGE.GET_STATUS;
}

export interface SetHudEnabledMessage {
  type: typeof FRAMEWATCH_MESSAGE.SET_HUD_ENABLED;
  enabled: boolean;
}

export interface ToggleHudMessage {
  type: typeof FRAMEWATCH_MESSAGE.TOGGLE_HUD;
}

export type FrameWatchIncomingMessage = GetStatusMessage | SetHudEnabledMessage | ToggleHudMessage;

export interface SetHudEnabledResponse {
  hudEnabled: boolean;
}

export interface ToggleHudResponse {
  hudEnabled: boolean;
}

export type FrameWatchResponse = PopupStatus | SetHudEnabledResponse | ToggleHudResponse;
