import { useState } from 'react';
import {
    ArrowRight,
    ArrowUpRight,
    CarFront,
    Check,
    CheckCircle2,
    ChevronRight,
    LockKeyhole,
    Menu,
    QrCode,
    ScanLine,
    ShieldCheck,
    Smartphone,
    Users,
    X,
    Heart,
} from 'lucide-react';
import './Home.css';

const steps = [
    {
        number: '01',
        icon: Users,
        title: 'Register your vehicle',
        description:
            'Your housing society registers residents and their vehicles on ParkSaathi.',
    },
    {
        number: '02',
        icon: QrCode,
        title: 'Get your unique QR',
        description:
            'Each registered vehicle receives its own QR code, ready to be displayed as a sticker.',
    },
    {
        number: '03',
        icon: ScanLine,
        title: 'Scan when needed',
        description:
            'When a parked vehicle needs attention, someone can scan its QR code using a phone.',
    },
    {
        number: '04',
        icon: ShieldCheck,
        title: 'Follow the contact flow',
        description:
            'The scanner follows the available verification flow to help connect with the vehicle owner.',
    },
];

const features = [
    {
        icon: QrCode,
        title: 'Unique vehicle QR codes',
        description:
            'Give every registered vehicle its own QR identity for quick, convenient identification.',
    },
    {
        icon: CarFront,
        title: 'Multiple vehicles',
        description:
            'Keep multiple vehicles connected to one resident account in one place.',
    },
    {
        icon: Users,
        title: 'Society management',
        description:
            'Help authorized administrators manage residents and registered vehicles centrally.',
    },
    {
        icon: LockKeyhole,
        title: 'Privacy-conscious by design',
        description:
            'Support a more considered way to connect without unnecessarily displaying personal details.',
    },
];

