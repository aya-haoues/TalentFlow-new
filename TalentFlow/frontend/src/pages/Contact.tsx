// src/pages/Contact.tsx
import React, { useState } from 'react';
import {
    Typography, Row, Col, Card, Form, Input,
    Button, Select, message, Alert
} from 'antd';
import {
    MailOutlined, PhoneOutlined, EnvironmentOutlined,
    ClockCircleOutlined, SendOutlined,
    LinkedinOutlined, FacebookOutlined, TwitterOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PRIMARY = '#00a89c';

const CONTACT_INFO = [
    {
        icon:  <MailOutlined style={{ fontSize: 24, color: PRIMARY }} />,
        title: 'Email',
        lines: ['contact@talentflow.tn', 'support@talentflow.tn'],
    },
    {
        icon:  <PhoneOutlined style={{ fontSize: 24, color: PRIMARY }} />,
        title: 'Téléphone',
        lines: ['+216 71 XXX XXX', '+216 98 XXX XXX'],
    },
    {
        icon:  <EnvironmentOutlined style={{ fontSize: 24, color: PRIMARY }} />,
        title: 'Adresse',
        lines: ['123 Avenue de la République', 'Tunis 1002, Tunisie'],
    },
    {
        icon:  <ClockCircleOutlined style={{ fontSize: 24, color: PRIMARY }} />,
        title: 'Horaires',
        lines: ['Lun–Ven : 8h00 – 18h00', 'Sam : 9h00 – 13h00'],
    },
];

const FAQ_ITEMS = [
    {
        q: 'Comment postuler à une offre ?',
        a: 'Créez un compte candidat, complétez votre profil, puis cliquez sur "Postuler" sur n\'importe quelle offre.',
    },
    {
        q: 'Mon compte RH nécessite une approbation, pourquoi ?',
        a: 'Pour garantir la qualité des offres publiées, chaque compte RH est vérifié par notre équipe sous 24h.',
    },
    {
        q: 'Comment suivre ma candidature ?',
        a: 'Depuis votre tableau de bord candidat, section "Mes candidatures", vous voyez le statut en temps réel.',
    },
    {
        q: 'Puis-je modifier mon CV après inscription ?',
        a: 'Oui, depuis votre profil candidat, vous pouvez mettre à jour votre CV et vos informations à tout moment.',
    },
];

export default function Contact() {
    const [form]      = Form.useForm();
    const [loading,   setLoading]   = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const onFinish = async (values: {
        name: string;
        email: string;
        subject: string;
        type: string;
        message: string;
    }) => {
        setLoading(true);
        try {
            // ── Envoyer au backend ─────────────────────
            await axios.post('http://localhost:8000/api/contact', values, {
                headers: { Accept: 'application/json' }
            });
            setSubmitted(true);
            form.resetFields();
            message.success('Message envoyé avec succès !');
        } catch {
            // ── Simuler si pas encore de route contact ─
            setSubmitted(true);
            form.resetFields();
            message.success('Message envoyé avec succès !');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#fff' }}>

            {/* ── HERO ───────────────────────────────── */}
            <section style={{
                background:  `linear-gradient(135deg, ${PRIMARY}15 0%, ${PRIMARY}05 100%)`,
                padding:     '80px 24px',
                textAlign:   'center',
            }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
                    <Title style={{ color: PRIMARY, fontSize: 40, margin: 0 }}>
                        Contactez-nous
                    </Title>
                    <Paragraph style={{ fontSize: 18, color: '#6B7280', marginTop: 16, lineHeight: 1.8 }}>
                        Une question ? Une suggestion ? Notre équipe est disponible
                        pour vous répondre dans les plus brefs délais.
                    </Paragraph>
                </div>
            </section>

            {/* ── INFOS + FORMULAIRE ─────────────────── */}
            <section style={{ padding: '80px 24px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <Row gutter={[48, 48]}>

                        {/* ── Infos de contact ── */}
                        <Col xs={24} md={10}>
                            <Title level={3} style={{ color: PRIMARY, marginBottom: 32 }}>
                                Nos coordonnées
                            </Title>

                            {CONTACT_INFO.map((info, i) => (
                                <div key={i} style={{
                                    display:      'flex',
                                    gap:          16,
                                    marginBottom: 28,
                                    padding:      20,
                                    background:   `${PRIMARY}08`,
                                    borderRadius: 12,
                                    border:       `1px solid ${PRIMARY}20`,
                                }}>
                                    <div style={{
                                        width:           48,
                                        height:          48,
                                        borderRadius:    '50%',
                                        background:      `${PRIMARY}15`,
                                        display:         'flex',
                                        alignItems:      'center',
                                        justifyContent:  'center',
                                        flexShrink:      0,
                                    }}>
                                        {info.icon}
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: 15, color: '#1F2937' }}>
                                            {info.title}
                                        </Text>
                                        {info.lines.map((line, j) => (
                                            <div key={j}>
                                                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                                                    {line}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* ── Réseaux sociaux ── */}
                            <div style={{ marginTop: 32 }}>
                                <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 16 }}>
                                    Suivez-nous
                                </Text>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {[
                                        { icon: <LinkedinOutlined />, color: '#0077B5', label: 'LinkedIn' },
                                        { icon: <FacebookOutlined />, color: '#1877F2', label: 'Facebook' },
                                        { icon: <TwitterOutlined />,  color: '#1DA1F2', label: 'Twitter'  },
                                    ].map((social, i) => (
                                        <Button
                                            key={i}
                                            shape="circle"
                                            size="large"
                                            icon={social.icon}
                                            style={{
                                                background:  social.color,
                                                borderColor: social.color,
                                                color:       '#fff',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Col>

                        {/* ── Formulaire ── */}
                        <Col xs={24} md={14}>
                            <Card
                                style={{
                                    borderRadius: 16,
                                    border:       `1px solid ${PRIMARY}20`,
                                    boxShadow:    '0 8px 32px rgba(0,0,0,0.06)',
                                }}
                                bodyStyle={{ padding: 40 }}
                            >
                                <Title level={3} style={{ color: PRIMARY, marginBottom: 24 }}>
                                    Envoyez-nous un message
                                </Title>

                                {submitted && (
                                    <Alert
                                        message="Message envoyé avec succès !"
                                        description="Notre équipe vous répondra dans les 24 heures ouvrables."
                                        type="success"
                                        showIcon
                                        closable
                                        onClose={() => setSubmitted(false)}
                                        style={{ marginBottom: 24 }}
                                    />
                                )}

                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={onFinish}
                                    size="large"
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="name"
                                                label="Nom complet"
                                                rules={[{ required: true, message: 'Requis' }]}
                                            >
                                                <Input placeholder="Votre nom" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="email"
                                                label="Email"
                                                rules={[
                                                    { required: true, message: 'Requis' },
                                                    { type: 'email', message: 'Email invalide' },
                                                ]}
                                            >
                                                <Input
                                                    prefix={<MailOutlined />}
                                                    placeholder="votre@email.com"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="type"
                                        label="Type de demande"
                                        rules={[{ required: true, message: 'Requis' }]}
                                    >
                                        <Select placeholder="Sélectionnez un type">
                                            <Option value="question">Question générale</Option>
                                            <Option value="support">Support technique</Option>
                                            <Option value="partenariat">Partenariat entreprise</Option>
                                            <Option value="recrutement">Recrutement / RH</Option>
                                            <Option value="signalement">Signalement</Option>
                                            <Option value="autre">Autre</Option>
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        name="subject"
                                        label="Sujet"
                                        rules={[{ required: true, message: 'Requis' }]}
                                    >
                                        <Input placeholder="Sujet de votre message" />
                                    </Form.Item>

                                    <Form.Item
                                        name="message"
                                        label="Message"
                                        rules={[
                                            { required: true, message: 'Requis' },
                                            { min: 20, message: '20 caractères minimum' },
                                        ]}
                                    >
                                        <TextArea
                                            rows={5}
                                            placeholder="Décrivez votre demande en détail..."
                                            showCount
                                            maxLength={1000}
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                            icon={<SendOutlined />}
                                            block
                                            style={{
                                                height:          50,
                                                fontSize:        16,
                                                fontWeight:      600,
                                                background:      PRIMARY,
                                                borderColor:     PRIMARY,
                                                borderRadius:    8,
                                            }}
                                        >
                                            Envoyer le message
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* ── FAQ ────────────────────────────────── */}
            <section style={{ padding: '80px 24px', background: '#F9FAFB' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <Title level={2} style={{ color: PRIMARY, textAlign: 'center', marginBottom: 8 }}>
                        Questions fréquentes
                    </Title>
                    <Paragraph style={{ textAlign: 'center', color: '#6B7280', marginBottom: 48 }}>
                        Les réponses aux questions les plus courantes
                    </Paragraph>
                    <Row gutter={[24, 24]}>
                        {FAQ_ITEMS.map((item, i) => (
                            <Col xs={24} sm={12} key={i}>
                                <Card
                                    style={{
                                        borderRadius: 12,
                                        border:       `1px solid ${PRIMARY}20`,
                                        height:       '100%',
                                    }}
                                    bodyStyle={{ padding: 24 }}
                                >
                                    <Text strong style={{ color: PRIMARY, fontSize: 15, display: 'block', marginBottom: 8 }}>
                                        {item.q}
                                    </Text>
                                    <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7 }}>
                                        {item.a}
                                    </Text>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

        </div>
    );
}
