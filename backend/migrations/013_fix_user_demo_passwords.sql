UPDATE users
SET password_hash = '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i';

INSERT INTO users (id, tenant_id, email, role, full_name, password_hash) VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'admin@um.edu.my', 'OPERATOR_ADMIN', 'Prof. Noor Azuan (Operations Director)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'driver@um.edu.my', 'DRIVER', 'Mohd Razak (Lead Shuttle Driver)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'rider@um.edu.my', 'RIDER', 'Nurul Aisyah (Student Commuter)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'student@um.edu.my', 'RIDER', 'Nurul Aisyah (Student Commuter)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),

    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'admin@nus.edu.sg', 'OPERATOR_ADMIN', 'Dr. Evelyn Tan (Mobility Director)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'driver@nus.edu.sg', 'DRIVER', 'Tan Wei Ming (Campus Transit Lead)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'rider@nus.edu.sg', 'RIDER', 'Marcus Koh (Engineering Undergraduate)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'admin@u.nus.edu', 'OPERATOR_ADMIN', 'Dr. Evelyn Tan (Mobility Director)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'driver@u.nus.edu', 'DRIVER', 'Tan Wei Ming (Campus Transit Lead)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'student@u.nus.edu', 'RIDER', 'Marcus Koh (Engineering Undergraduate)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),

    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'admin@u-tokyo.ac.jp', 'OPERATOR_ADMIN', 'Kenji Takahashi (Hongo Dispatch Chief)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'driver@u-tokyo.ac.jp', 'DRIVER', 'Sato Hiroshi (Lead Driver)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'rider@u-tokyo.ac.jp', 'RIDER', 'Yuki Tanaka (Graduate Researcher)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'student@u-tokyo.ac.jp', 'RIDER', 'Yuki Tanaka (Graduate Researcher)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),

    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'admin@iitd.ac.in', 'OPERATOR_ADMIN', 'Prof. Rajesh Verma (Transport Dean)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'driver@iitd.ac.in', 'DRIVER', 'Virender Singh (Senior Captain)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'rider@iitd.ac.in', 'RIDER', 'Ananya Gupta (Biotech Scholar)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'student@iitd.ac.in', 'RIDER', 'Ananya Gupta (Biotech Scholar)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),

    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'admin@iisc.ac.in', 'OPERATOR_ADMIN', 'Dr. S. Ramesh (Sustainability Head)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'driver@iisc.ac.in', 'DRIVER', 'Manjunath Gowda (Green Fleet Pilot)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'rider@iisc.ac.in', 'RIDER', 'Karthik Rao (Quantum Physics Fellow)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'student@iisc.ac.in', 'RIDER', 'Karthik Rao (Quantum Physics Fellow)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),

    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'admin@apextech.my', 'OPERATOR_ADMIN', 'Priya Nair (Corporate Transit Manager)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'driver@apextech.my', 'DRIVER', 'David Chen (Executive Fleet Captain)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'rider@apextech.my', 'RIDER', 'Marcus Vance (Staff Systems Engineer)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'admin@apextech.com', 'OPERATOR_ADMIN', 'Priya Nair (Corporate Transit Manager)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'driver@apextech.com', 'DRIVER', 'David Chen (Executive Fleet Captain)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'employee@apextech.com', 'RIDER', 'Marcus Vance (Staff Systems Engineer)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),

    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'admin@alpinecharter.in', 'OPERATOR_ADMIN', 'Tenzing Norbu (Expedition Operations Chief)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'driver@alpinecharter.in', 'DRIVER', 'Dorje Lama (Master Alpine Driver)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'rider@alpinecharter.in', 'RIDER', 'Elena Rostova (Charter Passenger)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'admin@himalayancharter.com', 'OPERATOR_ADMIN', 'Tenzing Norbu (Expedition Operations Chief)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'driver@himalayancharter.com', 'DRIVER', 'Dorje Lama (Master Alpine Driver)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i'),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'guest@himalayancharter.com', 'RIDER', 'Elena Rostova (Charter Passenger)', '$2a$10$OkAmq4G0eANM.xSNfAi0O.BZmB.OuMdSPahnJO/lgLlwOgIDTQs4i')
ON CONFLICT (tenant_id, email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash, 
    full_name = EXCLUDED.full_name;
