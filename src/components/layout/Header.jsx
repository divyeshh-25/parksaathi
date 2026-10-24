import './Header.css';

function Header({ pageTitle = 'Overview' }) {
  return (
    <header className="app-header">
      <div className="app-header__page-info">
        <nav className="app-header__breadcrumb" aria-label="Breadcrumb">
          <span>Home</span>
          <span aria-hidden="true">/</span>
          <span>{pageTitle}</span>
        </nav>

        <h1 className="app-header__title">{pageTitle}</h1>
      </div>

      <div className="app-header__actions">
        <span className="app-header__demo-badge">Demo Version</span>

        <button
          type="button"
          className="app-header__notification"
          aria-label="Notifications (demo only)"
          title="Notifications are not available in the demo"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </button>

        <div className="app-header__profile">
          <div className="app-header__avatar" aria-hidden="true">
            A
          </div>

          <div className="app-header__profile-info">
            <span className="app-header__profile-name">Administrator</span>
            <span className="app-header__profile-role">Demo Account</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;