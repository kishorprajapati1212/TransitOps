// Shared display constants (labels + colors) used across the UI.

export const ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];

export const ROLE_LABELS = {
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

// Short descriptions + what each role is responsible for (used on the landing page).
export const ROLE_INFO = {
  fleet_manager: {
    label: 'Fleet Manager',
    blurb: 'Oversees fleet assets, maintenance, vehicle lifecycle and operational efficiency.',
    can: [
      'Register & manage vehicles and drivers',
      'Create, dispatch, complete and cancel trips',
      'Log maintenance, fuel and expenses',
      'View dashboards and full reports',
    ],
  },
  driver: {
    label: 'Driver',
    blurb: 'Creates trips, assigns vehicles and drivers, and monitors active deliveries.',
    can: [
      'Create new trips',
      'Dispatch and complete trips',
      'Cancel trips when needed',
      'Track their own active deliveries',
    ],
  },
  safety_officer: {
    label: 'Safety Officer',
    blurb: 'Ensures driver compliance, tracks license validity and monitors safety scores.',
    can: [
      'Review every driver profile',
      'Spot expired / expiring licenses',
      'Monitor safety scores',
      'Audit compliance reports',
    ],
  },
  financial_analyst: {
    label: 'Financial Analyst',
    blurb: 'Reviews operational expenses, fuel consumption, maintenance costs and profitability.',
    can: [
      'Review fuel & expense logs',
      'Analyse operational cost per vehicle',
      'Track fuel efficiency and ROI',
      'Export financial reports (CSV)',
    ],
  },
};

export const VEHICLE_STATUSES = ['available', 'on_trip', 'in_shop', 'retired'];
export const VEHICLE_STATUS_COLORS = {
  available: 'emerald',
  on_trip: 'sky',
  in_shop: 'amber',
  retired: 'slate',
};

export const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended'];
export const DRIVER_STATUS_COLORS = {
  available: 'emerald',
  on_trip: 'sky',
  off_duty: 'slate',
  suspended: 'rose',
};

export const TRIP_STATUSES = ['draft', 'dispatched', 'completed', 'cancelled'];
export const TRIP_STATUS_COLORS = {
  draft: 'slate',
  dispatched: 'sky',
  completed: 'emerald',
  cancelled: 'rose',
};

export const MAINTENANCE_STATUSES = ['open', 'closed'];
export const MAINTENANCE_STATUS_COLORS = { open: 'amber', closed: 'emerald' };

// Which sidebar items a given role may see (UX only; backend still enforces RBAC).
// The landing page is public; the items below live inside the authenticated app.
export const NAV_BY_ROLE = {
  fleet_manager: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'expenses', 'reports', 'users', 'settings'],
  driver: ['dashboard', 'trips', 'settings'],
  safety_officer: ['dashboard', 'drivers', 'reports', 'settings'],
  financial_analyst: ['dashboard', 'fuel', 'expenses', 'reports', 'settings'],
};

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', path: '/dashboard' },
  { key: 'vehicles', label: 'Vehicles', icon: 'truck', path: '/vehicles' },
  { key: 'drivers', label: 'Drivers', icon: 'user', path: '/drivers' },
  { key: 'trips', label: 'Trips', icon: 'route', path: '/trips' },
  { key: 'maintenance', label: 'Maintenance', icon: 'wrench', path: '/maintenance' },
  { key: 'fuel', label: 'Fuel & Expense', icon: 'fuel', path: '/fuel' },
  { key: 'expenses', label: 'Expenses', icon: 'receipt', path: '/expenses' },
  { key: 'reports', label: 'Reports', icon: 'chart', path: '/reports' },
  { key: 'users', label: 'Users', icon: 'shield', path: '/users' },
  { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
];

// The example workflow from the problem statement — used on the landing page
// timeline and on the dashboard "how it works" card.
export const WORKFLOW_STEPS = [
  { n: 1, title: 'Register a vehicle', desc: "Add 'Van-05' with a 500 kg capacity. Status = Available.", icon: 'truck', status: 'done' },
  { n: 2, title: 'Register a driver', desc: "Add 'Alex' with a valid driving license.", icon: 'user', status: 'done' },
  { n: 3, title: 'Create a trip', desc: 'Create a trip with Cargo Weight = 450 kg.', icon: 'route', status: 'done' },
  { n: 4, title: 'System validates', desc: "Validates 450 kg ≤ 500 kg and allows dispatch.", icon: 'check', status: 'done' },
  { n: 5, title: 'Dispatch', desc: 'Vehicle and Driver status automatically become On Trip.', icon: 'arrow', status: 'active' },
  { n: 6, title: 'Complete the trip', desc: 'Enter final odometer and fuel consumed.', icon: 'flag', status: 'pending' },
  { n: 7, title: 'Back to Available', desc: 'System marks both Vehicle and Driver as Available.', icon: 'check', status: 'pending' },
  { n: 8, title: 'Maintenance', desc: "Create a maintenance record (e.g. Oil Change). Vehicle → In Shop, hidden from dispatch.", icon: 'wrench', status: 'pending' },
  { n: 9, title: 'Reports update', desc: 'Operational cost and fuel efficiency refresh from the latest trip & fuel log.', icon: 'chart', status: 'pending' },
];

// Per-role "where do I go / what do I do" guidance shown on the dashboard.
export const ROLE_FLOW = {
  fleet_manager: [
    { to: '/vehicles', label: 'Add vehicles', desc: 'Build your fleet registry' },
    { to: '/drivers', label: 'Add drivers', desc: 'Onboard drivers & licenses' },
    { to: '/trips', label: 'Manage trips', desc: 'Create, dispatch & complete' },
    { to: '/reports', label: 'Review reports', desc: 'Cost, efficiency & ROI' },
  ],
  driver: [
    { to: '/trips', label: 'New trip', desc: 'Create a delivery trip' },
    { to: '/trips', label: 'Dispatch', desc: 'Send it On Trip' },
    { to: '/trips', label: 'Complete', desc: 'Close with odometer & fuel' },
  ],
  safety_officer: [
    { to: '/drivers', label: 'Driver compliance', desc: 'Review licenses & scores' },
    { to: '/reports', label: 'Expiring licenses', desc: 'Catch soon-to-expire licenses' },
  ],
  financial_analyst: [
    { to: '/fuel', label: 'Fuel logs', desc: 'Review fuel consumption' },
    { to: '/expenses', label: 'Expenses', desc: 'Audit operational spend' },
    { to: '/reports', label: 'Reports', desc: 'ROI & cost analytics' },
  ],
};

// Getting-started checklist driven by live KPIs on the dashboard.
export const GET_STARTED_CHECKS = [
  { key: 'vehicles', label: 'Register at least one vehicle', needed: (k) => k.totalVehicles > 0 },
  { key: 'drivers', label: 'Onboard at least one driver', needed: (k) => k.totalDrivers > 0 },
  { key: 'trips', label: 'Create your first trip', needed: (k) => k.totalTrips > 0 },
  { key: 'completed', label: 'Complete a trip', needed: (k) => k.completedTrips > 0 },
  { key: 'maintenance', label: 'Log a maintenance record', needed: (k) => k.totalMaintenance > 0 },
];
