import { useEffect, useState } from 'react';

import {
    ShieldCheck,
    ShieldAlert,
    CarFront,
    UserRound,
    Phone,
    Building2,
    LockKeyhole,
    ArrowLeft,
    CheckCircle2,
    QrCode,
} from 'lucide-react';

import './ScanDemo.css';

function getQrTokenFromUrl() {
    const hash = window.location.hash;

    const query = hash.includes('?')
        ? hash.substring(hash.indexOf('?') + 1)
        : window.location.search.substring(1);

    return new URLSearchParams(query).get('token');
}

const DEFAULT_PRIVACY_SETTINGS = {
    privacyMode: true,
    showVehicleNumber: true,
    showOwnerName: false,
    showFlatNumber: false,
    showOwnerMobile: false,
    allowContactRequests: true,
    allowUrgentNotifications: true,
    allowQrScanning: true,
};

function normalizePrivacySettings(settings = {}) {
    return {
        privacyMode:
            settings.privacyMode ?? settings.privacy_mode ?? true,

        showVehicleNumber:
            settings.showVehicleNumber ??
            settings.show_vehicle_number ??
            true,

        showOwnerName:
            settings.showOwnerName ??
            settings.show_owner_name ??
            false,

        showFlatNumber:
            settings.showFlatNumber ??
            settings.show_flat_number ??
            false,

        showOwnerMobile:
            settings.showOwnerMobile ??
            settings.show_owner_mobile ??
            false,

        allowContactRequests:
            settings.allowContactRequests ??
            settings.allow_contact_requests ??
            true,

        allowUrgentNotifications:
            settings.allowUrgentNotifications ??
            settings.allow_urgent_notifications ??
            true,

        allowQrScanning:
            settings.allowQrScanning ??
            settings.allow_qr_scanning ??
            true,
    };
}

function normalizeVehicle(vehicle) {
    return {
        id: String(vehicle.id),
        publicId: vehicle.public_id,
        qrToken: vehicle.qr_token,
        number: vehicle.registration_number || '',
        type: vehicle.vehicle_type || '',
        model: vehicle.model || '',
        owner: vehicle.resident_name || '',
        flat: vehicle.flat_number || '',
        mobile: vehicle.resident_mobile || '',
        qrStatus: String(vehicle.qr_status || '').toLowerCase(),
        residentStatus: String(
            vehicle.resident_status || '',
        ).toLowerCase(),
    };
}

