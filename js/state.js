/**
 * MediThread - Reactive State Store with LocalStorage Persistence
 * Manages User Auth, Doctor-Ready Personal Details, Document Uploads & AI Health Memory Timeline
 */

import { INITIAL_HOUSEHOLD, INITIAL_HEALTH_EVENTS, INITIAL_BIOMARKER_SERIES } from './mockData.js';

const STORAGE_KEY = 'medithread_app_state_v3';
const USERS_STORAGE_KEY = 'medithread_registered_users_v2';

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadInitialState();
  }

  getRegisteredUsers() {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse registered users:', e);
    }
    return [];
  }

  saveRegisteredUsers(users) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving registered users:', e);
    }
  }

  getCleanZeroState() {
    return {
      currentUser: null,
      isAuthenticated: false,
      activeProfileId: null,
      household: {
        id: `house-${Date.now()}`,
        householdName: "Personal Health Hub",
        members: []
      },
      events: [],
      biomarkers: [],
      filters: {
        category: "all",
        status: "all",
        searchQuery: ""
      }
    };
  }

  loadInitialState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isAuthenticated === 'boolean') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state, starting fresh:', e);
    }

    // Default: unauthenticated so new users must sign up first
    return this.getCleanZeroState();
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving state:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('Listener notification error:', e);
      }
    }
  }

  getState() {
    return this.state;
  }

  // ==========================================================================
  // Authentication & Registration with Doctor-Required Personal Details
  // ==========================================================================
  signUp(formData) {
    const users = this.getRegisteredUsers();
    const email = (formData.email || '').toLowerCase().trim();
    
    const existing = users.find(u => u.email.toLowerCase() === email);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: formData.fullName?.trim() || 'Patient',
      email: email,
      password: formData.password || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveRegisteredUsers(users);

    // Format Doctor-Required Personal Details into Primary Patient Profile
    const names = (formData.fullName || 'Patient').trim().split(' ');
    const firstName = names[0] || 'Patient';
    const lastName = names.slice(1).join(' ') || '';

    // Parse allergies list
    let majorAllergies = [];
    if (Array.isArray(formData.allergies)) {
      majorAllergies = formData.allergies;
    } else if (typeof formData.allergies === 'string' && formData.allergies.trim()) {
      majorAllergies = formData.allergies.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Parse chronic conditions
    let chronicConditions = [];
    if (Array.isArray(formData.chronicConditions)) {
      chronicConditions = formData.chronicConditions;
    } else if (typeof formData.chronicConditions === 'string' && formData.chronicConditions.trim()) {
      chronicConditions = formData.chronicConditions.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Parse medications
    let currentMedications = [];
    if (Array.isArray(formData.currentMedications)) {
      currentMedications = formData.currentMedications;
    } else if (typeof formData.currentMedications === 'string' && formData.currentMedications.trim()) {
      currentMedications = formData.currentMedications.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Emergency Contact
    const emergencyContacts = [];
    if (formData.emergencyName || formData.emergencyPhone) {
      emergencyContacts.push({
        name: formData.emergencyName || 'Primary Emergency Contact',
        relationship: formData.emergencyRelation || 'Family',
        phone: formData.emergencyPhone || ''
      });
    }

    const primaryProfile = {
      id: `profile-${Date.now()}`,
      firstName: firstName,
      lastName: lastName,
      relationship: "Self",
      dateOfBirth: formData.dateOfBirth || "1990-01-01",
      age: formData.age || this.calculateAge(formData.dateOfBirth),
      gender: formData.gender || "Not Specified",
      bloodGroup: formData.bloodGroup || "O+",
      phone: formData.phone || "",
      address: formData.address || "",
      primaryDoctor: formData.primaryDoctor || "",
      surgeriesAndImplants: formData.surgeriesAndImplants || "",
      majorAllergies: majorAllergies,
      chronicConditions: chronicConditions,
      currentMedications: currentMedications,
      emergencyContacts: emergencyContacts,
      avatarColor: "#0EA5E9",
      avatarInitials: `${firstName[0] || 'P'}${lastName[0] || 'U'}`
    };

    this.state = {
      currentUser: newUser,
      isAuthenticated: true,
      activeProfileId: primaryProfile.id,
      household: {
        id: `house-${Date.now()}`,
        householdName: `${firstName}'s Health Hub`,
        members: [primaryProfile]
      },
      events: [],
      biomarkers: [],
      filters: {
        category: "all",
        status: "all",
        searchQuery: ""
      }
    };

    this.save();
    return { success: true, user: newUser };
  }

  login({ email, password }) {
    const users = this.getRegisteredUsers();
    const targetEmail = (email || '').toLowerCase().trim();
    const user = users.find(u => u.email.toLowerCase() === targetEmail && u.password === password);
    
    if (!user) {
      return { success: false, error: 'Invalid email or password. Please check your credentials or create a new account.' };
    }

    this.state.currentUser = user;
    this.state.isAuthenticated = true;

    // Check if profile exists; if not create default
    if (!this.state.household || !this.state.household.members || this.state.household.members.length === 0) {
      const names = user.name.split(' ');
      const p = {
        id: `profile-${Date.now()}`,
        firstName: names[0] || 'Patient',
        lastName: names.slice(1).join(' ') || '',
        relationship: "Self",
        dateOfBirth: "1990-01-01",
        age: 34,
        bloodGroup: "O+",
        gender: "Not Specified",
        phone: "",
        address: "",
        majorAllergies: [],
        chronicConditions: [],
        currentMedications: [],
        emergencyContacts: [],
        surgeriesAndImplants: "",
        avatarColor: "#0EA5E9",
        avatarInitials: `${names[0]?.[0] || 'P'}${names[1]?.[0] || 'U'}`
      };
      this.state.household = {
        id: `house-${Date.now()}`,
        householdName: `${names[0]}'s Health Hub`,
        members: [p]
      };
      this.state.activeProfileId = p.id;
    }

    this.save();
    return { success: true, user };
  }

  loadDemoPatient() {
    // Populate rich initial data for demonstration if requested
    this.state = {
      currentUser: {
        id: 'user-demo',
        name: 'Arthur Jenkins',
        email: 'arthur.jenkins@medithread.health',
        role: 'patient_caregiver',
        createdAt: new Date().toISOString()
      },
      isAuthenticated: true,
      activeProfileId: INITIAL_HOUSEHOLD.members[0].id,
      household: JSON.parse(JSON.stringify(INITIAL_HOUSEHOLD)),
      events: JSON.parse(JSON.stringify(INITIAL_HEALTH_EVENTS)),
      biomarkers: JSON.parse(JSON.stringify(INITIAL_BIOMARKER_SERIES)),
      filters: {
        category: "all",
        status: "all",
        searchQuery: ""
      }
    };
    this.save();
  }

  logout() {
    this.state.isAuthenticated = false;
    this.save();
  }

  getActiveProfile() {
    if (!this.state.household?.members || this.state.household.members.length === 0) {
      return null;
    }
    return this.state.household.members.find(m => m.id === this.state.activeProfileId) || this.state.household.members[0] || null;
  }

  updateProfileDetails(profileId, updates) {
    const member = this.state.household?.members?.find(m => m.id === profileId);
    if (member) {
      Object.assign(member, updates);
      if (updates.dateOfBirth) {
        member.age = this.calculateAge(updates.dateOfBirth);
      }
      this.save();
      return member;
    }
    return null;
  }

  calculateAge(dobString) {
    if (!dobString) return '';
    try {
      const dob = new Date(dobString);
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return '';
    }
  }

  // ==========================================================================
  // Report Upload & AI Health Memory Events
  // ==========================================================================
  addReportEvent(eventData) {
    const activeP = this.getActiveProfile();
    const newEvent = {
      id: `evt-${Date.now()}`,
      profileId: activeP?.id || 'profile-default',
      title: eventData.title || "Clinical Report Record",
      category: eventData.category || "lab_report",
      eventDate: eventData.eventDate || new Date().toISOString().split('T')[0],
      severity: eventData.severity || "routine",
      providerName: eventData.providerName || "Diagnostic Medical Center",
      facilityName: eventData.facilityName || "Clinical Laboratory",
      clinicalSummary: eventData.clinicalSummary || "Report parsed and committed to patient AI health memory.",
      sourceDocumentName: eventData.sourceDocumentName || "Medical_Report.pdf",
      fileType: eventData.fileType || "pdf",
      fileDataUrl: eventData.fileDataUrl || null,
      sharePointUrl: eventData.sharePointUrl || null,
      ocrRawText: eventData.ocrRawText || "",
      structuredData: {
        markers: eventData.biomarkers || eventData.structuredData?.markers || [],
        medications: eventData.medications || eventData.structuredData?.medications || [],
        diagnoses: eventData.diagnoses || eventData.structuredData?.diagnoses || [],
        recommendations: eventData.recommendations || eventData.structuredData?.recommendations || []
      },
      createdAt: new Date().toISOString()
    };

    if (!this.state.events) this.state.events = [];
    this.state.events.unshift(newEvent);

    // Also update biomarker series for instant trend tracking
    if (newEvent.structuredData.markers && Array.isArray(newEvent.structuredData.markers)) {
      if (!this.state.biomarkers) this.state.biomarkers = [];
      newEvent.structuredData.markers.forEach(m => {
        if (m.name && !isNaN(parseFloat(m.value))) {
          this.state.biomarkers.push({
            id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            profileId: newEvent.profileId,
            eventId: newEvent.id,
            markerName: m.name,
            markerValue: parseFloat(m.value),
            unit: m.unit || '',
            recordedDate: newEvent.eventDate,
            isAbnormal: Boolean(m.isAbnormal || m.status === 'elevated' || m.status === 'critical_high' || m.status === 'low')
          });
        }
      });
    }

    this.save();
    return newEvent;
  }

  deleteEvent(eventId) {
    this.state.events = (this.state.events || []).filter(e => e.id !== eventId);
    this.state.biomarkers = (this.state.biomarkers || []).filter(b => b.eventId !== eventId);
    this.save();
  }

  getEventsForProfile(profileId = null) {
    const activeP = this.getActiveProfile();
    const targetId = profileId || activeP?.id;
    if (!targetId) return [];

    let list = (this.state.events || []).filter(e => e.profileId === targetId);

    // Apply active filters
    const { category, status, searchQuery } = this.state.filters || {};
    if (category && category !== 'all') {
      list = list.filter(e => e.category === category);
    }
    if (status === 'abnormal') {
      list = list.filter(e => e.severity === 'critical' || e.severity === 'urgent' || e.structuredData?.markers?.some(m => m.isAbnormal));
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.clinicalSummary && e.clinicalSummary.toLowerCase().includes(q)) ||
        (e.providerName && e.providerName.toLowerCase().includes(q)) ||
        (e.facilityName && e.facilityName.toLowerCase().includes(q)) ||
        (e.structuredData?.markers?.some(m => m.name.toLowerCase().includes(q))) ||
        (e.structuredData?.medications?.some(m => m.toLowerCase().includes(q)))
      );
    }

    // Chronological sort: newest first
    return list.sort((a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime());
  }

  setFilters(updates) {
    this.state.filters = { ...this.state.filters, ...updates };
    this.save();
  }
}

export const store = new StateStore();
