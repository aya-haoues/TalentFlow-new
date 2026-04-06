// src/components/ui/TawkChat.tsx
import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        Tawk_API:       Record<string, unknown>;
        Tawk_LoadStart: Date;
    }
}

interface TawkUser {
    name:  string;
    email: string;
    role?: string;
    id?:   string;
}

interface TawkChatProps {
    propertyId: string;
    widgetId:   string;
    user?:      TawkUser;
}

export default function TawkChat({ propertyId, widgetId, user }: TawkChatProps) {

    // ✅ Garder une référence stable au user
    // → évite de recréer l'effet à chaque render
    const userRef = useRef<TawkUser | undefined>(user);

    // ✅ Mettre à jour la référence si le user change
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // ── Effet principal — chargement du script ────────
    useEffect(() => {
        window.Tawk_API       = window.Tawk_API       || {};
        window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();

        // ── Injecter le script une seule fois ─────────
        if (!document.getElementById('tawk-script')) {
            const script   = document.createElement('script');
            script.id      = 'tawk-script';
            script.async   = true;
            script.src     = `https://embed.tawk.to/${propertyId}/${widgetId}`;
            script.charset = 'UTF-8';
            script.setAttribute('crossorigin', '*');
            document.head.appendChild(script);
        }

        // ── Fonction d'identification ─────────────────
        const setAttributes = () => {
            const api      = window.Tawk_API as any;
            const current  = userRef.current;

            if (!api || typeof api.setAttributes !== 'function') return;
            if (!current?.email) return;

            api.setAttributes({
                name:  current.name,
                email: current.email,
                role:  current.role ?? 'visiteur',
                id:    current.id   ?? '',
            }, (error: unknown) => {
                if (error) console.error('Tawk setAttributes error:', error);
            });
        };

        // ── Callbacks Tawk ────────────────────────────
        const api = window.Tawk_API as any;

        api.onLoad = () => {
            console.log('✅ Tawk chargé');
            setAttributes();

            const path = window.location.pathname;
            if (path.startsWith('/admin') || path.startsWith('/rh')) {
                api.hideWidget?.();
            }
        };

        // Si déjà chargé
        setAttributes();

    }, [propertyId, widgetId]); // ✅ userRef est stable → pas besoin dans les deps

    return null;
}
