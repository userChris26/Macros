import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Login request received:', body);
    
    // Use environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Response from Express backend:', data);
    
    // Set the JWT token in an HTTP-only cookie
    const responseHeaders = new Headers();
    if (data.jwtToken) {
      responseHeaders.append('Set-Cookie', `jwtToken=${data.jwtToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
    }
    
    return NextResponse.json(data, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Failed to connect to server' }, { status: 500 });
  }
} 