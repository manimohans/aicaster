'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Embed } from '@/app/types';

interface Cast {
  fid: number;
  timestamp: string;
  text: string;
  hash: string;
  embeds: Embed[];
  pfp: string | null;
  displayName: string;
  channelTag: string;
}

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

// Keep track of embedded tweets per cast hash
const embeddedTweets = new Map<string, Set<string>>();

function ImageEmbed({ url }: { url: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isExpanded) {
    return (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={() => setIsExpanded(false)}
      >
        <div className="max-w-full max-h-full relative">
          <img
            src={url}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain"
          />
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div 
        className="relative cursor-pointer overflow-hidden rounded-lg max-w-[500px]"
        onClick={() => setIsExpanded(true)}
      >
        <Image
          src={url}
          alt="Embedded content"
          width={500}
          height={0}
          className="w-full object-contain hover:opacity-90 transition-opacity"
          sizes="(max-width: 500px) 100vw, 500px"
          style={{
            width: '100%',
            height: 'auto'
          }}
          unoptimized
        />
      </div>
    </div>
  );
}

function TwitterEmbed({ url, castHash }: { url: string; castHash: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    // Check if this tweet was already embedded for this cast
    if (!embeddedTweets.has(castHash)) {
      embeddedTweets.set(castHash, new Set());
    }
    const castEmbeds = embeddedTweets.get(castHash)!;
    
    // If already embedded, return early
    if (castEmbeds.has(url)) {
      return;
    }
    
    // Mark this tweet as embedded for this cast
    castEmbeds.add(url);

    // Extract tweet ID from URL
    const tweetId = url.split('/').pop()?.split('?')[0];
    
    if (!tweetId) {
      setFallbackMode(true);
      return;
    }

    // If Twitter is blocked or not available, show fallback immediately
    if (!window.twttr || document.querySelector('[data-twitter-blocker="true"]')) {
      setFallbackMode(true);
      return;
    }

    // Clear existing content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const embedTweet = async () => {
      try {
        const result = await window.twttr.widgets.createTweet(
          tweetId,
          containerRef.current,
          {
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            width: '100%',
            align: 'center',
            conversation: 'none',
            dnt: true
          }
        );
        
        if (!result) {
          throw new Error('Tweet embed failed');
        }
      } catch {
        setFallbackMode(true);
      }
    };
    embedTweet();
  }, [url, castHash]);

  if (fallbackMode) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-w-[550px] mx-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          <span className="text-blue-500">View Tweet on Twitter</span>
        </div>
      </a>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div ref={containerRef} className="w-full max-w-[550px]" />
    </div>
  );
}

