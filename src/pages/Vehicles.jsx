import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CarFront,
  Search,
  SlidersHorizontal,
  Eye,
  QrCode,
  Plus,
  X,
  Pencil,
} from 'lucide-react';
import './Vehicles.css';

const API_URL = '/api';

const emptyForm = {
  number: '',
  type: 'Car',
  model: '',
  residentId: '',
  owner: '',
  flat: '',
  qrStatus: 'Active',
};

function mapVehicle(vehicle) {
  const residentId = String(vehicle.resident_id ?? '');

  return {
    id: String(vehicle.id),
    publicId: vehicle.public_id,
    number: vehicle.registration_number ?? '',
    type: vehicle.vehicle_type ?? 'Car',
    model: vehicle.model ?? '',
    residentId,
    owner: vehicle.resident_name ?? '',
    flat: vehicle.flat_number ?? '',
    qrToken: vehicle.qr_token ?? '',
    qrStatus:
      (vehicle.qr_status ?? 'active').toLowerCase() === 'active'
        ? 'Active'
        : 'Inactive',
  };
}

function getErrorMessage(result, fallback) {
  return result?.message || fallback;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(
      'API returned HTML instead of JSON. Check your backend and Vite proxy.',
    );
  }

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      getErrorMessage(result, 'The request could not be completed.'),
    );
  }

  return result;
}

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [residents, setResidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ ...emptyForm });

  // Load vehicles and residents from the backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const [vehiclesResponse, residentsResponse] =
          await Promise.all([
            fetch(`${API_URL}/vehicles`, {
              signal: controller.signal,
            }),
            fetch(`${API_URL}/residents`, {
              signal: controller.signal,
            }),
          ]);

        const [vehiclesResult, residentsResult] =
          await Promise.all([
            parseResponse(vehiclesResponse),
            parseResponse(residentsResponse),
          ]);

        setVehicles(vehiclesResult.data.map(mapVehicle));

        setResidents(
          residentsResult.data.map((resident) => ({
            id: String(resident.id),
            name: resident.name,
            flat: resident.flat_number,
            mobile: resident.mobile,
            status:
              resident.status?.toLowerCase() === 'active'
                ? 'Active'
                : 'Inactive',
          })),
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error(
            err.message || 'Unable to load vehicle information.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, []);

  const activeResidents = useMemo(
    () =>
      residents.filter(
        (resident) => resident.status === 'Active',
      ),
    [residents],
  );

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch = [
        vehicle.number,
        vehicle.owner,
        vehicle.flat,
        vehicle.model,
        vehicle.type,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query),
      );

      const matchesType =
        typeFilter === 'All' || vehicle.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [vehicles, search, typeFilter]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (vehicle) => {
    setEditingId(vehicle.id);

    setForm({
      number: vehicle.number,
      type: vehicle.type,
      model: vehicle.model,
      residentId: vehicle.residentId,
      owner: vehicle.owner,
      flat: vehicle.flat,
      qrStatus: vehicle.qrStatus,
    });

    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
  };

  const handleOwnerChange = (event) => {
    const residentId = event.target.value;

    const resident = activeResidents.find(
      (item) => String(item.id) === residentId,
    );

    setForm((current) => ({
      ...current,
      residentId,
      owner: resident?.name ?? '',
      flat: resident?.flat ?? '',
    }));
  };

  const showFormError = (message) => {
    setError(message);
    toast.error(message);
  };

  // Add or edit a vehicle.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const number = form.number.trim().toUpperCase();
    const model = form.model.trim();

    if (!number || !form.residentId || !model) {
      showFormError('Please complete all required fields.');
      return;
    }

    if (number.length > 15) {
      showFormError(
        'Vehicle registration number cannot exceed 15 characters.',
      );
      return;
    }

    const duplicate = vehicles.some(
      (vehicle) =>
        vehicle.number.toUpperCase() === number &&
        String(vehicle.id) !== String(editingId),
    );

    if (duplicate) {
      showFormError(
        'This vehicle registration number already exists.',
      );
      return;
    }

    const resident = activeResidents.find(
      (item) => String(item.id) === String(form.residentId),
    );

    if (!resident) {
      showFormError('Please select an active resident.');
      return;
    }

    const payload = {
      registration_number: number,
      vehicle_type: form.type,
      resident_id: Number(form.residentId),

      // These two fields require backend/database support.
      model,
      qr_status: form.qrStatus.toLowerCase(),
    };

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/vehicles/${editingId}`
          : `${API_URL}/vehicles`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await parseResponse(response);

      const savedVehicle = mapVehicle({
        ...result.data,
        model: result.data.model ?? model,
        qr_status:
          result.data.qr_status ?? form.qrStatus,
        resident_name:
          result.data.resident_name ?? resident.name,
        flat_number:
          result.data.flat_number ?? resident.flat,
      });

      if (isEditing) {
        setVehicles((current) =>
          current.map((vehicle) =>
            String(vehicle.id) === String(editingId)
              ? savedVehicle
              : vehicle,
          ),
        );

        toast.success('Vehicle details updated successfully.');
      } else {
        setVehicles((current) => [
          ...current,
          savedVehicle,
        ]);

        toast.success('Vehicle registered successfully.');
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setError('');
    } catch (err) {
      showFormError(
        err.message || 'Could not save the vehicle.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vehicles-page">
      <div className="vehicles-page__heading">
        <div>
          <h2>Vehicle Management</h2>
          <p>
            View and manage vehicles registered in your society.
          </p>
        </div>

        <button
          type="button"
          className="vehicles-page__primary-button"
          onClick={openAddForm}
          disabled={loading || saving}
        >
          <Plus size={18} />
          Add Vehicle
        </button>
      </div>

      <div className="vehicles-page__summary">
        <div className="vehicles-page__summary-icon">
          <CarFront size={24} />
        </div>

        <div>
          <p>Total Registered Vehicles</p>
          <h3>{vehicles.length}</h3>
          <span>Vehicles registered in your society</span>
        </div>
      </div>

      <section className="vehicles-page__panel">
        <div className="vehicles-page__panel-heading">
          <div>
            <h3>Registered Vehicles</h3>
            <p>{filteredVehicles.length} vehicles found</p>
          </div>
        </div>

        <div className="vehicles-page__filters">
          <label className="vehicles-page__search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search vehicle, owner or flat..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </label>

          <label className="vehicles-page__type-filter">
            <SlidersHorizontal size={17} />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              aria-label="Filter by vehicle type"
            >
              <option value="All">All vehicle types</option>
              <option value="Car">Cars</option>
              <option value="Bike">Bikes</option>
              <option value="Scooter">Scooters</option>
            </select>
          </label>
        </div>

        <div className="vehicles-page__table-wrapper">
          <table className="vehicles-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Owner</th>
                <th>Flat</th>
                <th>Type</th>
                <th>QR Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="vehicles-table__empty">
                    Loading vehicles...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <div className="vehicles-table__vehicle">
                        <span className="vehicles-table__vehicle-icon">
                          <CarFront size={19} />
                        </span>

                        <span>
                          <strong>{vehicle.number}</strong>
                          <small>
                            {vehicle.model || 'Model not provided'}
                          </small>
                        </span>
                      </div>
                    </td>

                    <td>{vehicle.owner || '—'}</td>
                    <td>{vehicle.flat || '—'}</td>
                    <td>{vehicle.type}</td>

                    <td>
                      <span
                        className={`vehicles-table__status ${vehicle.qrStatus === 'Active'
                            ? 'vehicles-table__status--active'
                            : 'vehicles-table__status--inactive'
                          }`}
                      >
                        {vehicle.qrStatus}
                      </span>
                    </td>

                    <td>
                      <div className="vehicles-page__actions">
                        <button
                          type="button"
                          className="vehicles-table__view-button"
                          title="View vehicle"
                          aria-label={`View ${vehicle.number}`}
                          onClick={() =>
                            setSelectedVehicle(vehicle)
                          }
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          className="vehicles-table__view-button"
                          title="Edit vehicle"
                          aria-label={`Edit ${vehicle.number}`}
                          onClick={() => openEditForm(vehicle)}
                          disabled={saving}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="6" className="vehicles-table__empty">
                    <CarFront size={28} />
                    <strong>No vehicles found</strong>
                    <span>
                      Try changing your search or filter.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="vehicles-page__table-footer">
          Showing {filteredVehicles.length} of {vehicles.length}{' '}
          vehicles

          <span>
            <QrCode size={15} />
            QR codes are managed separately
          </span>
        </div>
      </section>

      {/* Add/Edit Vehicle Form */}
      {showForm && (
        <div
          className="vehicle-modal__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            className="vehicle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-modal-title"
          >
            <div className="vehicle-modal__header">
              <div>
                <h2 id="vehicle-modal-title">
                  {editingId ? 'Edit Vehicle' : 'Add Vehicle'}
                </h2>

                <p>
                  Register a vehicle for a society resident.
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
                Vehicle Registration Number *

                <input
                  value={form.number}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      number: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. GJ01XY1234"
                  maxLength={15}
                  required
                />
              </label>

              <label>
                Vehicle Owner *

                <select
                  value={form.residentId}
                  onChange={handleOwnerChange}
                  required
                >
                  <option value="">
                    Select a registered resident
                  </option>

                  {activeResidents.map((resident) => (
                    <option
                      key={resident.id}
                      value={resident.id}
                    >
                      {resident.name} — {resident.flat}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Flat Number

                <input value={form.flat} readOnly />
              </label>

              <label>
                Vehicle Type *

                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value,
                    })
                  }
                >
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                </select>
              </label>

              <label>
                Vehicle Model *

                <input
                  value={form.model}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      model: event.target.value,
                    })
                  }
                  placeholder="e.g. Maruti Suzuki Swift"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                QR Status

                <select
                  value={form.qrStatus}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      qrStatus: event.target.value,
                    })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              {error && (
                <p
                  className="vehicle-modal__error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="vehicle-modal__actions">
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
                    : editingId
                      ? 'Save Changes'
                      : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Vehicle Details */}
      {selectedVehicle && (
        <div
          className="vehicle-modal__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedVehicle(null);
            }
          }}
        >
          <section
            className="vehicle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-details-title"
          >
            <div className="vehicle-modal__header">
              <div>
                <h2 id="vehicle-details-title">
                  Vehicle Details
                </h2>
                <p>Registered vehicle information.</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="vehicle-modal__details">
              <p>
                <strong>Registration:</strong>{' '}
                {selectedVehicle.number}
              </p>

              <p>
                <strong>Owner:</strong>{' '}
                {selectedVehicle.owner || '—'}
              </p>

              <p>
                <strong>Flat:</strong>{' '}
                {selectedVehicle.flat || '—'}
              </p>

              <p>
                <strong>Type:</strong> {selectedVehicle.type}
              </p>

              <p>
                <strong>Model:</strong>{' '}
                {selectedVehicle.model || 'Not provided'}
              </p>

              <p>
                <strong>QR Status:</strong>{' '}
                {selectedVehicle.qrStatus}
              </p>

              {selectedVehicle.qrToken && (
                <p>
                  <strong>QR Token:</strong>{' '}
                  {selectedVehicle.qrToken}
                </p>
              )}
            </div>

            <div className="vehicle-modal__actions">
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const vehicleToEdit = selectedVehicle;
                  setSelectedVehicle(null);
                  openEditForm(vehicleToEdit);
                }}
              >
                Edit Vehicle
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Vehicles;