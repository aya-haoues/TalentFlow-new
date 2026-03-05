// src/components/jobs/ApplicationFormSections.tsx
import React from 'react';
import { Form, Input, Select, DatePicker, Card, Button, Upload, Typography } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';

const { Text } = Typography;
const { TextArea } = Input;  // ✅ TextArea vient de Input, pas de Typography
const { RangePicker } = DatePicker;

const TURQUOISE = '#00a89c';

const inputStyle: React.CSSProperties = {
  background: '#fff',
  borderColor: '#f0f0f0',
  borderRadius: 8,
};

const cardStyle: React.CSSProperties = {
  marginBottom: 12,
  borderRadius: 8,
  border: '1px solid #f0f0f0',
  background: '#fff',
};

const sectionContentStyle: React.CSSProperties = {
  background: '#fff',
  padding: '16px 8px 8px',
};

/* ── SECTION: Documents ────────────────────────────────── */
export const DocumentsSection: React.FC<{
  cvFileList: UploadFile[];
  onCvChange: (fileList: UploadFile[]) => void;
}> = ({ cvFileList, onCvChange }) => (
  <Card bordered={false} style={{ background: '#fff', padding: 0 }}>
    <Form.Item
      name="cv"
      label={
        <>
          Curriculum Vitae <Text type="danger">*</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            Format PDF uniquement · Max 5 Mo
          </Text>
        </>
      }
      rules={[{
        validator: () =>
          cvFileList.length > 0 ? Promise.resolve() : Promise.reject('Veuillez joindre votre CV'),
      }]}
    >
      <Upload.Dragger
        beforeUpload={() => false}
        maxCount={1}
        accept=".pdf"
        fileList={cvFileList}
        onChange={(info) => onCvChange(info.fileList)}
        style={{ padding: '16px', background: '#fafafa', border: `1px dashed ${TURQUOISE}` }}
      >
        <UploadOutlined style={{ fontSize: 24, color: TURQUOISE }} />
        <p style={{ marginTop: 8 }}>Cliquez ou glissez votre CV PDF ici</p>
        <p style={{ fontSize: 12, color: '#999' }}>PDF · max 5 Mo</p>
      </Upload.Dragger>
    </Form.Item>
  </Card>
);

/* ── SECTION: Informations Personnelles ───────────────── */
export const PersonalInfoSection: React.FC = () => (
  <div style={sectionContentStyle}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      <Form.Item name={['personal_info', 'nom']} label="Nom *" rules={[{ required: true, message: 'Requis' }]}>
        <Input placeholder="Votre nom" style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'prenom']} label="Prénom *" rules={[{ required: true, message: 'Requis' }]}>
        <Input placeholder="Votre prénom" style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'email']} label="Email *"
        rules={[{ required: true, message: 'Requis' }, { type: 'email', message: 'Email invalide' }]}>
        <Input placeholder="votre@email.com" style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'telephone']} label="Téléphone *"
        rules={[{ required: true, message: 'Requis' },
          { pattern: /^(\+216|00216|0)?[23456789]\d{7}$/, message: 'Numéro tunisien invalide' }]}>
        <Input placeholder="+216 XX XXX XXX" style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'date_naissance']} label="Date de naissance">
        <DatePicker format="DD/MM/YYYY" style={{ ...inputStyle, width: '100%' }} />
      </Form.Item>
      <Form.Item name={['personal_info', 'genre']} label="Genre">
        <Select placeholder="Sélectionner" style={inputStyle}>
          <Select.Option value="homme">👨 Homme</Select.Option>
          <Select.Option value="femme">👩 Femme</Select.Option>
          <Select.Option value="autre">🔄 Autre</Select.Option>
          <Select.Option value="prefer_ne_pas_repondre">🤫 Préfère ne pas répondre</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name={['personal_info', 'nationalite']} label="Nationalité">
        <Input placeholder="Ex: Tunisienne" style={inputStyle} />
      </Form.Item>
    </div>

    {/* ✅ Correction: utiliser Text avec style au lieu de orientation="left" */}
    <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 4, height: 16, background: TURQUOISE, borderRadius: 2 }} />
      <Text style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>📍 Adresse</Text>
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <Form.Item name={['personal_info', 'adresse', 'rue']} label="Rue / Adresse" style={{ gridColumn: '1 / -1' }}>
        <Input placeholder="Numéro et nom de rue" style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'adresse', 'ville']} label="Ville">
        <Input placeholder="Ex: Tunis" style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'adresse', 'code_postal']} label="Code postal">
        <Input placeholder="Ex: 1000" style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'adresse', 'pays']} label="Pays" initialValue="Tunisie">
        <Input placeholder="Ex: Tunisie" style={inputStyle} />
      </Form.Item>
    </div>

    <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 4, height: 16, background: TURQUOISE, borderRadius: 2 }} />
      <Text style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>🔗 Profils en ligne</Text>
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
      <Form.Item name={['personal_info', 'linkedin_url']} label="LinkedIn">
        <Input placeholder="https://linkedin.com/in/..." style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'github_url']} label="GitHub">
        <Input placeholder="https://github.com/..." style={inputStyle} />
      </Form.Item>
      <Form.Item name={['personal_info', 'site_web']} label="Portfolio / Site web">
        <Input placeholder="https://votre-site.com" style={inputStyle} />
      </Form.Item>
    </div>
  </div>
);

