import { FRAMEWATCH_MESSAGE } from '@/src/shared/messages';

async function sendToActiveTab(message: unknown): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) {
    return;
  }

  try {
    await browser.tabs.sendMessage(tab.id, message);
  } catch {
    // Content script may not be injected on restricted pages.
  }
}

export default defineBackground(() => {
  browser.commands.onCommand.addListener((command) => {
    if (command === 'toggle-hud') {
      void sendToActiveTab({ type: FRAMEWATCH_MESSAGE.TOGGLE_HUD });
    }
  });
});
