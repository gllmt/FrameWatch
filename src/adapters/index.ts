import { GenericAdapter } from '@/src/adapters/generic-adapter';
import { TwitchAdapter } from '@/src/adapters/twitch-adapter';
import type { SiteAdapter } from '@/src/adapters/types';
import { YouTubeAdapter } from '@/src/adapters/youtube-adapter';

const GENERIC_ADAPTER = new GenericAdapter();
const ADAPTERS: SiteAdapter[] = [new YouTubeAdapter(), new TwitchAdapter(), GENERIC_ADAPTER];

export function resolveAdapter(location: Location): SiteAdapter {
  return ADAPTERS.find((adapter) => adapter.matches(location)) ?? GENERIC_ADAPTER;
}

export { GENERIC_ADAPTER };
