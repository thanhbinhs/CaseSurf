'use client';

import React, {useState} from 'react';
import Navbar from '@/components/Navbar';
import { 
    PayPalScriptProvider, 
    PayPalButtons 
} from "@paypal/react-paypal-js";

import { useAuth } from '@/contexts/AuthContext';
import { doc, increment, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Icons ---
const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ShoppingBagIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);



// --- Component Card Gói cước ---
interface Plan {
    name: string;
    credits: number; // Dùng Infinity cho không giới hạn
    price: number;
    priceId: string;
    features: string[];
    popular?: boolean;
    isFree?: boolean; // Thêm cờ để xác định gói miễn phí
}

interface PricingCardProps {
    plan: Plan;
    onPurchase: (plan: Plan) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, onPurchase }) => {
    return (
        // Tăng chiều rộng tối đa cho card để trông cân đối hơn
        <div className={`relative flex flex-col p-8 bg-white rounded-2xl shadow-lg border w-full max-w-sm ${plan.popular ? 'border-purple-500' : 'border-slate-200'}`}>
            {plan.popular && (
                <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                    <span className="bg-purple-500 text-white text-xs font-semibold px-4 py-1 rounded-full uppercase">Most Popular</span>
                </div>
            )}
            <h3 className="text-2xl font-semibold text-slate-800">{plan.name}</h3>
            
            {/* Hiển thị text phù hợp với số credit */}
            <p className="mt-4 text-slate-500">
                {plan.credits === Infinity 
                    ? <span className="font-bold text-slate-700">Unlimited Credits</span>
                    : <>Get <span className="font-bold text-slate-700">{plan.credits} credits</span> to boost your creativity.</>
                }
            </p>

            <div className="mt-6">
                <span className="text-5xl font-extrabold text-slate-900">${plan.price}</span>
                {!plan.isFree && <span className="text-base font-medium text-slate-500">/one-time</span>}
            </div>
            
            <ul className="mt-8 space-y-4 flex-grow">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <CheckIcon className="w-6 h-6 text-purple-500 mr-2 flex-shrink-0" />
                        <span className="text-slate-600">{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onPurchase(plan)}
                disabled={plan.isFree} // Vô hiệu hóa nút cho gói Free
                className={`mt-8 w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.isFree 
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                        : plan.popular 
                            ? 'bg-purple-600 text-white hover:bg-purple-700' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
                {plan.isFree ? 'Your Current Plan' : 'Purchase Now'}
            </button>
        </div>
    );
};


export default function PaymentPage() {
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- DỮ LIỆU PLAN ĐÃ CẬP NHẬT ---
    const plans: Plan[] = [
        { name: 'Starter', credits: 5, price: 0, priceId: 'price_basic_0', features: ['Perfect for getting started', '5 video credits', 'Standard support'], isFree: true },
        { name: 'Lifetime Pro', credits: Infinity, price: 30, priceId: 'price_plus_30', features: ['Best value for creators', 'Unlimited Video Analysis', 'Priority email support', 'Access to new features', '7-Day Refund Policy'], popular: true },
    ];

    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!PAYPAL_CLIENT_ID) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500">PayPal Client ID is not configured. Please check your environment variables.</p>
            </div>
        );
    }

    const handlePurchaseClick = (plan: Plan) => {
        if (plan.isFree) return; // Không làm gì nếu click gói miễn phí
        setPaymentError(null);
        setPaymentSuccess(false);
        setSelectedPlan(plan);
    };
    
    // --- LOGIC THANH TOÁN ĐÃ CẬP NHẬT ĐỂ XỬ LÝ UNLIMITED ---
    const handleSuccessfulPayment = async (creditsToAdd: number) => {
        if (!user) {
            setPaymentError("You must be logged in to complete the purchase.");
            setIsProcessing(false);
            return;
        }
        try {
            const userDocRef = doc(db, 'users', user.uid);
            
            // Nếu là gói unlimited, set một cờ isPro thay vì cộng dồn credit
            if (creditsToAdd === Infinity) {
                await updateDoc(userDocRef, {
                    isPro: true,
                    // Tùy chọn: bạn có thể set credit về một giá trị tượng trưng như -1 hoặc null
                    // credit: -1 
                });
            } else {
                await updateDoc(userDocRef, {
                    credit: increment(creditsToAdd)
                });
            }

            setPaymentSuccess(true);
            setSelectedPlan(null);
        } catch (error) {
            console.error("Error updating user data:", error);
            setPaymentError("Failed to update your account. Please contact support.");
        } finally {
            setIsProcessing(false);
        }
    };

    const createOrder = (data: any, actions: any) => {
        if (!selectedPlan) return Promise.reject(new Error("No plan selected"));
        return actions.order.create({
            purchase_units: [{
                description: `Purchase of ${selectedPlan.name} plan`,
                amount: {
                    value: selectedPlan.price.toString(),
                    currency_code: 'USD'
                },
            }],
            application_context: {
                shipping_preference: 'NO_SHIPPING'
            }
        });
    };

    const onApprove = async (data: any, actions: any) => {
    if (!user || !selectedPlan) {
        setPaymentError("User or selected plan is missing. Please try again.");
        return; // Dừng lại sớm nếu thiếu thông tin
    }

    setIsProcessing(true);

    try {
        // Bước 1: Gửi yêu cầu đến backend để xác thực giao dịch
        const response = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                orderID: data.orderID, 
                userId: user.uid, 
                planName: selectedPlan.name 
            })
        });

        // Bước 2: Đọc phản hồi dưới dạng văn bản trước để tránh lỗi JSON
        const responseText = await response.text();
        let orderData;

        try {
            // Cố gắng phân tích văn bản thành JSON
            orderData = JSON.parse(responseText);
        } catch (jsonError) {
            // Nếu thất bại, có nghĩa là server đã trả về một lỗi không phải JSON (ví dụ: trang HTML)
            console.error("Failed to parse server response:", responseText);
            throw new Error("The server returned an invalid response. Please contact support.");
        }

        // Bước 3: Kiểm tra xem yêu cầu có thành công về mặt HTTP không
        if (!response.ok) {
            // Nếu không, ném ra lỗi với thông báo từ server (nếu có)
            throw new Error(orderData.message || 'An error occurred on the server.');
        }

        // Bước 4: Xử lý dữ liệu nếu mọi thứ thành công
        const transaction = orderData?.purchase_units?.[0]?.payments?.captures?.[0];

        if (transaction && transaction.status === 'COMPLETED') {
            // Gọi hàm xử lý thành công (nên là một hàm async)
            await handleSuccessfulPayment(selectedPlan.credits);
        } else {
            // Xử lý các trạng thái thanh toán khác (ví dụ: PENDING)
            setPaymentError(`Payment status: ${transaction?.status || 'Unknown'}. Please contact support.`);
        }

    } catch (err) {
        // Bắt tất cả các lỗi từ các bước trên
        console.error("PayPal Capture Error:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setPaymentError(`Error finalizing payment: ${errorMessage}`);
    } finally {
        // Luôn luôn dừng trạng thái xử lý, dù thành công hay thất bại
        setIsProcessing(false);
    }
};

    const onError = (err: any) => {
        console.error("PayPal Error:", err);
        setPaymentError("An error occurred with your payment. Please try again or use a different payment method.");
        setIsProcessing(false);
    };

    const closeModal = () => {
        if (!isProcessing) {
            setSelectedPlan(null);
        }
    };


    return (
        <PayPalScriptProvider options={{ "clientId": PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
            <div className="bg-slate-50 min-h-screen">
                <Navbar />
                <main className="container mx-auto px-4 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">Choose Your Plan</h1>
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Select a package that fits your needs. All payments are secure and one-time.</p>
                    </div>

                    {paymentSuccess && (
                        <div className="max-w-md mx-auto mb-8 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-center">
                            Payment successful! Your account has been upgraded.
                        </div>
                    )}
                    {paymentError && (
                         <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
                            {paymentError}
                        </div>
                    )}

                    {/* --- LAYOUT CHÍNH ĐÃ THAY ĐỔI --- */}
                    <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-4xl mx-auto">
                        {plans.map(plan => (
                            <PricingCard key={plan.name} plan={plan} onPurchase={handlePurchaseClick} />
                        ))}
                    </div>

                    {/* Modal không thay đổi */}
                    {selectedPlan && (
                        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in">
                            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full relative transform transition-all duration-300 animate-pop-in">
                                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors" disabled={isProcessing}>
                                    <CloseIcon />
                                </button>
                                
                                {isProcessing ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <h2 className="mt-6 text-2xl font-bold text-slate-800">Processing Payment</h2>
                                        <p className="text-slate-500 mt-2">This may take a moment. Please don't close this window.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <ShoppingBagIcon className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">Complete Your Purchase</h2>
                                                <p className="text-slate-500">Securely checkout with PayPal.</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 font-medium">{selectedPlan.name} Plan</span>
                                                <span className="font-bold text-slate-800">${selectedPlan.price.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {selectedPlan.credits === Infinity ? 'Unlimited Video Analysis' : `${selectedPlan.credits} credits`}
                                            </div>
                                        </div>
                                        
                                        <PayPalButtons
                                            style={{ layout: "vertical" }}
                                            createOrder={createOrder}
                                            onApprove={onApprove}
                                            onError={onError}
                                            onCancel={() => setSelectedPlan(null)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </PayPalScriptProvider>
    );
}