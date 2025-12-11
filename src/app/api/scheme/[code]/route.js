import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.mfapi.in/mf/${code}`, {
      cache: 'force-cache',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    const data = await response.json();
    const { meta, data: navHistory } = data;

    return NextResponse.json({
      metadata: meta,
      navHistory,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}