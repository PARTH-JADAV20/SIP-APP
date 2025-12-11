import { NextResponse } from 'next/server';
import { processSIPs } from '@/lib/processSIPs';

// This is a protected route that should only be called by the cron job
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  
  // Simple authentication - in production, use a more secure method
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processSIPs();
    return NextResponse.json({ success: true, message: 'SIPs processed successfully' });
  } catch (error) {
    console.error('Error in SIP processing cron job:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
