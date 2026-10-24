import { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'residents', label: 'Residents' },
  { id: 'qr-codes', label: 'QR Codes' },
  { id: 'settings', label: 'Privacy Settings' },
];

function isNavItem(id) {
  return NAV_ITEMS.some((item) => item.id === id);
}

function subscribeToHash(callback) {
  window.addEventListener('hashchange', callback);

  return () => {
    window.removeEventListener('hashchange', callback);
  };
}

function getHashItem() {
  const id = window.location.hash
    .replace(/^#\/?/, '')
    .split('?')[0]
    .toLowerCase();

  return isNavItem(id) ? id : null;
}

function NavIcon({ name }) {
  return (
    <span
      className={`sidebar-icon sidebar-icon--${name}`}
      aria-hidden="true"
    />
  );
}

function Sidebar({
  activeItem = 'overview',
  onNavigate,
  onClose,
}) {
  const hashItem = useSyncExternalStore(
    subscribeToHash,
    getHashItem,
    () => null,
  );

  const currentItem = hashItem ?? activeItem;

  const handleNavigation = () => {
    onNavigate?.();
  };

  return (
    <aside className="sidebar" aria-label="Application">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">
          P
        </span>

        <div>
          <p className="sidebar-brand-name">ParkSaathi</p>
          <p className="sidebar-brand-subtitle">SOCIETY PARKING</p>
        </div>

        {/* Close button visible on mobile */}
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={21} />
        </button>
      </div>

      <nav aria-label="Primary">
        <ul className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === currentItem;

            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={
                    isActive
                      ? 'sidebar-link is-active'
                      : 'sidebar-link'
                  }
                  aria-current={isActive ? 'page' : undefined}
                  onClick={handleNavigation}
                >
                  <NavIcon name={item.id} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;