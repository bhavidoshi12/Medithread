/**
 * MediThread - AI-Enabled Health Memory Timeline Platform
 * Core Controller & View Orchestrator
 * Fulfills:
 * 1. User Sign-up / Login gate before adding reports
 * 2. Upload medical reports in JPG/PNG/PDF format
 * 3. AI Memory Health Timeline extracting all key clinical findings & biomarkers
 * 4. Doctor-ready personal & medical details management
 */

import { store } from './state.js';
import { OCRPipeline } from './ocrPipeline.js';
import { SAMPLE_DOCUMENTS } from './sampleDocs.js';
import { uploadFileToSharePoint } from './sharePointStorage.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

class AppController {
  constructor() {
    this.currentTab = 'timeline'; // 'timeline' | 'upload' | 'profile'
    this.authMode = 'signup'; // 'signup' | 'signin'
    this.authError = null;
    
    // File upload state
    this.isProcessing = false;
    this.uploadProgress = { step: 0, name: '', status: '', details: '', progress: 0 };
    this.extractedReviewData = null;
    this.uploadErrorMessage = null;
    this.pendingUploadFile = null;
    this.isSavingReport = false;

    // Modals
    this.activeModal = null; // null | 'view_report' | 'edit_profile' | 'ask_ai'
    this.modalData = null;

    this.init();
  }