function ScanDemo() {
    const [qrToken] = useState(getQrTokenFromUrl);

    const [mobile, setMobile] = useState('');
    const [vehicle, setVehicle] = useState(null);
    const [privacySettings, setPrivacySettings] = useState(
        DEFAULT_PRIVACY_SETTINGS,
    );

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadVehicle() {
            if (!qrToken) {
                setLoadError(
                    'QR token missing. Please scan a valid ParkSaathi QR code.',
                );
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setLoadError('');

                const response = await fetch(
                    `/api/vehicles/scan/${encodeURIComponent(qrToken)}`,
                    {
                        signal: controller.signal,
                    },
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || 'Unable to load vehicle information.',
                    );
                }

                const vehicleData = data.data?.vehicle;

                if (!vehicleData) {
                    throw new Error('Vehicle information was not returned.');
                }

                setVehicle(normalizeVehicle(vehicleData));

                setPrivacySettings(
                    normalizePrivacySettings(
                        data.data?.privacySettings || {},
                    ),
                );
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setLoadError(
                        error.message || 'Unable to load the QR code.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadVehicle();

        return () => controller.abort();
    }, [qrToken]);

    const privacyMode = privacySettings.privacyMode !== false;

    const visibleFields = {
        vehicleNumber: privacySettings.showVehicleNumber === true,
        ownerName: privacySettings.showOwnerName === true,
        flatNumber: privacySettings.showFlatNumber === true,
        ownerMobile: privacySettings.showOwnerMobile === true,
    };

    const showDetails = result?.type === 'success';

    const verifyMember = async (event) => {
        event.preventDefault();

        setResult(null);

        if (!vehicle) {
            setResult({
                type: 'denied',
                message: 'Vehicle information is unavailable.',
            });
            return;
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            setResult({
                type: 'invalid',
                message: 'Enter a valid 10-digit Indian mobile number.',
            });
            return;
        }

        try {
            setVerifying(true);

            const response = await fetch(
                `/api/vehicles/scan/${encodeURIComponent(qrToken)}/verify`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ mobile }),
                },
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setResult({
                    type: response.status === 400 ? 'invalid' : 'denied',
                    message:
                        data.message ||
                        'Membership verification failed.',
                });
                return;
            }

            setVehicle(
                normalizeVehicle(data.data.vehicle || vehicle),
            );

            setPrivacySettings(
                normalizePrivacySettings(
                    data.data.privacySettings || privacySettings,
                ),
            );

            setResult({
                type: 'success',
                message:
                    data.message ||
                    'Society membership verified successfully.',
                verified: true,
            });
        } catch (error) {
            setResult({
                type: 'denied',
                message:
                    'Unable to verify membership. Please check your connection and try again.',
            });
        } finally {
            setVerifying(false);
        }
    };

    const resetForm = () => {
        setMobile('');
        setResult(null);
    };

    const goBack = () => {
        window.location.hash = '#overview';
    };

    const displayedVehicle = vehicle;

    if (loading) {
        return (
            <main className="ps-scan">
                <div className="ps-scan__container">
                    <header className="ps-scan__header">
                        <a className="ps-scan__brand" href="#overview">
                            <span className="ps-scan__brand-icon">
                                <QrCode size={24} />
                            </span>

                            <span>
                                <strong>ParkSaathi</strong>
                                <small>VEHICLE ASSISTANCE</small>
                            </span>
                        </a>

                        <span className="ps-scan__secure">
                            <ShieldCheck size={15} />
                            Privacy aware
                        </span>
                    </header>

                    <section className="ps-scan__card ps-scan__center">
                        <QrCode size={32} />
                        <h1>Loading vehicle details...</h1>
                        <p>
                            Please wait while we validate your QR code.
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    if (loadError || !vehicle) {
        return (
            <main className="ps-scan">
                <div className="ps-scan__container">
                    <header className="ps-scan__header">
                        <a className="ps-scan__brand" href="#overview">
                            <span className="ps-scan__brand-icon">
                                <QrCode size={24} />
                            </span>

                            <span>
                                <strong>ParkSaathi</strong>
                                <small>VEHICLE ASSISTANCE</small>
                            </span>
                        </a>

                        <span className="ps-scan__secure">
                            <ShieldCheck size={15} />
                            Privacy aware
                        </span>
                    </header>

                    <section className="ps-scan__card ps-scan__center">
                        <span className="ps-scan__state-icon ps-scan__state-icon--error">
                            <ShieldAlert size={30} />
                        </span>

                        <h1>Vehicle not available</h1>

                        <p>
                            {loadError ||
                                'This QR code is invalid or inactive.'}
                        </p>

                        <button
                            className="ps-scan__button ps-scan__button--secondary"
                            onClick={goBack}
                            type="button"
                        >
                            <ArrowLeft size={17} />
                            Back to ParkSaathi
                        </button>
                    </section>
                </div>
            </main>
        );
    }

    if (privacySettings.allowQrScanning === false) {
        return (
            <main className="ps-scan">
                <div className="ps-scan__container">
                    <header className="ps-scan__header">
                        <a className="ps-scan__brand" href="#overview">
                            <span className="ps-scan__brand-icon">
                                <QrCode size={24} />
                            </span>

                            <span>
                                <strong>ParkSaathi</strong>
                                <small>VEHICLE ASSISTANCE</small>
                            </span>
                        </a>

                        <span className="ps-scan__secure">
                            <ShieldCheck size={15} />
                            Privacy aware
                        </span>
                    </header>

                    <section className="ps-scan__card ps-scan__center">
                        <span className="ps-scan__state-icon ps-scan__state-icon--error">
                            <LockKeyhole size={30} />
                        </span>

                        <h1>QR scanning unavailable</h1>

                        <p>
                            QR scanning is currently disabled in the privacy
                            settings. Please contact your society administrator
                            if you need assistance.
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="ps-scan">
            <div className="ps-scan__container">
                <header className="ps-scan__header">
                    <a className="ps-scan__brand" href="#overview">
                        <span className="ps-scan__brand-icon">
                            <QrCode size={24} />
                        </span>

                        <span>
                            <strong>ParkSaathi</strong>
                            <small>VEHICLE ASSISTANCE</small>
                        </span>
                    </a>

                    <span className="ps-scan__secure">
                        <ShieldCheck size={15} />
                        Privacy aware
                    </span>
                </header>

                <section className="ps-scan__intro">
                    <span className="ps-scan__eyebrow">
                        <CarFront size={16} />
                        SOCIETY VEHICLE ASSISTANCE
                    </span>

                    <h1>
                        Need to contact
                        <br />
                        this vehicle owner?
                    </h1>

                    <p>
                        {privacyMode
                            ? 'Verify your society membership to continue.'
                            : 'View the vehicle information the owner has chosen to share.'}
                    </p>
                </section>

                <section className="ps-scan__vehicle">
                    <div className="ps-scan__vehicle-icon">
                        <CarFront size={27} />
                    </div>

                    <div className="ps-scan__vehicle-info">
                        <span>SCANNED VEHICLE</span>

                        <strong>
                            {visibleFields.vehicleNumber
                                ? displayedVehicle.number
                                : 'Vehicle identified'}
                        </strong>

                        <small>
                            {displayedVehicle.type}
                            {displayedVehicle.model
                                ? ` · ${displayedVehicle.model}`
                                : ''}
                        </small>
                    </div>

                    <CheckCircle2
                        className="ps-scan__vehicle-check"
                        size={21}
                    />
                </section>

                {!showDetails && privacyMode && (
                    <section className="ps-scan__card">
                        <div className="ps-scan__card-heading">
                            <span className="ps-scan__heading-icon">
                                <Phone size={21} />
                            </span>

                            <div>
                                <h2>Verify your membership</h2>
                                <p>
                                    Enter your registered mobile number.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={verifyMember}>
                            <label
                                className="ps-scan__label"
                                htmlFor="ps-scan-mobile"
                            >
                                Mobile number
                            </label>

                            <div className="ps-scan__phone-input">
                                <span>+91</span>

                                <input
                                    id="ps-scan-mobile"
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="tel-national"
                                    maxLength={10}
                                    placeholder="Enter 10-digit number"
                                    value={mobile}
                                    onChange={(event) => {
                                        setMobile(
                                            event.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 10),
                                        );

                                        setResult(null);
                                    }}
                                    required
                                />
                            </div>

                            <p className="ps-scan__hint">
                                Only active mobile numbers registered with
                                your society can pass verification.
                            </p>

                            <button
                                className="ps-scan__button"
                                type="submit"
                                disabled={verifying}
                            >
                                {verifying
                                    ? 'Verifying...'
                                    : 'Verify & Continue'}

                                {!verifying && (
                                    <ArrowLeft
                                        className="ps-scan__button-arrow"
                                        size={17}
                                    />
                                )}
                            </button>
                        </form>

                        <div className="ps-scan__privacy-note">
                            <LockKeyhole size={17} />

                            <p>
                                Your mobile number is checked by the
                                ParkSaathi backend. Owner details are shown
                                according to privacy settings.
                            </p>
                        </div>
                    </section>
                )}

                {showDetails && (
                    <section className="ps-scan__card">
                        <div className="ps-scan__result-banner ps-scan__result-banner--success">
                            <span>
                                <ShieldCheck size={23} />
                            </span>

                            <div>
                                <h2>Membership verified</h2>
                                <p>{result.message}</p>
                            </div>
                        </div>

                        <h3 className="ps-scan__details-title">
                            Permitted information
                        </h3>

                        {visibleFields.vehicleNumber && (
                            <div className="ps-scan__detail">
                                <CarFront size={19} />

                                <div>
                                    <span>Vehicle number</span>
                                    <strong>{displayedVehicle.number}</strong>
                                </div>
                            </div>
                        )}

                        {visibleFields.ownerName && (
                            <div className="ps-scan__detail">
                                <UserRound size={19} />

                                <div>
                                    <span>Vehicle owner</span>
                                    <strong>
                                        {displayedVehicle.owner ||
                                            'Not available'}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {visibleFields.flatNumber && (
                            <div className="ps-scan__detail">
                                <Building2 size={19} />

                                <div>
                                    <span>Flat number</span>
                                    <strong>
                                        {displayedVehicle.flat ||
                                            'Not available'}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {visibleFields.ownerMobile && (
                            <div className="ps-scan__detail">
                                <Phone size={19} />

                                <div>
                                    <span>Owner mobile number</span>
                                    <strong>
                                        {displayedVehicle.mobile ||
                                            'Not available'}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {!visibleFields.vehicleNumber &&
                            !visibleFields.ownerName &&
                            !visibleFields.flatNumber &&
                            !visibleFields.ownerMobile && (
                                <div className="ps-scan__no-details">
                                    <LockKeyhole size={25} />

                                    <strong>No details are shared</strong>

                                    <p>
                                        The society privacy settings do not
                                        permit displaying additional
                                        information.
                                    </p>
                                </div>
                            )}

                        {privacySettings.allowContactRequests && (
                            <div className="ps-scan__contact-note">
                                <Phone size={18} />

                                <p>
                                    Need assistance? Contact your society
                                    security desk or administrator to reach
                                    the vehicle owner.
                                </p>
                            </div>
                        )}

                        <button
                            className="ps-scan__button ps-scan__button--secondary"
                            type="button"
                            onClick={resetForm}
                        >
                            Scan another vehicle
                        </button>
                    </section>
                )}

                {(result?.type === 'invalid' ||
                    result?.type === 'denied') && (
                    <section
                        className="ps-scan__error"
                        role="alert"
                    >
                        <ShieldAlert size={22} />

                        <div>
                            <strong>
                                {result.type === 'invalid'
                                    ? 'Check your mobile number'
                                    : 'Access not available'}
                            </strong>

                            <p>{result.message}</p>
                        </div>

                        <button
                            type="button"
                            onClick={resetForm}
                            aria-label="Try again"
                        >
                            Try again
                        </button>
                    </section>
                )}

                {!privacyMode && !showDetails && (
                    <section className="ps-scan__card">
                        <div className="ps-scan__result-banner ps-scan__result-banner--public">
                            <span>
                                <CheckCircle2 size={23} />
                            </span>

                            <div>
                                <h2>Shared vehicle information</h2>
                                <p>
                                    Information permitted by the privacy
                                    settings is shown below.
                                </p>
                            </div>
                        </div>

                        {visibleFields.vehicleNumber && (
                            <div className="ps-scan__detail">
                                <CarFront size={19} />
                                <div>
                                    <span>Vehicle number</span>
                                    <strong>{displayedVehicle.number}</strong>
                                </div>
                            </div>
                        )}

                        {visibleFields.ownerName && (
                            <div className="ps-scan__detail">
                                <UserRound size={19} />
                                <div>
                                    <span>Vehicle owner</span>
                                    <strong>
                                        {displayedVehicle.owner ||
                                            'Not available'}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {visibleFields.flatNumber && (
                            <div className="ps-scan__detail">
                                <Building2 size={19} />
                                <div>
                                    <span>Flat number</span>
                                    <strong>
                                        {displayedVehicle.flat ||
                                            'Not available'}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {visibleFields.ownerMobile && (
                            <div className="ps-scan__detail">
                                <Phone size={19} />
                                <div>
                                    <span>Owner mobile number</span>
                                    <strong>
                                        {displayedVehicle.mobile ||
                                            'Not available'}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {!visibleFields.vehicleNumber &&
                            !visibleFields.ownerName &&
                            !visibleFields.flatNumber &&
                            !visibleFields.ownerMobile && (
                                <div className="ps-scan__no-details">
                                    <LockKeyhole size={25} />
                                    <strong>No details are shared</strong>
                                    <p>
                                        No vehicle or owner information is
                                        currently available for public display.
                                    </p>
                                </div>
                            )}
                    </section>
                )}

                <footer className="ps-scan__footer">
                    <ShieldCheck size={16} />

                    <span>
                        ParkSaathi helps protect resident privacy.
                        <br />
                        Vehicle and membership checks use the backend API.
                    </span>
                </footer>
            </div>
        </main>
    );
}

export default ScanDemo;