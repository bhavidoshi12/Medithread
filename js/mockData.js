/**
 * MediThread - Initial Mock Multi-Generational Household Dataset
 * Realistic clinical records, biomarker timeseries, allergies, emergency contacts, and care gaps.
 */

export const INITIAL_HOUSEHOLD = {
  id: "hh-jenkins-01",
  name: "Jenkins Family Care Hub",
  primaryOwnerId: "user-sarah-01",
  members: [
    {
      id: "profile-arthur",
      firstName: "Arthur",
      lastName: "Jenkins",
      relationship: "Father (71y)",
      dateOfBirth: "1953-04-12",
      gender: "Male",
      bloodGroup: "O+",
      avatarColor: "#D97706",
      avatarInitials: "AJ",
      majorAllergies: ["Sulfa Drugs (Severe Rash/Hives)", "Ibuprofen (GI Distress)"],
      chronicConditions: ["Type 2 Diabetes Mellitus", "Essential Hypertension", "Stage 2 Chronic Kidney Disease"],
      emergencyContacts: [
        { name: "Sarah Jenkins", relation: "Daughter (Caregiver)", phone: "+1 (555) 349-8812" },
        { name: "Eleanor Jenkins", relation: "Spouse", phone: "+1 (555) 349-8813" }
      ],
      organDonor: true,
      dnrOrder: false,
      insurancePolicy: "Medicare Part B #MED-994821-X",
      primaryPhysician: "Dr. Robert Sterling, MD (Internal Medicine - Mayo Clinic)",
      emergencySummary: "71yo male with T2D, CKD Stage 2 & Hypertension. Takes Metformin 1000mg BID & Lisinopril 20mg. High fall risk. Penicillin-tolerant, allergic to Sulfa."
    },
    {
      id: "profile-sarah",
      firstName: "Sarah",
      lastName: "Jenkins",
      relationship: "Self (38y)",
      dateOfBirth: "1986-08-19",
      gender: "Female",
      bloodGroup: "A+",
      avatarColor: "#0EA5E9",
      avatarInitials: "SJ",
      majorAllergies: ["Penicillin (Anaphylaxis shock risk - EpiPen Carrier)", "Shellfish (Mild rash)"],
      chronicConditions: ["Mild Intermittent Asthma", "Migraine with Aura"],
      emergencyContacts: [
        { name: "David Jenkins", relation: "Spouse", phone: "+1 (555) 832-1920" },
        { name: "Dr. Amanda Ross", relation: "PCP", phone: "+1 (555) 902-4411" }
      ],
      organDonor: true,
      dnrOrder: false,
      insurancePolicy: "BlueCross Premier PPO #BC-448201",
      primaryPhysician: "Dr. Amanda Ross, MD (Family Medicine)",
      emergencySummary: "38yo female with anaphylactic Penicillin allergy. Carries EpiPen. Mild asthma, uses Albuterol rescue inhaler PRN. Blood group A+."
    },
    {
      id: "profile-david",
      firstName: "David",
      lastName: "Jenkins",
      relationship: "Spouse (41y)",
      dateOfBirth: "1983-02-14",
      gender: "Male",
      bloodGroup: "B+",
      avatarColor: "#10B981",
      avatarInitials: "DJ",
      majorAllergies: ["No Known Drug Allergies (NKDA)"],
      chronicConditions: ["Mild Hyperlipidemia", "L4-L5 Lumbar Disc Bulge"],
      emergencyContacts: [
        { name: "Sarah Jenkins", relation: "Spouse", phone: "+1 (555) 349-8812" }
      ],
      organDonor: true,
      dnrOrder: false,
      insurancePolicy: "BlueCross Premier PPO #BC-448201",
      primaryPhysician: "Dr. Kevin Tran, MD (Orthopedic & Sports Medicine)",
      emergencySummary: "41yo male, NKDA. Prior lumbar herniation, active physical therapy. Blood group B+."
    },
    {
      id: "profile-eleanor",
      firstName: "Eleanor",
      lastName: "Jenkins",
      relationship: "Mother (68y)",
      dateOfBirth: "1956-11-03",
      gender: "Female",
      bloodGroup: "AB-",
      avatarColor: "#8B5CF6",
      avatarInitials: "EJ",
      majorAllergies: ["Codeine (Extreme Nausea/Confusion)"],
      chronicConditions: ["Primary Hypothyroidism", "Osteopenia", "Mild Osteoarthritis"],
      emergencyContacts: [
        { name: "Arthur Jenkins", relation: "Spouse", phone: "+1 (555) 349-8813" },
        { name: "Sarah Jenkins", relation: "Daughter", phone: "+1 (555) 349-8812" }
      ],
      organDonor: false,
      dnrOrder: false,
      insurancePolicy: "Aetna Senior Advantage #AET-7712",
      primaryPhysician: "Dr. Maya Lin, MD (Endocrinology)",
      emergencySummary: "68yo female with hypothyroidism on Levothyroxine 75mcg. Osteopenia under vitamin D & calcium regimen. Blood group AB-."
    },
    {
      id: "profile-leo",
      firstName: "Leo",
      lastName: "Jenkins",
      relationship: "Son (7y)",
      dateOfBirth: "2017-06-25",
      gender: "Male",
      bloodGroup: "A+",
      avatarColor: "#EC4899",
      avatarInitials: "LJ",
      majorAllergies: ["Peanuts (Severe - Ingestion)", "Tree Nuts"],
      chronicConditions: ["Pediatric Allergic Rhinitis", "Exercise-Induced Bronchospasm"],
      emergencyContacts: [
        { name: "Sarah Jenkins", relation: "Mother", phone: "+1 (555) 349-8812" },
        { name: "David Jenkins", relation: "Father", phone: "+1 (555) 832-1920" }
      ],
      organDonor: true,
      dnrOrder: false,
      insurancePolicy: "BlueCross Family Care #BC-448201",
      primaryPhysician: "Dr. Rachel Green, MD (Pediatric Care Associates)",
      emergencySummary: "7yo male with severe peanut allergy. Auvi-Q / EpiPen in backpack. Inhaler before physical activities."
    }
  ]
};

