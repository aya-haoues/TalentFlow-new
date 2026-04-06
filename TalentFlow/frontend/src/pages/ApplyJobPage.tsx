// src/pages/ApplyJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import {
  Form, Input, Button, DatePicker, Card, Typography,
  Select, message, Layout, Upload, Modal, Divider, Collapse
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SendOutlined,
  ArrowLeftOutlined, PlusSquareOutlined, MinusSquareOutlined,
  UploadOutlined, WarningOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';
import api, { authService } from '../services/api';
import Navbar from '../components/layout/Navbar';

const { Title, Text } = Typography;
const { Content } = Layout;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Panel } = Collapse;

/* ── Constantes de couleur ──────────────────────────────── */
const TURQUOISE = '#00a89c';
const TURQUOISE_LIGHT = '#e6fffb';

/* ── Types ───────────────────────────────────────────────── */
interface AddressInput { rue?: string; ville?: string; code_postal?: string; pays?: string; }
interface PersonalInfo {
  nom?: string; prenom?: string; email?: string; telephone?: string;
  date_naissance?: Dayjs | null; genre?: string; nationalite?: string;
  adresse?: AddressInput; linkedin_url?: string; github_url?: string; site_web?: string;
}
interface ExperienceInput { entreprise?: string; poste?: string; dates?: [Dayjs, Dayjs] | null; secteur?: string; pays?: string; description?: string; }
interface FormationInput  { etablissement?: string; diplome?: string; specialite?: string; dates?: [Dayjs, Dayjs] | null; description?: string; }
interface SkillInput      { nom?: string; niveau?: string; annees?: string; lien?: string; }
interface ChallengeInput  { type?: string; description?: string; lecon?: string; }
interface ApplicationFormValues {
  personal_info?: PersonalInfo;
  cv?: { fileList: UploadFile[] };
  experiences?: ExperienceInput[];
  formations?: FormationInput[];
  skills?: SkillInput[];
  challenges?: ChallengeInput[];
  handicap?: string; why_us?: string; contract_type?: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
function dayjsToString(value: unknown): string | null {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value.format('YYYY-MM-DD');
  if (typeof value === 'string') return value;
  return null;
}

function appendIfNotEmpty<T extends Record<string, unknown>>(fd: FormData, key: string, data: T[] | undefined): void {
  if (!Array.isArray(data) || data.length === 0) return;
  const filtered = data.filter(item => item && Object.values(item).some(v => v !== undefined && String(v).trim() !== ''));
  if (filtered.length > 0) fd.append(key, JSON.stringify(filtered));
}

/* ── Clés des panels ─────────────────────────────────────── */
const ALL_KEYS = ['documents', 'personal', 'experiences', 'formations', 'skills', 'challenges', 'complementaire'];

/* ── Style accordéon avec touches turquoise ──────────────── */
const collapseStyle: React.CSSProperties = {
  borderRadius: 8,
  border: `1px solid ${TURQUOISE}20`, // très léger
  background: '#ffffff',
  boxShadow: `0 2px 8px ${TURQUOISE}10`,
};

const panelHeaderStyle: React.CSSProperties = {
  background: '#ffffff',
  fontWeight: 600,
  fontSize: 15,
  color: '#004d4a',
  borderBottom: `1px solid ${TURQUOISE}20`,
  padding: '12px 16px',
  transition: 'all 0.3s',
};

// Style pour un panel actif (optionnel, peut être géré par antd)
const activePanelHeaderStyle: React.CSSProperties = {
  ...panelHeaderStyle,
  borderLeft: `4px solid ${TURQUOISE}`,
  backgroundColor: TURQUOISE_LIGHT,
};

/* ══════════════════════════════════════════════════════════
   COMPOSANT
══════════════════════════════════════════════════════════ */
const ApplyJobPage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form]   = Form.useForm<ApplicationFormValues>();

  const [loading,      setLoading]      = useState(false);
  const [jobTitle,     setJobTitle]     = useState('Chargement…');
  const [jobLoading,   setJobLoading]   = useState(true);
  const [cvFileList,   setCvFileList]   = useState<UploadFile[]>([]);
  const [activeKeys,   setActiveKeys]   = useState<string[]>([]); // fermés par défaut

  /* ── Chargement titre ────────────────────────────────── */
  useEffect(() => {
    if (!id) return;
    setJobLoading(true);
    api.get(`/jobs/${id}`)
      .then(res => {
        const data = res.data;
        setJobTitle(data?.data?.titre ?? data?.titre ?? "Offre d'emploi");
      })
      .catch(() => {
        setJobTitle('Offre non disponible');
        message.warning("Impossible de charger les détails de l'offre");
      })
      .finally(() => setJobLoading(false));
  }, [id]);

  /* ── Pré-remplissage ─────────────────────────────────── */
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const parts  = user.name?.trim().split(/\s+/) ?? [];
    form.setFieldsValue({
      personal_info: {
        nom:          parts[0]               ?? '',
        prenom:       parts.slice(1).join(' ') ?? '',
        email:        user.email              ?? '',
        telephone:    user.telephone          ?? '',
        linkedin_url: user.linkedin_url       ?? '',
      },
    });
  }, [form]);

  /* ── Ouvrir / Fermer tout ────────────────────────────── */
  const expandAll  = () => setActiveKeys([...ALL_KEYS]);
  const collapseAll = () => setActiveKeys([]);

  /* ── Soumission ──────────────────────────────────────── */
  /* ── Soumission Corrigée ──────────────────────────────── */
  const onFinish = async (values: ApplicationFormValues) => {
    if (!id) { 
      message.error("ID de l'offre manquant"); 
      return; 
    }

    const uploadedFile = cvFileList[cvFileList.length - 1];
    const cvFile = uploadedFile?.originFileObj;
    
    if (!cvFile) { 
      message.error('Veuillez joindre votre CV au format PDF'); 
      return; 
    }

    setLoading(true);
    try {
      const fd = new FormData();
      
      // 1. Informations de base de l'offre
      fd.append('job_id', id);
      // Correction Erreur "motivation is required"
      fd.append('motivation', values.why_us?.trim() ?? ''); 
      // Correction Erreur "contract type preferred is required"
      fd.append('contract_type_preferred', values.contract_type ?? '');
      
      // 2. Fichier CV
      fd.append('cv', cvFile, cvFile.name);

      // 3. Informations Personnelles
      const pi = values.personal_info;
      if (pi) {
        if (pi.nom?.trim())       fd.append('nom', pi.nom.trim());
        if (pi.prenom?.trim())    fd.append('prenom', pi.prenom.trim());
        if (pi.email?.trim())     fd.append('email', pi.email.trim());
        if (pi.telephone?.trim())  fd.append('telephone', pi.telephone.trim());
        if (pi.genre)             fd.append('genre', pi.genre);
        if (pi.nationalite?.trim()) fd.append('nationalite', pi.nationalite.trim());
        if (pi.linkedin_url?.trim()) fd.append('linkedin_url', pi.linkedin_url.trim());
        if (pi.github_url?.trim())   fd.append('github_url', pi.github_url.trim());
        if (pi.site_web?.trim())     fd.append('site_web', pi.site_web.trim());
        
        const dn = dayjsToString(pi.date_naissance);
        if (dn) fd.append('date_naissance', dn);

        // Correction Erreur "adresse must be an array"
        if (pi.adresse) {
            // On envoie chaque sous-champ avec l'index [0] pour simuler un premier élément de tableau
            if (pi.adresse.rue)         fd.append('adresse[0][rue]', pi.adresse.rue);
            if (pi.adresse.ville)       fd.append('adresse[0][ville]', pi.adresse.ville);
            if (pi.adresse.code_postal) fd.append('adresse[0][code_postal]', pi.adresse.code_postal);
            if (pi.adresse.pays)        fd.append('adresse[0][pays]', pi.adresse.pays);
        }
      }

      // 4. Champs complémentaires
      if (values.handicap?.trim()) {
        fd.append('handicap_info', values.handicap.trim());
      }

      // 5. Tableaux (Expériences, Formations, Skills, Challenges)
      // Utilisation de ta fonction helper appendIfNotEmpty
      appendIfNotEmpty(fd, 'experiences', values.experiences as Record<string, unknown>[]);
      appendIfNotEmpty(fd, 'formations',  values.formations  as Record<string, unknown>[]);
      appendIfNotEmpty(fd, 'skills',      values.skills      as Record<string, unknown>[]);
      appendIfNotEmpty(fd, 'challenges',  values.challenges  as Record<string, unknown>[]);

      // 6. Envoi API
      await api.post('/applications', fd, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json' 
        },
        timeout: 30000,
      });

      Modal.success({
        title: 'Candidature envoyée ! 🎉',
        content: `Votre candidature pour "${jobTitle}" a bien été transmise à l'équipe RH.`,
        okText: 'Voir mon tableau de bord',
        onOk: () => navigate('/candidat/dashboard'),
      });

      form.resetFields();
      setCvFileList([]);

    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 422 && data?.errors) {
          // Affiche chaque erreur de validation retournée par Laravel
          Object.entries(data.errors as Record<string, string[]>).forEach(([field, msgs]) => {
            message.error(`${field.replace(/_/g, ' ')} : ${msgs[0]}`);
          });
        } else if (status === 401) {
          message.error('Votre session a expiré. Veuillez vous reconnecter.');
          navigate('/login');
        } else if (status === 409) {
          message.warning('Vous avez déjà postulé à cette offre.');
        } else {
          message.error(data?.message ?? "Une erreur est survenue lors de l'envoi.");
        }
      } else {
        message.error('Erreur de connexion au serveur.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleBack = () => {
    if (form.isFieldsTouched()) {
      Modal.confirm({
        title: 'Quitter la page ?', content: 'Vos modifications ne seront pas sauvegardées.',
        okText: 'Oui, quitter', cancelText: 'Rester', onOk: () => navigate(-1),
      });
    } else navigate(-1);
  };

  /* ── Rendu ───────────────────────────────────────────── */
  return (
    <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Navbar />

      <Content style={{ padding: '24px 16px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>

          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack} 
            style={{ marginBottom: 20, borderColor: TURQUOISE, color: TURQUOISE }}
          >
            Retour à l'offre
          </Button>

          {/* En-tête */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ color: '#004d4a', marginBottom: 4 }}>
              {jobLoading ? 'Chargement…' : `Candidature : ${jobTitle}`}
            </Title>
            <Text type="secondary">Cliquez sur un module pour afficher ses champs</Text>
          </div>

          {/* ── Boutons + / - ────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 2 }}>
            <Button
              icon={<PlusSquareOutlined />}
              onClick={expandAll}
              size="middle"
              style={{ fontWeight: 700, fontSize: 16, padding: '0 10px', borderColor: TURQUOISE, color: TURQUOISE }}
              title="Tout ouvrir"
            />
            <Button
              icon={<MinusSquareOutlined />}
              onClick={collapseAll}
              size="middle"
              style={{ fontWeight: 700, fontSize: 16, padding: '0 10px', borderColor: TURQUOISE, color: TURQUOISE }}
              title="Tout fermer"
            />
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError>

            {/* ── Accordéon ────────────────────────────── */}
            <Collapse
              activeKey={activeKeys}
              onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
              style={collapseStyle}
              expandIconPosition="start"
              bordered={false}
            >

              {/* ── Mes Documents ──────────────────────── */}
              <Panel
                key="documents"
                header="Mes Documents"
                style={activeKeys.includes('documents') ? activePanelHeaderStyle : panelHeaderStyle}
              >
                <Card bordered={false} style={{ background: '#ffffff', padding: 0 }}>
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
                      onChange={(info) => setCvFileList(info.fileList)}
                      style={{ padding: '16px', background: '#fafafa', border: `1px dashed ${TURQUOISE}` }}
                    >
                      <UploadOutlined style={{ fontSize: 24, color: TURQUOISE }} />
                      <p style={{ marginTop: 8 }}>Cliquez ou glissez votre CV PDF ici</p>
                      <p style={{ fontSize: 12, color: '#999' }}>PDF · max 5 Mo</p>
                    </Upload.Dragger>
                  </Form.Item>
                </Card>
              </Panel>

              {/* ── Informations Personnelles ───────────── */}
              <Panel
                key="personal"
                header="Informations Personnelles"
                style={activeKeys.includes('personal') ? activePanelHeaderStyle : panelHeaderStyle}
              >
                <Card bordered={false} style={{ background: '#ffffff', padding: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <Form.Item name={['personal_info', 'nom']}    label="Nom *"    rules={[{ required: true, message: 'Requis' }]}>
                      <Input placeholder="Votre nom" />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'prenom']} label="Prénom *" rules={[{ required: true, message: 'Requis' }]}>
                      <Input placeholder="Votre prénom" />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'email']}  label="Email *"
                      rules={[{ required: true, message: 'Requis' }, { type: 'email', message: 'Email invalide' }]}>
                      <Input placeholder="votre@email.com" />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'telephone']} label="Téléphone *"
                      rules={[{ required: true, message: 'Requis' },
                        { pattern: /^(\+216|00216|0)?[23456789]\d{7}$/, message: 'Numéro tunisien invalide' }]}>
                      <Input placeholder="+216 XX XXX XXX" />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'date_naissance']} label="Date de naissance">
                      <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'genre']} label="Genre">
                      <Select placeholder="Sélectionner">
                        <Select.Option value="homme">👨 Homme</Select.Option>
                        <Select.Option value="femme">👩 Femme</Select.Option>
                        <Select.Option value="autre">🔄 Autre</Select.Option>
                        <Select.Option value="prefer_ne_pas_repondre">🤫 Préfère ne pas répondre</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name={['personal_info', 'nationalite']} label="Nationalité">
                      <Input placeholder="Ex: Tunisienne" />
                    </Form.Item>
                  </div>

