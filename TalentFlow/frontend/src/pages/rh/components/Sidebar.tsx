import React, { useState } from 'react';
import { Layout, Menu, Avatar, Tooltip, Input } from 'antd';
import {
    HomeOutlined, MailOutlined, GlobalOutlined, UserOutlined,
    FileSearchOutlined, BarChartOutlined, SearchOutlined,
    SettingOutlined, CalendarOutlined, StarOutlined,
    ThunderboltOutlined, CheckCircleOutlined, BellOutlined,
    HistoryOutlined, NotificationOutlined, TeamOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import logoComunik from '../../../assets/comunik.jpg';
import { PRIMARY } from '../../../theme/colors'; // ✅ couleur centralisée

const { Sider } = Layout;

// ✅ Type déclaré EN DEHORS du composant (bonne pratique)
type MenuItem = Required<MenuProps>['items'][number];

// ✅ Données du Rail extraites du JSX pour plus de lisibilité
// On les crée dans le composant car elles dépendent de navigate et location
const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ État local pour la barre de recherche (maintenant fonctionnelle)
    const [searchValue, setSearchValue] = useState('');

    // Détection de la section active
    const isCandidateSection = location.pathname.includes('/rh/candidats');
    const isJobSection = location.pathname.includes('/rh/jobs');

    // Styles des icônes du Rail
    const iconBaseStyle: React.CSSProperties = {
        fontSize: 20,
        color: '#64748b',
        transition: 'all 0.3s',
        cursor: 'pointer',
        display: 'flex', // ✅ meilleur centrage
    };
    const activeIconStyle: React.CSSProperties = {
        ...iconBaseStyle,
        color: PRIMARY,
    };

    // ✅ Configuration du Rail sous forme de tableau (évite la répétition)
    const railItems = [
        {
            icon: <HomeOutlined />,
            path: '/rh/dashboard',
            tooltip: 'Accueil',
            isActive: location.pathname === '/rh/dashboard',
        },
        {
            icon: <UserOutlined />,
            path: '/rh/candidats',
            tooltip: 'Candidats',
            isActive: isCandidateSection,
        },
        {
            icon: <FileSearchOutlined />,
            path: '/rh/jobs',
            tooltip: "Offres d'emplois",
            isActive: isJobSection,
        },
        {
            icon: <MailOutlined />,
            path: '/rh/messagerie',
            tooltip: 'Messagerie',
            isActive: location.pathname === '/rh/messagerie',
        },
        {
            icon: <BarChartOutlined />,
            path: '/rh/statistiques',
            tooltip: 'Statistiques',
            isActive: location.pathname === '/rh/statistiques',
        },
    ];

    // ──────────────────────────────────────────
    // Définition des menus (sans onClick répété)
    // ──────────────────────────────────────────

    const dashboardItems: MenuItem[] = [
        { key: '/rh/dashboard',   icon: <GlobalOutlined />,      label: 'Tableau de bord' },
        { key: '/rh/agenda',      icon: <CalendarOutlined />,     label: 'Agenda' },
        { key: '/rh/evenements',  icon: <NotificationOutlined />, label: 'Événement' },
        { key: '/rh/evaluations', icon: <StarOutlined />,         label: 'Évaluations' },
        { key: '/rh/tasks',       icon: <CheckCircleOutlined />,  label: 'Mes tâches' },
        { key: '/rh/history',     icon: <HistoryOutlined />,      label: 'Historique' },
    ];

    const candidateItems: MenuItem[] = [
        {
            key: 'grp-pipeline',
            label: 'PIPELINE',
            type: 'group',
            children: [
                { key: '/rh/candidats',            icon: <TeamOutlined />, label: 'Tous les candidats' },
                { key: '/rh/candidats/nouveaux',   label: 'Nouveaux' },
                { key: '/rh/candidats/entretiens', label: 'Entretiens' },
                { key: '/rh/candidats/retenus',    label: 'Retenus' },
            ],
        },
    ];

    const jobItems: MenuItem[] = [
        {
            key: 'grp-jobs',
            label: 'RECRUTEMENT',
            type: 'group',
            children: [
                { key: '/rh/jobs',          icon: <AppstoreOutlined />, label: 'Toutes les offres' },
                { key: '/rh/jobs/publiees', label: 'Annonces actives' },
                { key: '/rh/jobs/archives', label: 'Archives' },
            ],
        },
    ];

    const getMenuItems = (): MenuItem[] => {
        if (isCandidateSection) return candidateItems;
        if (isJobSection) return jobItems;
        return dashboardItems;
    };

    // Placeholder dynamique selon la section
    const searchPlaceholder = isCandidateSection
        ? 'Filtrer un candidat...'
        : isJobSection
        ? 'Chercher un poste...'
        : 'Rechercher...';

    return (
        <div style={{ display: 'flex', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>

            {/* ── RAIL GAUCHE ── */}
            <div style={{
                width: 68,
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 0',
                gap: 28,
                borderRight: '1px solid #e2e8f0',
            }}>
                {/* Logo */}
                <div style={{ marginBottom: 10 }}>
                    <Avatar
                        shape="square"
                        size={42}
                        src={logoComunik}
                        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    >C</Avatar>
                </div>

                {/* ✅ Icônes générées depuis le tableau railItems */}
                {railItems.map((item) => (
                    <Tooltip key={item.path} title={item.tooltip} placement="right">
                        <span
                            style={item.isActive ? activeIconStyle : iconBaseStyle}
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon}
                        </span>
                    </Tooltip>
                ))}

                {/* Icônes bas de page (sans navigation pour l'instant) */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 10 }}>
                    <Tooltip title="Notifications" placement="right">
                        <BellOutlined style={iconBaseStyle} />
                    </Tooltip>
                    <Tooltip title="Paramètres" placement="right">
                        <SettingOutlined style={iconBaseStyle} />
                    </Tooltip>
                </div>
            </div>

            {/* ── MENU CONTEXTUEL LARGE ── */}
            <Sider width={240} theme="light" style={{ borderRight: '1px solid #e2e8f0', background: '#fff' }}>

                {/* Titre dynamique */}
                <div style={{
                    padding: '24px 24px 16px 24px',
                    fontWeight: 800,
                    fontSize: 18,
                    color: PRIMARY,
                    letterSpacing: '-0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    {isCandidateSection ? <><UserOutlined /> Candidats</>
                        : isJobSection   ? <><FileSearchOutlined /> Emplois</>
                        :                  <><ThunderboltOutlined /> TalentFlow</>}
                </div>

                {/* ✅ Barre de recherche fonctionnelle */}
                <div style={{ padding: '0 16px 16px 16px' }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        allowClear
                        style={{
                            borderRadius: 8,
                            background: '#f1f5f9',
                            border: 'none',
                            fontSize: 13,
                            color: '#64748b',
                        }}
                    />
                </div>

                {/* ✅ Navigation centralisée via onSelect */}
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onSelect={({ key }) => navigate(key)}
                    style={{ borderRight: 0, padding: '0 8px' }}
                    className="custom-sidebar-menu"
                    items={getMenuItems()}
                />
            </Sider>

            {/* ✅ Styles CSS isolés dans un bloc unique */}
            <style>{`
                .custom-sidebar-menu.ant-menu-inline { border-inline-end: none !important; }
                .custom-sidebar-menu .ant-menu-item { border-radius: 8px !important; margin-bottom: 4px !important; }
                .custom-sidebar-menu .ant-menu-item-selected {
                    background-color: ${PRIMARY}15 !important;
                    color: ${PRIMARY} !important;
                    font-weight: 600;
                }
                .custom-sidebar-menu .ant-menu-item-selected .anticon { color: ${PRIMARY} !important; }
                .custom-sidebar-menu .ant-menu-item-group-title {
                    font-size: 11px; font-weight: 700; color: #94a3b8;
                    margin-top: 12px; text-transform: uppercase;
                }
            `}</style>
        </div>
    );
};

export default Sidebar;