import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

import {
  QrCode,
  Search,
  Download,
  Printer,
  CarFront,
  ShieldCheck,
} from 'lucide-react';
import { authFetch } from '../auth/auth.js';
import './QRCodes.css';

function QRCodes() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [qrImages, setQrImages] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Fetch registered vehicles from the backend API.
  useEffect(() => {
    const controller = new AbortController();

    async function loadVehicles() {
      try {
        setLoading(true);
        setLoadError('');

        const response = await authFetch('/api/vehicles', {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Unable to load vehicles.',
          );
        }

        const mappedVehicles = (result.data || []).map((vehicle) => ({
          id: String(vehicle.id),
          publicId: vehicle.public_id,
          qrToken: vehicle.qr_token,
          qrStatus: String(vehicle.qr_status || 'inactive').toLowerCase(),
          number: vehicle.registration_number || '',
          type: vehicle.vehicle_type || '',
          model: vehicle.model || '',
          owner: vehicle.resident_name || '',
          flat: vehicle.flat_number || '',
          mobile: vehicle.resident_mobile || '',
        }));

        setVehicles(mappedVehicles);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to load vehicles:', error);

          setLoadError(
            error.message || 'Unable to load vehicles.',
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
  }, []);

  // Generate QR images using the permanent database QR token.
  useEffect(() => {
    let cancelled = false;

    async function generateCodes() {
      const results = {};

      for (const vehicle of vehicles) {
        if (
          !vehicle.qrToken ||
          vehicle.qrStatus !== 'active'
        ) {
          continue;
        }

        const qrUrl =
          `${window.location.origin}/#scan-demo?token=${encodeURIComponent(vehicle.qrToken)}`;

        results[vehicle.id] = await QRCode.toDataURL(qrUrl, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: 'M',
        });
      }

      if (!cancelled) {
        setQrImages(results);
      }
    }

    generateCodes().catch((error) => {
      console.error('QR generation failed:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [vehicles]);

  // Search vehicles by registration number, owner, or flat number.
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const number = String(vehicle.number).toLowerCase();
      const owner = String(vehicle.owner).toLowerCase();
      const flat = String(vehicle.flat).toLowerCase();

      return (
        number.includes(query) ||
        owner.includes(query) ||
        flat.includes(query)
      );
    });
  }, [search, vehicles]);

  // Download a branded QR sticker as a PNG image.
  const downloadQR = (vehicle) => {
    const qrImage = qrImages[vehicle.id];

    if (!qrImage) {
      alert(
        vehicle.qrStatus !== 'active'
          ? 'This vehicle QR code is inactive.'
          : 'QR code is still generating. Please try again.',
      );
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Unable to create the sticker. Please try again.');
      return;
    }

    canvas.width = 900;
    canvas.height = 1100;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 860, 1060);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 58px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PARKOWNERQR', 450, 115);

    ctx.fillStyle = '#667085';
    ctx.font = '28px Arial';
    ctx.fillText('SOCIETY VEHICLE IDENTIFICATION', 450, 165);

    const image = new Image();

    image.onload = () => {
      ctx.drawImage(image, 250, 220, 400, 400);

      ctx.fillStyle = '#101828';
      ctx.font = 'bold 46px Arial';
      ctx.fillText(String(vehicle.number), 450, 700);

      ctx.fillStyle = '#475467';
      ctx.font = '32px Arial';
      ctx.fillText(`Flat: ${vehicle.flat || 'N/A'}`, 450, 755);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 28px Arial';
      ctx.fillText('SCAN QR CODE', 450, 850);

      ctx.fillStyle = '#667085';
      ctx.font = '25px Arial';
      ctx.fillText('Verify society membership', 450, 900);
      ctx.fillText(
        'to access permitted contact details',
        450,
        940,
      );

      const link = document.createElement('a');

      link.download =
        `ParkOwnerQR-Sticker-${vehicle.number}.png`;

      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    image.onerror = () => {
      alert('Could not generate the sticker. Please try again.');
    };

    image.src = qrImage;
  };

  // Print a vehicle QR sticker.
  const printQR = (vehicle) => {
    const image = qrImages[vehicle.id];

    if (!image) {
      alert(
        vehicle.qrStatus !== 'active'
          ? 'This vehicle QR code is inactive.'
          : 'QR code is still generating. Please try again.',
      );
      return;
    }

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Please allow pop-ups to print the QR code.');
      return;
    }

    const safeNumber = String(vehicle.number || '');
    const safeFlat = String(vehicle.flat || 'N/A');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>ParkOwnerQR QR - ${safeNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 24px;
              color: #101828;
            }

            .sticker {
              display: inline-block;
              width: 320px;
              max-width: 100%;
              padding: 24px;
              border: 2px solid #2563eb;
              border-radius: 12px;
            }

            .brand {
              color: #2563eb;
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 8px;
            }

            img {
              display: block;
              width: 220px;
              height: 220px;
              max-width: 100%;
              margin: 20px auto;
            }

            h2 {
              margin-bottom: 6px;
              overflow-wrap: anywhere;
            }

            p {
              color: #555;
              line-height: 1.5;
            }

            @media print {
              body {
                padding: 0;
              }

              .sticker {
                border: 1px solid #999;
              }
            }
          </style>
        </head>

        <body>
          <div class="sticker">
            <div class="brand">PARKOWNERQR</div>
            <p>Society Vehicle Identification</p>

            <img src="${image}" alt="Vehicle QR Code" />

            <h2>${safeNumber}</h2>
            <p>Flat: ${safeFlat}</p>
            <p>Scan to access the society's vehicle contact workflow.</p>
          </div>

          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="dashboard qr-page">
      {/* Page heading */}
      <section className="dashboard__welcome">
        <div>
          <span className="dashboard__eyebrow">
            VEHICLE MANAGEMENT
          </span>

          <h1>Vehicle QR Codes</h1>

          <p>
            Generate, download, and print QR stickers
            for registered vehicles.
          </p>
        </div>

        <span className="qr-page__badge">
          <ShieldCheck size={16} />
          Privacy-aware
        </span>
      </section>

      {/* Summary */}
      <section className="qr-page__summary">
        <div className="qr-page__summary-icon">
          <QrCode size={25} />
        </div>

        <div>
          <span>Total registered vehicles</span>
          <strong>{vehicles.length}</strong>
        </div>

        <div className="qr-page__summary-note">
          QR codes use permanent database tokens.
        </div>
      </section>

      {/* Vehicle table */}
      <section className="dashboard__section">
        <div className="qr-page__toolbar">
          <div>
            <h2>Registered Vehicles</h2>

            <p>
              Select a vehicle to preview its QR sticker.
            </p>
          </div>

          <label className="qr-page__search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search vehicle, owner, or flat..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {loading && (
          <p role="status">Loading vehicles from database...</p>
        )}

        {loadError && (
          <div role="alert">
            <p>{loadError}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <div className="qr-page__table-wrap">
            <table className="qr-page__table">
              <thead>
                <tr>
                  <th>VEHICLE</th>
                  <th>OWNER</th>
                  <th>FLAT</th>
                  <th>QR STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map((vehicle) => {
                  const isActive = vehicle.qrStatus === 'active';
                  const hasQR = Boolean(qrImages[vehicle.id]);

                  return (
                    <tr key={vehicle.id}>
                      <td>
                        <span className="qr-page__vehicle">
                          <CarFront size={18} />
                          <strong>{vehicle.number}</strong>
                        </span>
                      </td>

                      <td>{vehicle.owner || '—'}</td>

                      <td>{vehicle.flat || '—'}</td>

                      <td>
                        <span className="qr-page__status">
                          {!isActive
                            ? 'Inactive'
                            : hasQR
                              ? 'Generated'
                              : 'Generating...'}
                        </span>
                      </td>

                      <td>
                        <div className="qr-page__actions">
                          <button
                            type="button"
                            onClick={() => setSelectedVehicle(vehicle)}
                            disabled={!hasQR}
                          >
                            <QrCode size={15} />
                            Preview
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadQR(vehicle)}
                            disabled={!hasQR}
                            aria-label={`Download QR for ${vehicle.number}`}
                          >
                            <Download size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => printQR(vehicle)}
                            disabled={!hasQR}
                            aria-label={`Print QR for ${vehicle.number}`}
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredVehicles.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="qr-page__no-results"
                    >
                      {search
                        ? 'No vehicles match your search.'
                        : 'No registered vehicles found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* QR preview modal */}
      {selectedVehicle && (
        <div
          className="qr-page__modal-backdrop"
          role="presentation"
          onClick={() => setSelectedVehicle(null)}
        >
          <section
            className="qr-page__modal"
            role="dialog"
            aria-modal="true"
            aria-label="QR code preview"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="qr-page__close"
              type="button"
              onClick={() => setSelectedVehicle(null)}
              aria-label="Close QR preview"
            >
              ×
            </button>

            <div className="qr-page__sticker">
              <span className="qr-page__brand">
                PARKOWNERQR
              </span>

              <h2>Vehicle QR Code</h2>

              {qrImages[selectedVehicle.id] && (
                <img
                  src={qrImages[selectedVehicle.id]}
                  alt={`QR code for ${selectedVehicle.number}`}
                />
              )}

              <strong>{selectedVehicle.number}</strong>

              <span>{selectedVehicle.flat || '—'}</span>

              <p>
                Scan to continue to the society
                verification workflow.
              </p>
            </div>

            <div className="qr-page__modal-actions">
              <button
                type="button"
                onClick={() => downloadQR(selectedVehicle)}
              >
                <Download size={16} />
                Download PNG
              </button>

              <button
                type="button"
                onClick={() => printQR(selectedVehicle)}
              >
                <Printer size={16} />
                Print Sticker
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default QRCodes;