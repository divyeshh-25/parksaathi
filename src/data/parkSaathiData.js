const RESIDENTS_KEY = 'parksaathi_demo_residents';
const VEHICLES_KEY = 'parksaathi_demo_vehicles';

const initialResidents = [
  {
    id: 1,
    name: 'Rahul Patel',
    flat: 'A-101',
    mobile: '9876543210',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Amit Shah',
    flat: 'B-204',
    mobile: '9876543211',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Priya Patel',
    flat: 'C-302',
    mobile: '9876543212',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Neha Desai',
    flat: 'A-305',
    mobile: '9876543213',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Karan Gosai',
    flat: 'A-101',
    mobile: '9313234850',
    status: 'Active',
  },
];

const initialVehicles = [
  {
    id: 'CAR001',
    number: 'GJ01AB1234',
    owner: 'Amit Patel',
    flat: 'A-101',
    type: 'Car',
    model: 'Maruti Suzuki Baleno',
    qrStatus: 'Active',
  },
  {
    id: 'CAR002',
    number: 'GJ01CD5678',
    owner: 'Neha Shah',
    flat: 'A-102',
    type: 'Car',
    model: 'Hyundai i20',
    qrStatus: 'Active',
  },
  {
    id: 'CAR003',
    number: 'GJ01EF9012',
    owner: 'Rahul Mehta',
    flat: 'B-201',
    type: 'Car',
    model: 'Tata Nexon',
    qrStatus: 'Active',
  },
  {
    id: 'CAR004',
    number: 'GJ01GH3456',
    owner: 'Priya Desai',
    flat: 'B-202',
    type: 'Car',
    model: 'Mahindra XUV300',
    qrStatus: 'Inactive',
  },
  {
    id: 'CAR005',
    number: 'GJ01JK7890',
    owner: 'Karan Joshi',
    flat: 'C-301',
    type: 'Car',
    model: 'Honda City',
    qrStatus: 'Active',
  },
];

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (saved === null) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getResidents() {
  return readStorage(RESIDENTS_KEY, initialResidents);
}

export function saveResidents(residents) {
  localStorage.setItem(RESIDENTS_KEY, JSON.stringify(residents));
}

export function getVehicles() {
  return readStorage(VEHICLES_KEY, initialVehicles);
}

export function saveVehicles(vehicles) {
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

export function getVehicleById(id) {
  return getVehicles().find(
    (vehicle) => String(vehicle.id) === String(id),
  );
}