import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = "https://nemes.farcaster.xyz:2281";

function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  
  // Handle relative paths
  if (url.startsWith('./') || url.startsWith('../') || url.startsWith('/')) {
    return null;
  }
  
  // Validate URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ error: 'Missing fid parameter' }, { status: 400 });
  }

  try {
    // Fetch PFP
    const pfpResponse = await fetch(
      `${BASE_URL}/v1/userDataByFid?fid=${fid}&user_data_type=USER_DATA_TYPE_PFP`
    );
    const pfpData = await pfpResponse.json();
    
    // Fetch Display Name
    const displayNameResponse = await fetch(
      `${BASE_URL}/v1/userDataByFid?fid=${fid}&user_data_type=USER_DATA_TYPE_DISPLAY`
    );
    const displayData = await displayNameResponse.json();

    // Sanitize PFP URL
    const pfpUrl = sanitizeUrl(pfpData?.data?.userDataBody?.value);

    return NextResponse.json({
      pfp: pfpUrl,
      displayName: displayData?.data?.userDataBody?.value || `@fc_${fid}`
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch user data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 