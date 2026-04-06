// src/components/ui/SocialButtons.tsx
import { Button, Divider, Space } from 'antd';
import { GoogleOutlined, LinkedinOutlined } from '@ant-design/icons';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

interface SocialButtonsProps {
  mode?: 'login' | 'register';
}

const LABELS = {
  login:    { google: 'Continuer avec Google',   linkedin: 'Continuer avec LinkedIn'   },
  register: { google: "S'inscrire avec Google",  linkedin: "S'inscrire avec LinkedIn"  },
};

export default function SocialButtons({ mode = 'login' }: SocialButtonsProps) {
  const labels = LABELS[mode];

  const handleGoogle   = () => { window.location.href = `${API_URL}/auth/google/redirect`;   };
  const handleLinkedIn = () => { window.location.href = `${API_URL}/auth/linkedin/redirect`; };

  return (
    <div style={{ width: '100%' }}>
      <Divider plain style={{ color: '#8c8c8c', fontSize: 13 }}>
        {mode === 'login' ? 'Ou connectez-vous avec' : 'Ou inscrivez-vous avec'}
      </Divider>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Google */}
        <Button
          size="large"
          block
          icon={<GoogleOutlined />}
          onClick={handleGoogle}
          style={{
            height:     48,
            fontSize:   15,
            fontWeight: 500,
            border:     '1px solid #dadce0',
            color:      '#3c4043',
            boxShadow:  '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {labels.google}
        </Button>

        {/* LinkedIn */}
        <Button
          size="large"
          block
          icon={<LinkedinOutlined />}
          onClick={handleLinkedIn}
          style={{
            height:          48,
            fontSize:        15,
            fontWeight:      500,
            backgroundColor: '#0a66c2',
            borderColor:     '#0a66c2',
            color:           '#ffffff',
            boxShadow:       '0 1px 3px rgba(10,102,194,0.25)',
          }}
        >
          {labels.linkedin}
        </Button>
      </Space>
    </div>
  );
}
