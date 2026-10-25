import { useState } from 'react';
import {
  CarFront,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  LockKeyhole,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { saveSession } from '../auth/auth.js';
import './Login.css';

function Login({ onLogin }) {
  const [role, setRole] = useState('member');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const loginIdentifier =
        role === 'member'
          ? identifier.replace(/\D/g, '')
          : identifier.trim().toLowerCase();

      // Validate member mobile number.
      if (
        role === 'member' &&
        !/^[6-9]\d{9}$/.test(loginIdentifier)
      ) {
        throw new Error('Enter a valid 10-digit mobile number.');
      }

      // Authenticate through the backend.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          role,
          identifier: loginIdentifier,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to log in.'
        );
      }

      if (!result.token || !result.user) {
        throw new Error(
          'Invalid response received from the server.'
        );
      }

      const user = result.user;

      // Normalize the role returned by the backend.
      const authenticatedRole = String(
        user.role || role
      ).toLowerCase();

      // The backend must return the actual database ID.
      if (user.id == null) {
        throw new Error(
          'User ID is missing from the login response. Please check the backend login API.'
        );
      }

      const userId = String(user.id);

      // Build a consistent frontend session.
      const session = {
        token: result.token,

        role: authenticatedRole,

        userId,

        // For member accounts, the resident ID is the
        // authenticated resident's database ID.
        residentId:
          authenticatedRole === 'member'
            ? userId
            : null,

        name: user.name || '',

        email: user.email || null,

        mobile: user.mobile || (
          authenticatedRole === 'member'
            ? loginIdentifier
            : null
        ),

        flat:
          user.flat_number ||
          user.flat ||
          null,

        mustChangePassword: Boolean(
          result.mustChangePassword
        ),
      };

      // Save session and notify the application.
      saveSession(session);

      toast.success('Login successful!');

      onLogin(session);
    } catch (error) {
      console.error('Login error:', error);

      toast.error(
        error.message || 'Unable to log in.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setIdentifier('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <main className="ps-login">
      <section className="ps-login__visual">
        <div className="ps-login__brand">
          <span className="ps-login__brand-icon">
            <CarFront size={27} />
          </span>

          <span>
            <strong>ParkOwnerQR</strong>
            <a
              href="/#home"
              rel="noopener noreferrer"
              className="ps-login__landing-link"
            >
              SCAN. CONNECT. PARK SMARTER. ↗
            </a>
          </span>
        </div>

        <div className="ps-login__visual-content">
          <span className="ps-login__eyebrow">
            <ShieldCheck size={17} />
            SAFER SOCIETY. SMARTER PARKING.
          </span>

          <h1>
            Your society's
            <br />
            vehicles, managed
            <br />
            <span>smarter.</span>
          </h1>

          <p>
            Identify registered vehicles, manage QR codes,
            and help residents connect while respecting
            their privacy.
          </p>
        </div>

        <div className="ps-login__visual-footer">
          <ShieldCheck size={17} />
          Designed with resident privacy in mind.
        </div>
      </section>

      <section className="ps-login__panel">
        <div className="ps-login__form-wrap">
          <span className="ps-login__mobile-icon">
            <CarFront size={27} />
          </span>

          <span className="ps-login__form-eyebrow">
            WELCOME TO PARKOWNERQR
          </span>

          <h2>Sign in to your account</h2>

          <p className="ps-login__subtitle">
            Select your account type to continue.
          </p>

          <div className="ps-login__roles">
            <button
              type="button"
              className={
                role === 'member'
                  ? 'ps-login__role ps-login__role--active'
                  : 'ps-login__role'
              }
              onClick={() => handleRoleChange('member')}
              disabled={loading}
            >
              <span>👤</span>
              <strong>Member</strong>
              <small>My profile &amp; vehicles</small>
            </button>

            <button
              type="button"
              className={
                role === 'admin'
                  ? 'ps-login__role ps-login__role--active'
                  : 'ps-login__role'
              }
              onClick={() => handleRoleChange('admin')}
              disabled={loading}
            >
              <span>🛡️</span>
              <strong>Admin</strong>
              <small>Society management</small>
            </button>
          </div>

          <form
            className="ps-login__form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="ps-login-identifier">
              {role === 'admin'
                ? 'Email address'
                : 'Registered mobile number'}
            </label>

            <input
              id="ps-login-identifier"
              type={role === 'admin' ? 'email' : 'tel'}
              inputMode={
                role === 'member' ? 'numeric' : undefined
              }
              autoComplete="username"
              placeholder={
                role === 'admin'
                  ? 'Enter your admin email'
                  : 'Enter your registered mobile'
              }
              value={identifier}
              onChange={(event) => {
                setIdentifier(
                  role === 'member'
                    ? event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10)
                    : event.target.value
                );
              }}
              required
              disabled={loading}
            />

            <label htmlFor="ps-login-password">
              Password
            </label>

            <div className="ps-login__password">
              <input
                id="ps-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            <button
              className="ps-login__submit"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="ps-login__security">
            <LockKeyhole size={16} />

            <span>
              Secure sign-in with account-based authentication.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;