export const INITIAL_HEALTH_EVENTS = [
  // --- Arthur's Timeline (Diabetic & Chronic Monitoring) ---
  {
    id: "evt-art-01",
    profileId: "profile-arthur",
    title: "Comprehensive Metabolic Panel & Glycemic Audit",
    category: "lab_report",
    eventDate: "2024-05-18",
    severity: "monitoring_needed",
    clinicalSummary: "HbA1c measured at 7.8% (elevated from 7.2% 6 mos prior). Fasting blood glucose 154 mg/dL. eGFR stable at 58 mL/min/1.73m² (CKD Stage 2). Lipid panel indicates mild LDL elevation.",
    providerName: "Dr. Robert Sterling, MD",
    facilityName: "Metropolitan Endocrine & Diabetes Clinic",
    structuredData: {
      markers: [
        { name: "HbA1c", value: 7.8, unit: "%", status: "elevated", ref: "4.0 - 5.6" },
        { name: "Fasting Blood Glucose", value: 154, unit: "mg/dL", status: "elevated", ref: "70 - 99" },
        { name: "eGFR", value: 58, unit: "mL/min", status: "borderline", ref: "> 60" },
        { name: "Serum Creatinine", value: 1.34, unit: "mg/dL", status: "elevated", ref: "0.7 - 1.2" },
        { name: "LDL Cholesterol", value: 122, unit: "mg/dL", status: "elevated", ref: "< 100" }
      ]
    },
    sourceDocumentName: "Metro_Lab_CMP_May2024.pdf",
    ocrRawText: "METROPOLITAN CLINICAL LABS\nPATIENT: ARTHUR JENKINS | DOB: 1953-04-12\nTEST: CMP + HBA1C\nHEMOGLOBIN A1C: 7.8 % [HIGH]\nGLUCOSE FASTING: 154 mg/dL [HIGH]\nEGFR: 58 mL/min/1.73m2 [BORDERLINE]\nCREATININE: 1.34 mg/dL [MILD HIGH]\nCOMMENTS: Glycemic control sub-optimal. Recommend titration of Metformin or adjunct SGLT2 inhibitor."
  },
  {
    id: "evt-art-02",
    profileId: "profile-arthur",
    title: "Medication Adjustment: Metformin Titration & Empagliflozin",
    category: "medication",
    eventDate: "2024-05-22",
    severity: "routine",
    clinicalSummary: "Increased Metformin from 500mg BID to 1000mg BID with morning and evening meals. Initiated Empagliflozin (Jardiance) 10mg once daily for renal protection and glycemic reduction.",
    providerName: "Dr. Robert Sterling, MD",
    facilityName: "Metropolitan Endocrine Clinic",
    structuredData: {
      medications: [
        { drug: "Metformin HCl", dose: "1000 mg", frequency: "Twice daily with meals", purpose: "T2D Control", status: "Active" },
        { drug: "Empagliflozin (Jardiance)", dose: "10 mg", frequency: "Once daily in AM", purpose: "Renoprotection & Glycemia", status: "Active" },
        { drug: "Lisinopril", dose: "20 mg", frequency: "Daily morning", purpose: "Hypertension", status: "Active" },
        { drug: "Atorvastatin", dose: "40 mg", frequency: "Daily evening", purpose: "Lipid Management", status: "Active" }
      ]
    },
    sourceDocumentName: "Rx_Metformin_Empagliflozin_Titration.pdf",
    ocrRawText: "PRESCRIPTION ORDER\nRx: Metformin 1000mg Tab #60. Sig: 1 tab PO BID with meals.\nRx: Jardiance 10mg Tab #30. Sig: 1 tab PO daily in AM.\nRefills: 3 | Prescriber: Dr. R. Sterling, NPI: 19482019"
  },
  {
    id: "evt-art-03",
    profileId: "profile-arthur",
    title: "Cardiovascular Stress Echo & BP Holter Evaluation",
    category: "diagnosis",
    eventDate: "2023-11-10",
    severity: "routine",
    clinicalSummary: "No exercise-induced myocardial ischemia detected. Resting BP 138/84 mmHg. Left ventricular ejection fraction preserved at 60%. Normal diastolic filling pattern.",
    providerName: "Dr. Alexander Vance, MD (Cardiologist)",
    facilityName: "Northwest Heart & Vascular Institute",
    structuredData: {
      findings: [
        { key: "Ejection Fraction (LVEF)", value: "60%", status: "Normal" },
        { key: "Systolic BP", value: 138, unit: "mmHg", status: "Mild Stage 1" },
        { key: "Diastolic BP", value: 84, unit: "mmHg", status: "Normal" },
        { key: "Ischemia", value: "Negative", status: "Clear" }
      ]
    },
    sourceDocumentName: "Stress_Echo_Report_Arthur_Nov2023.pdf",
    ocrRawText: "STRESS ECHOCARDIOGRAM REPORT\nPatient: Arthur Jenkins | Indication: T2D risk stratification\nResting LVEF: 60%. Peak workload: 8.5 METs. Normal wall motion kinetics. No dynamic ST depressions. Conclusion: Negative for inducible ischemia."
  },
  {
    id: "evt-art-04",
    profileId: "profile-arthur",
    title: "Cataract Phacoemulsification Surgery (Right Eye)",
    category: "procedure_vaccine",
    eventDate: "2023-03-14",
    severity: "resolved",
    clinicalSummary: "Uneventful right eye phacoemulsification with posterior chamber intraocular lens (IOL) implant. Post-op vision restored to 20/25 with corrective reading lenses.",
    providerName: "Dr. Elena Rostova, MD (Ophthalmic Surgeon)",
    facilityName: "Vision Care Surgical Center",
    structuredData: {
      procedure: "Cataract Extracapsular Extraction with IOL",
      eye: "Right (OD)",
      implantType: "Alcon AcrySof IQ SN60WF (+21.5D)",
      outcome: "Success - No complications"
    },
    sourceDocumentName: "Surgical_Discharge_Right_Cataract.pdf",
    ocrRawText: "SURGICAL OPERATIVE NOTE\nSurgeon: Dr. Elena Rostova, MD\nProcedure: Right phacoemulsification + IOL implant\nAnesthesia: Topical + Intracameral Lidocaine\nEstimated Blood Loss: Negligible. Implant serial: ALC-77402. Patient discharged in stable condition."
  },

  // --- Sarah's Timeline ---
  {
    id: "evt-sar-01",
    profileId: "profile-sarah",
    title: "Annual Preventive Executive Health Exam & Lipid Profile",
    category: "lab_report",
    eventDate: "2024-03-10",
    severity: "routine",
    clinicalSummary: "Total cholesterol 178 mg/dL, HDL 62 mg/dL (protective), LDL 98 mg/dL (optimal), Triglycerides 90 mg/dL. Fasting glucose 88 mg/dL. Thyroid TSH 1.8 mIU/L (normal). Spirometry within normal limits.",
    providerName: "Dr. Amanda Ross, MD",
    facilityName: "Family Health Associates",
    structuredData: {
      markers: [
        { name: "Total Cholesterol", value: 178, unit: "mg/dL", status: "optimal", ref: "< 200" },
        { name: "HDL Cholesterol", value: 62, unit: "mg/dL", status: "optimal", ref: "> 50" },
        { name: "LDL Cholesterol", value: 98, unit: "mg/dL", status: "optimal", ref: "< 100" },
        { name: "Fasting Glucose", value: 88, unit: "mg/dL", status: "optimal", ref: "70 - 99" },
        { name: "TSH", value: 1.82, unit: "mIU/L", status: "optimal", ref: "0.4 - 4.0" }
      ]
    },
    sourceDocumentName: "Sarah_Preventive_Wellness_2024.pdf",
    ocrRawText: "PREVENTIVE HEALTH PROFILE\nPATIENT: SARAH JENKINS (38F)\nALLERGY NOTE: PENICILLIN ANAPHYLAXIS - DO NOT ADMINISTER BETA-LACTAMS\nCHOLESTEROL: 178 mg/dL | HDL: 62 mg/dL | LDL: 98 mg/dL | TSH: 1.82\nImpression: Patient in excellent overall health. Continues Albuterol inhaler PRN for mild exercise-induced asthma."
  },
  {
    id: "evt-sar-02",
    profileId: "profile-sarah",
    title: "Seasonal Asthma Exacerbation & Inhaler Renewal",
    category: "medication",
    eventDate: "2023-09-18",
    severity: "routine",
    clinicalSummary: "Mild wheezing precipitated by high ragweed pollen count. FEV1 84% predicted. Prescribed Albuterol Sulfate 90mcg HFA inhaler (2 puffs Q4-6H PRN) and Fluticasone Propionate nasal spray.",
    providerName: "Dr. Amanda Ross, MD",
    facilityName: "Family Health Associates",
    structuredData: {
      medications: [
        { drug: "Albuterol Sulfate HFA", dose: "90 mcg/puff", frequency: "1-2 puffs Q4-6H PRN wheezing", status: "Active" },
        { drug: "Fluticasone Propionate", dose: "50 mcg/actuation", frequency: "1 spray each nostril daily", status: "Active" }
      ]
    },
    sourceDocumentName: "Rx_Albuterol_Fluticasone.pdf",
    ocrRawText: "CLINICAL ENCOUNTER NOTE\nChief Complaint: Cough and mild nocturnal wheezing\nLungs: Bilateral mild end-expiratory wheezes, clear apices.\nPlan: Renew Albuterol inhaler. Strict avoidance of penicillin/cephalosporin cross-reactivity noted."
  },

  // --- David's Timeline ---
  {
    id: "evt-dav-01",
    profileId: "profile-david",
    title: "Lumbar Spine MRI & Orthopedic Review",
    category: "diagnosis",
    eventDate: "2023-10-04",
    severity: "monitoring_needed",
    clinicalSummary: "L4-L5 disc protrusion with mild bilateral neural foraminal narrowing. No cord impingement. Non-surgical candidate; conservative treatment with physical therapy recommended.",
    providerName: "Dr. Kevin Tran, MD",
    facilityName: "Northwest Orthopedic Spine Group",
    structuredData: {
      imaging: "MRI Lumbar Spine (Non-contrast)",
      level: "L4-L5 Broad-based bulge",
      recommendation: "Core PT, ergonomic workstation, avoid heavy deadlifts"
    },
    sourceDocumentName: "Lumbar_MRI_Report_David_2023.pdf",
    ocrRawText: "MRI LUMBAR SPINE REPORT\nIndication: Axial low back pain radiating to left gluteal region\nFindings: L4-L5 shows 3.5mm posterior disc bulge with mild thecal sac indentation. L5-S1 unremarkable. Impression: Lumbar discogenic pain without neurological deficit."
  },

  // --- Eleanor's Timeline ---
  {
    id: "evt-ele-01",
    profileId: "profile-eleanor",
    title: "DEXA Bone Densitometry Scan & Thyroid Panel",
    category: "lab_report",
    eventDate: "2024-01-20",
    severity: "monitoring_needed",
    clinicalSummary: "Femoral neck T-score -1.9 (Osteopenia). Lumbar spine L1-L4 T-score -1.6. TSH 2.4 mIU/L on Levothyroxine 75mcg daily. Vitamin D 25-OH is 28 ng/mL (insufficient).",
    providerName: "Dr. Maya Lin, MD",
    facilityName: "Metropolitan Endocrinology & Bone Health",
    structuredData: {
      markers: [
        { name: "Femoral Neck T-Score", value: -1.9, unit: "SD", status: "osteopenia", ref: "> -1.0" },
        { name: "L-Spine T-Score", value: -1.6, unit: "SD", status: "osteopenia", ref: "> -1.0" },
        { name: "Serum Vitamin D 25-OH", value: 28, unit: "ng/mL", status: "insufficient", ref: "30 - 100" },
        { name: "Thyroid TSH", value: 2.41, unit: "mIU/L", status: "optimal", ref: "0.4 - 4.0" }
      ]
    },
    sourceDocumentName: "DEXA_Bone_Scan_Eleanor_2024.pdf",
    ocrRawText: "DEXA BONE MINERAL DENSITY AUDIT\nPATIENT: ELEANOR JENKINS (68F)\nFEMORAL NECK: T-Score = -1.9 (Osteopenia category)\nLUMBAR SPINE: T-Score = -1.6\nRECOMMENDATION: Cholecalciferol 2000 IU daily + Calcium Citrate 600mg BID. Follow-up DEXA in 24 months."
  },

  // --- Leo's Timeline ---
  {
    id: "evt-leo-01",
    profileId: "profile-leo",
    title: "Pediatric Wellness & Immunization Booster (MMR & Varicella)",
    category: "procedure_vaccine",
    eventDate: "2023-08-15",
    severity: "routine",
    clinicalSummary: "7-year well-child visit. Growth percentile: Height 68th percentile, Weight 62nd percentile. Administered MMR booster Dose #2 and Varicella booster Dose #2. Confirmed strict peanut allergy plan with school.",
    providerName: "Dr. Rachel Green, MD",
    facilityName: "Pediatric Care Associates",
    structuredData: {
      vaccines: ["MMR Booster #2", "Varicella #2"],
      vitals: { height: "48.5 inches", weight: "52 lbs", bp: "96/60 mmHg" },
      allergyActionPlan: "EpiPen 0.15mg Auto-Injector verified for school nurse station"
    },
    sourceDocumentName: "Pediatric_Immunization_Leo_2023.pdf",
    ocrRawText: "CHILD HEALTH RECORD & VACCINATION PROOF\nChild: Leo Jenkins | Age: 7y\nVaccines given today: MMR (Lot #MM-9921), Varicella (Lot #VA-4481)\nAllergy Alert: IgE-mediated Peanut Allergy. Auvi-Q auto-injector prescription refilled."
  }
];

