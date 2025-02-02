import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { CastData, Embed } from '@/app/types';

const FARCASTER_EPOCH = DateTime.fromISO('2021-01-01T00:00:00Z').toSeconds();
const BASE_URL = "https://nemes.farcaster.xyz:2281";

// Updated structure to include tags with URLs
interface ChannelConfig {
  url: string;
  tag: string;
}

const URL_PARAMS: ChannelConfig[] = [
  {
    url: "chain://eip155:7777777/erc721:0x5747eef366fd36684e8893bf4fe628efc2ac2d10",
    tag: "OG AI"
  },
  {
    url: "https://warpcast.com/~/channel/aichannel",
    tag: "AI Channel"
  },
  {
    url: "https://warpcast.com/~/channel/open-source-ai",
    tag: "Open Source AI"
  }
  // Add more URLs and tags here
];

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  
  // Handle relative paths
  if (url.startsWith('./') || url.startsWith('../') || url.startsWith('/')) {
    return null;
  }
  
  // Validate URL
  return isValidUrl(url) ? url : null;
}

async function getUserData(fid: number) {
  try {
    const pfpResponse = await fetch(
      `${BASE_URL}/v1/userDataByFid?fid=${fid}&user_data_type=USER_DATA_TYPE_PFP`
    );
    const pfpData = await pfpResponse.json();
    
    const displayNameResponse = await fetch(
      `${BASE_URL}/v1/userDataByFid?fid=${fid}&user_data_type=USER_DATA_TYPE_DISPLAY`
    );
    const displayData = await displayNameResponse.json();

    return {
      pfp: sanitizeUrl(pfpData?.data?.userDataBody?.value),
      displayName: displayData?.data?.userDataBody?.value || `FID: ${fid}`
    };
  } catch {
    return { pfp: null, displayName: `FID: ${fid}` };
  }
}

function convertFarcasterTime(timestamp: number) {
  const actualTimestamp = FARCASTER_EPOCH + timestamp;
  return DateTime.fromSeconds(actualTimestamp);
}

async function fetchCastsForUrl(config: ChannelConfig): Promise<CastData[]> {
  const response = await fetch(
    `${BASE_URL}/v1/castsByParent?url=${config.url}&reverse=1`
  );
  const data = await response.json();
  return (data.messages || []).map((message: CastData) => ({
    ...message,
    channelTag: config.tag
  }));
}

export async function GET() {
  try {
    const allCastsPromises = URL_PARAMS.map(config => fetchCastsForUrl(config));
    const allCastsArrays = await Promise.all(allCastsPromises);
    const allCasts = allCastsArrays.flat();
    
    const cutoffTime = DateTime.now().minus({ hours: 96 });

    const filteredCasts = allCasts.filter((cast: CastData) => {
      const castTime = convertFarcasterTime(cast.data.timestamp);
      return castTime >= cutoffTime;
    });

    filteredCasts.sort((a: CastData, b: CastData) => {
      const timeA = convertFarcasterTime(a.data.timestamp);
      const timeB = convertFarcasterTime(b.data.timestamp);
      return timeB.toMillis() - timeA.toMillis();
    });

    const castsWithUserData = await Promise.all(
      filteredCasts.map(async (cast: CastData) => {
        const userData = await getUserData(cast.data.fid);
        
        const sanitizedEmbeds = (cast.data.castAddBody.embeds || [])
          .map((embed: Embed) => {
            if (embed.castId) return embed;
            return {
              ...embed,
              url: sanitizeUrl(embed.url)
            };
          })
          .filter((embed: Embed) => {
            if (embed.castId) return true;
            if (embed.url === undefined) return false;
            return embed.url !== null;
          });

        return {
          fid: cast.data.fid,
          timestamp: convertFarcasterTime(cast.data.timestamp).toFormat('yyyy-MM-dd HH:mm:ss'),
          text: cast.data.castAddBody.text,
          hash: cast.hash,
          embeds: sanitizedEmbeds,
          pfp: userData.pfp,
          displayName: userData.displayName,
          channelTag: cast.channelTag
        };
      })
    );

    return NextResponse.json({ casts: castsWithUserData });
  } catch (err) {
    console.error('Error fetching casts:', err);
    return NextResponse.json({ error: 'Failed to fetch casts' }, { status: 500 });
  }
} 