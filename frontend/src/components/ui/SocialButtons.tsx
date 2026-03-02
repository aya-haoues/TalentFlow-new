import React from 'react';
import { Button, Space, Divider } from 'antd';
import { GoogleOutlined, LinkedinOutlined } from '@ant-design/icons';

interface SocialButtonsProps {
  type?: 'login' | 'register';
}

const SocialButtons: React.FC<SocialButtonsProps> = ({ type = 'login' }) => {
  const handleGoogle = () => {
    window.location.href = "http://localhost:8000/api/auth/google/redirect";
  };

  const handleLinkedIn = () => {
    window.location.href = "http://localhost:8000/api/auth/linkedin/redirect";
  };

  return (
    <div style={{ width: '100%' }}>
      <Divider>{type === 'login' ? 'Ou connectez-vous avec' : 'Ou inscrivez-vous avec'}</Divider>
      
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button 
          size="large" 
          block 
          icon={<GoogleOutlined />}
          onClick={handleGoogle}
          style={{ 
            height: '48px',
            fontSize: '1rem',
            fontWeight: '500',
            border: '1px solid #dadce0',
            color: '#3c4043',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {type === 'login' ? 'Continuer avec Google' : 'S\'inscrire avec Google'}
        </Button>

        <Button 
          size="large" 
          block 
          icon={<LinkedinOutlined />}
          onClick={handleLinkedIn}
          style={{ 
            height: '48px',
            fontSize: '1rem',
            fontWeight: '500',
            backgroundColor: '#0a66c2',
            borderColor: '#0a66c2',
            color: 'white',
            boxShadow: '0 1px 3px rgba(10, 102, 194, 0.3)'
          }}
        >
          {type === 'login' ? 'Continuer avec LinkedIn' : 'S\'inscrire avec LinkedIn'}
        </Button>
      </Space>
    </div>
  );
};

export default SocialButtons;