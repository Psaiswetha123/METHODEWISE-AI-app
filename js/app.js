/**
 * MethodWise AI - Main Application Coordinator
 * Handles SPA navigation, screen transitions, state management, and user interactions.
 */

class MethodWiseApp {
  constructor() {
    this.currentView = 'login-screen'; // Default first screen as requested by user
    this.isLoggedIn = false;
    this.currentAnalysisResult = null;
    this.viewer3DPageInstance = null;
    this.savedProjects = [];
  }

  init() {
    // 1. Initialize data & storage
    this.loadSavedProjects();
    if (window.MethodWiseSync) {
      window.MethodWiseSync.subscribe((event) => {
        if (event.type === 'PROJECTS_UPDATED' || event.type === 'STORAGE_CHANGED') {
          this.loadSavedProjects();
          if (this.currentView === 'history-page') this.renderHistoryPage();
          if (this.currentView === 'dashboard-overview') this.renderDashboardStats();
        }
      });
    }

    // 2. Instantiate Wizard
    window.wizard = new window.WizardController();
    window.wizard.init();

    // 3. Initialize background CAD grid particles canvas for login screen
    this.initAuthCanvas();

    // 4. Bind global navigation and action listeners
    this.bindEvents();

    // 6. Ensure default initial screen on launch is ALWAYS the Login Screen
    this.isLoggedIn = false;
    this.switchView('login-screen');
  }

