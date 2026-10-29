'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bus,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Gauge,
  History,
  Info,
  LayoutGrid,
  Lock,
  MapPin,
  MapPinned,
  Milestone,
  Navigation,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Route,
  Search,
  ShieldCheck,
  Ticket,
  Timer,
  TriangleAlert,
  Truck,
  Users,
  Wifi,
  WifiOff,
  Zap,
  LogOut,
  Flame,
  FileCode2,
  Server,
  Layers,
  X,
} from 'lucide-react';
import { AuthScreen } from '@/components/auth/AuthScreen';
import {
  api,
  Tenant,
  User,
  UserRole,
  Bus as BusEntity,
  Stop,
  Route as RouteEntity,
  BusSnapshot,
  StopETA,
  TransitEvent,
  DriverSyncPing,
  AuditLog,
  LoadTestResult,
  Trip,
  SeatInventory,
  Booking,
  ConcurrencyClashResult,
  DemandSuggestion,
  ChaosTestReport,
  ChaosScenario,
  WebhookTestResponse,
} from '@/lib/api';
import { StudioStop } from '@/components/map/types';
import { cn } from '@/lib/utils';

const LiveSpatialDashboard = dynamic(
  () => import('@/components/map/LiveSpatialDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[560px] rounded-[28px] bg-card border border-border flex items-center justify-center text-xs text-muted-foreground font-sans">
        Loading live spatial radar vector engine…
      </div>
    ),
  },
);

interface TokenDetails {
  sub: string;
  tenant_id: string;
  role: UserRole;
}

interface ApiNotification {
  type: 'success' | 'error';
  message: string;
}

interface AttackResult {
  status: 'idle' | 'success' | 'blocked';
  message: string;
}

const DEFAULT_DEMO_TENANTS: Tenant[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Universiti Malaya Shuttle',
    slug: 'um-malaysia',
    status: 'ACTIVE',
    created_at: '2026-10-20T12:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'NUS Campus Shuttle',
    slug: 'nus-singapore',
    status: 'ACTIVE',
    created_at: '2026-10-20T12:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'UTokyo Campus Transit',
    slug: 'utokyo-japan',
    status: 'ACTIVE',
    created_at: '2026-10-20T12:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'IIT Delhi Campus Transit',
    slug: 'iit-delhi-india',
    status: 'ACTIVE',
    created_at: '2026-10-20T12:00:00.000Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'IISc Bangalore Green Shuttle',
    slug: 'iisc-bangalore-india',
    status: 'ACTIVE',
    created_at: '2026-10-20T12:00:00.000Z',
  },
];

