'use client';

import { store, persistor } from '@/redux/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SessionProvider } from 'next-auth/react';
<<<<<<< HEAD
import { NextUIProvider } from "@nextui-org/react";
=======
>>>>>>> 4da347254b09e7d2af6a23069cf7e3a3638a878e
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import ConditionalLayout from './ConditionalLayout';

function InactivityLogoutWrapper({ children }: { children: React.ReactNode }) {
    useInactivityLogout();
    return <>{children}</>;
}

export function Providers ({ children }: {children:React.ReactNode}) {
    return (
        <SessionProvider>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <InactivityLogoutWrapper>
<<<<<<< HEAD
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
=======
                        <NextThemesProvider 
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
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
>>>>>>> 4da347254b09e7d2af6a23069cf7e3a3638a878e
                    </InactivityLogoutWrapper>
                </PersistGate>
            </Provider>
        </SessionProvider>
    );
}
