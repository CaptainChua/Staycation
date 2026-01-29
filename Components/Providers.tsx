'use client';

import { store } from '@/redux/store';
import { Provider } from 'react-redux';
import { SessionProvider } from 'next-auth/react';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

function InactivityLogoutWrapper({ children }: { children: React.ReactNode }) {
    useInactivityLogout();
    return <>{children}</>;
}

export function Providers ({ children }: {children:React.ReactNode}) {
    return (
        <SessionProvider>
            <InactivityLogoutWrapper>
                <Provider store={store}>
                    {children}
                </Provider>
            </InactivityLogoutWrapper>
        </SessionProvider>
    );
}