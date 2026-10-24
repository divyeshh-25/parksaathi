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

import Vehicles from './pages/Vehicles.jsx';
import ScanDemo from './pages/ScanDemo.jsx';
import QRCodes from './pages/QRCodes.jsx';
import Residents from './pages/Residents.jsx';
import PrivacySettings from './pages/PrivacySettings.jsx';

import './App.css';
import './pages/Vehicles.css';

const pageTitles = {
  overview: 'Overview',
  vehicles: 'Vehicles',
  residents: 'Residents',
  'qr-codes': 'QR Codes',
  'scan-demo': 'QR Scan Demo',
  settings: 'Privacy Settings',
};

const demoVehicles = [
  {
    number: 'GJ01AB1234',
    owner: 'Rahul Patel',
    flat: 'A-101',
    qrStatus: 'Generated',
  },
  {
    number: 'GJ01CD5678',
    owner: 'Amit Shah',
    flat: 'B-204',
    qrStatus: 'Generated',
  },
  {
    number: 'GJ01EF9012',
    owner: 'Priya Patel',
    flat: 'C-302',
    qrStatus: 'Pending',
  },
  {
    number: 'GJ01GH3456',
    owner: 'Neha Desai',
    flat: 'A-305',
    qrStatus: 'Generated',
  },
];

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

function App() {
  const getActiveItem = () => {
    const hash = window.location.hash
      .replace(/^#\/?/, '')
      .split('?')[0]
      .toLowerCase();

    return pageTitles[hash] ? hash : 'overview';
  };

  const [activeItem, setActiveItem] = useState(getActiveItem);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Update the active page when the URL hash changes.
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

  // Prevent background scrolling when the mobile sidebar is open.
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

  // Close the mobile sidebar with Escape.
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

  const stats = [
    {
      title: 'Registered Vehicles',
      value: '128',
      description: 'Vehicles in demo data',
      icon: CarFront,
      variant: 'blue',
    },
    {
      title: 'Registered Residents',
      value: '96',
      description: 'Residents in demo data',
      icon: Users,
      variant: 'green',
    },
    {
      title: 'QR Codes Generated',
      value: '115',
      description: 'Vehicle QR stickers created',
      icon: QrCode,
      variant: 'orange',
    },
    {
      title: 'Privacy Protection',
      value: 'Enabled',
      description: 'Member verification is active',
      icon: ShieldCheck,
      variant: 'green',
    },
  ];

  const renderOverview = () => (
    <div className="dashboard">
      <section className="dashboard__welcome">
        <div>
          <span className="dashboard__eyebrow">
            SOCIETY OVERVIEW
          </span>

          <h1>Welcome to ParkSaathi 👋</h1>

          <p>
            Manage society vehicles, QR codes, and owner privacy in one place.
          </p>
        </div>

        <span className="dashboard__demo-badge">
          Demo data · Not live
        </span>
      </section>

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
            <p>Recently registered vehicles in your society.</p>
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
              {demoVehicles.map((vehicle) => (
                <tr key={vehicle.number}>
                  <td>
                    <strong>{vehicle.number}</strong>
                  </td>

                  <td>{vehicle.owner}</td>

                  <td>{vehicle.flat}</td>

                  <td>
                    <span
                      className={`dashboard__status ${
                        vehicle.qrStatus === 'Generated'
                          ? 'dashboard__status--success'
                          : 'dashboard__status--pending'
                      }`}
                    >
                      {vehicle.qrStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard__section dashboard__quick-actions">
        <div className="dashboard__section-header">
          <div>
            <h2>Quick Actions</h2>
            <p>Access the main ParkSaathi features.</p>
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

  // Keep the QR scan page separate from the admin dashboard.
  if (activeItem === 'scan-demo') {
    return (
      <>
        <div className="scan-standalone">
          <ScanDemo />
        </div>

        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            duration: 3000,
            success: {
              style: {
                background: '#ecfdf3',
                color: '#067647',
              },
            },
            error: {
              style: {
                background: '#fef3f2',
                color: '#b42318',
              },
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="app">
      {/* Mobile sidebar overlay */}
      <button
        type="button"
        className={`mobile-sidebar-overlay ${
          sidebarOpen ? 'mobile-sidebar-overlay--visible' : ''
        }`}
        aria-label="Close navigation menu"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar drawer */}
      <div
        className={`app-sidebar-wrapper ${
          sidebarOpen ? 'app-sidebar-wrapper--open' : ''
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
            {sidebarOpen ? <X size={23} /> : <Menu size={23} />}
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

        <Header pageTitle={pageTitle} />

        {renderPage()}
      </main>

      {/* Global toast notifications */}
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