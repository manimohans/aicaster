import { NextRequest, NextResponse } from 'next/server';

// Add this at the top level
console.warn('Route file loaded!');

const BASE_URL = "https://nemes.farcaster.xyz:2281";

export async function GET(request: NextRequest) {
  // Try different logging methods
  console.warn('=== API Route Handler Started ===');
  process.stdout.write('API Route called!\n');
  
  // Get URL parameters
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');
  const hash = searchParams.get('hash');

  // Log to stdout directly
  process.stdout.write(`Params: fid=${fid}, hash=${hash}\n`);

  // Validate parameters
  if (!fid || !hash) {
    process.stdout.write('Missing parameters!\n');
    return NextResponse.json({ 
      error: 'Missing required parameters' 
    }, { status: 400 });
  }

  // Validate fid is a number
  if (isNaN(Number(fid))) {
    console.warn('Invalid FID format');
    return NextResponse.json({ 
      error: 'FID must be a number' 
    }, { status: 400 });
  }

  try {
    // Fetch cast data
    const castResponse = await fetch(
      `${BASE_URL}/v1/castById?fid=${fid}&hash=${hash}`,
      { next: { revalidate: 60 } }  // Cache for 60 seconds
    );

    if (!castResponse.ok) {
      console.error('Cast fetch failed:', await castResponse.text());
      return NextResponse.json(
        { error: `Cast fetch failed: ${castResponse.status}` },
        { status: castResponse.status }
      );
    }

    const castData = await castResponse.json();
    return NextResponse.json(castData);
    
  } catch (error) {
    console.error('Error in castById:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 