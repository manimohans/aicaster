import { NextRequest, NextResponse } from 'next/server';

// Add this at the top level
console.warn('Route file loaded!');

const FARCASTER_API = 'https://nemes.farcaster.xyz:2281';

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

  if (!fid || !hash) {
    process.stdout.write('Missing parameters!\n');
    return NextResponse.json({ 
      error: 'Missing required parameters' 
    }, { status: 400 });
  }

  try {
    const apiUrl = `${FARCASTER_API}/v1/castById?fid=${fid}&hash=${hash}`;
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Farcaster API response:', data);
    
    if (!response.ok) {
      throw new Error(`Farcaster API error: ${response.status}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in castById route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cast',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 