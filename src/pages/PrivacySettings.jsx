import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  QrCode,
  RotateCcw,
  Save,
  LockKeyhole,
} from 'lucide-react';
import { authFetch } from '../auth/auth.js';

import './PrivacySettings.css';

const defaultSettings = {
  privacyMode: true,
  showVehicleNumber: true,
  showOwnerName: false,
  showFlatNumber: false,
  showOwnerMobile: false,
  allowContactRequests: true,
  allowUrgentNotifications: true,
  allowQrScanning: true,
};

function apiToState(data = {}) {
  return {
    privacyMode: data.privacy_mode ?? defaultSettings.privacyMode,
    showVehicleNumber:
      data.show_vehicle_number ?? defaultSettings.showVehicleNumber,
    showOwnerName:
      data.show_owner_name ?? defaultSettings.showOwnerName,
    showFlatNumber:
      data.show_flat_number ?? defaultSettings.showFlatNumber,
    showOwnerMobile:
      data.show_owner_mobile ?? defaultSettings.showOwnerMobile,
    allowContactRequests:
      data.allow_contact_requests ?? defaultSettings.allowContactRequests,
    allowUrgentNotifications:
      data.allow_urgent_notifications ??
      defaultSettings.allowUrgentNotifications,
    allowQrScanning:
      data.allow_qr_scanning ?? defaultSettings.allowQrScanning,
  };
}

function stateToApi(settings) {
  return {
    privacy_mode: settings.privacyMode,
    show_vehicle_number: settings.showVehicleNumber,
    show_owner_name: settings.showOwnerName,
    show_flat_number: settings.showFlatNumber,
    show_owner_mobile: settings.showOwnerMobile,
    allow_contact_requests: settings.allowContactRequests,
    allow_urgent_notifications: settings.allowUrgentNotifications,
    allow_qr_scanning: settings.allowQrScanning,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(
      'API returned an invalid response. Check the backend server and Vite proxy.',
    );
  }

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Request failed');
  }

  return result;
}

