function getPseudoFullscreenContainer(hostname: string): Element | null {
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return document.querySelector('#movie_player.ytp-fullscreen, .html5-video-player.ytp-fullscreen');
  }

  if (hostname.includes('twitch.tv')) {
    return document.querySelector(
      '.video-player__container--fullscreen, [class*="video-player"][class*="fullscreen"]',
    );
  }

  return null;
}

export class FullscreenManager {
  private readonly host: HTMLElement;

  private readonly hostname: string;

  constructor(host: HTMLElement, hostname: string) {
    this.host = host;
    this.hostname = hostname;
  }

  start(): void {
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  stop(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  sync(alwaysOnFullscreen: boolean): { isFullscreenLike: boolean; shouldDisplay: boolean } {
    const target = this.resolveTargetParent();

    if (target) {
      if (this.host.parentElement !== target) {
        target.appendChild(this.host);
      }
      return {
        isFullscreenLike: true,
        shouldDisplay: alwaysOnFullscreen,
      };
    }

    const fallback = document.documentElement;
    if (fallback && this.host.parentElement !== fallback) {
      fallback.appendChild(this.host);
    }

    return {
      isFullscreenLike: false,
      shouldDisplay: true,
    };
  }

  private resolveTargetParent(): Element | null {
    if (document.fullscreenElement) {
      return document.fullscreenElement;
    }

    return getPseudoFullscreenContainer(this.hostname);
  }

  private readonly onFullscreenChange = (): void => {
    this.sync(true);
  };
}
