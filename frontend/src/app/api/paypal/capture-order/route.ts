// app/api/paypal/capture-order/route.ts
import { NextResponse } from 'next/server';

const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const base = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

/**
 * Tạo access token để xác thực với PayPal API.
 * @see https://developer.paypal.com/reference/get-an-access-token/
 */
async function generateAccessToken() {
  try {
    if (!NEXT_PUBLIC_PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      `${NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
    ).toString("base64");
    
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
    throw error;
  }
}

/**
 * Capture thanh toán cho một đơn hàng.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
async function captureOrder(orderID: string) {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.json();
}

export async function POST(request: Request) {
  try {
    const { orderID } = await request.json();

    if (!orderID) {
        return NextResponse.json({ error: 'Missing orderID' }, { status: 400 });
    }

    const captureData = await captureOrder(orderID);
    // Bạn có thể lưu thông tin giao dịch vào cơ sở dữ liệu của mình ở đây nếu cần
    // Ví dụ: log lại captureData để kiểm tra
    console.log("Captured Data:", captureData);
    
    return NextResponse.json(captureData);

  } catch (error: any) {
    console.error("Failed to capture order:", error);
    // Trả về lỗi chi tiết hơn nếu có thể
    const errorMessage = error.message || "Failed to capture order.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}