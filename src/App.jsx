import { useEffect, useState } from 'react';

import {
  CarFront,
  Users,
  QrCode,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  ScanLine,
  Menu,
  X,
} from 'lucide-react';

import { Toaster } from 'react-hot-toast';

import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';

import Home from './pages/Home.jsx';
import Vehicles from './pages/Vehicles.jsx';
import ScanDemo from './pages/ScanDemo.jsx';
import QRCodes from './pages/QRCodes.jsx';
import Residents from './pages/Residents.jsx';
import PrivacySettings from './pages/PrivacySettings.jsx';
import Login from './pages/Login.jsx';
import MemberDashboard from './pages/MemberDashboard.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

import {
  getSession,
  clearSession,
  saveSession,
  authFetch,
} from './auth/auth.js';

import './App.css';
import './pages/Vehicles.css';

const pageTitles = {
  home: 'Home',
  overview: 'Overview',
  vehicles: 'Vehicles',
  residents: 'Residents',
  'qr-codes': 'QR Codes',
  'scan-demo': 'QR Scan Demo',
  settings: 'Privacy Settings',
  member: 'My Profile',
};

const quickActions = [
  {
    label: 'Manage Vehicles',
    description: 'View registered vehicles',
    hash: '#vehicles',
    icon: CarFront,
  },
  {
    label: 'Manage Residents',
    description: 'View society residents',
    hash: '#residents',
    icon: Users,
  },
  {
    label: 'Manage QR Codes',
    description: 'View and manage QR stickers',
    hash: '#qr-codes',
    icon: QrCode,
  },
  {
    label: 'Test QR Scan',
    description: 'Try the privacy verification flow',
    hash: '#scan-demo',
    icon: ScanLine,
  },
];

/**
 * Fetch JSON from the API using the saved JWT.
 */
async function fetchJson(url) {
  const response = await authFetch(url);

  const contentType =
    response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(
      `API returned a non-JSON response for ${url}. Check the API configuration.`,
    );
  }

  const result = await response.json();

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.message || `Request failed: ${response.status}`,
    );
  }

  return result;
}
/**
 * Extract arrays from common API response structures.
 */
function extractArray(response, possibleKeys = []) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  for (const key of possibleKeys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }

    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }
  }

  return [];
}

/**
 * Extract privacy settings from common API response structures.
 */
function extractPrivacySettings(response) {
  if (!response) {
    return null;
  }

  if (response?.data && !Array.isArray(response.data)) {
    if (response.data.privacy_settings) {
      return response.data.privacy_settings;
    }

    if (response.data.settings) {
      return response.data.settings;
    }

    return response.data;
  }

  if (response?.settings) {
    return response.settings;
  }

  return response;
}

/**
 * Read the current page from the URL hash.
 * Query parameters are ignored when determining the page.
 */