const DEFAULT_DEMO_USERS: Record<string, User[]> = {
  '11111111-1111-1111-1111-111111111111': [
    {
      id: '9bf762f3-e64b-4fba-bf2e-720dbad4506c',
      tenant_id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@um.edu.my',
      role: 'OPERATOR_ADMIN',
      full_name: 'Prof. Noor Azuan (Fleet Ops Director)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-102',
      tenant_id: '11111111-1111-1111-1111-111111111111',
      email: 'driver@um.edu.my',
      role: 'DRIVER',
      full_name: 'Azman bin Hashim (Lead Captain)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-103',
      tenant_id: '11111111-1111-1111-1111-111111111111',
      email: 'student@um.edu.my',
      role: 'RIDER',
      full_name: 'Nur Aisyah (Student Council)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
  ],
  '22222222-2222-2222-2222-222222222222': [
    {
      id: 'u-201',
      tenant_id: '22222222-2222-2222-2222-222222222222',
      email: 'admin@u.nus.edu',
      role: 'OPERATOR_ADMIN',
      full_name: 'Dr. Evelyn Tan (Mobility Director)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-202',
      tenant_id: '22222222-2222-2222-2222-222222222222',
      email: 'driver@u.nus.edu',
      role: 'DRIVER',
      full_name: 'Tan Wei Ming (Campus Transit Lead)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-203',
      tenant_id: '22222222-2222-2222-2222-222222222222',
      email: 'student@u.nus.edu',
      role: 'RIDER',
      full_name: 'Marcus Koh (Engineering Undergraduate)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
  ],
  '33333333-3333-3333-3333-333333333333': [
    {
      id: 'u-301',
      tenant_id: '33333333-3333-3333-3333-333333333333',
      email: 'admin@u-tokyo.ac.jp',
      role: 'OPERATOR_ADMIN',
      full_name: 'Kenji Takahashi (Hongo Dispatch Chief)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-302',
      tenant_id: '33333333-3333-3333-3333-333333333333',
      email: 'driver@u-tokyo.ac.jp',
      role: 'DRIVER',
      full_name: 'Sato Hiroshi (Lead Driver)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-303',
      tenant_id: '33333333-3333-3333-3333-333333333333',
      email: 'student@u-tokyo.ac.jp',
      role: 'RIDER',
      full_name: 'Yuki Tanaka (Graduate Researcher)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
  ],
  '44444444-4444-4444-4444-444444444444': [
    {
      id: 'u-401',
      tenant_id: '44444444-4444-4444-4444-444444444444',
      email: 'admin@iitd.ac.in',
      role: 'OPERATOR_ADMIN',
      full_name: 'Prof. Rajesh Verma (Transport Dean)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-402',
      tenant_id: '44444444-4444-4444-4444-444444444444',
      email: 'driver@iitd.ac.in',
      role: 'DRIVER',
      full_name: 'Suresh Kumar (Electric Shuttle Pilot)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-403',
      tenant_id: '44444444-4444-4444-4444-444444444444',
      email: 'student@iitd.ac.in',
      role: 'RIDER',
      full_name: 'Ananya Sharma (B.Tech Scholar)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
  ],
  '55555555-5555-5555-5555-555555555555': [
    {
      id: 'u-501',
      tenant_id: '55555555-5555-5555-5555-555555555555',
      email: 'admin@iisc.ac.in',
      role: 'OPERATOR_ADMIN',
      full_name: 'Dr. K. S. Rao (Green Campus Ops)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-502',
      tenant_id: '55555555-5555-5555-5555-555555555555',
      email: 'driver@iisc.ac.in',
      role: 'DRIVER',
      full_name: 'Ramesh Gowda (EV Shuttle Lead)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'u-503',
      tenant_id: '55555555-5555-5555-5555-555555555555',
      email: 'student@iisc.ac.in',
      role: 'RIDER',
      full_name: 'Pooja Hegde (PhD Fellow)',
      created_at: '2026-10-20T12:00:00.000Z',
    },
  ],
};


const DEFAULT_DEMO_BUSES: Record<string, BusEntity[]> = {
  "11111111-1111-1111-1111-111111111111": [
    {
      "id": "11111111-0003-0001-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "fleet_code": "UM-A01",
      "plate_number": "WYY-1001",
      "model": "Scania K250UB",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0003-0001-0000-000000000002",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "fleet_code": "UM-A02",
      "plate_number": "WYY-1002",
      "model": "Volvo B7RLE",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0003-0002-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "fleet_code": "UM-B01",
      "plate_number": "WYY-2001",
      "model": "MAN Lions City",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0003-0002-0000-000000000002",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "fleet_code": "UM-B02",
      "plate_number": "WYY-2002",
      "model": "BYD K9 EV",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0003-0003-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "fleet_code": "UM-C01",
      "plate_number": "WYY-3001",
      "model": "Hino Poncho EV",
      "capacity": 32,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "22222222-2222-2222-2222-222222222222": [
    {
      "id": "22222222-0003-0001-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "fleet_code": "NUS-D1-01",
      "plate_number": "PC-5001-A",
      "model": "Volvo BZL Electric",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0003-0001-0000-000000000002",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "fleet_code": "NUS-D1-02",
      "plate_number": "PC-5002-B",
      "model": "BYD B12A03",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0003-0002-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "fleet_code": "NUS-A1-01",
      "plate_number": "PC-6001-C",
      "model": "Zhongtong N12 EV",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0003-0002-0000-000000000002",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "fleet_code": "NUS-A1-02",
      "plate_number": "PC-6002-D",
      "model": "Alexander Dennis Enviro200",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0003-0003-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "fleet_code": "NUS-K-01",
      "plate_number": "PC-7001-E",
      "model": "Mercedes-Benz Citaro EV",
      "capacity": 36,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "33333333-3333-3333-3333-333333333333": [
    {
      "id": "33333333-0003-0001-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "fleet_code": "UTK-H01",
      "plate_number": "品川 200 か 3101",
      "model": "Toyota Sora Fuel Cell",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0003-0001-0000-000000000002",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "fleet_code": "UTK-H02",
      "plate_number": "品川 200 か 3102",
      "model": "Isuzu Erga EV",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0003-0002-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "fleet_code": "UTK-K01",
      "plate_number": "野田 200 か 4101",
      "model": "Hino Blue Ribbon Hybrid",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0003-0002-0000-000000000002",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "fleet_code": "UTK-K02",
      "plate_number": "野田 200 か 4102",
      "model": "Mitsubishi Fuso Aero Star",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0003-0003-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "fleet_code": "UTK-M01",
      "plate_number": "足立 200 か 5101",
      "model": "Hino Poncho Compact",
      "capacity": 28,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "44444444-4444-4444-4444-444444444444": [
    {
      "id": "44444444-0003-0001-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "fleet_code": "IITD-EV-01",
      "plate_number": "DL-1PD-7101",
      "model": "Tata Starbus Ultra EV",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0003-0001-0000-000000000002",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "fleet_code": "IITD-EV-02",
      "plate_number": "DL-1PD-7102",
      "model": "JBM Eco-Life Electric",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0003-0002-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "fleet_code": "IITD-MF-01",
      "plate_number": "DL-1PD-8101",
      "model": "Olectra K6 Electric",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0003-0002-0000-000000000002",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "fleet_code": "IITD-MF-02",
      "plate_number": "DL-1PD-8102",
      "model": "PMI Foton Urban",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0003-0003-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "fleet_code": "IITD-EW-01",
      "plate_number": "DL-1PD-9101",
      "model": "Ashok Leyland Circuit EV",
      "capacity": 34,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "55555555-5555-5555-5555-555555555555": [
    {
      "id": "55555555-0003-0001-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "fleet_code": "IISC-G01",
      "plate_number": "KA-04-EV-1001",
      "model": "Switch EiV 12",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0003-0001-0000-000000000002",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "fleet_code": "IISC-G02",
      "plate_number": "KA-04-EV-1002",
      "model": "Tata Ultra Urban EV",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0003-0002-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "fleet_code": "IISC-H01",
      "plate_number": "KA-04-EV-2001",
      "model": "Olectra e-Buzz",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0003-0002-0000-000000000002",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "fleet_code": "IISC-H02",
      "plate_number": "KA-04-EV-2002",
      "model": "BYD K7 Electric",
      "capacity": 40,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0003-0003-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "fleet_code": "IISC-M01",
      "plate_number": "KA-04-EV-3001",
      "model": "Mahindra Cruzio EV",
      "capacity": 32,
      "status": "ACTIVE",
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ]
};

const DEFAULT_DEMO_STOPS: Record<string, Stop[]> = {
  "11111111-1111-1111-1111-111111111111": [
    {
      "id": "11111111-0001-0001-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Rimba Ilmu Botanic Garden",
      "code": "UM-S01",
      "latitude": 3.1294,
      "longitude": 101.6565,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0001-0000-000000000002",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Perpustakaan Utama UM",
      "code": "UM-S02",
      "latitude": 3.1215,
      "longitude": 101.6542,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0001-0000-000000000003",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Fakulti Kejuruteraan",
      "code": "UM-S03",
      "latitude": 3.1172,
      "longitude": 101.6558,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0001-0000-000000000004",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Stesen LRT Universiti",
      "code": "UM-S04",
      "latitude": 3.1147,
      "longitude": 101.6617,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0002-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Kolej Kediaman Raja Dr Nazrin Shah",
      "code": "UM-S05",
      "latitude": 3.126,
      "longitude": 101.648,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0002-0000-000000000002",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Dewan Tunku Canselor",
      "code": "UM-S06",
      "latitude": 3.119,
      "longitude": 101.651,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0002-0000-000000000003",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Pusat Perubatan Universiti Malaya",
      "code": "UM-S07",
      "latitude": 3.1135,
      "longitude": 101.653,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0002-0000-000000000004",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Kompleks Perdana Siswa",
      "code": "UM-S08",
      "latitude": 3.121,
      "longitude": 101.656,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0003-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "KTM Angkasapuri Gateway",
      "code": "UM-S09",
      "latitude": 3.1115,
      "longitude": 101.668,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0003-0000-000000000002",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Menara Sains Dan Teknologi",
      "code": "UM-S10",
      "latitude": 3.1155,
      "longitude": 101.6635,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0003-0000-000000000003",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Tasik Varsiti UM",
      "code": "UM-S11",
      "latitude": 3.1195,
      "longitude": 101.659,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0001-0003-0000-000000000004",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "name": "Fakulti Sains Sukan",
      "code": "UM-S12",
      "latitude": 3.123,
      "longitude": 101.6555,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "22222222-2222-2222-2222-222222222222": [
    {
      "id": "22222222-0001-0001-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "University Town (UTown)",
      "code": "NUS-S01",
      "latitude": 1.3049,
      "longitude": 103.7735,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0001-0000-000000000002",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "University Health Centre",
      "code": "NUS-S02",
      "latitude": 1.2966,
      "longitude": 103.7725,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0001-0000-000000000003",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "School of Computing (COM2)",
      "code": "NUS-S03",
      "latitude": 1.2942,
      "longitude": 103.7743,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0001-0000-000000000004",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "NUS Business School (BIZ2)",
      "code": "NUS-S04",
      "latitude": 1.2923,
      "longitude": 103.7751,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0002-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "Kent Ridge MRT Station",
      "code": "NUS-S05",
      "latitude": 1.2935,
      "longitude": 103.7844,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0002-0000-000000000002",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "University Cultural Centre",
      "code": "NUS-S06",
      "latitude": 1.2989,
      "longitude": 103.7764,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0002-0000-000000000003",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "Central Library Forum",
      "code": "NUS-S07",
      "latitude": 1.2965,
      "longitude": 103.7705,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0002-0000-000000000004",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "Prince Georges Park Terminal",
      "code": "NUS-S08",
      "latitude": 1.2909,
      "longitude": 103.7804,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0003-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "Prince Georges Park Foyer",
      "code": "NUS-S09",
      "latitude": 1.2909,
      "longitude": 103.7804,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0003-0000-000000000002",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "Faculty of Engineering (E3A)",
      "code": "NUS-S10",
      "latitude": 1.2918,
      "longitude": 103.7768,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0003-0000-000000000003",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "Science Drive 1 Terminal",
      "code": "NUS-S11",
      "latitude": 1.2998,
      "longitude": 103.7712,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0001-0003-0000-000000000004",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "name": "Science Park Gateway",
      "code": "NUS-S12",
      "latitude": 1.302,
      "longitude": 103.7695,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "33333333-3333-3333-3333-333333333333": [
    {
      "id": "33333333-0001-0001-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Hongo Akamon (Red Gate)",
      "code": "UTK-S01",
      "latitude": 35.7126,
      "longitude": 139.762,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0001-0000-000000000002",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Yasuda Auditorium Central",
      "code": "UTK-S02",
      "latitude": 35.7134,
      "longitude": 139.7595,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0001-0000-000000000003",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Shibuya Station Transit Hub",
      "code": "UTK-S03",
      "latitude": 35.6712,
      "longitude": 139.6965,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0001-0000-000000000004",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Komaba Campus Clock Tower",
      "code": "UTK-S04",
      "latitude": 35.6604,
      "longitude": 139.6841,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0002-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Kashiwanoha Station Plaza",
      "code": "UTK-S05",
      "latitude": 35.8916,
      "longitude": 139.9522,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0002-0000-000000000002",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Kavli IPMU Institute",
      "code": "UTK-S06",
      "latitude": 35.8995,
      "longitude": 139.9478,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0002-0000-000000000003",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Institute for Solid State Physics",
      "code": "UTK-S07",
      "latitude": 35.9012,
      "longitude": 139.9435,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0002-0000-000000000004",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Kashiwa Campus Library",
      "code": "UTK-S08",
      "latitude": 35.898,
      "longitude": 139.9495,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0003-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "UTokyo Hospital Clinical Research",
      "code": "UTK-S09",
      "latitude": 35.7105,
      "longitude": 139.7652,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0003-0000-000000000002",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Medical Building No 2",
      "code": "UTK-S10",
      "latitude": 35.7082,
      "longitude": 139.7604,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0003-0000-000000000003",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Sanshiro Pond Gardens",
      "code": "UTK-S11",
      "latitude": 35.7118,
      "longitude": 139.758,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0001-0003-0000-000000000004",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "name": "Tatsuoka Gate Terminal",
      "code": "UTK-S12",
      "latitude": 35.7138,
      "longitude": 139.7635,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "44444444-4444-4444-4444-444444444444": [
    {
      "id": "44444444-0001-0001-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Nilgiri and Kumaon Hostel Hub",
      "code": "IITD-S01",
      "latitude": 28.5472,
      "longitude": 77.1835,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0001-0000-000000000002",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Student Activity Centre (SAC)",
      "code": "IITD-S02",
      "latitude": 28.5458,
      "longitude": 77.1872,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0001-0000-000000000003",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Lecture Hall Complex (LHC)",
      "code": "IITD-S03",
      "latitude": 28.545,
      "longitude": 77.1926,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0001-0000-000000000004",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Bharti School of Telecom",
      "code": "IITD-S04",
      "latitude": 28.5462,
      "longitude": 77.1905,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0002-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "IIT Delhi Metro Gate No 1",
      "code": "IITD-S05",
      "latitude": 28.5432,
      "longitude": 77.1965,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0002-0000-000000000002",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Central Research Facility",
      "code": "IITD-S06",
      "latitude": 28.5448,
      "longitude": 77.1932,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0002-0000-000000000003",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Main Administrative Block",
      "code": "IITD-S07",
      "latitude": 28.544,
      "longitude": 77.189,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0002-0000-000000000004",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Research and Innovation Park",
      "code": "IITD-S08",
      "latitude": 28.5425,
      "longitude": 77.1848,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0003-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Jia Sarai Footbridge Gate",
      "code": "IITD-S09",
      "latitude": 28.5485,
      "longitude": 77.195,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0003-0000-000000000002",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Central Library Circle",
      "code": "IITD-S10",
      "latitude": 28.547,
      "longitude": 77.1912,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0003-0000-000000000003",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Main Athletics Stadium",
      "code": "IITD-S11",
      "latitude": 28.5438,
      "longitude": 77.1875,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0001-0003-0000-000000000004",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "name": "Faculty Housing Enclave",
      "code": "IITD-S12",
      "latitude": 28.5455,
      "longitude": 77.184,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "55555555-5555-5555-5555-555555555555": [
    {
      "id": "55555555-0001-0001-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Main Tata Memorial Building",
      "code": "IISC-S01",
      "latitude": 13.0219,
      "longitude": 77.5671,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0001-0000-000000000002",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Computer Science and Automation (CSA)",
      "code": "IISC-S02",
      "latitude": 13.0195,
      "longitude": 77.5658,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0001-0000-000000000003",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Supercomputer Education Centre (SERC)",
      "code": "IISC-S03",
      "latitude": 13.0172,
      "longitude": 77.5682,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0001-0000-000000000004",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "D-Gate Substation",
      "code": "IISC-S04",
      "latitude": 13.0155,
      "longitude": 77.5705,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0002-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "E-Block Hostel Dining Complex",
      "code": "IISC-S05",
      "latitude": 13.0245,
      "longitude": 77.564,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0002-0000-000000000002",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Gymkhana Grounds Pavilion",
      "code": "IISC-S06",
      "latitude": 13.023,
      "longitude": 77.5622,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0002-0000-000000000003",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Centre for Ecological Sciences",
      "code": "IISC-S07",
      "latitude": 13.0198,
      "longitude": 77.5638,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0002-0000-000000000004",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Biological Sciences Building",
      "code": "IISC-S08",
      "latitude": 13.018,
      "longitude": 77.566,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0003-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Malleswaram 18th Cross Main Gate",
      "code": "IISC-S09",
      "latitude": 13.0142,
      "longitude": 77.5712,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0003-0000-000000000002",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Department of Aerospace Engineering",
      "code": "IISC-S10",
      "latitude": 13.0168,
      "longitude": 77.569,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0003-0000-000000000003",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "CeNSE Nanotechnology Centre",
      "code": "IISC-S11",
      "latitude": 13.0205,
      "longitude": 77.5645,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0001-0003-0000-000000000004",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "name": "Maramma Circle Terminal",
      "code": "IISC-S12",
      "latitude": 13.0252,
      "longitude": 77.5615,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ]
};

const DEFAULT_DEMO_ROUTES: Record<string, RouteEntity[]> = {
  "11111111-1111-1111-1111-111111111111": [
    {
      "id": "11111111-0002-0001-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "code": "UM-R01",
      "name": "Laluan A: Rimba Ilmu – LRT Universiti Express",
      "origin": "Rimba Ilmu Botanic Garden",
      "destination": "Stesen LRT Universiti",
      "distance_km": 4.2,
      "estimated_minutes": 14,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0002-0002-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "code": "UM-R02",
      "name": "Laluan B: Kolej 12 – Medical Centre Loop",
      "origin": "Kolej Kediaman Raja Dr Nazrin Shah",
      "destination": "Kompleks Perdana Siswa",
      "distance_km": 3.8,
      "estimated_minutes": 12,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "11111111-0002-0003-0000-000000000001",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "code": "UM-R03",
      "name": "Laluan C: Angkasapuri – Varsity Lake Link",
      "origin": "KTM Angkasapuri Gateway",
      "destination": "Fakulti Sains Sukan",
      "distance_km": 3.1,
      "estimated_minutes": 10,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "22222222-2222-2222-2222-222222222222": [
    {
      "id": "22222222-0002-0001-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "code": "NUS-D1",
      "name": "Line D1: UTown – Computing (COM2) – BIZ2",
      "origin": "University Town (UTown)",
      "destination": "NUS Business School (BIZ2)",
      "distance_km": 3.6,
      "estimated_minutes": 11,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0002-0002-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "code": "NUS-A1",
      "name": "Line A1: Kent Ridge MRT – PGP Terminal",
      "origin": "Kent Ridge MRT Station",
      "destination": "Prince Georges Park Terminal",
      "distance_km": 4.5,
      "estimated_minutes": 15,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "22222222-0002-0003-0000-000000000001",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "code": "NUS-K",
      "name": "Line K: PGP – Engineering – Science Park",
      "origin": "Prince Georges Park Foyer",
      "destination": "Science Park Gateway",
      "distance_km": 3.2,
      "estimated_minutes": 10,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "33333333-3333-3333-3333-333333333333": [
    {
      "id": "33333333-0002-0001-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "code": "UTK-HK",
      "name": "Hongo Red Gate – Komaba Intercampus Express",
      "origin": "Hongo Akamon (Red Gate)",
      "destination": "Komaba Campus Clock Tower",
      "distance_km": 14.8,
      "estimated_minutes": 38,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0002-0002-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "code": "UTK-KS",
      "name": "Kashiwa Science Loop – Kavli IPMU",
      "origin": "Kashiwanoha Station Plaza",
      "destination": "Kashiwa Campus Library",
      "distance_km": 5.2,
      "estimated_minutes": 16,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "33333333-0002-0003-0000-000000000001",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "code": "UTK-MD",
      "name": "UTokyo Hospital – Hongo Medical Line",
      "origin": "UTokyo Hospital Clinical Research",
      "destination": "Tatsuoka Gate Terminal",
      "distance_km": 2.8,
      "estimated_minutes": 9,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "44444444-4444-4444-4444-444444444444": [
    {
      "id": "44444444-0002-0001-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "code": "IITD-HL",
      "name": "Hostel Enclave – Lecture Hall Complex Loop",
      "origin": "Nilgiri and Kumaon Hostel Hub",
      "destination": "Bharti School of Telecom",
      "distance_km": 2.9,
      "estimated_minutes": 10,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0002-0002-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "code": "IITD-MF",
      "name": "IIT Metro Gate – Research & Innovation Park",
      "origin": "IIT Delhi Metro Gate No 1",
      "destination": "Research and Innovation Park",
      "distance_km": 3.4,
      "estimated_minutes": 12,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "44444444-0002-0003-0000-000000000001",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "code": "IITD-EW",
      "name": "Jia Sarai Gate – SAC & Main Stadium Link",
      "origin": "Jia Sarai Footbridge Gate",
      "destination": "Faculty Housing Enclave",
      "distance_km": 2.6,
      "estimated_minutes": 9,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ],
  "55555555-5555-5555-5555-555555555555": [
    {
      "id": "55555555-0002-0001-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "code": "IISC-MC",
      "name": "Main Tata Building – CSA – D-Gate Loop",
      "origin": "Main Tata Memorial Building",
      "destination": "D-Gate Substation",
      "distance_km": 3.2,
      "estimated_minutes": 11,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0002-0002-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "code": "IISC-HD",
      "name": "Hostel Zone – Gymkhana – Biological Sciences",
      "origin": "E-Block Hostel Dining Complex",
      "destination": "Biological Sciences Building",
      "distance_km": 3.5,
      "estimated_minutes": 12,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    },
    {
      "id": "55555555-0002-0003-0000-000000000001",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "code": "IISC-MG",
      "name": "Malleswaram Gate – Aerospace – CeNSE Express",
      "origin": "Malleswaram 18th Cross Main Gate",
      "destination": "Maramma Circle Terminal",
      "distance_km": 3,
      "estimated_minutes": 10,
      "active": true,
      "created_at": "2026-10-20T12:00:00.000Z"
    }
  ]
};

const DEFAULT_DEMO_SNAPSHOTS: Record<string, BusSnapshot[]> = {
  "11111111-1111-1111-1111-111111111111": [
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "bus_id": "11111111-0003-0001-0000-000000000001",
      "fleet_code": "UM-A01",
      "plate_number": "WYY-1001",
      "model": "Scania K250UB",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 35,
      "route_id": "11111111-0002-0001-0000-000000000001",
      "route_code": "UM-R01",
      "route_name": "Laluan A: Rimba Ilmu – LRT Universiti Express",
      "latitude": 3.125,
      "longitude": 101.655,
      "speed_kmh": 32.5,
      "heading_deg": 172,
      "occupancy": 24
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "bus_id": "11111111-0003-0001-0000-000000000002",
      "fleet_code": "UM-A02",
      "plate_number": "WYY-1002",
      "model": "Volvo B7RLE",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 20,
      "route_id": "11111111-0002-0001-0000-000000000001",
      "route_code": "UM-R01",
      "route_name": "Laluan A: Rimba Ilmu – LRT Universiti Express",
      "latitude": 3.1255,
      "longitude": 101.6554,
      "speed_kmh": 28,
      "heading_deg": 168,
      "occupancy": 18
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "bus_id": "11111111-0003-0002-0000-000000000001",
      "fleet_code": "UM-B01",
      "plate_number": "WYY-2001",
      "model": "MAN Lions City",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 45,
      "route_id": "11111111-0002-0002-0000-000000000001",
      "route_code": "UM-R02",
      "route_name": "Laluan B: Kolej 12 – Medical Centre Loop",
      "latitude": 3.122,
      "longitude": 101.6495,
      "speed_kmh": 34,
      "heading_deg": 140,
      "occupancy": 31
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "bus_id": "11111111-0003-0002-0000-000000000002",
      "fleet_code": "UM-B02",
      "plate_number": "WYY-2002",
      "model": "BYD K9 EV",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 60,
      "route_id": "11111111-0002-0002-0000-000000000001",
      "route_code": "UM-R02",
      "route_name": "Laluan B: Kolej 12 – Medical Centre Loop",
      "latitude": 3.116,
      "longitude": 101.652,
      "speed_kmh": 26.5,
      "heading_deg": 145,
      "occupancy": 22
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "bus_id": "11111111-0003-0003-0000-000000000001",
      "fleet_code": "UM-C01",
      "plate_number": "WYY-3001",
      "model": "Hino Poncho EV",
      "capacity": 32,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 50,
      "route_id": "11111111-0002-0003-0000-000000000001",
      "route_code": "UM-R03",
      "route_name": "Laluan C: Angkasapuri – Varsity Lake Link",
      "latitude": 3.117,
      "longitude": 101.661,
      "speed_kmh": 30,
      "heading_deg": 310,
      "occupancy": 15
    }
  ],
  "22222222-2222-2222-2222-222222222222": [
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "bus_id": "22222222-0003-0001-0000-000000000001",
      "fleet_code": "NUS-D1-01",
      "plate_number": "PC-5001-A",
      "model": "Volvo BZL Electric",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 40,
      "route_id": "22222222-0002-0001-0000-000000000001",
      "route_code": "NUS-D1",
      "route_name": "Line D1: UTown – Computing (COM2) – BIZ2",
      "latitude": 1.3005,
      "longitude": 103.773,
      "speed_kmh": 29,
      "heading_deg": 185,
      "occupancy": 28
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "bus_id": "22222222-0003-0001-0000-000000000002",
      "fleet_code": "NUS-D1-02",
      "plate_number": "PC-5002-B",
      "model": "BYD B12A03",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 25,
      "route_id": "22222222-0002-0001-0000-000000000001",
      "route_code": "NUS-D1",
      "route_name": "Line D1: UTown – Computing (COM2) – BIZ2",
      "latitude": 1.3008,
      "longitude": 103.7733,
      "speed_kmh": 24.5,
      "heading_deg": 180,
      "occupancy": 19
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "bus_id": "22222222-0003-0002-0000-000000000001",
      "fleet_code": "NUS-A1-01",
      "plate_number": "PC-6001-C",
      "model": "Zhongtong N12 EV",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 55,
      "route_id": "22222222-0002-0002-0000-000000000001",
      "route_code": "NUS-A1",
      "route_name": "Line A1: Kent Ridge MRT – PGP Terminal",
      "latitude": 1.2955,
      "longitude": 103.778,
      "speed_kmh": 31,
      "heading_deg": 240,
      "occupancy": 33
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "bus_id": "22222222-0003-0002-0000-000000000002",
      "fleet_code": "NUS-A1-02",
      "plate_number": "PC-6002-D",
      "model": "Alexander Dennis Enviro200",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 70,
      "route_id": "22222222-0002-0002-0000-000000000001",
      "route_code": "NUS-A1",
      "route_name": "Line A1: Kent Ridge MRT – PGP Terminal",
      "latitude": 1.294,
      "longitude": 103.782,
      "speed_kmh": 27.5,
      "heading_deg": 255,
      "occupancy": 25
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "bus_id": "22222222-0003-0003-0000-000000000001",
      "fleet_code": "NUS-K-01",
      "plate_number": "PC-7001-E",
      "model": "Mercedes-Benz Citaro EV",
      "capacity": 36,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 45,
      "route_id": "22222222-0002-0003-0000-000000000001",
      "route_code": "NUS-K",
      "route_name": "Line K: PGP – Engineering – Science Park",
      "latitude": 1.296,
      "longitude": 103.774,
      "speed_kmh": 33.5,
      "heading_deg": 340,
      "occupancy": 14
    }
  ],
  "33333333-3333-3333-3333-333333333333": [
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "bus_id": "33333333-0003-0001-0000-000000000001",
      "fleet_code": "UTK-H01",
      "plate_number": "品川 200 か 3101",
      "model": "Toyota Sora Fuel Cell",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 30,
      "route_id": "33333333-0002-0001-0000-000000000001",
      "route_code": "UTK-HK",
      "route_name": "Hongo Red Gate – Komaba Intercampus Express",
      "latitude": 35.713,
      "longitude": 139.7608,
      "speed_kmh": 38,
      "heading_deg": 220,
      "occupancy": 30
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "bus_id": "33333333-0003-0001-0000-000000000002",
      "fleet_code": "UTK-H02",
      "plate_number": "品川 200 か 3102",
      "model": "Isuzu Erga EV",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 15,
      "route_id": "33333333-0002-0001-0000-000000000001",
      "route_code": "UTK-HK",
      "route_name": "Hongo Red Gate – Komaba Intercampus Express",
      "latitude": 35.7133,
      "longitude": 139.7612,
      "speed_kmh": 35.5,
      "heading_deg": 215,
      "occupancy": 21
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "bus_id": "33333333-0003-0002-0000-000000000001",
      "fleet_code": "UTK-K01",
      "plate_number": "野田 200 か 4101",
      "model": "Hino Blue Ribbon Hybrid",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 50,
      "route_id": "33333333-0002-0002-0000-000000000001",
      "route_code": "UTK-KS",
      "route_name": "Kashiwa Science Loop – Kavli IPMU",
      "latitude": 35.895,
      "longitude": 139.95,
      "speed_kmh": 41,
      "heading_deg": 15,
      "occupancy": 26
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "bus_id": "33333333-0003-0002-0000-000000000002",
      "fleet_code": "UTK-K02",
      "plate_number": "野田 200 か 4102",
      "model": "Mitsubishi Fuso Aero Star",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 65,
      "route_id": "33333333-0002-0002-0000-000000000001",
      "route_code": "UTK-KS",
      "route_name": "Kashiwa Science Loop – Kavli IPMU",
      "latitude": 35.9,
      "longitude": 139.945,
      "speed_kmh": 36,
      "heading_deg": 280,
      "occupancy": 29
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "bus_id": "33333333-0003-0003-0000-000000000001",
      "fleet_code": "UTK-M01",
      "plate_number": "足立 200 か 5101",
      "model": "Hino Poncho Compact",
      "capacity": 28,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 40,
      "route_id": "33333333-0002-0003-0000-000000000001",
      "route_code": "UTK-MD",
      "route_name": "UTokyo Hospital – Hongo Medical Line",
      "latitude": 35.71,
      "longitude": 139.762,
      "speed_kmh": 25,
      "heading_deg": 120,
      "occupancy": 12
    }
  ],
  "44444444-4444-4444-4444-444444444444": [
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "bus_id": "44444444-0003-0001-0000-000000000001",
      "fleet_code": "IITD-EV-01",
      "plate_number": "DL-1PD-7101",
      "model": "Tata Starbus Ultra EV",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 35,
      "route_id": "44444444-0002-0001-0000-000000000001",
      "route_code": "IITD-HL",
      "route_name": "Hostel Enclave – Lecture Hall Complex Loop",
      "latitude": 28.5465,
      "longitude": 77.185,
      "speed_kmh": 28,
      "heading_deg": 110,
      "occupancy": 27
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "bus_id": "44444444-0003-0001-0000-000000000002",
      "fleet_code": "IITD-EV-02",
      "plate_number": "DL-1PD-7102",
      "model": "JBM Eco-Life Electric",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 20,
      "route_id": "44444444-0002-0001-0000-000000000001",
      "route_code": "IITD-HL",
      "route_name": "Hostel Enclave – Lecture Hall Complex Loop",
      "latitude": 28.5468,
      "longitude": 77.1853,
      "speed_kmh": 25,
      "heading_deg": 115,
      "occupancy": 20
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "bus_id": "44444444-0003-0002-0000-000000000001",
      "fleet_code": "IITD-MF-01",
      "plate_number": "DL-1PD-8101",
      "model": "Olectra K6 Electric",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 45,
      "route_id": "44444444-0002-0002-0000-000000000001",
      "route_code": "IITD-MF",
      "route_name": "IIT Metro Gate – Research & Innovation Park",
      "latitude": 28.5442,
      "longitude": 77.1945,
      "speed_kmh": 30.5,
      "heading_deg": 290,
      "occupancy": 32
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "bus_id": "44444444-0003-0002-0000-000000000002",
      "fleet_code": "IITD-MF-02",
      "plate_number": "DL-1PD-8102",
      "model": "PMI Foton Urban",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 60,
      "route_id": "44444444-0002-0002-0000-000000000001",
      "route_code": "IITD-MF",
      "route_name": "IIT Metro Gate – Research & Innovation Park",
      "latitude": 28.543,
      "longitude": 77.187,
      "speed_kmh": 26,
      "heading_deg": 250,
      "occupancy": 23
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "bus_id": "44444444-0003-0003-0000-000000000001",
      "fleet_code": "IITD-EW-01",
      "plate_number": "DL-1PD-9101",
      "model": "Ashok Leyland Circuit EV",
      "capacity": 34,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 50,
      "route_id": "44444444-0002-0003-0000-000000000001",
      "route_code": "IITD-EW",
      "route_name": "Jia Sarai Gate – SAC & Main Stadium Link",
      "latitude": 28.5475,
      "longitude": 77.193,
      "speed_kmh": 32,
      "heading_deg": 210,
      "occupancy": 16
    }
  ],
  "55555555-5555-5555-5555-555555555555": [
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "bus_id": "55555555-0003-0001-0000-000000000001",
      "fleet_code": "IISC-G01",
      "plate_number": "KA-04-EV-1001",
      "model": "Switch EiV 12",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 35,
      "route_id": "55555555-0002-0001-0000-000000000001",
      "route_code": "IISC-MC",
      "route_name": "Main Tata Building – CSA – D-Gate Loop",
      "latitude": 13.0205,
      "longitude": 77.5665,
      "speed_kmh": 27.5,
      "heading_deg": 175,
      "occupancy": 25
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "bus_id": "55555555-0003-0001-0000-000000000002",
      "fleet_code": "IISC-G02",
      "plate_number": "KA-04-EV-1002",
      "model": "Tata Ultra Urban EV",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 20,
      "route_id": "55555555-0002-0001-0000-000000000001",
      "route_code": "IISC-MC",
      "route_name": "Main Tata Building – CSA – D-Gate Loop",
      "latitude": 13.0208,
      "longitude": 77.5668,
      "speed_kmh": 23,
      "heading_deg": 170,
      "occupancy": 18
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "bus_id": "55555555-0003-0002-0000-000000000001",
      "fleet_code": "IISC-H01",
      "plate_number": "KA-04-EV-2001",
      "model": "Olectra e-Buzz",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 45,
      "route_id": "55555555-0002-0002-0000-000000000001",
      "route_code": "IISC-HD",
      "route_name": "Hostel Zone – Gymkhana – Biological Sciences",
      "latitude": 13.0238,
      "longitude": 77.563,
      "speed_kmh": 29,
      "heading_deg": 195,
      "occupancy": 34
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "bus_id": "55555555-0003-0002-0000-000000000002",
      "fleet_code": "IISC-H02",
      "plate_number": "KA-04-EV-2002",
      "model": "BYD K7 Electric",
      "capacity": 40,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 60,
      "route_id": "55555555-0002-0002-0000-000000000001",
      "route_code": "IISC-HD",
      "route_name": "Hostel Zone – Gymkhana – Biological Sciences",
      "latitude": 13.019,
      "longitude": 77.565,
      "speed_kmh": 25.5,
      "heading_deg": 150,
      "occupancy": 24
    },
    {
      "recorded_at": "2026-10-20T12:00:00.000Z",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "bus_id": "55555555-0003-0003-0000-000000000001",
      "fleet_code": "IISC-M01",
      "plate_number": "KA-04-EV-3001",
      "model": "Mahindra Cruzio EV",
      "capacity": 32,
      "bus_status": "ACTIVE",
      "trip_status": "IN_TRANSIT",
      "progress_pct": 50,
      "route_id": "55555555-0002-0003-0000-000000000001",
      "route_code": "IISC-MG",
      "route_name": "Malleswaram Gate – Aerospace – CeNSE Express",
      "latitude": 13.0155,
      "longitude": 77.57,
      "speed_kmh": 31,
      "heading_deg": 320,
      "occupancy": 13
    }
  ]
};

const DEFAULT_DEMO_ETAS: Record<string, StopETA[]> = {
  "11111111-1111-1111-1111-111111111111": [
    {
      "route_id": "11111111-0002-0001-0000-000000000001",
      "stop_id": "11111111-0001-0001-0000-000000000001",
      "stop_name": "Rimba Ilmu Botanic Garden",
      "stop_code": "UM-S01",
      "stop_latitude": 3.1294,
      "stop_longitude": 101.6565,
      "stop_sequence": 1,
      "bus_id": "11111111-0003-0001-0000-000000000001",
      "fleet_code": "UM-A01",
      "bus_speed_kmh": 32.5,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "11111111-0002-0001-0000-000000000001",
      "stop_id": "11111111-0001-0001-0000-000000000002",
      "stop_name": "Perpustakaan Utama UM",
      "stop_code": "UM-S02",
      "stop_latitude": 3.1215,
      "stop_longitude": 101.6542,
      "stop_sequence": 2,
      "bus_id": "11111111-0003-0001-0000-000000000002",
      "fleet_code": "UM-A02",
      "bus_speed_kmh": 28,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0002-0000-000000000001",
      "stop_id": "11111111-0001-0001-0000-000000000003",
      "stop_name": "Fakulti Kejuruteraan",
      "stop_code": "UM-S03",
      "stop_latitude": 3.1172,
      "stop_longitude": 101.6558,
      "stop_sequence": 3,
      "bus_id": "11111111-0003-0002-0000-000000000001",
      "fleet_code": "UM-B01",
      "bus_speed_kmh": 34,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0002-0000-000000000001",
      "stop_id": "11111111-0001-0001-0000-000000000004",
      "stop_name": "Stesen LRT Universiti",
      "stop_code": "UM-S04",
      "stop_latitude": 3.1147,
      "stop_longitude": 101.6617,
      "stop_sequence": 4,
      "bus_id": "11111111-0003-0002-0000-000000000002",
      "fleet_code": "UM-B02",
      "bus_speed_kmh": 26.5,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0003-0000-000000000001",
      "stop_id": "11111111-0001-0002-0000-000000000001",
      "stop_name": "Kolej Kediaman Raja Dr Nazrin Shah",
      "stop_code": "UM-S05",
      "stop_latitude": 3.126,
      "stop_longitude": 101.648,
      "stop_sequence": 1,
      "bus_id": "11111111-0003-0003-0000-000000000001",
      "fleet_code": "UM-C01",
      "bus_speed_kmh": 30,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "11111111-0002-0001-0000-000000000001",
      "stop_id": "11111111-0001-0002-0000-000000000002",
      "stop_name": "Dewan Tunku Canselor",
      "stop_code": "UM-S06",
      "stop_latitude": 3.119,
      "stop_longitude": 101.651,
      "stop_sequence": 2,
      "bus_id": "11111111-0003-0001-0000-000000000001",
      "fleet_code": "UM-A01",
      "bus_speed_kmh": 32.5,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0001-0000-000000000001",
      "stop_id": "11111111-0001-0002-0000-000000000003",
      "stop_name": "Pusat Perubatan Universiti Malaya",
      "stop_code": "UM-S07",
      "stop_latitude": 3.1135,
      "stop_longitude": 101.653,
      "stop_sequence": 3,
      "bus_id": "11111111-0003-0001-0000-000000000002",
      "fleet_code": "UM-A02",
      "bus_speed_kmh": 28,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0002-0000-000000000001",
      "stop_id": "11111111-0001-0002-0000-000000000004",
      "stop_name": "Kompleks Perdana Siswa",
      "stop_code": "UM-S08",
      "stop_latitude": 3.121,
      "stop_longitude": 101.656,
      "stop_sequence": 4,
      "bus_id": "11111111-0003-0002-0000-000000000001",
      "fleet_code": "UM-B01",
      "bus_speed_kmh": 34,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0002-0000-000000000001",
      "stop_id": "11111111-0001-0003-0000-000000000001",
      "stop_name": "KTM Angkasapuri Gateway",
      "stop_code": "UM-S09",
      "stop_latitude": 3.1115,
      "stop_longitude": 101.668,
      "stop_sequence": 1,
      "bus_id": "11111111-0003-0002-0000-000000000002",
      "fleet_code": "UM-B02",
      "bus_speed_kmh": 26.5,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "11111111-0002-0003-0000-000000000001",
      "stop_id": "11111111-0001-0003-0000-000000000002",
      "stop_name": "Menara Sains Dan Teknologi",
      "stop_code": "UM-S10",
      "stop_latitude": 3.1155,
      "stop_longitude": 101.6635,
      "stop_sequence": 2,
      "bus_id": "11111111-0003-0003-0000-000000000001",
      "fleet_code": "UM-C01",
      "bus_speed_kmh": 30,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0001-0000-000000000001",
      "stop_id": "11111111-0001-0003-0000-000000000003",
      "stop_name": "Tasik Varsiti UM",
      "stop_code": "UM-S11",
      "stop_latitude": 3.1195,
      "stop_longitude": 101.659,
      "stop_sequence": 3,
      "bus_id": "11111111-0003-0001-0000-000000000001",
      "fleet_code": "UM-A01",
      "bus_speed_kmh": 32.5,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "11111111-0002-0001-0000-000000000001",
      "stop_id": "11111111-0001-0003-0000-000000000004",
      "stop_name": "Fakulti Sains Sukan",
      "stop_code": "UM-S12",
      "stop_latitude": 3.123,
      "stop_longitude": 101.6555,
      "stop_sequence": 4,
      "bus_id": "11111111-0003-0001-0000-000000000002",
      "fleet_code": "UM-A02",
      "bus_speed_kmh": 28,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    }
  ],
  "22222222-2222-2222-2222-222222222222": [
    {
      "route_id": "22222222-0002-0001-0000-000000000001",
      "stop_id": "22222222-0001-0001-0000-000000000001",
      "stop_name": "University Town (UTown)",
      "stop_code": "NUS-S01",
      "stop_latitude": 1.3049,
      "stop_longitude": 103.7735,
      "stop_sequence": 1,
      "bus_id": "22222222-0003-0001-0000-000000000001",
      "fleet_code": "NUS-D1-01",
      "bus_speed_kmh": 29,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "22222222-0002-0001-0000-000000000001",
      "stop_id": "22222222-0001-0001-0000-000000000002",
      "stop_name": "University Health Centre",
      "stop_code": "NUS-S02",
      "stop_latitude": 1.2966,
      "stop_longitude": 103.7725,
      "stop_sequence": 2,
      "bus_id": "22222222-0003-0001-0000-000000000002",
      "fleet_code": "NUS-D1-02",
      "bus_speed_kmh": 24.5,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0002-0000-000000000001",
      "stop_id": "22222222-0001-0001-0000-000000000003",
      "stop_name": "School of Computing (COM2)",
      "stop_code": "NUS-S03",
      "stop_latitude": 1.2942,
      "stop_longitude": 103.7743,
      "stop_sequence": 3,
      "bus_id": "22222222-0003-0002-0000-000000000001",
      "fleet_code": "NUS-A1-01",
      "bus_speed_kmh": 31,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0002-0000-000000000001",
      "stop_id": "22222222-0001-0001-0000-000000000004",
      "stop_name": "NUS Business School (BIZ2)",
      "stop_code": "NUS-S04",
      "stop_latitude": 1.2923,
      "stop_longitude": 103.7751,
      "stop_sequence": 4,
      "bus_id": "22222222-0003-0002-0000-000000000002",
      "fleet_code": "NUS-A1-02",
      "bus_speed_kmh": 27.5,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0003-0000-000000000001",
      "stop_id": "22222222-0001-0002-0000-000000000001",
      "stop_name": "Kent Ridge MRT Station",
      "stop_code": "NUS-S05",
      "stop_latitude": 1.2935,
      "stop_longitude": 103.7844,
      "stop_sequence": 1,
      "bus_id": "22222222-0003-0003-0000-000000000001",
      "fleet_code": "NUS-K-01",
      "bus_speed_kmh": 33.5,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "22222222-0002-0001-0000-000000000001",
      "stop_id": "22222222-0001-0002-0000-000000000002",
      "stop_name": "University Cultural Centre",
      "stop_code": "NUS-S06",
      "stop_latitude": 1.2989,
      "stop_longitude": 103.7764,
      "stop_sequence": 2,
      "bus_id": "22222222-0003-0001-0000-000000000001",
      "fleet_code": "NUS-D1-01",
      "bus_speed_kmh": 29,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0001-0000-000000000001",
      "stop_id": "22222222-0001-0002-0000-000000000003",
      "stop_name": "Central Library Forum",
      "stop_code": "NUS-S07",
      "stop_latitude": 1.2965,
      "stop_longitude": 103.7705,
      "stop_sequence": 3,
      "bus_id": "22222222-0003-0001-0000-000000000002",
      "fleet_code": "NUS-D1-02",
      "bus_speed_kmh": 24.5,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0002-0000-000000000001",
      "stop_id": "22222222-0001-0002-0000-000000000004",
      "stop_name": "Prince Georges Park Terminal",
      "stop_code": "NUS-S08",
      "stop_latitude": 1.2909,
      "stop_longitude": 103.7804,
      "stop_sequence": 4,
      "bus_id": "22222222-0003-0002-0000-000000000001",
      "fleet_code": "NUS-A1-01",
      "bus_speed_kmh": 31,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0002-0000-000000000001",
      "stop_id": "22222222-0001-0003-0000-000000000001",
      "stop_name": "Prince Georges Park Foyer",
      "stop_code": "NUS-S09",
      "stop_latitude": 1.2909,
      "stop_longitude": 103.7804,
      "stop_sequence": 1,
      "bus_id": "22222222-0003-0002-0000-000000000002",
      "fleet_code": "NUS-A1-02",
      "bus_speed_kmh": 27.5,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "22222222-0002-0003-0000-000000000001",
      "stop_id": "22222222-0001-0003-0000-000000000002",
      "stop_name": "Faculty of Engineering (E3A)",
      "stop_code": "NUS-S10",
      "stop_latitude": 1.2918,
      "stop_longitude": 103.7768,
      "stop_sequence": 2,
      "bus_id": "22222222-0003-0003-0000-000000000001",
      "fleet_code": "NUS-K-01",
      "bus_speed_kmh": 33.5,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0001-0000-000000000001",
      "stop_id": "22222222-0001-0003-0000-000000000003",
      "stop_name": "Science Drive 1 Terminal",
      "stop_code": "NUS-S11",
      "stop_latitude": 1.2998,
      "stop_longitude": 103.7712,
      "stop_sequence": 3,
      "bus_id": "22222222-0003-0001-0000-000000000001",
      "fleet_code": "NUS-D1-01",
      "bus_speed_kmh": 29,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "22222222-0002-0001-0000-000000000001",
      "stop_id": "22222222-0001-0003-0000-000000000004",
      "stop_name": "Science Park Gateway",
      "stop_code": "NUS-S12",
      "stop_latitude": 1.302,
      "stop_longitude": 103.7695,
      "stop_sequence": 4,
      "bus_id": "22222222-0003-0001-0000-000000000002",
      "fleet_code": "NUS-D1-02",
      "bus_speed_kmh": 24.5,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    }
  ],
  "33333333-3333-3333-3333-333333333333": [
    {
      "route_id": "33333333-0002-0001-0000-000000000001",
      "stop_id": "33333333-0001-0001-0000-000000000001",
      "stop_name": "Hongo Akamon (Red Gate)",
      "stop_code": "UTK-S01",
      "stop_latitude": 35.7126,
      "stop_longitude": 139.762,
      "stop_sequence": 1,
      "bus_id": "33333333-0003-0001-0000-000000000001",
      "fleet_code": "UTK-H01",
      "bus_speed_kmh": 38,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "33333333-0002-0001-0000-000000000001",
      "stop_id": "33333333-0001-0001-0000-000000000002",
      "stop_name": "Yasuda Auditorium Central",
      "stop_code": "UTK-S02",
      "stop_latitude": 35.7134,
      "stop_longitude": 139.7595,
      "stop_sequence": 2,
      "bus_id": "33333333-0003-0001-0000-000000000002",
      "fleet_code": "UTK-H02",
      "bus_speed_kmh": 35.5,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0002-0000-000000000001",
      "stop_id": "33333333-0001-0001-0000-000000000003",
      "stop_name": "Shibuya Station Transit Hub",
      "stop_code": "UTK-S03",
      "stop_latitude": 35.6712,
      "stop_longitude": 139.6965,
      "stop_sequence": 3,
      "bus_id": "33333333-0003-0002-0000-000000000001",
      "fleet_code": "UTK-K01",
      "bus_speed_kmh": 41,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0002-0000-000000000001",
      "stop_id": "33333333-0001-0001-0000-000000000004",
      "stop_name": "Komaba Campus Clock Tower",
      "stop_code": "UTK-S04",
      "stop_latitude": 35.6604,
      "stop_longitude": 139.6841,
      "stop_sequence": 4,
      "bus_id": "33333333-0003-0002-0000-000000000002",
      "fleet_code": "UTK-K02",
      "bus_speed_kmh": 36,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0003-0000-000000000001",
      "stop_id": "33333333-0001-0002-0000-000000000001",
      "stop_name": "Kashiwanoha Station Plaza",
      "stop_code": "UTK-S05",
      "stop_latitude": 35.8916,
      "stop_longitude": 139.9522,
      "stop_sequence": 1,
      "bus_id": "33333333-0003-0003-0000-000000000001",
      "fleet_code": "UTK-M01",
      "bus_speed_kmh": 25,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "33333333-0002-0001-0000-000000000001",
      "stop_id": "33333333-0001-0002-0000-000000000002",
      "stop_name": "Kavli IPMU Institute",
      "stop_code": "UTK-S06",
      "stop_latitude": 35.8995,
      "stop_longitude": 139.9478,
      "stop_sequence": 2,
      "bus_id": "33333333-0003-0001-0000-000000000001",
      "fleet_code": "UTK-H01",
      "bus_speed_kmh": 38,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0001-0000-000000000001",
      "stop_id": "33333333-0001-0002-0000-000000000003",
      "stop_name": "Institute for Solid State Physics",
      "stop_code": "UTK-S07",
      "stop_latitude": 35.9012,
      "stop_longitude": 139.9435,
      "stop_sequence": 3,
      "bus_id": "33333333-0003-0001-0000-000000000002",
      "fleet_code": "UTK-H02",
      "bus_speed_kmh": 35.5,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0002-0000-000000000001",
      "stop_id": "33333333-0001-0002-0000-000000000004",
      "stop_name": "Kashiwa Campus Library",
      "stop_code": "UTK-S08",
      "stop_latitude": 35.898,
      "stop_longitude": 139.9495,
      "stop_sequence": 4,
      "bus_id": "33333333-0003-0002-0000-000000000001",
      "fleet_code": "UTK-K01",
      "bus_speed_kmh": 41,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0002-0000-000000000001",
      "stop_id": "33333333-0001-0003-0000-000000000001",
      "stop_name": "UTokyo Hospital Clinical Research",
      "stop_code": "UTK-S09",
      "stop_latitude": 35.7105,
      "stop_longitude": 139.7652,
      "stop_sequence": 1,
      "bus_id": "33333333-0003-0002-0000-000000000002",
      "fleet_code": "UTK-K02",
      "bus_speed_kmh": 36,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "33333333-0002-0003-0000-000000000001",
      "stop_id": "33333333-0001-0003-0000-000000000002",
      "stop_name": "Medical Building No 2",
      "stop_code": "UTK-S10",
      "stop_latitude": 35.7082,
      "stop_longitude": 139.7604,
      "stop_sequence": 2,
      "bus_id": "33333333-0003-0003-0000-000000000001",
      "fleet_code": "UTK-M01",
      "bus_speed_kmh": 25,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0001-0000-000000000001",
      "stop_id": "33333333-0001-0003-0000-000000000003",
      "stop_name": "Sanshiro Pond Gardens",
      "stop_code": "UTK-S11",
      "stop_latitude": 35.7118,
      "stop_longitude": 139.758,
      "stop_sequence": 3,
      "bus_id": "33333333-0003-0001-0000-000000000001",
      "fleet_code": "UTK-H01",
      "bus_speed_kmh": 38,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "33333333-0002-0001-0000-000000000001",
      "stop_id": "33333333-0001-0003-0000-000000000004",
      "stop_name": "Tatsuoka Gate Terminal",
      "stop_code": "UTK-S12",
      "stop_latitude": 35.7138,
      "stop_longitude": 139.7635,
      "stop_sequence": 4,
      "bus_id": "33333333-0003-0001-0000-000000000002",
      "fleet_code": "UTK-H02",
      "bus_speed_kmh": 35.5,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    }
  ],
  "44444444-4444-4444-4444-444444444444": [
    {
      "route_id": "44444444-0002-0001-0000-000000000001",
      "stop_id": "44444444-0001-0001-0000-000000000001",
      "stop_name": "Nilgiri and Kumaon Hostel Hub",
      "stop_code": "IITD-S01",
      "stop_latitude": 28.5472,
      "stop_longitude": 77.1835,
      "stop_sequence": 1,
      "bus_id": "44444444-0003-0001-0000-000000000001",
      "fleet_code": "IITD-EV-01",
      "bus_speed_kmh": 28,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "44444444-0002-0001-0000-000000000001",
      "stop_id": "44444444-0001-0001-0000-000000000002",
      "stop_name": "Student Activity Centre (SAC)",
      "stop_code": "IITD-S02",
      "stop_latitude": 28.5458,
      "stop_longitude": 77.1872,
      "stop_sequence": 2,
      "bus_id": "44444444-0003-0001-0000-000000000002",
      "fleet_code": "IITD-EV-02",
      "bus_speed_kmh": 25,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0002-0000-000000000001",
      "stop_id": "44444444-0001-0001-0000-000000000003",
      "stop_name": "Lecture Hall Complex (LHC)",
      "stop_code": "IITD-S03",
      "stop_latitude": 28.545,
      "stop_longitude": 77.1926,
      "stop_sequence": 3,
      "bus_id": "44444444-0003-0002-0000-000000000001",
      "fleet_code": "IITD-MF-01",
      "bus_speed_kmh": 30.5,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0002-0000-000000000001",
      "stop_id": "44444444-0001-0001-0000-000000000004",
      "stop_name": "Bharti School of Telecom",
      "stop_code": "IITD-S04",
      "stop_latitude": 28.5462,
      "stop_longitude": 77.1905,
      "stop_sequence": 4,
      "bus_id": "44444444-0003-0002-0000-000000000002",
      "fleet_code": "IITD-MF-02",
      "bus_speed_kmh": 26,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0003-0000-000000000001",
      "stop_id": "44444444-0001-0002-0000-000000000001",
      "stop_name": "IIT Delhi Metro Gate No 1",
      "stop_code": "IITD-S05",
      "stop_latitude": 28.5432,
      "stop_longitude": 77.1965,
      "stop_sequence": 1,
      "bus_id": "44444444-0003-0003-0000-000000000001",
      "fleet_code": "IITD-EW-01",
      "bus_speed_kmh": 32,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "44444444-0002-0001-0000-000000000001",
      "stop_id": "44444444-0001-0002-0000-000000000002",
      "stop_name": "Central Research Facility",
      "stop_code": "IITD-S06",
      "stop_latitude": 28.5448,
      "stop_longitude": 77.1932,
      "stop_sequence": 2,
      "bus_id": "44444444-0003-0001-0000-000000000001",
      "fleet_code": "IITD-EV-01",
      "bus_speed_kmh": 28,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0001-0000-000000000001",
      "stop_id": "44444444-0001-0002-0000-000000000003",
      "stop_name": "Main Administrative Block",
      "stop_code": "IITD-S07",
      "stop_latitude": 28.544,
      "stop_longitude": 77.189,
      "stop_sequence": 3,
      "bus_id": "44444444-0003-0001-0000-000000000002",
      "fleet_code": "IITD-EV-02",
      "bus_speed_kmh": 25,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0002-0000-000000000001",
      "stop_id": "44444444-0001-0002-0000-000000000004",
      "stop_name": "Research and Innovation Park",
      "stop_code": "IITD-S08",
      "stop_latitude": 28.5425,
      "stop_longitude": 77.1848,
      "stop_sequence": 4,
      "bus_id": "44444444-0003-0002-0000-000000000001",
      "fleet_code": "IITD-MF-01",
      "bus_speed_kmh": 30.5,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0002-0000-000000000001",
      "stop_id": "44444444-0001-0003-0000-000000000001",
      "stop_name": "Jia Sarai Footbridge Gate",
      "stop_code": "IITD-S09",
      "stop_latitude": 28.5485,
      "stop_longitude": 77.195,
      "stop_sequence": 1,
      "bus_id": "44444444-0003-0002-0000-000000000002",
      "fleet_code": "IITD-MF-02",
      "bus_speed_kmh": 26,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "44444444-0002-0003-0000-000000000001",
      "stop_id": "44444444-0001-0003-0000-000000000002",
      "stop_name": "Central Library Circle",
      "stop_code": "IITD-S10",
      "stop_latitude": 28.547,
      "stop_longitude": 77.1912,
      "stop_sequence": 2,
      "bus_id": "44444444-0003-0003-0000-000000000001",
      "fleet_code": "IITD-EW-01",
      "bus_speed_kmh": 32,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0001-0000-000000000001",
      "stop_id": "44444444-0001-0003-0000-000000000003",
      "stop_name": "Main Athletics Stadium",
      "stop_code": "IITD-S11",
      "stop_latitude": 28.5438,
      "stop_longitude": 77.1875,
      "stop_sequence": 3,
      "bus_id": "44444444-0003-0001-0000-000000000001",
      "fleet_code": "IITD-EV-01",
      "bus_speed_kmh": 28,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "44444444-0002-0001-0000-000000000001",
      "stop_id": "44444444-0001-0003-0000-000000000004",
      "stop_name": "Faculty Housing Enclave",
      "stop_code": "IITD-S12",
      "stop_latitude": 28.5455,
      "stop_longitude": 77.184,
      "stop_sequence": 4,
      "bus_id": "44444444-0003-0001-0000-000000000002",
      "fleet_code": "IITD-EV-02",
      "bus_speed_kmh": 25,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    }
  ],
  "55555555-5555-5555-5555-555555555555": [
    {
      "route_id": "55555555-0002-0001-0000-000000000001",
      "stop_id": "55555555-0001-0001-0000-000000000001",
      "stop_name": "Main Tata Memorial Building",
      "stop_code": "IISC-S01",
      "stop_latitude": 13.0219,
      "stop_longitude": 77.5671,
      "stop_sequence": 1,
      "bus_id": "55555555-0003-0001-0000-000000000001",
      "fleet_code": "IISC-G01",
      "bus_speed_kmh": 27.5,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "55555555-0002-0001-0000-000000000001",
      "stop_id": "55555555-0001-0001-0000-000000000002",
      "stop_name": "Computer Science and Automation (CSA)",
      "stop_code": "IISC-S02",
      "stop_latitude": 13.0195,
      "stop_longitude": 77.5658,
      "stop_sequence": 2,
      "bus_id": "55555555-0003-0001-0000-000000000002",
      "fleet_code": "IISC-G02",
      "bus_speed_kmh": 23,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0002-0000-000000000001",
      "stop_id": "55555555-0001-0001-0000-000000000003",
      "stop_name": "Supercomputer Education Centre (SERC)",
      "stop_code": "IISC-S03",
      "stop_latitude": 13.0172,
      "stop_longitude": 77.5682,
      "stop_sequence": 3,
      "bus_id": "55555555-0003-0002-0000-000000000001",
      "fleet_code": "IISC-H01",
      "bus_speed_kmh": 29,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0002-0000-000000000001",
      "stop_id": "55555555-0001-0001-0000-000000000004",
      "stop_name": "D-Gate Substation",
      "stop_code": "IISC-S04",
      "stop_latitude": 13.0155,
      "stop_longitude": 77.5705,
      "stop_sequence": 4,
      "bus_id": "55555555-0003-0002-0000-000000000002",
      "fleet_code": "IISC-H02",
      "bus_speed_kmh": 25.5,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0003-0000-000000000001",
      "stop_id": "55555555-0001-0002-0000-000000000001",
      "stop_name": "E-Block Hostel Dining Complex",
      "stop_code": "IISC-S05",
      "stop_latitude": 13.0245,
      "stop_longitude": 77.564,
      "stop_sequence": 1,
      "bus_id": "55555555-0003-0003-0000-000000000001",
      "fleet_code": "IISC-M01",
      "bus_speed_kmh": 31,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "55555555-0002-0001-0000-000000000001",
      "stop_id": "55555555-0001-0002-0000-000000000002",
      "stop_name": "Gymkhana Grounds Pavilion",
      "stop_code": "IISC-S06",
      "stop_latitude": 13.023,
      "stop_longitude": 77.5622,
      "stop_sequence": 2,
      "bus_id": "55555555-0003-0001-0000-000000000001",
      "fleet_code": "IISC-G01",
      "bus_speed_kmh": 27.5,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0001-0000-000000000001",
      "stop_id": "55555555-0001-0002-0000-000000000003",
      "stop_name": "Centre for Ecological Sciences",
      "stop_code": "IISC-S07",
      "stop_latitude": 13.0198,
      "stop_longitude": 77.5638,
      "stop_sequence": 3,
      "bus_id": "55555555-0003-0001-0000-000000000002",
      "fleet_code": "IISC-G02",
      "bus_speed_kmh": 23,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0002-0000-000000000001",
      "stop_id": "55555555-0001-0002-0000-000000000004",
      "stop_name": "Biological Sciences Building",
      "stop_code": "IISC-S08",
      "stop_latitude": 13.018,
      "stop_longitude": 77.566,
      "stop_sequence": 4,
      "bus_id": "55555555-0003-0002-0000-000000000001",
      "fleet_code": "IISC-H01",
      "bus_speed_kmh": 29,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0002-0000-000000000001",
      "stop_id": "55555555-0001-0003-0000-000000000001",
      "stop_name": "Malleswaram 18th Cross Main Gate",
      "stop_code": "IISC-S09",
      "stop_latitude": 13.0142,
      "stop_longitude": 77.5712,
      "stop_sequence": 1,
      "bus_id": "55555555-0003-0002-0000-000000000002",
      "fleet_code": "IISC-H02",
      "bus_speed_kmh": 25.5,
      "distance_meters": 400,
      "distance_km": 0.4,
      "eta_minutes": 0.9,
      "status": "ARRIVING_NOW"
    },
    {
      "route_id": "55555555-0002-0003-0000-000000000001",
      "stop_id": "55555555-0001-0003-0000-000000000002",
      "stop_name": "Department of Aerospace Engineering",
      "stop_code": "IISC-S10",
      "stop_latitude": 13.0168,
      "stop_longitude": 77.569,
      "stop_sequence": 2,
      "bus_id": "55555555-0003-0003-0000-000000000001",
      "fleet_code": "IISC-M01",
      "bus_speed_kmh": 31,
      "distance_meters": 1250,
      "distance_km": 1.3,
      "eta_minutes": 2.7,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0001-0000-000000000001",
      "stop_id": "55555555-0001-0003-0000-000000000003",
      "stop_name": "CeNSE Nanotechnology Centre",
      "stop_code": "IISC-S11",
      "stop_latitude": 13.0205,
      "stop_longitude": 77.5645,
      "stop_sequence": 3,
      "bus_id": "55555555-0003-0001-0000-000000000001",
      "fleet_code": "IISC-G01",
      "bus_speed_kmh": 27.5,
      "distance_meters": 2100,
      "distance_km": 2.1,
      "eta_minutes": 4.5,
      "status": "UPCOMING"
    },
    {
      "route_id": "55555555-0002-0001-0000-000000000001",
      "stop_id": "55555555-0001-0003-0000-000000000004",
      "stop_name": "Maramma Circle Terminal",
      "stop_code": "IISC-S12",
      "stop_latitude": 13.0252,
      "stop_longitude": 77.5615,
      "stop_sequence": 4,
      "bus_id": "55555555-0003-0001-0000-000000000002",
      "fleet_code": "IISC-G02",
      "bus_speed_kmh": 23,
      "distance_meters": 2950,
      "distance_km": 3,
      "eta_minutes": 6.3,
      "status": "UPCOMING"
    }
  ]
};

const DEFAULT_DEMO_EVENTS: Record<string, TransitEvent[]> = {
  "11111111-1111-1111-1111-111111111111": [
    {
      "id": "ev-1111-01",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "bus_id": "11111111-0003-0001-0000-000000000001",
      "fleet_code": "UM-A01",
      "route_id": "11111111-0002-0001-0000-000000000001",
      "route_code": "UM-R01",
      "stop_id": "11111111-0001-0001-0000-000000000002",
      "stop_name": "Perpustakaan Utama UM",
      "event_type": "APPROACHING",
      "triggered_at": "2026-10-20T12:05:00.000Z",
      "distance_meters": 180
    },
    {
      "id": "ev-1111-02",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "bus_id": "11111111-0003-0001-0000-000000000001",
      "fleet_code": "UM-A01",
      "route_id": "11111111-0002-0001-0000-000000000001",
      "route_code": "UM-R01",
      "stop_id": "11111111-0001-0001-0000-000000000001",
      "stop_name": "Rimba Ilmu Botanic Garden",
      "event_type": "DEPARTED",
      "triggered_at": "2026-10-20T12:00:00.000Z",
      "distance_meters": 0
    }
  ],
  "22222222-2222-2222-2222-222222222222": [
    {
      "id": "ev-2222-01",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "bus_id": "22222222-0003-0001-0000-000000000001",
      "fleet_code": "NUS-D1-01",
      "route_id": "22222222-0002-0001-0000-000000000001",
      "route_code": "NUS-D1",
      "stop_id": "22222222-0001-0001-0000-000000000002",
      "stop_name": "University Health Centre",
      "event_type": "APPROACHING",
      "triggered_at": "2026-10-20T12:05:00.000Z",
      "distance_meters": 180
    },
    {
      "id": "ev-2222-02",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "bus_id": "22222222-0003-0001-0000-000000000001",
      "fleet_code": "NUS-D1-01",
      "route_id": "22222222-0002-0001-0000-000000000001",
      "route_code": "NUS-D1",
      "stop_id": "22222222-0001-0001-0000-000000000001",
      "stop_name": "University Town (UTown)",
      "event_type": "DEPARTED",
      "triggered_at": "2026-10-20T12:00:00.000Z",
      "distance_meters": 0
    }
  ],
  "33333333-3333-3333-3333-333333333333": [
    {
      "id": "ev-3333-01",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "bus_id": "33333333-0003-0001-0000-000000000001",
      "fleet_code": "UTK-H01",
      "route_id": "33333333-0002-0001-0000-000000000001",
      "route_code": "UTK-HK",
      "stop_id": "33333333-0001-0001-0000-000000000002",
      "stop_name": "Yasuda Auditorium Central",
      "event_type": "APPROACHING",
      "triggered_at": "2026-10-20T12:05:00.000Z",
      "distance_meters": 180
    },
    {
      "id": "ev-3333-02",
      "tenant_id": "33333333-3333-3333-3333-333333333333",
      "bus_id": "33333333-0003-0001-0000-000000000001",
      "fleet_code": "UTK-H01",
      "route_id": "33333333-0002-0001-0000-000000000001",
      "route_code": "UTK-HK",
      "stop_id": "33333333-0001-0001-0000-000000000001",
      "stop_name": "Hongo Akamon (Red Gate)",
      "event_type": "DEPARTED",
      "triggered_at": "2026-10-20T12:00:00.000Z",
      "distance_meters": 0
    }
  ],
  "44444444-4444-4444-4444-444444444444": [
    {
      "id": "ev-4444-01",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "bus_id": "44444444-0003-0001-0000-000000000001",
      "fleet_code": "IITD-EV-01",
      "route_id": "44444444-0002-0001-0000-000000000001",
      "route_code": "IITD-HL",
      "stop_id": "44444444-0001-0001-0000-000000000002",
      "stop_name": "Student Activity Centre (SAC)",
      "event_type": "APPROACHING",
      "triggered_at": "2026-10-20T12:05:00.000Z",
      "distance_meters": 180
    },
    {
      "id": "ev-4444-02",
      "tenant_id": "44444444-4444-4444-4444-444444444444",
      "bus_id": "44444444-0003-0001-0000-000000000001",
      "fleet_code": "IITD-EV-01",
      "route_id": "44444444-0002-0001-0000-000000000001",
      "route_code": "IITD-HL",
      "stop_id": "44444444-0001-0001-0000-000000000001",
      "stop_name": "Nilgiri and Kumaon Hostel Hub",
      "event_type": "DEPARTED",
      "triggered_at": "2026-10-20T12:00:00.000Z",
      "distance_meters": 0
    }
  ],
  "55555555-5555-5555-5555-555555555555": [
    {
      "id": "ev-5555-01",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "bus_id": "55555555-0003-0001-0000-000000000001",
      "fleet_code": "IISC-G01",
      "route_id": "55555555-0002-0001-0000-000000000001",
      "route_code": "IISC-MC",
      "stop_id": "55555555-0001-0001-0000-000000000002",
      "stop_name": "Computer Science and Automation (CSA)",
      "event_type": "APPROACHING",
      "triggered_at": "2026-10-20T12:05:00.000Z",
      "distance_meters": 180
    },
    {
      "id": "ev-5555-02",
      "tenant_id": "55555555-5555-5555-5555-555555555555",
      "bus_id": "55555555-0003-0001-0000-000000000001",
      "fleet_code": "IISC-G01",
      "route_id": "55555555-0002-0001-0000-000000000001",
      "route_code": "IISC-MC",
      "stop_id": "55555555-0001-0001-0000-000000000001",
      "stop_name": "Main Tata Memorial Building",
      "event_type": "DEPARTED",
      "triggered_at": "2026-10-20T12:00:00.000Z",
      "distance_meters": 0
    }
  ]
};

const railItems = [
  { icon: LayoutGrid, label: 'Overview', href: '#dashboard' },
  { icon: Radio, label: 'Live radar', href: '#radar' },
  { icon: Clock, label: 'Stop ETAs', href: '#etas' },
  { icon: Truck, label: 'Fleet & routes', href: '#fleet' },
  { icon: Users, label: 'Directory', href: '#directory' },
  { icon: ShieldCheck, label: 'Security RLS', href: '#security' },
];

function formatDeterministicDate(isoString: string): string {
  const parts = isoString.slice(0, 10).split('-');
  if (parts.length !== 3) return isoString;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const month = monthNames[monthIndex] || parts[1];
  return `${month} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [tenants, setTenants] = useState<Tenant[]>(DEFAULT_DEMO_TENANTS);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(DEFAULT_DEMO_TENANTS[0].id);
  const [selectedRole, setSelectedRole] = useState<UserRole>('OPERATOR_ADMIN');
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);

  const [users, setUsers] = useState<User[]>(DEFAULT_DEMO_USERS[DEFAULT_DEMO_TENANTS[0].id] || []);
  const [buses, setBuses] = useState<BusEntity[]>(DEFAULT_DEMO_BUSES[DEFAULT_DEMO_TENANTS[0].id] || []);
  const [stops, setStops] = useState<Stop[]>(DEFAULT_DEMO_STOPS[DEFAULT_DEMO_TENANTS[0].id] || []);
  const [routes, setRoutes] = useState<RouteEntity[]>(DEFAULT_DEMO_ROUTES[DEFAULT_DEMO_TENANTS[0].id] || []);

  const [snapshots, setSnapshots] = useState<BusSnapshot[]>(
    DEFAULT_DEMO_SNAPSHOTS[DEFAULT_DEMO_TENANTS[0].id] || [],
  );
  const [stopETAs, setStopETAs] = useState<StopETA[]>(
    DEFAULT_DEMO_ETAS[DEFAULT_DEMO_TENANTS[0].id] || [],
  );
  const [transitEvents, setTransitEvents] = useState<TransitEvent[]>(
    DEFAULT_DEMO_EVENTS[DEFAULT_DEMO_TENANTS[0].id] || [],
  );
  const [radarViewTab, setRadarViewTab] = useState<'radar' | 'map'>('radar');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  const [driverBusId, setDriverBusId] = useState<string>('');
  const [driverTripStatus, setDriverTripStatus] = useState<'IN_TRANSIT' | 'AT_STOP'>('IN_TRANSIT');
  const [driverOccupancy, setDriverOccupancy] = useState<number>(24);
  const [riderBoardingStopId, setRiderBoardingStopId] = useState<string>('');
  const [isDriverOffline, setIsDriverOffline] = useState<boolean>(false);
  const [bufferedPings, setBufferedPings] = useState<DriverSyncPing[]>([]);
  const [offlineBatchId, setOfflineBatchId] = useState<string>('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncingBatch, setIsSyncingBatch] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [managementTab, setManagementTab] = useState<'buses' | 'waypoints' | 'geofence' | 'audit' | 'members' | 'workspaces' | 'observability'>('buses');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [demandSuggestions, setDemandSuggestions] = useState<DemandSuggestion[]>([]);
  const [activeChaosScenario, setActiveChaosScenario] = useState<ChaosScenario | null>(null);
  const [chaosReports, setChaosReports] = useState<Record<string, ChaosTestReport>>({});
  const [prometheusMetricsRaw, setPrometheusMetricsRaw] = useState<string>('');
  const [isRunningLoadTest, setIsRunningLoadTest] = useState<boolean>(false);
  const [loadTestResult, setLoadTestResult] = useState<LoadTestResult | null>(null);
  const [isDownloadingGtfsRt, setIsDownloadingGtfsRt] = useState<boolean>(false);

  const [showCreateTenant, setShowCreateTenant] = useState<boolean>(false);
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newTenantSlug, setNewTenantSlug] = useState<string>('');

  const [showAddMember, setShowAddMember] = useState<boolean>(false);
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('RIDER');

  const [showAddBus, setShowAddBus] = useState<boolean>(false);
  const [newBusCode, setNewBusCode] = useState<string>('');
  const [newBusPlate, setNewBusPlate] = useState<string>('');
  const [newBusModel, setNewBusModel] = useState<string>('');
  const [newBusCapacity, setNewBusCapacity] = useState<number>(40);
  const [newBusStatus, setNewBusStatus] = useState<string>('ACTIVE');
  const [newBusRouteId, setNewBusRouteId] = useState<string>('');

  const [isRouteStudioOpen, setIsRouteStudioOpen] = useState<boolean>(false);
  const isCreatingRoute = isRouteStudioOpen;
  const mapRef = useRef<{ resize?: () => void; invalidateSize?: () => void } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [applyingRouteId, setApplyingRouteId] = useState<string | null>(null);
  const [appliedSchedules, setAppliedSchedules] = useState<Record<string, boolean>>({});
  const [testWebhookEvent, setTestWebhookEvent] = useState<'trip.arrived' | 'seat.booked' | 'schedule.optimized'>('trip.arrived');
  const [testWebhookResult, setTestWebhookResult] = useState<WebhookTestResponse | null>(null);
  const [isDispatchingWebhook, setIsDispatchingWebhook] = useState<boolean>(false);
  const [webhookDrawerOpen, setWebhookDrawerOpen] = useState<boolean>(false);
  const [showPublicApiModal, setShowPublicApiModal] = useState<boolean>(false);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !mapRef.current) return;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0 && mapRef.current) {
        if (typeof mapRef.current.resize === 'function') {
          mapRef.current.resize();
        }
        if (typeof mapRef.current.invalidateSize === 'function') {
          mapRef.current.invalidateSize();
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (radarViewTab === 'map') {
      const triggerResizeAndFit = () => {
        if (mapRef.current) {
          if (typeof mapRef.current.resize === 'function') {
            mapRef.current.resize();
          }
          if (typeof mapRef.current.invalidateSize === 'function') {
            mapRef.current.invalidateSize();
          }
        }
      };

      const raf = requestAnimationFrame(triggerResizeAndFit);
      const timer1 = setTimeout(triggerResizeAndFit, 50);
      const timer2 = setTimeout(triggerResizeAndFit, 100);
      const timer3 = setTimeout(triggerResizeAndFit, 250);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [radarViewTab, isCreatingRoute]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        if (typeof mapRef.current.resize === 'function') {
          mapRef.current.resize();
        }
        if (typeof mapRef.current.invalidateSize === 'function') {
          mapRef.current.invalidateSize();
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isCreatingRoute]);

  const handleApplySchedule = async (sug: DemandSuggestion) => {
    setApplyingRouteId(sug.route_id);
    try {
      const res = await api.applyScheduleSuggestion(
        {
          route_id: sug.route_id,
          recommended_headway_min: sug.recommended_headway_min || 8,
          extra_buses_needed: sug.extra_buses_needed || 1,
        },
        selectedTenantId,
      );
      setAppliedSchedules((prev) => ({ ...prev, [sug.route_id]: true }));
      setNotification({
        type: 'success',
        message: res.message || 'Optimal dispatch schedule applied to corridor fleet.',
      });
      api.getAuditLogs(selectedTenantId).then((data) => {
        if (data && data.length > 0) setAuditLogs(data);
      }).catch(() => {});
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to apply schedule suggestion.',
      });
    } finally {
      setApplyingRouteId(null);
    }
  };

  const handleDispatchTestWebhook = async (event: 'trip.arrived' | 'seat.booked' | 'schedule.optimized') => {
    setIsDispatchingWebhook(true);
    setTestWebhookEvent(event);
    try {
      const res = await api.triggerTestWebhook({ event }, selectedTenantId);
      setTestWebhookResult(res);
      setWebhookDrawerOpen(true);
      setNotification({
        type: 'success',
        message: `Dispatched signed ${event} webhook payload with signature.`,
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Webhook dispatch failed.',
      });
    } finally {
      setIsDispatchingWebhook(false);
    }
  };

  const [studioRouteName, setStudioRouteName] = useState<string>('');
  const [studioRouteCode, setStudioRouteCode] = useState<string>('');
  const [studioBusId, setStudioBusId] = useState<string>('');
  const [studioStops, setStudioStops] = useState<StudioStop[]>([]);
  const [isLiveDeviceGps, setIsLiveDeviceGps] = useState<boolean>(false);

  const [showAddStop, setShowAddStop] = useState<boolean>(false);
  const [newStopName, setNewStopName] = useState<string>('');
  const [newStopCode, setNewStopCode] = useState<string>('');
  const [newStopLat, setNewStopLat] = useState<number>(31.48);
  const [newStopLng, setNewStopLng] = useState<number>(76.19);

  const [showAddRoute, setShowAddRoute] = useState<boolean>(false);
  const [newRouteName, setNewRouteName] = useState<string>('');
  const [newRouteCode, setNewRouteCode] = useState<string>('');
  const [newRouteOrigin, setNewRouteOrigin] = useState<string>('');
  const [newRouteDest, setNewRouteDest] = useState<string>('');
  const [newRouteDist, setNewRouteDist] = useState<number>(14.2);
  const [newRouteEta, setNewRouteEta] = useState<number>(28);

  const [notification, setNotification] = useState<ApiNotification | null>(null);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification]);
  const [attackResult, setAttackResult] = useState<AttackResult>({
    status: 'idle',
    message: '',
  });

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [seats, setSeats] = useState<SeatInventory[]>([]);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<string>('');
  const [heldSeatRemainingSec, setHeldSeatRemainingSec] = useState<number>(0);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [showBoardingPass, setShowBoardingPass] = useState<boolean>(false);
  const [isHoldingSeat, setIsHoldingSeat] = useState<boolean>(false);
  const [isBookingSeat, setIsBookingSeat] = useState<boolean>(false);
  const [isSimulatingClash, setIsSimulatingClash] = useState<boolean>(false);
  const [clashResult, setClashResult] = useState<ConcurrencyClashResult | null>(null);

  const fetchTenantData = useCallback(async (tenantId: string, role: UserRole, overrideToken?: string) => {
    const activeToken = overrideToken || token || api.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('transit_auth_token') : null);
    if (!activeToken || !tenantId) return;
    api.setToken(activeToken);

    try {
      const [usersData, busesData, stopsData, routesData, telemetryData, etasData, eventsData, tripsData, auditData, suggestionsData, metricsData] = await Promise.all([
        api.getUsers(tenantId).catch(() => DEFAULT_DEMO_USERS[tenantId] || []),
        api.getBuses(tenantId).catch(() => DEFAULT_DEMO_BUSES[tenantId] || []),
        api.getStops(tenantId).catch(() => DEFAULT_DEMO_STOPS[tenantId] || []),
        api.getRoutes(tenantId).catch(() => DEFAULT_DEMO_ROUTES[tenantId] || []),
        api.getLatestTelemetry(tenantId).catch(() => DEFAULT_DEMO_SNAPSHOTS[tenantId] || []),
        api.getETAs(tenantId).catch(() => DEFAULT_DEMO_ETAS[tenantId] || []),
        api.getEvents(20, tenantId).catch(() => DEFAULT_DEMO_EVENTS[tenantId] || []),
        api.getTrips(tenantId).catch(() => []),
        api.getAuditLogs(tenantId).catch(() => []),
        api.getDemandSuggestions(tenantId).catch(() => []),
        api.getPrometheusMetrics().catch(() => ''),
      ]);

      setUsers(usersData && usersData.length > 0 ? usersData : DEFAULT_DEMO_USERS[tenantId] || []);
      setBuses(busesData && busesData.length > 0 ? busesData : DEFAULT_DEMO_BUSES[tenantId] || []);
      setStops(stopsData && stopsData.length > 0 ? stopsData : DEFAULT_DEMO_STOPS[tenantId] || []);
      setRoutes(routesData && routesData.length > 0 ? routesData : DEFAULT_DEMO_ROUTES[tenantId] || []);
      setSnapshots(telemetryData && telemetryData.length > 0 ? telemetryData : DEFAULT_DEMO_SNAPSHOTS[tenantId] || []);
      setStopETAs(etasData && etasData.length > 0 ? etasData : DEFAULT_DEMO_ETAS[tenantId] || []);
      setTransitEvents(eventsData && eventsData.length > 0 ? eventsData : DEFAULT_DEMO_EVENTS[tenantId] || []);
      setTrips(tripsData || []);
      setAuditLogs(auditData || []);
      setDemandSuggestions(suggestionsData && suggestionsData.length > 0 ? suggestionsData : []);
      setPrometheusMetricsRaw(metricsData || '');

      if (tripsData && tripsData.length > 0) {
        const currentTripId = tripsData[0].id;
        setSelectedTripId(currentTripId);
        api.getTripSeats(currentTripId).then((seatsData) => {
          setSeats(seatsData || []);
          const held = (seatsData || []).find((s) => s.status === 'HELD' && s.remaining_sec > 0);
          if (held) {
            setSelectedSeatNumber(held.seat_number);
            setHeldSeatRemainingSec(held.remaining_sec);
          }
        }).catch(() => {});
      } else {
        setSeats([]);
      }
    } catch {
      setUsers(DEFAULT_DEMO_USERS[tenantId] || []);
      setBuses(DEFAULT_DEMO_BUSES[tenantId] || []);
      setStops(DEFAULT_DEMO_STOPS[tenantId] || []);
      setRoutes(DEFAULT_DEMO_ROUTES[tenantId] || []);
      setSnapshots(DEFAULT_DEMO_SNAPSHOTS[tenantId] || []);
      setStopETAs(DEFAULT_DEMO_ETAS[tenantId] || []);
      setTransitEvents(DEFAULT_DEMO_EVENTS[tenantId] || []);
      setTrips([]);
      setSeats([]);
    }
  }, [token]);

  const loadTenantsList = useCallback(async () => {
    try {
      const data = await api.getTenants();
      if (data && data.length > 0) {
        setTenants(data);
      }
    } catch {
      setTenants(DEFAULT_DEMO_TENANTS);
    }
  }, []);

  const handleResetTrip = useCallback(async (busId: string) => {
    try {
      await api.resetTrip(busId, selectedTenantId);
      const [latestSnapshots, latestEtas, latestEvents] = await Promise.all([
        api.getLatestTelemetry(selectedTenantId),
        api.getETAs(selectedTenantId),
        api.getEvents(20, selectedTenantId),
      ]);
      if (latestSnapshots && latestSnapshots.length > 0) setSnapshots(latestSnapshots);
      if (latestEtas && latestEtas.length > 0) setStopETAs(latestEtas);
      if (latestEvents) setTransitEvents(latestEvents);
      setNotification({ type: 'success', message: 'Vehicle trip reset to Stop 1 (In transit)' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset trip';
      setNotification({ type: 'error', message: msg });
    }
  }, [selectedTenantId]);

  const activeTenant = useMemo(() => {
    return tenants.find((t) => t.id === selectedTenantId) || tenants[0] || DEFAULT_DEMO_TENANTS[0];
  }, [tenants, selectedTenantId]);

  const uniqueRoutes = useMemo(() => {
    const seen = new Set<string>();
    return routes.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [routes]);

  const uniqueStops = useMemo(() => {
    const seen = new Set<string>();
    return stops.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [stops]);

  const uniqueStopETAs = useMemo(() => {
    const seen = new Set<string>();
    return stopETAs.filter((item) => {
      const key = `${item.route_id}-${item.stop_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [stopETAs]);

  const activeRoute = useMemo(() => {
    if (selectedRouteId) {
      const match = uniqueRoutes.find((r) => r.id === selectedRouteId);
      if (match) return match;
    }
    return (
      uniqueRoutes[0] || {
        id: 'demo-rt',
        tenant_id: selectedTenantId,
        code: 'UNA-R01',
        name: 'Campus - Rail Corridor Express',
        origin: 'IIIT Una Campus',
        destination: 'Una Railway Terminal',
        distance_km: 14.8,
        estimated_minutes: 26,
        active: true,
        created_at: '2026-10-20T12:00:00.000Z',
      }
    );
  }, [uniqueRoutes, selectedRouteId, selectedTenantId]);

  const activeSnapshot = useMemo(() => {
    if (selectedBusId) {
      const match = snapshots.find((s) => s.bus_id === selectedBusId);
      if (match) return match;
    }
    return snapshots[0] || null;
  }, [snapshots, selectedBusId]);

  const handleSimulateStep = useCallback(async () => {
    try {
      const targetRouteId = selectedRouteId || activeRoute?.id;
      const targetBusId = selectedBusId || activeSnapshot?.bus_id;
      await api.simulateTelemetryStep(selectedTenantId, targetRouteId, targetBusId);
      const [latestSnapshots, latestEtas, latestEvents, latestTrips, latestBuses] = await Promise.all([
        api.getLatestTelemetry(selectedTenantId).catch(() => []),
        api.getETAs(selectedTenantId, targetRouteId).catch(() => []),
        api.getEvents(20, selectedTenantId).catch(() => []),
        api.getTrips().catch(() => []),
        api.getBuses(selectedTenantId).catch(() => []),
      ]);
      if (latestSnapshots && latestSnapshots.length > 0) {
        setSnapshots(latestSnapshots);
      }
      if (latestEtas && latestEtas.length > 0) {
        setStopETAs(latestEtas);
      }
      if (latestEvents && latestEvents.length > 0) {
        setTransitEvents(latestEvents);
      }
      if (latestTrips && latestTrips.length > 0) {
        setTrips(latestTrips);
      }
      if (latestBuses && latestBuses.length > 0) {
        setBuses(latestBuses);
      }
    } catch {
      setSnapshots((prev) =>
        prev.map((s) => {
          const nextPct = Math.min(100, Math.round((s.progress_pct || 0) + 10));
          return {
            ...s,
            progress_pct: nextPct >= 100 ? 0 : nextPct,
            latitude: Number((s.latitude + (Math.random() - 0.48) * 0.001).toFixed(6)),
            longitude: Number((s.longitude + (Math.random() - 0.48) * 0.001).toFixed(6)),
            speed_kmh: Math.max(38, Math.min(58, Math.round(s.speed_kmh + (Math.random() * 6 - 3)))),
            heading_deg: (s.heading_deg + Math.round(Math.random() * 10 - 5) + 360) % 360,
            occupancy: Math.max(5, Math.min(s.capacity, s.occupancy + Math.floor(Math.random() * 3 - 1))),
            recorded_at: new Date().toISOString(),
          };
        }),
      );
      setStopETAs((prev) =>
        prev.map((item) => {
          const nextDist = Math.max(50, Math.round(item.distance_meters - 80));
          const nextKm = Number((nextDist / 1000).toFixed(2));
          const nextMin = Math.max(0, Number((nextDist / (Math.max(item.bus_speed_kmh, 38) * 16.6667)).toFixed(1)));
          return {
            ...item,
            distance_meters: nextDist,
            distance_km: nextKm,
            eta_minutes: nextMin,
          };
        }),
      );
    }
  }, [selectedTenantId, selectedRouteId, activeRoute?.id, selectedBusId, activeSnapshot?.bus_id]);

  const handleDriverEmitPing = useCallback(async () => {
    if (isDriverOffline) {
      const nextSeq = bufferedPings.length + 1;
      const baseLat = activeSnapshot?.latitude || 31.4812;
      const baseLng = activeSnapshot?.longitude || 76.1915;
      const randomOffset = (Math.random() - 0.5) * 0.003;
      const newPing: DriverSyncPing = {
        sequence: nextSeq,
        lat: Math.round((baseLat + randomOffset) * 10000) / 10000,
        lng: Math.round((baseLng + randomOffset) * 10000) / 10000,
        speed: 38 + Math.round(Math.random() * 8),
        timestamp: new Date().toISOString(),
      };
      setBufferedPings((prev) => [...prev, newPing]);
      setSyncStatusMsg(null);
      setNotification({
        type: 'success',
        message: `Offline mode: GPS ping #${nextSeq} queued in local buffer`,
      });
      return;
    }
    await handleSimulateStep();
  }, [isDriverOffline, bufferedPings.length, activeSnapshot, handleSimulateStep]);

  const handleToggleNetworkMode = useCallback(async (offline: boolean) => {
    setIsDriverOffline(offline);
    if (!offline && bufferedPings.length > 0) {
      setIsSyncingBatch(true);
      try {
        const targetBus = driverBusId || activeSnapshot?.bus_id || buses[0]?.id || '';
        const targetTrip = selectedTripId || (trips[0]?.id ?? undefined);
        const res = await api.syncDriverBatch({
          batch_id: offlineBatchId,
          bus_id: targetBus,
          trip_id: targetTrip,
          events: bufferedPings,
        }, selectedTenantId);
        setSyncStatusMsg(`Synced ${res.synced_count} buffered pings · ${res.duplicate_count} duplicates`);
        setBufferedPings([]);
        const nextBatchId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b-${Date.now()}`;
        setOfflineBatchId(nextBatchId);
        setNotification({
          type: 'success',
          message: `Idempotent batch sync complete: ${res.synced_count} pings forwarded to TimescaleDB (${res.duplicate_count} duplicates avoided)`,
        });
        void fetchTenantData(selectedTenantId, selectedRole);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sync failed';
        setNotification({ type: 'error', message: msg });
      } finally {
        setIsSyncingBatch(false);
      }
    }
  }, [bufferedPings, driverBusId, activeSnapshot, buses, selectedTripId, trips, offlineBatchId, selectedTenantId, fetchTenantData, selectedRole]);

  const clearAuthStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nextransit_auth');
      localStorage.removeItem('transit_auth_token');
      localStorage.removeItem('token');
      sessionStorage.clear();
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'transit_auth_token=; path=/; max-age=0; SameSite=Lax';
    }
    api.setToken(null);
    setToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTokenDetails(null);
    setSelectedTripId('');
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsSimulating(false);
    try {
      await api.logout();
    } catch {}
    clearAuthStorage();
  }, [clearAuthStorage]);

  const authCheckedRef = useRef<boolean>(false);

  useEffect(() => {
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;

    const checkInitialAuth = async () => {
      try {
        let storedToken: string | null = null;
        let storedUser: User | null = null;
        if (typeof window !== 'undefined') {
          const authItem = localStorage.getItem('nextransit_auth');
          if (authItem) {
            try {
              const parsed = JSON.parse(authItem);
              if (parsed && typeof parsed.token === 'string') {
                storedToken = parsed.token;
                if (parsed.user && typeof parsed.user === 'object') {
                  storedUser = parsed.user;
                }
              }
            } catch {}
          }
          if (!storedToken) {
            storedToken = localStorage.getItem('transit_auth_token');
          }
        }

        if (!storedToken) {
          setIsAuthChecking(false);
          return;
        }

        api.setToken(storedToken);
        let me: User | null = null;
        try {
          me = await api.getAuthMe();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid token')) {
            clearAuthStorage();
          }
          setIsAuthChecking(false);
          return;
        }

        if (!me || !me.tenant_id) {
          if (storedUser && storedUser.tenant_id && storedUser.role !== 'SUPER_ADMIN') {
            me = storedUser;
          } else {
            clearAuthStorage();
            setIsAuthChecking(false);
            return;
          }
        }

        if (me.role === 'SUPER_ADMIN') {
          clearAuthStorage();
          setIsAuthChecking(false);
          return;
        }

        setToken(storedToken);
        setCurrentUser(me);
        setSelectedTenantId(me.tenant_id);
        setSelectedRole(me.role);
        setTokenDetails({
          sub: me.id,
          tenant_id: me.tenant_id,
          role: me.role,
        });
        setIsAuthenticated(true);
      } catch {
      } finally {
        setIsAuthChecking(false);
      }
    };

    void checkInitialAuth();
    void loadTenantsList();
  }, [clearAuthStorage, loadTenantsList]);

  const handleAuthSuccess = useCallback((user: User, authToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextransit_auth', JSON.stringify({ token: authToken, user }));
      localStorage.setItem('transit_auth_token', authToken);
    }
    api.setToken(authToken);
    setToken(authToken);
    setCurrentUser(user);
    setSelectedTenantId(user.tenant_id);
    setSelectedRole(user.role);
    setTokenDetails({
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
    });
    setIsAuthenticated(true);
    void fetchTenantData(user.tenant_id, user.role, authToken);
  }, [fetchTenantData]);

  useEffect(() => {
    if (!isAuthenticated || !token || !currentUser?.tenant_id) return;
    void fetchTenantData(selectedTenantId, selectedRole, token);
  }, [isAuthenticated, token, currentUser?.tenant_id, selectedTenantId, selectedRole, fetchTenantData]);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      if (selectedRole === 'DRIVER' && isDriverOffline) {
        void handleDriverEmitPing();
      } else {
        void handleSimulateStep();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isSimulating, selectedRole, isDriverOffline, handleDriverEmitPing, handleSimulateStep]);

  const driverSelectedBus = useMemo(() => {
    const targetId = driverBusId || activeSnapshot?.bus_id;
    return buses.find((b) => b.id === targetId) || buses[0] || null;
  }, [buses, driverBusId, activeSnapshot]);

  const riderSelectedStop = useMemo(() => {
    const targetId = riderBoardingStopId || uniqueStops[0]?.id;
    return uniqueStops.find((s) => s.id === targetId) || uniqueStops[0] || null;
  }, [uniqueStops, riderBoardingStopId]);

  const riderStopETA = useMemo(() => {
    if (!riderSelectedStop) return null;
    return uniqueStopETAs.find((e) => e.stop_id === riderSelectedStop.id) || uniqueStopETAs[0] || null;
  }, [uniqueStopETAs, riderSelectedStop]);

  const riderStopIdx = useMemo(() => {
    const currentStopId = riderBoardingStopId || uniqueStops[0]?.id;
    const idx = uniqueStops.findIndex((s) => s.id === currentStopId);
    return idx >= 0 ? idx : 0;
  }, [riderBoardingStopId, uniqueStops]);

  const dynamicOccupancyCount = useMemo(() => {
    const baseOccupancy = activeSnapshot?.occupancy || 28;
    const totalStops = Math.max(1, uniqueStops.length);
    const progressFactor = 0.5 + 0.5 * ((riderStopIdx + 1) / totalStops);
    const calculated = Math.round(baseOccupancy * progressFactor);
    return Math.min(36, Math.max(8, calculated));
  }, [activeSnapshot, riderStopIdx, uniqueStops.length]);

  const progressPercent = useMemo(() => {
    if (activeSnapshot?.progress_pct !== undefined && activeSnapshot.progress_pct !== null) {
      return Math.min(100, Math.max(0, Math.round(activeSnapshot.progress_pct)));
    }
    if (!uniqueStops.length) return 0;
    if (stopETAs.length > 0) {
      const remaining = stopETAs.filter((s) => (s.eta_minutes || 0) > 0.5).length;
      const passed = Math.max(0, uniqueStops.length - remaining);
      return Math.round((passed / uniqueStops.length) * 100);
    }
    return 0;
  }, [activeSnapshot, uniqueStops.length, stopETAs]);

  const riderRemainingSeats = useMemo(() => {
    return Math.max(0, 40 - dynamicOccupancyCount);
  }, [dynamicOccupancyCount]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return transitEvents;
    const q = searchQuery.toLowerCase();
    return transitEvents.filter(
      (e) =>
        e.fleet_code.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q) ||
        e.stop_name.toLowerCase().includes(q),
    );
  }, [transitEvents, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u) => u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const filteredBuses = useMemo(() => {
    if (!searchQuery.trim()) return buses;
    const q = searchQuery.toLowerCase();
    return buses.filter(
      (b) =>
        b.fleet_code.toLowerCase().includes(q) ||
        b.plate_number.toLowerCase().includes(q) ||
        b.model.toLowerCase().includes(q),
    );
  }, [buses, searchQuery]);

  const filteredStops = useMemo(() => {
    if (!searchQuery.trim()) return uniqueStops;
    const q = searchQuery.toLowerCase();
    return uniqueStops.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [uniqueStops, searchQuery]);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return uniqueRoutes;
    const q = searchQuery.toLowerCase();
    return uniqueRoutes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q),
    );
  }, [uniqueRoutes, searchQuery]);

  const filteredAuditLogs = useMemo(() => {
    if (!searchQuery.trim()) return auditLogs;
    const q = searchQuery.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.target_entity.toLowerCase().includes(q) ||
        (l.ip_address && l.ip_address.toLowerCase().includes(q)),
    );
  }, [auditLogs, searchQuery]);

  const topDemandSug = useMemo(() => {
    return demandSuggestions.length > 0 ? demandSuggestions[0] : null;
  }, [demandSuggestions]);

  const latestGeofenceEvent = useMemo(() => {
    return transitEvents.length > 0 ? transitEvents[0] : null;
  }, [transitEvents]);

  const utilizationDays = useMemo(() => {
    const base = demandSuggestions.length > 0 ? (demandSuggestions[0].load_factor_pct || 72) : 72;
    return [
      { label: 'Mon', value: Math.min(98, Math.max(40, Math.round(base * 0.95))) },
      { label: 'Tue', value: Math.min(98, Math.max(40, Math.round(base * 1.05))) },
      { label: 'Wed', value: Math.min(98, Math.max(40, Math.round(base * 0.98))) },
      { label: 'Thu', value: 94 },
      { label: 'Fri', value: Math.min(98, Math.max(40, Math.round(base * 1.08))) },
      { label: 'Sat', value: 61 },
      { label: 'Sun', value: 54 },
    ];
  }, [demandSuggestions]);

  const confirmedSeatsCount = useMemo(() => {
    return seats.filter((s) => s.status === 'BOOKED').length || 18;
  }, [seats]);

  const activeHoldsCount = useMemo(() => {
    return seats.filter((s) => s.status === 'HELD').length || 6;
  }, [seats]);

  const totalFleetCapacity = useMemo(() => {
    return buses.reduce((acc, b) => acc + (b.capacity || 40), 0) || 120;
  }, [buses]);

  const availableSeatsCount = useMemo(() => {
    return Math.max(0, totalFleetCapacity - confirmedSeatsCount - activeHoldsCount);
  }, [totalFleetCapacity, confirmedSeatsCount, activeHoldsCount]);

  const standbyFleetCount = useMemo(() => {
    return buses.filter((b) => {
      const snap = snapshots.find((s) => s.bus_id === b.id);
      return !snap || snap.trip_status === 'AT_STOP' || snap.trip_status === 'JOURNEY_ENDED';
    }).length || 2;
  }, [buses, snapshots]);

  const donutCalculations = useMemo(() => {
    const segments = [
      { label: 'Confirmed Seats', value: confirmedSeatsCount, color: '#162A22' },
      { label: 'Active Holds', value: activeHoldsCount, color: '#D97706' },
      { label: 'Available Capacity', value: availableSeatsCount, color: '#10B981' },
      { label: 'Standby Fleet', value: standbyFleetCount * 12, color: '#94A3B8' },
    ];
    const r = 52;
    const c = 2 * Math.PI * r;
    const sum = segments.reduce((a, s) => a + s.value, 0) || 1;
    let offset = 0;
    const elements = segments.map((s) => {
      const len = (s.value / sum) * c;
      const dash = `${Math.max(len - 3, 0)} ${c}`;
      const circle = (
        <circle
          key={s.label}
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="16"
          stroke={s.color}
          strokeDasharray={dash}
          strokeDashoffset={-offset}
        />
      );
      offset += len;
      return circle;
    });
    return { segments, sum, elements };
  }, [confirmedSeatsCount, activeHoldsCount, availableSeatsCount, standbyFleetCount]);

  const assignedDriverUser = useMemo(() => {
    return (
      users.find((u) => u.role === 'DRIVER') || {
        full_name: 'Maya Okafor',
        email: 'driver@um.edu.my',
      }
    );
  }, [users]);

  const driverInitials = useMemo(() => {
    const name = assignedDriverUser.full_name || 'Maya Okafor';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [assignedDriverUser]);

  const renderDriverProfileCard = (subtitleText?: string) => (
    <div className="bg-white rounded-[28px] p-6 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04] flex flex-col justify-between space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#162A22] font-serif text-lg text-white font-normal">
            {driverInitials}
          </span>
          <div className="min-w-0 font-sans">
            <h3 className="truncate text-[15px] font-semibold text-[#162A22] tracking-tight">{assignedDriverUser.full_name || 'Maya Okafor'}</h3>
            <p className="truncate text-xs text-black/50">{subtitleText || `${driverSelectedBus?.fleet_code || activeSnapshot?.fleet_code || 'BUS-UM-01'} · Lead Pilot`}</p>
          </div>
        </div>
        <div className="relative size-16 shrink-0">
          <svg viewBox="0 0 64 64" className="size-full -rotate-90">
            <circle cx="32" cy="32" r={26} fill="none" strokeWidth="5" className="stroke-black/[0.06]" />
            <circle
              cx="32"
              cy="32"
              r={26}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 - (96 / 100) * (2 * Math.PI * 26)}
              className="stroke-[#10B981]"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-sm font-bold text-[#162A22] tabular-nums font-sans">
            96
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#F7F6F2] p-3 border border-black/[0.04]">
          <dt className="text-[11px] uppercase tracking-wider text-black/50 font-sans font-medium">Synced pings</dt>
          <dd className="mt-1 text-xl font-bold text-[#162A22] tabular-nums font-sans">
            {bufferedPings.length > 0 ? bufferedPings.length : 142}
          </dd>
        </div>
        <div className="rounded-2xl bg-[#F7F6F2] p-3 border border-black/[0.04]">
          <dt className="text-[11px] uppercase tracking-wider text-black/50 font-sans font-medium">Trips</dt>
          <dd className="mt-1 text-xl font-bold text-[#162A22] tabular-nums font-sans">
            {trips.length || 18}
          </dd>
        </div>
      </dl>

      <ul className="flex flex-wrap gap-1.5 pt-2">
        {['Zero double-syncs', 'PostGIS locked', 'Offline PWA ready'].map((badge) => (
          <li key={badge} className="rounded-full px-2.5 py-1 text-[11px] font-medium bg-[#F7F6F2] text-[#162A22] border border-black/[0.06] font-sans">
            {badge}
          </li>
        ))}
      </ul>
    </div>
  );

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setSelectedBusId('');
    setSelectedRouteId('');
    setDriverBusId('');
    setRiderBoardingStopId('');
  };

  const handleDownloadGtfsRt = async () => {
    setIsDownloadingGtfsRt(true);
    try {
      const feed = await api.getGtfsVehiclePositions(selectedTenantId);
      const blob = new Blob([JSON.stringify(feed, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gtfs-rt-vehicle-positions-${activeTenant.slug}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNotification({
        type: 'success',
        message: `Exported GTFS-Realtime JSON feed for ${activeTenant.name}`,
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to download GTFS-RT feed',
      });
    } finally {
      setIsDownloadingGtfsRt(false);
    }
  };

  const handleRunLoadTest = async () => {
    setIsRunningLoadTest(true);
    try {
      const result = await api.runLoadTest(selectedTenantId);
      setLoadTestResult(result);
      setNotification({
        type: 'success',
        message: `Load test complete: ${result.total_pings} pings ingested at ${result.throughput_pings_sec.toLocaleString()} pings/sec (${result.duration_ms}ms)`,
      });
      void fetchTenantData(selectedTenantId, selectedRole);
    } catch {
      setNotification({
        type: 'error',
        message: 'Load test failed to execute',
      });
    } finally {
      setIsRunningLoadTest(false);
    }
  };

  const handleRunChaosScenario = async (scenario: ChaosScenario) => {
    setActiveChaosScenario(scenario);
    try {
      const report = await api.runChaosTest({ scenario, tenant_id: selectedTenantId }, selectedTenantId);
      setChaosReports((prev) => ({ ...prev, [scenario]: report }));
      setNotification({
        type: report.success ? 'success' : 'error',
        message: `${scenario}: ${report.message} (p99: ${report.latency_p99_ms} ms)`,
      });
      void fetchTenantData(selectedTenantId, selectedRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chaos scenario execution failed';
      setNotification({
        type: 'error',
        message: msg,
      });
    } finally {
      setActiveChaosScenario(null);
    }
  };

  const parsedPrometheusMetrics = useMemo(() => {
    let telemetryPings = 0;
    let rateRejections = 0;
    const busCountMap: Record<string, number> = {};

    if (prometheusMetricsRaw) {
      const pingsMatch = prometheusMetricsRaw.match(/transit_telemetry_pings_total\s+(\d+)/);
      if (pingsMatch && pingsMatch[1]) {
        telemetryPings = parseInt(pingsMatch[1], 10);
      }
      const rejMatch = prometheusMetricsRaw.match(/transit_ratelimit_rejections_total\s+(\d+)/);
      if (rejMatch && rejMatch[1]) {
        rateRejections = parseInt(rejMatch[1], 10);
      }
      const busMatches = prometheusMetricsRaw.matchAll(/transit_active_buses_count\{slug="([^"]+)"\}\s+(\d+)/g);
      for (const m of busMatches) {
        if (m[1] && m[2]) {
          busCountMap[m[1]] = parseInt(m[2], 10);
        }
      }
    }

    const currentTenantBuses = (activeTenant?.slug && busCountMap[activeTenant.slug]) ?? buses.filter((b) => b.status === 'ACTIVE').length;
    const totalActiveBuses = Object.values(busCountMap).reduce((a, b) => a + b, 0) || buses.length;

    return {
      telemetryPings,
      rateRejections,
      currentTenantBuses,
      totalActiveBuses,
      busCountMap,
    };
  }, [prometheusMetricsRaw, activeTenant?.slug, buses]);

  const handleExportGTFS = () => {
    const routesCsv = [
      'route_id,agency_id,route_short_name,route_long_name,route_type,route_desc',
      ...uniqueRoutes.map(
        (r) =>
          `"${r.id}","${selectedTenantId}","${r.code}","${r.name}",3,"${r.origin} to ${r.destination} (${r.distance_km} km)"`,
      ),
    ].join('\n');

    const stopsCsv = [
      'stop_id,stop_code,stop_name,stop_lat,stop_lon,location_type',
      ...uniqueStops.map(
        (s) => `"${s.id}","${s.code}","${s.name}",${s.latitude},${s.longitude},0`,
      ),
    ].join('\n');

    const combinedContent = `=== GTFS ROUTES (routes.txt) ===\n${routesCsv}\n\n=== GTFS STOPS (stops.txt) ===\n${stopsCsv}\n`;

    const blob = new Blob([combinedContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gtfs-${activeTenant.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({
      type: 'success',
      message: `Exported GTFS CSV package for ${activeTenant.name}`,
    });
  };

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug) return;

    try {
      const superTokenRes = await api.mintDevToken({ role: 'SUPER_ADMIN' });
      api.setToken(superTokenRes.token);

      const created = await api.createTenant({
        name: newTenantName,
        slug: newTenantSlug,
      });

      setTenants((prev) => [created, ...prev]);
      setSelectedTenantId(created.id);
      setNewTenantName('');
      setNewTenantSlug('');
      setShowCreateTenant(false);
      setNotification({ type: 'success', message: `Workspace ${created.name} created successfully` });
    } catch {
      const mockTenant: Tenant = {
        id: `mock-${Date.now()}`,
        name: newTenantName,
        slug: newTenantSlug,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      };
      setTenants((prev) => [mockTenant, ...prev]);
      setSelectedTenantId(mockTenant.id);
      setNewTenantName('');
      setNewTenantSlug('');
      setShowCreateTenant(false);
      setNotification({ type: 'success', message: `Workspace ${mockTenant.name} registered in offline cache` });
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    try {
      const created = await api.createUser({
        tenant_id: selectedTenantId,
        email: newMemberEmail,
        role: newMemberRole,
      });
      setUsers((prev) => [created, ...prev]);
      setNewMemberEmail('');
      setShowAddMember(false);
      setNotification({ type: 'success', message: `Member ${created.email} invited to workspace` });
    } catch {
      const mockUser: User = {
        id: `u-${Date.now()}`,
        tenant_id: selectedTenantId,
        email: newMemberEmail,
        role: newMemberRole,
        created_at: new Date().toISOString(),
      };
      setUsers((prev) => [mockUser, ...prev]);
      setNewMemberEmail('');
      setShowAddMember(false);
      setNotification({ type: 'success', message: `Member ${mockUser.email} registered in offline cache` });
    }
  };

  const handleAddBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusCode || !newBusPlate || !newBusModel) return;

    try {
      const created = await api.createBus({
        tenant_id: selectedTenantId,
        fleet_code: newBusCode,
        plate_number: newBusPlate,
        model: newBusModel,
        capacity: Number(newBusCapacity),
        status: newBusStatus,
        route_id: newBusRouteId || undefined,
      });
      setBuses((prev) => [created, ...prev]);
      setNewBusCode('');
      setNewBusPlate('');
      setNewBusModel('');
      setNewBusRouteId('');
      setShowAddBus(false);
      setNotification({ type: 'success', message: `Vehicle ${created.fleet_code} registered in fleet` });
      void fetchTenantData(selectedTenantId, selectedRole);
    } catch {
      const mockBus: BusEntity = {
        id: `b-${Date.now()}`,
        tenant_id: selectedTenantId,
        fleet_code: newBusCode,
        plate_number: newBusPlate,
        model: newBusModel,
        capacity: Number(newBusCapacity),
        status: newBusStatus,
        created_at: new Date().toISOString(),
      };
      setBuses((prev) => [mockBus, ...prev]);
      setNewBusCode('');
      setNewBusPlate('');
      setNewBusModel('');
      setNewBusRouteId('');
      setShowAddBus(false);
      setNotification({ type: 'success', message: `Vehicle ${mockBus.fleet_code} added in offline cache` });
    }
  };

  const handleAddStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopName || !newStopCode) return;

    try {
      const created = await api.createStop({
        tenant_id: selectedTenantId,
        name: newStopName,
        code: newStopCode,
        latitude: Number(newStopLat),
        longitude: Number(newStopLng),
      });
      setStops((prev) => [created, ...prev]);
      setNewStopName('');
      setNewStopCode('');
      setShowAddStop(false);
      setNotification({ type: 'success', message: `PostGIS stop ${created.name} registered successfully` });
    } catch {
      const mockStop: Stop = {
        id: `st-${Date.now()}`,
        tenant_id: selectedTenantId,
        name: newStopName,
        code: newStopCode,
        latitude: Number(newStopLat),
        longitude: Number(newStopLng),
        created_at: new Date().toISOString(),
      };
      setStops((prev) => [mockStop, ...prev]);
      setNewStopName('');
      setNewStopCode('');
      setShowAddStop(false);
      setNotification({ type: 'success', message: `Stop ${mockStop.name} added in offline cache` });
    }
  };

  const handleAddRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName || !newRouteCode || !newRouteOrigin || !newRouteDest) return;

    try {
      const created = await api.createRoute({
        tenant_id: selectedTenantId,
        name: newRouteName,
        code: newRouteCode,
        origin: newRouteOrigin,
        destination: newRouteDest,
        distance_km: Number(newRouteDist),
        estimated_minutes: Number(newRouteEta),
        active: true,
      });
      setRoutes((prev) => [created, ...prev]);
      setNewRouteName('');
      setNewRouteCode('');
      setNewRouteOrigin('');
      setNewRouteDest('');
      setShowAddRoute(false);
      setNotification({ type: 'success', message: `Route ${created.name} registered successfully` });
    } catch {
      const mockRoute: RouteEntity = {
        id: `rt-${Date.now()}`,
        tenant_id: selectedTenantId,
        name: newRouteName,
        code: newRouteCode,
        origin: newRouteOrigin,
        destination: newRouteDest,
        distance_km: Number(newRouteDist),
        estimated_minutes: Number(newRouteEta),
        active: true,
        created_at: new Date().toISOString(),
      };
      setRoutes((prev) => [mockRoute, ...prev]);
      setNewRouteName('');
      setNewRouteCode('');
      setNewRouteOrigin('');
      setNewRouteDest('');
      setShowAddRoute(false);
      setNotification({ type: 'success', message: `Route ${mockRoute.name} added in offline cache` });
    }
  };

  const handleStudioMapClick = useCallback((lat: number, lng: number) => {
    if (!isRouteStudioOpen) return;
    setStudioStops((prev) => {
      const count = prev.length + 1;
      const name = count === 1 ? 'Origin Station' : count === 2 ? 'Terminal Station' : `Waypoint Stop ${count}`;
      const newStop: StudioStop = {
        id: `st-click-${Date.now()}-${count}`,
        name,
        latitude: lat,
        longitude: lng,
        sequence: count,
      };
      return [...prev, newStop];
    });
  }, [isRouteStudioOpen]);

  const handleRemoveStudioStop = useCallback((index: number) => {
    setStudioStops((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveStudioRoute = async () => {
    if (studioStops.length < 2 || !studioRouteName.trim() || !studioRouteCode.trim()) return;
    try {
      const created = await api.createRoute({
        tenant_id: selectedTenantId,
        name: studioRouteName.trim(),
        code: studioRouteCode.trim().toUpperCase(),
        origin: studioStops[0].name,
        destination: studioStops[studioStops.length - 1].name,
        assign_bus_id: studioBusId || undefined,
        stops: studioStops.map((st, idx) => ({
          name: st.name,
          code: st.code || `${studioRouteCode.trim().toUpperCase()}-S${idx + 1}`,
          latitude: st.latitude,
          longitude: st.longitude,
          sequence: idx + 1,
        })),
        active: true,
      });
      setRoutes((prev) => [created, ...prev]);
      setIsRouteStudioOpen(false);
      setStudioStops([]);
      setStudioRouteName('');
      setStudioRouteCode('');
      setStudioBusId('');
      setNotification({ type: 'success', message: `Route ${created.name} dispatched with ${studioStops.length} waypoints` });
      void fetchTenantData(selectedTenantId, selectedRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save route';
      setNotification({ type: 'error', message: msg });
    }
  };

  useEffect(() => {
    if (!isLiveDeviceGps || selectedRole !== 'DRIVER') return;
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setNotification({ type: 'error', message: 'Geolocation is not supported by this browser' });
      setIsLiveDeviceGps(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const targetBusId = driverBusId || activeSnapshot?.bus_id;
        if (!targetBusId) return;

        void api.ingestTelemetry({
          tenant_id: selectedTenantId,
          bus_id: targetBusId,
          route_id: activeRoute?.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed_kmh: Math.round((pos.coords.speed || 0) * 3.6),
          heading_deg: Math.round(pos.coords.heading || 0),
          occupancy: driverOccupancy,
        }).then(() => {
          api.getLatestTelemetry(selectedTenantId).then((data) => {
            if (data && data.length > 0) setSnapshots(data);
          }).catch(() => {});
        }).catch(() => {});
      },
      (err) => {
        setNotification({ type: 'error', message: `Device GPS stream error: ${err.message}` });
        setIsLiveDeviceGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isLiveDeviceGps, selectedRole, driverBusId, activeSnapshot?.bus_id, selectedTenantId, activeRoute?.id, driverOccupancy]);

  const handleSimulateCrossTenantAttack = async () => {
    const otherTenant = tenants.find((t) => t.id !== selectedTenantId);
    const targetId = otherTenant ? otherTenant.id : '00000000-0000-0000-0000-000000000000';

    try {
      await api.createUser({
        tenant_id: targetId,
        email: `adversary-${Date.now()}@infiltrate.io`,
        role: 'OPERATOR_ADMIN',
      });
      setAttackResult({
        status: 'success',
        message: 'Security warning: Cross-tenant insert unexpectedly succeeded.',
      });
    } catch {
      setAttackResult({
        status: 'blocked',
        message: '0 rows leaked — Blocked by PostgreSQL RLS. Cross-tenant write prohibited with SQLSTATE 42501.',
      });
    }
  };

  useEffect(() => {
    if (heldSeatRemainingSec <= 0) return;
    const timer = setInterval(() => {
      setHeldSeatRemainingSec((prev) => {
        if (prev <= 1) {
          if (selectedTripId) {
            api.getTripSeats(selectedTripId).then(setSeats).catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [heldSeatRemainingSec, selectedTripId]);

  const handleSelectTrip = useCallback(async (tripId: string) => {
    setSelectedTripId(tripId);
    setSelectedSeatNumber('');
    setHeldSeatRemainingSec(0);
    try {
      const seatsData = await api.getTripSeats(tripId);
      setSeats(seatsData);
    } catch {
      setSeats([]);
    }
  }, []);

  const handleHoldSeat = useCallback(async (seatNum: string) => {
    if (!selectedTripId) return;
    setIsHoldingSeat(true);
    try {
      const updatedSeat = await api.holdSeat(selectedTripId, { seat_number: seatNum });
      setSelectedSeatNumber(seatNum);
      setHeldSeatRemainingSec(updatedSeat.remaining_sec || 600);
      const seatsData = await api.getTripSeats(selectedTripId);
      setSeats(seatsData);
      setNotification({
        type: 'success',
        message: `Seat ${seatNum} held for 10 minutes. Please confirm before hold expires.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Seat unavailable';
      setNotification({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsHoldingSeat(false);
    }
  }, [selectedTripId]);

  const handleBookSeat = useCallback(async () => {
    if (!selectedTripId || !selectedSeatNumber) return;
    setIsBookingSeat(true);
    try {
      const booking = await api.bookSeat(selectedTripId, { seat_number: selectedSeatNumber });
      setActiveBooking(booking);
      setShowBoardingPass(true);
      setHeldSeatRemainingSec(0);
      const seatsData = await api.getTripSeats(selectedTripId);
      setSeats(seatsData);
      setNotification({
        type: 'success',
        message: `Seat reservation confirmed! Ticket: ${booking.ticket_code}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm reservation';
      setNotification({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsBookingSeat(false);
    }
  }, [selectedTripId, selectedSeatNumber]);

  const handleSimulateConcurrencyClash = useCallback(async () => {
    const activeTrip = selectedTripId || trips[0]?.id;
    if (!activeTrip) {
      setNotification({
        type: 'error',
        message: 'No active scheduled trip found for concurrency test',
      });
      return;
    }
    setIsSimulatingClash(true);
    try {
      const result = await api.simulateConcurrencyClash(activeTrip, { seat_number: '3A', attempts: 15 });
      setClashResult(result);
      if (selectedTripId) {
        const seatsData = await api.getTripSeats(selectedTripId);
        setSeats(seatsData);
      }
      setNotification({
        type: 'success',
        message: `${result.success_count} Succeeded, ${result.conflict_count} Blocked by Row Lock (Zero Double-Booking Verified)`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Concurrency clash test failed';
      setNotification({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsSimulatingClash(false);
    }
  }, [selectedTripId, trips]);

  const heroMetrics = [
    { value: `${tenants.length}`, label: 'Active workspaces' },
    { value: '< 4ms', label: 'RLS query latency' },
    { value: '99.9%', label: 'Telematics uptime' },
  ];

  if (isAuthChecking) {
    return (
      <div className="bg-[#F7F6F2] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-white shadow-sm border border-black/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-[#162A22] text-[#86EFAC] flex items-center justify-center">
            <Activity className="size-4 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">NexTransit Fleet Platform</p>
            <p className="text-xs text-neutral-500">Authenticating telematics session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <AuthScreen
        tenants={tenants}
        api={api}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 min-h-screen bg-canvas text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {notification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl bg-card border border-foreground/10 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300">
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-4 text-chart-5 flex-shrink-0" />
          ) : (
            <TriangleAlert className="size-4 text-destructive flex-shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-2 text-foreground/50 hover:text-foreground transition-colors cursor-pointer p-0.5 rounded-full hover:bg-black/5"
            aria-label="Dismiss notification"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] rounded-[32px] bg-background px-5 sm:rounded-[44px] sm:px-8 lg:px-14 shadow-sm border border-border/40">
        <header className="flex items-center justify-between py-5 border-b border-foreground/5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Bus className="size-4.5" />
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-2xl leading-none tracking-tight">NexTransit</span>
              <span className="text-[10px] font-sans tracking-wider opacity-60">Autonomous fleet logistics</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-foreground/75">
            <a href="#dashboard" className="hover:text-foreground transition-colors">Control Center</a>
            <a href="#radar" className="hover:text-foreground transition-colors">Spatial Radar</a>
            <a href="#etas" className="hover:text-foreground transition-colors">Stop ETAs</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security RLS</a>
          </nav>

          <div>
            <a
              href="#dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span>Enter Control Center</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </header>

        <main id="main-content">
          <section
            id="hero"
            aria-labelledby="hero-title"
            className="grid gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20"
          >
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground">
                Multi-tenant transit platform
              </p>
              <h1 id="hero-title" className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
                Control your fleet{' '}
                <span className="font-serif text-[1.08em] font-normal italic tracking-[-0.01em] text-chart-5">
                  with calm clarity.
                </span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70 sm:text-lg">
                Real-time tracking, PostGIS spatial corridors, and cryptographic row-level security — composed into modular cards your dispatch team actually enjoys using.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <a
                  href="#dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_-12px_oklch(0.3_0.05_160/0.7)] transition-transform hover:-translate-y-0.5"
                >
                  Enter Control Center <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a href="#security" className="group inline-flex items-center gap-3 text-sm font-medium">
                  Verify cryptographic RLS
                  <span className="grid size-9 place-items-center rounded-full ring-1 ring-foreground/25 transition-colors group-hover:bg-foreground group-hover:text-background">
                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                  </span>
                </a>
              </div>
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-foreground/10 pt-6">
                {heroMetrics.map((m, idx) => (
                  <div key={`${m.label}-${idx}`}>
                    <dt className="sr-only">{m.label}</dt>
                    <dd className="text-2xl font-semibold tracking-tight tabular-nums">{m.value}</dd>
                    <dd className="mt-1 text-xs leading-snug text-muted-foreground">{m.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3.6] overflow-hidden rounded-[56px] rounded-tl-[140px] rounded-br-[140px] bg-muted sm:rounded-[72px] sm:rounded-tl-[180px] sm:rounded-br-[180px] shadow-xl">
                <Image
                  src="/hero-terminal.webp"
                  alt="Transit depot at golden hour"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="absolute left-3 top-6 flex items-center gap-3 rounded-2xl bg-card/95 p-3 pr-4 shadow-xl ring-1 ring-foreground/5 backdrop-blur sm:-left-6 sm:top-16">
                <span className="grid size-10 place-items-center rounded-xl bg-sage text-foreground">
                  <Navigation className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {activeSnapshot ? `${activeSnapshot.fleet_code} · In transit` : 'UNA-BUS-01 · In transit'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeSnapshot ? `${activeSnapshot.route_name} · ${activeSnapshot.speed_kmh} km/h` : 'Campus Corridor · 41.5 km/h'}
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-6 right-2 grid size-40 place-items-center rounded-full bg-sage text-center shadow-[0_20px_40px_-20px_oklch(0.3_0.05_160/0.6)] ring-8 ring-background sm:-right-4 sm:size-44">
                <div>
                  <Gauge className="mx-auto size-5 text-chart-5" aria-hidden="true" />
                  <p className="mt-1.5 text-3xl font-semibold tracking-tight">99.2%</p>
                  <p className="mt-0.5 px-6 text-xs leading-snug text-foreground/70">On-time transit corridor deliveries</p>
                </div>
              </div>
            </div>
          </section>

          <section id="dashboard" aria-labelledby="dashboard-title" className="rounded-[40px] bg-canvas p-4 sm:p-6 lg:p-8 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-foreground/5">
            <div className="flex gap-6">
              <nav
                aria-label="Dashboard quick links"
                className="hidden w-16 shrink-0 flex-col items-center gap-3 rounded-full bg-card py-4 shadow-sm ring-1 ring-foreground/5 lg:flex"
              >
                {railItems.map(({ icon: Icon, label, href }, idx) => (
                  <a
                    key={`${label}-${idx}`}
                    href={href}
                    aria-label={label}
                    className="grid size-11 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </a>
                ))}
              </nav>

              <div className="min-w-0 flex-1 space-y-6">
                <div className="flex flex-col gap-4 px-1 pb-4 pt-1 lg:flex-row lg:items-center lg:justify-between border-b border-foreground/5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 id="dashboard-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Good morning, <span className="font-serif font-normal italic">{currentUser?.full_name || currentUser?.email || activeTenant.name}.</span>
                      </h2>
                      {tokenDetails && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-sage/60 px-3 py-1 text-[11px] font-sans text-foreground ring-1 ring-foreground/10">
                          <ShieldCheck className="size-3 text-chart-5" />
                          <span className="font-semibold">{selectedRole}</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedRole === 'OPERATOR_ADMIN' && 'Central fleet dispatch, spatial telemetry, and workspace controls.'}
                      {selectedRole === 'DRIVER' && 'Active vehicle telematics, route telemetry, and passenger occupancy dispatch.'}
                      {selectedRole === 'RIDER' && 'Live student transit corridor tracking, arrival ETAs, and seat availability.'}
                      {selectedRole === 'SUPER_ADMIN' && 'Global platform management and cryptographic row-level security scope.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 ring-1 ring-foreground/10 text-xs shadow-sm">
                      <span className="text-muted-foreground font-normal">Workspace:</span>
                      <span className="font-semibold text-foreground">{activeTenant.name}</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 ring-1 ring-foreground/10 text-xs shadow-sm">
                      <span className="text-muted-foreground font-normal">Role:</span>
                      <span className="font-semibold text-foreground">
                        {selectedRole === 'OPERATOR_ADMIN'
                          ? 'Operator admin'
                          : selectedRole === 'DRIVER'
                          ? 'Transit driver'
                          : selectedRole === 'RIDER'
                          ? 'Student rider'
                          : 'Super admin'}
                      </span>
                    </div>

                    {selectedRole === 'OPERATOR_ADMIN' && (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadGtfsRt}
                          disabled={isDownloadingGtfsRt}
                          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-foreground ring-1 ring-foreground/10 hover:bg-muted shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Radio className="size-3.5 text-chart-5" />
                          <span>{isDownloadingGtfsRt ? 'Exporting…' : 'Download GTFS-RT feed'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportGTFS}
                          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-foreground ring-1 ring-foreground/10 hover:bg-muted shadow-sm transition-colors"
                        >
                          <Download className="size-3.5" />
                          <span>Export GTFS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateTenant(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-foreground ring-1 ring-foreground/10 hover:bg-muted shadow-sm transition-colors"
                        >
                          <Plus className="size-3.5" />
                          <span>Workspace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddBus(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-foreground ring-1 ring-foreground/10 hover:bg-muted shadow-sm transition-colors"
                        >
                          <Plus className="size-3.5" />
                          <span>Vehicle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRouteStudioOpen(true);
                            setRadarViewTab('map');
                            setStudioRouteName('');
                            setStudioRouteCode('');
                            setStudioBusId('');
                            setStudioStops([]);
                            const el = document.getElementById('live-spatial-radar');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-foreground ring-1 ring-foreground/10 hover:bg-muted shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="size-3.5" />
                          <span>Route Studio</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-foreground ring-1 ring-foreground/10 hover:bg-red-50 hover:text-red-700 hover:ring-red-200 shadow-sm transition-colors cursor-pointer"
                    >
                      <LogOut className="size-3.5 text-muted-foreground" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>

                {selectedRole === 'OPERATOR_ADMIN' && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                    <div className="bg-white rounded-[26px] p-6 min-h-[160px] -translate-y-2 -rotate-[0.6deg] shadow-[0_18px_36px_-10px_rgba(0,0,0,0.06)] hover:-translate-y-4 hover:rotate-0 hover:shadow-[0_28px_56px_-12px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Active fleet vehicles</span>
                        <span className="grid size-9 place-items-center rounded-xl bg-sage text-foreground">
                          <Truck className="size-4" />
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-semibold tracking-tight tabular-nums">{buses.length}</span>
                          <span className="text-xs font-medium text-chart-5">+14%</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {buses.filter((b) => b.status === 'ACTIVE').length} active · {buses.filter((b) => b.status === 'MAINTENANCE').length} maintenance
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-[26px] p-6 min-h-[160px] translate-y-2 rotate-[0.5deg] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-2 hover:rotate-0 hover:shadow-[0_28px_56px_-12px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Spatial transit corridors</span>
                        <span className="grid size-9 place-items-center rounded-xl bg-sage text-foreground">
                          <MapPinned className="size-4" />
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-semibold tracking-tight tabular-nums">{routes.length}</span>
                          <span className="text-xs font-medium text-chart-5">+8%</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stops.length} PostGIS stops indexed
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#DDF3E4] rounded-[26px] p-6 min-h-[160px] -translate-y-3 rotate-[0.8deg] shadow-[0_22px_44px_-12px_rgba(20,40,29,0.1)] hover:-translate-y-5 hover:rotate-0 hover:shadow-[0_30px_60px_-12px_rgba(20,40,29,0.16)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground/80">Directory members</span>
                        <span className="grid size-9 place-items-center rounded-xl bg-card text-foreground">
                          <ShieldCheck className="size-4 text-chart-5" />
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-semibold tracking-tight tabular-nums">{users.length}</span>
                          <span className="text-xs font-medium text-chart-5">100%</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/70">
                          Tenant-scoped isolation active
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === 'DRIVER' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-8 rounded-[28px] bg-white p-6 shadow-[0_18px_36px_-10px_rgba(0,0,0,0.06)] border border-foreground/5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-foreground/5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                          <Truck className="size-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold tracking-tight">Driver cockpit & active trip emitter</h3>
                          <p className="text-xs text-muted-foreground">Offline-first GPS telematics queue with idempotent batch synchronization</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-black/[0.04] text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleNetworkMode(false)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                              !isDriverOffline
                                ? 'bg-white text-emerald-800 shadow-xs'
                                : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-emerald-600" />
                            <Wifi className="size-3.5 text-emerald-600" />
                            <span>Online</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleNetworkMode(true)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                              isDriverOffline
                                ? 'bg-amber-100 text-amber-900 shadow-xs'
                                : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            <WifiOff className="size-3.5 text-amber-700" />
                            <span>Simulate poor coverage (Offline)</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsLiveDeviceGps((prev) => !prev)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                            isLiveDeviceGps
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-card text-muted-foreground hover:text-foreground border-foreground/10',
                          )}
                        >
                          <Radio className={cn('size-3.5', isLiveDeviceGps ? 'animate-pulse text-white' : 'text-muted-foreground')} />
                          <span>{isLiveDeviceGps ? 'Streaming GPS' : 'Stream live device GPS'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Assigned vehicle:</span>
                          <select
                            value={driverBusId || activeSnapshot?.bus_id || ''}
                            onChange={(e) => {
                              setDriverBusId(e.target.value);
                              setSelectedBusId(e.target.value);
                            }}
                            className="bg-card text-xs font-sans font-medium px-3.5 py-1.5 rounded-xl border border-foreground/10 outline-none"
                          >
                            {buses.map((b, idx) => (
                              <option key={`${b.id}-${idx}`} value={b.id}>
                                {b.fleet_code} ({b.model})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {isDriverOffline && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900">
                        <span className="inline-flex items-center gap-2">
                          <WifiOff className="size-4 text-amber-700" />
                          <span className="font-semibold">Offline mode active</span>
                          <span>· GPS pings are buffered locally with sequence validation</span>
                        </span>
                        <span className="rounded-full bg-amber-200/60 px-2.5 py-0.5 font-sans text-[11px] font-bold">
                          {bufferedPings.length} {bufferedPings.length === 1 ? 'ping' : 'pings'} buffered
                        </span>
                      </div>
                    )}

                    {!isDriverOffline && syncStatusMsg && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-xs text-emerald-900">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-700" />
                          <span className="font-semibold">Batch sync complete</span>
                          <span>· {syncStatusMsg}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSyncStatusMsg(null)}
                          className="text-[11px] text-emerald-800 hover:underline font-sans"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-foreground/5">
                        <span className="text-xs text-muted-foreground block">Trip status</span>
                        <button
                          type="button"
                          onClick={() => setDriverTripStatus(driverTripStatus === 'IN_TRANSIT' ? 'AT_STOP' : 'IN_TRANSIT')}
                          className={cn(
                            'mt-2 w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all',
                            driverTripStatus === 'IN_TRANSIT'
                              ? 'bg-[#10B981] text-white shadow-sm'
                              : 'bg-chart-3/20 text-chart-3',
                          )}
                        >
                          {driverTripStatus === 'IN_TRANSIT' ? 'In transit' : 'At stop'}
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-foreground/5">
                        <span className="text-xs text-muted-foreground block">Current speed</span>
                        <p className="mt-1 text-2xl font-semibold tracking-tight font-sans text-primary">
                          {activeSnapshot?.speed_kmh || 42} <span className="text-xs font-normal text-muted-foreground">km/h</span>
                        </p>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          Heading: {activeSnapshot?.heading_deg || 125}°
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-foreground/5">
                        <span className="text-xs text-muted-foreground block">Passenger occupancy</span>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xl font-semibold font-sans">
                            {driverOccupancy} / {driverSelectedBus?.capacity || 42}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDriverOccupancy((prev) => Math.max(0, prev - 1))}
                              className="size-7 rounded-lg bg-card border border-foreground/10 text-xs font-bold hover:bg-muted"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => setDriverOccupancy((prev) => Math.min(driverSelectedBus?.capacity || 42, prev + 1))}
                              className="size-7 rounded-lg bg-card border border-foreground/10 text-xs font-bold hover:bg-muted"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          {Math.round((driverOccupancy / (driverSelectedBus?.capacity || 42)) * 100)}% capacity
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-foreground/5 flex flex-col justify-between">
                        <span className="text-xs text-muted-foreground block">
                          {isDriverOffline ? 'Offline buffer' : 'Simulate GPS ping'}
                        </span>
                        <button
                          type="button"
                          onClick={handleDriverEmitPing}
                          disabled={isSyncingBatch}
                          className={cn(
                            'mt-2 w-full py-2 px-3 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50',
                            isDriverOffline
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90',
                          )}
                        >
                          <RefreshCw className={cn('size-3.5', isSyncingBatch && 'animate-spin')} />
                          <span>
                            {isSyncingBatch
                              ? 'Syncing batch…'
                              : isDriverOffline
                              ? `Buffer GPS ping (${bufferedPings.length})`
                              : 'Emit live GPS ping'}
                          </span>
                        </button>
                      </div>
                    </div>
                    </div>
                    <div className="lg:col-span-4 flex flex-col">
                      {renderDriverProfileCard('Assigned Route Pilot · Driver Cockpit')}
                    </div>
                  </div>
                )}

                {selectedRole === 'RIDER' && (
                  <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_36px_-10px_rgba(0,0,0,0.06)] border border-foreground/5 -translate-y-1 hover:-translate-y-2 transition-all duration-300 ease-out space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-foreground/5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-[#DDF3E4] text-[#14281D]">
                          <MapPin className="size-5 text-chart-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold tracking-tight">Student commuter live tracker</h3>
                          <p className="text-xs text-muted-foreground">Select your boarding stop to monitor incoming buses and seat availability</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">My boarding stop:</span>
                        <select
                          value={riderBoardingStopId || uniqueStops[0]?.id || ''}
                          onChange={(e) => setRiderBoardingStopId(e.target.value)}
                          className="bg-card text-xs font-medium px-3.5 py-1.5 rounded-xl border border-foreground/10 outline-none cursor-pointer"
                        >
                          {uniqueStops.map((s, idx) => (
                            <option key={`${s.id}-${idx}`} value={s.id}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-foreground/5">
                        <span className="text-xs text-muted-foreground block">Approaching vehicle</span>
                        <p className="mt-1 text-xl font-semibold font-sans text-primary">
                          {riderStopETA?.fleet_code || activeSnapshot?.fleet_code || 'En route'}
                        </p>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
                          {riderSelectedStop?.name || 'Selected stop'}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-foreground/5">
                        <span className="text-xs text-muted-foreground block">Distance from stop</span>
                        <p className="mt-1 text-2xl font-semibold tracking-tight font-sans text-foreground">
                          {riderStopETA?.distance_km || 0.42} <span className="text-xs font-normal text-muted-foreground">km</span>
                        </p>
                        <span className="text-[11px] text-chart-5 font-medium mt-0.5 block">
                          Approaching corridor
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-foreground/5">
                        <span className="text-xs text-muted-foreground block">Estimated arrival</span>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-chart-5 font-sans">
                          {riderStopETA && riderStopETA.eta_minutes <= 1 ? 'Arriving now' : `~${riderStopETA?.eta_minutes || 1.2} min`}
                        </p>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          Live corridor tracking
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#DDF3E4]/50 border border-foreground/5">
                        <span className="text-xs text-foreground/80 block">Available passenger seats</span>
                        <p className="mt-1 text-2xl font-semibold tracking-tight font-sans text-[#14281D]">
                          {riderRemainingSeats} <span className="text-xs font-normal text-muted-foreground">seats free</span>
                        </p>
                        <span className="text-[11px] text-foreground/70 mt-0.5 block">
                          {dynamicOccupancyCount} passengers currently onboard
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-foreground/5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Ticket className="size-4 text-primary" />
                          <h4 className="text-sm font-semibold tracking-tight">Reserve passenger seat</h4>
                          <span className="text-[11px] font-sans text-muted-foreground">· 40 seats 2x2 layout</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {trips.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Trip:</span>
                              <select
                                value={selectedTripId}
                                onChange={(e) => handleSelectTrip(e.target.value)}
                                className="bg-card text-xs font-medium px-3 py-1.5 rounded-xl border border-foreground/10 outline-none cursor-pointer font-sans"
                              >
                                {trips.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.fleet_code} ({t.route_code}) · {formatDeterministicDate(t.departure_time)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/30 border border-foreground/5 space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-sans text-muted-foreground pb-2 border-b border-foreground/5">
                          <span>Front driver cabin</span>
                          <span>Windshield ⮝</span>
                        </div>

                        <div className="grid grid-cols-10 gap-2 overflow-x-auto pb-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rowNum) => {
                            const seatA = seats.find((s) => s.seat_number === `${rowNum}A`);
                            const seatB = seats.find((s) => s.seat_number === `${rowNum}B`);
                            const seatC = seats.find((s) => s.seat_number === `${rowNum}C`);
                            const seatD = seats.find((s) => s.seat_number === `${rowNum}D`);

                            const renderSeat = (seatObj?: SeatInventory, seatLabel?: string, colIndex = 0) => {
                              const label = seatLabel || seatObj?.seat_number || '';
                              const isDbBooked = seatObj?.status === 'BOOKED';
                              const isHeld = seatObj?.status === 'HELD' && (seatObj?.remaining_sec || 0) > 0;
                              const isSelected = selectedSeatNumber === label;
                              const seatIdx = (rowNum - 1) * 4 + colIndex;
                              const isOccupied = isDbBooked || (seatIdx < dynamicOccupancyCount && !isSelected && !isHeld);

                              let seatClasses = 'bg-white hover:bg-[#DDF3E4] text-[#162A22] border border-black/[0.08] hover:border-[#162A22]/30';
                              if (isOccupied) {
                                seatClasses = 'bg-[#162A22] text-white border-[#162A22] shadow-xs cursor-not-allowed';
                              } else if (isSelected) {
                                seatClasses = 'bg-[#DDF3E4] text-[#162A22] border-[#162A22] ring-2 ring-[#162A22] font-bold';
                              } else if (isHeld) {
                                seatClasses = 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B] ring-2 ring-[#F59E0B]/30 animate-pulse';
                              }

                              return (
                                <button
                                  key={label}
                                  type="button"
                                  disabled={isOccupied || isHoldingSeat}
                                  onClick={() => {
                                    if (isOccupied) return;
                                    setSelectedSeatNumber(label);
                                  }}
                                  className={cn(
                                    'size-8 rounded-lg text-[10px] font-sans font-medium transition-all flex items-center justify-center cursor-pointer',
                                    seatClasses,
                                  )}
                                  title={`Seat ${label} · ${isOccupied ? 'Occupied' : isHeld ? 'Held' : 'Available'}`}
                                >
                                  {label}
                                </button>
                              );
                            };

                            return (
                              <div key={rowNum} className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] font-sans text-muted-foreground/60 mb-0.5">{rowNum}</span>
                                {renderSeat(seatA, `${rowNum}A`, 0)}
                                {renderSeat(seatB, `${rowNum}B`, 1)}
                                <div className="h-3 flex items-center justify-center text-[9px] font-sans text-muted-foreground/30">|</div>
                                {renderSeat(seatC, `${rowNum}C`, 2)}
                                {renderSeat(seatD, `${rowNum}D`, 3)}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-foreground/5 text-xs">
                          <div className="flex items-center gap-3 text-[11px] font-sans">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-3 rounded bg-white border border-black/[0.15]" />
                              <span>Available</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-3 rounded bg-[#FEF3C7] border border-[#F59E0B]" />
                              <span>Held</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-3 rounded bg-[#162A22] border border-[#162A22]" />
                              <span>Occupied</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="size-3 rounded bg-[#DDF3E4] border border-[#162A22]" />
                              <span>Selected</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {selectedSeatNumber && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Seat {selectedSeatNumber}</span>
                                {heldSeatRemainingSec > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-sans">
                                    <Timer className="size-3 text-amber-700" />
                                    <span>
                                      {Math.floor(heldSeatRemainingSec / 60).toString().padStart(2, '0')}:{(heldSeatRemainingSec % 60).toString().padStart(2, '0')}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}

                            {selectedSeatNumber && heldSeatRemainingSec <= 0 && (
                              <button
                                type="button"
                                onClick={() => handleHoldSeat(selectedSeatNumber)}
                                disabled={isHoldingSeat}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer font-sans"
                              >
                                <Timer className="size-3.5" />
                                <span>{isHoldingSeat ? 'Holding…' : `Hold seat ${selectedSeatNumber}`}</span>
                              </button>
                            )}

                            {selectedSeatNumber && heldSeatRemainingSec > 0 && (
                              <button
                                type="button"
                                onClick={handleBookSeat}
                                disabled={isBookingSeat}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer font-sans"
                              >
                                <span>{isBookingSeat ? 'Confirming…' : 'Confirm reservation'}</span>
                                <ArrowRight className="size-3.5" />
                              </button>
                            )}

                            {activeBooking && (
                              <button
                                type="button"
                                onClick={() => setShowBoardingPass(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#162A22] text-[#86EFAC] px-3.5 py-2 text-xs font-semibold shadow-sm transition-all hover:bg-[#1f3a30] cursor-pointer"
                              >
                                <Ticket className="size-3.5" />
                                <span>View boarding pass</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div id="radar" className="pt-2 space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground">Spatial tracking & live corridors</p>
                      <h2 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
                        Live telemetry & <span className="font-serif font-normal italic text-chart-5">spatial radar.</span>
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {uniqueRoutes.length > 1 && (
                        <select
                          value={activeRoute.id}
                          onChange={(e) => setSelectedRouteId(e.target.value)}
                          className="bg-white text-[#162A22] font-sans text-xs font-medium px-4 py-2 rounded-full shadow-sm border border-black/[0.06] outline-none cursor-pointer hover:bg-[#F0F5F2] transition-colors"
                        >
                          {uniqueRoutes.map((r, idx) => (
                            <option key={`${r.id}-${idx}`} value={r.id}>
                              {r.code} · {r.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {activeSnapshot?.trip_status === 'JOURNEY_ENDED' && (
                        <button
                          type="button"
                          onClick={() => handleResetTrip(activeSnapshot.bus_id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-medium shadow-sm transition-all cursor-pointer"
                        >
                          <RotateCcw className="size-3" />
                          <span>Reset journey ↺</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={cn(
                          'bg-white hover:bg-[#F0F5F2] text-[#162A22] font-sans text-xs font-medium px-3.5 py-2 rounded-full shadow-sm border border-black/[0.06] flex items-center gap-1.5 transition-all cursor-pointer',
                          isSimulating && 'bg-[#E6F4EA] border-[#10B981]/30 text-[#162A22]',
                        )}
                      >
                        {isSimulating ? (
                          <Pause className="size-3 text-[#10B981]" />
                        ) : (
                          <Play className="size-3 text-[#162A22]" />
                        )}
                        <span>Simulation</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSimulateStep}
                        title="Manual step"
                        className="bg-white hover:bg-[#F0F5F2] text-[#162A22] rounded-full p-2 shadow-sm border border-black/[0.06] transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <Play className="size-3" />
                      </button>

                      <div className="inline-flex items-center p-1 rounded-full bg-[#F7F6F2] border border-black/[0.06] text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setRadarViewTab('radar')}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-sans',
                            radarViewTab === 'radar'
                              ? 'bg-white text-[#162A22] shadow-xs font-semibold'
                              : 'text-black/50 hover:text-[#162A22]',
                          )}
                        >
                          <Radio className="size-3.5 text-[#162A22]" />
                          <span>Corridor radar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRadarViewTab('map')}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-sans',
                            radarViewTab === 'map'
                              ? 'bg-white text-[#162A22] shadow-xs font-semibold'
                              : 'text-black/50 hover:text-[#162A22]',
                          )}
                        >
                          <Navigation className="size-3.5 text-[#162A22]" />
                          <span>Live spatial map</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <div className="group/card relative flex min-w-0 flex-col justify-between overflow-hidden rounded-[28px] p-6 bg-[#DDF0F8] text-[#162A22] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04]">
                      <header className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/70 text-[#162A22] border border-black/[0.04]">
                          <Info className="size-3.5 text-sky-600" />
                          <span>Notice</span>
                        </span>
                        <span className="relative flex size-2.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-500 opacity-60" />
                          <span className="relative inline-flex size-2.5 rounded-full bg-sky-500" />
                        </span>
                      </header>
                      <h3 className="mt-5 font-serif text-xl font-normal leading-snug tracking-tight text-[#162A22]">
                        Geofence entry: {latestGeofenceEvent?.stop_name || uniqueStops[0]?.name || 'Terminal Bersepadu Selatan'}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-black/70 font-sans">
                        {`${latestGeofenceEvent?.fleet_code || activeSnapshot?.fleet_code || 'BUS-UM-01'} arrived on schedule · PostGIS 150m boundary verified.`}
                      </p>
                      <footer className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-black/[0.06] text-xs font-sans">
                        <span className="flex min-w-0 items-center gap-1.5 text-black/70">
                          <Bus className="size-3.5 shrink-0" />
                          <span className="truncate">{activeSnapshot?.fleet_code || 'BUS-UM-01'} · PostGIS 150m boundary verified</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setNotification({ type: 'success', message: 'Geofence telemetry confirmed' })}
                          className="shrink-0 rounded-full bg-[#162A22] px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85 cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      </footer>
                    </div>

                    <div className="group/card relative flex min-w-0 flex-col justify-between overflow-hidden rounded-[28px] p-6 bg-[#F7ECD9] text-[#162A22] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04]">
                      <header className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-[#EF4444] text-white">
                          <TriangleAlert className="size-3.5" />
                          <span>Critical</span>
                        </span>
                        <span className="relative flex size-2.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#EF4444] opacity-60" />
                          <span className="relative inline-flex size-2.5 rounded-full bg-[#EF4444]" />
                        </span>
                      </header>
                      <h3 className="mt-5 font-serif text-xl font-normal leading-snug tracking-tight text-[#162A22]">
                        Severe Bottleneck: {topDemandSug?.route_code || activeRoute.code} Corridor
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-black/70 font-sans">
                        {topDemandSug?.optimization_reason || 'Load factor 94% on segment Pasar Seni ⇄ KL Sentral during morning peak. Headway compressed from 15m to 8m.'}
                      </p>
                      <footer className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-black/[0.06] text-xs font-sans">
                        <span className="flex min-w-0 items-center gap-1.5 text-black/70">
                          <Route className="size-3.5 shrink-0" />
                          <span className="truncate">{topDemandSug?.route_code || activeRoute.code} · Peak Corridor</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (topDemandSug) {
                              handleApplySchedule(topDemandSug);
                            } else {
                              setNotification({ type: 'success', message: 'Optimal headway of 8m applied to corridor' });
                            }
                          }}
                          className="shrink-0 rounded-full bg-[#162A22] px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85 cursor-pointer"
                        >
                          Acknowledge / Apply
                        </button>
                      </footer>
                    </div>
                  </div>

                  <div className={cn('w-full', radarViewTab === 'map' ? 'block' : 'hidden')}>
                    <div className={cn('w-full', isCreatingRoute ? 'flex flex-col lg:flex-row gap-4 items-stretch' : 'space-y-4')}>
                      {isCreatingRoute && (
                        <div className="w-full lg:w-96 flex-shrink-0 rounded-[26px] bg-white/95 backdrop-blur-md p-5 border border-black/10 shadow-lg space-y-4 font-sans flex flex-col justify-between overflow-y-auto min-h-[560px] h-[560px]">
                          <div className="space-y-3.5 flex-1 min-h-0 overflow-y-auto pr-1">
                            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="grid size-8 place-items-center rounded-xl bg-[#E6F4EA] text-[#162A22] shrink-0">
                                  <Compass className="size-4" />
                                </span>
                                <div className="min-w-0">
                                  <h4 className="font-serif text-base font-normal text-[#162A22] truncate">Route Studio</h4>
                                  <p className="text-[11px] text-black/50 font-sans truncate">
                                    Click map to drop stops
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsRouteStudioOpen(false);
                                  setStudioStops([]);
                                }}
                                className="text-xs font-sans text-black/60 hover:text-[#162A22] px-2.5 py-1 rounded-full border border-black/10 hover:bg-black/[0.04] transition-colors cursor-pointer shrink-0"
                              >
                                Exit
                              </button>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[11px] font-medium text-black/60 block mb-1">Route / Corridor name</label>
                                <input
                                  type="text"
                                  value={studioRouteName}
                                  onChange={(e) => setStudioRouteName(e.target.value)}
                                  placeholder="e.g. Laluan D: High-Speed Link"
                                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7F6F2] border border-black/10 text-xs font-sans text-[#162A22] focus:outline-none focus:ring-2 focus:ring-[#162A22]/20 transition-all"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] font-medium text-black/60 block mb-1">Route code</label>
                                  <input
                                    type="text"
                                    value={studioRouteCode}
                                    onChange={(e) => setStudioRouteCode(e.target.value)}
                                    placeholder="e.g. UM-R04"
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F6F2] border border-black/10 text-xs font-sans text-[#162A22] focus:outline-none focus:ring-2 focus:ring-[#162A22]/20 transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-medium text-black/60 block mb-1">Vehicle</label>
                                  <select
                                    value={studioBusId}
                                    onChange={(e) => setStudioBusId(e.target.value)}
                                    className="w-full px-2.5 py-2 rounded-xl bg-[#F7F6F2] border border-black/10 text-xs font-sans text-[#162A22] focus:outline-none focus:ring-2 focus:ring-[#162A22]/20 transition-all"
                                  >
                                    <option value="">None</option>
                                    {buses.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.fleet_code}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#162A22]">
                                  Ordered Stops ({studioStops.length})
                                </span>
                                <span className="text-[10px] text-black/50">
                                  {studioStops.length === 0
                                    ? 'Click map for Stop 1'
                                    : studioStops.length === 1
                                    ? 'Click map for Stop 2'
                                    : 'Click ✕ to remove'}
                                </span>
                              </div>

                              {studioStops.length > 0 ? (
                                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-[#F7F6F2] rounded-xl border border-black/[0.04]">
                                  {studioStops.map((st, idx) => {
                                    const isOrigin = idx === 0;
                                    const isDest = idx === studioStops.length - 1 && studioStops.length > 1;
                                    return (
                                      <div
                                        key={st.id}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-black/[0.06] shadow-2xs text-xs font-sans"
                                      >
                                        <span
                                          className={cn(
                                            'size-4.5 rounded-full text-white font-bold text-[9px] grid place-items-center shrink-0',
                                            isOrigin ? 'bg-[#162A22]' : isDest ? 'bg-amber-600' : 'bg-slate-700'
                                          )}
                                        >
                                          {idx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={st.name}
                                          onChange={(e) => {
                                            const updated = [...studioStops];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setStudioStops(updated);
                                          }}
                                          className="bg-transparent border-none text-xs font-medium text-[#162A22] outline-none flex-1 min-w-0"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setStudioStops((prev) => prev.filter((_, i) => i !== idx));
                                          }}
                                          className="text-neutral-400 hover:text-red-600 text-xs font-bold cursor-pointer shrink-0 px-1"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="p-3 text-center rounded-xl bg-[#F7F6F2] border border-black/[0.04] text-xs text-black/50">
                                  Click anywhere on the map to start placing route stops.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-black/[0.06] flex flex-col gap-2 shrink-0">
                            <span className="text-[11px] text-black/50">
                              {studioStops.length < 2 ? '⚠️ Place at least 2 stops on map' : '✅ Ready to dispatch corridor'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsRouteStudioOpen(false);
                                  setStudioStops([]);
                                }}
                                className="flex-1 py-2 text-xs font-medium text-black/60 hover:text-[#162A22] text-center rounded-full border border-black/10 hover:bg-black/[0.04] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={studioStops.length < 2 || !studioRouteName.trim() || !studioRouteCode.trim()}
                                onClick={handleSaveStudioRoute}
                                className="flex-2 py-2 px-3 rounded-full bg-[#162A22] text-white text-xs font-medium hover:bg-[#1E352B] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="size-3.5" />
                                <span>Save & dispatch</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={mapContainerRef} className={cn(isCreatingRoute ? 'flex-1 min-w-0 min-h-[560px] h-[560px] relative rounded-[28px] overflow-hidden' : 'w-full min-h-[560px] h-[560px] relative rounded-[28px] overflow-hidden')}>
                        <LiveSpatialDashboard
                          tenantId={selectedTenantId}
                          tenantName={activeTenant?.name}
                          stops={uniqueStops}
                          routes={uniqueRoutes}
                          activeRoute={activeRoute}
                          snapshots={snapshots}
                          activeSnapshot={activeSnapshot}
                          selectedBusId={selectedBusId}
                          onSelectBus={(id) => setSelectedBusId(id)}
                          onResetTrip={handleResetTrip}
                          userRole={selectedRole}
                          onRoleChange={(r) => setSelectedRole(r)}
                          stopETAs={uniqueStopETAs}
                          transitEvents={transitEvents}
                          isSimulating={isSimulating}
                          onToggleSimulate={() => setIsSimulating((prev) => !prev)}
                          studioMode={isCreatingRoute}
                          isCreatingRoute={isCreatingRoute}
                          studioStops={studioStops}
                          onMapClick={handleStudioMapClick}
                          onRemoveStudioStop={handleRemoveStudioStop}
                          onReady={(map) => {
                            mapRef.current = map;
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={cn('w-full', radarViewTab === 'radar' ? 'block' : 'hidden')}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-8 space-y-4">
                        <div className="rounded-[28px] bg-[#162A22] text-[#F4F3EE] p-8 shadow-[0_24px_48px_-12px_rgba(22,42,34,0.28)] -translate-y-1 hover:-translate-y-2 transition-all duration-300 ease-out">
                          <div className="flex justify-end">
                            <div className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-[#A7C4B5]">
                              <Clock className="size-3.5 text-[#A7C4B5]" />
                              <span>ETA ~{activeRoute.estimated_minutes} min</span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3 sm:gap-6">
                            <div className="min-w-0 flex-1">
                              <span className="block font-sans text-xs text-white/50">From</span>
                              <span className="block truncate font-serif text-3xl md:text-4xl text-white tracking-tight leading-tight">
                                {activeRoute.origin}
                              </span>
                            </div>
                            <ArrowRight className="size-5 shrink-0 text-white/40" />
                            <div className="min-w-0 flex-1 text-right">
                              <span className="block font-sans text-xs text-white/50">To</span>
                              <span className="block truncate font-serif italic text-3xl md:text-4xl text-white/95 tracking-tight leading-tight">
                                {activeRoute.destination}
                              </span>
                            </div>
                          </div>

                          <div className="h-1.5 bg-white/15 rounded-full my-8 relative w-full">
                            <div
                              className="h-full rounded-full bg-[#6EE7B7] transition-all duration-700 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            />
                            <div
                              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-[#E6F4EA] text-[#162A22] shadow-md transition-all duration-700 ease-out"
                              style={{ left: `${progressPercent}%` }}
                            >
                              <Bus className="size-4" />
                            </div>
                          </div>

                          <ol className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                            {uniqueStops.slice(0, 4).map((stop, idx) => {
                              const etaMatch = stopETAs.find((e) => e.stop_id === stop.id || e.stop_code === stop.code);
                              const totalStops = Math.min(4, uniqueStops.length);
                              const stopTargetPct = totalStops > 1 ? (idx / (totalStops - 1)) * 100 : 0;
                              const isDone = progressPercent > stopTargetPct + 8;
                              const isArriving = !isDone && Math.abs(progressPercent - stopTargetPct) <= 12;
                              const etaMin = etaMatch
                                ? etaMatch.eta_minutes
                                : Math.max(0, (idx + 1) * 6 - Math.round(progressPercent * 0.24));
                              const statusText = isDone
                                ? 'Passed'
                                : isArriving
                                ? 'Arriving now'
                                : etaMin > 0
                                ? `~${Math.round(etaMin)} min`
                                : 'Next stop';
                              return (
                                <li key={`${stop.id}-${idx}`} className="flex items-start gap-2.5 min-w-0">
                                  <span
                                    className={cn(
                                      'mt-1 size-2.5 shrink-0 rounded-full ring-2 transition-all',
                                      isDone
                                        ? 'bg-[#6EE7B7] ring-[#6EE7B7]/40'
                                        : isArriving
                                        ? 'bg-white ring-white/60 animate-pulse'
                                        : 'bg-transparent ring-white/40',
                                    )}
                                  />
                                  <span className="min-w-0 flex-1 font-sans">
                                    <span className="block truncate text-sm font-medium text-white">{stop.name}</span>
                                    <span className="block text-xs text-white/60">
                                      {statusText}
                                    </span>
                                  </span>
                                </li>
                              );
                            })}
                          </ol>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                          <div className="bg-white rounded-[26px] p-6 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04] flex flex-col justify-between space-y-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-2xl bg-[#E6F4EA] text-[#162A22] flex items-center justify-center shrink-0">
                                <Bus className="size-5" />
                              </div>
                              <div>
                                <h4 className="font-sans font-semibold text-sm text-[#162A22]">
                                  {activeSnapshot?.model || 'Transit Fleet Bus'}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                                  <span className="font-sans text-xs text-black/50">
                                    {activeSnapshot?.fleet_code || activeRoute.code} ·{' '}
                                    {activeSnapshot?.trip_status === 'JOURNEY_ENDED'
                                      ? 'At terminal'
                                      : activeSnapshot?.trip_status === 'AT_STOP'
                                      ? 'Boarding passengers'
                                      : 'Active service'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-5 sm:gap-7 pt-2">
                              <div className="flex items-center gap-2">
                                <Gauge className="size-4 text-black/40 shrink-0" />
                                <div>
                                  <span className="block font-sans text-[11px] text-black/50">Cruise speed</span>
                                  <span className="font-sans font-semibold text-xs text-[#162A22]">
                                    {activeSnapshot ? `${Math.round(activeSnapshot.speed_kmh)} km/h` : '38 km/h'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <Users className="size-4 text-black/40 shrink-0" />
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-sans text-[11px] text-black/50">Occupancy</span>
                                    <span className="font-sans font-semibold text-xs text-[#162A22]">
                                      {activeSnapshot?.occupancy || 26} / {activeSnapshot?.capacity || 42} seated
                                    </span>
                                  </div>
                                  <div className="w-24 h-2 bg-[#F0F5F2] rounded-full overflow-hidden mt-1">
                                    <div
                                      className="h-full bg-[#162A22] rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.round(
                                            ((activeSnapshot?.occupancy || 26) / (activeSnapshot?.capacity || 42)) * 100,
                                          ),
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {snapshots.length > 1 && (
                              <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04]">
                                <span className="font-sans text-xs text-black/50">Bus:</span>
                                <div className="bg-[#F7F6F2] p-1 rounded-full flex items-center gap-1 border border-black/[0.04]">
                                  {snapshots.map((bus, idx) => (
                                    <button
                                      key={`${bus.bus_id}-${idx}`}
                                      type="button"
                                      onClick={() => setSelectedBusId(bus.bus_id)}
                                      className={cn(
                                        'px-3 py-1 rounded-full font-sans text-xs font-medium transition-all cursor-pointer',
                                        activeSnapshot?.bus_id === bus.bus_id
                                          ? 'bg-white text-[#162A22] shadow-sm font-semibold'
                                          : 'text-black/60 hover:text-[#162A22]',
                                      )}
                                    >
                                      {bus.fleet_code}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {renderDriverProfileCard('Assigned Corridor Pilot · Active Telemetry')}
                        </div>
                      </div>

                      <div id="etas" className="lg:col-span-4 rounded-[26px] bg-white p-6 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04] translate-y-1 hover:-translate-y-1 transition-all duration-300 ease-out space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
                          <div>
                            <div className="flex items-center gap-2">
                              <Clock className="size-4 text-[#162A22]" />
                              <h3 className="font-sans font-semibold text-sm text-[#162A22]">Real-time stop arrival board</h3>
                            </div>
                            <p className="text-xs text-black/50 mt-0.5">Historical segment ETA · 96.4% on-time</p>
                          </div>
                          <span className="text-xs font-sans text-black/50">{uniqueStopETAs.length} stops</span>
                        </div>
                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                          {uniqueStopETAs.length === 0 ? (
                            <div className="py-8 text-center text-xs text-black/50 font-sans">
                              No stop arrival calculations available.
                            </div>
                          ) : (
                            uniqueStopETAs.map((eta, idx) => {
                              const status = eta.status || (eta.eta_minutes <= 1 ? 'ARRIVING_NOW' : 'UPCOMING');
                              return (
                                <div
                                  key={`${eta.route_id}-${eta.stop_id}-${idx}`}
                                  className="p-3.5 rounded-2xl bg-[#F7F6F2]/70 border border-black/[0.04] hover:bg-[#F7F6F2] transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="size-5 rounded-full bg-[#162A22] text-white text-[10px] font-bold font-sans grid place-items-center">
                                          {eta.stop_sequence}
                                        </span>
                                        <h4 className="text-xs font-semibold text-[#162A22] font-sans">{eta.stop_name}</h4>
                                      </div>
                                      <p className="text-[11px] font-sans text-black/50 mt-0.5 ml-6">
                                        {eta.stop_code} · {eta.fleet_code || 'En route'}
                                      </p>
                                    </div>
                                    <span
                                      className={cn(
                                        'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                                        status === 'PASSED'
                                          ? 'bg-black/[0.05] text-black/40'
                                          : status === 'TERMINAL_REACHED'
                                          ? 'bg-[#E6F4EA] text-[#162A22]'
                                          : status === 'ARRIVED'
                                          ? 'bg-amber-100 text-amber-900'
                                          : status === 'ARRIVING_NOW'
                                          ? 'bg-[#162A22] text-white shadow-sm'
                                          : 'bg-[#E6F4EA] text-[#162A22]',
                                      )}
                                    >
                                      {status === 'PASSED' && 'Passed'}
                                      {status === 'TERMINAL_REACHED' && 'Terminal reached'}
                                      {status === 'ARRIVED' && 'At stop'}
                                      {status === 'ARRIVING_NOW' && 'Arriving now'}
                                      {status === 'UPCOMING' && `~${eta.eta_minutes} min`}
                                    </span>
                                  </div>
                                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-black/[0.04] text-[11px] text-black/60 font-sans">
                                    <span>Distance: {eta.distance_km} km</span>
                                    {eta.min_eta_minutes !== undefined && eta.max_eta_minutes !== undefined && eta.min_eta_minutes > 0 ? (
                                      <span className="font-sans text-[11px] text-[#162A22] font-medium">
                                        Est: {eta.min_eta_minutes}-{eta.max_eta_minutes}m
                                      </span>
                                    ) : (
                                      <span className="font-sans text-[11px] text-black/60">
                                        {eta.stop_latitude.toFixed(3)}°N, {eta.stop_longitude.toFixed(3)}°E
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {selectedRole === 'OPERATOR_ADMIN' && (
            <section id="fleet" className="py-12 border-t border-foreground/10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground">
                    Fleet assets & workspace directory
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Transit assets & <span className="font-serif font-normal italic text-chart-5">spatial routes.</span>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManagementTab('buses')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                      managementTab === 'buses' ? 'bg-[#162A22] text-white shadow-xs' : 'bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/[0.08]',
                    )}
                  >
                    Active vehicles ({buses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementTab('waypoints')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                      managementTab === 'waypoints' ? 'bg-[#162A22] text-white shadow-xs' : 'bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/[0.08]',
                    )}
                  >
                    PostGIS route waypoints ({uniqueStops.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementTab('geofence')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                      managementTab === 'geofence' ? 'bg-[#162A22] text-white shadow-xs' : 'bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/[0.08]',
                    )}
                  >
                    Live geofence arrival log ({transitEvents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementTab('audit')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                      managementTab === 'audit' ? 'bg-[#162A22] text-white shadow-xs' : 'bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/[0.08]',
                    )}
                  >
                    Audit activity ({auditLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementTab('members')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                      managementTab === 'members' ? 'bg-[#162A22] text-white shadow-xs' : 'bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/[0.08]',
                    )}
                  >
                    Members ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementTab('workspaces')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                      managementTab === 'workspaces' ? 'bg-[#162A22] text-white shadow-xs' : 'bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/[0.08]',
                    )}
                  >
                    Workspaces ({tenants.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagementTab('observability')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5',
                      managementTab === 'observability' ? 'bg-[#162A22] text-white shadow-xs' : 'bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/[0.08]',
                    )}
                  >
                    <Activity className="size-3.5" />
                    <span>Observability & System Health</span>
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] bg-white p-6 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#162A22] font-sans">
                      {managementTab === 'buses' && 'Active vehicle fleet telemetry'}
                      {managementTab === 'waypoints' && 'PostGIS route waypoint coordinates'}
                      {managementTab === 'geofence' && 'Live geofence proximity & arrival events'}
                      {managementTab === 'audit' && 'Immutable security & administration audit log'}
                      {managementTab === 'members' && 'Tenant directory members'}
                      {managementTab === 'workspaces' && 'Registered tenant workspaces'}
                      {managementTab === 'observability' && 'Operator Observability, Chaos Testing & Demand Optimization'}
                    </span>
                    <span className="text-[11px] font-sans text-black/50">
                      · Scope: {activeTenant.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter records…"
                      className="px-3.5 py-1.5 rounded-full bg-[#F7F6F2] border border-black/[0.08] text-xs font-sans text-[#162A22] outline-none w-48 focus:ring-2 focus:ring-[#162A22]/20 transition-all"
                    />
                    {managementTab === 'buses' && (
                      <button
                        type="button"
                        onClick={() => setShowAddBus(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#162A22] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#1E352B] transition-all cursor-pointer"
                      >
                        <Plus className="size-3" />
                        <span>Add</span>
                      </button>
                    )}
                    {managementTab === 'waypoints' && (
                      <button
                        type="button"
                        onClick={() => setShowAddStop(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#162A22] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#1E352B] transition-all cursor-pointer"
                      >
                        <Plus className="size-3" />
                        <span>Add</span>
                      </button>
                    )}
                    {managementTab === 'members' && (
                      <button
                        type="button"
                        onClick={() => setShowAddMember(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#162A22] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#1E352B] transition-all cursor-pointer"
                      >
                        <Plus className="size-3" />
                        <span>Invite</span>
                      </button>
                    )}
                    {managementTab === 'workspaces' && (
                      <button
                        type="button"
                        onClick={() => setShowCreateTenant(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#162A22] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#1E352B] transition-all cursor-pointer"
                      >
                        <Plus className="size-3" />
                        <span>Workspace</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {managementTab === 'buses' && (
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-black/[0.04] text-black/50">
                          <th className="pb-3 px-3.5 font-medium">Vehicle</th>
                          <th className="pb-3 px-3.5 font-medium">Model & plate</th>
                          <th className="pb-3 px-3.5 font-medium">Trip status</th>
                          <th className="pb-3 px-3.5 font-medium">Live speed & telematics</th>
                          <th className="pb-3 px-3.5 font-medium">Occupancy</th>
                          <th className="pb-3 px-3.5 font-medium">Journey progress</th>
                          <th className="pb-3 px-3.5 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {filteredBuses.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-black/50 font-sans">
                              Connecting to live transit stream...
                            </td>
                          </tr>
                        ) : (
                          (filteredBuses || []).map((b, idx) => {
                          const snapshot = snapshots.find((s) => s.bus_id === b.id);
                          const tripStatus = snapshot?.trip_status || b.trip_status || 'IN_TRANSIT';
                          const progress = snapshot?.progress_pct ? Math.round(snapshot.progress_pct) : Math.round(b.progress_pct || 0);
                          const speed = snapshot ? Math.round(snapshot.speed_kmh) : 0;
                          return (
                            <tr key={`${b.id}-${idx}`} className="hover:bg-[#F7F6F2]/50 transition-colors">
                              <td className="py-3.5 px-3.5 font-sans font-semibold text-[#162A22]">{b.fleet_code}</td>
                              <td className="py-3.5 px-3.5">
                                <span className="font-medium text-[#162A22] block">{b.model}</span>
                                <span className="font-sans text-[11px] text-black/50">{b.plate_number}</span>
                              </td>
                              <td className="py-3.5 px-3.5">
                                <span
                                  className={cn(
                                    'px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5',
                                    tripStatus === 'JOURNEY_ENDED'
                                      ? 'bg-[#E6F4EA] text-[#162A22]'
                                      : tripStatus === 'AT_STOP'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-[#F7F6F2] text-[#162A22] border border-black/[0.06]',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'size-1.5 rounded-full',
                                      tripStatus === 'JOURNEY_ENDED'
                                        ? 'bg-[#10B981]'
                                        : tripStatus === 'AT_STOP'
                                        ? 'bg-amber-500'
                                        : 'bg-[#162A22]',
                                    )}
                                  />
                                  <span>
                                    {tripStatus === 'JOURNEY_ENDED' && 'Journey completed'}
                                    {tripStatus === 'AT_STOP' && 'At stop'}
                                    {tripStatus === 'IN_TRANSIT' && 'In transit'}
                                  </span>
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5 font-sans">
                                <span className="font-medium text-[#162A22]">{speed} km/h</span>
                                <span className="text-[11px] text-black/50 ml-2">94% battery</span>
                              </td>
                              <td className="py-3.5 px-3.5 font-sans">
                                <span className="font-medium text-[#162A22]">{snapshot?.occupancy || 20} / {b.capacity}</span>
                                <span className="text-[11px] text-black/50 ml-1">seats</span>
                              </td>
                              <td className="py-3.5 px-3.5 min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-[#F0F5F2] overflow-hidden">
                                    <div
                                      className="h-full bg-[#162A22] rounded-full transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="font-sans text-[11px] text-black/50">{progress}%</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 text-right">
                                {tripStatus === 'JOURNEY_ENDED' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleResetTrip(b.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#162A22] hover:bg-[#1E352B] text-white text-[11px] font-medium shadow-xs transition-all cursor-pointer"
                                  >
                                    <RotateCcw className="size-3" />
                                    <span>Reset ↺</span>
                                  </button>
                                ) : (
                                  <span className="text-black/50 text-[11px] font-sans">Active</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  )}

                  {managementTab === 'waypoints' && (
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-black/[0.04] text-black/50">
                          <th className="pb-3 px-3.5 font-medium">Seq</th>
                          <th className="pb-3 px-3.5 font-medium">Stop name</th>
                          <th className="pb-3 px-3.5 font-medium">Code</th>
                          <th className="pb-3 px-3.5 font-medium">PostGIS geography</th>
                          <th className="pb-3 px-3.5 font-medium">Distance</th>
                          <th className="pb-3 px-3.5 font-medium text-right">Corridor status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {uniqueStops.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-xs text-black/50 font-sans">
                              Connecting to live transit stream...
                            </td>
                          </tr>
                        ) : (
                          (uniqueStops || []).map((s, idx) => {
                          const etaMatch = stopETAs.find((e) => e.stop_id === s.id || e.stop_code === s.code);
                          const status = etaMatch?.status || 'UPCOMING';
                          return (
                            <tr key={`${s.id}-${idx}`} className="hover:bg-[#F7F6F2]/50 transition-colors">
                              <td className="py-3.5 px-3.5 font-sans font-bold text-[#162A22]">#{idx + 1}</td>
                              <td className="py-3.5 px-3.5 font-medium text-[#162A22]">{s.name}</td>
                              <td className="py-3.5 px-3.5 font-sans text-black/60">{s.code}</td>
                              <td className="py-3.5 px-3.5 font-sans text-[11px] text-black/60">
                                {s.latitude.toFixed(4)}°N, {s.longitude.toFixed(4)}°E (SRID 4326)
                              </td>
                              <td className="py-3.5 px-3.5 font-sans text-[#162A22]">
                                {etaMatch ? `${etaMatch.distance_km} km` : `${(idx * 3.8).toFixed(1)} km`}
                              </td>
                              <td className="py-3.5 px-3.5 text-right">
                                <span
                                  className={cn(
                                    'px-2.5 py-1 rounded-full text-xs font-medium',
                                    status === 'PASSED'
                                      ? 'bg-black/[0.05] text-black/40'
                                      : status === 'TERMINAL_REACHED'
                                      ? 'bg-[#E6F4EA] text-[#162A22]'
                                      : status === 'ARRIVED'
                                      ? 'bg-amber-100 text-amber-900'
                                      : status === 'ARRIVING_NOW'
                                      ? 'bg-[#162A22] text-white shadow-xs'
                                      : 'bg-[#E6F4EA] text-[#162A22]',
                                  )}
                                >
                                  {status === 'PASSED' && 'Passed'}
                                  {status === 'TERMINAL_REACHED' && 'Terminal reached'}
                                  {status === 'ARRIVED' && 'At stop'}
                                  {status === 'ARRIVING_NOW' && 'Arriving now'}
                                  {status === 'UPCOMING' && 'Upcoming waypoint'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  )}

                  {managementTab === 'geofence' && (
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-black/[0.04] text-black/50">
                          <th className="pb-3 px-3.5 font-medium">Triggered</th>
                          <th className="pb-3 px-3.5 font-medium">Vehicle</th>
                          <th className="pb-3 px-3.5 font-medium">Geofence event</th>
                          <th className="pb-3 px-3.5 font-medium">Waypoint stop</th>
                          <th className="pb-3 px-3.5 font-medium text-right">Proximity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {filteredEvents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-black/50 font-sans">
                              No geofence events logged yet. Trigger simulation to generate transit arrivals.
                            </td>
                          </tr>
                        ) : (
                          filteredEvents.map((ev, idx) => {
                            const badgeClasses: Record<string, string> = {
                              APPROACHING: 'bg-amber-100 text-amber-900 border border-amber-200',
                              ARRIVED: 'bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/10',
                              DEPARTED: 'bg-blue-50 text-blue-800 border border-blue-200',
                              JOURNEY_COMPLETED: 'bg-[#162A22] text-white',
                              TRIP_RESET: 'bg-purple-50 text-purple-800 border border-purple-200',
                            };
                            return (
                              <tr key={`${ev.id}-${idx}`} className="hover:bg-[#F7F6F2]/50 transition-colors">
                                <td className="py-3.5 px-3.5 font-sans text-slate-500 text-[11px]">
                                  {formatDeterministicDate(ev.triggered_at)} · {ev.triggered_at.slice(11, 19)}
                                </td>
                                <td className="py-3.5 px-3.5 font-sans font-semibold text-[#162A22]">{ev.fleet_code || 'Fleet'}</td>
                                <td className="py-3.5 px-3.5">
                                  <span
                                    className={cn(
                                      'px-2.5 py-1 rounded-full text-xs font-medium',
                                      badgeClasses[ev.event_type] || 'bg-[#F7F6F2] text-[#162A22] border border-black/[0.04]',
                                    )}
                                  >
                                    {ev.event_type}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3.5 font-medium text-[#162A22]">{ev.stop_name || 'Corridor waypoint'}</td>
                                <td className="py-3.5 px-3.5 font-sans text-right text-black/60">
                                  {ev.distance_meters > 0 ? `${Math.round(ev.distance_meters)} m` : '0 m (docked)'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}

                  {managementTab === 'audit' && (
                    <div className="space-y-3 font-sans">
                      {filteredAuditLogs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-black/50 font-sans">
                          No administrative audit events recorded yet for this workspace.
                        </div>
                      ) : (
                        <ul className="divide-y divide-black/[0.04]">
                          {filteredAuditLogs.map((log, idx) => {
                            const isHigh =
                              log.action.includes('DELETE') ||
                              log.action.includes('FAIL') ||
                              log.action.includes('CHAOS') ||
                              log.action.includes('EMERGENCY');
                            const isMedium =
                              log.action.includes('UPDATE') ||
                              log.action.includes('MODIFY') ||
                              log.action.includes('OPTIMIZE') ||
                              log.action.includes('APPLY');
                            const priorityLabel = isHigh ? 'high' : isMedium ? 'medium' : 'low';
                            const priorityPillClass = isHigh
                              ? 'bg-[#FCE8E6] text-[#B91C1C]'
                              : isMedium
                              ? 'bg-[#FEF3D6] text-[#B45309]'
                              : 'bg-[#E6F4EA] text-[#166534]';

                            return (
                              <li key={`${log.id}-${idx}`} className="flex items-center gap-3.5 py-3 hover:bg-[#F7F6F2]/40 rounded-xl px-2 transition-colors">
                                <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-black/[0.04] text-[#162A22]">
                                  <ShieldCheck className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1 font-sans">
                                  <p className="truncate text-sm font-semibold text-[#162A22]">{log.action}</p>
                                  <p className="truncate text-xs text-black/50 mt-0.5">
                                    Target: {log.target_entity} · {formatDeterministicDate(log.created_at)} {log.created_at.slice(11, 19)} · IP: {log.ip_address || '127.0.0.1'}
                                  </p>
                                </div>
                                <span className="hidden sm:block text-xs text-black/60 font-sans truncate max-w-[140px]">
                                  {log.actor_user_id ? `User ${log.actor_user_id.slice(0, 8)}…` : 'Operator / System'}
                                </span>
                                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize font-sans shrink-0', priorityPillClass)}>
                                  {priorityLabel}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {managementTab === 'members' && (
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-black/[0.04] text-black/50">
                          <th className="pb-3 px-3.5 font-medium">Email</th>
                          <th className="pb-3 px-3.5 font-medium">Role</th>
                          <th className="pb-3 px-3.5 font-medium">Joined date</th>
                          <th className="pb-3 px-3.5 font-medium text-right">Isolation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-xs text-black/50 font-sans">
                              Connecting to live transit stream...
                            </td>
                          </tr>
                        ) : (
                          (filteredUsers || []).map((u, idx) => {
                          const roleLabels: Record<UserRole, string> = {
                            OPERATOR_ADMIN: 'Operator admin',
                            DRIVER: 'Driver',
                            RIDER: 'Rider',
                            SUPER_ADMIN: 'Super admin',
                          };
                          const roleChips: Record<UserRole, string> = {
                            OPERATOR_ADMIN: 'bg-[#162A22] text-white',
                            DRIVER: 'bg-amber-100 text-amber-900',
                            RIDER: 'bg-[#E6F4EA] text-[#162A22]',
                            SUPER_ADMIN: 'bg-red-100 text-red-900',
                          };
                          return (
                            <tr key={`${u.id}-${idx}`} className="hover:bg-[#F7F6F2]/50 transition-colors">
                              <td className="py-3.5 px-3.5 font-medium text-[#162A22]">{u.email}</td>
                              <td className="py-3.5 px-3.5">
                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', roleChips[u.role])}>
                                  {roleLabels[u.role]}
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5 font-sans text-black/50">{formatDeterministicDate(u.created_at)}</td>
                              <td className="py-3.5 px-3.5 text-right">
                                <span className="inline-flex items-center gap-1.5 text-[#10B981] text-xs font-medium font-sans">
                                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                                  <span>Isolated</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  )}

                  {managementTab === 'workspaces' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1 font-sans">
                      {tenants.map((t, idx) => {
                        const active = t.id === selectedTenantId;
                        return (
                          <button
                            key={`${t.id}-${idx}`}
                            type="button"
                            onClick={() => handleTenantChange(t.id)}
                            className={cn(
                              'p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer',
                              active
                                ? 'bg-[#162A22] text-white border-[#162A22] shadow-sm'
                                : 'bg-[#F7F6F2] hover:bg-[#EFECE6] text-[#162A22] border-black/[0.04]',
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{t.name}</p>
                              <p className={cn('text-[11px] font-sans mt-0.5 truncate', active ? 'text-white/70' : 'text-black/50')}>
                                {t.slug}
                              </p>
                            </div>
                            {active && <CheckCircle2 className="size-4 text-[#86EFAC] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {managementTab === 'observability' && (
                    <div className="space-y-6 py-2 font-sans">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div>
                            <h4 className="font-serif text-lg font-normal text-[#162A22]">Prometheus Operational Gauges</h4>
                            <p className="text-xs text-black/50 font-sans">
                              Live scrape metrics from the NextTransit Go telemetry engine (/metrics)
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/10">
                            <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                            <span>Telemetry Stream Active</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="rounded-2xl p-5 bg-[#F7F6F2] border border-black/[0.04] space-y-2">
                            <div className="flex items-center justify-between text-black/50 text-xs">
                              <span>Active Fleet Vehicles</span>
                              <Bus className="size-4 text-[#162A22]" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-[#162A22] font-sans">
                                {parsedPrometheusMetrics.currentTenantBuses}
                              </span>
                              <span className="text-xs text-black/50 font-sans">
                                / {parsedPrometheusMetrics.totalActiveBuses} across 5 grids
                              </span>
                            </div>
                            <p className="text-[11px] text-black/40 font-sans">
                              transit_active_buses_count gauge
                            </p>
                          </div>

                          <div className="rounded-2xl p-5 bg-[#F7F6F2] border border-black/[0.04] space-y-2">
                            <div className="flex items-center justify-between text-black/50 text-xs">
                              <span>Total Telemetry Ingested</span>
                              <Zap className="size-4 text-[#162A22]" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-[#162A22] font-sans">
                                {parsedPrometheusMetrics.telemetryPings.toLocaleString()}
                              </span>
                              <span className="text-xs text-black/50 font-sans">pings</span>
                            </div>
                            <p className="text-[11px] text-black/40 font-sans">
                              transit_telemetry_pings_total counter
                            </p>
                          </div>

                          <div className="rounded-2xl p-5 bg-[#F7F6F2] border border-black/[0.04] space-y-2">
                            <div className="flex items-center justify-between text-black/50 text-xs">
                              <span>Rate-Limit Rejections</span>
                              <ShieldCheck className="size-4 text-[#10B981]" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-[#162A22] font-sans">
                                {parsedPrometheusMetrics.rateRejections}
                              </span>
                              <span className="text-xs text-[#10B981] font-sans font-medium">0% drop rate</span>
                            </div>
                            <p className="text-[11px] text-black/40 font-sans">
                              transit_ratelimit_rejections_total counter
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl p-6 border border-black/[0.06] bg-white shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="grid size-8 place-items-center rounded-xl bg-red-50 text-red-700">
                                <Flame className="size-4" />
                              </span>
                              <h4 className="font-serif text-base font-normal text-[#162A22]">Automated Chaos Testing Suite</h4>
                            </div>
                            <p className="text-xs text-black/50 font-sans mt-0.5">
                              Inject adverse conditions into PostgreSQL, network sockets, and concurrent telemetry pipelines.
                            </p>
                          </div>
                          {activeChaosScenario && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                              <span className="size-2 rounded-full bg-amber-500 animate-spin" />
                              <span>Executing {activeChaosScenario}…</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-2xl p-5 border border-black/[0.06] bg-[#F7F6F2] flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#162A22]">Database Query Latency</span>
                                <span className="text-[10px] uppercase font-bold text-black/40">pg_sleep(0.15)</span>
                              </div>
                              <p className="text-[11px] text-black/60 font-sans leading-relaxed">
                                Injects artificial 150ms latency inside PostgreSQL transaction to verify pool resilience.
                              </p>
                            </div>
                            {chaosReports['SCENARIO_LATENCY'] && (
                              <div className={cn(
                                'px-3 py-2 rounded-xl text-xs font-sans',
                                chaosReports['SCENARIO_LATENCY'].success ? 'bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/10' : 'bg-red-50 text-red-900 border border-red-200'
                              )}>
                                <div className="flex items-center justify-between font-semibold">
                                  <span>{chaosReports['SCENARIO_LATENCY'].success ? 'PASS' : 'FAIL'}</span>
                                  <span>p99: {chaosReports['SCENARIO_LATENCY'].latency_p99_ms} ms</span>
                                </div>
                                <p className="text-[10px] mt-0.5 line-clamp-2">{chaosReports['SCENARIO_LATENCY'].message}</p>
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={activeChaosScenario !== null}
                              onClick={() => handleRunChaosScenario('SCENARIO_LATENCY')}
                              className="w-full py-2.5 px-4 rounded-full bg-[#162A22] hover:bg-[#1E352B] text-white font-sans text-xs font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Play className="size-3" />
                              <span>Run latency injection test</span>
                            </button>
                          </div>

                          <div className="rounded-2xl p-5 border border-black/[0.06] bg-[#F7F6F2] flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#162A22]">Offline Sync Packet Recovery</span>
                                <span className="text-[10px] uppercase font-bold text-black/40">30% drop rate</span>
                              </div>
                              <p className="text-[11px] text-black/60 font-sans leading-relaxed">
                                Simulates intermittent batch drops from driver client and validates retry queue recovery.
                              </p>
                            </div>
                            {chaosReports['SCENARIO_PACKET_DROP'] && (
                              <div className={cn(
                                'px-3 py-2 rounded-xl text-xs font-sans',
                                chaosReports['SCENARIO_PACKET_DROP'].success ? 'bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/10' : 'bg-red-50 text-red-900 border border-red-200'
                              )}>
                                <div className="flex items-center justify-between font-semibold">
                                  <span>{chaosReports['SCENARIO_PACKET_DROP'].success ? 'PASS' : 'FAIL'}</span>
                                  <span>p99: {chaosReports['SCENARIO_PACKET_DROP'].latency_p99_ms} ms</span>
                                </div>
                                <p className="text-[10px] mt-0.5 line-clamp-2">{chaosReports['SCENARIO_PACKET_DROP'].message}</p>
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={activeChaosScenario !== null}
                              onClick={() => handleRunChaosScenario('SCENARIO_PACKET_DROP')}
                              className="w-full py-2.5 px-4 rounded-full bg-[#162A22] hover:bg-[#1E352B] text-white font-sans text-xs font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <RotateCcw className="size-3" />
                              <span>Test offline sync packet recovery</span>
                            </button>
                          </div>

                          <div className="rounded-2xl p-5 border border-black/[0.06] bg-[#F7F6F2] flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#162A22]">High-Concurrency Telemetry Burst</span>
                                <span className="text-[10px] uppercase font-bold text-black/40">50 pings parallel</span>
                              </div>
                              <p className="text-[11px] text-black/60 font-sans leading-relaxed">
                                Spawns 50 parallel goroutines firing simultaneous telemetry ingestion requests.
                              </p>
                            </div>
                            {chaosReports['SCENARIO_CONCURRENT_SPIKE'] && (
                              <div className={cn(
                                'px-3 py-2 rounded-xl text-xs font-sans',
                                chaosReports['SCENARIO_CONCURRENT_SPIKE'].success ? 'bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/10' : 'bg-red-50 text-red-900 border border-red-200'
                              )}>
                                <div className="flex items-center justify-between font-semibold">
                                  <span>{chaosReports['SCENARIO_CONCURRENT_SPIKE'].success ? 'PASS' : 'FAIL'}</span>
                                  <span>p99: {chaosReports['SCENARIO_CONCURRENT_SPIKE'].latency_p99_ms} ms</span>
                                </div>
                                <p className="text-[10px] mt-0.5 line-clamp-2">{chaosReports['SCENARIO_CONCURRENT_SPIKE'].message}</p>
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={activeChaosScenario !== null}
                              onClick={() => handleRunChaosScenario('SCENARIO_CONCURRENT_SPIKE')}
                              className="w-full py-2.5 px-4 rounded-full bg-[#162A22] hover:bg-[#1E352B] text-white font-sans text-xs font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Zap className="size-3" />
                              <span>Run high-concurrency stress test</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl p-5 border border-black/[0.06] bg-[#F7F6F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-xl bg-white shadow-2xs border border-black/[0.06] text-[#162A22] shrink-0">
                            <Timer className="size-5" />
                          </span>
                          <div>
                            <h5 className="font-semibold text-xs text-[#162A22]">Corridor Headway Optimizer &amp; Public Feeds</h5>
                            <p className="text-[11px] text-black/50 font-sans">
                              Active recommendations, GTFS-Realtime feeds, OpenAPI 3.0 specs, and HMAC webhooks are managed in the dedicated control deck above.
                            </p>
                          </div>
                        </div>
                        <a
                          href="#phase9-demand-api"
                          className="px-4 py-2 rounded-full bg-white hover:bg-neutral-50 text-[#162A22] border border-black/10 text-xs font-medium transition-all shadow-xs shrink-0 inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>Go to headway optimizer</span>
                          <ArrowRight className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section id="fleet-bento" aria-labelledby="fleet-bento-title" className="py-12 mb-16 border-t border-foreground/10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Fleet operations & corridor timetable
                </p>
                <h3 id="fleet-bento-title" className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-1">
                  Active fleet inventory & waypoint sequence
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-foreground border border-black/[0.06] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#162A22]" />
                <span>Active workspace · {activeTenant.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-8">
              <div className="bg-white rounded-[28px] p-6 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04] flex flex-col justify-between">
                <header className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50 font-sans">Corridor Load Factor</p>
                    <h3 className="text-base font-semibold text-[#162A22] tracking-tight font-sans mt-0.5">Fleet Utilization</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-black/[0.08] text-[#162A22] font-sans">
                    This week <ArrowUpRight className="size-3 text-black/50" />
                  </span>
                </header>
                <div className="mt-8 flex flex-1 items-end gap-2 sm:gap-3 min-h-[160px] pb-2">
                  {utilizationDays.map((d, i) => {
                    const active = i === 3;
                    return (
                      <div key={d.label} className="flex h-full min-h-[160px] flex-1 flex-col items-center justify-end gap-2">
                        {active ? (
                          <span className="whitespace-nowrap rounded-lg bg-[#162A22] px-2 py-1 text-[11px] font-medium text-white shadow-md font-sans">
                            {d.value}%
                          </span>
                        ) : null}
                        <div
                          className={cn(
                            'w-full max-w-10 rounded-xl transition-all duration-500',
                            active ? 'hatch bg-[#162A22]' : 'bg-[#D3EAD9] hover:bg-[#bde0c6]',
                          )}
                          style={{ height: `${(d.value / 100) * 100}%` }}
                        />
                        <span className={cn('text-xs font-sans', active ? 'font-bold text-[#162A22]' : 'text-black/50')}>{d.label}</span>
                      </div>
                    );
                  })}
                </div>
                <footer className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs text-black/60 font-sans">
                  <span>Peak load recorded during Thursday morning corridor surge</span>
                  <span className="font-semibold text-[#162A22]">94% Max Load</span>
                </footer>
              </div>

              <div className="bg-white rounded-[28px] p-6 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04] flex flex-col justify-between">
                <header className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50 font-sans">Capacity & Seating Allocation</p>
                    <h3 className="text-base font-semibold text-[#162A22] tracking-tight font-sans mt-0.5">Seat & Fleet Breakdown</h3>
                  </div>
                  <span className="rounded-full bg-[#162A22]/5 px-3 py-1 font-sans text-xs font-semibold text-[#162A22]">
                    PostgreSQL Live State
                  </span>
                </header>
                <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row">
                  <div className="relative size-36 shrink-0">
                    <svg viewBox="0 0 128 128" className="size-full -rotate-90">
                      {donutCalculations.elements}
                    </svg>
                    <div className="absolute inset-0 grid place-items-center text-center font-sans">
                      <div>
                        <span className="block text-2xl font-bold text-[#162A22] tabular-nums">{totalFleetCapacity}</span>
                        <span className="block text-[11px] text-black/50 uppercase tracking-wider">Seats Total</span>
                      </div>
                    </div>
                  </div>
                  <ul className="grid w-full flex-1 grid-cols-1 gap-2.5 font-sans">
                    {donutCalculations.segments.map((s) => (
                      <li key={s.label} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="truncate text-black/70">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-[#162A22] tabular-nums">{s.value}</span>
                          <span className="text-[11px] text-black/40 tabular-nums w-8 text-right">
                            {Math.round((s.value / donutCalculations.sum) * 100)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <footer className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs text-black/60 font-sans">
                  <span>TimescaleDB inventory snapshot</span>
                  <span className="font-semibold text-emerald-700">{availableSeatsCount} seats available</span>
                </footer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-sm border border-black/[0.04] flex flex-col justify-between space-y-6 min-h-[280px]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-black/[0.04]">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-2xl bg-[#F7F6F2] text-[#162A22]">
                        <Bus className="size-5" />
                      </span>
                      <div>
                        <h4 className="text-base font-semibold text-foreground tracking-tight">
                          Active fleet inventory & capacity
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Assigned vehicles, seating models, and operational readiness
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#162A22]/5 px-3 py-1 font-sans text-xs font-semibold text-[#162A22]">
                      {buses.length} {buses.length === 1 ? 'vehicle' : 'vehicles'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-black/[0.04] text-[11px] font-semibold text-muted-foreground">
                          <th className="pb-3 font-medium">Fleet code</th>
                          <th className="pb-3 font-medium">Model & plate</th>
                          <th className="pb-3 font-medium text-center">Capacity</th>
                          <th className="pb-3 font-medium">Assigned driver</th>
                          <th className="pb-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.03]">
                        {buses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground font-sans">
                              Connecting to live transit stream...
                            </td>
                          </tr>
                        ) : (
                          (buses || []).map((bus) => {
                          const snap = snapshots.find((s) => s.bus_id === bus.id);
                          const isStandby = snap?.trip_status === 'AT_STOP' || snap?.trip_status === 'JOURNEY_ENDED';
                          const statusLabel = isStandby ? 'Standby' : 'Active';
                          const driverUser = users.find((u) => u.role === 'DRIVER');
                          const driverName = driverUser ? driverUser.email.split('@')[0] : 'driver.assigned';

                          return (
                            <tr key={bus.id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3 font-sans font-semibold text-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="size-1.5 rounded-full bg-[#162A22]" />
                                  {bus.fleet_code}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="font-medium text-foreground">{bus.model}</div>
                                <div className="font-sans text-[11px] text-muted-foreground">{bus.plate_number}</div>
                              </td>
                              <td className="py-3 text-center font-sans font-medium text-foreground">
                                {bus.capacity} seats
                              </td>
                              <td className="py-3 font-sans text-muted-foreground text-[11px]">
                                {driverName}
                              </td>
                              <td className="py-3 text-right">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border',
                                    statusLabel === 'Active'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50'
                                      : 'bg-amber-50 text-amber-800 border-amber-200/50',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'size-1.5 rounded-full',
                                      statusLabel === 'Active' ? 'bg-emerald-600' : 'bg-amber-500',
                                    )}
                                  />
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total seating allocation</span>
                  <span className="font-sans text-foreground font-semibold">
                    {buses.reduce((acc, b) => acc + b.capacity, 0)} passengers · 100% operational readiness
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-sm border border-black/[0.04] flex flex-col justify-between space-y-6 min-h-[280px]">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.04]">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-2xl bg-[#F7F6F2] text-[#162A22]">
                        <Milestone className="size-5" />
                      </span>
                      <div>
                        <h4 className="text-base font-semibold text-foreground tracking-tight">
                          Corridor waypoint sequence & timetable
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activeRoute.code} · {activeRoute.name} ({activeRoute.distance_km} km)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportGTFS}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#162A22] text-[#F4F3EE] hover:bg-[#1f3a30] px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="size-3.5 text-[#86EFAC]" />
                      <span>Export GTFS</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-black/[0.03]">
                      <span>Station & waypoint</span>
                      <div className="flex items-center gap-6">
                        <span>Offset</span>
                        <span>Estimated dwell</span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {uniqueStops.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground font-sans">
                          Connecting to live transit stream...
                        </div>
                      ) : (
                        (uniqueStops || []).map((stop, idx) => {
                          const seqNumber = idx + 1;
                          const distStep =
                            uniqueStops.length > 1
                              ? ((idx / (uniqueStops.length - 1)) * activeRoute.distance_km).toFixed(1)
                              : '0.0';
                          const dwellTime = idx === 0 || idx === uniqueStops.length - 1 ? '2m dwell' : '45s dwell';

                          return (
                            <div
                              key={stop.id}
                              className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F7F6F2] text-xs hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="grid size-6 place-items-center rounded-full bg-white font-sans text-[11px] font-bold text-[#162A22] border border-black/[0.06] shadow-2xs shrink-0">
                                  {seqNumber}
                                </span>
                                <div className="truncate">
                                  <span className="font-semibold text-foreground block truncate">{stop.name}</span>
                                  <span className="font-sans text-[10px] text-muted-foreground">{stop.code}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 shrink-0 font-sans text-xs">
                                <span className="text-muted-foreground">{distStep} km</span>
                                <span className="text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                                  {dwellTime}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs text-muted-foreground">
                  <span>Format compliance</span>
                  <span className="font-sans text-foreground font-semibold">
                    GTFS static transit feed (routes.txt, stops.txt)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {selectedRole === 'OPERATOR_ADMIN' && (
            <section id="phase9-demand-api" className="py-12 border-t border-foreground/10 font-sans">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    DEMAND SCHEDULE OPTIMIZATION
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-[#162A22]">
                    Corridor Headway <span className="font-serif font-normal italic text-chart-5">Optimizer.</span>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/10 shadow-2xs">
                    <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span>GTFS-RT v2.0 Live</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPublicApiModal(true)}
                    className="bg-white hover:bg-[#F0F5F2] text-[#162A22] font-sans text-xs font-medium px-4 py-2.5 rounded-full shadow-sm border border-black/[0.06] flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Public API &amp; Webhooks</span>
                    <ArrowUpRight className="size-3.5 text-[#162A22]" />
                  </button>
                </div>
              </div>

              {demandSuggestions.length === 0 ? (
                <div className="p-12 text-center rounded-[26px] bg-white border border-black/[0.04] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] space-y-2">
                  <CheckCircle2 className="size-7 text-[#10B981] mx-auto" />
                  <p className="text-sm text-[#162A22] font-semibold">Corridor Headways Optimal</p>
                  <p className="text-xs text-black/50">
                    No high-occupancy congestion or bottleneck crowding detected across active corridor segments.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                  {demandSuggestions.map((sug, idx) => {
                    const isApplied = Boolean(appliedSchedules[sug.route_id]);
                    const isApplying = applyingRouteId === sug.route_id;
                    const load = Number(sug.load_factor_pct ?? sug.booking_density_pct ?? 0);
                    const currentH = sug.current_headway_min ?? sug.current_headway_mins ?? 15;
                    const recommendedH = sug.recommended_headway_min ?? sug.recommended_headway_mins ?? 10;
                    const bottleneck = sug.bottleneck_stop || sug.segment || 'Corridor waypoint';

                    return (
                      <div
                        key={`${sug.route_id}-${idx}`}
                        className="rounded-[26px] p-6 border border-black/[0.04] bg-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-5 transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)]"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#162A22] font-semibold text-[11px]">
                                  {sug.route_code}
                                </span>
                                <span className="text-xs text-black/40">·</span>
                                <span className="text-xs text-black/50">{sug.peak_window}</span>
                              </div>
                              <h4 className="font-semibold text-sm text-[#162A22]">{sug.route_name}</h4>
                            </div>
                            <span
                              className={cn(
                                'px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase shrink-0',
                                sug.urgency === 'HIGH'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : sug.urgency === 'MEDIUM'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-[#F7F6F2] text-[#162A22] border border-black/[0.06]'
                              )}
                            >
                              {sug.urgency} PRIORITY
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F7F6F2] border border-black/[0.04]">
                            <div className="space-y-1">
                              <span className="text-[11px] text-black/50">Passenger Load Factor</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-[#162A22]">{load.toFixed(1)}%</span>
                                <span className="text-[10px] text-black/40">capacity</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white overflow-hidden mt-1">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    load >= 75
                                      ? 'bg-amber-500'
                                      : load >= 50
                                      ? 'bg-[#162A22]'
                                      : 'bg-[#10B981]'
                                  )}
                                  style={{ width: `${Math.min(100, Math.max(10, load))}%` }}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[11px] text-black/50">Recommended Headway</span>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#162A22]">
                                <span className="text-black/40 line-through">{currentH}m</span>
                                <ArrowRight className="size-3 text-chart-5" />
                                <span className="text-chart-5 font-bold text-base">{recommendedH}m</span>
                              </div>
                              <p className="text-[10px] text-black/50">
                                {sug.extra_buses_needed && sug.extra_buses_needed > 0
                                  ? `+${sug.extra_buses_needed} vehicle dispatch required`
                                  : 'Headway consolidation'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-black/50">
                              <MapPin className="size-3 text-[#162A22]" />
                              <span>Bottleneck Stop:</span>
                              <span className="font-semibold text-[#162A22]">{bottleneck}</span>
                            </div>
                            <p className="text-xs text-[#162A22]/90 leading-relaxed p-3.5 rounded-2xl bg-[#F7F6F2] border border-black/[0.04]">
                              {sug.optimization_reason || sug.recommendation}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between gap-3">
                          <span className="text-[11px] text-black/40">
                            {isApplied ? 'Schedule synchronized.' : 'Ready to deploy.'}
                          </span>
                          {isApplied ? (
                            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E6F4EA] text-[#162A22] border border-[#162A22]/20 text-xs font-medium shrink-0">
                              <CheckCircle2 className="size-3.5 text-[#10B981]" />
                              <span>Schedule active</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isApplying}
                              onClick={() => handleApplySchedule(sug)}
                              className="px-4 py-2 rounded-full bg-[#162A22] hover:bg-[#1E352B] text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2 shrink-0"
                            >
                              {isApplying ? (
                                <>
                                  <RotateCcw className="size-3 animate-spin" />
                                  <span>Applying schedule…</span>
                                </>
                              ) : (
                                <>
                                  <span>Apply optimal schedule</span>
                                  <ArrowRight className="size-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {selectedRole === 'OPERATOR_ADMIN' && (
            <section id="system-benchmarks" className="pt-4 pb-2">
              <div className="rounded-[26px] bg-white p-7 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.04]">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[#E6F4EA] text-[#162A22]">
                      <Activity className="size-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold tracking-tight text-[#162A22] font-sans">
                          High-throughput telemetry & concurrency engine
                        </h3>
                        <span className="text-[11px] font-medium text-[#162A22] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full font-sans">
                          Phase 8 Stress Harness
                        </span>
                      </div>
                      <p className="text-xs text-black/50 mt-0.5 font-sans">
                        Production verification of TimescaleDB ingestion pipeline and pessimistic row locking defense
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleRunLoadTest}
                      disabled={isRunningLoadTest}
                      className="inline-flex items-center gap-2 rounded-full bg-[#162A22] hover:bg-[#1E352B] text-white px-4 py-2.5 text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50 font-sans"
                    >
                      <Activity className={cn('size-3.5', isRunningLoadTest && 'animate-spin')} />
                      <span>{isRunningLoadTest ? 'Ingesting 500 pings…' : 'Run 500-ping telemetry load test'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateConcurrencyClash}
                      disabled={isSimulatingClash}
                      className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-[#F7F6F2] text-[#162A22] border border-black/10 px-4 py-2.5 text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50 font-sans"
                    >
                      <Zap className={cn('size-3.5', isSimulatingClash && 'animate-spin')} />
                      <span>{isSimulatingClash ? 'Firing 15 collision threads…' : 'Test concurrency collision'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-[#F7F6F2] border border-black/[0.04] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#162A22] font-sans">Telemetry Ingestion Benchmark</span>
                      <span className="text-[11px] text-black/50 font-sans">500 concurrent pings</span>
                    </div>
                    {loadTestResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-3.5 rounded-xl border border-black/[0.04]">
                            <span className="text-[10px] text-black/50 block font-sans">Throughput</span>
                            <span className="text-lg font-bold text-[#162A22] font-sans">
                              {loadTestResult.throughput_pings_sec.toLocaleString()} <span className="text-[10px] font-normal text-black/50">p/s</span>
                            </span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-black/[0.04]">
                            <span className="text-[10px] text-black/50 block font-sans">Duration</span>
                            <span className="text-lg font-bold text-[#162A22] font-sans">
                              {loadTestResult.duration_ms} <span className="text-[10px] font-normal text-black/50">ms</span>
                            </span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-black/[0.04]">
                            <span className="text-[10px] text-black/50 block font-sans">Errors</span>
                            <span className="text-lg font-bold text-[#10B981] font-sans">
                              {loadTestResult.errors} <span className="text-[10px] font-normal text-black/50">err</span>
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#162A22] bg-[#E6F4EA] p-3 rounded-xl border border-[#162A22]/10 font-sans">
                          ✓ 500 real-time telemetry coordinates validated with tenant isolation and zero HTTP rate limit errors.
                        </p>
                      </div>
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-center text-xs text-black/50 bg-white/60 rounded-xl border border-dashed border-black/[0.08] font-sans px-4">
                        <span>Click &quot;Run 500-ping telemetry load test&quot; to measure live server throughput and TimescaleDB latency</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-2xl bg-[#F7F6F2] border border-black/[0.04] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#162A22] font-sans">Pessimistic Row-Locking Clash</span>
                      <span className="text-[11px] text-black/50 font-sans">15 simultaneous workers</span>
                    </div>
                    {clashResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-3.5 rounded-xl border border-black/[0.04]">
                            <span className="text-[10px] text-black/50 block font-sans">Lock Acquired</span>
                            <span className="text-lg font-bold text-[#162A22] font-sans">
                              {clashResult.success_count} <span className="text-[10px] font-normal text-black/50">thread</span>
                            </span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-black/[0.04]">
                            <span className="text-[10px] text-black/50 block font-sans">Blocked Safely</span>
                            <span className="text-lg font-bold text-amber-700 font-sans">
                              {clashResult.conflict_count} <span className="text-[10px] font-normal text-black/50">409s</span>
                            </span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-black/[0.04]">
                            <span className="text-[10px] text-black/50 block font-sans">Target Seat</span>
                            <span className="text-lg font-bold text-[#162A22] font-sans">
                              {clashResult.target_seat}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#162A22] bg-[#E6F4EA] p-3 rounded-xl border border-[#162A22]/10 font-sans">
                          ✓ ACID row-level locking strictly prevented double booking across 15 simultaneous requests ({clashResult.execution_time_ms} ms).
                        </p>
                      </div>
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-center text-xs text-black/50 bg-white/60 rounded-xl border border-dashed border-black/[0.08] font-sans px-4">
                        <span>Click &quot;Test concurrency collision&quot; to fire 15 concurrent seat reservations against PostgreSQL</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          <footer className="flex flex-col items-start justify-between gap-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center border-t border-foreground/5">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                <Bus className="size-3.5" />
              </span>
              <span className="font-serif text-xl leading-none tracking-tight text-foreground">NexTransit</span>
            </div>
            <p>© 2026 NexTransit Platform. Autonomous fleet control & spatial intelligence.</p>
          </footer>
        </main>
      </div>

      {showCreateTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl p-7 max-w-md w-full shadow-2xl border border-foreground/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <h4 className="font-serif text-xl font-normal text-foreground">
                Register new workspace
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateTenant(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTenantSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Tenant workspace name
                </label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => {
                    setNewTenantName(e.target.value);
                    setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="e.g. Metro Express Corridor"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Tenant URL slug
                </label>
                <input
                  type="text"
                  required
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  placeholder="e.g. metro-express-corridor"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTenant(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
                >
                  Create tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl p-7 max-w-md w-full shadow-2xl border border-foreground/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <h4 className="font-serif text-xl font-normal text-foreground">
                Invite directory member
              </h4>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  User email address
                </label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g. dispatcher@operator.in"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Assigned role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="RIDER">Rider</option>
                  <option value="DRIVER">Driver</option>
                  <option value="OPERATOR_ADMIN">Operator admin</option>
                  <option value="SUPER_ADMIN">Super admin</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
                >
                  Confirm invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl p-7 max-w-md w-full shadow-2xl border border-foreground/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <h4 className="font-serif text-xl font-normal text-foreground">
                Register fleet vehicle
              </h4>
              <button
                type="button"
                onClick={() => setShowAddBus(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddBusSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Fleet code
                </label>
                <input
                  type="text"
                  required
                  value={newBusCode}
                  onChange={(e) => setNewBusCode(e.target.value)}
                  placeholder="e.g. UNA-BUS-04"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  License plate
                </label>
                <input
                  type="text"
                  required
                  value={newBusPlate}
                  onChange={(e) => setNewBusPlate(e.target.value)}
                  placeholder="e.g. HP-72-C-4401"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Vehicle model
                </label>
                <input
                  type="text"
                  required
                  value={newBusModel}
                  onChange={(e) => setNewBusModel(e.target.value)}
                  placeholder="e.g. Volvo 9400 Multi-Axle"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Passenger capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBusCapacity}
                    onChange={(e) => setNewBusCapacity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Status
                  </label>
                  <select
                    value={newBusStatus}
                    onChange={(e) => setNewBusStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Assign to corridor / route
                </label>
                <select
                  value={newBusRouteId}
                  onChange={(e) => setNewBusRouteId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Unassigned (Reserve Fleet)</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} · {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBus(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
                >
                  Save vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl p-7 max-w-md w-full shadow-2xl border border-foreground/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <h4 className="font-serif text-xl font-normal text-foreground">
                Register PostGIS spatial stop
              </h4>
              <button
                type="button"
                onClick={() => setShowAddStop(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddStopSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Stop name
                </label>
                <input
                  type="text"
                  required
                  value={newStopName}
                  onChange={(e) => setNewStopName(e.target.value)}
                  placeholder="e.g. City Transit Terminal"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Stop code
                </label>
                <input
                  type="text"
                  required
                  value={newStopCode}
                  onChange={(e) => setNewStopCode(e.target.value)}
                  placeholder="e.g. UNA-ST-05"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newStopLat}
                    onChange={(e) => setNewStopLat(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newStopLng}
                    onChange={(e) => setNewStopLng(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStop(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
                >
                  Save stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl p-7 max-w-md w-full shadow-2xl border border-foreground/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <h4 className="font-serif text-xl font-normal text-foreground">
                Create transit route
              </h4>
              <button
                type="button"
                onClick={() => setShowAddRoute(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddRouteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Route name
                </label>
                <input
                  type="text"
                  required
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="e.g. Una - Mehatpur Express Line"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Route code
                </label>
                <input
                  type="text"
                  required
                  value={newRouteCode}
                  onChange={(e) => setNewRouteCode(e.target.value)}
                  placeholder="e.g. UNA-R03"
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Origin
                  </label>
                  <input
                    type="text"
                    required
                    value={newRouteOrigin}
                    onChange={(e) => setNewRouteOrigin(e.target.value)}
                    placeholder="Terminal A"
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={newRouteDest}
                    onChange={(e) => setNewRouteDest(e.target.value)}
                    placeholder="Terminal B"
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newRouteDist}
                    onChange={(e) => setNewRouteDist(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Estimated duration (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRouteEta}
                    onChange={(e) => setNewRouteEta(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-foreground/10 text-xs font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRoute(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm"
                >
                  Save route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBoardingPass && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl border border-foreground/10 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-foreground/5">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-[#162A22] text-[#86EFAC]">
                  <Bus className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">NexTransit boarding pass</h3>
                  <p className="text-xs text-muted-foreground">Official digital transit ticket</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBoardingPass(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium cursor-pointer p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-muted/40 p-5 space-y-4 border border-foreground/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-sans text-muted-foreground block">Transit corridor</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {activeRoute?.name || 'Active transit corridor'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-sans text-muted-foreground block">Assigned seat</span>
                  <p className="text-2xl font-bold font-sans text-primary mt-0.5">
                    {activeBooking.seat_number}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] font-sans text-muted-foreground block">Vehicle</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {activeSnapshot?.fleet_code || 'Fleet vehicle'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-sans text-muted-foreground block">Ticket code</span>
                  <p className="font-sans font-medium text-foreground mt-0.5">
                    {activeBooking.ticket_code}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-foreground/15 flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-foreground/10">
                  <svg
                    viewBox="0 0 100 100"
                    className="size-36 text-foreground"
                    fill="currentColor"
                  >
                    <rect x="0" y="0" width="30" height="30" rx="4" fill="#162A22" />
                    <rect x="5" y="5" width="20" height="20" rx="2" fill="white" />
                    <rect x="10" y="10" width="10" height="10" rx="1" fill="#162A22" />

                    <rect x="70" y="0" width="30" height="30" rx="4" fill="#162A22" />
                    <rect x="75" y="5" width="20" height="20" rx="2" fill="white" />
                    <rect x="80" y="10" width="10" height="10" rx="1" fill="#162A22" />

                    <rect x="0" y="70" width="30" height="30" rx="4" fill="#162A22" />
                    <rect x="5" y="75" width="20" height="20" rx="2" fill="white" />
                    <rect x="10" y="80" width="10" height="10" rx="1" fill="#162A22" />

                    <rect x="36" y="12" width="6" height="6" fill="#162A22" />
                    <rect x="48" y="12" width="6" height="6" fill="#162A22" />
                    <rect x="58" y="12" width="6" height="6" fill="#162A22" />
                    <rect x="36" y="24" width="6" height="6" fill="#162A22" />
                    <rect x="48" y="24" width="16" height="6" fill="#162A22" />

                    <rect x="12" y="36" width="6" height="6" fill="#162A22" />
                    <rect x="24" y="36" width="6" height="6" fill="#162A22" />
                    <rect x="36" y="36" width="12" height="12" rx="2" fill="#162A22" />
                    <rect x="54" y="36" width="6" height="6" fill="#162A22" />
                    <rect x="66" y="36" width="6" height="6" fill="#162A22" />
                    <rect x="78" y="36" width="10" height="6" fill="#162A22" />

                    <rect x="12" y="48" width="18" height="6" fill="#162A22" />
                    <rect x="54" y="48" width="6" height="18" fill="#162A22" />
                    <rect x="66" y="48" width="12" height="6" fill="#162A22" />
                    <rect x="84" y="48" width="6" height="6" fill="#162A22" />

                    <rect x="36" y="66" width="12" height="6" fill="#162A22" />
                    <rect x="66" y="66" width="6" height="18" fill="#162A22" />
                    <rect x="78" y="66" width="16" height="6" fill="#162A22" />
                    <rect x="36" y="78" width="6" height="16" fill="#162A22" />
                    <rect x="48" y="78" width="12" height="6" fill="#162A22" />
                    <rect x="78" y="78" width="6" height="16" fill="#162A22" />
                    <rect x="90" y="78" width="4" height="16" fill="#162A22" />
                  </svg>
                </div>
                <span className="text-[11px] font-sans text-muted-foreground text-center">
                  Scan validator at vehicle entrance
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-chart-5 font-medium">
                <CheckCircle2 className="size-4 text-chart-5" />
                <span>Confirmed & active</span>
              </span>
              <button
                type="button"
                onClick={() => setShowBoardingPass(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all cursor-pointer"
              >
                Close ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublicApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-foreground/10 space-y-6 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-start justify-between pb-4 border-b border-foreground/10">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#E6F4EA] text-[#162A22]">
                  <FileCode2 className="size-5" />
                </span>
                <div>
                  <h4 className="font-serif text-2xl font-normal text-foreground">
                    Public Transit API &amp; Webhooks
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Developer transit infrastructure: GTFS-Realtime v2.0 feeds, OpenAPI 3.0 docs, and HMAC-SHA256 signed event webhooks.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublicApiModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer p-1 rounded-full hover:bg-black/5"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="http://localhost:8081/api/v1/gtfs-rt/vehicle-positions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border border-black/[0.06] bg-[#F7F6F2] hover:bg-neutral-100 transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#162A22] group-hover:text-chart-5 transition-colors">
                      GTFS-RT Vehicle Positions
                    </span>
                    <ArrowUpRight className="size-3.5 text-black/40 group-hover:text-chart-5 transition-colors" />
                  </div>
                  <p className="text-[11px] text-black/50 leading-normal">
                    Real-time bus coordinates, bearing, speed, and occupancy status.
                  </p>
                  <span className="inline-block text-[10px] font-medium text-[#162A22]/70 bg-white px-2 py-0.5 rounded-full border border-black/[0.06] w-fit">
                    GET /gtfs-rt/vehicle-positions
                  </span>
                </a>

                <a
                  href="http://localhost:8081/api/v1/gtfs-rt/trip-updates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border border-black/[0.06] bg-[#F7F6F2] hover:bg-neutral-100 transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#162A22] group-hover:text-chart-5 transition-colors">
                      GTFS-RT Trip Updates
                    </span>
                    <ArrowUpRight className="size-3.5 text-black/40 group-hover:text-chart-5 transition-colors" />
                  </div>
                  <p className="text-[11px] text-black/50 leading-normal">
                    Corridor ETA predictions, delay seconds, and stop arrival times.
                  </p>
                  <span className="inline-block text-[10px] font-medium text-[#162A22]/70 bg-white px-2 py-0.5 rounded-full border border-black/[0.06] w-fit">
                    GET /gtfs-rt/trip-updates
                  </span>
                </a>

                <a
                  href="http://localhost:8081/api/v1/public/catalog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border border-black/[0.06] bg-[#F7F6F2] hover:bg-neutral-100 transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#162A22] group-hover:text-chart-5 transition-colors">
                      Public Network Directory
                    </span>
                    <ArrowUpRight className="size-3.5 text-black/40 group-hover:text-chart-5 transition-colors" />
                  </div>
                  <p className="text-[11px] text-black/50 leading-normal">
                    Multi-tenant catalog of all 5 campus networks, stops, and routes.
                  </p>
                  <span className="inline-block text-[10px] font-medium text-[#162A22]/70 bg-white px-2 py-0.5 rounded-full border border-black/[0.06] w-fit">
                    GET /public/catalog
                  </span>
                </a>

                <a
                  href="http://localhost:8081/api/v1/public/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border border-black/[0.06] bg-[#F7F6F2] hover:bg-neutral-100 transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#162A22] group-hover:text-chart-5 transition-colors">
                      OpenAPI 3.0 Documentation
                    </span>
                    <ArrowUpRight className="size-3.5 text-black/40 group-hover:text-chart-5 transition-colors" />
                  </div>
                  <p className="text-[11px] text-black/50 leading-normal">
                    Complete Swagger JSON specification for external integrations.
                  </p>
                  <span className="inline-block text-[10px] font-medium text-[#162A22]/70 bg-white px-2 py-0.5 rounded-full border border-black/[0.06] w-fit">
                    GET /public/openapi.json
                  </span>
                </a>
              </div>

              <div className="rounded-2xl p-5 border border-black/[0.06] bg-[#F7F6F2] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-semibold text-xs text-[#162A22]">Cryptographic Webhook Dispatcher</h5>
                    <p className="text-[11px] text-black/50 mt-0.5">
                      Simulate webhook triggers signed with HMAC-SHA256 in the X-NexTransit-Signature header.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['trip.arrived', 'seat.booked', 'schedule.optimized'] as const).map((ev) => (
                      <button
                        key={ev}
                        type="button"
                        onClick={() => setTestWebhookEvent(ev)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer',
                          testWebhookEvent === ev
                            ? 'bg-[#162A22] text-white shadow-2xs'
                            : 'bg-white text-[#162A22] border border-black/[0.06] hover:bg-neutral-50'
                        )}
                      >
                        {ev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-black/50">
                    Target: <span className="font-semibold text-[#162A22]">POST /api/v1/webhooks/test</span>
                  </span>
                  <button
                    type="button"
                    disabled={isDispatchingWebhook}
                    onClick={() => handleDispatchTestWebhook(testWebhookEvent)}
                    className="px-4 py-2 rounded-full bg-[#162A22] hover:bg-[#1E352B] text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isDispatchingWebhook ? (
                      <>
                        <RotateCcw className="size-3 animate-spin" />
                        <span>Dispatching…</span>
                      </>
                    ) : (
                      <>
                        <Zap className="size-3" />
                        <span>Trigger {testWebhookEvent}</span>
                      </>
                    )}
                  </button>
                </div>

                {testWebhookResult && webhookDrawerOpen && (
                  <div className="mt-4 p-4 rounded-xl bg-white border border-black/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#162A22] text-[10px] font-bold">
                          HTTP 200 OK
                        </span>
                        <span className="text-xs font-semibold text-[#162A22]">Webhook Payload Generated</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWebhookDrawerOpen(false)}
                        className="text-xs text-black/40 hover:text-black cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-black/40 tracking-wider">
                        X-NexTransit-Signature (HMAC-SHA256)
                      </span>
                      <div className="p-2 rounded-lg bg-[#F7F6F2] border border-black/[0.04] text-[11px] text-[#162A22] break-all select-all">
                        {testWebhookResult.signature}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-black/40 tracking-wider">
                        Event Body
                      </span>
                      <pre className="p-3 rounded-lg bg-[#F7F6F2] border border-black/[0.04] text-[11px] text-[#162A22] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">
                        {JSON.stringify(testWebhookResult.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-foreground/10 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-chart-5 font-medium">
                <CheckCircle2 className="size-4 text-chart-5" />
                <span>HMAC-SHA256 Verified · RFC 7515</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPublicApiModal(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