<Divider style={{ textAlign: 'left', margin: '20px 0', fontSize: 13, color: '#888' }}>
  Adresse
</Divider>                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <Form.Item name={['personal_info', 'adresse', 'rue']} label="Rue / Adresse" style={{ gridColumn: '1 / -1' }}>
                      <Input placeholder="Numéro et nom de rue" />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'adresse', 'ville']} label="Ville">
                      <Input placeholder="Ex: Tunis" />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'adresse', 'code_postal']} label="Code postal">
                      <Input placeholder="Ex: 1000" />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'adresse', 'pays']} label="Pays" initialValue="Tunisie">
                      <Input placeholder="Ex: Tunisie" />
                    </Form.Item>
                  </div>

<Divider style={{ textAlign: 'left', margin: '20px 0', fontSize: 13, color: '#888' }}>
  Profils en ligne
</Divider>                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
                    <Form.Item name={['personal_info', 'linkedin_url']} label="LinkedIn">
                      <Input placeholder="https://linkedin.com/in/..." />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'github_url']} label="GitHub">
                      <Input placeholder="https://github.com/..." />
                    </Form.Item>
                    <Form.Item name={['personal_info', 'site_web']} label="Portfolio / Site web">
                      <Input placeholder="https://votre-site.com" />
                    </Form.Item>
                  </div>
                </Card>
              </Panel>

              {/* ── Expériences Professionnelles ───────── */}
              <Panel
                key="experiences"
                header="Expériences Professionnelles"
                style={activeKeys.includes('experiences') ? activePanelHeaderStyle : panelHeaderStyle}
              >
                <Card bordered={false} style={{ background: '#ffffff', padding: 0 }}>
                  <Form.List name="experiences">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...rest }) => (
                          <Card key={key} size="small"
                            style={{ marginBottom: 12, borderRadius: 8, border: `1px solid ${TURQUOISE}20`, background: '#ffffff' }}
                            title={`Expérience #${name + 1}`}
                            extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                              <Form.Item {...rest} name={[name, 'entreprise']} label="Entreprise" rules={[{ required: true, message: 'Requis' }]}>
                                <Input placeholder="Nom de l'entreprise" />
                              </Form.Item>
                              <Form.Item {...rest} name={[name, 'poste']} label="Poste occupé">
                                <Input placeholder="Intitulé du poste" />
                              </Form.Item>
                              <Form.Item {...rest} name={[name, 'secteur']} label="Secteur">
                                <Input placeholder="Ex: Informatique" />
                              </Form.Item>
                              <Form.Item {...rest} name={[name, 'pays']} label="Pays">
                                <Input placeholder="Ex: Tunisie" />
                              </Form.Item>
                            </div>
                            <Form.Item {...rest} name={[name, 'dates']} label="Période">
                              <RangePicker picker="month" format="MM/YYYY" style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item {...rest} name={[name, 'description']} label="Missions principales">
                              <TextArea rows={2} placeholder="Décrivez vos responsabilités…" />
                            </Form.Item>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
                          + Ajouter une expérience
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Panel>

              {/* ── Formation ──────────────────────────── */}
              <Panel
                key="formations"
                header="Formation"
                style={activeKeys.includes('formations') ? activePanelHeaderStyle : panelHeaderStyle}
              >
                <Card bordered={false} style={{ background: '#ffffff', padding: 0 }}>
                  <Form.List name="formations">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...rest }) => (
                          <Card key={key} size="small"
                            style={{ marginBottom: 12, borderRadius: 8, border: `1px solid ${TURQUOISE}20`, background: '#ffffff' }}
                            title={`Formation #${name + 1}`}
                            extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                              <Form.Item {...rest} name={[name, 'etablissement']} label="Établissement" rules={[{ required: true, message: 'Requis' }]}>
                                <Input placeholder="École / Université" />
                              </Form.Item>
                              <Form.Item {...rest} name={[name, 'diplome']} label="Diplôme">
                                <Input placeholder="Ex: Master, Licence…" />
                              </Form.Item>
                            </div>
                            <Form.Item {...rest} name={[name, 'specialite']} label="Spécialité / Filière">
                              <Input placeholder="Ex: Informatique, Gestion…" />
                            </Form.Item>
                            <Form.Item {...rest} name={[name, 'dates']} label="Années d'études">
                              <RangePicker picker="year" format="YYYY" style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item {...rest} name={[name, 'description']} label="Détails (optionnel)">
                              <TextArea rows={2} placeholder="Matières principales, projets…" />
                            </Form.Item>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
                          + Ajouter une formation
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Panel>

              {/* ── Compétences ────────────────────────── */}
              <Panel
                key="skills"
                header="Compétences"
                style={activeKeys.includes('skills') ? activePanelHeaderStyle : panelHeaderStyle}
              >
                <Card bordered={false} style={{ background: '#ffffff', padding: 0 }}>
                  <Form.List name="skills">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...rest }) => (
                          <Card key={key} size="small"
                            style={{ marginBottom: 12, borderRadius: 8, border: `1px solid ${TURQUOISE}20`, background: '#ffffff' }}
                            title={`Compétence #${name + 1}`}
                            extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                              <Form.Item {...rest} name={[name, 'nom']} label="Nom" rules={[{ required: true, message: 'Requis' }]}>
                                <Input placeholder="React, Laravel, Anglais…" />
                              </Form.Item>
                              <Form.Item {...rest} name={[name, 'niveau']} label="Niveau">
                                <Select placeholder="Sélectionner">
                                  <Select.Option value="debutant">⭐ Débutant</Select.Option>
                                  <Select.Option value="intermediaire">⭐⭐ Intermédiaire</Select.Option>
                                  <Select.Option value="avance">⭐⭐⭐ Avancé</Select.Option>
                                  <Select.Option value="expert">⭐⭐⭐⭐ Expert</Select.Option>
                                </Select>
                              </Form.Item>
                              <Form.Item {...rest} name={[name, 'annees']} label="Années d'exp.">
                                <Input type="number" min={0} max={50} placeholder="0" />
                              </Form.Item>
                            </div>
                            <Form.Item {...rest} name={[name, 'lien']} label="Lien (GitHub, Portfolio…)">
                              <Input placeholder="https://…" />
                            </Form.Item>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
                          + Ajouter une compétence
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Panel>

              {/* ── Défis ──────────────────────────────── */}
              <Panel
                key="challenges"
                header="Défis"
                style={activeKeys.includes('challenges') ? activePanelHeaderStyle : panelHeaderStyle}
              >
                <Card bordered={false} style={{ background: '#ffffff', padding: 0 }}>
                  <Form.List name="challenges">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...rest }) => (
                          <Card key={key} size="small"
                            style={{ marginBottom: 12, borderRadius: 8, border: `1px solid ${TURQUOISE}20`, background: '#fffbe6' }}
                            title={`Défi #${name + 1}`}
                            extra={<Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>Supprimer</Button>}
                          >
                            <Form.Item {...rest} name={[name, 'type']} label="Type de défi">
                              <Input placeholder="Ex: Technique, Management…" />
                            </Form.Item>
                            <Form.Item {...rest} name={[name, 'description']} label="Contexte et défi" rules={[{ required: true, message: 'Requis' }]}>
                              <TextArea rows={3} placeholder="Quelle était la situation ?" />
                            </Form.Item>
                            <Form.Item {...rest} name={[name, 'lecon']} label="Résultat et apprentissage">
                              <TextArea rows={2} placeholder="Qu'avez-vous appris ?" />
                            </Form.Item>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 40, borderColor: TURQUOISE, color: TURQUOISE }}>
                          + Ajouter un défi
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Panel>

              {/* ── Informations Spécifiques au Poste ──── */}
              <Panel
                key="complementaire"
                header="Informations Spécifiques au Poste"
                style={activeKeys.includes('complementaire') ? activePanelHeaderStyle : panelHeaderStyle}
              >
                <Card bordered={false} style={{ background: '#ffffff', padding: 0 }}>
                  <Form.Item name="handicap" label="Aménagements spécifiques (optionnel)">
                    <TextArea rows={3} placeholder="Décrivez tout aménagement dont vous pourriez avoir besoin…" />
                  </Form.Item>
                  <Divider />
                  <Form.Item
                    name="why_us"
                    label={<>Pourquoi ce poste chez nous ? <Text type="danger">*</Text></>}
                    rules={[
                      { required: true, message: 'Veuillez expliquer votre motivation' },
                      { min: 20, message: 'Minimum 20 caractères' },
                    ]}
                  >
                    <TextArea rows={4} placeholder="Qu'est-ce qui vous attire dans cette offre ?" showCount maxLength={500} />
                  </Form.Item>
                  <Form.Item
                    name="contract_type"
                    label={<>Type de contrat recherché <Text type="danger">*</Text></>}
                    rules={[{ required: true, message: 'Veuillez sélectionner un type de contrat' }]}
                  >
                    <Select placeholder="Sélectionner" style={{ maxWidth: 320 }}>
                      <Select.Option value="CDI">🔒 CDI</Select.Option>
                      <Select.Option value="CDD">📅 CDD</Select.Option>
                      <Select.Option value="SIVP">🎓 SIVP</Select.Option>
                      <Select.Option value="Freelance">💼 Freelance</Select.Option>
                      <Select.Option value="Alternance">🔄 Alternance</Select.Option>
                    </Select>
                  </Form.Item>
                </Card>
              </Panel>

            </Collapse>

            {/* ── Boutons bas de page ───────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, marginBottom: 40 }}>
              <Button size="large" style={{ minWidth: 140, borderRadius: 6, borderColor: TURQUOISE, color: TURQUOISE }}>
                Enregistrer
              </Button>
              <Button
                type="primary" htmlType="submit" size="large"
                loading={loading}
                icon={loading ? undefined : <SendOutlined />}
                style={{
                  minWidth: 140, borderRadius: 6,
                  backgroundColor: TURQUOISE, borderColor: TURQUOISE,
                  fontWeight: 600,
                }}
              >
                {loading ? 'Envoi…' : 'Postuler'}
              </Button>
            </div>

            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 40, fontSize: 12 }}>
              <WarningOutlined style={{ marginRight: 4 }} />
              En soumettant, vous acceptez que vos données soient traitées conformément à notre politique de confidentialité.
            </Text>

          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default ApplyJobPage;