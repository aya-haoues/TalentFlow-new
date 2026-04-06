import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { message } from 'antd'; // Importation nécessaire pour les notifications
import axios from 'axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verify = async () => {
            const id = searchParams.get('id');
            const hash = searchParams.get('hash');
            const expires = searchParams.get('expires');
            const signature = searchParams.get('signature');

            if (!id || !hash) {
                setStatus('error');
                return;
            }

            try {
                await axios.get(`http://localhost:8000/api/email/verify/${id}/${hash}`, {
                    params: { expires, signature }
                });
                
                setStatus('success');
                setTimeout(() => navigate('/login?verified=1'), 3000);
            } catch (err) {
                console.error("Erreur de vérification:", err);
                setStatus('error');
            }
        };

        verify();
    }, [searchParams, navigate]);

    // Fonction de renvoi intégrée
    const handleResend = async () => {
        setResending(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.post('http://localhost:8000/api/email/verification-notification', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.success || response.status === 200) {
                message.success("Un nouvel email a été envoyé sur Mailtrap !");
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                message.warning("Attendez 1 minute avant de réessayer.");
            } else {
                message.error("Session expirée. Veuillez vous reconnecter.");
                navigate('/login');
            }
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white shadow-md rounded-xl text-center max-w-md w-full">
                
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-600">Vérification de votre compte TalentFlow...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-pulse">
                        <h2 className="text-2xl font-bold text-green-600">✅ Email Vérifié !</h2>
                        <p className="mt-2 text-gray-600">Compte activé. Redirection...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-600">❌ Lien expiré ou invalide</h2>
                        <p className="mt-2 text-gray-400 text-sm">Ceci peut arriver si le lien a déjà été utilisé ou si le délai est dépassé.</p>
                        
                        <div className="mt-6 flex flex-col gap-3">
                            <button 
                                onClick={handleResend}
                                disabled={resending}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                            >
                                {resending ? "Envoi en cours..." : "Renvoyer l'email de vérification"}
                            </button>
                            
                            <button onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-indigo-600">
                                Retour à la page de connexion
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;