/* ── SECTION: Expériences Professionnelles ────────────── */
export const ExperiencesSection: React.FC = () => (
  <div style={sectionContentStyle}>
    <Form.List name="experiences">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...rest }) => (
            <Card key={key} size="small" style={cardStyle}
              title={`Expérience #${name + 1}`}
              extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <Form.Item {...rest} name={[name, 'entreprise']} label="Entreprise" rules={[{ required: true, message: 'Requis' }]}>
                  <Input placeholder="Nom de l'entreprise" style={inputStyle} />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'poste']} label="Poste occupé">
                  <Input placeholder="Intitulé du poste" style={inputStyle} />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'secteur']} label="Secteur">
                  <Input placeholder="Ex: Informatique" style={inputStyle} />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'pays']} label="Pays">
                  <Input placeholder="Ex: Tunisie" style={inputStyle} />
                </Form.Item>
              </div>
              <Form.Item {...rest} name={[name, 'dates']} label="Période">
                <RangePicker picker="month" format="MM/YYYY" style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
              <Form.Item {...rest} name={[name, 'description']} label="Missions principales">
                <TextArea rows={2} placeholder="Décrivez vos responsabilités…" style={inputStyle} />
              </Form.Item>
            </Card>
          ))}
          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} 
            style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
            + Ajouter une expérience
          </Button>
        </>
      )}
    </Form.List>
  </div>
);

/* ── SECTION: Formation ───────────────────────────────── */
export const FormationsSection: React.FC = () => (
  <div style={sectionContentStyle}>
    <Form.List name="formations">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...rest }) => (
            <Card key={key} size="small" style={cardStyle}
              title={`Formation #${name + 1}`}
              extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <Form.Item {...rest} name={[name, 'etablissement']} label="Établissement" rules={[{ required: true, message: 'Requis' }]}>
                  <Input placeholder="École / Université" style={inputStyle} />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'diplome']} label="Diplôme">
                  <Input placeholder="Ex: Master, Licence…" style={inputStyle} />
                </Form.Item>
              </div>
              <Form.Item {...rest} name={[name, 'specialite']} label="Spécialité / Filière">
                <Input placeholder="Ex: Informatique, Gestion…" style={inputStyle} />
              </Form.Item>
              <Form.Item {...rest} name={[name, 'dates']} label="Années d'études">
                <RangePicker picker="year" format="YYYY" style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
              <Form.Item {...rest} name={[name, 'description']} label="Détails (optionnel)">
                <TextArea rows={2} placeholder="Matières principales, projets…" style={inputStyle} />
              </Form.Item>
            </Card>
          ))}
          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} 
            style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
            + Ajouter une formation
          </Button>
        </>
      )}
    </Form.List>
  </div>
);

