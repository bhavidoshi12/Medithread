/**
 * MediThread - Pre-loaded Sample Clinical Documents for AI Studio Testing
 */

export const SAMPLE_DOCUMENTS = [
  {
    id: "doc-cmp-2024",
    title: "Mayo Regional Lab - Comprehensive Metabolic Panel & HbA1c",
    category: "lab_report",
    targetProfileId: "profile-arthur",
    fileType: "pdf",
    fileName: "Mayo_Metabolic_Panel_Sept2024.pdf",
    fileSize: "1.4 MB",
    uploadDate: "2024-09-15",
    rawOCR: `MAYO REGIONAL MEDICAL CENTER - CLINICAL LABORATORY REPORT
PATIENT: Arthur Jenkins | MRN: 998-321-04 | DOB: 1953-04-12 | GENDER: Male
ORDERING PHYSICIAN: Dr. Robert Sterling, MD | COLLECTION DATE: 2024-09-14 08:30 AM

--- BIOCHEMICAL AUDIT ---
TEST NAME                       VALUE       UNIT       REFERENCE INTERVAL    FLAG
Hemoglobin A1c                  8.1         %          4.0 - 5.6             [HIGH]
Estimated Average Glucose       186         mg/dL      70 - 126              [HIGH]
Glucose, Fasting                168         mg/dL      70 - 99               [HIGH]
Blood Urea Nitrogen (BUN)       24          mg/dL      7 - 20                [HIGH]
Serum Creatinine                1.38        mg/dL      0.70 - 1.20           [HIGH]
eGFR (CKD-EPI 2021)             55          mL/min     > 60                  [LOW - CKD G3a]
Sodium                          140         mmol/L     135 - 145             [NORMAL]
Potassium                       4.6         mmol/L     3.5 - 5.0             [NORMAL]
Total Cholesterol               215         mg/dL      125 - 200             [HIGH]
LDL Cholesterol (Calc)          134         mg/dL      < 100                 [HIGH]
HDL Cholesterol                 42          mg/dL      > 40                  [NORMAL]
Triglycerides                   195         mg/dL      < 150                 [HIGH]

--- CLINICAL PATHOLOGY NOTE ---
Findings indicate progressive glycemic excursion (HbA1c 8.1% vs 7.8% in May). Renal filtration shows modest decline to eGFR 55 mL/min. Recommend clinical consultation regarding medication adherence, dual-agent optimization, and dietary compliance audit.`,
    extractedEvent: {
      title: "Comprehensive Metabolic & Lipid Panel (Q3 Follow-up)",
      category: "lab_report",
      eventDate: "2024-09-14",
      severity: "critical",
      clinicalSummary: "Substantial glycemic excursion with HbA1c rising to 8.1% and fasting glucose 168 mg/dL. Renal eGFR 55 mL/min (CKD Stage 3a transition). Elevated LDL (134 mg/dL) and Triglycerides (195 mg/dL).",
      providerName: "Dr. Robert Sterling, MD",
      facilityName: "Mayo Regional Medical Center",
      biomarkers: [
        { name: "HbA1c", value: 8.1, unit: "%", status: "critical_high", ref: "4.0 - 5.6", isAbnormal: true },
        { name: "Fasting Blood Glucose", value: 168, unit: "mg/dL", status: "elevated", ref: "70 - 99", isAbnormal: true },
        { name: "eGFR", value: 55, unit: "mL/min", status: "low", ref: "> 60", isAbnormal: true },
        { name: "Serum Creatinine", value: 1.38, unit: "mg/dL", status: "elevated", ref: "0.7 - 1.2", isAbnormal: true },
        { name: "LDL Cholesterol", value: 134, unit: "mg/dL", status: "elevated", ref: "< 100", isAbnormal: true }
      ]
    }
  },
  {
    id: "doc-rx-cardio",
    title: "Prescription Order - Cardiology & Antidiabetic Adjustment",
    category: "medication",
    targetProfileId: "profile-arthur",
    fileType: "image",
    fileName: "Rx_Order_Cardiology_Sept2024.jpg",
    fileSize: "820 KB",
    uploadDate: "2024-09-18",
    rawOCR: `NORTHWEST HEART & VASCULAR SPECIALISTS
Rx FORM #RX-88491 | DATE: 2024-09-18
PATIENT: Arthur Jenkins (71M) | ALLERGIES: Sulfa Drugs (Severe), Ibuprofen

1. Metformin Extended Release (ER) 1000mg
   Sig: 1 tablet by mouth twice daily with breakfast and dinner.
   Qty: 60 | Refills: 5

2. Empagliflozin (Jardiance) 25mg (Increased from 10mg)
   Sig: 1 tablet by mouth once daily every morning.
   Qty: 30 | Refills: 5

3. Lisinopril 20mg
   Sig: 1 tablet daily in the morning for blood pressure control.
   Qty: 30 | Refills: 5

4. Atorvastatin Calcium 40mg
   Sig: 1 tablet at bedtime.
   Qty: 30 | Refills: 5

Prescriber: Alexander Vance, MD (Cardiology) | NPI: 1049281720`,
    extractedEvent: {
      title: "Cardiometabolic Prescription Protocol & Empagliflozin Escalation",
      category: "medication",
      eventDate: "2024-09-18",
      severity: "monitoring_needed",
      clinicalSummary: "Empagliflozin stepped up to 25mg daily for intensive glycemic control and renal protection following HbA1c elevation. Continued Metformin ER 1000mg BID, Lisinopril 20mg, and Atorvastatin 40mg.",
      providerName: "Dr. Alexander Vance, MD",
      facilityName: "Northwest Heart & Vascular Specialists",
      medications: [
        { drug: "Empagliflozin (Jardiance)", dose: "25 mg", frequency: "Once daily morning", status: "Active (Dose Escalated)" },
        { drug: "Metformin ER", dose: "1000 mg", frequency: "Twice daily with meals", status: "Active" },
        { drug: "Lisinopril", dose: "20 mg", frequency: "Once daily morning", status: "Active" },
        { drug: "Atorvastatin", dose: "40 mg", frequency: "Once daily bedtime", status: "Active" }
      ]
    }
  },
  {
    id: "doc-allergy-sarah",
    title: "Clinical Immunology Report - Comprehensive Allergy & IgE Panel",
    category: "lab_report",
    targetProfileId: "profile-sarah",
    fileType: "pdf",
    fileName: "Immunology_IgE_Sarah_2024.pdf",
    fileSize: "1.1 MB",
    uploadDate: "2024-04-10",
    rawOCR: `ALLERGY & IMMUNOLOGY ASSOCIATES
PATIENT: Sarah Jenkins (38F) | DATE: 2024-04-10
TEST: Quantitative Specific IgE & Skin Prick Protocol

CRITICAL FINDINGS:
- Penicillin Specific IgE (c1): 18.4 kU/L [CLASS 4 - VERY HIGH RISK OF ANAPHYLAXIS]
- Amoxicillin Specific IgE (c2): 14.2 kU/L [CLASS 3 - HIGH]
- Shrimp/Crustacean Tropomyosin (f351): 2.1 kU/L [CLASS 2 - MILD]
- Timothy Grass Pollen: 4.8 kU/L [CLASS 3 - MODERATE]

PHYSICIAN RECOMMENDATION:
Strict lifelong avoidance of all beta-lactam penicillins and cephalosporins. Patient must carry twin-pack Epinephrine Auto-Injector (0.3mg) at all times. Medical alert bracelet recommended.`,
    extractedEvent: {
      title: "Allergy IgE Quantification & Beta-Lactam Anaphylaxis Alert",
      category: "diagnosis",
      eventDate: "2024-04-10",
      severity: "critical",
      clinicalSummary: "Class 4 Penicillin IgE confirmed with high anaphylactic shock potential. Strict beta-lactam avoidance and dual EpiPen carriage verified.",
      providerName: "Dr. Rachel Thorne, MD (Immunology)",
      facilityName: "Allergy & Immunology Associates",
      biomarkers: [
        { name: "Penicillin IgE", value: 18.4, unit: "kU/L", status: "critical_high", ref: "< 0.35", isAbnormal: true },
        { name: "Amoxicillin IgE", value: 14.2, unit: "kU/L", status: "critical_high", ref: "< 0.35", isAbnormal: true }
      ]
    }
  }
];