function getActiveItem() {
  const hash = window.location.hash
    .replace(/^#\/?/, '')
    .split('?')[0]
    .toLowerCase();

  // Handle login route explicitly
  if (hash === 'login') {
    return 'login';
  }

  if (pageTitles[hash]) {
    return hash;
  }

  // Show landing page to visitors without a session
  // Authenticated users retain the existing dashboard
  return getSession() ? 'overview' : 'home';
}
function App() {
  const [session, setSession] = useState(getSession);

  const [activeItem, setActiveItem] = useState(getActiveItem);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    vehicles: [],
    residents: [],
    privacySettings: null,
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  /**
   * Login callback.
   * Login.jsx should pass the authenticated session to onLogin.
   */
  const handleLogin = (newSession) => {
    if (!newSession) {
      return;
    }

    setSession(newSession);

    const role = String(newSession.role || '').toLowerCase();

    window.location.hash =
      role === 'admin' ? '#overview' : '#member';
  };

  const handlePasswordChanged = () => {
    const currentSession = getSession();

    if (!currentSession) {
      setSession(null);
      return;
    }

    const updatedSession = {
      ...currentSession,
      mustChangePassword: false,
    };

    saveSession(updatedSession);
    setSession(updatedSession);

    window.location.hash = '#member';
  };

  /**
   * Logout callback.
   */
  const handleLogout = () => {
    clearSession();
    setSession(null);
    setSidebarOpen(false);
    window.location.hash = '#login';
  };

  /**
   * Update the active page when the URL changes.
   */
  useEffect(() => {
    const handleHashChange = () => {
      setActiveItem(getActiveItem());
      setSidebarOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  /**
   * Load dashboard information from the API.
   */
  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      if (!session || session.role !== 'admin') {
        return;
      }
      setDashboardLoading(true);
      setDashboardError('');

      try {
        const [
          vehiclesResponse,
          residentsResponse,
          privacyResponse,
        ] = await Promise.all([
          fetchJson('/api/vehicles'),
          fetchJson('/api/residents'),
          fetchJson('/api/privacy-settings'),
        ]);

        if (cancelled) {
          return;
        }

        setDashboardData({
          vehicles: extractArray(vehiclesResponse, ['vehicles']),
          residents: extractArray(residentsResponse, ['residents']),
          privacySettings: extractPrivacySettings(privacyResponse),
        });
      } catch (error) {
        console.error('Dashboard loading error:', error);

        if (!cancelled) {
          setDashboardError(
            error.message ||
            'Unable to load dashboard data. Please try again.',
          );
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Prevent background scrolling when the mobile sidebar is open.
   */
  useEffect(() => {
    if (!sidebarOpen || window.innerWidth > 768) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  /**
   * Close the mobile sidebar with Escape.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const pageTitle = pageTitles[activeItem] || 'Overview';

  const {
    vehicles,
    residents,
    privacySettings,
  } = dashboardData;

  const registeredVehicles = vehicles.length;
  const registeredResidents = residents.length;

  const generatedQrCodes = vehicles.filter((vehicle) => {
    const hasToken = Boolean(vehicle.qr_token);

    const isActive =
      String(vehicle.qr_status || '').toLowerCase() === 'active';

    return hasToken && isActive;
  }).length;

  const privacyMode =
    privacySettings?.privacy_mode ??
    privacySettings?.privacyMode ??
    false;

  const allowQrScanning =
    privacySettings?.allow_qr_scanning ??
    privacySettings?.allowQrScanning ??
    false;

  const privacyEnabled =
    Boolean(privacyMode) && Boolean(allowQrScanning);

  const stats = [
    {
      title: 'Registered Vehicles',
      value: dashboardLoading ? '...' : registeredVehicles,
      description: 'Total registered vehicles',
      icon: CarFront,
      variant: 'blue',
    },
    {
      title: 'Registered Residents',
      value: dashboardLoading ? '...' : registeredResidents,
      description: 'Total registered residents',
      icon: Users,
      variant: 'green',
    },
    {
      title: 'QR Codes Generated',
      value: dashboardLoading ? '...' : generatedQrCodes,
      description: 'Active vehicle QR codes',
      icon: QrCode,
      variant: 'orange',
    },
    {
      title: 'Privacy Protection',
      value: dashboardLoading
        ? '...'
        : privacyEnabled
          ? 'Enabled'
          : 'Disabled',
      description: 'Based on current privacy settings',
      icon: ShieldCheck,
      variant: privacyEnabled ? 'green' : 'orange',
    },
  ];

  /**
   * Dashboard overview.
   */
  const renderOverview = () => {
    const recentVehicles = [...vehicles]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);

    return (
      <div className="dashboard">
        <section className="dashboard__welcome">
          <div>
            <span className="dashboard__eyebrow">
              SOCIETY OVERVIEW
            </span>

            <h1>Welcome to ParkSaathi 👋</h1>

            <p>
              Manage society vehicles, QR codes, and owner privacy
              in one place.
            </p>
          </div>

          <span className="dashboard__demo-badge">
            {dashboardLoading
              ? 'Loading live data...'
              : dashboardError
                ? 'Data unavailable'
                : 'Live database'}
          </span>
        </section>

        {dashboardError && (
          <div
            role="alert"
            style={{
              marginBottom: '20px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#fef3f2',
              color: '#b42318',
              border: '1px solid #fecdca',
            }}
          >
            <strong>Dashboard data could not be loaded.</strong>

            <p style={{ margin: '6px 0 0' }}>
              {dashboardError}
            </p>
          </div>
        )}

        <section className="dashboard__stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                className="dashboard__stat-card"
                key={stat.title}
              >
                <div className="dashboard__stat-top">
                  <span>{stat.title}</span>

                  <span
                    className={`dashboard__stat-icon dashboard__stat-icon--${stat.variant}`}
                  >
                    <Icon size={21} />
                  </span>
                </div>

                <h2>{stat.value}</h2>

                <p>{stat.description}</p>
              </article>
            );
          })}
        </section>

        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <div>
              <h2>Recent Vehicle Registrations</h2>

              <p>
                Recently registered vehicles in your society.
              </p>
            </div>

            <a
              href="#vehicles"
              className="dashboard__view-all"
            >
              View all <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="dashboard__table-wrapper">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>VEHICLE NUMBER</th>
                  <th>OWNER</th>
                  <th>FLAT NUMBER</th>
                  <th>QR STATUS</th>
                </tr>
              </thead>

              <tbody>
                {dashboardLoading ? (
                  <tr>
                    <td colSpan={4}>
                      Loading recent registrations...
                    </td>
                  </tr>
                ) : dashboardError ? (
                  <tr>
                    <td colSpan={4}>
                      Unable to load recent registrations.
                    </td>
                  </tr>
                ) : recentVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      No vehicles registered yet.
                    </td>
                  </tr>
                ) : (
                  recentVehicles.map((vehicle) => {
                    const isQrActive =
                      String(vehicle.qr_status || '').toLowerCase() ===
                      'active';

                    return (
                      <tr
                        key={
                          vehicle.id ||
                          vehicle.public_id ||
                          vehicle.registration_number
                        }
                      >
                        <td>
                          <strong>
                            {vehicle.registration_number || 'N/A'}
                          </strong>
                        </td>

                        <td>
                          {vehicle.resident_name || 'N/A'}
                        </td>

                        <td>
                          {vehicle.flat_number || 'N/A'}
                        </td>

                        <td>
                          <span
                            className={`dashboard__status ${isQrActive
                                ? 'dashboard__status--success'
                                : 'dashboard__status--pending'
                              }`}
                          >
                            {isQrActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard__section dashboard__quick-actions">
          <div className="dashboard__section-header">
            <div>
              <h2>Quick Actions</h2>

              <p>
                Access the main ParkSaathi features.
              </p>
            </div>
          </div>

          <div className="dashboard__actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <a
                  className="dashboard__action-card"
                  href={action.hash}
                  key={action.label}
                >
                  <span className="dashboard__action-icon">
                    <Icon size={22} />
                  </span>

                  <span className="dashboard__action-content">
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>

                  <ArrowRight size={18} />
                </a>
              );
            })}
          </div>
        </section>

        <footer className="dashboard__footer">
          ParkSaathi · Society Vehicle QR &amp; Privacy Management
        </footer>
      </div>
    );
  };

  /**
   * Render the selected application page.
   */
  const renderPage = () => {
    switch (activeItem) {
      case 'vehicles':
        return (
          <div className="dashboard">
            <Vehicles />
          </div>
        );

      case 'residents':
        return <Residents />;

      case 'qr-codes':
        return <QRCodes />;

      case 'settings':
        return <PrivacySettings />;

      default:
        return renderOverview();
    }
  };

  /**
   * Keep the QR scan page separate from the dashboard.
   * QR scanning remains accessible without a dashboard login.
   */
  if (activeItem === 'scan-demo') {
    return (
      <>
        <div className="scan-standalone">
          <ScanDemo />
        </div>

        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{ duration: 3000 }}
        />
      </>
    );
  }

  /**
   * Show Login when the user has no session.
   */
  if (!session) {
    if (!session && activeItem === 'home') {
      return <Home />;
    }
    return (
      <>
        <Login onLogin={handleLogin} />

        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{ duration: 3000 }}
        />
      </>
    );
  }

  /**
   * Member portal.
   */
  if (String(session.role || '').toLowerCase() !== 'admin') {
    return (
        <>
            {session.mustChangePassword ? (
                <ChangePassword
                    onPasswordChanged={handlePasswordChanged}
                    onLogout={handleLogout}
                />
            ) : (
              <MemberDashboard
                session={session}
                onLogout={handleLogout}
              />
            )}

            <Toaster
                position="top-right"
                containerStyle={{ zIndex: 99999 }}
                toastOptions={{ duration: 3000 }}
            />
        </>
    );
}

  /**
   * Admin dashboard.
   */
  return (
    <div className="app">
      {/* Mobile sidebar overlay */}
      <button
        type="button"
        className={`mobile-sidebar-overlay ${sidebarOpen ? 'mobile-sidebar-overlay--visible' : ''
          }`}
        aria-label="Close navigation menu"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar drawer */}
      <div
        className={`app-sidebar-wrapper ${sidebarOpen ? 'app-sidebar-wrapper--open' : ''
          }`}
      >
        <Sidebar
          activeItem={activeItem}
          onNavigate={() => setSidebarOpen(false)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="app__main">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label={
              sidebarOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>

          <span className="mobile-topbar__title">
            ParkSaathi
          </span>

          <span
            className="mobile-topbar__avatar"
            aria-hidden="true"
          >
            A
          </span>
        </div>

        <Header
          pageTitle={pageTitle}
          onLogout={handleLogout}
        />

        {renderPage()}
      </main>

      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '14px',
            maxWidth: 'calc(100vw - 32px)',
            boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#ffffff',
            },
            style: {
              background: '#ecfdf3',
              color: '#067647',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#ffffff',
            },
            style: {
              background: '#fef3f2',
              color: '#b42318',
            },
          },
        }}
      />
    </div>
  );
}

export default App;