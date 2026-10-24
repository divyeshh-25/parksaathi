import { useState } from 'react';
import { LockKeyhole, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '../auth/auth.js';

function ChangePassword({ onPasswordChanged, onLogout }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        if (newPassword.length < 8) {
            toast.error('Password must contain at least 8 characters.');
            return;
        }

        if (newPassword.length > 72) {
            toast.error('Password cannot exceed 72 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }

        if (currentPassword === newPassword) {
            toast.error(
                'Your new password must be different from your current password.',
            );
            return;
        }

        setLoading(true);

        try {
            const response = await authFetch(
                '/api/auth/change-password',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword,
                    }),
                },
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Unable to change password.',
                );
            }

            toast.success('Password changed successfully!');

            onPasswordChanged();
        } catch (error) {
            toast.error(
                error.message || 'Unable to change password.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.card}>
                <div style={styles.icon}>
                    <ShieldCheck size={30} />
                </div>

                <h1 style={styles.title}>Change Your Password</h1>

                <p style={styles.description}>
                    For your account security, please replace your
                    temporary password before accessing your dashboard.
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>
                        Current Password
                    </label>

                    <div style={styles.inputWrapper}>
                        <input
                            style={styles.input}
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(event) =>
                                setCurrentPassword(event.target.value)
                            }
                            placeholder="Enter your temporary password"
                            autoComplete="current-password"
                            required
                        />

                        <button
                            type="button"
                            style={styles.eyeButton}
                            onClick={() =>
                                setShowCurrent((value) => !value)
                            }
                            aria-label="Toggle current password visibility"
                        >
                            {showCurrent ? (
                                <EyeOff size={19} />
                            ) : (
                                <Eye size={19} />
                            )}
                        </button>
                    </div>

                    <label style={styles.label}>
                        New Password
                    </label>

                    <div style={styles.inputWrapper}>
                        <input
                            style={styles.input}
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(event) =>
                                setNewPassword(event.target.value)
                            }
                            placeholder="Create a new password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                        />

                        <button
                            type="button"
                            style={styles.eyeButton}
                            onClick={() =>
                                setShowNew((value) => !value)
                            }
                            aria-label="Toggle new password visibility"
                        >
                            {showNew ? (
                                <EyeOff size={19} />
                            ) : (
                                <Eye size={19} />
                            )}
                        </button>
                    </div>

                    <label style={styles.label}>
                        Confirm New Password
                    </label>

                    <div style={styles.inputWrapper}>
                        <input
                            style={styles.input}
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            placeholder="Re-enter your new password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                        />

                        <button
                            type="button"
                            style={styles.eyeButton}
                            onClick={() =>
                                setShowConfirm((value) => !value)
                            }
                            aria-label="Toggle confirmation password visibility"
                        >
                            {showConfirm ? (
                                <EyeOff size={19} />
                            ) : (
                                <Eye size={19} />
                            )}
                        </button>
                    </div>

                    <p style={styles.hint}>
                        Use at least 8 characters. Avoid using your
                        mobile number as your new password.
                    </p>

                    <button
                        type="submit"
                        style={{
                            ...styles.submitButton,
                            opacity: loading ? 0.7 : 1,
                        }}
                        disabled={loading}
                    >
                        <LockKeyhole size={18} />

                        {loading
                            ? 'Updating Password...'
                            : 'Change Password'}
                    </button>
                </form>

                <button
                    type="button"
                    style={styles.logoutButton}
                    onClick={onLogout}
                    disabled={loading}
                >
                    Logout
                </button>
            </section>
        </main>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f4f7fb',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, sans-serif',
    },

    card: {
        width: '100%',
        maxWidth: '440px',
        padding: '32px',
        background: '#ffffff',
        border: '1px solid #e4e7ec',
        borderRadius: '20px',
        boxShadow: '0 12px 35px rgba(16, 24, 40, 0.08)',
        boxSizing: 'border-box',
    },

    icon: {
        width: '58px',
        height: '58px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
        background: '#eaf2ff',
        color: '#2458a6',
        marginBottom: '22px',
    },

    title: {
        margin: '0 0 12px',
        color: '#101828',
        fontSize: '26px',
        lineHeight: 1.3,
        fontWeight: 700,
    },

    description: {
        margin: '0 0 26px',
        color: '#667085',
        fontSize: '14px',
        lineHeight: 1.7,
    },

    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#344054',
        fontSize: '14px',
        fontWeight: 600,
    },

    inputWrapper: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #d0d5dd',
        borderRadius: '10px',
        marginBottom: '20px',
        background: '#ffffff',
    },

    input: {
        width: '100%',
        minWidth: 0,
        padding: '13px 12px',
        border: 'none',
        outline: 'none',
        borderRadius: '10px',
        color: '#101828',
        fontSize: '14px',
        background: 'transparent',
        boxSizing: 'border-box',
    },

    eyeButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: '10px',
        border: 'none',
        background: 'transparent',
        color: '#667085',
        cursor: 'pointer',
    },

    hint: {
        margin: '-4px 0 20px',
        color: '#667085',
        fontSize: '12px',
        lineHeight: 1.6,
    },

    submitButton: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '14px',
        border: 'none',
        borderRadius: '10px',
        background: '#2458a6',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
    },

    logoutButton: {
        width: '100%',
        marginTop: '14px',
        padding: '12px',
        border: 'none',
        background: 'transparent',
        color: '#667085',
        fontSize: '14px',
        cursor: 'pointer',
    },
};

export default ChangePassword;