import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to your Express backend
    const response = await fetch(`${getApiUrl()}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to server' }, { status: 500 });
  }
} 