/* ── SECTION: Compétences ─────────────────────────────── */
export const SkillsSection: React.FC = () => (
  <div style={sectionContentStyle}>
    <Form.List name="skills">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...rest }) => (
            <Card key={key} size="small" style={cardStyle}
              title={`Compétence #${name + 1}`}
              extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <Form.Item {...rest} name={[name, 'nom']} label="Nom" rules={[{ required: true, message: 'Requis' }]}>
                  <Input placeholder="React, Laravel, Anglais…" style={inputStyle} />
                </Form.Item>
                <Form.Item {...rest} name={[name, 'niveau']} label="Niveau">
                  <Select placeholder="Sélectionner" style={inputStyle}>
                    <Select.Option value="debutant">⭐ Débutant</Select.Option>
                    <Select.Option value="intermediaire">⭐⭐ Intermédiaire</Select.Option>
                    <Select.Option value="avance">⭐⭐⭐ Avancé</Select.Option>
                    <Select.Option value="expert">⭐⭐⭐⭐ Expert</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item {...rest} name={[name, 'annees']} label="Années d'exp.">
                  <Input type="number" min={0} max={50} placeholder="0" style={inputStyle} />
                </Form.Item>
              </div>
              <Form.Item {...rest} name={[name, 'lien']} label="Lien (GitHub, Portfolio…)">
                <Input placeholder="https://…" style={inputStyle} />
              </Form.Item>
            </Card>
          ))}
          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} 
            style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
            + Ajouter une compétence
          </Button>
        </>
      )}
    </Form.List>
  </div>
);

/* ── SECTION: Défis ───────────────────────────────────── */
export const ChallengesSection: React.FC = () => (
  <div style={sectionContentStyle}>
    <Form.List name="challenges">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...rest }) => (
            <Card key={key} size="small" style={cardStyle}
              title={`Défi #${name + 1}`}
              extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
            >
              <Form.Item {...rest} name={[name, 'type']} label="Type de défi">
                <Input placeholder="Ex: Technique, Management…" style={inputStyle} />
              </Form.Item>
              <Form.Item {...rest} name={[name, 'description']} label="Contexte et défi" rules={[{ required: true, message: 'Requis' }]}>
                <TextArea rows={3} placeholder="Quelle était la situation ?" style={inputStyle} />
              </Form.Item>
              <Form.Item {...rest} name={[name, 'lecon']} label="Résultat et apprentissage">
                <TextArea rows={2} placeholder="Qu'avez-vous appris ?" style={inputStyle} />
              </Form.Item>
            </Card>
          ))}
          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} 
            style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
            + Ajouter un défi
          </Button>
        </>
      )}
    </Form.List>
  </div>
);

/* ── SECTION: Informations Complémentaires ────────────── */
export const ComplementaryInfoSection: React.FC = () => (
  <div style={sectionContentStyle}>
    <Form.Item name="handicap" label="Aménagements spécifiques (optionnel)">
      <TextArea rows={3} placeholder="Décrivez tout aménagement dont vous pourriez avoir besoin…" style={inputStyle} />
    </Form.Item>
    
    {/* ✅ Séparateur simple sans Divider */}
    <div style={{ margin: '20px 0', borderTop: `1px solid #f0f0f0` }} />
    
    <Form.Item
      name="why_us"
      label={<>Pourquoi ce poste chez nous ? <Text type="danger">*</Text></>}
      rules={[
        { required: true, message: 'Veuillez expliquer votre motivation' },
        { min: 20, message: 'Minimum 20 caractères' },
      ]}
    >
      <TextArea rows={4} placeholder="Qu'est-ce qui vous attire dans cette offre ?" showCount maxLength={500} style={inputStyle} />
    </Form.Item>
    <Form.Item
      name="contract_type"
      label={<>Type de contrat recherché <Text type="danger">*</Text></>}
      rules={[{ required: true, message: 'Veuillez sélectionner un type de contrat' }]}
    >
      <Select placeholder="Sélectionner" style={{ ...inputStyle, maxWidth: 320 }}>
        <Select.Option value="CDI">🔒 CDI</Select.Option>
        <Select.Option value="CDD">📅 CDD</Select.Option>
        <Select.Option value="SIVP">🎓 SIVP</Select.Option>
        <Select.Option value="Freelance">💼 Freelance</Select.Option>
        <Select.Option value="Alternance">🔄 Alternance</Select.Option>
      </Select>
    </Form.Item>
  </div>
);