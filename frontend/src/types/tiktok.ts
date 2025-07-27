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
    cta_type?: string | null;
    trust_tactic?: string | null;
    product_type?: string | null;
}