export const INITIAL_BIOMARKER_SERIES = [
  // Arthur's HbA1c progression over 2 years
  { id: "bm-1", profileId: "profile-arthur", markerName: "HbA1c", markerValue: 6.9, unit: "%", recordedDate: "2022-06-10", isAbnormal: true, refLow: 4.0, refHigh: 5.6 },
  { id: "bm-2", profileId: "profile-arthur", markerName: "HbA1c", markerValue: 7.1, unit: "%", recordedDate: "2022-12-14", isAbnormal: true, refLow: 4.0, refHigh: 5.6 },
  { id: "bm-3", profileId: "profile-arthur", markerName: "HbA1c", markerValue: 7.2, unit: "%", recordedDate: "2023-06-08", isAbnormal: true, refLow: 4.0, refHigh: 5.6 },
  { id: "bm-4", profileId: "profile-arthur", markerName: "HbA1c", markerValue: 7.4, unit: "%", recordedDate: "2023-11-15", isAbnormal: true, refLow: 4.0, refHigh: 5.6 },
  { id: "bm-5", profileId: "profile-arthur", markerName: "HbA1c", markerValue: 7.8, unit: "%", recordedDate: "2024-05-18", isAbnormal: true, refLow: 4.0, refHigh: 5.6 },

  // Arthur's Systolic BP progression
  { id: "bm-6", profileId: "profile-arthur", markerName: "Systolic BP", markerValue: 146, unit: "mmHg", recordedDate: "2022-06-10", isAbnormal: true, refLow: 90, refHigh: 120 },
  { id: "bm-7", profileId: "profile-arthur", markerName: "Systolic BP", markerValue: 142, unit: "mmHg", recordedDate: "2022-12-14", isAbnormal: true, refLow: 90, refHigh: 120 },
  { id: "bm-8", profileId: "profile-arthur", markerName: "Systolic BP", markerValue: 138, unit: "mmHg", recordedDate: "2023-06-08", isAbnormal: true, refLow: 90, refHigh: 120 },
  { id: "bm-9", profileId: "profile-arthur", markerName: "Systolic BP", markerValue: 134, unit: "mmHg", recordedDate: "2023-11-15", isAbnormal: true, refLow: 90, refHigh: 120 },
  { id: "bm-10", profileId: "profile-arthur", markerName: "Systolic BP", markerValue: 130, unit: "mmHg", recordedDate: "2024-05-18", isAbnormal: false, refLow: 90, refHigh: 120 },

  // Arthur's eGFR progression (Renal monitoring)
  { id: "bm-11", profileId: "profile-arthur", markerName: "eGFR", markerValue: 66, unit: "mL/min", recordedDate: "2022-06-10", isAbnormal: false, refLow: 60, refHigh: 120 },
  { id: "bm-12", profileId: "profile-arthur", markerName: "eGFR", markerValue: 63, unit: "mL/min", recordedDate: "2023-06-08", isAbnormal: false, refLow: 60, refHigh: 120 },
  { id: "bm-13", profileId: "profile-arthur", markerName: "eGFR", markerValue: 58, unit: "mL/min", recordedDate: "2024-05-18", isAbnormal: true, refLow: 60, refHigh: 120 },

  // Sarah's Total Cholesterol
  { id: "bm-14", profileId: "profile-sarah", markerName: "Total Cholesterol", markerValue: 192, unit: "mg/dL", recordedDate: "2022-04-10", isAbnormal: false, refLow: 120, refHigh: 200 },
  { id: "bm-15", profileId: "profile-sarah", markerName: "Total Cholesterol", markerValue: 184, unit: "mg/dL", recordedDate: "2023-03-22", isAbnormal: false, refLow: 120, refHigh: 200 },
  { id: "bm-16", profileId: "profile-sarah", markerName: "Total Cholesterol", markerValue: 178, unit: "mg/dL", recordedDate: "2024-03-10", isAbnormal: false, refLow: 120, refHigh: 200 }
];

