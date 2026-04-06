import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Progress, List, Avatar, Tag, message } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ThunderboltOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { managerService } from '../../services/api';
import type { Application } from '../../types';

const { Title, Text } = Typography;

const ManagerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await managerService.getTechnicalPending();
        setApplications(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      } catch (err) {
        message.error("Erreur de synchronisation des données");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <header>
        <Title level={2} style={{ marginBottom: 4 }}>Vue d'ensemble Technique</Title>
        <Text type="secondary">Suivi des validations et scores IA pour votre département.</Text>
      </header>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card bordered={false}>
                <Statistic title="À évaluer" value={applications.length} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false}>
                <Statistic title="Recrutés ce mois" value={5} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false}>
                <Statistic title="Précision IA" value={88} suffix="%" prefix={<RobotOutlined style={{ color: '#722ed1' }} />} />
              </Card>
            </Col>
          </Row>

          <Card title="Pipeline de recrutement technique" bordered={false} style={{ marginBottom: 24 }}>
            <Row justify="space-around" align="middle" style={{ textAlign: 'center' }}>
              <Col span={7}>
                <Text type="secondary">Tests en cours</Text>
                <Title level={3}>14</Title>
                <Progress percent={60} strokeColor="#1890ff" />
              </Col>
              <Col span={2}><ThunderboltOutlined style={{ fontSize: 24, color: '#bfbfbf' }} /></Col>
              <Col span={7}>
                <Text type="secondary">Entretiens Manager</Text>
                <Title level={3}>{applications.length}</Title>
                <Progress percent={40} strokeColor="#00a89c" />
              </Col>
            </Row>
          </Card>

          <Card title="Candidats prioritaires (Haut Score IA)" bordered={false} loading={loading}>
            <List
              dataSource={applications.slice(0, 3)}
              renderItem={item => (
                <List.Item actions={[<Tag color="purple">Match IA: {item.ai_score || 0}%</Tag>]}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00a89c' }} />}
                    title={item.candidate?.name}
                    description={item.job?.titre}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Calendrier Entretiens" bordered={false}>
             <List
                size="small"
                dataSource={[
                  { name: 'Sarah L.', time: '14:30', date: 'Aujourd\'hui' },
                  { name: 'Marc D.', time: '10:00', date: 'Demain' }
                ]}
                renderItem={item => (
                  <List.Item>
                    <Space direction="vertical" size={0}>
                      <Text strong>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.date} à {item.time}</Text>
                    </Space>
                  </List.Item>
                )}
             />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default ManagerDashboard;