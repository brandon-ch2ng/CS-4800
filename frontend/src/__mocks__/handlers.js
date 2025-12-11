import { http, HttpResponse } from 'msw';

// Mock data
const mockUsers = {
  'patient@test.com': {
    email: 'patient@test.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'patient',
    password: 'Password123',
  },
  'doctor@test.com': {
    email: 'doctor@test.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'doctor',
    password: 'Doctor123',
  },
};

const mockToken = 'mock-jwt-token-12345';

export const handlers = [
  // Auth endpoints
  http.post('/auth/register', async ({ request }) => {
    const body = await request.json();
    
    if (mockUsers[body.email]) {
      return HttpResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      message: 'Registration successful',
      user: { email: body.email, role: body.role },
    });
  }),

  http.post('/auth/login', async ({ request }) => {
    const body = await request.json();
    const user = mockUsers[body.email];
    
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      token: mockToken,
      role: user.role,
      message: 'Login successful',
    });
  }),

  http.get('/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth || !auth.includes('Bearer')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      email: 'patient@test.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'patient',
    });
  }),

  // Patient endpoints
  http.get('/patients/', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      message: 'Welcome patient@test.com',
    });
  }),

  http.get('/patients/profile', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      age: 30,
      gender: 'female',
      blood_pressure: 'normal',
      cholesterol_level: 'normal',
      fever: false,
      cough: false,
      fatigue: false,
      difficulty_breathing: false,
      survey_completed: true,
    });
  }),

  http.put('/patients/profile', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    return HttpResponse.json({
      message: 'Profile updated successfully',
      ...body,
    });
  }),

  http.get('/patients/notes', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      notes: [
        {
          _id: 'note1',
          note: 'Patient is recovering well',
          doctor_email: 'doctor@test.com',
          created_at: new Date().toISOString(),
        },
      ],
    });
  }),

  http.get('/patients/predictions', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      predictions: [],
    });
  }),

  // Doctor endpoints
  http.get('/doctors/', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      message: 'Welcome Dr. Smith',
    });
  }),

  http.post('/doctors/notes', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    return HttpResponse.json({
      message: 'Note added successfully',
      note: {
        _id: 'new-note-id',
        ...body,
        created_at: new Date().toISOString(),
      },
    });
  }),

  http.get('/doctors/patients/:email/notes', ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      notes: [
        {
          _id: 'note1',
          note: 'Follow-up needed',
          patient_email: params.email,
          doctor_email: 'doctor@test.com',
          created_at: new Date().toISOString(),
        },
      ],
    });
  }),

  http.get('/doctors/patient-profile', ({ request }) => {
    const auth = request.headers.get('Authorization');
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!email) {
      return HttpResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      user: {
        email: email,
        first_name: 'John',
        last_name: 'Doe',
      },
      profile: {
        age: 30,
        gender: 'male',
        blood_pressure: 'normal',
        cholesterol_level: 'normal',
      },
    });
  }),

  // Appointment endpoints
  http.get('/appointments/mine', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      items: [
        {
          _id: 'appt1',
          doctor_email: 'doctor@test.com',
          requested_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
          reason: 'Checkup',
        },
      ],
    });
  }),

  http.get('/appointments/incoming', ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      items: [
        {
          _id: 'appt1',
          patient_email: 'patient@test.com',
          requested_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
          reason: 'Consultation',
        },
      ],
    });
  }),

  http.post('/appointments/', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    return HttpResponse.json({
      message: 'Appointment created',
      appointment: {
        _id: 'new-appt-id',
        ...body,
        status: 'pending',
      },
    });
  }),

  http.patch('/appointments/:id/status', async ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    return HttpResponse.json({
      message: 'Appointment status updated',
      appointment: {
        _id: params.id,
        status: body.status,
      },
    });
  }),

  // Prediction endpoint
  http.post('/api/predict', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    return HttpResponse.json({
      result: {
        label: 0,
        probability: 0.82,
      },
      input_data: body,
      created_at: new Date().toISOString(),
    });
  }),
];
