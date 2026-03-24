import { useEffect, useState } from 'react'; // On retire "React" car il n'est plus nécessaire dans les versions récentes
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const navigate = useNavigate();

    const queryURL = searchParams.get('queryURL');

    useEffect(() => {
        // L'astuce pour éviter le "cascading render" est de mettre la logique 
        // de vérification dans une fonction interne
        const verify = async () => {
            if (!queryURL) {
                setStatus('error');
                return;
            }

            try {
                await axios.get(queryURL);
                setStatus('success');
                setTimeout(() => navigate('/login?verified=1'), 3000);
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        };

        verify();
    }, [queryURL, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white shadow-md rounded-xl text-center max-w-md w-full">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-600">Vérification de votre compte en cours...</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="animate-fade-in">
                        <h1 className="text-2xl font-bold text-green-600 mb-2">✅ Email vérifié !</h1>
                        <p className="text-gray-600">Votre compte est activé. Redirection vers la connexion...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-fade-in">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">❌ Lien invalide</h1>
                        <p className="text-gray-600">Le lien a expiré ou est corrompu. Veuillez demander un nouvel email.</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            Retour au login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;