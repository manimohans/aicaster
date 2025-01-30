import { NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.endsWith(ext)) || 
         url.includes('imagedelivery.net') ||
         url.includes('/original');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // If it's an image URL, return it directly as image OpenGraph data
  if (isImageUrl(url)) {
    return NextResponse.json({
      title: 'Image',
      description: null,
      image: url,
      url: url
    });
  }

  // Replace x.com with twitter.com
  const processedUrl = url.replace('x.com', 'twitter.com');

  try {
    const { result } = await ogs({ 
      url: processedUrl,
      timeout: 5000,
      fetchOptions: {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        }
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch OpenGraph data');
    }

    return NextResponse.json({
      title: result.ogTitle || null,
      description: result.ogDescription || null,
      image: result.ogImage && result.ogImage[0]?.url && isValidUrl(result.ogImage[0].url) ? result.ogImage[0].url : null,
      url: result.ogUrl || url
    });
  } catch (error) {
    console.error('Error fetching OpenGraph data:', error);
    // Return a minimal response instead of an error
    return NextResponse.json({
      title: new URL(url).hostname,
      description: null,
      image: null,
      url: url
    });
  }
} 