  bindEvents() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(e);
      });
    }

    const demoLoginBtn = document.getElementById('demo-login-btn');
    if (demoLoginBtn) {
      demoLoginBtn.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        const emailEl = document.getElementById('login-email');
        const passEl = document.getElementById('login-password');
        if (emailEl && !emailEl.value) emailEl.value = 'saiswethanaidu.56@gmail.com';
        if (passEl && !passEl.value) passEl.value = 'demo12345';
        this.handleLogin(e);
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Sidebar & Header Navigation buttons
    document.querySelectorAll('[data-target-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = btn.getAttribute('data-target-view');
        this.switchView(viewId);
      });
    });

    // Sidebar collapse toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        document.querySelector('.app-shell').classList.toggle('sidebar-collapsed');
      });
    }

    // Global AI Search Input & Dropdown Listener
    const globalSearchInput = document.getElementById('global-search-input');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', () => this.handleGlobalAiSearch());
      globalSearchInput.addEventListener('focus', () => this.handleGlobalAiSearch());
      globalSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.openAiChatWithQuery(globalSearchInput.value.trim());
        }
      });
    }

    document.addEventListener('click', (e) => {
      const container = document.getElementById('topbar-ai-search-container');
      if (container && !container.contains(e.target)) {
        this.closeGlobalAiSearch();
      }
    });

    // 3D Preview Page Controls
    const btnWireframe = document.getElementById('btn-3d-wireframe');
    if (btnWireframe) {
      btnWireframe.addEventListener('click', () => {
        if (this.viewer3DPageInstance) {
          this.viewer3DPageInstance.toggleWireframe();
          this.showToast('Toggled Wireframe View', 'info');
        }
      });
    }

    const btnAutoOrbit = document.getElementById('btn-3d-orbit');
    if (btnAutoOrbit) {
      btnAutoOrbit.addEventListener('click', () => {
        if (this.viewer3DPageInstance) {
          let state = this.viewer3DPageInstance.toggleAutoOrbit();
          this.showToast(state ? 'Auto-Orbit Enabled' : 'Auto-Orbit Paused', 'info');
        }
      });
    }

    const btnExplode = document.getElementById('btn-3d-explode');
    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        if (this.viewer3DPageInstance) {
          let exploded = this.viewer3DPageInstance.toggleExplode();
          this.showToast(exploded ? 'Exploded Assembly View' : 'Collapsed View', 'info');
        }
      });
    }

    const btnResetView = document.getElementById('btn-3d-reset');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        if (this.viewer3DPageInstance) this.viewer3DPageInstance.resetView();
      });
    }

    // Material Shading dropdown
    const styleSelect = document.getElementById('select-3d-shading');
    if (styleSelect) {
      styleSelect.addEventListener('change', (e) => {
        if (this.viewer3DPageInstance) {
          this.viewer3DPageInstance.setMaterialStyle(e.target.value);
        }
      });
    }

    // Action Buttons in 3D Visualization page
    const btnGenCad = document.getElementById('btn-gen-cad');
    if (btnGenCad) {
      btnGenCad.addEventListener('click', () => this.openCadModal());
    }

    const btnGenProto = document.getElementById('btn-gen-proto');
    if (btnGenProto) {
      btnGenProto.addEventListener('click', () => this.openProtoModal());
    }

    const btnDownloadReport = document.getElementById('btn-download-report');
    if (btnDownloadReport) {
      btnDownloadReport.addEventListener('click', () => this.downloadReport());
    }

    // Global Search Engine Initialization
    this.bindGlobalSearch();
  }

  bindGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const dropdown = document.getElementById('global-search-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        dropdown.classList.add('hidden');
        return;
      }

      // Search Saved / History Projects
      const matchedProjects = (this.savedProjects || []).filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.type.toLowerCase().includes(q) || 
        p.material.toLowerCase().includes(q) || 
        p.process.toLowerCase().includes(q)
      );

      // Search Manufacturing Processes
      const matchedProcesses = (window.METHODWISE_DATA.PROCESSES || []).filter(pr => 
        pr.name.toLowerCase().includes(q) || 
        pr.category.toLowerCase().includes(q) || 
        pr.description.toLowerCase().includes(q)
      );

      // Search Materials
      const dataMat = window.METHODWISE_DATA.MATERIALS;
      const allMats = [...dataMat.metals, ...dataMat.plastics, ...dataMat.composites];
      const matchedMaterials = allMats.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.category.toLowerCase().includes(q)
      );

      let html = '';

      if (matchedProjects.length > 0) {
        html += `<div class="search-group-header">📌 Previous Design Projects</div>`;
        matchedProjects.slice(0, 4).forEach(p => {
          html += `
            <div class="search-result-item" onclick="window.app.selectSearchResult('project', '${p.id}')">
              <div>
                <div class="search-result-title">${p.name}</div>
                <div class="search-result-sub">${p.process} | ${p.material}</div>
              </div>
              <span class="badge badge-cyan">${p.date}</span>
            </div>
          `;
        });
      }

      if (matchedProcesses.length > 0) {
        html += `<div class="search-group-header">⚙️ Manufacturing Processes</div>`;
        matchedProcesses.slice(0, 3).forEach(pr => {
          html += `
            <div class="search-result-item" onclick="window.app.selectSearchResult('process', '${pr.id}')">
              <div>
                <div class="search-result-title">${pr.name}</div>
                <div class="search-result-sub">${pr.accuracy} | ${pr.bestForQty}</div>
              </div>
              <span class="badge badge-emerald">${pr.category || 'Process'}</span>
            </div>
          `;
        });
      }

      if (matchedMaterials.length > 0) {
        html += `<div class="search-group-header">🧪 Engineering Materials</div>`;
        matchedMaterials.slice(0, 3).forEach(m => {
          html += `
            <div class="search-result-item" onclick="window.app.selectSearchResult('material', '${m.id}')">
              <div>
                <div class="search-result-title">${m.name}</div>
                <div class="search-result-sub">${m.strength} MPa | ${m.weightRating}</div>
              </div>
              <span class="badge badge-cyan">${m.category}</span>
            </div>
          `;
        });
      }

      if (!html) {
        html = `<div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">No matching projects, processes, or materials found.</div>`;
      }

      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  selectSearchResult(type, id) {
    const dropdown = document.getElementById('global-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    if (type === 'project') {
      this.viewHistoryDetail(id);
      this.showToast('Opened project details report', 'info');
    } else if (type === 'process') {
      this.switchView('manufacturing-advisor-page');
      this.openMfgModal(id);
    } else if (type === 'material') {
      this.switchView('material-advisor-page');
      this.showToast('Navigated to Material Advisor', 'info');
    }
  }

  set2DView(mode) {
    if (this.viewer2DInstance) {
      this.viewer2DInstance.setViewMode(mode);
    }
    if (this.standalone2DViewer) {
      this.standalone2DViewer.setViewMode(mode);
    }

    ['2d-view-toggle-btns', 'standalone-2d-view-toggle-btns'].forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.querySelectorAll('button').forEach(btn => {
          if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${mode}'`)) {
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline');
          } else {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline');
          }
        });
      }
    });
  }

  toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');

    const searchDropdown = document.getElementById('global-search-dropdown');
    if (searchDropdown) searchDropdown.classList.add('hidden');
  }

  clearNotifications() {
    const list = document.getElementById('notifications-list-container');
    const badge = document.getElementById('topbar-notif-count');
    if (list) {
      list.innerHTML = `<div style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 0.84rem;">No unread notifications</div>`;
    }
    if (badge) badge.style.display = 'none';
    this.showToast('Notifications cleared', 'info');
  }




  updateUserProfile(email, customName = null, customRole = null) {
    if (!email) email = 'saiswethanaidu.56@gmail.com';
    let formattedName = customName;
    if (!formattedName) {
      const lower = email.toLowerCase();
      if (lower.includes('swetha') || lower.includes('sai')) {
        formattedName = 'Sai Swetha';
      } else {
        const username = email.split('@')[0];
        const parts = username.replace(/[._\-+]/g, ' ').trim().split(/\s+/);
        formattedName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
      }
    }

    const parts = formattedName.split(/\s+/);
    let avatarText = 'SS';
    if (parts.length >= 2 && parts[0] && parts[1]) {
      avatarText = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    } else if (parts[0] && parts[0].length >= 2) {
      avatarText = parts[0].substring(0, 2).toUpperCase();
    } else if (parts[0]) {
      avatarText = parts[0].charAt(0).toUpperCase();
    }

    const avatarElem = document.getElementById('topbar-user-avatar');
    const nameElem = document.getElementById('topbar-user-name');
    const roleElem = document.getElementById('topbar-user-role');
    const welcomeNameElem = document.getElementById('welcome-user-name');

    if (avatarElem) avatarElem.textContent = avatarText;
    if (nameElem) nameElem.textContent = formattedName;
    if (roleElem) roleElem.textContent = email;
    if (welcomeNameElem) welcomeNameElem.textContent = formattedName;

    // Update Modal Form values as well
    const modalAvatar = document.getElementById('modal-user-avatar');
    const modalName = document.getElementById('modal-user-display-name');
    const modalEmailSub = document.getElementById('modal-user-email-subtitle');
    const inputName = document.getElementById('profile-input-name');
    const inputEmail = document.getElementById('profile-input-email');
    const inputRole = document.getElementById('profile-input-role');

    if (modalAvatar) modalAvatar.textContent = avatarText;
    if (modalName) modalName.textContent = formattedName;
    if (modalEmailSub) modalEmailSub.textContent = email;
    if (inputName) inputName.value = formattedName;
    if (inputEmail) inputEmail.value = email;
    if (inputRole && customRole) inputRole.value = customRole;

    if (window.MethodWiseSync) {
      window.MethodWiseSync.saveAuthSession(true, { name: formattedName, email: email, avatar: avatarText, role: customRole });
    }
  }

  openProfileModal() {
    const modal = document.getElementById('profile-modal-overlay');
    if (modal) {
      modal.classList.add('active');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeProfileModal() {
    const modal = document.getElementById('profile-modal-overlay');
    if (modal) modal.classList.remove('active');
  }

  saveProfileForm(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('profile-input-name');
    const emailInput = document.getElementById('profile-input-email');
    const roleInput = document.getElementById('profile-input-role');

    const newName = nameInput ? nameInput.value.trim() : '';
    const newEmail = emailInput ? emailInput.value.trim() : '';
    const newRole = roleInput ? roleInput.value.trim() : '';

    if (!newEmail) {
      this.showToast('Work Email address is required', 'warning');
      return;
    }

    this.updateUserProfile(newEmail, newName, newRole);
    this.closeProfileModal();
    this.showToast('Profile & account details updated successfully!', 'success');
  }

  handleDemoLogin(e) {
    if (e) e.preventDefault();
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    if (emailEl) emailEl.value = 'saiswethanaidu.56@gmail.com';
    if (passEl) passEl.value = 'demo12345';
    this.handleLogin(e);
  }

  async handleLogin(e) {
    if (e) e.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.querySelector('#login-form button[type="submit"]');

    let email = emailInput && emailInput.value.trim() ? emailInput.value.trim() : 'saiswethanaidu.56@gmail.com';
    let password = passwordInput && passwordInput.value.trim() ? passwordInput.value.trim() : 'demo12345';
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
    const rememberMe = document.getElementById('remember-me')?.checked ?? true;

    // 3. UI Loading State
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Authenticating...`;
    }

    let authenticatedData = null;

    // Multi-host fetch attempts to guarantee connection
    const hostsToTry = [];
    if (window.location.protocol && window.location.protocol.startsWith('http') && window.location.origin && window.location.origin !== 'null') {
      hostsToTry.push(window.location.origin);
    }
    if (window.MethodWiseSync && typeof window.MethodWiseSync.getServerUrl === 'function') {
      const syncUrl = window.MethodWiseSync.getServerUrl();
      if (syncUrl && !hostsToTry.includes(syncUrl)) hostsToTry.push(syncUrl);
    }
    if (!hostsToTry.includes('http://localhost:8080')) hostsToTry.push('http://localhost:8080');

    for (const host of hostsToTry) {
      try {
        const res = await fetch(`${host}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.user) {
            authenticatedData = data;
            break;
          }
        }
      } catch (err) {
        // try next target host
      }
    }

    // Fail-safe smooth local session fallback
    if (!authenticatedData) {
      const emailPrefix = email.split('@')[0] || 'User';
      const nameParts = emailPrefix.replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      authenticatedData = {
        success: true,
        token: 'demo-jwt-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now(),
        user: {
          id: 'usr-1',
          name: nameParts || 'Sai Swetha',
          email: email,
          phone: '+91 98765 43210',
          company: 'MethodWise AI',
          department: 'DFM Engineering & R&D',
          profileImage: 'SS',
          avatar: 'SS',
          role: 'Lead DFM Engineer (Owner)',
          status: 'active'
        }
      };
    }

    // Successful Authentication -> Save Session & Open Platform
    this.isLoggedIn = true;
    if (window.MethodWiseSync && typeof window.MethodWiseSync.saveAuthSession === 'function') {
      window.MethodWiseSync.saveAuthSession(true, authenticatedData.user, authenticatedData.token, authenticatedData.refreshToken, rememberMe);
    }
    if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.setAuthToken === 'function') {
      window.AndroidNativeBridge.setAuthToken(authenticatedData.token);
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="log-in"></i> Sign In to Advisor Platform`;
      if (window.lucide) window.lucide.createIcons();
    }

    this.showToast(`Login successful! Welcome ${authenticatedData.user.name}`, 'success');
    if (window.logFirebaseEvent) window.logFirebaseEvent('login', { method: 'email', user_name: authenticatedData.user.name, email: authenticatedData.user.email });
    this.switchView('dashboard-overview');
  }

  async handleForgotPassword(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('login-email');
    let email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      this.showToast('Please enter your Gmail / Work email in the email field first.', 'warning');
      if (emailInput) emailInput.focus();
      return;
    }

    let generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      const data = await response.json();
      if (data && data.success && data.otp) {
        generatedOtp = data.otp;
      }
    } catch (err) {
      console.warn('Backend server offline or unreachable for OTP. Using local OTP engine.', err);
    }

    this.activeOtpEmail = email.toLowerCase();
    this.activeOtpCode = generatedOtp;

    const emailDisplay = document.getElementById('otp-target-email');
    if (emailDisplay) emailDisplay.textContent = email;

    const step1 = document.getElementById('otp-step-1');
    const step2 = document.getElementById('otp-step-2');
    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');

    const otpInput = document.getElementById('otp-input');
    if (otpInput) {
      otpInput.value = '';
      setTimeout(() => otpInput.focus(), 200);
    }

    const modal = document.getElementById('otp-modal');
    if (modal) modal.classList.remove('hidden');

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    this.showToast(`🔑 Verification OTP code sent to ${email}! [Code: ${generatedOtp}]`, 'info', 10000);
    this.startOtpCountdown(60);
  }

  startOtpCountdown(seconds) {
    if (this.otpTimer) clearInterval(this.otpTimer);
    const resendBtn = document.getElementById('resend-otp-btn');
    const countdownEl = document.getElementById('otp-countdown');
    
    let count = seconds;
    if (resendBtn) resendBtn.disabled = true;
    if (countdownEl) countdownEl.textContent = `(${count}s)`;

    this.otpTimer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(this.otpTimer);
        if (resendBtn) resendBtn.disabled = false;
        if (countdownEl) countdownEl.textContent = '';
      } else {
        if (countdownEl) countdownEl.textContent = `(${count}s)`;
      }
    }, 1000);
  }

  handleResendOtp() {
    this.showToast('Resending new OTP verification code...', 'info');
    this.handleForgotPassword();
  }

  async handleVerifyOtp(e) {
    if (e) e.preventDefault();
    const otpInput = document.getElementById('otp-input');
    const enteredOtp = otpInput ? otpInput.value.trim() : '';

    if (!enteredOtp || enteredOtp.length !== 6 || isNaN(enteredOtp)) {
      this.showToast('Please enter a valid 6-digit numeric OTP code.', 'error');
      if (otpInput) otpInput.focus();
      return;
    }

    let isVerified = false;

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.activeOtpEmail, otp: enteredOtp })
      });
      const data = await response.json();
      if (data && data.success) {
        isVerified = true;
      } else if (data && data.error) {
        this.showToast(data.error, 'error');
        return;
      }
    } catch (err) {
      if (enteredOtp === this.activeOtpCode) {
        isVerified = true;
      }
    }

    if (isVerified || enteredOtp === this.activeOtpCode) {
      this.verifiedOtp = enteredOtp;
      const step1 = document.getElementById('otp-step-1');
      const step2 = document.getElementById('otp-step-2');
      if (step1) step1.classList.add('hidden');
      if (step2) step2.classList.remove('hidden');

      const pwdInput = document.getElementById('new-password-input');
      if (pwdInput) setTimeout(() => pwdInput.focus(), 200);

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      this.showToast('OTP verified successfully! Please enter your new password.', 'success');
    } else {
      this.showToast('Incorrect OTP code. Please check your email and try again.', 'error');
    }
  }

  async handleResetPassword(e) {
    if (e) e.preventDefault();
    const newPwdInput = document.getElementById('new-password-input');
    const confirmPwdInput = document.getElementById('confirm-password-input');

    const newPassword = newPwdInput ? newPwdInput.value : '';
    const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';

    if (!newPassword || newPassword.length < 4) {
      this.showToast('Password must be at least 4 characters long.', 'error');
      if (newPwdInput) newPwdInput.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showToast('Passwords do not match. Please re-enter.', 'error');
      if (confirmPwdInput) confirmPwdInput.focus();
      return;
    }

    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.activeOtpEmail,
          otp: this.verifiedOtp || this.activeOtpCode,
          newPassword: newPassword
        })
      });
    } catch (err) {
      console.warn('Backend server offline during password reset. Proceeding with local session update.');
    }

    this.closeOtpModal();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (emailInput && this.activeOtpEmail) emailInput.value = this.activeOtpEmail;
    if (passwordInput) passwordInput.value = newPassword;

    this.showToast('Password reset successful! Logging you into MethodWise AI...', 'success');
    this.handleLogin(e);
  }

  closeOtpModal() {
    const modal = document.getElementById('otp-modal');
    if (modal) modal.classList.add('hidden');
    if (this.otpTimer) clearInterval(this.otpTimer);
  }

  handleLogout() {
    this.isLoggedIn = false;
    if (window.MethodWiseSync) {
      window.MethodWiseSync.clearAuthSession();
    }
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    this.switchView('login-screen');
    this.showToast('Logged out successfully', 'info');
  }

  switchView(viewId) {
    this.currentView = viewId;

    // Toggle Login Screen vs App Shell
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');

    if (viewId === 'login-screen') {
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.style.display = 'flex';
      }
      if (appShell) {
        appShell.classList.add('hidden');
        appShell.style.display = 'none';
      }
    } else {
      if (loginScreen) {
        loginScreen.classList.add('hidden');
        loginScreen.style.display = 'none';
      }
      if (appShell) {
        appShell.classList.remove('hidden');
        appShell.style.display = 'grid';
      }

      // Hide all sub-views in app shell, show active
      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.add('hidden');
        sec.style.display = 'none';
        sec.classList.remove('active');
      });

      const activeSec = document.getElementById(viewId);
      if (activeSec) {
        activeSec.classList.remove('hidden');
        activeSec.style.display = 'block';
        activeSec.classList.add('active');
      }

      // Update active nav link highlight
      document.querySelectorAll('.sidebar-nav-item').forEach(nav => {
        if (nav.getAttribute('data-target-view') === viewId) {
          nav.classList.add('active');
        } else {
          nav.classList.remove('active');
        }
      });

      // Special initializations based on view
      try {
        this.onViewActivated(viewId);
      } catch (err) {
        console.warn('onViewActivated non-fatal error:', err);
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) {}
    }
    window.scrollTo(0, 0);
  }

  onViewActivated(viewId) {
    if (viewId === 'dashboard-overview') {
      this.renderDashboardStats();
    } else if (viewId === '3d-preview-page') {
      setTimeout(() => {
        const prod = this.currentAnalysisResult || { productName: 'Smart Helmet', productType: 'Consumer Product' };
        if (window.CAD3DViewer) {
          if (!this.viewer3DPageInstance) {
            this.viewer3DPageInstance = new window.CAD3DViewer('main-3d-canvas-container', {
              autoRotate: true,
              materialStyle: 'metallic',
              productName: prod.productName,
              productType: prod.productType
            });
          } else {
            const detectedShape = this.viewer3DPageInstance.detectShapeFromProduct(prod.productName, prod.productType);
            this.viewer3DPageInstance.setModelShape(detectedShape);
            const selectShape = document.getElementById('select-3d-shape');
            if (selectShape) selectShape.value = detectedShape;
          }
        }
      }, 100);
    } else if (viewId === 'history-page') {
      this.renderHistoryPage();
    } else if (viewId === 'material-advisor-page') {
      this.renderMaterialAdvisorPage();
    } else if (viewId === 'manufacturing-advisor-page') {
      this.renderManufacturingAdvisorPage();
    } else if (viewId === '2d-blueprint-page') {
      setTimeout(() => {
        if (window.CAD2DViewer) {
          const l = parseFloat(document.getElementById('2d-dim-l')?.value) || 280;
          const w = parseFloat(document.getElementById('2d-dim-w')?.value) || 220;
          const h = parseFloat(document.getElementById('2d-dim-h')?.value) || 180;
          const unit = document.getElementById('2d-dim-unit')?.value || 'mm';
          this.standalone2DViewer = new window.CAD2DViewer('standalone-2d-canvas-container', {
            length: l, width: w, height: h, unit: unit, productName: 'Smart Helmet Assembly'
          });
        }
      }, 100);
    }
  }

  renderDashboardStats() {
    this.renderDashboardGauges();
    setTimeout(() => this.renderDashboardCharts(), 150);
  }

  renderDashboardGauges() {
    if (!window.ChartRenderer) return;
    window.ChartRenderer.renderCircularGauge('health-gauge-overall', 94, 'Overall Score', '#00f2fe');
    window.ChartRenderer.renderCircularGauge('health-gauge-strength', 88, 'Strength', '#4facfe');
    window.ChartRenderer.renderCircularGauge('health-gauge-weight', 92, 'Weight Eff.', '#3b82f6');
    window.ChartRenderer.renderCircularGauge('health-gauge-cost', 96, 'Cost Eff.', '#10b981');
    window.ChartRenderer.renderCircularGauge('health-gauge-durability', 90, 'Durability', '#7928ca');
    window.ChartRenderer.renderCircularGauge('health-gauge-mfg', 95, 'Manufacturability', '#00f2fe');
    window.ChartRenderer.renderCircularGauge('health-gauge-eco', 98, 'Sustainability', '#10b981');
    window.ChartRenderer.renderCircularGauge('health-gauge-ai', 99, 'AI Confidence', '#f59e0b');
  }

  renderDashboardCharts() {
    if (!window.ChartRenderer) return;
    // Line Chart: Cost Trend
    window.ChartRenderer.renderLineChart('chart-line-cost', ['1k', '2.5k', '5k', '10k', '25k'], [1450, 720, 480, 360, 290], '#00f2fe');
    // Bar Chart: Lead Time
    window.ChartRenderer.renderBarChart('chart-bar-time', ['Inj Mold', 'CNC', '3D Print', 'Casting', 'Sheet Metal'], [14, 5, 2, 21, 7]);
    // Radar Chart: Multi-Criteria Evaluation
    window.ChartRenderer.renderRadarChart('chart-radar-eval', ['Strength', 'Cost', 'Weight', 'Durability', 'Eco Score'], [88, 96, 92, 90, 98], '#00f2fe');
    // Pie Chart: Material Usage
    window.ChartRenderer.renderBarChart('chart-pie-material', ['ABS', 'PC', 'Nylon', 'Alu 6061', 'Steel 316L'], [45, 25, 15, 10, 5], ['#00f2fe', '#4facfe', '#7928ca', '#f59e0b', '#10b981']);
  }

  // --- Floating AI Assistant & FAB Quick Actions ---
  toggleAiChat() {
    const win = document.getElementById('ai-chat-window');
    if (win) {
      win.classList.toggle('hidden');
      if (!win.classList.contains('hidden')) {
        const input = document.getElementById('ai-chat-input');
        if (input) input.focus();
        const container = document.getElementById('ai-chat-messages');
        if (container) container.scrollTop = container.scrollHeight;
      }
    }
  }

  openAiChat() {
    const win = document.getElementById('ai-chat-window');
    if (win) {
      win.classList.remove('hidden');
      const input = document.getElementById('ai-chat-input');
      if (input) input.focus();
      const container = document.getElementById('ai-chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }
  }

  closeAiChat() {
    const win = document.getElementById('ai-chat-window');
    if (win) win.classList.add('hidden');
  }

  clearAiChat() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;
    const activeProd = this.savedProjects.length > 0 ? this.savedProjects[0].name : 'Smart Board';
    container.innerHTML = `
      <div class="chat-bubble bot">
        Hello Sai Swetha! 👋 I am your MethodWise AI Engineering Assistant. Currently assisting on active product: <strong>${activeProd}</strong>.<br><br>
        Ask me anything about material selection, DFM rules, cost optimization, or 3D/2D CAD blueprints!
      </div>
    `;
    this.showToast('Chat history cleared.', 'info');
  }

  sendQuickAiPrompt(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.value = promptText;
      this.sendAiChatMessage();
    }
  }

  sendAiChatMessage(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('ai-chat-input');
    const container = document.getElementById('ai-chat-messages');
    if (!input || !container) return;

    const query = input.value.trim();
    if (!query) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble user';
    userMsg.textContent = query;
    container.appendChild(userMsg);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // Show Typing Indicator
    const typingBubble = document.createElement('div');
    typingBubble.id = 'ai-typing-indicator';
    typingBubble.className = 'chat-bubble bot typing-indicator';
    typingBubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    container.appendChild(typingBubble);
    container.scrollTop = container.scrollHeight;

    // Generate Context-Aware Engineering Response
    setTimeout(() => {
      // Remove Typing Indicator
      const indicator = document.getElementById('ai-typing-indicator');
      if (indicator) indicator.remove();

      const replyText = this.generateAiResponse(query);
      
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-bubble bot';
      botMsg.innerHTML = replyText;
      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }, 650);
  }

  generateAiResponse(query) {
    const q = query.toLowerCase();
    const activeProject = (this.savedProjects && this.savedProjects.length > 0) ? this.savedProjects[0] : {
      name: 'Smart Board',
      material: 'ABS Plastic',
      process: 'Injection Molding',
      unitCost: 480,
      score: 9.4
    };

    // 1. Active Project Status / Context
    if (q.includes('active') || q.includes('project') || q.includes('status') || q.includes('smart board') || q.includes('helmet')) {
      return `
        <strong>📊 Active Project Summary: ${activeProject.name}</strong><br>
        <ul>
          <li><strong>Material:</strong> ${activeProject.material || 'ABS Plastic'}</li>
          <li><strong>Process:</strong> ${activeProject.process || 'Injection Molding'}</li>
          <li><strong>Unit Cost:</strong> ₹${activeProject.unitCost || 480}</li>
          <li><strong>DFM Rating:</strong> ${activeProject.score || '9.4'} / 10</li>
        </ul>
        <div class="chat-callout">
          ✨ MethodWise AI Engine Status: <strong>Grade A+ Production Ready</strong>. 100% DFM pass rate verified.
        </div>
      `;
    }

    // 2. Material Advisor & Recommendation
    if (q.includes('material') || q.includes('abs') || q.includes('metal') || q.includes('titanium') || q.includes('aluminum') || q.includes('plastic') || q.includes('carbon')) {
      if (q.includes('abs')) {
        return `
          <strong>🧪 Material Profile: ABS Plastic (Acrylonitrile Butadiene Styrene)</strong><br>
          <ul>
            <li><strong>Density:</strong> 1.05 g/cm³</li>
            <li><strong>Tensile Strength:</strong> 45 MPa</li>
            <li><strong>Cost Index:</strong> ₹140 - ₹180 / kg</li>
            <li><strong>Recyclability:</strong> 100% Thermoplastic</li>
            <li><strong>Best For:</strong> Enclosures, consumer electronics, automotive trim.</li>
          </ul>
        `;
      } else if (q.includes('titanium')) {
        return `
          <strong>⚡ Material Profile: Titanium Ti-6Al-4V (Grade 5)</strong><br>
          <ul>
            <li><strong>Density:</strong> 4.43 g/cm³</li>
            <li><strong>Tensile Strength:</strong> 950 MPa (Extreme strength-to-weight ratio)</li>
            <li><strong>Cost Index:</strong> ₹2,800 - ₹3,500 / kg</li>
            <li><strong>Best For:</strong> Medical implants, aerospace structural components, defense equipment.</li>
          </ul>
        `;
      } else if (q.includes('aluminum') || q.includes('aluminium')) {
        return `
          <strong>⚙️ Material Profile: Aluminium 6061-T6</strong><br>
          <ul>
            <li><strong>Density:</strong> 2.70 g/cm³</li>
            <li><strong>Tensile Strength:</strong> 310 MPa</li>
            <li><strong>Cost Index:</strong> ₹280 - ₹340 / kg</li>
            <li><strong>Machinability:</strong> Excellent for CNC Milling & Turning.</li>
          </ul>
        `;
      }

      return `
        <strong>🛠️ Material Advisor Recommendation:</strong><br>
        For high-volume consumer products, <strong>ABS Plastic</strong> offers the best cost efficiency (₹140/kg) with 45 MPa tensile strength.<br><br>
        If high structural strength and thermal resistance are needed, consider <strong>Aluminium 6061-T6</strong> or <strong>Polycarbonate (PC)</strong>.
      `;
    }

    // 3. Cost Analysis & Breakdown
    if (q.includes('cost') || q.includes('price') || q.includes('budget') || q.includes('rupee') || q.includes('nre') || q.includes('saving')) {
      return `
        <strong>💰 Cost Analysis & Tooling Amortization:</strong><br>
        <ul>
          <li><strong>Material Cost:</strong> ~38% of unit cost</li>
          <li><strong>Manufacturing/Processing:</strong> ~42% of unit cost</li>
          <li><strong>NRE Mold Tooling:</strong> ~20% (amortized over volume)</li>
        </ul>
        <div class="chat-callout">
          💡 <strong>Cost Scaling Tip:</strong> Unit production cost drops from ₹1,450 at 1,000 batch size to <strong>₹480</strong> at 5,000 volume due to NRE mold amortization!
        </div>
      `;
    }

    // 4. DFM Rules & Guidelines
    if (q.includes('dfm') || q.includes('rule') || q.includes('draft') || q.includes('wall') || q.includes('thickness') || q.includes('tolerance')) {
      return `
        <strong>📐 Design for Manufacturability (DFM) Guidelines:</strong><br>
        <ol>
          <li><strong>Draft Angle:</strong> Maintain min <code>1.5° - 2.0°</code> draft on vertical walls for clean ejector pin stroke.</li>
          <li><strong>Wall Thickness:</strong> Keep uniform nominal wall thickness (<code>2.0mm - 2.5mm</code>) to avoid sink marks.</li>
          <li><strong>Rib Ratio:</strong> Rib thickness should be max <code>60%</code> of nominal wall thickness.</li>
          <li><strong>Fillet Radii:</strong> Internal radii should be at least <code>0.5x</code> wall thickness.</li>
        </ol>
      `;
    }

    // 5. Manufacturing Process Selection
    if (q.includes('process') || q.includes('molding') || q.includes('cnc') || q.includes('printing') || q.includes('casting') || q.includes('sheet')) {
      return `
        <strong>🏭 Manufacturing Process Selection Matrix:</strong><br>
        <ul>
          <li><strong>Injection Molding:</strong> Recommended for volumes &gt; 500 units. Lowest unit cost.</li>
          <li><strong>CNC Machining:</strong> Ideal for precision metals (< 500 units) or tight tolerances (±0.05mm).</li>
          <li><strong>3D Printing (SLA/SLS):</strong> Best for rapid prototyping & low volume production (< 50 units).</li>
          <li><strong>Sheet Metal Bending:</strong> Best for enclosures, chassis, and flat panel bracketry.</li>
        </ul>
      `;
    }

    // 6. CAD / 2D / 3D Visualization Assistance
    if (q.includes('cad') || q.includes('3d') || q.includes('2d') || q.includes('blueprint') || q.includes('viewer') || q.includes('render')) {
      return `
        <strong>🖥️ 3D & 2D CAD Blueprint Advisor:</strong><br>
        You can inspect full interactive 3D WebGL models, toggle wireframe grid rendering, rotate axes, and download DXF / STEP files directly from the <strong>2D CAD Blueprint</strong> and <strong>3D Design Preview</strong> tabs!
      `;
    }

    // 7. Report Export & Exporting
    if (q.includes('report') || q.includes('export') || q.includes('pdf') || q.includes('csv') || q.includes('excel') || q.includes('download')) {
      return `
        <strong>📄 Export & Report Generation:</strong><br>
        MethodWise AI supports multi-format exports:<br>
        • <strong>PDF Executive Report</strong> (Includes DFM score breakdown & material specs)<br>
        • <strong>CSV Datasheet</strong> (Raw cost parameters & manufacturing specs)<br>
        • <strong>Word Summary Document</strong><br><br>
        Click <strong>Export DFM Report</strong> in the sidebar or top notification panel to download immediately!
      `;
    }

    // Default Fallback with Dynamic Suggestions
    return `
      For active product <strong>${activeProject.name}</strong>, MethodWise AI recommends evaluating <strong>${activeProject.material || 'ABS Plastic'}</strong> manufactured via <strong>${activeProject.process || 'Injection Molding'}</strong>.<br><br>
      You can ask me specifically about:<br>
      • <em>"What is the best material for high impact strength?"</em><br>
      • <em>"How much mold cost can I save at 5,000 units?"</em><br>
      • <em>"What draft angle is required for vertical walls?"</em>
    `;
  }

  handleGlobalAiSearch() {
    const input = document.getElementById('global-search-input');
    const dropdown = document.getElementById('global-search-dropdown');
    if (!input || !dropdown) return;

    const query = input.value.trim();
    dropdown.classList.remove('hidden');

    if (!query) {
      // Default Quick AI Search Suggestions
      dropdown.innerHTML = `
        <div class="ai-search-header-label"><i data-lucide="sparkles"></i> MethodWise AI Quick Search & Recommendations</div>
        <div class="ai-search-suggestion-item" onclick="window.app.selectAiSearchSuggestion('What is the best material for high strength?')">
          <i data-lucide="zap" style="color: var(--accent-cyan);"></i> What is the best material for high strength?
        </div>
        <div class="ai-search-suggestion-item" onclick="window.app.selectAiSearchSuggestion('Minimum draft angle for injection molding?')">
          <i data-lucide="ruler" style="color: var(--accent-emerald);"></i> Minimum draft angle for injection molding?
        </div>
        <div class="ai-search-suggestion-item" onclick="window.app.selectAiSearchSuggestion('How to reduce NRE mold tooling cost?')">
          <i data-lucide="badge-indian-rupee" style="color: var(--accent-amber);"></i> How to reduce NRE mold tooling cost?
        </div>
        <div class="ai-search-suggestion-item" onclick="window.app.selectAiSearchSuggestion('Status of active project Smart Board')">
          <i data-lucide="activity" style="color: var(--accent-purple);"></i> Status of active project Smart Board
        </div>
      `;
    } else {
      // Live Instant AI Answer
      const aiAnswerHtml = this.generateAiResponse(query);
      const safeQuery = query.replace(/'/g, "\\'");
      dropdown.innerHTML = `
        <div class="ai-search-header-label"><i data-lucide="bot"></i> AI Instant Answer for "${query}":</div>
        <div class="ai-search-answer-box">
          ${aiAnswerHtml}
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
          <button type="button" class="btn btn-outline btn-xs" onclick="window.app.closeGlobalAiSearch()">Close</button>
          <button type="button" class="btn btn-primary btn-xs" onclick="window.app.openAiChatWithQuery('${safeQuery}')">
            <i data-lucide="message-square"></i> Open in AI Chat Assistant
          </button>
        </div>
      `;
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  closeGlobalAiSearch() {
    const dropdown = document.getElementById('global-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }

  selectAiSearchSuggestion(query) {
    const input = document.getElementById('global-search-input');
    if (input) input.value = query;
    this.handleGlobalAiSearch();
  }

  openAiChatWithQuery(query) {
    this.closeGlobalAiSearch();
    this.openAiChat();
    if (query) {
      this.sendQuickAiPrompt(query);
    }
  }

  toggleFabMenu() {
    const menu = document.getElementById('fab-menu');
    if (menu) menu.classList.toggle('hidden');
  }

  exportExcel() {
    const csvContent = "data:text/csv;charset=utf-8,Parameter,Value,Unit\nProduct Name,Smart Helmet,Units\nMaterial,ABS Plastic,Thermoplastic\nProcess,Injection Molding,Molding\nUnit Cost,480,INR\nDFM Score,9.4,Out of 10\nReadiness,96.8,Percent\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MethodWise_AI_DFM_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Exported CSV Datasheet successfully!', 'success');
  }

  exportWord() {
    const blob = new Blob(["MethodWise AI Engineering Executive Summary\n======================================\nProduct Name: Smart Helmet\nRecommended Material: ABS Plastic\nRecommended Process: Injection Molding\nUnit Cost: ₹480 / unit\nDFM Manufacturability Score: 9.4/10\nSustainability Rating: Grade A+ Eco\n"], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "MethodWise_AI_Executive_Summary.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Exported Word Document summary successfully!', 'success');
  }

  update2DFromControls() {
    const l = parseFloat(document.getElementById('2d-dim-l')?.value) || 280;
    const w = parseFloat(document.getElementById('2d-dim-w')?.value) || 220;
    const h = parseFloat(document.getElementById('2d-dim-h')?.value) || 180;
    const unit = document.getElementById('2d-dim-unit')?.value || 'mm';

    if (this.standalone2DViewer) {
      this.standalone2DViewer.updateDimensions(l, w, h, unit);
    }
  }

  change3DShape(shapeType) {
    if (this.viewer3DPageInstance) {
      this.viewer3DPageInstance.setModelShape(shapeType);
      this.showToast(`Updated 3D CAD geometry shape to ${shapeType.toUpperCase()}`, 'info');
    }
  }


  updateCostAnalysisFromSlider(qty) {
    qty = parseInt(qty) || 5000;
    const qtyDisplay = document.getElementById('cost-volume-val-display');
    if (qtyDisplay) qtyDisplay.textContent = `${qty.toLocaleString()} Units`;

    // Tooling NRE base cost = ₹2,50,000
    const fixedTooling = 250000;
    const toolingPerUnit = Math.round(fixedTooling / qty);
    const rawMaterial = 280;
    const machineOperating = 260;
    const finishing = 60;
    const inspection = 40;
    const logistics = 20;

    const totalUnit = rawMaterial + machineOperating + toolingPerUnit + finishing + inspection + logistics;
    const totalBatch = totalUnit * qty;

    const unitPriceEl = document.getElementById('cost-calc-unit-price');
    const totalBatchEl = document.getElementById('cost-calc-total-batch');
    if (unitPriceEl) unitPriceEl.textContent = `₹${totalUnit.toLocaleString()}`;
    if (totalBatchEl) totalBatchEl.textContent = `Total Batch: ₹${totalBatch.toLocaleString()}`;

    // Update table breakdown values & percentages
    const matTable = document.getElementById('cost-table-mat');
    const mfgTable = document.getElementById('cost-table-mfg');
    const toolTable = document.getElementById('cost-table-tooling');
    const totalTable = document.getElementById('cost-table-total');

    if (matTable) matTable.textContent = `₹${rawMaterial}`;
    if (mfgTable) mfgTable.textContent = `₹${machineOperating}`;
    if (toolTable) toolTable.textContent = `₹${toolingPerUnit}`;
    if (totalTable) totalTable.textContent = `₹${totalUnit.toLocaleString()} / unit`;

    // Update share percentages
    const shareMat = document.getElementById('cost-share-mat');
    const shareMfg = document.getElementById('cost-share-mfg');
    const shareTool = document.getElementById('cost-share-tooling');

    if (shareMat) shareMat.textContent = `${Math.round((rawMaterial / totalUnit) * 100)}%`;
    if (shareMfg) shareMfg.textContent = `${Math.round((machineOperating / totalUnit) * 100)}%`;
    if (shareTool) shareTool.textContent = `${Math.round((toolingPerUnit / totalUnit) * 100)}%`;
  }



  displayAIResults(result) {
    this.currentAnalysisResult = result;
    this.saveProjectToHistory(result);

    // Global Active Product Name Automatic Update
    if (window.setActiveProductName) {
      window.setActiveProductName(result.productName);
    }

    // Feature 1: Populate Product Summary Card
    const summaryName = document.getElementById('summary-card-name');
    const summaryMat = document.getElementById('summary-card-material');
    const summaryProc = document.getElementById('summary-card-process');
    const summaryCost = document.getElementById('summary-card-cost');
    const summaryTime = document.getElementById('summary-card-time');

    if (summaryName) summaryName.textContent = result.productName;
    if (summaryMat) summaryMat.textContent = result.recommendedMaterial.name;
    if (summaryProc) summaryProc.textContent = result.recommendedProcess.name;
    if (summaryCost) summaryCost.textContent = result.costBreakdown ? result.costBreakdown.costRangeDisplay : '₹500 - ₹900';
    if (summaryTime) summaryTime.textContent = result.recommendedProcess.leadTime || '3 - 6 Weeks';

    // Populate Hero Summary
    document.getElementById('res-prod-name').textContent = result.productName;
    document.getElementById('res-material-name').textContent = result.recommendedMaterial.name;
    document.getElementById('res-process-name').textContent = result.recommendedProcess.name;
    document.getElementById('res-cost-range').textContent = result.costBreakdown.costRangeDisplay;
    document.getElementById('res-efficiency').textContent = `${result.scores.efficiency}%`;
    document.getElementById('res-score-num').textContent = `${result.scores.overallScore}/10`;

    // Populate Material Recommendation Section
    document.getElementById('res-mat-selected').textContent = result.recommendedMaterial.name;
    document.getElementById('res-mat-reason').textContent = result.explanations.selectionReason;

    const advUl = document.getElementById('res-mat-advantages');
    if (advUl) {
      advUl.innerHTML = result.explanations.advantages.map(a => `<li><i data-lucide="check-circle" class="icon-success"></i> ${a}</li>`).join('');
    }

    const limUl = document.getElementById('res-mat-limitations');
    if (limUl) {
      limUl.innerHTML = result.explanations.limitations.map(l => `<li><i data-lucide="alert-triangle" class="icon-warning"></i> ${l}</li>`).join('');
    }

    // Populate Manufacturing Section
    document.getElementById('res-mfg-best').textContent = result.recommendedProcess.name;
    document.getElementById('res-mfg-explanation').textContent = result.explanations.processExplanation;

    const mfgBenUl = document.getElementById('res-mfg-benefits');
    if (mfgBenUl) {
      mfgBenUl.innerHTML = result.explanations.productionBenefits.map(b => `<li><i data-lucide="zap" class="icon-accent"></i> ${b}</li>`).join('');
    }

    // Feature 7: Populate Material Specification Info Card
    const matInfoCard = document.getElementById('res-material-info-card');
    if (matInfoCard && result.recommendedMaterial) {
      const rm = result.recommendedMaterial;
      matInfoCard.innerHTML = `
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Material Name</span><div style="font-weight: 700; color: var(--accent-cyan);">${rm.name}</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Tensile Strength</span><div style="font-weight: 700;">${rm.strength || 310} MPa</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Density / Weight</span><div style="font-weight: 700;">${rm.density || 2.7} g/cm³ (${rm.weightRating || 'Lightweight'})</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Heat Resistance</span><div style="font-weight: 700;">${rm.tempResistance || 150}°C</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Cost Level</span><div style="font-weight: 700; color: var(--accent-emerald);">${rm.costDisplay || 'Moderate'}</div></div>
        <div><span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Recyclability</span><div style="font-weight: 700; color: var(--accent-emerald);">95% (High Recyclable)</div></div>
      `;
    }

    // Feature 5: Populate Dynamic Process-Specific DFM Tips
    const dynamicTipsUl = document.getElementById('res-dynamic-tips-ul');
    if (dynamicTipsUl) {
      const procId = (result.recommendedProcess.id || 'injection-molding');
      const tipsList = (window.METHODWISE_DATA.DYNAMIC_TIPS && window.METHODWISE_DATA.DYNAMIC_TIPS[procId]) || window.METHODWISE_DATA.AI_TIPS;
      dynamicTipsUl.innerHTML = tipsList.map(tip => `
        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem;">
          <i data-lucide="check-circle-2" class="icon-accent" style="width: 16px; margin-top: 3px;"></i>
          <span>${tip}</span>
        </li>
      `).join('');
    }

    // Feature 6: Populate Alternative Manufacturing Process Suggestions
    const altGrid = document.getElementById('res-alternative-processes-grid');
    if (altGrid && window.METHODWISE_DATA.PROCESSES) {
      const alternatives = window.METHODWISE_DATA.PROCESSES.filter(p => p.id !== result.recommendedProcess.id).slice(0, 3);
      altGrid.innerHTML = alternatives.map(alt => `
        <div class="glass-card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 1rem; color: var(--accent-cyan);">${alt.name}</h4>
            <span class="badge badge-emerald">${alt.category || 'Alternative'}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.3;">${alt.description.slice(0, 80)}...</p>
          <div style="font-size: 0.78rem; color: var(--text-dim);">Accuracy: <strong>${alt.accuracy}</strong> | Lead Time: <strong>${alt.leadTime}</strong></div>
          <button class="btn btn-outline btn-sm" style="margin-top: 8px;" onclick="window.app.openMfgModal('${alt.id}')">
            <i data-lucide="info"></i> View Details
          </button>
        </div>
      `).join('');
    }

    // Populate Cost Breakdown Table
    const cb = result.costBreakdown;
    document.getElementById('cost-mat-val').textContent = `₹${cb.materialCost.toLocaleString()}`;
    document.getElementById('cost-mfg-val').textContent = `₹${cb.manufacturingCost.toLocaleString()}`;
    document.getElementById('cost-asm-val').textContent = `₹${cb.assemblyCost.toLocaleString()}`;
    document.getElementById('cost-total-val').textContent = `₹${cb.totalPerUnit.toLocaleString()}`;

    // Render Circular AI Performance Gauges
    if (window.ChartRenderer) {
      window.ChartRenderer.renderCircularGauge('gauge-strength', result.scores.strengthScore, 'Strength Score', '#00f2fe');
      window.ChartRenderer.renderCircularGauge('gauge-cost', result.scores.costScore, 'Cost Efficiency', '#10b981');
      window.ChartRenderer.renderCircularGauge('gauge-sustainability', result.scores.sustainabilityScore, 'Sustainability', '#3b82f6');
      window.ChartRenderer.renderCircularGauge('gauge-manufacturability', result.scores.manufacturabilityScore, 'Manufacturability (DFM)', '#7928ca');
    }

    // Instantiate / Render 2D Technical CAD Blueprint Visualizer
    if (window.CAD2DViewer) {
      setTimeout(() => {
        const dim = result.dimensions || { length: 280, width: 220, height: 180, unit: 'mm' };
        this.viewer2DInstance = new window.CAD2DViewer('results-2d-canvas-container', {
          length: dim.length,
          width: dim.width,
          height: dim.height,
          unit: dim.unit,
          productName: result.productName,
          productType: result.productType,
          viewMode: 'front'
        });
      }, 100);
    }

    if (window.lucide) window.lucide.createIcons();
    this.switchView('ai-results-page');
  }

  saveProjectToHistory(result) {
    const newProj = {
      id: 'proj-' + Date.now().toString().slice(-4),
      name: result.productName,
      type: result.productType,
      date: new Date().toISOString().split('T')[0],
      material: result.recommendedMaterial.name,
      process: result.recommendedProcess.name,
      costRange: result.costBreakdown.costRangeDisplay,
      unitCost: result.costBreakdown.totalPerUnit,
      efficiency: result.scores.efficiency,
      score: result.scores.overallScore,
      strengthScore: result.scores.strengthScore,
      sustainabilityScore: result.scores.sustainabilityScore,
      manufacturabilityScore: result.scores.manufacturabilityScore,
      dimensions: result.dimensions,
      quantity: result.dimensions.quantity || 1000,
      description: `${result.productName} designed with ${result.recommendedMaterial.name} using ${result.recommendedProcess.name}.`
    };

    const existingIdx = this.savedProjects.findIndex(p => p.id === newProj.id || p.name === newProj.name);
    if (existingIdx >= 0) {
      this.savedProjects[existingIdx] = newProj;
    } else {
      this.savedProjects.unshift(newProj);
    }
    localStorage.setItem('methodwise_projects', JSON.stringify(this.savedProjects));

    if (window.MethodWiseSync) {
      window.MethodWiseSync.saveProject(newProj);
    }
  }

  loadSavedProjects() {
    const defaults = window.METHODWISE_DATA.PROJECTS || [];
    const stored = localStorage.getItem('methodwise_projects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const storedIds = new Set(parsed.map(p => p.id));
        defaults.forEach(d => {
          if (!storedIds.has(d.id)) {
            parsed.push(d);
          }
        });
        this.savedProjects = parsed;
      } catch (e) {
        this.savedProjects = defaults;
      }
    } else {
      this.savedProjects = defaults;
      localStorage.setItem('methodwise_projects', JSON.stringify(this.savedProjects));
    }
  }

  set3DRenderMode(mode) {
    if (this.viewer3DPageInstance) {
      this.viewer3DPageInstance.setRenderMode(mode);
      this.showToast(`Switched 3D View Model to ${mode.toUpperCase()}`, 'info');
    }
    const container = document.getElementById('3d-render-mode-btns');
    if (container) {
      container.querySelectorAll('button').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${mode}'`)) {
          btn.classList.add('active', 'btn-primary');
          btn.classList.remove('btn-outline');
        } else {
          btn.classList.remove('active', 'btn-primary');
          btn.classList.add('btn-outline');
        }
      });
    }
  }

  renderHistoryPage() {
    const container = document.getElementById('history-cards-grid');
    if (!container) return;

    if (this.savedProjects.length === 0) {
      container.innerHTML = `<div class="empty-state-box">No saved projects yet. Create a product design to see history!</div>`;
      return;
    }

    container.innerHTML = this.savedProjects.map(p => `
      <div class="project-card">
        <div class="project-card-header">
          <span class="project-type-badge">${p.type}</span>
          <span class="project-score-badge">AI Score: <strong>${p.score}</strong>/10</span>
        </div>
        ${p.image ? `<div style="text-align: center; margin: 10px 0;"><img src="${p.image}" alt="${p.name}" style="width: 100%; height: 110px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border-color);"></div>` : ''}
        <h3 class="project-card-title">${p.name}</h3>
        <p class="project-card-date">Created: ${p.date}</p>
        
        <div class="project-card-details">
          <div class="p-detail"><span>Material:</span> <strong>${p.material}</strong></div>
          <div class="p-detail"><span>Process:</span> <strong>${p.process}</strong></div>
          <div class="p-detail"><span>Est. Unit Cost:</span> <strong class="cost-accent">${p.costRange || ('₹' + p.unitCost)}</strong></div>
        </div>

        <div class="project-card-actions">
          <button class="btn btn-sm btn-outline" onclick="window.app.viewHistoryDetail('${p.id}')">
            <i data-lucide="eye"></i> View Report
          </button>
          <button class="btn btn-sm btn-ghost text-danger" onclick="window.app.deleteProject('${p.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  viewHistoryDetail(projId) {
    const p = this.savedProjects.find(x => x.id === projId);
    if (!p) return;

    // Simulate result display for this project
    const mockResult = {
      productName: p.name,
      productType: p.type,
      targetUsage: 'High Performance Standard',
      dimensions: p.dimensions || { length: 200, width: 150, height: 100, weight: 600, unit: 'mm' },
      recommendedMaterial: { name: p.material, advantages: ['High strength', 'Cost optimal'], limitations: ['Requires surface coating'] },
      recommendedProcess: { name: p.process, benefits: ['Mass production feasibility', 'High repeatability'] },
      costBreakdown: {
        materialCost: Math.round(p.unitCost * 0.4),
        manufacturingCost: Math.round(p.unitCost * 0.45),
        assemblyCost: Math.round(p.unitCost * 0.15),
        totalPerUnit: p.unitCost,
        costRangeDisplay: p.costRange || `₹${p.unitCost}`
      },
      scores: {
        strengthScore: p.strengthScore || 85,
        costScore: 88,
        sustainabilityScore: p.sustainabilityScore || 75,
        manufacturabilityScore: p.manufacturabilityScore || 90,
        overallScore: p.score,
        efficiency: p.efficiency || 86
      },
      explanations: {
        selectionReason: `${p.material} delivers structural integrity for ${p.name}.`,
        advantages: ['High structural strength', 'Excellent wear properties'],
        limitations: ['Requires precision tooling setup'],
        processExplanation: `${p.process} is optimized for volume batching.`,
        productionBenefits: ['High dimensional repeatability', 'Minimal per-unit assembly overhead']
      }
    };

    this.displayAIResults(mockResult);
  }

  deleteProject(projId) {
    if (confirm('Are you sure you want to remove this design record?')) {
      this.savedProjects = this.savedProjects.filter(p => p.id !== projId);
      localStorage.setItem('methodwise_projects', JSON.stringify(this.savedProjects));
      this.renderHistoryPage();
      this.showToast('Project removed from history', 'info');
    }
  }

  renderDashboardStats() {
    // Render Quick Stats values safely
    const elActive = document.getElementById('dash-stat-active') || document.getElementById('kpi-active-projects');
    if (elActive) elActive.textContent = this.savedProjects.length;

    const statAnalyses = document.getElementById('dash-stat-analyses') || document.getElementById('kpi-ai-analyses');
    if (statAnalyses) statAnalyses.textContent = (this.savedProjects.length * 4);

    const statSaved = document.getElementById('dash-stat-saved') || document.getElementById('kpi-total-products');
    if (statSaved) statSaved.textContent = this.savedProjects.length;

    const elAcc = document.getElementById('dash-stat-accuracy') || document.getElementById('kpi-mfg-readiness');
    if (elAcc) elAcc.textContent = '99.4%';

    // Render Recent Activity List (Last 5 Analyzed Products with View button)
    const actList = document.getElementById('dash-recent-activity');
    if (actList) {
      actList.innerHTML = this.savedProjects.slice(0, 5).map(p => `
        <div class="dash-activity-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(8, 13, 26, 0.6); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="activity-icon"><i data-lucide="check-circle-2" style="color: var(--accent-emerald);"></i></div>
            <div class="activity-info">
              <h4 style="font-size: 0.92rem; margin-bottom: 2px;">${p.name}</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted);">${p.process} | ${p.material} (${p.date})</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-cyan" style="font-size: 0.75rem;">Score: ${p.score}/10</span>
            <button class="btn btn-outline btn-sm" onclick="window.app.viewHistoryDetail('${p.id}')">View</button>
          </div>
        </div>
      `).join('');
    }

    // Render Favorite Materials list on Dashboard
    this.renderFavoriteMaterials();
    if (window.lucide) window.lucide.createIcons();
  }

  renderFavoriteMaterials() {
    const container = document.getElementById('dash-favorite-materials');
    if (!container) return;

    const favorites = JSON.parse(localStorage.getItem('methodwise_fav_materials') || '["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"]');
    container.innerHTML = favorites.map(name => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(8, 13, 26, 0.6); border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.84rem;">
        <span style="font-weight: 600; color: var(--text-main);"><i data-lucide="flask-conical" class="icon-accent" style="width: 14px;"></i> ${name}</span>
        <button class="btn-favorite is-favorite" style="width: 26px; height: 26px; font-size: 0.75rem;" onclick="window.app.toggleFavoriteMaterial('${name}')" title="Remove Favorite">
          <i data-lucide="heart"></i>
        </button>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  toggleFavoriteMaterial(name) {
    let favorites = JSON.parse(localStorage.getItem('methodwise_fav_materials') || '["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"]');
    if (favorites.includes(name)) {
      favorites = favorites.filter(x => x !== name);
      this.showToast(`Removed ${name} from favorites`, 'info');
    } else {
      favorites.push(name);
      this.showToast(`Added ${name} to favorites ❤️`, 'success');
    }
    localStorage.setItem('methodwise_fav_materials', JSON.stringify(favorites));
    this.renderFavoriteMaterials();
  }

  exportExcel() {
    if (!this.savedProjects || this.savedProjects.length === 0) {
      this.showToast('No projects available to export.', 'warning');
      return;
    }
    const headers = ['Project ID', 'Product Name', 'Category', 'Material', 'Process', 'Unit Cost', 'AI Score', 'Date'];
    const rows = this.savedProjects.map(p => [
      p.id, `"${p.name}"`, `"${p.type}"`, `"${p.material}"`, `"${p.process}"`, p.unitCost || 0, p.score || 9.0, p.date
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MethodWise_Engineering_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Engineering CSV Report exported successfully!', 'success');
  }


  renderMaterialAdvisorPage() {
    const tableBody = document.getElementById('mat-advisor-tbody');
    if (!tableBody) return;

    const data = window.METHODWISE_DATA.MATERIALS;
    const all = [...data.metals, ...data.plastics, ...data.composites];

    tableBody.innerHTML = all.map(m => {
      const favs = JSON.parse(localStorage.getItem('methodwise_fav_materials') || '["ABS Plastic", "Titanium Ti-6Al-4V", "Aluminium 6061-T6"]');
      const isFav = favs.includes(m.name);
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <strong>${m.name}</strong>
              <button class="btn-favorite ${isFav ? 'is-favorite' : ''}" style="width: 28px; height: 28px; font-size: 0.75rem;" onclick="window.app.toggleFavoriteMaterial('${m.name}')" title="Favorite Material">
                <i data-lucide="heart"></i>
              </button>
            </div>
          </td>
          <td><span class="material-cat-badge badge-${m.category.toLowerCase()}">${m.category}</span></td>
          <td>${m.strength} MPa</td>
          <td>${m.density} g/cm³</td>
          <td>${m.durability}%</td>
          <td>${m.tempResistance}°C</td>
          <td>${m.costDisplay}</td>
        </tr>
      `;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  renderManufacturingAdvisorPage() {
    const data = window.METHODWISE_DATA;
    if (!data || !data.PROCESSES) return;

    // 1. Render Process Suitability Progress Bars
    const suitabilityContainer = document.getElementById('mfg-suitability-bars-container');
    if (suitabilityContainer) {
      suitabilityContainer.innerHTML = data.PROCESSES.map(p => `
        <div class="progress-bar-item">
          <div class="progress-bar-info">
            <span><strong>${p.name}</strong> <span style="font-size: 0.78rem; color: var(--text-muted);">(${p.category || 'General'})</span></span>
            <span style="font-weight: 700; color: var(--accent-cyan);">${p.suitability || 90}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${p.suitability || 90}%;"></div>
          </div>
        </div>
      `).join('');
    }

    // 2. Render Cost Breakdown Items
    const costContainer = document.getElementById('mfg-cost-breakdown-list');
    if (costContainer && data.COST_BREAKDOWN) {
      costContainer.innerHTML = data.COST_BREAKDOWN.map(c => `
        <div class="progress-bar-item">
          <div class="progress-bar-info">
            <span>${c.name}</span>
            <span><strong style="color: ${c.color};">${c.val}</strong> <span style="font-size: 0.78rem; color: var(--text-muted);">(${c.percent}%)</span></span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${c.percent}%; background: ${c.color};"></div>
          </div>
        </div>
      `).join('') + `
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total Estimated Cost / Unit</span>
          <span style="color: var(--accent-emerald); font-size: 1.1rem;">₹800</span>
        </div>
      `;
    }

    // 3. Render Quality Prediction Circular Meters
    const qualityContainer = document.getElementById('mfg-quality-meters-grid');
    if (qualityContainer && data.QUALITY_PREDICTION) {
      qualityContainer.innerHTML = data.QUALITY_PREDICTION.map(q => `
        <div class="quality-meter-box">
          <div style="font-size: 1.6rem; font-weight: 800; color: ${q.color}; font-family: var(--font-heading); margin-bottom: 2px;">${q.score}%</div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${q.name}</span>
        </div>
      `).join('');
    }

    // 4. Render Material Compatibility Star Rated Cards
    const matCompatContainer = document.getElementById('mfg-material-compat-grid');
    if (matCompatContainer && data.MATERIAL_COMPATIBILITY) {
      matCompatContainer.innerHTML = data.MATERIAL_COMPATIBILITY.map(m => {
        const fullStars = Math.floor(m.starRating);
        const halfStar = m.starRating % 1 !== 0;
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '★';
        if (halfStar) starsHtml += '½';
        return `
          <div class="glass-card compat-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 style="font-size: 1.05rem; color: var(--accent-cyan);">${m.name}</h4>
              <span class="badge badge-emerald">${m.category}</span>
            </div>
            <div class="star-rating-row">${starsHtml} <span style="font-size: 0.8rem; color: var(--text-muted);">(${m.starRating}/5)</span></div>
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.3;">${m.description}</p>
            <div style="background: rgba(8, 13, 26, 0.6); padding: 10px; border-radius: var(--radius-sm); font-size: 0.78rem; display: flex; flex-direction: column; gap: 4px;">
              <div><span>Strength:</span> <strong>${m.strength}</strong></div>
              <div><span>Cost Level:</span> <strong>${m.costLevel}</strong></div>
              <div><span>Heat Deflection:</span> <strong>${m.heatResistance}</strong></div>
              <div><span>Manufacturability:</span> <strong style="color: var(--accent-emerald);">${m.manufacturability}</strong></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 5. Render AI DFM Suggestions & Tips
    const tipsUl = document.getElementById('mfg-ai-tips-ul');
    if (tipsUl && data.AI_TIPS) {
      tipsUl.innerHTML = data.AI_TIPS.map(tip => `
        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem;">
          <i data-lucide="check-circle" class="icon-accent" style="width: 16px; margin-top: 3px;"></i>
          <span>${tip}</span>
        </li>
      `).join('');
    }

    // 6. Render Advantages & Limitations lists
    const advUl = document.getElementById('mfg-advantages-ul');
    const limUl = document.getElementById('mfg-limitations-ul');
    if (advUl && data.ADVANTAGES_LIMITATIONS) {
      advUl.innerHTML = data.ADVANTAGES_LIMITATIONS.advantages.map(a => `
        <li><i data-lucide="check-circle-2" class="icon-success"></i> ${a}</li>
      `).join('');
    }
    if (limUl && data.ADVANTAGES_LIMITATIONS) {
      limUl.innerHTML = data.ADVANTAGES_LIMITATIONS.limitations.map(l => `
        <li><i data-lucide="alert-triangle" class="icon-warning"></i> ${l}</li>
      `).join('');
    }

    // 7. Render Horizontal Production Timeline
    const timelineContainer = document.getElementById('mfg-timeline-track');
    if (timelineContainer && data.PRODUCTION_TIMELINE) {
      timelineContainer.innerHTML = data.PRODUCTION_TIMELINE.map((step) => `
        <div class="timeline-step-node ${step.status.toLowerCase()}">
          <div class="step-dot-icon"><i data-lucide="${step.icon || 'circle'}"></i></div>
          <div class="timeline-step-title">${step.title}</div>
          <div class="timeline-step-desc">${step.desc}</div>
        </div>
      `).join('');
    }

    // 8. Render Alternative Manufacturing Methods Chips
    const altChipsContainer = document.getElementById('mfg-alt-chips-container');
    if (altChipsContainer && data.ALTERNATIVE_METHODS) {
      altChipsContainer.innerHTML = data.ALTERNATIVE_METHODS.map(alt => `
        <div class="alt-chip" onclick="window.app.showToast('Alternative Method: ${alt.name} (${alt.accuracy}) - ${alt.bestFor}', 'info')">
          <i data-lucide="${alt.icon}"></i>
          <span>${alt.name}</span>
          <span style="font-size: 0.75rem; color: var(--text-dim);">(${alt.accuracy})</span>
        </div>
      `).join('');
    }

    // 9. Render Process Comparison Table
    const tbody = document.getElementById('mfg-comparison-tbody');
    if (tbody && data.PROCESSES) {
      tbody.innerHTML = data.PROCESSES.map(p => `
        <tr>
          <td>
            <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="${p.icon}" class="icon-accent" style="width: 16px;"></i> ${p.name}
            </div>
          </td>
          <td>${p.bestForQty}</td>
          <td><span style="color: var(--accent-cyan); font-weight: bold;">${p.accuracy}</span></td>
          <td>${p.leadTime}</td>
          <td>${p.initialToolingCost}</td>
          <td>${p.surfaceFinish}</td>
          <td><span class="badge badge-cyan">${(p.applications && p.applications[0]) || 'General'}</span></td>
        </tr>
      `).join('');
    }

    // 10. Render Main Process Cards
    this.renderMfgCards(data.PROCESSES);

    // 11. Bind Search and Filter listeners
    this.bindMfgFilterEvents();

    if (window.lucide) window.lucide.createIcons();
  }

  renderMfgCards(processes) {
    const grid = document.getElementById('mfg-advisor-grid');
    if (!grid) return;

    if (!processes || processes.length === 0) {
      grid.innerHTML = `<div class="empty-state-box" style="grid-column: 1/-1;">No manufacturing processes match your search filter criteria.</div>`;
      return;
    }

    grid.innerHTML = processes.map(p => `
      <div class="mfg-advisor-card glass-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div class="mfg-card-icon"><i data-lucide="${p.icon}"></i></div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge badge-emerald">${p.category || 'Standard'}</span>
            <button class="btn-favorite ${this.isFavoriteProcess(p.id) ? 'is-favorite' : ''}" onclick="window.app.toggleFavoriteProcess('${p.id}')" title="Save to Favorites">
              <i data-lucide="heart"></i>
            </button>
          </div>
        </div>
        <h3 style="font-size: 1.2rem; margin-bottom: 6px;">${p.name}</h3>
        <p class="mfg-card-desc" style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 16px; min-height: 48px;">${p.description}</p>
        
        <div class="mfg-specs-list" style="margin-bottom: 18px;">
          <div><span>Best Quantity:</span> <strong>${p.bestForQty}</strong></div>
          <div><span>Lead Time:</span> <strong>${p.leadTime}</strong></div>
          <div><span>Accuracy:</span> <strong>${p.accuracy}</strong></div>
          <div><span>Surface Finish:</span> <strong>${p.surfaceFinish}</strong></div>
          <div><span>Initial Tooling:</span> <strong>${p.initialToolingCost}</strong></div>
        </div>

        <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="window.app.openMfgModal('${p.id}')">
          <i data-lucide="info"></i> View Details & Capabilities
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem('methodwise_favorites')) || ['injection-molding'];
    } catch(e) { return ['injection-molding']; }
  }

  toggleFavoriteProcess(id) {
    if (!this.favorites) this.favorites = this.loadFavorites();
    if (this.favorites.includes(id)) {
      this.favorites = this.favorites.filter(x => x !== id);
      this.showToast('Removed process from Favorites', 'info');
    } else {
      this.favorites.push(id);
      this.showToast('Added process to Favorites ❤️', 'success');
    }
    localStorage.setItem('methodwise_favorites', JSON.stringify(this.favorites));
    this.renderManufacturingAdvisorPage();
  }

  isFavoriteProcess(id) {
    if (!this.favorites) this.favorites = this.loadFavorites();
    return this.favorites.includes(id);
  }

  openHelpModal() {
    const overlay = document.getElementById('help-modal-overlay');
    const container = document.getElementById('help-terms-container');
    if (!overlay || !container) return;

    const terms = window.METHODWISE_DATA.HELP_TERMS || {};
    container.innerHTML = Object.keys(terms).map(key => `
      <div style="background: rgba(8, 13, 26, 0.6); padding: 14px 18px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-cyan);">
        <h4 style="font-size: 0.98rem; color: var(--accent-cyan); margin-bottom: 4px;">${key}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${terms[key]}</p>
      </div>
    `).join('');

    overlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  closeHelpModal() {
    const overlay = document.getElementById('help-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }


  bindMfgFilterEvents() {
    const searchInput = document.getElementById('mfg-search-input');
    const filterPills = document.querySelectorAll('#mfg-filter-pills-container .filter-pill');

    if (searchInput) {
      searchInput.oninput = () => this.applyMfgFilters();
    }

    filterPills.forEach(pill => {
      pill.onclick = () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.applyMfgFilters();
      };
    });
  }

  applyMfgFilters() {
    const searchVal = (document.getElementById('mfg-search-input')?.value || '').toLowerCase().trim();
    const activePill = document.querySelector('#mfg-filter-pills-container .filter-pill.active');
    const category = activePill ? activePill.getAttribute('data-filter') : 'all';

    let allProcesses = window.METHODWISE_DATA.PROCESSES || [];

    let filtered = allProcesses.filter(p => {
      // Category match
      let matchCat = (category === 'all') || (p.category === category);

      // Search match
      let searchBlob = `${p.name} ${p.description} ${p.bestForQty} ${p.accuracy} ${(p.suitableMaterials || []).join(' ')} ${(p.applications || []).join(' ')}`.toLowerCase();
      let matchSearch = !searchVal || searchBlob.includes(searchVal);

      return matchCat && matchSearch;
    });

    this.renderMfgCards(filtered);
  }

  openMfgModal(processId) {
    const p = window.METHODWISE_DATA.PROCESSES.find(x => x.id === processId);
    if (!p) return;

    const overlay = document.getElementById('mfg-modal-overlay');
    const content = document.getElementById('mfg-modal-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
        <div class="mfg-card-icon" style="width: 44px; height: 44px; font-size: 1.2rem;"><i data-lucide="${p.icon}"></i></div>
        <div>
          <h2 style="font-size: 1.6rem;">${p.name}</h2>
          <span class="badge badge-cyan">${p.category || 'Manufacturing Process'}</span>
        </div>
      </div>

      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px; line-height: 1.6;">${p.description}</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; background: rgba(8, 13, 26, 0.6); padding: 18px; border-radius: var(--radius-md);">
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin-bottom: 8px;">Suitable Materials:</h4>
          <ul class="bullets-list">
            ${(p.suitableMaterials || ['ABS', 'Aluminum', 'Nylon']).map(m => `<li>${m}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin-bottom: 8px;">Typical Applications:</h4>
          <ul class="bullets-list">
            ${(p.applications || ['Housings', 'Brackets']).map(app => `<li>${app}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-emerald); margin-bottom: 8px;">Key Advantages:</h4>
          <ul class="bullets-list">
            ${(p.advantages || p.benefits).map(a => `<li><i data-lucide="check-circle" class="icon-success"></i> ${a}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 style="font-size: 0.9rem; color: var(--accent-amber); margin-bottom: 8px;">Process Limitations:</h4>
          <ul class="bullets-list">
            ${(p.limitations || ['Tooling cost']).map(l => `<li><i data-lucide="alert-triangle" class="icon-warning"></i> ${l}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div style="background: rgba(15, 23, 42, 0.8); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.88rem; display: flex; flex-direction: column; gap: 8px;">
        <div><span>Industry Focus:</span> <strong>${(p.industries || ['Automotive', 'Electronics']).join(', ')}</strong></div>
        <div><span>Machine Equipment Types:</span> <strong>${(p.machineTypes || ['CNC Milling']).join(' / ')}</strong></div>
        <div><span>Typical Batch Production Volume:</span> <strong>${p.typicalVolume || p.bestForQty}</strong></div>
      </div>
    `;

    overlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  closeMfgModal() {
    const overlay = document.getElementById('mfg-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  exportMfgReportPDF() {
    this.downloadReport();
  }

  exportMfgCostCSV() {
    const data = window.METHODWISE_DATA.PROCESSES || [];
    let csvContent = "data:text/csv;charset=utf-8,Process Name,Category,Quantity Range,Lead Time,Accuracy,Surface Finish,Initial Tooling\n";
    data.forEach(p => {
      csvContent += `"${p.name}","${p.category || ''}","${p.bestForQty}","${p.leadTime}","${p.accuracy}","${p.surfaceFinish}","${p.initialToolingCost}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MethodWise_Manufacturing_Cost_Analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Cost Analysis CSV exported successfully', 'success');
  }


  openCadModal() {
    alert('⚡ CAD Model Generator Simulation:\nGenerating native 3D STEP & STL geometry models based on your engineering requirements...\n\nFiles ready: Smart_Product_Model_v1.STEP (14.2 MB), Smart_Product_Model_v1.STL (8.5 MB)');
  }

  openProtoModal() {
    alert('🛠️ Rapid Prototyping Supplier Quote:\nEstimated SLS / CNC Rapid Prototype Lead Time: 48 Hours\nSupplier Partner: MethodWise Direct Fabrication Lab\nEstimated Cost: ₹2,400 per sample');
  }

  downloadReport() {
    const res = this.currentAnalysisResult || { productName: 'Smart Product', recommendedMaterial: { name: 'ABS Plastic' }, recommendedProcess: { name: 'Injection Molding' }, costBreakdown: { costRangeDisplay: '₹500 - ₹900' } };
    
    // Trigger printable engineering report window
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>MethodWise AI Engineering Report - ${res.productName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #00f2fe; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #0f172a; margin: 0; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
            .section { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MethodWise AI – Smart Product Design Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <div class="section">
            <h2>Product Details</h2>
            <p><strong>Product Name:</strong> ${res.productName}</p>
            <p><strong>Product Type:</strong> ${res.productType || 'Consumer Product'}</p>
          </div>
          <div class="section">
            <h2>AI Recommendation Summary</h2>
            <p><strong>Recommended Material:</strong> <span class="badge">${res.recommendedMaterial.name}</span></p>
            <p><strong>Recommended Manufacturing Process:</strong> <span class="badge">${res.recommendedProcess.name}</span></p>
            <p><strong>Estimated Unit Cost:</strong> ${res.costBreakdown ? res.costBreakdown.costRangeDisplay : '₹500 - ₹900'}</p>
          </div>
          <div class="section">
            <h2>Cost Structure Analysis</h2>
            <table>
              <tr><th>Component</th><th>Cost per Unit</th></tr>
              <tr><td>Material Cost</td><td>₹${res.costBreakdown ? res.costBreakdown.materialCost : 400}</td></tr>
              <tr><td>Manufacturing & Tooling</td><td>₹${res.costBreakdown ? res.costBreakdown.manufacturingCost : 300}</td></tr>
              <tr><td>Assembly & Quality Inspection</td><td>₹${res.costBreakdown ? res.costBreakdown.assemblyCost : 100}</td></tr>
              <tr><th>Total Estimated Cost</th><th>${res.costBreakdown ? res.costBreakdown.costRangeDisplay : '₹800'}</th></tr>
            </table>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  }

  showToast(msg, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i>
      <span>${msg}</span>
    `;
    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  initAuthCanvas() {
    const canvas = document.getElementById('auth-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw node particles & interconnects
      ctx.fillStyle = 'rgba(0, 242, 254, 0.6)';
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(0, 242, 254, ${0.2 * (1 - dist / 140)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    }
    draw();
  }
}

window.setActiveProductName = function(name) {
  if (!name) return;
  const targetIds = [
    'res-prod-name',
    'summary-card-name',
    'topbar-active-prod-name',
    'blueprint-page-title',
    'blueprint-page-subtitle',
    '3d-page-title',
    '3d-page-subtitle',
    'm-topbar-title',
    'm-active-prod-name'
  ];
  targetIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
  });
};

// Global Standalone Fallbacks for Floating Widgets & AI Chatbot
window.handleLogin = function(e) {
  if (e) e.preventDefault();
  if (window.app && typeof window.app.handleLogin === 'function') {
    window.app.handleLogin(e);
  } else {
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');
    if (loginScreen) {
      loginScreen.classList.add('hidden');
      loginScreen.style.display = 'none';
    }
    if (appShell) {
      appShell.classList.remove('hidden');
      appShell.style.display = 'grid';
    }
  }
};

window.toggleAiChat = function() {
  if (window.app && typeof window.app.toggleAiChat === 'function') {
    window.app.toggleAiChat();
  } else {
    const win = document.getElementById('ai-chat-window');
    if (win) win.classList.toggle('hidden');
  }
};

window.openAiChat = function() {
  if (window.app && typeof window.app.openAiChat === 'function') {
    window.app.openAiChat();
  } else {
    const win = document.getElementById('ai-chat-window');
    if (win) win.classList.remove('hidden');
  }
};

window.closeAiChat = function() {
  if (window.app && typeof window.app.closeAiChat === 'function') {
    window.app.closeAiChat();
  } else {
    const win = document.getElementById('ai-chat-window');
    if (win) win.classList.add('hidden');
  }
};

window.clearAiChat = function() {
  if (window.app && typeof window.app.clearAiChat === 'function') {
    window.app.clearAiChat();
  }
};

window.sendQuickAiPrompt = function(text) {
  if (window.app && typeof window.app.sendQuickAiPrompt === 'function') {
    window.app.sendQuickAiPrompt(text);
  }
};

window.sendAiChatMessage = function(e) {
  if (window.app && typeof window.app.sendAiChatMessage === 'function') {
    window.app.sendAiChatMessage(e);
  }
};

window.handleGlobalAiSearch = function() {
  if (window.app && typeof window.app.handleGlobalAiSearch === 'function') {
    window.app.handleGlobalAiSearch();
  }
};

window.closeGlobalAiSearch = function() {
  if (window.app && typeof window.app.closeGlobalAiSearch === 'function') {
    window.app.closeGlobalAiSearch();
  }
};

window.selectAiSearchSuggestion = function(query) {
  if (window.app && typeof window.app.selectAiSearchSuggestion === 'function') {
    window.app.selectAiSearchSuggestion(query);
  }
};

window.openAiChatWithQuery = function(query) {
  if (window.app && typeof window.app.openAiChatWithQuery === 'function') {
    window.app.openAiChatWithQuery(query);
  }
};

window.toggleFabMenu = function() {
  if (window.app && typeof window.app.toggleFabMenu === 'function') {
    window.app.toggleFabMenu();
  } else {
    const menu = document.getElementById('fab-menu');
    if (menu) menu.classList.toggle('hidden');
  }
};

function initAppInstance() {
  if (!window.app) {
    window.app = new MethodWiseApp();
    window.app.init();
  }
}

window.handleDemoLogin = function(e) {
  if (e) e.preventDefault();
  initAppInstance();
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  if (emailEl) emailEl.value = 'saiswethanaidu.56@gmail.com';
  if (passEl) passEl.value = 'demo12345';

  if (window.app && typeof window.app.handleDemoLogin === 'function') {
    window.app.handleDemoLogin(e);
  } else if (window.app && typeof window.app.handleLogin === 'function') {
    window.app.handleLogin(e);
  }
};

window.handleLogin = function(e) {
  if (e) e.preventDefault();
  initAppInstance();
  if (window.app && typeof window.app.handleLogin === 'function') {
    window.app.handleLogin(e);
  } else {
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');
    const activeSec = document.getElementById('dashboard-overview');
    if (loginScreen) {
      loginScreen.classList.add('hidden');
      loginScreen.style.display = 'none';
    }
    if (appShell) {
      appShell.classList.remove('hidden');
      appShell.style.display = 'grid';
    }
    if (activeSec) {
      activeSec.classList.remove('hidden');
      activeSec.style.display = 'block';
      activeSec.classList.add('active');
    }
  }
};

window.handleLogout = function() {
  if (window.app && typeof window.app.handleLogout === 'function') {
    window.app.handleLogout();
  }
};

window.handleForgotPassword = function(e) {
  if (window.app && typeof window.app.handleForgotPassword === 'function') {
    window.app.handleForgotPassword(e);
  }
};

window.handleVerifyOtp = function(e) {
  if (window.app && typeof window.app.handleVerifyOtp === 'function') {
    window.app.handleVerifyOtp(e);
  }
};

window.handleResetPassword = function(e) {
  if (window.app && typeof window.app.handleResetPassword === 'function') {
    window.app.handleResetPassword(e);
  }
};

window.handleResendOtp = function() {
  if (window.app && typeof window.app.handleResendOtp === 'function') {
    window.app.handleResendOtp();
  }
};

window.closeOtpModal = function() {
  if (window.app && typeof window.app.closeOtpModal === 'function') {
    window.app.closeOtpModal();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppInstance);
} else {
  initAppInstance();
}
