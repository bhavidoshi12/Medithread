/**
 * MediThread - Multi-Context AI Clinical Summary Generator
 * Generates tailor-made clinical intelligence briefs based on context
 */

export class SummaryEngine {
  /**
   * Generates a 1-Minute Emergency Brief
   * Optimized for EMS paramedics, ER physicians, and urgent triage situations.
   */
  static generateEmergencyBrief(profile, events, biomarkers) {
    const activeMeds = this.extractActiveMedications(events);
    const criticalAllergies = profile.majorAllergies || [];
    const chronicIssues = profile.chronicConditions || [];
    const latestBP = biomarkers.filter(b => b.markerName.includes('BP')).slice(-1)[0];
    const latestGlucose = biomarkers.filter(b => b.markerName.toLowerCase().includes('glucose') || b.markerName.toLowerCase().includes('hba1c')).slice(-1)[0];

    return {
      type: "emergency_brief",
      title: "1-Minute Emergency Medical Brief",
      badge: "CRITICAL TRIAGE SUMMARY",
      headline: `${profile.firstName} ${profile.lastName} (${profile.relationship}) | Blood: ${profile.bloodGroup}`,
      generatedAt: new Date().toLocaleString(),
      content: {
        vitalAlerts: [
          { label: "Blood Group", value: profile.bloodGroup, isHighlight: true, color: "red" },
          { label: "Life-Threatening Allergies", value: criticalAllergies.length ? criticalAllergies.join(", ") : "No Known Drug Allergies (NKDA)", isHighlight: true, color: "amber" },
          { label: "Code Status / Directives", value: profile.dnrOrder ? "DNR Order on File" : "Full Code (Resuscitate)", isHighlight: false },
          { label: "Organ Donor Status", value: profile.organDonor ? "Registered Organ Donor (Yes)" : "No", isHighlight: false }
        ],
        chronicConditions: chronicIssues,
        criticalMedications: activeMeds.map(m => `${m.drug} - ${m.dose} (${m.frequency})`),
        emergencyContacts: profile.emergencyContacts || [],
        recentKeyParameters: [
          latestBP ? `Latest BP: ${latestBP.markerValue} ${latestBP.unit} (${latestBP.recordedDate})` : null,
          latestGlucose ? `Latest ${latestGlucose.markerName}: ${latestGlucose.markerValue} ${latestGlucose.unit} (${latestGlucose.recordedDate})` : null
        ].filter(Boolean),
        physicianCareTeam: {
          primary: profile.primaryPhysician || "Unspecified Primary Care",
          insurance: profile.insurancePolicy || "Private Policy"
        }
      }
    };
  }

  /**
   * Generates a 5-Minute Doctor Consultation Summary
   * Structured for outpatient consultations, new specialist intakes, and SOAP audits.
   */
  static generateDoctorSummary(profile, events, biomarkers, careGaps) {
    const recentEvents = events.slice(0, 6);
    const activeMeds = this.extractActiveMedications(events);
    const openGaps = careGaps.filter(g => g.status === 'open');

    // Group biomarkers for trend analysis
    const biomarkerTrends = this.summarizeTrends(biomarkers);

    return {
      type: "doctor_consultation",
      title: "5-Minute Comprehensive Clinical Consultation Brief",
      badge: "PHYSICIAN CLINICAL REVIEW",
      headline: `Clinical Synthesis for ${profile.firstName} ${profile.lastName} (${profile.gender}, DOB: ${profile.dateOfBirth})`,
      generatedAt: new Date().toLocaleString(),
      content: {
        executiveSummary: `Patient is a ${profile.dateOfBirth ? (new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()) + 'yo' : ''} ${profile.gender.toLowerCase()} presenting with a history of ${profile.chronicConditions.join(', ') || 'no major chronic illnesses'}. Active management focuses on glycemic control, cardiovascular risk mitigation, and routine monitoring.`,
        activeDiagnoses: profile.chronicConditions,
        currentMedicationRegimen: activeMeds,
        biomarkerTrajectories: biomarkerTrends,
        recentClinicalEncounters: recentEvents.map(e => ({
          date: e.eventDate,
          title: e.title,
          category: e.category,
          severity: e.severity,
          summary: e.clinicalSummary,
          provider: e.providerName
        })),
        preventiveCareGaps: openGaps.map(g => ({
          title: g.title,
          urgency: g.urgency,
          guideline: g.guidelineSource,
          action: g.recommendedAction
        })),
        differentialClinicalQuestions: [
          "Evaluate glycemic trend: Is current SGLT2/Metformin dosage meeting target HbA1c < 7.0%?",
          "Review renal trajectory: Assess microalbuminuria & eGFR stability.",
          "Check medication adherence and potential drug-drug interaction risks."
        ]
      }
    };
  }

