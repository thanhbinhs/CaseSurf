// app/payment/page.tsx
'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from '@/contexts/AuthContext';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Icons ---
const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);

// --- Component Card Gói cước ---
interface PricingCardProps {
    plan: {
        name: string;
        credits: number;
        price: number;
        priceId: string; // ID để nhận dạng gói khi thanh toán
        features: string[];
        popular?: boolean;
    };
    onPurchase: (plan: any) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, onPurchase }) => {
    return (
        <div className={`relative flex flex-col p-8 bg-white rounded-2xl shadow-lg border ${plan.popular ? 'border-purple-500' : 'border-slate-200'}`}>
            {plan.popular && (
                <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                    <span className="bg-purple-500 text-white text-xs font-semibold px-4 py-1 rounded-full uppercase">Most Popular</span>
                </div>
            )}
            <h3 className="text-2xl font-semibold text-slate-800">{plan.name}</h3>
            <p className="mt-4 text-slate-500">Get <span className="font-bold text-slate-700">{plan.credits} credits</span> to boost your creativity.</p>
            <div className="mt-6">
                <span className="text-5xl font-extrabold text-slate-900">${plan.price}</span>
                <span className="text-base font-medium text-slate-500">/one-time</span>
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
                className={`mt-8 w-full py-3 px-6 rounded-lg font-semibold transition-colors ${plan.popular ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
                Purchase Now
            </button>
        </div>
    );
};


export default function PaymentPage() {
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const plans = [
        { name: 'Basic', credits: 10, price: 5, priceId: 'price_basic_5', features: ['Perfect for getting started', 'Analyze up to 10 videos', 'Standard support'] },
        { name: 'Plus', credits: 100, price: 45, priceId: 'price_plus_45', features: ['Best value for creators', 'Analyze up to 100 videos', 'Priority email support', 'Access to new features'], popular: true },
        { name: 'Ultra', credits: 1000, price: 450, priceId: 'price_ultra_450', features: ['For agencies and power users', 'Analyze up to 1000 videos', 'Dedicated 24/7 support', 'API access (coming soon)'] },
    ];

    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";

    const handleSuccessfulPayment = async (creditsToAdd: number) => {
        if (!user) {
            setPaymentError("You must be logged in to complete the purchase.");
            return;
        }
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                credit: increment(creditsToAdd)
            });
            setPaymentSuccess(true);
            setSelectedPlan(null); // Đóng modal thanh toán
        } catch (error) {
            console.error("Error updating credits:", error);
            setPaymentError("Failed to update your credits. Please contact support.");
        }
    };

    return (
        <PayPalScriptProvider options={{ "clientId": PAYPAL_CLIENT_ID }}>
            <div className="bg-slate-50 min-h-screen">
                <Navbar />
                <main className="container mx-auto px-4 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">Choose Your Plan</h1>
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Select a credit package that fits your needs. All payments are secure and one-time.</p>
                    </div>

                    {/* Hiển thị thông báo thành công hoặc lỗi */}
                    {paymentSuccess && (
                        <div className="max-w-md mx-auto mb-8 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-center">
                            Payment successful! Your credits have been added to your account.
                        </div>
                    )}
                    {paymentError && (
                         <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
                            {paymentError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map(plan => (
                            <PricingCard key={plan.name} plan={plan} onPurchase={setSelectedPlan} />
                        ))}
                    </div>

                    {/* Modal Thanh toán PayPal */}
                    {selectedPlan && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                                <h2 className="text-2xl font-bold mb-2">Complete Your Purchase</h2>
                                <p className="text-slate-600 mb-6">You are purchasing the <span className="font-semibold">{selectedPlan.name}</span> plan for <span className="font-semibold">${selectedPlan.price}</span>.</p>
                                {/* <PayPalButtons
                                    style={{ layout: "vertical" }}
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            purchase_units: [{
                                                description: `Purchase of ${selectedPlan.credits} credits`,
                                                amount: {
                                                    value: selectedPlan.price.toString(),
                                                },
                                            }],
                                        });
                                    }}
                                    onApprove={async (data, actions) => {
                                        const order = await actions.order?.capture();
                                        console.log("Payment successful:", order);
                                        // Sau khi thanh toán thành công, cập nhật credit
                                        await handleSuccessfulPayment(selectedPlan.credits);
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal Error:", err);
                                        setPaymentError("An error occurred with your payment. Please try again.");
                                        setSelectedPlan(null);
                                    }}
                                    onCancel={() => {
                                        setSelectedPlan(null); // Đóng modal nếu người dùng hủy
                                    }}
                                /> */}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </PayPalScriptProvider>
    );
}
