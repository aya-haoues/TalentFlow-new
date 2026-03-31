import React, { useEffect, useState } from "react";
import { List, Avatar, Card, Typography, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import api from "../../services/api";

const { Text } = Typography;

export default function MonEquipe() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Utilisation de l'URL correcte définie dans api.php
    api
      .get("/manager/my-team")
      .then((res) => {
        // Sécurité supplémentaire au cas où les données ne sont pas doublement encapsulées
        setMembers(res.data.data || res.data);
      })
      .catch((err) => console.error("Erreur de chargement de l'équipe :", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Membres du département">
      <List
        loading={loading}
        dataSource={members}
        renderItem={(user: any) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={user.name}
              description={user.email}
            />
            <Text type="secondary">{user.role || "Collaborateur"}</Text>
          </List.Item>
        )}
      />
    </Card>
  );
}