function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      className={`privacy-toggle ${checked ? 'privacy-toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div
      className={`privacy-row ${
        disabled ? 'privacy-row--disabled' : ''
      }`}
    >
      <div className="privacy-row__icon">
        <Icon size={20} />
      </div>

      <div className="privacy-row__content">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <Toggle
        label={title}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function PrivacySettings() {
  const [settings, setSettings] = useState({ ...defaultSettings });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load global settings from the API.
  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const response = await authFetch('/api/privacy-settings', {
          method: 'GET',
          signal: controller.signal,
        });

        const result = await parseResponse(response);

        setSettings(apiToState(result.data));
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error(
            error.message || 'Unable to load privacy settings.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => controller.abort();
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // Save global settings to the database.
  const saveSettings = async () => {
    setSaving(true);

    try {
      const response = await authFetch('/api/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stateToApi(settings)),
      });

      const result = await parseResponse(response);

      setSettings(apiToState(result.data));

      toast.success('Privacy settings saved successfully!');
    } catch (error) {
      toast.error(
        error.message || 'Unable to save settings. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Restore defaults locally; the user must click Save Settings to apply.
  const resetSettings = () => {
    setSettings({ ...defaultSettings });

    toast('Default settings restored. Click Save Settings to apply them.', {
      icon: '↺',
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="dashboard privacy-page">
        <section className="dashboard__welcome">
          <div>
            <span className="dashboard__eyebrow">
              SECURITY &amp; CONTROL
            </span>
            <h1>Privacy Settings</h1>
            <p>Loading global privacy settings...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard privacy-page">
      <section className="dashboard__welcome">
        <div>
          <span className="dashboard__eyebrow">
            SECURITY &amp; CONTROL
          </span>

          <h1>Privacy Settings</h1>

          <p>
            Control how vehicle and resident information is shared
            through ParkOwnerQR.
          </p>
        </div>

        <span className="privacy-page__badge">
          <ShieldCheck size={17} />
          Privacy controls
        </span>
      </section>

      {/* Global Privacy Mode */}
      <section className="dashboard__section privacy-card">
        <div className="privacy-card__heading">
          <div className="privacy-card__heading-icon">
            <LockKeyhole size={22} />
          </div>

          <div>
            <h2>Privacy Mode</h2>
            <p>
              Require membership verification before showing
              protected information.
            </p>
          </div>

          <Toggle
            label="Privacy Mode"
            checked={settings.privacyMode}
            onChange={(value) => updateSetting('privacyMode', value)}
            disabled={saving}
          />
        </div>

        <div className="privacy-info">
          <ShieldCheck size={18} />

          <span>
            {settings.privacyMode
              ? 'Privacy mode is enabled. Protected information should only be available to authorized members.'
              : 'Privacy mode is disabled. Review your visibility rules carefully before allowing public access.'}
          </span>
        </div>
      </section>

      {/* Information Visibility */}
      <section className="dashboard__section privacy-card">
        <div className="privacy-card__title">
          <div>
            <h2>Information Visibility</h2>
            <p>
              Choose which details can be displayed after scanning
              a QR code.
            </p>
          </div>

          <Eye size={22} />
        </div>

        <SettingRow
          icon={QrCode}
          title="Vehicle Number"
          description="Display the registered vehicle number."
          checked={settings.showVehicleNumber}
          onChange={(value) =>
            updateSetting('showVehicleNumber', value)
          }
          disabled={saving}
        />

        <SettingRow
          icon={Eye}
          title="Owner Name"
          description="Allow the owner's name to be displayed."
          checked={settings.showOwnerName}
          onChange={(value) => updateSetting('showOwnerName', value)}
          disabled={saving}
        />

        <SettingRow
          icon={EyeOff}
          title="Flat Number"
          description="Allow the owner's flat number to be displayed."
          checked={settings.showFlatNumber}
          onChange={(value) => updateSetting('showFlatNumber', value)}
          disabled={saving}
        />

        <SettingRow
          icon={Phone}
          title="Owner's Mobile Number"
          description="Allow the owner's personal mobile number to be displayed."
          checked={settings.showOwnerMobile}
          onChange={(value) => updateSetting('showOwnerMobile', value)}
          disabled={saving}
        />

        {settings.showOwnerMobile && (
          <div className="privacy-warning mt-2">
            Personal contact information may be exposed. Consider
            using protected contact requests instead.
          </div>
        )}
      </section>

      {/* Contact Preferences */}
      <section className="dashboard__section privacy-card">
        <div className="privacy-card__title">
          <div>
            <h2>Contact Preferences</h2>
            <p>
              Configure available contact options for vehicle-related
              issues.
            </p>
          </div>

          <Phone size={22} />
        </div>

        <SettingRow
          icon={Phone}
          title="Allow Contact Requests"
          description="Let people request contact with the vehicle owner without automatically revealing their number."
          checked={settings.allowContactRequests}
          onChange={(value) =>
            updateSetting('allowContactRequests', value)
          }
          disabled={saving}
        />

        <SettingRow
          icon={ShieldCheck}
          title="Urgent Vehicle Notifications"
          description="Allow urgent vehicle-related notification requests."
          checked={settings.allowUrgentNotifications}
          onChange={(value) =>
            updateSetting('allowUrgentNotifications', value)
          }
          disabled={saving}
        />
      </section>

      {/* QR Code Controls */}
      <section className="dashboard__section privacy-card">
        <div className="privacy-card__title">
          <div>
            <h2>QR Code Controls</h2>
            <p>
              Control whether QR codes can be used in the demo.
            </p>
          </div>

          <QrCode size={22} />
        </div>

        <SettingRow
          icon={QrCode}
          title="Allow QR Scanning"
          description="Enable or disable QR scan workflows."
          checked={settings.allowQrScanning}
          onChange={(value) => updateSetting('allowQrScanning', value)}
          disabled={saving}
        />
      </section>

      {/* Actions */}
      <div className="privacy-page__actions">
        <button
          type="button"
          className="privacy-button privacy-button--secondary"
          onClick={resetSettings}
          disabled={saving}
        >
          <RotateCcw size={17} />
          Reset
        </button>

        <button
          type="button"
          className="privacy-button privacy-button--primary"
          onClick={saveSettings}
          disabled={saving}
        >
          <Save size={17} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <p className="privacy-page__disclaimer">
        Privacy settings are saved centrally and configured as global
        defaults for all residents.
      </p>
    </div>
  );
}