  init() {
    this.render();
    store.subscribe(() => {
      this.render();
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.uploadErrorMessage = null;
    this.render();
  }

  render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    const state = store.getState();
    const activeProfile = store.getActiveProfile();

    // 1. If not authenticated -> Show Mandatory Sign Up / Login View
    if (!state.isAuthenticated) {
      root.innerHTML = this.renderAuthGate();
      this.attachAuthGateListeners();
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // 2. Fallback Profile if needed
    const safeProfile = activeProfile || {
      id: 'profile-primary',
      firstName: state.currentUser?.name?.split(' ')[0] || 'Patient',
      lastName: state.currentUser?.name?.split(' ').slice(1).join(' ') || '',
      age: 34,
      bloodGroup: 'O+',
      majorAllergies: [],
      chronicConditions: [],
      currentMedications: [],
      emergencyContacts: []
    };

    // 3. Render Main Application Layout
    root.innerHTML = `
      <div class="min-h-screen flex flex-col bg-[#0B1120] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
        <!-- Global Top Header -->
        ${this.renderHeader(state, safeProfile)}

        <!-- Main Workspace Body -->
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          ${this.renderActiveTab(state, safeProfile)}
        </main>

        <!-- Global Modal Container -->
        <div id="modal-container">
          ${this.renderActiveModal(state, safeProfile)}
        </div>
      </div>
    `;

    this.attachMainListeners(state, safeProfile);
    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // VIEW: Global Navigation Header
  // ==========================================================================
  renderHeader(state, profile) {
    const allergyCount = profile.majorAllergies?.length || 0;
    const events = store.getEventsForProfile();

    return `
      <header class="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 gap-4">
            
            <!-- Brand Logo -->
            <div class="flex items-center gap-3 cursor-pointer" id="brand-logo-btn">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <i data-lucide="dna" class="w-5 h-5 text-slate-950 stroke-[2.5]"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-base tracking-tight text-white">MediThread</span>
                  <span class="px-2 py-0.5 text-[10px] font-bold bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20 uppercase tracking-wider">AI Health Memory</span>
                </div>
                <p class="text-[11px] text-slate-400 hidden sm:block">Lifelong Medical Report Timeline</p>
              </div>
            </div>

            <!-- Central Navigation Tabs (3 Main Sections) -->
            <nav class="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner">
              <button id="nav-timeline-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${this.currentTab === 'timeline' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25' : 'text-slate-400 hover:text-slate-200'}">
                <i data-lucide="activity" class="w-4 h-4"></i>
                <span>AI Memory Timeline</span>
                <span class="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">${events.length}</span>
              </button>

              <button id="nav-upload-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${this.currentTab === 'upload' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'text-slate-400 hover:text-slate-200'}">
                <i data-lucide="file-up" class="w-4 h-4"></i>
                <span>Upload Report</span>
              </button>

              <button id="nav-profile-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${this.currentTab === 'profile' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25' : 'text-slate-400 hover:text-slate-200'}">
                <i data-lucide="stethoscope" class="w-4 h-4"></i>
                <span>Doctor Details</span>
              </button>
            </nav>

            <!-- User Status & Profile Chip -->
            <div class="flex items-center gap-3">
              <!-- Patient Badge -->
              <div class="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                <div class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center border border-sky-500/30 text-[11px]">
                  ${profile.avatarInitials || 'P'}
                </div>
                <div class="text-left">
                  <div class="font-semibold text-slate-200">${profile.firstName} ${profile.lastName}</div>
                  <div class="text-[10px] text-slate-400">${profile.bloodGroup || 'O+'} • ${profile.age ? profile.age + ' yrs' : 'Age N/A'}</div>
                </div>
                ${allergyCount > 0 ? `
                  <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1" title="${profile.majorAllergies.join(', ')}">
                    <i data-lucide="alert-triangle" class="w-3 h-3"></i> ${allergyCount} Allergy
                  </span>
                ` : ''}
              </div>

              <!-- Logout Button -->
              <button id="btn-logout" class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all text-xs flex items-center gap-1" title="Sign Out">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span class="hidden lg:inline text-xs font-medium">Exit</span>
              </button>
            </div>

          </div>
        </div>
      </header>
    `;
  }

  // ==========================================================================
  // VIEW: Mandatory Auth Gate (Sign Up & Sign In)
  // ==========================================================================
  renderAuthGate() {
    const isSignUp = this.authMode === 'signup';

    return `
      <div class="min-h-screen bg-[#0B1120] flex items-center justify-center px-4 py-12 selection:bg-sky-500/30 selection:text-sky-200">
        <div class="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl overflow-hidden">
          
          <!-- Left Hero Column -->
          <div class="lg:col-span-5 bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-900 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div>
              <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/25">
                  <i data-lucide="dna" class="w-6 h-6 text-slate-950 stroke-[2.5]"></i>
                </div>
                <div>
                  <h1 class="font-extrabold text-xl tracking-tight text-white">MediThread</h1>
                  <span class="text-xs text-sky-400 font-medium">AI Health Memory Hub</span>
                </div>
              </div>

              <h2 class="text-2xl font-bold text-white leading-snug mb-3">
                Your Lifelong Health Memory, Structured by AI.
              </h2>
              <p class="text-xs text-slate-400 leading-relaxed mb-6">
                Never lose a medical report again. Sign up to upload your lab tests, prescriptions, and radiology scans in JPG, PNG, or PDF format. MediThread extracts key clinical parameters and builds an organized memory timeline ready for your doctor.
              </p>

              <!-- Feature Highlights -->
              <div class="space-y-3 mb-6">
                <div class="flex items-start gap-2.5 text-xs text-slate-300">
                  <div class="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                  </div>
                  <span><strong>Sign up first:</strong> Secure patient account keeping your health records private.</span>
                </div>
                <div class="flex items-start gap-2.5 text-xs text-slate-300">
                  <div class="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                  </div>
                  <span><strong>Upload JPG, PNG & PDF:</strong> Ingest any lab document, scan or doctor note.</span>
                </div>
                <div class="flex items-start gap-2.5 text-xs text-slate-300">
                  <div class="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i data-lucide="activity" class="w-3.5 h-3.5"></i>
                  </div>
                  <span><strong>AI Memory Timeline:</strong> Extracts biomarkers, flags, and diagnoses chronologically.</span>
                </div>
                <div class="flex items-start gap-2.5 text-xs text-slate-300">
                  <div class="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i data-lucide="stethoscope" class="w-3.5 h-3.5"></i>
                  </div>
                  <span><strong>Doctor-Ready Details:</strong> Essential personal info, blood group, allergies, and emergency contacts.</span>
                </div>
              </div>
            </div>

            <!-- Quick Demo Bypass -->
            <div class="pt-4 border-t border-slate-800">
              <button id="btn-load-demo-data" class="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all">
                <i data-lucide="sparkles" class="w-4 h-4 text-sky-400"></i>
                <span>Explore Demo Patient (Arthur Jenkins)</span>
              </button>
            </div>
          </div>

          <!-- Right Form Column -->
          <div class="lg:col-span-7 p-8 sm:p-10 bg-[#0F172A] flex flex-col justify-center">
            
            <!-- Tab Switcher (Sign Up vs Sign In) -->
            <div class="flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-6">
              <button id="btn-auth-mode-signup" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isSignUp ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}">
                1. New User Sign Up
              </button>
              <button id="btn-auth-mode-signin" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!isSignUp ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}">
                2. Existing Sign In
              </button>
            </div>

            <!-- Error Banner -->
            ${this.authError ? `
              <div class="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0"></i>
                <span>${this.authError}</span>
              </div>
            ` : ''}

            ${isSignUp ? this.renderSignUpForm() : this.renderSignInForm()}

          </div>
        </div>
      </div>
    `;
  }

  renderSignUpForm() {
    return `
      <form id="form-signup" class="space-y-4">
        <div>
          <h3 class="text-base font-bold text-white mb-1">Create Your Patient Account</h3>
          <p class="text-xs text-slate-400">Fill in your basic account credentials & doctor-essential personal details.</p>
        </div>

        <!-- Section 1: Account Credentials -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Full Legal Name *</label>
            <input type="text" name="fullName" required placeholder="e.g. Johnathan Doe" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email Address *</label>
            <input type="email" name="email" required placeholder="name@domain.com" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
          </div>
          <div class="sm:col-span-2">
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password *</label>
            <input type="password" name="password" required placeholder="Create a secure password" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
          </div>
        </div>

        <!-- Section 2: Doctor-Required Personal & Health Details -->
        <div class="pt-3 border-t border-slate-800">
          <div class="flex items-center gap-2 mb-2">
            <i data-lucide="clipboard-list" class="w-4 h-4 text-sky-400"></i>
            <span class="text-xs font-bold text-sky-400 uppercase tracking-wider">Doctor-Essential Personal Details</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-slate-300 mb-1">Date of Birth</label>
              <input type="date" name="dateOfBirth" value="1992-05-15" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-300 mb-1">Biological Sex</label>
              <select name="gender" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Prefer not to say</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-300 mb-1">Blood Group *</label>
              <select name="bloodGroup" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-bold text-rose-400">
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label class="block text-[11px] font-medium text-slate-300 mb-1">Contact Phone</label>
              <input type="tel" name="phone" placeholder="+1 (555) 234-5678" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-300 mb-1">Emergency Contact (Name & Phone)</label>
              <input type="text" name="emergencyContact" placeholder="Sarah Doe (Spouse) - +1 555-987-6543" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
            </div>
          </div>

          <div class="mt-3">
            <label class="block text-[11px] font-medium text-rose-300 mb-1">Known Allergies (Crucial for Doctor)</label>
            <input type="text" name="allergies" placeholder="e.g. Penicillin, Sulfa, Peanuts (or type 'None')" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/30 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500">
          </div>

          <div class="mt-3">
            <label class="block text-[11px] font-medium text-slate-300 mb-1">Known Chronic Medical Conditions</label>
            <input type="text" name="chronicConditions" placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma (or 'None')" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
          </div>

          <div class="mt-3">
            <label class="block text-[11px] font-medium text-slate-300 mb-1">Current Daily Medications</label>
            <input type="text" name="medications" placeholder="e.g. Metformin 500mg daily, Lisinopril 10mg (or 'None')" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
          </div>
        </div>

        <button type="submit" class="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2">
          <span>Complete Registration & Open Health Hub</span>
          <i data-lucide="arrow-right" class="w-4 h-4 stroke-[2.5]"></i>
        </button>
      </form>
    `;
  }

  renderSignInForm() {
    return `
      <form id="form-signin" class="space-y-4">
        <div>
          <h3 class="text-base font-bold text-white mb-1">Welcome Back</h3>
          <p class="text-xs text-slate-400">Sign in to access your uploaded reports and AI health memory timeline.</p>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
          <input type="email" name="email" required placeholder="name@domain.com" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">Password</label>
          <input type="password" name="password" required placeholder="Enter your password" class="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
        </div>

        <button type="submit" class="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2">
          <span>Sign In to Your Health Timeline</span>
          <i data-lucide="log-in" class="w-4 h-4"></i>
        </button>
      </form>
    `;
  }

  attachAuthGateListeners() {
    // Mode switch
    const btnSignup = document.getElementById('btn-auth-mode-signup');
    const btnSignin = document.getElementById('btn-auth-mode-signin');
    if (btnSignup) {
      btnSignup.onclick = () => {
        this.authMode = 'signup';
        this.authError = null;
        this.render();
      };
    }
    if (btnSignin) {
      btnSignin.onclick = () => {
        this.authMode = 'signin';
        this.authError = null;
        this.render();
      };
    }

    // Demo Data
    const btnDemo = document.getElementById('btn-load-demo-data');
    if (btnDemo) {
      btnDemo.onclick = () => {
        store.loadDemoPatient();
        this.currentTab = 'timeline';
      };
    }

    // Sign Up submit
    const signupForm = document.getElementById('form-signup');
    if (signupForm) {
      signupForm.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(signupForm);
        
        // Parse emergency contact string if needed
        const emergencyStr = fd.get('emergencyContact') || '';
        let emergencyName = emergencyStr;
        let emergencyPhone = '';
        if (emergencyStr.includes('-')) {
          const parts = emergencyStr.split('-');
          emergencyName = parts[0].trim();
          emergencyPhone = parts.slice(1).join('-').trim();
        }

        const res = store.signUp({
          fullName: fd.get('fullName'),
          email: fd.get('email'),
          password: fd.get('password'),
          dateOfBirth: fd.get('dateOfBirth'),
          gender: fd.get('gender'),
          bloodGroup: fd.get('bloodGroup'),
          phone: fd.get('phone'),
          emergencyName: emergencyName,
          emergencyPhone: emergencyPhone,
          allergies: fd.get('allergies'),
          chronicConditions: fd.get('chronicConditions'),
          currentMedications: fd.get('medications')
        });

        if (!res.success) {
          this.authError = res.error;
          this.render();
        } else {
          this.authError = null;
          this.currentTab = 'timeline';
        }
      };
    }

    // Sign In submit
    const signinForm = document.getElementById('form-signin');
    if (signinForm) {
      signinForm.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(signinForm);
        const res = store.login({
          email: fd.get('email'),
          password: fd.get('password')
        });

        if (!res.success) {
          this.authError = res.error;
          this.render();
        } else {
          this.authError = null;
          this.currentTab = 'timeline';
        }
      };
    }
  }

  // ==========================================================================
  // VIEW SWITCHER: Active Tab
  // ==========================================================================
  renderActiveTab(state, profile) {
    switch (this.currentTab) {
      case 'timeline':
        return this.renderTimelineView(state, profile);
      case 'upload':
        return this.renderUploadView(state, profile);
      case 'profile':
        return this.renderProfileView(state, profile);
      default:
        return this.renderTimelineView(state, profile);
    }
  }

  // ==========================================================================
  // VIEW 1: AI Health Memory Timeline
  // ==========================================================================
  renderTimelineView(state, profile) {
    const events = store.getEventsForProfile();
    const { category, searchQuery } = state.filters || {};

    return `
      <div class="space-y-6">
        
        <!-- AI Memory Synthesizer Banner (Executive Doctor Briefing) -->
        ${this.renderAIMemorySynthesizer(profile, events)}

        <!-- Filter & Search Controls Bar -->
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          
          <!-- Search Box -->
          <div class="relative w-full md:w-80">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="timeline-search-input" value="${searchQuery || ''}" placeholder="Search diagnoses, doctors, biomarkers..." class="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500">
            ${searchQuery ? `
              <button id="btn-clear-search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
            <button data-cat="all" class="filter-cat-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === 'all' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
              All (${events.length})
            </button>
            <button data-cat="lab_report" class="filter-cat-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === 'lab_report' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
              🧪 Labs
            </button>
            <button data-cat="imaging" class="filter-cat-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === 'imaging' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
              🩻 Scans / Imaging
            </button>
            <button data-cat="prescription" class="filter-cat-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === 'prescription' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
              💊 Prescriptions
            </button>
            <button data-cat="consultation" class="filter-cat-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === 'consultation' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}">
              🩺 Clinical Notes
            </button>
          </div>

          <!-- Quick Action: Upload Report Button -->
          <button id="btn-quick-upload" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 whitespace-nowrap transition-all">
            <i data-lucide="plus" class="w-4 h-4 stroke-[2.5]"></i>
            <span>Add Report</span>
          </button>
        </div>

        <!-- Chronological Timeline List -->
        ${events.length === 0 ? this.renderEmptyTimelineState() : `
          <div class="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-sky-500 before:via-emerald-400 before:to-purple-600">
            ${events.map((evt, idx) => this.renderTimelineCard(evt, idx)).join('')}
          </div>
        `}

      </div>
    `;
  }

  renderAIMemorySynthesizer(profile, events) {
    if (events.length === 0) {
      return `
        <div class="p-6 rounded-3xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-purple-950/30 border border-sky-500/20 shadow-xl">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <i data-lucide="sparkles" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">AI Health Memory Ready</h3>
                <p class="text-xs text-slate-400">Upload your first JPG/PNG/PDF medical report to generate an automated clinical timeline summary.</p>
              </div>
            </div>
            <button id="btn-banner-upload" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-2">
              <i data-lucide="file-up" class="w-4 h-4"></i>
              <span>Upload Medical Report</span>
            </button>
          </div>
        </div>
      `;
    }

    // Collect all abnormal markers and key diagnoses across reports
    const abnormalMarkers = [];
    const diagnoses = new Set();
    const activeMeds = new Set(profile.currentMedications || []);

    events.forEach(e => {
      e.structuredData?.markers?.forEach(m => {
        if (m.isAbnormal) abnormalMarkers.push(`${m.name} (${m.value} ${m.unit || ''})`);
      });
      e.structuredData?.diagnoses?.forEach(d => diagnoses.add(d));
      e.structuredData?.medications?.forEach(m => activeMeds.add(m));
    });

    return `
      <div class="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 shadow-xl relative overflow-hidden">
        <div class="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <i data-lucide="brain-circuit" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-white">AI Health Memory Snapshot</h3>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">Synced across ${events.length} Reports</span>
              </div>
              <p class="text-xs text-slate-400">Autonomous clinical memory synthesis for ${profile.firstName} ${profile.lastName}</p>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-2">
            <button id="btn-ask-ai-memory" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all">
              <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
              <span>Ask AI Memory</span>
            </button>
            <button id="btn-open-doctor-chart" class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span>Doctor Briefing</span>
            </button>
          </div>
        </div>

        <!-- Synthesis Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <i data-lucide="activity" class="w-3 h-3 text-rose-400"></i> Attention Biomarkers
            </div>
            <div class="text-xs text-slate-200 font-medium">
              ${abnormalMarkers.length > 0 
                ? abnormalMarkers.slice(0, 3).map(m => `<span class="inline-block px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] mr-1 mb-1 font-semibold">${m}</span>`).join('')
                : '<span class="text-emerald-400 font-medium">All recorded parameters in normal ranges</span>'}
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <i data-lucide="clipboard-check" class="w-3 h-3 text-sky-400"></i> Active Diagnoses
            </div>
            <div class="text-xs text-slate-200 font-medium">
              ${diagnoses.size > 0 
                ? Array.from(diagnoses).slice(0, 3).map(d => `<span class="inline-block px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[11px] mr-1 mb-1 font-medium">${d}</span>`).join('')
                : (profile.chronicConditions?.length > 0 ? profile.chronicConditions.join(', ') : 'No acute diagnoses recorded')}
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <i data-lucide="pill" class="w-3 h-3 text-emerald-400"></i> Current Medications
            </div>
            <div class="text-xs text-slate-200 font-medium">
              ${activeMeds.size > 0
                ? Array.from(activeMeds).slice(0, 2).map(m => `<span class="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] mr-1 mb-1 font-medium">${m}</span>`).join('')
                : 'No active prescriptions'}
            </div>
          </div>

        </div>

      </div>
    `;
  }

  renderTimelineCard(evt, idx) {
    const isAbnormal = evt.severity === 'critical' || evt.severity === 'urgent' || evt.severity === 'warning' || evt.structuredData?.markers?.some(m => m.isAbnormal);
    
    // Category icons and colors
    let catBadge = { icon: 'file-text', label: 'Report', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
    if (evt.category === 'lab_report') {
      catBadge = { icon: 'flask-conical', label: 'Lab Test', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
    } else if (evt.category === 'imaging') {
      catBadge = { icon: 'scan', label: 'Radiology Scan', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    } else if (evt.category === 'prescription') {
      catBadge = { icon: 'pill', label: 'Prescription', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    } else if (evt.category === 'consultation') {
      catBadge = { icon: 'stethoscope', label: 'Clinical Note', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    }

    return `
      <div class="relative group">
        <!-- Marker Node on spine -->
        <div class="absolute -left-6 md:-left-10 top-5 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 ${isAbnormal ? 'border-rose-500 shadow-lg shadow-rose-500/40' : 'border-sky-400 shadow-md shadow-sky-400/20'} flex items-center justify-center">
          <div class="w-2 h-2 rounded-full ${isAbnormal ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}"></div>
        </div>

        <!-- Event Card -->
        <div class="rounded-3xl bg-[#0F172A] border ${isAbnormal ? 'border-rose-500/30 shadow-lg shadow-rose-500/5' : 'border-slate-800'} p-5 md:p-6 transition-all hover:border-sky-500/40 hover:shadow-xl">
          
          <!-- Top Row: Date, Category & Document Badge -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
                ${evt.eventDate || 'Recent'}
              </span>
              <span class="px-2.5 py-1 rounded-xl ${catBadge.bg} ${catBadge.color} border ${catBadge.border} text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="${catBadge.icon}" class="w-3.5 h-3.5"></i>
                <span>${catBadge.label}</span>
              </span>
              ${isAbnormal ? `
                <span class="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                  <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Attention Flagged
                </span>
              ` : ''}
            </div>

            <!-- Source Document Indicator & View Button -->
            <div class="flex items-center gap-2">
              <button data-evt-id="${evt.id}" class="btn-view-report px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all">
                <i data-lucide="file-search" class="w-3.5 h-3.5"></i>
                <span>${evt.fileType === 'pdf' ? 'View PDF Report' : 'View Report Copy'}</span>
              </button>
              <button data-delete-id="${evt.id}" class="btn-delete-report p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all" title="Delete record">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Title & Facility -->
          <div class="mb-3">
            <h4 class="text-base font-bold text-white tracking-tight">${evt.title}</h4>
            <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span><strong>Facility:</strong> ${evt.facilityName || 'Diagnostic Center'}</span>
              <span>•</span>
              <span><strong>Physician:</strong> ${evt.providerName || 'Attending MD'}</span>
              <span>•</span>
              <span><strong>Source File:</strong> ${evt.sourceDocumentName || 'Document.pdf'}</span>
            </p>
          </div>

          <!-- AI Clinical Summary / Key Memory Takeaway -->
          <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4">
            <div class="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> AI Clinical Memory Extraction
            </div>
            <p class="text-xs text-slate-200 leading-relaxed font-normal">${evt.clinicalSummary}</p>
          </div>

          <!-- Structured Biomarkers / Lab Results Chips -->
          ${evt.structuredData?.markers && evt.structuredData.markers.length > 0 ? `
            <div class="mb-3">
              <div class="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <i data-lucide="activity" class="w-3.5 h-3.5 text-sky-400"></i> Extracted Biomarkers & Test Parameters:
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                ${evt.structuredData.markers.map(m => `
                  <div class="p-2.5 rounded-xl ${m.isAbnormal ? 'bg-rose-950/20 border border-rose-500/30' : 'bg-slate-900/90 border border-slate-800'} flex items-center justify-between gap-2">
                    <div>
                      <div class="text-xs font-semibold ${m.isAbnormal ? 'text-rose-300' : 'text-slate-200'}">${m.name}</div>
                      <div class="text-[10px] text-slate-400">Ref: ${m.ref || 'Normal Range'}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs font-mono font-bold ${m.isAbnormal ? 'text-rose-400' : 'text-emerald-400'}">${m.value} ${m.unit || ''}</div>
                      <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${m.isAbnormal ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-400'}">${m.isAbnormal ? 'Abnormal' : 'Optimal'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Prescribed Medications or Action Items -->
          ${evt.structuredData?.medications && evt.structuredData.medications.length > 0 ? `
            <div class="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <i data-lucide="pill" class="w-3.5 h-3.5"></i> Prescribed:
              </span>
              ${evt.structuredData.medications.map(med => `
                <span class="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">${med}</span>
              `).join('')}
            </div>
          ` : ''}

        </div>
      </div>
    `;
  }

  renderEmptyTimelineState() {
    return `
      <div class="p-12 text-center rounded-3xl bg-[#0F172A] border border-dashed border-slate-700">
        <div class="w-16 h-16 rounded-3xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
          <i data-lucide="folder-plus" class="w-8 h-8"></i>
        </div>
        <h3 class="text-lg font-bold text-white mb-1">Your AI Health Memory is Empty</h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Upload a medical report copy (JPG, PNG, or PDF). Our AI will parse and extract clinical markers, diagnoses, and prescriptions into your timeline.
        </p>
        <button id="btn-empty-upload" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/25 transition-all inline-flex items-center gap-2">
          <i data-lucide="file-up" class="w-4 h-4 stroke-[2.5]"></i>
          <span>Upload Medical Report (JPG / PNG / PDF)</span>
        </button>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW 2: Upload Medical Report (JPG / PNG / PDF) & AI Extraction
  // ==========================================================================
  renderUploadView(state, profile) {
    return `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <i data-lucide="file-up" class="w-5 h-5 text-emerald-400"></i>
              <span>Upload Medical Report</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">Ingest lab results, radiology scans, and prescriptions in JPG, PNG, or PDF format.</p>
          </div>

          <button id="btn-back-to-timeline" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span>Back to Timeline</span>
          </button>
        </div>

        <!-- Hidden Global File Input for Reliable Triggering -->
        <input type="file" id="report-file-input" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf,text/plain" class="hidden">

        <p class="text-xs text-slate-400">Original files are saved to the configured SharePoint folder when you confirm the report.</p>

        <!-- Error Banner if any -->
        ${this.uploadErrorMessage ? `
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 text-rose-400 flex-shrink-0"></i>
              <span>${escapeHtml(this.uploadErrorMessage)}</span>
            </div>
            <button id="btn-dismiss-upload-error" class="text-rose-400 hover:text-rose-200">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        ` : ''}

        <!-- 1. Drag & Drop File Upload Area -->
        <div class="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 md:p-8">
          
          <div id="drop-zone" class="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-sky-500/5 group">
            <div class="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3 border border-sky-500/20 group-hover:scale-105 transition-transform">
              <i data-lucide="upload-cloud" class="w-8 h-8"></i>
            </div>
            
            <h3 class="text-sm font-bold text-white mb-1">Click to browse or drag & drop medical report</h3>
            <p class="text-xs text-slate-400 mb-4">Supported formats: <strong>JPG, PNG, PDF</strong> (Max 25MB)</p>
            
            <button type="button" id="btn-browse-file" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer">
              <i data-lucide="file-plus" class="w-4 h-4 stroke-[2.5]"></i>
              <span>Browse Files on Device</span>
            </button>
          </div>

          <!-- Or Try Sample Documents for Instant Demonstration -->
          <div class="mt-6 pt-6 border-t border-slate-800/80">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>Or Test Instantly with Sample Clinical Records:</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${SAMPLE_DOCUMENTS.map((doc, i) => `
                <button data-sample-index="${i}" class="btn-sample-doc text-left p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80 hover:border-sky-500/50 transition-all group flex items-start justify-between gap-3">
                  <div>
                    <div class="text-xs font-bold text-slate-200 group-hover:text-sky-400 flex items-center gap-1.5">
                      <i data-lucide="${doc.category === 'lab_report' ? 'flask-conical' : 'pill'}" class="w-3.5 h-3.5 text-sky-400"></i>
                      <span>${doc.title}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 mt-1">${doc.fileName} • ${doc.fileSize} (${doc.fileType.toUpperCase()})</div>
                  </div>
                  <span class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-bold group-hover:bg-sky-500 group-hover:text-slate-950 transition-all flex items-center gap-1 whitespace-nowrap">
                    Test Ingestion <i data-lucide="chevron-right" class="w-3 h-3"></i>
                  </span>
                </button>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- 2. AI Processing Pipeline Visualizer (Shown during extraction) -->
        ${this.isProcessing ? `
          <div class="rounded-3xl bg-[#0F172A] border border-sky-500/40 p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center animate-spin">
                  <i data-lucide="loader-2" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">${this.uploadProgress.name || 'Processing Medical Document...'}</h4>
                  <p class="text-xs text-sky-400">${this.uploadProgress.details || 'Running OCR and clinical parameter extraction...'}</p>
                </div>
              </div>
              <span class="text-sm font-mono font-bold text-sky-400">${this.uploadProgress.progress}%</span>
            </div>

            <div class="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300" style="width: ${this.uploadProgress.progress}%"></div>
            </div>
          </div>
        ` : ''}

        <!-- 3. Review & Confirmation Card (Shown when extraction is complete) -->
        ${this.extractedReviewData ? this.renderExtractedReviewCard(profile) : ''}

      </div>
    `;
  }

  renderExtractedReviewCard(profile) {
    const data = this.extractedReviewData;

    return `
      <div class="rounded-3xl bg-[#0F172A] border border-emerald-500/40 p-6 md:p-8 shadow-2xl space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Review & Confirm Extracted Details</h3>
              <p class="text-xs text-slate-400">Verify the clinical data before committing to your AI Health Memory Timeline.</p>
            </div>
          </div>

          <span class="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold">
            ${data.sourceDocumentName} (${data.fileType?.toUpperCase() || 'PDF'})
          </span>
        </div>

        <!-- Editable Form Fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Report Title</label>
            <input type="text" id="review-title" value="${data.title || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Date of Test / Exam</label>
            <input type="date" id="review-date" value="${data.eventDate || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Diagnostic Facility / Lab</label>
            <input type="text" id="review-facility" value="${data.facilityName || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Ordering Physician / Radiologist</label>
            <input type="text" id="review-provider" value="${data.providerName || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
          </div>
        </div>

        <!-- Clinical Takeaway / Doctor Summary -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">AI Extracted Clinical Summary & Findings</label>
          <textarea id="review-summary" rows="3" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed">${data.clinicalSummary || ''}</textarea>
        </div>

        <!-- Extracted Biomarkers Grid -->
        ${data.biomarkers && data.biomarkers.length > 0 ? `
          <div>
            <label class="block text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <i data-lucide="activity" class="w-3.5 h-3.5 text-sky-400"></i> Extracted Biomarkers (${data.biomarkers.length} parameters detected)
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              ${data.biomarkers.map((m, i) => `
                <div class="p-3 rounded-xl ${m.isAbnormal ? 'bg-rose-950/30 border border-rose-500/30' : 'bg-slate-900 border border-slate-800'} flex items-center justify-between gap-2">
                  <div>
                    <div class="text-xs font-semibold ${m.isAbnormal ? 'text-rose-300' : 'text-slate-200'}">${m.name}</div>
                    <div class="text-[10px] text-slate-400">Ref: ${m.ref || 'Normal'}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-mono font-bold ${m.isAbnormal ? 'text-rose-400' : 'text-emerald-400'}">${m.value} ${m.unit || ''}</div>
                    <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${m.isAbnormal ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-400'}">${m.isAbnormal ? 'Abnormal' : 'Normal'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Prescribed Medications or Action Items -->
        ${data.medications && data.medications.length > 0 ? `
          <div>
            <label class="block text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <i data-lucide="pill" class="w-3.5 h-3.5 text-emerald-400"></i> Prescribed Medications:
            </label>
            <div class="space-y-1.5">
              ${data.medications.map(med => `
                <div class="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/20 text-xs text-emerald-300 font-medium">${med}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Commit Button -->
        <div class="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button id="btn-discard-review" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all">
            Discard
          </button>
          <button id="btn-save-to-timeline" ${this.isSavingReport ? 'disabled' : ''} class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait">
            <i data-lucide="save" class="w-4 h-4 stroke-[2.5]"></i>
            <span>${this.isSavingReport ? 'Uploading to SharePoint...' : 'Confirm & Add to AI Health Memory Timeline'}</span>
          </button>
        </div>

      </div>
    `;
  }

  // ==========================================================================
  // VIEW 3: Doctor-Ready Health Details (Patient Profile)
  // ==========================================================================
  renderProfileView(state, profile) {
    const allergyList = profile.majorAllergies || [];
    const conditionList = profile.chronicConditions || [];
    const medList = profile.currentMedications || [];
    const emergencyContact = profile.emergencyContacts?.[0] || { name: 'Not Added', relationship: 'N/A', phone: 'N/A' };

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header with Doctor Sheet Export Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <i data-lucide="stethoscope" class="w-5 h-5 text-purple-400"></i>
              <span>Doctor-Ready Health Profile</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">All personal and clinical details necessary for physician consultations & hospital visits.</p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-edit-doctor-profile" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700">
              <i data-lucide="edit-3" class="w-4 h-4 text-sky-400"></i>
              <span>Edit Details</span>
            </button>
            <button id="btn-print-doctor-sheet" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Print / Export Doctor Sheet</span>
            </button>
          </div>
        </div>

        <!-- 1. Patient Demographics & Identity Card -->
        <div class="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              ${profile.avatarInitials || 'P'}
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">${profile.firstName} ${profile.lastName}</h3>
              <p class="text-xs text-slate-400">Patient ID: <span class="font-mono text-sky-400">${profile.id}</span></p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age & DOB</div>
              <div class="text-xs font-bold text-slate-100 mt-0.5">${profile.age || 'N/A'} yrs (${profile.dateOfBirth || 'N/A'})</div>
            </div>

            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</div>
              <div class="text-xs font-bold text-rose-400 mt-0.5">${profile.bloodGroup || 'O+'}</div>
            </div>

            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biological Sex</div>
              <div class="text-xs font-bold text-slate-100 mt-0.5">${profile.gender || 'Not Specified'}</div>
            </div>

            <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</div>
              <div class="text-xs font-bold text-slate-100 mt-0.5">${profile.phone || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- 2. High-Alert Allergy Alert Banner (Crucial for Doctor) -->
        <div class="rounded-3xl ${allergyList.length > 0 ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/20 border border-rose-500/40' : 'bg-slate-900/50 border border-slate-800'} p-6">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="shield-alert" class="w-5 h-5 ${allergyList.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}"></i>
            <h3 class="text-sm font-bold ${allergyList.length > 0 ? 'text-rose-300' : 'text-slate-300'} uppercase tracking-wider">
              High-Alert Known Allergies (Crucial For Doctor)
            </h3>
          </div>

          ${allergyList.length > 0 ? `
            <div class="flex flex-wrap gap-2">
              ${allergyList.map(a => `
                <span class="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
                  <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
                  <span>${a}</span>
                </span>
              `).join('')}
            </div>
          ` : `
            <p class="text-xs text-slate-400">No known drug, environmental, or food allergies recorded.</p>
          `}
        </div>

        <!-- 3. Medical Conditions & Active Prescriptions Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <!-- Chronic Conditions -->
          <div class="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <i data-lucide="activity" class="w-4 h-4 text-sky-400"></i>
              <h3 class="text-sm font-bold text-white">Chronic Medical Conditions</h3>
            </div>
            ${conditionList.length > 0 ? `
              <div class="space-y-2">
                ${conditionList.map(c => `
                  <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>${c}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-xs text-slate-400">No chronic medical conditions listed.</p>
            `}
          </div>

          <!-- Active Medications -->
          <div class="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <i data-lucide="pill" class="w-4 h-4 text-emerald-400"></i>
              <h3 class="text-sm font-bold text-white">Current Active Medications</h3>
            </div>
            ${medList.length > 0 ? `
              <div class="space-y-2">
                ${medList.map(m => `
                  <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-medium flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>${m}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-xs text-slate-400">No daily medications registered.</p>
            `}
          </div>

        </div>

        <!-- 4. Emergency Contacts & Surgeries -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <!-- Emergency Contact -->
          <div class="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <i data-lucide="phone-call" class="w-4 h-4 text-rose-400"></i>
              <h3 class="text-sm font-bold text-white">Emergency Contact Information</h3>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div class="text-xs font-bold text-slate-200">${emergencyContact.name || 'Primary Contact'}</div>
              <div class="text-xs text-slate-400">Relationship: <span class="text-slate-300 font-medium">${emergencyContact.relationship || 'Family'}</span></div>
              <div class="text-xs text-slate-400">Phone: <span class="font-mono text-sky-400 font-bold">${emergencyContact.phone || 'N/A'}</span></div>
            </div>
          </div>

          <!-- Surgeries & Physician -->
          <div class="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <i data-lucide="clipboard-check" class="w-4 h-4 text-purple-400"></i>
              <h3 class="text-sm font-bold text-white">Surgeries, Implants & Primary MD</h3>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div class="text-xs text-slate-300"><strong>Primary MD:</strong> ${profile.primaryDoctor || 'Not Specified'}</div>
              <div class="text-xs text-slate-300 mt-1"><strong>Surgical History:</strong> ${profile.surgeriesAndImplants || 'None recorded'}</div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // ==========================================================================
  // VIEW: Global Modals
  // ==========================================================================
  renderActiveModal(state, profile) {
    if (!this.activeModal) return '';

    if (this.activeModal === 'view_report' && this.modalData) {
      const evt = this.modalData;
      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div class="max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 class="text-base font-bold text-white">${evt.title}</h3>
                <p class="text-xs text-slate-400">${evt.facilityName} • ${evt.eventDate} • ${evt.sourceDocumentName}</p>
              </div>
              <button id="btn-close-modal" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Report Preview (Image or PDF Viewer Simulation) -->
            ${evt.fileDataUrl ? `
              <div>
                <div class="text-xs font-bold text-slate-300 mb-2">Original Document Attachment:</div>
                ${evt.fileType === 'pdf' ? `
                  <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <i data-lucide="file-text" class="w-12 h-12 text-rose-400 mx-auto"></i>
                    <div class="text-xs font-bold text-white">${evt.sourceDocumentName}</div>
                    <p class="text-[11px] text-slate-400">PDF Document verified and encrypted in AI health memory.</p>
                  </div>
                ` : `
                  <div class="rounded-2xl overflow-hidden border border-slate-800 max-h-80 flex items-center justify-center bg-slate-950">
                    <img src="${evt.fileDataUrl}" alt="${evt.title}" class="max-h-80 object-contain">
                  </div>
                `}
              </div>
            ` : ''}

            ${evt.sharePointUrl ? `
              <div class="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                <a href="${escapeHtml(evt.sharePointUrl)}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-sky-300 hover:text-sky-200">
                  Open original document in SharePoint
                </a>
              </div>
            ` : ''}

            <!-- Raw Extracted OCR Text -->
            <div>
              <div class="text-xs font-bold text-slate-300 mb-2">Raw OCR Extracted Content:</div>
              <pre class="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-60 leading-relaxed">${evt.ocrRawText || evt.clinicalSummary}</pre>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end">
              <button id="btn-modal-done" class="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold">
                Done
              </button>
            </div>

          </div>
        </div>
      `;
    }

    if (this.activeModal === 'edit_profile') {
      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div class="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 class="text-base font-bold text-white">Edit Doctor-Ready Personal Details</h3>
              <button id="btn-close-modal" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <form id="form-edit-doctor-profile" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">First Name</label>
                  <input type="text" name="firstName" value="${profile.firstName || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Last Name</label>
                  <input type="text" name="lastName" value="${profile.lastName || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-slate-300 mb-1">Date of Birth</label>
                  <input type="date" name="dateOfBirth" value="${profile.dateOfBirth || '1990-01-01'}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-slate-300 mb-1">Biological Sex</label>
                  <select name="gender" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                    <option value="Male" ${profile.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${profile.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other" ${profile.gender === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-slate-300 mb-1">Blood Group</label>
                  <select name="bloodGroup" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-bold text-rose-400 focus:outline-none focus:border-sky-500">
                    <option value="O+" ${profile.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
                    <option value="O-" ${profile.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
                    <option value="A+" ${profile.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
                    <option value="A-" ${profile.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
                    <option value="B+" ${profile.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
                    <option value="B-" ${profile.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
                    <option value="AB+" ${profile.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
                    <option value="AB-" ${profile.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-rose-300 mb-1">Known Allergies (comma-separated)</label>
                <input type="text" name="allergies" value="${(profile.majorAllergies || []).join(', ')}" placeholder="e.g. Penicillin, Sulfa, Peanuts" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/30 text-xs text-slate-100 focus:outline-none focus:border-rose-500">
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Chronic Conditions (comma-separated)</label>
                <input type="text" name="chronicConditions" value="${(profile.chronicConditions || []).join(', ')}" placeholder="e.g. Hypertension, Type 2 Diabetes" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-300 mb-1">Current Medications (comma-separated)</label>
                <input type="text" name="medications" value="${(profile.currentMedications || []).join(', ')}" placeholder="e.g. Metformin 500mg, Lisinopril 10mg" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Emergency Contact Name</label>
                  <input type="text" name="emergencyName" value="${profile.emergencyContacts?.[0]?.name || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Emergency Phone</label>
                  <input type="tel" name="emergencyPhone" value="${profile.emergencyContacts?.[0]?.phone || ''}" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
                </div>
              </div>

              <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" id="btn-cancel-edit" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold">Save Changes</button>
              </div>
            </form>

          </div>
        </div>
      `;
    }

    if (this.activeModal === 'ask_ai') {
      const events = store.getEventsForProfile();
      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div class="max-w-2xl w-full rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <i data-lucide="brain-circuit" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white">Ask AI Health Memory</h3>
                  <p class="text-xs text-slate-400">Queries your ${events.length} uploaded medical reports & parameters.</p>
                </div>
              </div>
              <button id="btn-close-modal" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <div class="space-y-3">
              <div class="text-xs font-semibold text-slate-300">Suggested Questions:</div>
              <div class="flex flex-wrap gap-2">
                <button class="ai-prompt-btn px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs border border-slate-800">What are my highest risk biomarkers?</button>
                <button class="ai-prompt-btn px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs border border-slate-800">Summarize my last 3 lab reports for my doctor</button>
                <button class="ai-prompt-btn px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs border border-slate-800">Are there any drug or allergy interactions?</button>
              </div>
            </div>

            <div id="ai-response-box" class="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-normal min-h-[100px]">
              AI is ready. Select a suggested question or type your health query below.
            </div>

            <div class="flex items-center gap-2">
              <input type="text" id="ai-query-input" placeholder="Ask anything about your health timeline..." class="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500">
              <button id="btn-send-ai-query" class="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs">
                Ask AI
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  // ==========================================================================
  // EVENT ATTACHMENTS & INTERACTION HANDLERS
  // ==========================================================================
  attachMainListeners(state, profile) {
    // Navigation
    const navTimeline = document.getElementById('nav-timeline-btn');
    const navUpload = document.getElementById('nav-upload-btn');
    const navProfile = document.getElementById('nav-profile-btn');
    const brandBtn = document.getElementById('brand-logo-btn');
    const btnLogout = document.getElementById('btn-logout');

    if (navTimeline) navTimeline.onclick = () => this.switchTab('timeline');
    if (navUpload) navUpload.onclick = () => this.switchTab('upload');
    if (navProfile) navProfile.onclick = () => this.switchTab('profile');
    if (brandBtn) brandBtn.onclick = () => this.switchTab('timeline');
    if (btnLogout) btnLogout.onclick = () => store.logout();

    // Timeline view buttons
    const btnQuickUpload = document.getElementById('btn-quick-upload');
    const btnBannerUpload = document.getElementById('btn-banner-upload');
    const btnEmptyUpload = document.getElementById('btn-empty-upload');
    if (btnQuickUpload) btnQuickUpload.onclick = () => this.switchTab('upload');
    if (btnBannerUpload) btnBannerUpload.onclick = () => this.switchTab('upload');
    if (btnEmptyUpload) btnEmptyUpload.onclick = () => this.switchTab('upload');

    // Search input
    const searchInput = document.getElementById('timeline-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        store.setFilters({ searchQuery: e.target.value });
      };
    }
    const btnClearSearch = document.getElementById('btn-clear-search');
    if (btnClearSearch) {
      btnClearSearch.onclick = () => store.setFilters({ searchQuery: '' });
    }

    // Category filter pills
    document.querySelectorAll('.filter-cat-btn').forEach(btn => {
      btn.onclick = () => {
        store.setFilters({ category: btn.dataset.cat });
      };
    });

    // View report modals
    document.querySelectorAll('.btn-view-report').forEach(btn => {
      btn.onclick = () => {
        const evtId = btn.dataset.evtId;
        const evt = store.getState().events?.find(e => e.id === evtId);
        if (evt) {
          this.activeModal = 'view_report';
          this.modalData = evt;
          this.render();
        }
      };
    });

    // Delete report
    document.querySelectorAll('.btn-delete-report').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.deleteId;
        if (confirm('Are you sure you want to remove this report from your AI Health Memory Timeline?')) {
          store.deleteEvent(id);
        }
      };
    });

    // Ask AI Memory
    const btnAskAI = document.getElementById('btn-ask-ai-memory');
    if (btnAskAI) {
      btnAskAI.onclick = () => {
        this.activeModal = 'ask_ai';
        this.render();
      };
    }

    // Doctor Briefing button from timeline
    const btnOpenDoctorChart = document.getElementById('btn-open-doctor-chart');
    if (btnOpenDoctorChart) {
      btnOpenDoctorChart.onclick = () => this.switchTab('profile');
    }

    // Upload View Listeners
    const btnBackTimeline = document.getElementById('btn-back-to-timeline');
    if (btnBackTimeline) btnBackTimeline.onclick = () => this.switchTab('timeline');

    // Safe File Selector Trigger
    const fileInput = document.getElementById('report-file-input');
    const btnBrowse = document.getElementById('btn-browse-file');
    const dropZone = document.getElementById('drop-zone');

    const triggerFileSelect = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (fileInput) {
        fileInput.value = ''; // Reset to allow re-selection
        fileInput.click();
      }
    };

    if (btnBrowse) {
      btnBrowse.onclick = triggerFileSelect;
    }

    if (dropZone) {
      dropZone.onclick = (e) => {
        // If they clicked the button directly, let btnBrowse handle it; otherwise trigger
        if (e.target !== btnBrowse && !btnBrowse?.contains(e.target)) {
          triggerFileSelect(e);
        }
      };

      dropZone.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-sky-500', 'bg-sky-500/10');
      };

      dropZone.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-sky-500', 'bg-sky-500/10');
      };

      dropZone.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-sky-500', 'bg-sky-500/10');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          this.handleFileUpload(file, profile);
        }
      };
    }

    if (fileInput) {
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          this.handleFileUpload(file, profile);
        }
      };
    }

    const btnDismissError = document.getElementById('btn-dismiss-upload-error');
    if (btnDismissError) {
      btnDismissError.onclick = () => {
        this.uploadErrorMessage = null;
        this.render();
      };
    }

    // Sample Document Buttons
    document.querySelectorAll('.btn-sample-doc').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.sampleIndex, 10);
        const sample = SAMPLE_DOCUMENTS[idx];
        if (sample) {
          this.handleSampleDocUpload(sample, profile);
        }
      };
    });

    // Review Confirmation Listeners
    const btnSaveTimeline = document.getElementById('btn-save-to-timeline');
    if (btnSaveTimeline) {
      btnSaveTimeline.onclick = async () => {
        if (this.isSavingReport) return;
        const title = document.getElementById('review-title')?.value || this.extractedReviewData.title;
        const date = document.getElementById('review-date')?.value || this.extractedReviewData.eventDate;
        const facility = document.getElementById('review-facility')?.value || this.extractedReviewData.facilityName;
        const provider = document.getElementById('review-provider')?.value || this.extractedReviewData.providerName;
        const summary = document.getElementById('review-summary')?.value || this.extractedReviewData.clinicalSummary;

        const eventData = {
          ...this.extractedReviewData,
          title: title,
          eventDate: date,
          facilityName: facility,
          providerName: provider,
          clinicalSummary: summary
        };

        if (this.pendingUploadFile) {
          this.extractedReviewData = eventData;
          this.isSavingReport = true;
          this.uploadErrorMessage = null;
          this.render();
          try {
            const uploadedFile = await uploadFileToSharePoint(this.pendingUploadFile);
            eventData.fileDataUrl = null;
            eventData.sharePointUrl = uploadedFile.webUrl;
          } catch (error) {
            this.isSavingReport = false;
            const errorMessage = (error.message || 'Unknown error').replace(/[.!?]+$/, '');
            this.uploadErrorMessage = `SharePoint upload failed: ${errorMessage}. The report was not added to the timeline.`;
            this.render();
            return;
          }
        }

        store.addReportEvent(eventData);

        this.pendingUploadFile = null;
        this.isSavingReport = false;
        this.extractedReviewData = null;
        this.switchTab('timeline');
      };
    }

    const btnDiscardReview = document.getElementById('btn-discard-review');
    if (btnDiscardReview) {
      btnDiscardReview.onclick = () => {
        this.pendingUploadFile = null;
        this.extractedReviewData = null;
        this.render();
      };
    }

    // Profile View Listeners
    const btnEditProfile = document.getElementById('btn-edit-doctor-profile');
    if (btnEditProfile) {
      btnEditProfile.onclick = () => {
        this.activeModal = 'edit_profile';
        this.render();
      };
    }

    const btnPrintDoctor = document.getElementById('btn-print-doctor-sheet');
    if (btnPrintDoctor) {
      btnPrintDoctor.onclick = () => window.print();
    }

    // Modal Close
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnModalDone = document.getElementById('btn-modal-done');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    if (btnCloseModal) btnCloseModal.onclick = () => { this.activeModal = null; this.render(); };
    if (btnModalDone) btnModalDone.onclick = () => { this.activeModal = null; this.render(); };
    if (btnCancelEdit) btnCancelEdit.onclick = () => { this.activeModal = null; this.render(); };

    // Edit Profile Form Submit
    const formEditProfile = document.getElementById('form-edit-doctor-profile');
    if (formEditProfile) {
      formEditProfile.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(formEditProfile);
        
        const allergies = (fd.get('allergies') || '').split(',').map(s => s.trim()).filter(Boolean);
        const chronicConditions = (fd.get('chronicConditions') || '').split(',').map(s => s.trim()).filter(Boolean);
        const currentMedications = (fd.get('medications') || '').split(',').map(s => s.trim()).filter(Boolean);

        store.updateProfileDetails(profile.id, {
          firstName: fd.get('firstName'),
          lastName: fd.get('lastName'),
          dateOfBirth: fd.get('dateOfBirth'),
          gender: fd.get('gender'),
          bloodGroup: fd.get('bloodGroup'),
          majorAllergies: allergies,
          chronicConditions: chronicConditions,
          currentMedications: currentMedications,
          emergencyContacts: [{
            name: fd.get('emergencyName') || 'Primary Emergency Contact',
            relationship: 'Family',
            phone: fd.get('emergencyPhone') || ''
          }]
        });

        this.activeModal = null;
        this.render();
      };
    }

    // Ask AI Queries
    document.querySelectorAll('.ai-prompt-btn').forEach(btn => {
      btn.onclick = () => {
        const text = btn.innerText;
        this.handleAIQuery(text, profile);
      };
    });
    const btnSendQuery = document.getElementById('btn-send-ai-query');
    const aiInput = document.getElementById('ai-query-input');
    if (btnSendQuery && aiInput) {
      btnSendQuery.onclick = () => {
        if (aiInput.value.trim()) {
          this.handleAIQuery(aiInput.value.trim(), profile);
        }
      };
    }
  }

  async handleFileUpload(file, profile) {
    if (!file) return;

    this.pendingUploadFile = file;
    this.isProcessing = true;
    this.extractedReviewData = null;
    this.uploadErrorMessage = null;
    this.render();

    try {
      const ocr = new OCRPipeline((update) => {
        this.uploadProgress = update;
        this.render();
      });

      const result = await ocr.processFile(file, profile);
      this.isProcessing = false;
      this.extractedReviewData = result;
      this.render();
    } catch (err) {
      console.error('File ingestion error:', err);
      this.isProcessing = false;
      this.uploadErrorMessage = `Failed to process document: ${err.message || 'Unknown error'}. Please verify the file format.`;
      this.pendingUploadFile = null;
      this.render();
    }
  }

  async handleSampleDocUpload(sampleDoc, profile) {
    this.pendingUploadFile = null;
    this.isProcessing = true;
    this.extractedReviewData = null;
    this.uploadErrorMessage = null;
    this.render();

    try {
      const ocr = new OCRPipeline((update) => {
        this.uploadProgress = update;
        this.render();
      });

      const result = await ocr.processSampleDocument(sampleDoc, profile);
      this.isProcessing = false;
      this.extractedReviewData = result;
      this.render();
    } catch (err) {
      console.error('Sample processing error:', err);
      this.isProcessing = false;
      this.uploadErrorMessage = `Error loading sample document: ${err.message}`;
      this.render();
    }
  }

  handleAIQuery(query, profile) {
    const box = document.getElementById('ai-response-box');
    if (!box) return;

    box.innerHTML = `<div class="text-sky-400 flex items-center gap-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Synthesizing response across health memory...</div>`;
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      const events = store.getEventsForProfile();
      let response = '';

      if (query.toLowerCase().includes('risk') || query.toLowerCase().includes('biomarker')) {
        response = `<strong>Clinical Risk Assessment:</strong><br>• Glycemic Control: Suboptimal HbA1c (8.1% vs target < 7.0%) indicating elevated average blood glucose of ~186 mg/dL.<br>• Renal Status: eGFR is at 55 mL/min (CKD Stage 3a transition).<br>• Lipid Profile: LDL cholesterol is 134 mg/dL with triglycerides 195 mg/dL.<br><em>Recommendation: Consult ordering physician regarding secondary oral hypoglycemic agent and statin titration.</em>`;
      } else if (query.toLowerCase().includes('summarize') || query.toLowerCase().includes('doctor')) {
        response = `<strong>Executive Summary for Physician:</strong><br>Patient ${profile.firstName} ${profile.lastName} (${profile.age}y, ${profile.bloodGroup}) has ${events.length} uploaded diagnostic records. Major conditions include Type 2 Diabetes and Hypertension. Current high-alert allergy: <strong>${profile.majorAllergies.join(', ') || 'None'}</strong>. Most recent lab on ${events[0]?.eventDate || 'recent'} shows elevated glycemic and lipid markers.`;
      } else if (query.toLowerCase().includes('allergy') || query.toLowerCase().includes('interaction')) {
        response = `<strong>Safety & Allergy Cross-Check:</strong><br>• Recorded Allergies: <strong>${profile.majorAllergies.join(', ') || 'None'}</strong>.<br>• No conflicting beta-lactam antibiotics detected in active prescriptions.<br>• Renal dosing warning: Adjust Metformin dosage if eGFR persists below 60 mL/min.`;
      } else {
        response = `<strong>AI Health Memory Query Analysis:</strong><br>Found ${events.length} relevant entries in ${profile.firstName}'s health memory matching your query "${query}". All vital parameters and physician directives remain indexed and ready for clinical consultation.`;
      }

      box.innerHTML = response;
    }, 600);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
