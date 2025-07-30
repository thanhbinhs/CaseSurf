// app/payment/page.tsx
'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
    PayPalScriptProvider, 
    PayPalButtons 
} from "@paypal/react-paypal-js";

import { useAuth } from '@/contexts/AuthContext';
import { doc, increment, updateDoc } from 'firebase/firestore';
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


// --- Component Card Gói cước ---
interface Plan {
    name: string;
    credits: number;
    price: number;
    priceId: string;
    features: string[];
    popular?: boolean;
}

interface PricingCardProps {
    plan: Plan;
    onPurchase: (plan: Plan) => void;
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
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const plans: Plan[] = [
        { name: 'Basic', credits: 10, price: 5, priceId: 'price_basic_5', features: ['Perfect for getting started', 'Analyze up to 10 videos', 'Standard support'] },
        { name: 'Plus', credits: 100, price: 45, priceId: 'price_plus_45', features: ['Best value for creators', 'Analyze up to 100 videos', 'Priority email support', 'Access to new features'], popular: true },
        { name: 'Ultra', credits: 1000, price: 450, priceId: 'price_ultra_450', features: ['For agencies and power users', 'Analyze up to 1000 videos', 'Dedicated 24/7 support', 'API access (coming soon)'] },
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
        setPaymentError(null);
        setPaymentSuccess(false);
        setSelectedPlan(plan);
    };

    const handleSuccessfulPayment = async (creditsToAdd: number) => {
        if (!user) {
            setPaymentError("You must be logged in to complete the purchase.");
            setIsProcessing(false);
            return;
        }
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                credit: increment(creditsToAdd)
            });
            setPaymentSuccess(true);
            setSelectedPlan(null);
        } catch (error) {
            console.error("Error updating credits:", error);
            setPaymentError("Failed to update your credits. Please contact support.");
        } finally {
            setIsProcessing(false);
        }
    };

    const createOrder = (data: any, actions: any) => {
        return actions.order.create({
            purchase_units: [{
                description: `Purchase of ${selectedPlan?.credits} credits`,
                amount: {
                    value: selectedPlan?.price.toString(),
                    currency_code: 'USD'
                },
            }],
            application_context: {
                shipping_preference: 'NO_SHIPPING'
            }
        });
    };

    const onApprove = (data: any, actions: any) => {
        setIsProcessing(true);
        return fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderID: data.orderID
            })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to capture order');
            }
            return res.json();
        })
        .then(orderData => {
            // Kiểm tra trạng thái giao dịch
            const transaction = orderData.purchase_units[0].payments.captures[0];
            if (transaction.status === 'COMPLETED') {
                handleSuccessfulPayment(selectedPlan!.credits);
            } else {
                 // Xử lý các trạng thái khác nếu cần (ví dụ: PENDING)
                 setPaymentError(`Payment status: ${transaction.status}. Please contact support.`);
                 setIsProcessing(false);
            }
        })
        .catch(err => {
            console.error("PayPal Capture Error:", err);
            setPaymentError("An error occurred while finalizing your payment. Please try again.");
            setIsProcessing(false);
        });
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
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Select a credit package that fits your needs. All payments are secure and one-time.</p>
                    </div>

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
                            <PricingCard key={plan.name} plan={plan} onPurchase={handlePurchaseClick} />
                        ))}
                    </div>

                    {selectedPlan && (
                        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
                            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
                                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={isProcessing}>
                                    <CloseIcon />
                                </button>
                                
                                {isProcessing ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4 text-lg font-semibold text-slate-700">Processing your payment...</p>
                                        <p className="text-slate-500">Please do not close this window.</p>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold mb-2">Your Purchase</h2>
                                        <p className="text-slate-600 mb-6">You are purchasing the <span className="font-semibold">{selectedPlan.name}</span> plan for <span className="font-semibold">${selectedPlan.price}</span>.</p>
                                        <PayPalButtons
                                            style={{ layout: "vertical" }}
                                            createOrder={(data, actions) => createOrder(data, actions)}
                                            onApprove={(data, actions) => onApprove(data, actions)}
                                            onError={(err) => onError(err)}
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