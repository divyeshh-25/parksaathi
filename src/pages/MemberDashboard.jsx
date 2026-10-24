import { useEffect, useState } from 'react';

import {
  CarFront,
  UserRound,
  Building2,
  Phone,
  QrCode,
  LogOut,
  ShieldCheck,
  LoaderCircle,
  Download,
} from 'lucide-react';

import QRCode from 'qrcode';
import toast from 'react-hot-toast';

import { authFetch } from '../auth/auth.js';
import './MemberDashboard.css';

function MemberDashboard({ session, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [qrImages, setQrImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Load vehicles belonging to the authenticated member.
   * Generate QR codes only when the vehicle has an active QR token.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadVehicles() {
      try {
        setLoading(true);
        setError('');

        if (!session?.userId && !session?.residentId) {
          throw new Error(
            'Your session is missing the resident ID. Please log in again.',
          );
        }

        const response = await authFetch('/api/vehicles/mine', {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Unable to load your vehicles.',
          );
        }

        const residentVehicles = Array.isArray(result.data)
          ? result.data
          : [];

        if (controller.signal.aborted) {
          return;
        }

        setVehicles(residentVehicles);

        const generatedImages = {};

        for (const vehicle of residentVehicles) {
          if (controller.signal.aborted) {
            return;
          }

          const vehicleId = vehicle.id ?? vehicle.public_id;

          const qrToken = vehicle.qr_token ?? vehicle.qrToken ?? null;

          const qrStatus = String(
            vehicle.qr_status ?? vehicle.qrStatus ?? 'inactive',
          ).toLowerCase();

          /*
           * Security:
           * Only generate QR codes using a permanent QR token.
           * Never fall back to a database vehicle ID.
           */
          if (
            vehicleId == null ||
            !qrToken ||
            qrStatus !== 'active'
          ) {
            continue;
          }

          const qrUrl =
            `${window.location.origin}/#scan-demo?token=` +
            encodeURIComponent(qrToken);

          try {
            generatedImages[String(vehicleId)] =
              await QRCode.toDataURL(qrUrl, {
                width: 400,
                margin: 2,
                errorCorrectionLevel: 'M',
              });
          } catch (qrError) {
            console.error(
              `QR generation failed for vehicle ${vehicleId}:`,
              qrError,
            );
          }
        }

        if (!controller.signal.aborted) {
          setQrImages(generatedImages);
        }
      } catch (err) {
        if (
          !controller.signal.aborted &&
          err.name !== 'AbortError'
        ) {
          console.error('Failed to load member vehicles:', err);

          setError(
            err.message || 'Unable to load your vehicles.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadVehicles();

    return () => controller.abort();
  }, [
    session?.userId,
    session?.residentId,
    session?.token,
  ]);

  /*
   * Download a branded QR sticker as a PNG image.
   */
  const downloadQr = async (vehicle) => {
    const vehicleId = String(
      vehicle.id ?? vehicle.public_id ?? '',
    );

    const qrImage = qrImages[vehicleId];

    const qrToken = vehicle.qr_token ?? vehicle.qrToken ?? null;

    const qrStatus = String(
      vehicle.qr_status ?? vehicle.qrStatus ?? 'inactive',
    ).toLowerCase();

    if (!qrToken || qrStatus !== 'active') {
      toast.error('This vehicle does not have an active QR code.');
      return;
    }

    if (!qrImage) {
      toast.error(
        'QR code is not ready yet. Please refresh and try again.',
      );
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to create the QR sticker.');
      }

      canvas.width = 900;
      canvas.height = 1100;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blue border
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, 860, 1060);

      // Brand
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 58px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PARKSAATHI', 450, 115);

      ctx.fillStyle = '#667085';
      ctx.font = '28px Arial';
      ctx.fillText(
        'SOCIETY VEHICLE IDENTIFICATION',
        450,
        165,
      );

      const image = new Image();

      image.onload = () => {
        try {
          // QR code
          ctx.drawImage(image, 250, 220, 400, 400);

          // Vehicle registration number
          const registrationNumber = String(
            vehicle.registration_number ??
              vehicle.number ??
              'Vehicle',
          );

          ctx.fillStyle = '#101828';
          ctx.font = 'bold 46px Arial';
          ctx.textAlign = 'center';

          ctx.fillText(registrationNumber, 450, 700);

          // Flat number
          const flatNumber = String(
            vehicle.flat_number ??
              vehicle.flat ??
              session?.flat ??
              'N/A',
          );

          ctx.fillStyle = '#475467';
          ctx.font = '32px Arial';
          ctx.fillText(`Flat: ${flatNumber}`, 450, 755);

          // Scan instructions
          ctx.fillStyle = '#2563eb';
          ctx.font = 'bold 28px Arial';
          ctx.fillText('SCAN QR CODE', 450, 850);

          ctx.fillStyle = '#667085';
          ctx.font = '25px Arial';

          ctx.fillText(
            'Verify society membership',
            450,
            900,
          );

          ctx.fillText(
            'to access permitted contact details',
            450,
            940,
          );

          // Create downloadable PNG
          canvas.toBlob((blob) => {
            if (!blob) {
              toast.error('Unable to download the QR sticker.');
              return;
            }

            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const safeRegistrationNumber =
              registrationNumber.replace(
                /[^a-zA-Z0-9_-]/g,
                '_',
              );

            link.href = objectUrl;
            link.download =
              `ParkSaathi-Sticker-${safeRegistrationNumber}.png`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => {
              URL.revokeObjectURL(objectUrl);
            }, 1000);

            toast.success(
              'QR sticker downloaded successfully.',
            );
          }, 'image/png');
        } catch (err) {
          console.error('QR sticker creation failed:', err);

          toast.error('Unable to create the QR sticker.');
        }
      };

      image.onerror = () => {
        toast.error(
          'Could not load the QR image. Please try again.',
        );
      };

      image.src = qrImage;
    } catch (err) {
      console.error('QR download failed:', err);

      toast.error(
        err.message || 'Unable to download the QR sticker.',
      );
    }
  };

  const getVehicleId = (vehicle) =>
    String(vehicle.id ?? vehicle.public_id ?? '');

  const getRegistrationNumber = (vehicle) =>
    vehicle.registration_number ??
    vehicle.number ??
    'Registration unavailable';

  const getQrStatus = (vehicle) =>
    String(
      vehicle.qr_status ?? vehicle.qrStatus ?? 'inactive',
    ).toLowerCase();

  return (
    <main className="ps-member">
      {/* Header */}
      <header className="ps-member__header">
        <a className="ps-member__brand" href="#member">
          <span className="ps-member__brand-icon">
            <CarFront size={24} />
          </span>

          <span>
            <strong>ParkSaathi</strong>
            <small>MEMBER PORTAL</small>
          </span>
        </a>

        <button
          className="ps-member__logout"
          type="button"
          onClick={onLogout}
        >
          <LogOut size={17} />
          Logout
        </button>
      </header>

      <div className="ps-member__container">
        {/* Welcome */}
        <section className="ps-member__welcome">
          <span className="ps-member__eyebrow">
            <ShieldCheck size={16} />
            YOUR PERSONAL SPACE
          </span>

          <h1>Welcome, {session?.name || 'Member'}</h1>

          <p>
            Manage your profile and access QR codes for your
            registered vehicles.
          </p>
        </section>

        {/* Profile */}
        <section className="ps-member__profile">
          <div className="ps-member__avatar">
            <UserRound size={28} />
          </div>

          <div className="ps-member__profile-main">
            <span className="ps-member__label">
              YOUR PROFILE
            </span>

            <h2>{session?.name || 'Member'}</h2>

            <div className="ps-member__profile-details">
              <span>
                <Building2 size={16} />
                {session?.flat || 'Flat not available'}
              </span>

              <span>
                <Phone size={16} />
                {session?.mobile || 'Mobile not available'}
              </span>
            </div>
          </div>

          <span className="ps-member__badge">
            <ShieldCheck size={15} />
            Member
          </span>
        </section>

        {/* Vehicles */}
        <section className="ps-member__vehicles">
          <div className="ps-member__section-heading">
            <div>
              <h2>My Vehicles</h2>
              <p>
                Your registered vehicles and their QR codes.
              </p>
            </div>

            <span className="ps-member__count">
              {vehicles.length}{' '}
              {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
            </span>
          </div>

          {loading ? (
            <div
              className="ps-member__state"
              role="status"
            >
              <LoaderCircle
                className="ps-member__spinner"
                size={28}
              />

              <h3>Loading your vehicles</h3>

              <p>
                Please wait while we load your registered
                vehicles.
              </p>
            </div>
          ) : error ? (
            <div
              className="ps-member__state ps-member__state--error"
              role="alert"
            >
              <ShieldCheck size={28} />

              <h3>Unable to load vehicles</h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="ps-member__state">
              <CarFront size={34} />

              <h3>No vehicles found</h3>

              <p>
                No vehicles are currently linked to your resident
                profile. Please contact your society administrator.
              </p>
            </div>
          ) : (
            <div className="ps-member__grid">
              {vehicles.map((vehicle) => {
                const id = getVehicleId(vehicle);
                const number = getRegistrationNumber(vehicle);
                const qrStatus = getQrStatus(vehicle);
                const isActive = qrStatus === 'active';
                const hasQR = Boolean(qrImages[id]);

                return (
                  <article
                    className="ps-member__vehicle"
                    key={id}
                  >
                    <div className="ps-member__vehicle-heading">
                      <span className="ps-member__vehicle-icon">
                        <CarFront size={24} />
                      </span>

                      <span
                        className={
                          isActive
                            ? 'ps-member__status'
                            : 'ps-member__status ps-member__status--inactive'
                        }
                      >
                        {qrStatus}
                      </span>
                    </div>

                    <h3>{number}</h3>

                    <p>
                      {vehicle.vehicle_type ||
                        vehicle.type ||
                        'Vehicle'}

                      {vehicle.model
                        ? ` · ${vehicle.model}`
                        : ''}
                    </p>

                    <div className="ps-member__qr">
                      {hasQR ? (
                        <img
                          src={qrImages[id]}
                          alt={`QR code for ${number}`}
                        />
                      ) : (
                        <div className="ps-member__qr-placeholder">
                          <QrCode size={52} />

                          <span>
                            {!isActive
                              ? 'QR code inactive'
                              : 'QR token unavailable'}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      className="ps-member__download"
                      type="button"
                      disabled={!hasQR || !isActive}
                      onClick={() => downloadQr(vehicle)}
                    >
                      <Download size={17} />
                      Download QR Sticker
                    </button>

                    <div className="ps-member__vehicle-note">
                      <ShieldCheck size={14} />
                      Keep your vehicle QR sticker accessible.
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="ps-member__footer">
          <ShieldCheck size={16} />

          <span>
            ParkSaathi · Your privacy matters.
          </span>
        </footer>
      </div>
    </main>
  );
}

export default MemberDashboard;