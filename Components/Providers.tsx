'use client';

// Suppress React 19 dev-only false positive: next-themes intentionally injects a
// <script> tag server-side only to prevent theme flash. React not executing it on
// the client is expected behavior. Remove once next-themes ships a React 19 fix.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const _consoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag while rendering React component')) return;
    _consoleError(...args);
  };
}

import { store, persistor } from '@/redux/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SessionProvider } from 'next-auth/react';
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
                                containerStyle={{
                                    zIndex: 999999,
                                }}
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
                    </InactivityLogoutWrapper>
                </PersistGate>
            </Provider>
        </SessionProvider>
    );
}
