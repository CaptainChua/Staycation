"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    X,
    CreditCard,
    CheckCircle,
    ExternalLink,
    Shield,
    Loader2
} from "lucide-react";
import { updateDepositStatusByBookingId } from "@/app/admin/csr/actions";
import { toast } from "react-hot-toast";

interface Booking {
    id: string;
    booking_id: string;
    deposit_status?: string;
    security_deposit_payment_method?: string;
    security_deposit_payment_proof_url?: string;
    room_name: string;
    guest_first_name: string;
    guest_last_name: string;
}

interface MarkDepositPaidModalProps {
    booking: Booking;
    onClose: () => void;
    isOpen: boolean;
    onConfirm: () => void;
    employeeId?: string;
}

export default function MarkDepositPaidModal({
    booking,
    onClose,
    isOpen,
    onConfirm,
    employeeId
}: MarkDepositPaidModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const isLoadingRef = useRef(false);
    const successMessageRef = useRef<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSuccessMessage(null);
        }
    }, [isOpen, booking?.id]);

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    useEffect(() => {
        successMessageRef.current = successMessage;
    }, [successMessage]);

    const handleClickOutside = (event: MouseEvent) => {
        if (isLoadingRef.current || successMessageRef.current) return;
        const target = event.target as Node;
        if (modalRef.current && !modalRef.current.contains(target)) {
            onClose();
        }
    };

    useEffect(() => {
        if (isMounted && isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isMounted, isOpen, onClose]);

    const handleApprove = async () => {
        if (!booking.id) return;
        setIsLoading(true);
        try {
            await updateDepositStatusByBookingId(booking.id, 'Paid', employeeId);
            toast.success("Security deposit marked as Paid");
            onConfirm();
            setSuccessMessage("Security deposit marked as paid successfully.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update deposit status");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !isMounted) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(amount);
    };

    const guestName = `${booking.guest_first_name} ${booking.guest_last_name}`;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            <div
                ref={modalRef}
                className="fixed z-[9996] w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Security Deposit Payment
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Booking #{booking.booking_id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Information Section */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Guest</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{guestName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Haven</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{booking.room_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Deposit Amount</p>
                                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(1000)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Status</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                        {successMessage ? 'Paid' : (booking.deposit_status || 'Pending')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {successMessage && (
                            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-900/30">
                                <p className="text-sm font-bold text-green-700 dark:text-green-400">{successMessage}</p>
                            </div>
                        )}

                        {/* Payment Proof Section */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Payment Evidence</h3>
                            </div>

                            {booking.security_deposit_payment_method ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Method:</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">{booking.security_deposit_payment_method}</span>
                                    </div>

                                    {booking.security_deposit_payment_proof_url && (
                                        <a
                                            href={booking.security_deposit_payment_proof_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-gray-800 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                                        >
                                            <ExternalLink className="w-4 h-4 transition-transform group-hover:scale-110" />
                                            <span className="text-xs font-bold uppercase tracking-widest">View Payment Proof</span>
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    <p className="text-xs italic">No payment information provided by guest yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-bold text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isLoading || !!successMessage}
                        className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span>{successMessage ? 'Marked as Paid' : 'Mark as Paid & Approve'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}
