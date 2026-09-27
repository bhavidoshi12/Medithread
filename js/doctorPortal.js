/**
 * MediThread - Medical Doctor & Specialist Review Portal Engine
 */

export class DoctorPortalController {
  constructor(store, renderCallback) {
    this.store = store;
    this.renderCallback = renderCallback;
  }

  getClinicalAudit(profile, events, biomarkers) {
    const activeMeds = events.flatMap(e => e.structuredData?.medications || []);
    
    // Drug interaction check heuristics
    const interactions = [];
    const hasMetformin = activeMeds.some(m => m.drug.toLowerCase().includes('metformin'));
    const hasSGLT2 = activeMeds.some(m => m.drug.toLowerCase().includes('empagliflozin') || m.drug.toLowerCase().includes('jardiance'));
    const hasACEI = activeMeds.some(m => m.drug.toLowerCase().includes('lisinopril'));
    const hasNSAID = profile.majorAllergies.some(a => a.toLowerCase().includes('ibuprofen') || a.toLowerCase().includes('nsaid'));

    if (hasMetformin && hasSGLT2) {
      interactions.push({
        pair: "Metformin + Empagliflozin (SGLT2i)",
        severity: "synergistic_favorable",
        note: "Compliant dual therapy. Monitor eGFR regularly for renal dosing thresholds (eGFR < 45 mL/min requires Metformin reduction)."
      });
    }

    if (hasACEI) {
      interactions.push({
        pair: "Lisinopril (ACE Inhibitor)",
        severity: "monitoring_needed",
        note: "Monitor serum potassium (K+) and serum creatinine 2-4 weeks after any dose adjustment."
      });
    }

    if (hasNSAID) {
      interactions.push({
        pair: "Allergy Alert: NSAID / Ibuprofen Avoidance",
        severity: "contraindicated",
        note: "Strictly avoid Ketorolac, Naproxen, or Ibuprofen; potential severe GI or hypersensitivity reaction."
      });
    }

    return {
      activeMeds,
      interactions,
      riskLevel: hasMetformin && hasSGLT2 ? "Optimized Multi-Modal" : "Standard",
      recentLabCount: events.filter(e => e.category === 'lab_report').length
    };
  }

  savePhysicianNotes(notesText) {
    const activeProfile = this.store.getActiveProfile();
    const activeToken = this.store.getState().sharingTokens.find(t => t.profileId === activeProfile.id && !t.isRevoked);
    if (activeToken) {
      this.store.saveDoctorNotes(activeToken.id, notesText);
      return true;
    }
    return false;
  }
}