function CastEmbed({ fid, hash }: { fid: number; hash: string }) {
  const [castData, setCastData] = useState<Cast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCast = async () => {
      try {
        // Fetch cast data
        const response = await fetch(`/api/castById?fid=${fid}&hash=${hash}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        // Fetch user data
        const userResponse = await fetch(`/api/userData?fid=${fid}`);
        const userData = await userResponse.json();
        
        setCastData({
          fid: data.data.fid,
          timestamp: new Date(data.data.timestamp * 1000).toISOString(),
          text: data.data.castAddBody.text,
          hash: data.data.hash,
          embeds: data.data.castAddBody.embeds || [],
          pfp: userData.pfp,
          displayName: userData.displayName,
          channelTag: data.data.channelTag
        });
      } catch {
        console.error('Failed to load cast');
      } finally {
        setLoading(false);
      }
    };

    fetchCast();
  }, [fid, hash]);

  if (loading) {
    return <div className="text-center p-4">Loading cast...</div>;
  }
  
  if (!castData) {
    return <div className="text-center text-red-500 p-4">Failed to load cast</div>;
  }

  return (
    <div className="border-l-4 border-gray-800 pl-4 my-2">
      <div className="flex items-center space-x-2 mb-2">
        {castData.pfp ? (
          <Image
            src={castData.pfp}
            alt={castData.displayName}
            width={24}
            height={24}
            className="rounded-full"
            style={{
              width: '24px',
              height: '24px'
            }}
            unoptimized
          />
        ) : (
          <div className="w-6 h-6 bg-gray-800 rounded-full" />
        )}
        <span className="text-sm text-gray-400">
          {castData.displayName}
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold">{castData.displayName}</span>
          <span className="text-purple-500">{castData.channelTag}</span>
          <span className="text-gray-500 dark:text-gray-400">{formatDistanceToNow(new Date(castData.timestamp))}</span>
        </div>
        <div className="flex items-center gap-2 mb-2"></div>
        <div>{castData.text}</div>
      </div>
    </div>
  );
}

function EmbedCard({ embed, castHash }: { embed: Embed; castHash: string }) {
  const [ogData, setOgData] = useState<OpenGraphData | null>(null);
  const isTwitterUrl = embed.url?.includes('twitter.com') || embed.url?.includes('x.com');
  const isImageUrl = embed.url && (/\.(jpg|jpeg|png|gif|webp)$/i.test(embed.url) || 
                    embed.url.includes('imagedelivery.net') ||
                    embed.url.includes('/original'));
  const isCastEmbed = (embed.cast?.fid && embed.cast?.hash) || 
                      (embed.castId?.fid && embed.castId?.hash);

  useEffect(() => {
    if (embed.url && !isTwitterUrl && !isImageUrl && !isCastEmbed) {
      fetch(`/api/og?url=${encodeURIComponent(embed.url)}`)
        .then(res => res.json())
        .then(data => setOgData(data))
        .catch(() => {});
    }
  }, [embed.url, isTwitterUrl, isImageUrl, isCastEmbed]);

  const getEmbedType = () => {
    if (isCastEmbed) {
      const castData = embed.cast || embed.castId;
      if (!castData) return 'Invalid Cast Embed';
      return `Cast Embed (fid: ${castData.fid}, hash: ${castData.hash})`;
    }
    if (isImageUrl) {
      return `Image Embed (url: ${embed.url})`;
    }
    if (isTwitterUrl) {
      return `Twitter Embed (url: ${embed.url})`;
    }
    return `OpenGraph Embed (url: ${embed.url})`;
  };

  return (
    <div className="border border-gray-800 rounded-lg p-3 my-2 bg-black">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {getEmbedType()}
      </div>
      {isCastEmbed && (
        <CastEmbed 
          fid={embed.cast?.fid || embed.castId?.fid || 0}
          hash={embed.cast?.hash || embed.castId?.hash || ''}
        />
      )}
      {isImageUrl && embed.url && <ImageEmbed url={embed.url} />}
      {isTwitterUrl && embed.url && <TwitterEmbed url={embed.url} castHash={castHash} />}
      {!isCastEmbed && !isImageUrl && !isTwitterUrl && ogData && (
        <a 
          href={embed.url || ''} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block hover:opacity-90 transition-opacity"
        >
          {ogData.image && <ImageEmbed url={ogData.image} />}
          <div className="mt-2">
            {ogData.title && (
              <h3 className="font-medium text-sm mb-1">{ogData.title}</h3>
            )}
            {ogData.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {ogData.description}
              </p>
            )}
          </div>
        </a>
      )}
    </div>
  );
}

declare global {
  interface Window {
    twttr: {
      widgets: {
        createTweet: (
          tweetId: string,
          element: HTMLElement | null,
          options: {
            theme: string;
            width: string;
            align: string;
            conversation: string;
            dnt: boolean;
          }
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

function processText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${url}</a>`;
  }).trim();
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp + 'Z');
  
  console.log({
    inputTimestamp: timestamp,
    parsedDate: date,
    localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currentTime: new Date(),
    offset: date.getTimezoneOffset()
  });
  
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function FarcasterFeed() {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCasts = async () => {
      try {
        const response = await fetch('/api/casts');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setCasts(data.casts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch casts');
      } finally {
        setLoading(false);
      }
    };

    fetchCasts();
  }, []);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!casts.length) return <div className="text-center p-4">No casts found</div>;

  return (
    <div className="space-y-6 font-mono text-sm">
      {casts.map(cast => {
        const processedText = processText(cast.text);
        
        return (
          <div 
            key={cast.hash}
            className="p-4 rounded-lg border border-gray-800 bg-black text-white overflow-hidden"
          >
            <div className="flex items-start space-x-3 mb-2">
              {cast.pfp ? (
                <Image
                  src={cast.pfp}
                  alt={cast.displayName}
                  width={40}
                  height={40}
                  className="rounded-full"
                  style={{
                    width: '40px',
                    height: '40px'
                  }}
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 bg-gray-800 rounded-full" />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-white text-sm">{cast.displayName}</span>
                    <span className="ml-2 text-xs text-[#8A63D2]">{cast.channelTag}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(cast.timestamp)}
                  </span>
                </div>
                {processedText && (
                  <p className="text-white mt-1 text-sm"
                    dangerouslySetInnerHTML={{ __html: processedText }}
                  />
                )}
              </div>
            </div>
            
            {cast.embeds && cast.embeds.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-blue-500">
                  Debug: Cast has {cast.embeds.length} embeds
                </div>
                {cast.embeds.map((embed: Embed, i: number) => (
                  <EmbedCard 
                    key={`${cast.hash}-embed-${i}`} 
                    embed={embed} 
                    castHash={cast.hash} 
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 