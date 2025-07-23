// src/app/api/videos/[video_url]/click/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { video_url: string } } // THAY ĐỔI: Nhận video_url thay vì id
) {
  // THAY ĐỔI: Nhận URL đã được mã hóa từ param và giải mã nó
  const encodedUrl = params.video_url;
  const videoUrl = decodeURIComponent(encodedUrl);

  if (!videoUrl) {
    return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
  }

  try {
    // THAY ĐỔI: Cập nhật CSDL bằng cột "url_tiktok" trong mệnh đề WHERE
    const query = 'UPDATE tiktok_info SET click = click + 1 WHERE url_tiktok = ?';
    
    // THAY ĐỔI: Truyền videoUrl (đã giải mã) vào câu lệnh query
    await db.query(query, [videoUrl]);

    return NextResponse.json({ success: true, message: 'Click count updated.' });
  } catch (error) {
    console.error('API Click Error:', error);
    return NextResponse.json({ error: 'Failed to update click count' }, { status: 500 });
  }
}