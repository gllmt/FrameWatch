import { FrameWatchController } from '@/src/content/controller';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    if (window.top !== window.self) {
      return;
    }

    const controller = new FrameWatchController();
    void controller.start();

    window.addEventListener('pagehide', () => {
      controller.stop();
    });
  },
});