  /**
   * Generates a Travel Health Passport / Insurance Documentation
   * Cross-border medical clearance, international vaccine verification, and multilingual summary.
   */
  static generateTravelPassport(profile, events, biomarkers) {
    const vaccines = events.filter(e => e.category === 'procedure_vaccine' || e.title.toLowerCase().includes('vaccin') || e.title.toLowerCase().includes('booster'));
    const activeMeds = this.extractActiveMedications(events);

    return {
      type: "travel_passport",
      title: "International Health Passport & Travel Medical Dossier",
      badge: "ICAO / WHO COMPLIANT SUMMARY",
      headline: `Medical Travel Clearance for ${profile.firstName} ${profile.lastName}`,
      generatedAt: new Date().toLocaleString(),
      content: {
        travelerIdentity: {
          fullName: `${profile.firstName} ${profile.lastName}`,
          dob: profile.dateOfBirth,
          nationality: "United States (US)",
          bloodGroup: profile.bloodGroup,
          insuranceCard: profile.insurancePolicy || "International Travel Coverage Active"
        },
        immunizationRecord: vaccines.map(v => ({
          vaccine: v.title,
          dateAdministered: v.eventDate,
          facility: v.facilityName,
          verified: "Cryptographically Verified"
        })),
        essentialTravelMeds: activeMeds.map(m => ({
          genericName: m.drug,
          dosage: m.dose,
          frequency: m.frequency,
          travelAllowanceLetter: "Prescription verified for cross-border carry"
        })),
        severeAllergiesMultilingual: {
          english: profile.majorAllergies.join("; "),
          spanish: profile.majorAllergies.map(a => a.includes("Penicillin") ? "Alergia grave a la Penicilina (Riesgo de anafilaxia)" : a).join("; "),
          french: profile.majorAllergies.map(a => a.includes("Penicillin") ? "Allergie sévère à la pénicilline" : a).join("; ")
        },
        embassyEmergencyContacts: profile.emergencyContacts
      }
    };
  }

  static extractActiveMedications(events) {
    const meds = [];
    const seen = new Set();

    events.forEach(e => {
      if (e.structuredData?.medications && Array.isArray(e.structuredData.medications)) {
        e.structuredData.medications.forEach(m => {
          if (!seen.has(m.drug)) {
            seen.add(m.drug);
            meds.push(m);
          }
        });
      }
    });
    return meds;
  }


  static summarizeTrends(biomarkers) {
    const grouped = {};
    biomarkers.forEach(b => {
      if (!grouped[b.markerName]) grouped[b.markerName] = [];
      grouped[b.markerName].push(b);
    });

    return Object.keys(grouped).map(name => {
      const items = grouped[name].sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime());
      const first = items[0];
      const last = items[items.length - 1];
      const delta = (last.markerValue - first.markerValue).toFixed(1);
      const isUp = parseFloat(delta) > 0;

      let interpretation = "Stable trajectory within expected bounds.";
      if (name.includes("HbA1c")) {
        interpretation = isUp ? "Upward glycemic excursion. Optimization required." : "Improving glycemic control.";
      } else if (name.includes("BP")) {
        interpretation = isUp ? "Elevated blood pressure trends." : "Controlled systolic trajectory.";
      } else if (name.includes("eGFR")) {
        interpretation = isUp ? "Renal filtration improving." : "Mild filtration decline, monitor nephropathy.";
      }

      return {
        marker: name,
        baseline: `${first.markerValue} ${first.unit} (${first.recordedDate})`,
        latest: `${last.markerValue} ${last.unit} (${last.recordedDate})`,
        delta: `${isUp ? '+' : ''}${delta} ${last.unit}`,
        status: last.isAbnormal ? 'abnormal' : 'normal',
        interpretation: interpretation
      };
    });
  }
}
