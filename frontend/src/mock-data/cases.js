export const mockCases = [
  {
    id: 'case-1',
    patientId: '1',
    dermatologistId: '1',
    complaintType: 'hair',
    complaintSubtype: 'alopecia',
    status: 'active',
    createdAt: '2024-11-15',
    updatedAt: '2024-12-10',
    questionnaire: {
      duration: '6 months',
      severity: 'moderate',
      familyHistory: 'yes',
      medications: ['None'],
      allergies: ['None'],
    },
    images: [
      {
        id: 'img-1',
        url: 'https://cdn.sanity.io/images/0vv8moc6/dermatologytimes/2326e93277451e34bebe4527300a3e3eb6119557-1824x1284.webp?w=1824&max-h=1284&fit=crop&auto=format',
        angle: 'front',
        uploadedAt: '2024-11-15',
      },
      {
        id: 'img-2',
        url: 'https://images.apollo247.in/pd-cms/cms/2024-05/eczema_0.jpg?tr=q-80,f-webp,w-400,dpr-2.5,c-at_max%201000w',
        angle: 'side',
        uploadedAt: '2024-11-15',
      },
    ],
    aiResults: {
      detected: true,
      confidence: 87,
      severity: 'moderate',
      type: 'androgenetic alopecia',
    },
    treatmentPlan: {
      id: 'plan-1',
      medications: [
        { name: 'Minoxidil 5%', dosage: 'Apply twice daily', duration: '6 months' },
        { name: 'Finasteride 1mg', dosage: '1 tablet daily', duration: '12 months' },
      ],
      lifestyle: ['Reduce stress', 'Balanced diet', 'Regular exercise'],
      followUpDate: '2024-12-20',
    },
    visits: [
      {
        id: 'visit-1',
        date: '2024-11-15',
        type: 'initial',
        notes: 'Initial consultation and diagnosis',
        images: ['img-1', 'img-2'],
      },
      {
        id: 'visit-2',
        date: '2024-12-10',
        type: 'follow-up',
        notes: 'Progress noted, treatment adjusted',
        images: ['img-3'],
      },
    ],
  },
]
