// src/pages/SocialCallback.tsx
import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';

const PROVIDER_LABELS: Record<string, string> = {
    'google':          'Google',
    'linkedin-openid': 'LinkedIn',
    'linkedin':        'LinkedIn',
};

interface UserFromServer {
    id:                string;
    name:              string;
    email:             string;
    role:              'candidat' | 'rh' | 'manager' | 'admin';
    email_verified:    boolean;
    email_verified_at: string | null;
    is_social:         boolean;
    social_provider:   string | null;
    telephone:         string | null;
    avatar:            string | null;
    linkedin_url:      string | null;
}

export default function SocialCallback() {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const processingRef  = useRef(false);

    const processToken = useCallback(async (
    token:    string,
    from:     string | null,
    provider: string | null
) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
        localStorage.setItem('token', token);

        // ── Appel direct sans authService ────────────
        const response = await fetch('http://localhost:8000/api/user', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            }
        });

        console.log('HTTP Status:', response.status);
        const rawData = await response.json();
        console.log('Raw /api/user:', rawData);

        // ── Extraire user ─────────────────────────────
        const user: UserFromServer = rawData?.data ?? rawData;

        if (!user?.id) {
            throw new Error('User invalide');
        }

        localStorage.setItem('user', JSON.stringify(user));

        const label = provider
            ? (PROVIDER_LABELS[provider] ?? 'Social')
            : 'Social';
        message.success(`Bienvenue ${user.name} ! Connexion via ${label}.`);

        const isEmailVerified =
            user.email_verified === true ||
            (user.email_verified_at !== null && user.email_verified_at !== undefined) ||
            user.is_social === true;

        if (!isEmailVerified) {
            navigate('/verify-email', { replace: true });
            return;
        }

        const destination = from ?? getRedirectByRole(user.role);
        navigate(destination, { replace: true });

    } catch (err) {
        console.error('Erreur détaillée:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.error('Impossible de récupérer votre profil. Veuillez réessayer.');
        navigate('/login', { replace: true });
    }
}, [navigate]);


    useEffect(() => {
        const token    = searchParams.get('token');
        const provider = searchParams.get('provider');
        const error    = searchParams.get('error');
        const from     = searchParams.get('from')
                      ?? sessionStorage.getItem('oauth_from');

        // ✅ Nettoyer sessionStorage après usage
        sessionStorage.removeItem('oauth_from');

        if (error) {
            const errorMessages: Record<string, string> = {
                'email_taken':          'Cet email est déjà utilisé avec un autre compte.',
                'profile_fetch_failed': 'Impossible de récupérer votre profil.',
                'oauth_failed':         'Authentification sociale échouée.',
            };
            message.error(errorMessages[error] ?? 'Échec de l\'authentification sociale.');
            navigate('/login', { replace: true });
            return;
        }

        if (token) {
            processToken(token, from, provider);
        } else {
            message.error('Token manquant. Veuillez réessayer.');
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate, processToken]);

    return (
        <div style={{
            minHeight:       '100vh',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            background:      'linear-gradient(135deg, #e6fffb 0%, #f0fdfa 100%)',
            gap:             16,
        }}>
            <Spin size="large" />
            <div style={{
                color:      '#64748b',
                fontWeight: 500,
                fontSize:   16,
            }}>
                Connexion en cours...
            </div>
            <div style={{
                color:    '#94a3b8',
                fontSize: 13,
            }}>
                Veuillez patienter quelques secondes
            </div>
        </div>
    );
}

// ── Helper — redirection selon le rôle ───────────────────
function getRedirectByRole(role: string): string {
    switch (role) {
        case 'admin':   return '/admin/dashboard';
        case 'rh':      return '/rh/dashboard';
        case 'manager': return '/rh/dashboard';
        default:        return '/candidat/dashboard';
    }
}