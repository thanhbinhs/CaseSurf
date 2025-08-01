// app/api/paypal/capture-order/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, RESEND_API_KEY } = process.env;
const base = process.env.NODE_ENV === 'production' 
    ? 'https://paypal.com' 
    : 'https://sandbox.paypal.com';

const resend = new Resend(RESEND_API_KEY);

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
    // Nhận thêm dữ liệu từ request body
    const { orderID, userId, planDetails } = await request.json();

    if (!orderID || !userId || !planDetails) {
        return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const captureData = await captureOrder(orderID);

    // Kiểm tra nếu giao dịch thành công
    const transaction = captureData?.purchase_units?.[0]?.payments?.captures?.[0];
    if (transaction?.status === 'COMPLETED') {
        // GIAO DỊCH THÀNH CÔNG -> GỬI EMAIL THÔNG BÁO

        try {
            await resend.emails.send({
                from: 'Notification <onboarding@resend.dev>', // Thay bằng email từ domain đã xác thực của bạn
                to: ['seedx.work@gmail.com'], // Địa chỉ email của bạn
                subject: `🎉 New Purchase: ${planDetails.name} Plan`,
                html: `
                    <h1>New Purchase Notification</h1>
                    <p>A user has successfully purchased a credit package.</p>
                    <ul>
                        <li><strong>User ID:</strong> ${userId}</li>
                        <li><strong>Plan Name:</strong> ${planDetails.name}</li>
                        <li><strong>Price:</strong> $${planDetails.price}</li>
                        <li><strong>PayPal Order ID:</strong> ${orderID}</li>
                        <li><strong>Timestamp:</strong> ${new Date().toLocaleString('vi-VN')}</li>
                    </ul>
                `,
            });
            console.log("Admin notification email sent successfully.");

        } catch (emailError) {
            // Nếu gửi email thất bại, chỉ log lỗi chứ không làm sập toàn bộ yêu cầu
            // Việc cộng credit cho người dùng vẫn quan trọng hơn
            console.error("Failed to send notification email:", emailError);
        }
    }
    
    return NextResponse.json(captureData);

  } catch (error: any) {
    console.error("Failed to process payment:", error);
    const errorMessage = error.message || "Failed to capture order.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}