function Home() {
    const [menuOpen, setMenuOpen] = useState(false);

    const openLogin = () => {
        setMenuOpen(false);

        // Navigate to the application's login route.
        if (window.location.hash !== '#login') {
            window.location.hash = '#login';
        } else {
            // If already on #login, notify hash-based navigation listeners.
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    };

    const scrollTo = (id) => {
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    return (
        <div className="ps-home">
            <header className="ps-home__header">
                <a
                    className="ps-home__brand"
                    href="#home"
                    aria-label="ParkSaathi home"
                    onClick={() => setMenuOpen(false)}
                >
                    <span className="ps-home__brand-mark">
                        <CarFront size={23} strokeWidth={2.4} />
                    </span>
                    <span className="ps-home__brand-copy">
                        <strong>ParkSaathi</strong>
                        <small>SMARTER SOCIETY PARKING</small>
                    </span>
                </a>

                <button
                    type="button"
                    className="ps-home__menu-toggle"
                    aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                <nav
                    className={`ps-home__nav ${menuOpen ? 'ps-home__nav--open' : ''}`}
                    aria-label="Main navigation"
                >
                    <button type="button" onClick={() => scrollTo('how-it-works')}>
                        How it works
                    </button>
                    <button type="button" onClick={() => scrollTo('features')}>
                        Features
                    </button>
                    <button type="button" onClick={() => scrollTo('privacy')}>
                        Privacy
                    </button>
                    <button
                        type="button"
                        className="ps-home__nav-cta"
                        onClick={openLogin}
                    >
                        Open app <ArrowUpRight size={16} />
                    </button>
                </nav>
            </header>

            <main id="home">
                <section className="ps-home__hero">
                    <div className="ps-home__hero-copy">
                        <div className="ps-home__eyebrow">
                            <span className="ps-home__eyebrow-dot" />
                            A SMARTER WAY TO STAY CONNECTED
                        </div>

                        <h1>
                            Parking made simple.
                            <br />
                            <span>Privacy kept personal.</span>
                        </h1>

                        <p className="ps-home__hero-text">
                            ParkSaathi helps housing societies connect people with registered
                            vehicle owners when a parked vehicle needs attention — using a
                            simple QR-based experience.
                        </p>

                        <div className="ps-home__hero-actions">
                            <button
                                type="button"
                                className="ps-home__button ps-home__button--primary"
                                onClick={openLogin}
                            >
                                Explore ParkSaathi <ArrowRight size={18} />
                            </button>
                            <button
                                type="button"
                                className="ps-home__button ps-home__button--quiet"
                                onClick={() => scrollTo('how-it-works')}
                            >
                                See how it works <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="ps-home__trust">
                            <span className="ps-home__trust-icon">
                                <ShieldCheck size={18} />
                            </span>
                            <span>
                                <strong>Privacy-conscious by design</strong>
                                <small>Built for everyday society parking moments</small>
                            </span>
                        </div>
                    </div>

                    <div
                        className="ps-home__hero-art"
                        aria-label="ParkSaathi vehicle QR illustration"
                    >
                        <div className="ps-home__art-orbit ps-home__art-orbit--one" />
                        <div className="ps-home__art-orbit ps-home__art-orbit--two" />

                        <div className="ps-home__vehicle-card">
                            <div className="ps-home__vehicle-card-top">
                                <div className="ps-home__tiny-brand">
                                    <span className="ps-home__tiny-brand-icon">
                                        <CarFront size={18} />
                                    </span>
                                    <span>
                                        <strong>ParkSaathi</strong>
                                        <small>Vehicle identity</small>
                                    </span>
                                </div>
                                <span className="ps-home__secure-pill">
                                    <ShieldCheck size={13} /> Privacy first
                                </span>
                            </div>

                            <div className="ps-home__car-stage">
                                <div className="ps-home__stage-label">
                                    SMART SOCIETY PARKING
                                </div>
                                <svg
                                    className="ps-home__car-svg"
                                    viewBox="0 0 520 260"
                                    role="img"
                                    aria-label="Blue car parked in a marked parking space"
                                >
                                    <defs>
                                        <linearGradient
                                            id="psCarBody"
                                            x1="0"
                                            y1="0"
                                            x2="1"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="#60A5FA" />
                                            <stop offset="55%" stopColor="#3478ED" />
                                            <stop offset="100%" stopColor="#1D4ED8" />
                                        </linearGradient>
                                        <linearGradient
                                            id="psGlass"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="#E0F2FE" />
                                            <stop offset="100%" stopColor="#93C5FD" />
                                        </linearGradient>
                                    </defs>

                                    <ellipse
                                        cx="260"
                                        cy="219"
                                        rx="195"
                                        ry="20"
                                        fill="#C7DDFD"
                                        opacity=".8"
                                    />

                                    <path
                                        d="M56 174 L75 135 Q83 118 108 111 L165 65 Q180 53 205 53 L310 53 Q337 53 356 79 L389 121 L431 139 Q447 146 449 165 L449 194 L56 194 Z"
                                        fill="url(#psCarBody)"
                                        stroke="#1E40AF"
                                        strokeWidth="3"
                                    />

                                    <path
                                        d="M127 111 L174 72 Q185 64 205 64 L249 64 L249 112 Z"
                                        fill="url(#psGlass)"
                                    />
                                    <path
                                        d="M260 64 L309 64 Q328 64 342 84 L363 112 L260 112 Z"
                                        fill="url(#psGlass)"
                                    />
                                    <path
                                        d="M254 64 L254 113"
                                        stroke="#1D4ED8"
                                        strokeWidth="4"
                                    />
                                    <path
                                        d="M76 143 L109 137 L101 160 L65 164 Z"
                                        fill="#FEF3C7"
                                    />
                                    <path
                                        d="M407 145 L434 156 L434 171 L411 169 Z"
                                        fill="#FCA5A5"
                                    />
                                    <path
                                        d="M128 137 L377 137 L397 169 L108 169 Z"
                                        fill="#1D4ED8"
                                        opacity=".55"
                                    />

                                    <rect
                                        x="220"
                                        y="145"
                                        width="108"
                                        height="30"
                                        rx="5"
                                        fill="#FFFFFF"
                                    />
                                    <text
                                        x="274"
                                        y="157"
                                        fontSize="8"
                                        fontWeight="800"
                                        fill="#1D4ED8"
                                        textAnchor="middle"
                                    >
                                        PARK
                                    </text>
                                    <text
                                        x="274"
                                        y="168"
                                        fontSize="8"
                                        fontWeight="800"
                                        fill="#1D4ED8"
                                        textAnchor="middle"
                                    >
                                        SAATHI
                                    </text>

                                    <circle cx="139" cy="190" r="34" fill="#172B4D" />
                                    <circle cx="139" cy="190" r="18" fill="#D7E2F1" />
                                    <circle cx="139" cy="190" r="7" fill="#7185A3" />
                                    <circle cx="367" cy="190" r="34" fill="#172B4D" />
                                    <circle cx="367" cy="190" r="18" fill="#D7E2F1" />
                                    <circle cx="367" cy="190" r="7" fill="#7185A3" />

                                    <path
                                        d="M190 125 L190 134 M202 125 L202 134 M214 125 L214 134"
                                        stroke="#BFDBFE"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                <div className="ps-home__parking-line ps-home__parking-line--left" />
                                <div className="ps-home__parking-line ps-home__parking-line--right" />
                            </div>

                            <div className="ps-home__sticker-row">
                                <div className="ps-home__sticker-qr" aria-hidden="true">
                                    <QrCode size={44} strokeWidth={1.7} />
                                    <span>SCAN ME</span>
                                </div>
                                <div className="ps-home__sticker-copy">
                                    <span className="ps-home__mini-label">
                                        YOUR VEHICLE, CONNECTED
                                    </span>
                                    <strong>One vehicle. One unique QR.</strong>
                                    <small>Scan when a vehicle needs attention.</small>
                                </div>
                                <span className="ps-home__sticker-check">
                                    <Check size={17} />
                                </span>
                            </div>
                        </div>

                        <div className="ps-home__float-card ps-home__float-card--privacy">
                            <span className="ps-home__float-icon ps-home__float-icon--blue">
                                <LockKeyhole size={18} />
                            </span>
                            <span>
                                <strong>Privacy matters</strong>
                                <small>Thoughtful information sharing</small>
                            </span>
                        </div>

                        <div className="ps-home__float-card ps-home__float-card--scan">
                            <span className="ps-home__float-icon ps-home__float-icon--green">
                                <ScanLine size={18} />
                            </span>
                            <span>
                                <strong>Scan. Verify. Connect.</strong>
                                <small>A simple guided flow</small>
                            </span>
                        </div>
                    </div>
                </section>

                <section
                    className="ps-home__proof-strip"
                    aria-label="ParkSaathi benefits"
                >
                    <div className="ps-home__proof-item">
                        <span className="ps-home__proof-icon">
                            <QrCode size={21} />
                        </span>
                        <span>
                            <strong>QR-based</strong>
                            <small>Vehicle identification</small>
                        </span>
                    </div>
                    <div className="ps-home__proof-item">
                        <span className="ps-home__proof-icon">
                            <Smartphone size={21} />
                        </span>
                        <span>
                            <strong>Easy to use</strong>
                            <small>Scan with a smartphone</small>
                        </span>
                    </div>
                    <div className="ps-home__proof-item">
                        <span className="ps-home__proof-icon">
                            <ShieldCheck size={21} />
                        </span>
                        <span>
                            <strong>Privacy-focused</strong>
                            <small>Designed with care</small>
                        </span>
                    </div>
                </section>

                <section id="how-it-works" className="ps-home__section ps-home__how">
                    <div className="ps-home__section-heading">
                        <span className="ps-home__section-kicker">HOW IT WORKS</span>
                        <h2>
                            Four steps to a <span>better parking experience.</span>
                        </h2>
                        <p>
                            From registration to a scan, ParkSaathi makes the process easy
                            to understand for residents and visitors alike.
                        </p>
                    </div>

                    <div className="ps-home__steps">
                        {steps.map((step, index) => {
                            const Icon = step.icon;

                            return (
                                <article className="ps-home__step" key={step.number}>
                                    <div className="ps-home__step-head">
                                        <span className="ps-home__step-icon">
                                            <Icon size={23} />
                                        </span>
                                        <span className="ps-home__step-number">
                                            {step.number}
                                        </span>
                                    </div>

                                    {index < steps.length - 1 && (
                                        <span
                                            className="ps-home__step-connector"
                                            aria-hidden="true"
                                        >
                                            <ArrowRight size={15} />
                                        </span>
                                    )}

                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section className="ps-home__product">
                    <div className="ps-home__product-copy">
                        <span className="ps-home__section-kicker">ONE PLACE TO MANAGE</span>
                        <h2>A clearer view of your society&apos;s vehicles.</h2>
                        <p>
                            ParkSaathi brings vehicle records, resident information and QR
                            management into a focused experience for authorized society
                            administrators.
                        </p>

                        <ul>
                            <li>
                                <CheckCircle2 size={18} /> Registered vehicle overview
                            </li>
                            <li>
                                <CheckCircle2 size={18} /> Resident and vehicle management
                            </li>
                            <li>
                                <CheckCircle2 size={18} /> QR code and privacy settings
                            </li>
                        </ul>

                        <button
                            type="button"
                            className="ps-home__button ps-home__button--primary"
                            onClick={openLogin}
                        >
                            Explore the app <ArrowRight size={18} />
                        </button>
                    </div>

                    <div
                        className="ps-home__dashboard-preview"
                        aria-label="Illustrative ParkSaathi dashboard preview"
                    >
                        <div className="ps-home__preview-window">
                            <div className="ps-home__preview-sidebar">
                                <div className="ps-home__preview-logo">
                                    <CarFront size={17} />
                                </div>
                                <span className="ps-home__preview-side-active" />
                                <span />
                                <span />
                                <span />
                            </div>

                            <div className="ps-home__preview-main">
                                <div className="ps-home__preview-top">
                                    <div>
                                        <small>OVERVIEW</small>
                                        <strong>Society dashboard</strong>
                                    </div>
                                    <span className="ps-home__preview-avatar">P</span>
                                </div>

                                <div className="ps-home__preview-stats">
                                    <div>
                                        <span>Vehicles</span>
                                        <strong>Manage</strong>
                                        <i><CarFront size={16} /></i>
                                    </div>
                                    <div>
                                        <span>Residents</span>
                                        <strong>Organize</strong>
                                        <i><Users size={16} /></i>
                                    </div>
                                    <div>
                                        <span>QR codes</span>
                                        <strong>Identify</strong>
                                        <i><QrCode size={16} /></i>
                                    </div>
                                </div>

                                <div className="ps-home__preview-panel">
                                    <div className="ps-home__preview-panel-title">
                                        <strong>Vehicle management</strong>
                                        <span>Preview</span>
                                    </div>

                                    <div className="ps-home__preview-table-head">
                                        <span>VEHICLE</span>
                                        <span>QR STATUS</span>
                                    </div>

                                    <div className="ps-home__preview-row">
                                        <span className="ps-home__preview-car">
                                            <CarFront size={16} />
                                            <span>
                                                <strong>Registered vehicle</strong>
                                                <small>Vehicle record</small>
                                            </span>
                                        </span>
                                        <span className="ps-home__preview-status">
                                            <i /> Active
                                        </span>
                                    </div>

                                    <div className="ps-home__preview-row">
                                        <span className="ps-home__preview-car">
                                            <CarFront size={16} />
                                            <span>
                                                <strong>Registered vehicle</strong>
                                                <small>Vehicle record</small>
                                            </span>
                                        </span>
                                        <span className="ps-home__preview-status">
                                            <i /> Active
                                        </span>
                                    </div>

                                    <div className="ps-home__preview-row">
                                        <span className="ps-home__preview-car">
                                            <CarFront size={16} />
                                            <span>
                                                <strong>Registered vehicle</strong>
                                                <small>Vehicle record</small>
                                            </span>
                                        </span>
                                        <span className="ps-home__preview-status ps-home__preview-status--muted">
                                            <i /> Review
                                        </span>
                                    </div>
                                </div>

                                <div className="ps-home__preview-disclaimer">
                                    Illustrative product preview · Sample content
                                </div>
                            </div>
                        </div>

                        <div className="ps-home__preview-badge">
                            <span><ShieldCheck size={19} /></span>
                            <span>
                                <strong>Built around privacy</strong>
                                <small>Designed for society life</small>
                            </span>
                        </div>
                    </div>
                </section>

                <section
                    id="features"
                    className="ps-home__section ps-home__features"
                >
                    <div className="ps-home__section-heading">
                        <span className="ps-home__section-kicker">MADE FOR EVERYDAY LIFE</span>
                        <h2>
                            Small details. <span>Smarter communities.</span>
                        </h2>
                        <p>
                            A practical set of tools designed around the way housing
                            societies and residents manage their vehicles.
                        </p>
                    </div>

                    <div className="ps-home__feature-grid">
                        {features.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <article className="ps-home__feature" key={feature.title}>
                                    <span className="ps-home__feature-icon">
                                        <Icon size={23} />
                                    </span>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                    <span className="ps-home__feature-arrow">
                                        <ArrowUpRight size={17} />
                                    </span>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section id="privacy" className="ps-home__privacy">
                    <div className="ps-home__privacy-emblem">
                        <div className="ps-home__privacy-ring ps-home__privacy-ring--outer" />
                        <div className="ps-home__privacy-ring ps-home__privacy-ring--inner" />
                        <span><ShieldCheck size={42} /></span>
                    </div>

                    <div className="ps-home__privacy-copy">
                        <span className="ps-home__section-kicker">PRIVACY MATTERS</span>
                        <h2>
                            Connect when it matters.
                            <br />
                            <span>Share only what&apos;s necessary.</span>
                        </h2>
                        <p>
                            A parked vehicle may need attention, but its owner&apos;s personal
                            information shouldn&apos;t be unnecessarily on display. ParkSaathi
                            is designed to support a more considered way to identify a
                            registered vehicle and follow the available contact process.
                        </p>

                        <div className="ps-home__privacy-points">
                            <span>
                                <CheckCircle2 size={18} /> Vehicle-specific QR identification
                            </span>
                            <span>
                                <CheckCircle2 size={18} /> A guided contact workflow
                            </span>
                            <span>
                                <CheckCircle2 size={18} /> Society-managed vehicle records
                            </span>
                        </div>
                    </div>
                </section>

                <section className="ps-home__cta">
                    <div className="ps-home__cta-orb ps-home__cta-orb--one" />
                    <div className="ps-home__cta-orb ps-home__cta-orb--two" />

                    <div className="ps-home__cta-content">
                        <span className="ps-home__cta-kicker">
                            PARK SMARTER WITH PARKSAATHI
                        </span>
                        <h2>
                            A better parking experience
                            <br />
                            starts with one scan.
                        </h2>
                        <p>
                            Discover a more convenient, privacy-conscious way to manage
                            vehicle identification in your housing society.
                        </p>
                        <button
                            type="button"
                            className="ps-home__button ps-home__button--white"
                            onClick={openLogin}
                        >
                            Get started <ArrowRight size={18} />
                        </button>
                    </div>
                </section>
            </main>

            <footer className="ps-home__footer">
  <a
    className="ps-home__footer-brand"
    href="#home"
    aria-label="ParkSaathi home"
    onClick={() => setMenuOpen(false)}
  >
    <span className="ps-home__brand-mark">
      <CarFront size={21} />
    </span>
    <strong>ParkSaathi</strong>
  </a>

  <p>
    Smarter vehicle identification for connected communities.
  </p>

  <button type="button" onClick={openLogin}>
    Open application <ArrowUpRight size={16} />
  </button>

  {/* Developer Credit */}
  <div className="ps-home__developer-credit">
    <span className="ps-home__developer-message">
      Crafted with
      <Heart
        size={15}
        className="ps-home__heart-icon"
        fill="currentColor"
        aria-label="love"
      />
      <span>and passion by</span>
      <strong>Divyesh Panchal</strong>
    </span>

    <div className="ps-home__developer-links">
      <a
        href="https://www.linkedin.com/in/divyeshhpanchal/"
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn <ArrowUpRight size={12} />
      </a>

      <a
        href="https://divyesh-panchal.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Portfolio <ArrowUpRight size={12} />
      </a>

      <a href="tel:+919157762508">
        Contact <ArrowUpRight size={12} />
      </a>
    </div>
  </div>

  <div className="ps-home__footer-bottom">
    <span>
      © {new Date().getFullYear()} ParkSaathi. All rights reserved.
    </span>

    <span className="ps-home__footer-tagline">
      Built for communities. Designed with <Heart
        size={12}
        fill="currentColor"
        aria-hidden="true"
      /> privacy in mind.
    </span>
  </div>
</footer>
        </div>
    );
}

export default Home;