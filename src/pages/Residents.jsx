import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Phone,
  Building2,
  X,
  CheckCircle2,
  Ban,
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { authFetch } from '../auth/auth.js';
import Swal from 'sweetalert2';
import './Residents.css';

const emptyForm = {
  name: '',
  flat: '',
  mobile: '',
  status: 'Active',
};

function mapResident(resident) {
  return {
    id: String(resident.id),
    name: resident.name,
    flat: resident.flat_number,
    mobile: resident.mobile,
    status:
      resident.status?.toLowerCase() === 'active'
        ? 'Active'
        : 'Inactive',
  };
}

function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  // Load residents from the API.
  useEffect(() => {
    const controller = new AbortController();

    const loadResidents = async () => {
      try {
        const response = await authFetch('/api/residents', {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Unable to load residents.',
          );
        }

        setResidents(result.data.map(mapResident));
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error(
            err.message || 'Unable to load residents.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadResidents();

    return () => controller.abort();
  }, []);

  // Search and status filtering.
  const filteredResidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return residents.filter((resident) => {
      const matchesSearch =
        resident.name.toLowerCase().includes(query) ||
        resident.flat.toLowerCase().includes(query) ||
        resident.mobile.includes(query);

      const matchesStatus =
        statusFilter === 'All' ||
        resident.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [residents, search, statusFilter]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (resident) => {
    setEditingId(resident.id);

    setForm({
      name: resident.name,
      flat: resident.flat,
      mobile: resident.mobile,
      status: resident.status,
    });

    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const showValidationError = (message) => {
    setError(message);
    toast.error(message);
  };

  // Add a resident or update an existing resident.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const name = form.name.trim();
    const flat = form.flat.trim().toUpperCase();
    const mobile = form.mobile.trim();

    if (!name || !flat || !mobile) {
      showValidationError(
        'Please fill in all required fields.',
      );
      return;
    }

    if (name.length > 100) {
      showValidationError(
        'Resident name cannot exceed 100 characters.',
      );
      return;
    }

    if (flat.length > 20) {
      showValidationError(
        'Flat number cannot exceed 20 characters.',
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      showValidationError(
        'Enter a valid 10-digit Indian mobile number.',
      );
      return;
    }

    const duplicateMobile = residents.some(
      (resident) =>
        resident.mobile === mobile &&
        String(resident.id) !== String(editingId),
    );

    if (duplicateMobile) {
      showValidationError(
        'This mobile number is already registered.',
      );
      return;
    }

    const duplicateFlatAndName = residents.some(
      (resident) =>
        resident.flat.toUpperCase() === flat &&
        resident.name.toLowerCase() === name.toLowerCase() &&
        String(resident.id) !== String(editingId),
    );

    if (duplicateFlatAndName) {
      showValidationError(
        'This resident is already registered for that flat.',
      );
      return;
    }

    const payload = {
      name,
      mobile,
      flat_number: flat,
      status: form.status.toLowerCase(),
    };

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const response = await authFetch(
        isEditing
          ? `/api/residents/${editingId}`
          : '/api/residents',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to save resident.',
        );
      }

      const savedResident = mapResident(result.data);

      if (isEditing) {
        setResidents((current) =>
          current.map((resident) =>
            String(resident.id) === String(editingId)
              ? savedResident
              : resident,
          ),
        );

        toast.success(
          'Resident details updated successfully.',
        );
      } else {
        setResidents((current) => [
          ...current,
          savedResident,
        ]);

        toast.success('Resident added successfully.');
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setError('');
    } catch (err) {
      setError(err.message);

      toast.error(
        err.message || 'Unable to save resident details.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate a resident.
  const toggleStatus = async (resident) => {
    const nextStatus =
      resident.status === 'Active'
        ? 'Inactive'
        : 'Active';

    const isDeactivating = nextStatus === 'Inactive';

    const confirmation = await Swal.fire({
      title: isDeactivating
        ? 'Deactivate Resident?'
        : 'Activate Resident?',

      text: `Are you sure you want to ${
        isDeactivating ? 'deactivate' : 'activate'
      } ${resident.name}?`,

      icon: 'warning',
      showCancelButton: true,

      confirmButtonText: isDeactivating
        ? 'Yes, deactivate'
        : 'Yes, activate',

      cancelButtonText: 'Cancel',
      reverseButtons: true,

      confirmButtonColor: isDeactivating
        ? '#dc2626'
        : '#16a34a',

      cancelButtonColor: '#64748b',

      customClass: {
        popup: 'parkownerqr-swal-popup',
        title: 'parkownerqr-swal-title',
        confirmButton: 'parkownerqr-swal-confirm',
        cancelButton: 'parkownerqr-swal-cancel',
      },
    });

    if (!confirmation.isConfirmed) return;

    try {
      const response = await authFetch(
        `/api/residents/${resident.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: resident.name,
            mobile: resident.mobile,
            flat_number: resident.flat,
            status: nextStatus.toLowerCase(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to update resident status.',
        );
      }

      const updatedResident = mapResident(result.data);

      setResidents((current) =>
        current.map((item) =>
          String(item.id) === String(resident.id)
            ? updatedResident
            : item,
        ),
      );

      toast.success(
        `${resident.name} ${
          isDeactivating ? 'deactivated' : 'activated'
        } successfully.`,
      );
    } catch (err) {
      toast.error(
        err.message || 'Unable to change resident status.',
      );
    }
  };

  const activeCount = residents.filter(
    (resident) => resident.status === 'Active',
  ).length;

  return (
    <div className="dashboard residents-page">
      <section className="dashboard__welcome">
        <div>
          <span className="dashboard__eyebrow">
            SOCIETY MANAGEMENT
          </span>

          <h1>Residents</h1>

          <p>
            Manage society members and their registered mobile
            numbers.
          </p>
        </div>

        <button
          className="residents-page__primary-button"
          type="button"
          onClick={openAddForm}
          disabled={loading || saving}
        >
          <Plus size={18} />
          Add Resident
        </button>
      </section>

      <section className="residents-page__stats">
        <article className="residents-page__stat">
          <span className="residents-page__stat-icon">
            <Users size={21} />
          </span>

          <div>
            <span>Total Residents</span>
            <strong>{residents.length}</strong>
          </div>
        </article>

        <article className="residents-page__stat">
          <span className="residents-page__stat-icon residents-page__stat-icon--green">
            <CheckCircle2 size={21} />
          </span>

          <div>
            <span>Active Members</span>
            <strong>{activeCount}</strong>
          </div>
        </article>
      </section>

      <section className="dashboard__section">
        <div className="residents-page__toolbar">
          <div>
            <h2>Society Members</h2>
            <p>
              Only active members should pass the membership
              check.
            </p>
          </div>

          <div className="residents-page__filters">
            <label className="residents-page__search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search name, flat, or mobile"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="residents-page__table-wrap">
          <table className="residents-page__table">
            <thead>
              <tr>
                <th>RESIDENT</th>
                <th>FLAT NUMBER</th>
                <th>MOBILE NUMBER</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan="5"
                    className="residents-page__empty"
                  >
                    Loading residents...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredResidents.map((resident) => (
                  <tr key={resident.id}>
                    <td>
                      <span className="residents-page__person">
                        <span className="residents-page__avatar">
                          {resident.name
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <strong>{resident.name}</strong>
                      </span>
                    </td>

                    <td>
                      <span className="residents-page__cell">
                        <Building2 size={15} />
                        {resident.flat}
                      </span>
                    </td>

                    <td>
                      <span className="residents-page__cell">
                        <Phone size={15} />
                        {resident.mobile}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`residents-page__status ${
                          resident.status === 'Active'
                            ? 'residents-page__status--active'
                            : 'residents-page__status--inactive'
                        }`}
                      >
                        {resident.status}
                      </span>
                    </td>

                    <td>
                      <div className="residents-page__actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(resident)}
                          aria-label={`Edit ${resident.name}`}
                          title="Edit resident"
                          disabled={saving}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(resident)}
                          aria-label={`Change status for ${resident.name}`}
                          title={
                            resident.status === 'Active'
                              ? 'Deactivate resident'
                              : 'Activate resident'
                          }
                          disabled={saving}
                        >
                          {resident.status === 'Active' ? (
                            <Ban size={15} />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredResidents.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="residents-page__empty"
                  >
                    No residents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          className="residents-page__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            className="residents-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resident-form-title"
          >
            <div className="residents-page__modal-header">
              <div>
                <h2 id="resident-form-title">
                  {editingId !== null
                    ? 'Edit Resident'
                    : 'Add Resident'}
                </h2>

                <p>
                  Enter the society member&apos;s details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Full name *

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="Enter resident name"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Flat number *

                <input
                  value={form.flat}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      flat: event.target.value,
                    })
                  }
                  placeholder="e.g. A-101"
                  maxLength={20}
                  required
                />
              </label>

              <label>
                Mobile number *

                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      mobile: event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10),
                    })
                  }
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                />
              </label>

              {/* Temporary password information — Add mode only */}
              {editingId === null && (
                <aside
                  className="residents-page__password-note"
                  aria-label="Default temporary password information"
                >
                  <div className="residents-page__password-note-icon">
                    <LockKeyhole size={21} />
                  </div>

                  <div className="residents-page__password-note-content">
                    <div className="residents-page__password-note-heading">
                      Default temporary password

                      <span className="residents-page__password-note-badge">
                        FIRST LOGIN
                      </span>
                    </div>

                    <p>
                      The first <strong>8 digits</strong> of the
                      resident&apos;s mobile number will be used
                      as their temporary password.
                    </p>

                    <div className="residents-page__password-note-example">
                      <div className="residents-page__password-example-item">
                        <span>Mobile number</span>
                        <code>9876543210</code>
                      </div>

                      <ArrowRight
                        size={17}
                        className="residents-page__password-note-arrow"
                      />

                      <div className="residents-page__password-example-item">
                        <span>Temporary password</span>
                        <code>98765432</code>
                      </div>
                    </div>

                    <div className="residents-page__password-note-reminder">
                      <ShieldCheck size={16} />

                      <span>
                        The resident must change this password
                        after their first login.
                      </span>
                    </div>
                  </div>
                </aside>
              )}

              <label>
                Membership status

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              {error && (
                <p
                  className="residents-page__error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="residents-page__modal-actions">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving}>
                  {saving
                    ? 'Saving...'
                    : editingId !== null
                      ? 'Save Changes'
                      : 'Add Resident'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Residents;