/**
 * MediThread - Preventive Health Gap Detection Engine
 * Uses clinical rules (USPSTF, ADA, CDC, AAP) to scan the lifelong timeline and flag care gaps.
 */

export class PreventiveEngine {
  static evaluateCareGaps(profile = {}, events = [], biomarkers = []) {
    if (!profile || !profile.id) return [];
    const gaps = [];
    const now = new Date();
    const age = profile.dateOfBirth ? (now.getFullYear() - new Date(profile.dateOfBirth).getFullYear()) : 30;
    const chronic = profile.chronicConditions || [];
    const isDiabetic = chronic.some(c => c.toLowerCase().includes('diabetes'));
    const isHypertensive = chronic.some(c => c.toLowerCase().includes('hypertension'));
    const hasKidneyDisease = chronic.some(c => c.toLowerCase().includes('kidney') || c.toLowerCase().includes('ckd'));


    // 1. Glycemic Screening Gap (ADA)
    if (isDiabetic) {
      const hba1cRecords = biomarkers.filter(b => b.markerName.toLowerCase().includes('hba1c'));
      const lastHbA1c = hba1cRecords.sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime())[0];
      
      const monthsSince = lastHbA1c ? this.getMonthsDifference(new Date(lastHbA1c.recordedDate), now) : 12;
      if (monthsSince >= 6) {
        gaps.push({
          id: `gap-hba1c-${Date.now()}`,
          guidelineSource: "ADA Guidelines 2024",
          title: `Overdue HbA1c Glycemic Test (${monthsSince} Months Elapsed)`,
          description: `Patients with Type 2 Diabetes require quarterly to semi-annual HbA1c audits. Last test was recorded on ${lastHbA1c?.recordedDate || 'Over a year ago'}.`,
          urgency: monthsSince > 9 ? "critical" : "high",
          status: "open",
          overdueMonths: monthsSince - 6,
          recommendedAction: "Order HbA1c blood draw with comprehensive metabolic profile."
        });
      }
    }

    // 2. Microalbuminuria / Renal Audit Gap (ADA / KDIGO)
    if (isDiabetic || hasKidneyDisease) {
      const renalEvents = events.filter(e => e.title.toLowerCase().includes('microalbumin') || e.title.toLowerCase().includes('urine') || e.title.toLowerCase().includes('uacr'));
      if (renalEvents.length === 0) {
        gaps.push({
          id: `gap-renal-${Date.now()}`,
          guidelineSource: "KDIGO / ADA Renal Protocol",
          title: "Annual Urine Albumin-to-Creatinine Ratio (uACR) Overdue",
          description: "Crucial early detector for diabetic nephropathy progression. No recorded screening within the last 12 months.",
          urgency: "high",
          status: "open",
          overdueMonths: 2,
          recommendedAction: "Collect first morning spot urine specimen for uACR ratio."
        });
      }
    }

    // 3. Lipid Profile Audit (AHA / USPSTF)
    if (age >= 40 || profile.chronicConditions.some(c => c.toLowerCase().includes('lipid'))) {
      const lipidEvents = events.filter(e => e.title.toLowerCase().includes('lipid') || e.title.toLowerCase().includes('cholesterol'));
      const lastLipid = lipidEvents.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())[0];
      const monthsSince = lastLipid ? this.getMonthsDifference(new Date(lastLipid.eventDate), now) : 24;

      if (monthsSince >= 12) {
        gaps.push({
          id: `gap-lipid-${Date.now()}`,
          guidelineSource: "AHA / USPSTF Cardiovascular Risk",
          title: `Routine Fasting Lipid Panel Recommended (${monthsSince} Mos Since Last)`,
          description: `Cardiovascular risk stratification requires updated LDL/HDL/Triglyceride monitoring.`,
          urgency: "moderate",
          status: "open",
          overdueMonths: monthsSince - 12,
          recommendedAction: "Order fasting lipid panel profile."
        });
      }
    }

    // 4. Senior Immunizations (CDC ACIP)
    if (age >= 65) {
      const pneuVaccines = events.filter(e => e.title.toLowerCase().includes('pneumococcal') || e.title.toLowerCase().includes('prevnar') || e.title.toLowerCase().includes('pcv20'));
      if (pneuVaccines.length === 0) {
        gaps.push({
          id: `gap-pneu-${Date.now()}`,
          guidelineSource: "CDC ACIP Immunization Standard",
          title: "Pneumococcal Conjugate Vaccine (PCV20 / Prevnar 20) Due",
          description: "All adults aged 65 and older are recommended to receive a single dose of PCV20 for invasive pneumococcal disease prevention.",
          urgency: "moderate",
          status: "open",
          overdueMonths: 6,
          recommendedAction: "Schedule PCV20 injection at community clinic or primary physician visit."
        });
      }

      const shinglesVaccines = events.filter(e => e.title.toLowerCase().includes('shingrix') || e.title.toLowerCase().includes('shingles'));
      if (shinglesVaccines.length === 0) {
        gaps.push({
          id: `gap-shingles-${Date.now()}`,
          guidelineSource: "CDC ACIP Shingles Recommendation",
          title: "Recombinant Zoster Vaccine (Shingrix 2-Dose Series) Missing",
          description: "Preventative shingles vaccine is strongly advised for adults 50+ to protect against postherpetic neuralgia.",
          urgency: "moderate",
          status: "open",
          overdueMonths: 4,
          recommendedAction: "Administer Dose 1 of 2 Shingrix series."
        });
      }
    }

    // 5. Pediatric Immunizations (AAP / CDC)
    if (age <= 18) {
      const fluEvents = events.filter(e => e.title.toLowerCase().includes('influenza') || e.title.toLowerCase().includes('flu'));
      if (fluEvents.length === 0) {
        gaps.push({
          id: `gap-flu-${Date.now()}`,
          guidelineSource: "AAP Pediatric Immunization Schedule",
          title: "Annual Seasonal Influenza Vaccination Recommended",
          description: "Annual flu vaccine recommended for all pediatric and school-age children.",
          urgency: "low",
          status: "open",
          overdueMonths: 1,
          recommendedAction: "Administer quadrivalent pediatric influenza nasal spray or injection."
        });
      }
    }

    return gaps;
  }

  static getMonthsDifference(d1, d2) {
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return Math.max(0, months);
  }
}
