'use client';

import { store } from '@/redux/store';
import { Provider } from 'react-redux';
import { SessionProvider } from 'next-auth/react';
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import ConditionalLayout from './ConditionalLayout';

function InactivityLogoutWrapper({ children }: { children: React.ReactNode }) {
    useInactivityLogout();
    return <>{children}</>;
}

export function Proviers({ children }: {children:React.ReactNode}) {
    return (
        <SessionProvider>
            <InactivityLogoutWrapper>
                <Provider store={store}>
                    <NextUIProvider>
                        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                            <ConditionalLayout>
                                {children}
                            </ConditionalLayout>
                            <Toaster
                                position="top-center"
                                toastOptions={{
                                    duration: 4000,
                                    style: {
                                        background: '#363636',
                                        color: '#fff',
                                    },
                                    success: {
                                        duration: 3000,
                                        iconTheme: {
                                            primary: '#4ade80',
                                            secondary: '#fff',
                                        },
                                    },
                                    error: {
                                        duration: 4000,
                                        iconTheme: {
                                            primary: '#ef4444',
                                            secondary: '#fff',
                                        },
                                    },
                                }}
                            />
                        </NextThemesProvider>
                    </NextUIProvider>
                </Provider>
            </InactivityLogoutWrapper>
        </SessionProvider>
    );
}