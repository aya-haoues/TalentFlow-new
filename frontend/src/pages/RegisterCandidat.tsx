import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message, Alert } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { authService } from "../services/api";
import type { RegisterFormData } from "../types";

const { Title, Text } = Typography;

const RegisterCandidat: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      // 🔑 APPEL SPÉCIFIQUE POUR CANDIDATS
      const response = await fetch(
        "http://localhost:8000/api/register/candidat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erreur d'inscription");
      }

      message.success("Inscription réussie ! Veuillez vous connecter.");
      navigate("/login");
    } catch (error: any) {
      message.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "16px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Title level={2} style={{ margin: 0, color: "#00a89c" }}>
            Talentflow
          </Title>
          <Text type="secondary">Créer un compte candidat</Text>
          <Alert
            message="Rôle candidat attribué automatiquement"
            type="info"
            showIcon
            style={{ marginTop: "12px" }}
          />
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="name"
            rules={[
              { required: true, message: "Nom obligatoire" },
              { min: 2, message: "2 caractères minimum" },
              {
                pattern: /^[a-zA-Zàâçéèêëîïôûùüÿñæœ\s]+$/,
                message: "Lettres uniquement",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nom complet"
              size="large"
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Email obligatoire" },
              { type: "email", message: "Format invalide" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              size="large"
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Mot de passe obligatoire" },
              { min: 8, message: "8 caractères minimum" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: "1 maj, 1 min, 1 chiffre",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mot de passe"
              size="large"
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item
            name="password_confirmation"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Confirmation obligatoire" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Non identique"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirmer le mot de passe"
              size="large"
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item
            name="telephone"
            rules={[
              {
                pattern: /^(\+216|00216|0)?[23456789]\d{7}$/,
                message: "Format tunisien (+216 20 123 456)",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Téléphone (optionnel)"
              size="large"
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item
            name="linkedin_url"
            rules={[
              { type: "url", message: "URL invalide" },
              {
                pattern:
                  /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_]{5,30}\/?$/,
                message: "Profil LinkedIn valide requis",
              },
            ]}
          >
            <Input
              prefix={<LinkOutlined />}
              placeholder="URL LinkedIn (optionnel)"
              size="large"
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              style={{
                height: "52px",
                fontSize: "1.1rem",
                fontWeight: "600",
                borderRadius: "12px",
                backgroundColor: "#00a89c",
                borderColor: "#00a89c",
              }}
            >
              Créer mon compte candidat
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            borderTop: "1px solid #f0f0f0",
            paddingTop: "1.5rem",
          }}
        >
          <Text type="secondary">
            Vous avez un compte ?{" "}
            <Link
              to="/login"
              style={{ color: "#00a89c", fontWeight: "600" }}
            >
              Se connecter
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterCandidat;
