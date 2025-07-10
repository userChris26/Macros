import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Login request received:', body);
    
    // Forward the request to your Express backend
    const response = await fetch(`${getApiUrl()}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Response from Express backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Failed to connect to server' }, { status: 500 });
  }
} 