import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
// ✅ IMPORT MANQUANT : Vous devez importer le service pour utiliser ses méthodes
import { authService } from '../services/api'; 

const PROVIDER_LABELS: Record<string, string> = {
  'google': 'Google',
  'linkedin-openid': 'LinkedIn',
  'linkedin': 'LinkedIn',
};

export default function SocialCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ✅ INDISPENSABLE : Empêche le double traitement du token en mode développement
  const processingRef = useRef(false);

  // 1. On garde 'provider' dans les arguments
const processToken = useCallback(async (token: string, fromQuery: string | null, provider: string | null) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
        localStorage.setItem('access_token', token);
        const user = await authService.getCurrentUserFromServer();

        if (user) {
            // ✅ UTILISATION DE 'provider' : On l'utilise pour le message
            // Cela résout l'erreur ESLint
            const label = provider ? (PROVIDER_LABELS[provider] || 'Social') : 'Social';
            message.success(`Bienvenue ${user.name} ! Connexion réussie via ${label}.`);
            
            const destination = fromQuery  // ✅ utilise 'from' si présent
                || (user.role === 'rh' ? '/dashboard/rh' : '/candidat/dashboard');
            navigate(destination, { replace: true });
        }
    } catch (err) {
        console.error("Erreur post-login:", err);
        localStorage.removeItem('access_token');
        message.error("Impossible de récupérer votre profil.");
        navigate('/login?error=profile_fetch_failed', { replace: true });
    }
}, [navigate]);

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');
    
    // ✅ 'from' depuis l'URL OU sessionStorage en fallback
    const from = searchParams.get('from') 
                 || sessionStorage.getItem('oauth_from');
    
    // ✅ Nettoyer sessionStorage après usage
    sessionStorage.removeItem('oauth_from');
    
    if (error) {
        message.error('Échec de l\'authentification sociale');
        navigate('/login', { replace: true });
        return;
    }
    
    if (token) {
        processToken(token, from, provider);
    } else {
        navigate('/login', { replace: true });
    }
}, [searchParams, navigate, processToken]);


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <Spin size="large" />
      <div style={{ marginTop: 20, color: '#64748b', fontWeight: 500 }}>
        Vérification de votre profil...
      </div>
    </div>
  );
}