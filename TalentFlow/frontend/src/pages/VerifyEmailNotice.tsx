// src/pages/public/VerifyEmailNotice.tsx
import { Result, Button, Typography, Space, Card } from 'antd';
import { MailOutlined, ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

export default function VerifyEmailNotice() {
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('temp_email') || "votre adresse email";

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card 
                className="max-w-2xl w-full shadow-lg border-t-4 border-indigo-600"
                style={{ borderRadius: '16px' }}
            >
                <Result
                    icon={<MailOutlined className="text-6xl text-indigo-500 animate-bounce" />}
                    title={
                        <Title level={2} className="text-gray-800">
                            Vérifiez votre boîte de réception !
                        </Title>
                    }
                    subTitle={
                        <div className="flex flex-col gap-2">
                            <Text className="text-lg">
                                Un lien de confirmation a été envoyé à : <br/>
                                <strong className="text-indigo-600">{userEmail}</strong>
                            </Text>
                            <Text type="secondary">
                                Pour des raisons de sécurité, vous devez valider votre compte avant de pouvoir postuler à des offres.
                            </Text>
                        </div>
                    }
                    extra={[
                        <Space direction="vertical" className="w-full" size="middle" key="actions">
                            <Button 
                                type="primary" 
                                size="large" 
                                icon={<RocketOutlined />}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => window.open('https://mailtrap.io', '_blank')}
                            >
                                Ouvrir Mailtrap
                            </Button>
                            
                            <div className="flex justify-between gap-4">
                                <Button 
                                    icon={<ArrowLeftOutlined />} 
                                    onClick={() => navigate('/jobs')}
                                    className="flex-1"
                                >
                                    Retour aux offres
                                </Button>
                                <Button 
                                    type="link" 
                                    onClick={() => navigate('/verify-email')} // On le renvoie vers la page qui gère le resend
                                    className="text-indigo-600 font-medium"
                                >
                                    Je n'ai rien reçu
                                </Button>
                            </div>
                        </Space>
                    ]}
                />
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Text italic className="text-blue-700 text-sm">
                        💡 Conseil : Pensez à vérifier vos courriers indésirables (Spams) si vous ne voyez pas l'email dans quelques instants.
                    </Text>
                </div>
            </Card>
        </div>
    );
}