export const INITIAL_CARE_GAPS = [
  {
    id: "gap-1",
    profileId: "profile-arthur",
    guidelineSource: "ADA / USPSTF",
    title: "Diabetic Microalbuminuria Urine Screening Overdue",
    description: "Annual urine albumin-to-creatinine ratio (uACR) test has not been recorded in the past 14 months for Arthur (T2D & CKD Stage 2 patient).",
    urgency: "high",
    status: "open",
    overdueMonths: 2,
    recommendedAction: "Order spot morning urine uACR test to assess nephropathy progression."
  },
  {
    id: "gap-2",
    profileId: "profile-arthur",
    guidelineSource: "CDC / ACIP",
    title: "Pneumococcal (PCV20) Vaccine Booster Due",
    description: "Arthur is 71 years old and has not received the updated 20-valent pneumococcal conjugate vaccine (Prevnar 20).",
    urgency: "moderate",
    status: "open",
    overdueMonths: 8,
    recommendedAction: "Schedule single-dose PCV20 immunisation at local pharmacy or clinic."
  },
  {
    id: "gap-3",
    profileId: "profile-sarah",
    guidelineSource: "USPSTF Guideline",
    title: "Biannual Dental Prophylaxis & Periodontal Check",
    description: "Last preventative dental exam was recorded 9 months ago.",
    urgency: "low",
    status: "open",
    overdueMonths: 3,
    recommendedAction: "Book routine dental clean and oral hygiene examination."
  },
  {
    id: "gap-4",
    profileId: "profile-eleanor",
    guidelineSource: "NOF / USPSTF",
    title: "24-Month Follow-Up DEXA Bone Scan Approaching",
    description: "Eleanor was diagnosed with osteopenia in Jan 2024; repeat bone density scan recommended at 24-month marker.",
    urgency: "moderate",
    status: "scheduled",
    overdueMonths: 0,
    recommendedAction: "Follow-up DEXA scheduled for Jan 2026."
  },
  {
    id: "gap-5",
    profileId: "profile-david",
    guidelineSource: "AHA / USPSTF",
    title: "Routine Lipid Panel Due (24 Months Since Last Check)",
    description: "David's mild hyperlipidemia has not had an updated fasting lipid panel in over 20 months.",
    urgency: "moderate",
    status: "open",
    overdueMonths: 4,
    recommendedAction: "Order fasting lipid panel (Total, HDL, LDL, Triglycerides)."
  }
];
