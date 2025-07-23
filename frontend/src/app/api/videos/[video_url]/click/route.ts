// src/app/api/videos/[id]/click/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; 

export async function POST(
  req: NextRequest,
  { params }: { params: { video_url: string } }
) {
  const videoUrl = params.video_url;

  if (!videoUrl) {
    return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
  }

  // THAY ĐỔI: Giải mã URL đã được mã hóa

  try {
    // THAY ĐỔI: Tên bảng đã được cập nhật thành "tiktok_info"
    const query = 'UPDATE tiktok_info SET click = click + 1 WHERE url_tiktok = ?';
    await db.query(query, [videoUrl]);

    return NextResponse.json({ success: true, message: 'Click count updated.' });
  } catch (error) {
    console.error('API Click Error:', error);
    return NextResponse.json({ error: 'Failed to update click count' }, { status: 500 });
  }
}