// types/tiktok.ts

// Định nghĩa dùng chung cho dữ liệu video
export interface TikTokData {
    url_tiktok: string;
    description: string | null;
    click: number | null;
    tym: number | null;
    userId: string | null;
    niche?: string | null;
    content_angle?: string | null;
    hook_type?: string | null;
    product_type?: string | null;
    title?: string | null;
    title1?: string | null;
    title2?: string | null;
    script_framework?: string | null;
}