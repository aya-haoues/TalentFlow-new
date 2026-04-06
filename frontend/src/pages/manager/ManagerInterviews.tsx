import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, message } from 'antd';
import api from '../../services/api';

const { Title } = Typography;

const ManagerInterviews: React.FC = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/manager/interview-history')
            .then(res => setData(res.data.data))
            .catch(() => message.error("Erreur de chargement de l'historique"))
            .finally(() => setLoading(false));
    }, []);

    const columns = [
        {
            title: 'Candidat',
            dataIndex: 'full_name',
            key: 'name',
            render: (text: string, record: any) => <b>{record.prenom} {record.nom}</b>
        },
        {
            title: 'Poste',
            dataIndex: ['job', 'titre'],
            key: 'job',
        },
        {
            title: 'Note Technique',
            dataIndex: 'note_technique',
            key: 'note',
            render: (note: number) => (
                <Tag color={note >= 50 ? 'green' : 'red'} style={{fontSize: '14px'}}>
                    {note} / 100
                </Tag>
            )
        },
        {
            title: 'Date Évaluation',
            dataIndex: 'updated_at',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleDateString()
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={3}>Historique des Entretiens</Title>
            <Card>
                <Table 
                    columns={columns} 
                    dataSource={data} 
                    loading={loading} 
                    rowKey="id"
                />
            </Card>
        </div>
    );
};

export default ManagerInterviews;