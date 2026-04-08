/** Booking + standalone questionnaire steps by complaint (skin / hair / nails). */

const sharedSteps = (labels) => [
  {
    title: labels.step1Title,
    fields: [
      {
        name: 'duration',
        label: labels.duration,
        type: 'select',
        options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year'],
      },
      {
        name: 'severity',
        label: labels.severity,
        type: 'select',
        options: ['Mild', 'Moderate', 'Severe'],
      },
      { name: 'location', label: labels.location, type: 'text' },
    ],
  },
  {
    title: labels.step2Title,
    fields: [
      {
        name: 'familyHistory',
        label: labels.familyHistory,
        type: 'select',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        name: 'previousTreatment',
        label: labels.previousTreatment,
        type: 'select',
        options: ['Yes', 'No'],
      },
      { name: 'medications', label: labels.medications, type: 'textarea' },
      { name: 'allergies', label: labels.allergies, type: 'textarea' },
    ],
  },
  {
    title: labels.step3Title,
    fields: [
      { name: 'symptoms', label: labels.symptoms, type: 'textarea' },
      { name: 'triggers', label: labels.triggers, type: 'textarea' },
      { name: 'impact', label: labels.impact, type: 'textarea' },
    ],
  },
  {
    title: labels.step4Title,
    fields: [
      { name: 'lifestyle', label: labels.lifestyle, type: 'textarea' },
      { name: 'concerns', label: labels.concerns, type: 'textarea' },
    ],
  },
]

const LABELS = {
  skin: {
    step1Title: 'Skin — basic information',
    duration: 'How long have you had this skin concern?',
    severity: 'Severity of skin symptoms?',
    location: 'Body area(s) affected (e.g. face, arms)',
    step2Title: 'Skin — history',
    familyHistory: 'Family history of skin conditions?',
    previousTreatment: 'Previous dermatology treatment?',
    medications: 'Current medications / topicals',
    allergies: 'Known allergies (drugs, latex, etc.)',
    step3Title: 'Skin — symptoms',
    symptoms: 'Describe skin changes (color, texture, itching, pain)',
    triggers: 'Triggers (sun, stress, products, food)',
    impact: 'Impact on daily life',
    step4Title: 'Skin — additional',
    lifestyle: 'Skincare routine, sun exposure, stress',
    concerns: 'Questions for your dermatologist',
  },
  hair: {
    step1Title: 'Hair & scalp — basic information',
    duration: 'How long have you noticed hair/scalp changes?',
    severity: 'How severe is shedding or thinning?',
    location: 'Area (crown, hairline, diffuse, patchy)',
    step2Title: 'Hair — history',
    familyHistory: 'Family history of hair loss?',
    previousTreatment: 'Treatments tried (minoxidil, PRP, etc.)?',
    medications: 'Current medications or supplements',
    allergies: 'Allergies relevant to treatment',
    step3Title: 'Hair — symptoms',
    symptoms: 'Describe shedding, thinning, scalp symptoms',
    triggers: 'Stress, illness, postpartum, styling',
    impact: 'Impact on confidence / daily life',
    step4Title: 'Hair — additional',
    lifestyle: 'Diet, stress, hair care products',
    concerns: 'Questions for your dermatologist',
  },
  nails: {
    step1Title: 'Nails — basic information',
    duration: 'How long have nail changes been present?',
    severity: 'Severity (pain, thickness, discoloration)',
    location: 'Which nail(s) — hand / foot',
    step2Title: 'Nails — history',
    familyHistory: 'Family history of nail or psoriasis conditions?',
    previousTreatment: 'Previous nail treatments or antifungals?',
    medications: 'Current medications',
    allergies: 'Drug allergies',
    step3Title: 'Nails — symptoms',
    symptoms: 'Describe color, shape, pain, separation',
    triggers: 'Trauma, moisture, occupation',
    impact: 'Pain or functional impact',
    step4Title: 'Nails — additional',
    lifestyle: 'Manicures, footwear, occupation',
    concerns: 'Questions for your dermatologist',
  },
}

export function getQuestionnaireSteps(complaintType) {
  const key = ['skin', 'hair', 'nails'].includes(complaintType) ? complaintType : 'skin'
  return sharedSteps(LABELS[key])
}
