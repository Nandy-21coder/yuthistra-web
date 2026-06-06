console.log(firebase);
const API_BASE_URL = 'https://nandha-backend-6azag5bue-raghavan-18s-projects.vercel.app';

window.apiFetch = async function (url, options = {}) {
    options.credentials = 'include';
    if (!options.headers) options.headers = {};
    if (options.method && options.method !== 'GET') {
        const csrfMatch = document.cookie.match(new RegExp('(^| )csrf_access_token=([^;]+)'));
        if (csrfMatch) options.headers['X-CSRF-TOKEN'] = csrfMatch[2];
    }
    const res = await fetch(url, options);
    if (res.status === 401 && !url.includes('/api/login') && !url.includes('/api/signup')) {
        const path = window.location.pathname;
        if (!path.endsWith('index.html') && path !== '/' && path !== '') {
            window.location.href = 'index.html';
        }
    }
    return res;
};

document.addEventListener('DOMContentLoaded', () => {

    // --- Language Selection Initialization ---
    const langSelect = document.getElementById('languageSelector');
    if (langSelect) {
        const currentLang = localStorage.getItem('preferredLang') || 'en';
        langSelect.value = currentLang;
        
        langSelect.addEventListener('change', function() {
            localStorage.setItem('preferredLang', this.value);
            if (window.lastRecommendationData) {
                displayRecommendation(window.lastRecommendationData);
            }
            if (window.lastYieldData) {
                displayYieldResult(window.lastYieldData.area, window.lastYieldData.crop);
            }
            if (window.lastScannedDiseaseData) {
                displayDiseaseResult(window.lastScannedDiseaseData, this.value);
            }
        });
    }

    // --- 0. Toast Notification System ---
    window.showNotification = function (message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-exclamation';
        toast.innerHTML = `<i class="fa-solid ${iconClass} toast-icon"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // --- 0.5 Notification Dropdown System ---
    const notifBell = document.getElementById('notificationBell');
    const notifDropdown = document.getElementById('notificationDropdown');
    const badge = document.getElementById('notificationBadge');

    if (notifBell && notifDropdown) {
        // Toggle dropdown
        notifBell.addEventListener('click', (e) => {
            if (e.target.classList.contains('clear-all')) return;
            notifDropdown.classList.toggle('open');
        });

        // Click outside closes it
        document.addEventListener('click', (e) => {
            if (!notifBell.contains(e.target)) {
                notifDropdown.classList.remove('open');
            }
        });

        // Global function to add notification
        window.addNotification = function (message, type = 'primary') {
            const list = document.getElementById('notificationList');
            if (!list) return;

            let iconHTML = '';
            if (type === 'success') iconHTML = '<i class="fa-solid fa-seedling"></i>';
            else if (type === 'warning') iconHTML = '<i class="fa-solid fa-virus"></i>';
            else if (type === 'info') iconHTML = '<i class="fa-solid fa-chart-line"></i>';
            else iconHTML = '<i class="fa-solid fa-indian-rupee-sign"></i>';

            const newItem = document.createElement('div');
            newItem.className = 'notif-item unread';
            newItem.innerHTML = `
                <div class="notif-icon ${type}">${iconHTML}</div>
                <div class="notif-content">
                    <p>${message}</p>
                    <span class="time">Just now</span>
                </div>
            `;

            const emptyState = list.querySelector('.empty-state-text');
            if (emptyState) emptyState.remove();

            list.insertBefore(newItem, list.firstChild);
            updateBadgeCount();
        };

        window.clearNotifications = function () {
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem;" class="empty-state-text">
                        No new notifications
                    </div>
                `;
                updateBadgeCount();
            }
        };

        function updateBadgeCount() {
            const list = document.getElementById('notificationList');
            const unreadItems = list.querySelectorAll('.notif-item.unread');
            if (badge) {
                badge.innerText = unreadItems.length;
                if (unreadItems.length === 0) {
                    badge.style.display = 'none';
                } else {
                    badge.style.display = 'flex';
                }
            }
        }
        updateBadgeCount();
    }

    // --- 1. Login Page Logic ---
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle Password Visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // Handle Login Submit
    if (loginForm) {
        // If we are on login page, clear old session
        localStorage.removeItem('isLoggedIn');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = passwordInput.value;

            // Button loading state
            const btn = loginForm.querySelector('.login-btn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
            btn.style.opacity = '0.8';

            try {
                if (typeof firebase === 'undefined') {
                    throw new Error("Firebase SDK is not loaded.");
                }

                // Log in directly with Firebase Authentication
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Retrieve user name from Firestore to save locally
                let displayName = email.split('@')[0];
                try {
                    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        displayName = userDoc.data().name || displayName;
                    } else {
                        // Create user document if it doesn't exist
                        await firebase.firestore().collection('users').doc(user.uid).set({
                            uid: user.uid,
                            name: displayName,
                            email: email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }
                } catch (dbErr) {
                    console.error("Firestore retrieve user failed:", dbErr);
                }

                localStorage.setItem('user', user.email);
                localStorage.setItem('userName', displayName);
                localStorage.setItem('justLoggedIn', 'true');

                window.showNotification("Login Successful. Redirecting...", "success");

                setTimeout(() => {
                    window.location.href = 'main_advisor.html';
                }, 1200);
            } catch (error) {
                console.error('Login Error:', error);
                let errMsg = "Invalid credentials.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errMsg = "Invalid email or password.";
                } else if (error.message) {
                    errMsg = error.message;
                }
                window.showNotification(errMsg, "error");
                btn.innerHTML = originalHtml;
                btn.style.opacity = '1';
            }
        });
    }

    // --- 1.1 Signup/Login Toggle ---
    const signupForm = document.getElementById('signupForm');
    const loginRedirect = document.getElementById('loginRedirect');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginHeading = document.querySelector('.login-form-container .welcome-text'); // Need to target specific one if not inside form

    if (showSignup && signupForm && loginForm) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hide');
            loginRedirect.classList.add('hide');
            signupForm.classList.remove('hide');
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.add('hide');
            loginForm.classList.remove('hide');
            loginRedirect.classList.remove('hide');
        });
    }

    // Handle Signup Submit
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullname = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            const btn = signupForm.querySelector('.signup-btn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;

            try {
                if (typeof firebase === 'undefined') {
                    throw new Error("Firebase SDK is not loaded.");
                }

                // Register user directly with Firebase Authentication
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Save user details directly to Firestore users collection
                await firebase.firestore().collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: fullname,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                window.showNotification("Account Created! Please Login.", "success");
                setTimeout(() => {
                    signupForm.classList.add('hide');
                    loginForm.classList.remove('hide');
                    loginRedirect.classList.remove('hide');
                }, 1500);
            } catch (error) {
                console.error("Firebase signup error:", error);
                let errMsg = "Signup failed.";
                if (error.code === 'auth/email-already-in-use') {
                    errMsg = "Email is already registered.";
                } else if (error.code === 'auth/weak-password') {
                    errMsg = "Password is too weak. Make sure it is at least 6 characters.";
                } else if (error.code === 'auth/invalid-email') {
                    errMsg = "Invalid email format.";
                } else if (error.message) {
                    errMsg = error.message;
                }
                window.showNotification(errMsg, "error");
                btn.innerHTML = originalHtml;
            }
        });
    }

    // --- 2. Dashboard Page Logic ---
    const isDashboard = document.querySelector('.dashboard-body');

    // Auto-redirect on login page index.html if user session is already active
    if (!isDashboard && typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                window.location.href = 'main_advisor.html';
            }
        });
    }

    if (isDashboard) {
        // --- Profile Modal & Form Handlers ---
        let reauthCallback = null;

        // Function to update profile UI components across the page
        function updateUserProfileUI(user, displayName) {
            localStorage.setItem('userName', displayName);
            localStorage.setItem('user', user.email);

            // Update topbar elements
            const userNameEl = document.querySelector('.user-profile .user-name');
            const avatarEl = document.querySelector('.user-profile .avatar');
            if (userNameEl) userNameEl.textContent = displayName;
            
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`;
            if (avatarEl) avatarEl.src = avatarUrl;

            // Update profile modal elements
            const largeAvatarEl = document.getElementById('profileLargeAvatar');
            if (largeAvatarEl) largeAvatarEl.src = avatarUrl;

            const summaryNameEl = document.getElementById('profileSummaryName');
            if (summaryNameEl) summaryNameEl.textContent = displayName;

            const summaryEmailEl = document.getElementById('profileSummaryEmail');
            if (summaryEmailEl) summaryEmailEl.textContent = user.email;

            const inputNameEl = document.getElementById('profileName');
            if (inputNameEl) inputNameEl.value = displayName;

            const inputEmailEl = document.getElementById('profileEmail');
            if (inputEmailEl) inputEmailEl.value = user.email;
        }

        // Firebase Auth Guard & Profile Loading
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (!user) {
                    window.location.href = 'index.html';
                } else {
                    let displayName = user.email.split('@')[0];

                    try {
                        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                        if (userDoc.exists && userDoc.data().name) {
                            displayName = userDoc.data().name;
                        }
                    } catch (err) {
                        console.error("Failed to load user name from Firestore:", err);
                    }

                    updateUserProfileUI(user, displayName);
                }
            });
        }

        if (localStorage.getItem('justLoggedIn') === 'true') {
            setTimeout(() => window.showNotification("Login Successful", "success"), 300);
            localStorage.removeItem('justLoggedIn');
        }

        // --- Live Location Detector ---
        window.detectLocation = function () {
            const locationInput = document.getElementById('crop_location');

            if (!navigator.geolocation) {
                window.showNotification("Geolocation is not supported by your browser", "error");
                return;
            }

            window.showNotification("Detecting your location...", "info");

            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    // Using OpenStreetMap's free reverse geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
                    const data = await response.json();

                    if (data && data.address) {
                        const city = data.address.city || "";
                        const town = data.address.town || "";
                        const village = data.address.village || "";
                        const county = data.address.county || "";
                        const district = data.address.district || "";
                        const state_district = data.address.state_district || "";
                        
                        const addressString = `${city} ${town} ${village} ${county} ${district} ${state_district}`.toLowerCase();
                        
                        const options = Array.from(locationInput.options);
                        const match = options.find(opt => addressString.includes(opt.value.toLowerCase()));
                        
                        if (match) {
                            locationInput.value = match.value;
                            window.showNotification(`Detected location: ${match.value}`, "success");
                            
                            // --- Automatic Soil Analysis based on Location ---
                            try {
                                const soilRes = await apiFetch(`${API_BASE_URL}/api/get-soil-info`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ location: locationInput.value })
                                });
                                const soilData = await soilRes.json();
                                if (soilData.status === 'success') {
                                    const soilDropdown = document.getElementById('crop_soil_type');
                                    if (soilDropdown) {
                                        const soilOptions = Array.from(soilDropdown.options);
                                        const soilMatch = soilOptions.find(opt => opt.value === soilData.soil_type);
                                        if (soilMatch) {
                                            soilDropdown.value = soilData.soil_type;
                                            window.showNotification(`Detected ${soilData.soil_type} for your region`, "info");
                                        }
                                    }
                                } else {
                                    window.showNotification(soilData.message || "Could not retrieve soil info for detected location.", "error");
                                }
                            } catch (soilErr) {
                                window.showNotification("Could not retrieve soil info for detected location.", "error");
                            }
                        } else {
                            window.showNotification(`Could not match detected location to a supported district: ${city || county || "Unknown"}`, "warning");
                        }
                    } else {
                        window.showNotification("Address service failed to find a valid location.", "error");
                    }
                } catch (e) {
                    window.showNotification("Error detecting location due to network error.", "error");
                }
            }, (error) => {
                window.showNotification("Location access denied. Please select manually.", "error");
            });
        };

        // --- Navigation Logic ---
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        const sections = document.querySelectorAll('.view-section');
        const imageCards = document.querySelectorAll('.image-card[data-navigate]');
        const pageTitle = document.getElementById('pageTitle');

        const mapTitle = {
            'dashboard-home': 'Dashboard Overview',
            'crop-recommendation': 'Crop Recommendation AI',
            'yield-prediction': 'Yield Prediction Tool',
            'disease-detection': 'Disease Diagnosis',
            'market-prices': 'Live Market Prices'
        };

        const hashMap = {
            '#dashboard': 'dashboard-home',
            '#crop': 'crop-recommendation',
            '#yield': 'yield-prediction',
            '#disease': 'disease-detection',
            '#market': 'market-prices'
        };

        const sectionToHashMap = {
            'dashboard-home': '#dashboard',
            'crop-recommendation': '#crop',
            'yield-prediction': '#yield',
            'disease-detection': '#disease',
            'market-prices': '#market'
        };

        function activateSection(targetId) {
            // Remove active from links
            navLinks.forEach(link => link.classList.remove('active'));

            // Find target link and set active
            const activeLink = Array.from(navLinks).find(l => l.getAttribute('data-target') === targetId);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            // Hide all sections
            sections.forEach(sec => sec.classList.remove('active'));

            // Show target section
            const targetSec = document.getElementById(targetId);
            if (targetSec) {
                targetSec.classList.add('active');
                if (pageTitle) pageTitle.textContent = mapTitle[targetId];
            }

            // Trigger market prices loading if needed
            if (targetId === 'market-prices') {
                window.loadMarketPrices();
                window.updateChart();
            }
        }

        function handleHashNavigation() {
            let hash = window.location.hash;
            if (!hash) {
                hash = '#dashboard';
                history.replaceState(null, '', hash);
            }
            const sectionId = hashMap[hash] || 'dashboard-home';
            activateSection(sectionId);
        }

        // Listen to browser navigation changes
        window.addEventListener('popstate', () => {
            handleHashNavigation();
        });

        // Initialize hash navigation on page load
        handleHashNavigation();

        // Sidebar clicks
        navLinks.forEach(link => {
            if (link.id === 'logoutBtn') return; // skip logout
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-target');
                const hash = sectionToHashMap[target];
                if (hash) {
                    history.pushState(null, '', hash);
                    handleHashNavigation();
                }
            });
        });

        // Image Card clicks
        imageCards.forEach(card => {
            card.addEventListener('click', () => {
                const target = card.getAttribute('data-navigate');
                const hash = sectionToHashMap[target];
                if (hash) {
                    history.pushState(null, '', hash);
                    handleHashNavigation();
                }
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    if (typeof firebase !== 'undefined') {
                        await firebase.auth().signOut();
                    }
                } catch (err) {
                    console.error("Firebase sign out failed:", err);
                }
                localStorage.clear();
                window.location.href = 'index.html';
            });
        }

        // --- Profile Modal Toggles and Handlers ---
        const userProfileBtn = document.querySelector('.user-profile');
        const profileModal = document.getElementById('profileModal');
        const closeProfileModalBtn = document.getElementById('closeProfileModal');

        if (userProfileBtn && profileModal) {
            userProfileBtn.addEventListener('click', () => {
                profileModal.classList.remove('hide');
                resetProfileDetailsFormState();
                
                const user = firebase.auth().currentUser;
                if (user) {
                    const currentName = localStorage.getItem('userName') || user.email.split('@')[0];
                    updateUserProfileUI(user, currentName);
                }
            });
        }

        if (closeProfileModalBtn && profileModal) {
            closeProfileModalBtn.addEventListener('click', () => {
                profileModal.classList.add('hide');
            });
        }

        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    profileModal.classList.add('hide');
                }
            });
        }

        // Profile Tab switching
        const tabBtns = document.querySelectorAll('.profile-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tabName = btn.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                const activeTab = document.getElementById(`tab-${tabName}`);
                if (activeTab) activeTab.classList.add('active');
            });
        });

        // Edit Profile controls
        const editProfileBtn = document.getElementById('editProfileBtn');
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const profileNameInput = document.getElementById('profileName');
        const profileEmailInput = document.getElementById('profileEmail');

        function resetProfileDetailsFormState() {
            if (profileNameInput) profileNameInput.disabled = true;
            if (profileEmailInput) profileEmailInput.disabled = true;
            if (editProfileBtn) editProfileBtn.classList.remove('hide');
            if (saveProfileBtn) saveProfileBtn.classList.add('hide');
            if (cancelEditBtn) cancelEditBtn.classList.add('hide');
        }

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                if (profileNameInput) profileNameInput.disabled = false;
                if (profileEmailInput) profileEmailInput.disabled = false;
                editProfileBtn.classList.add('hide');
                if (saveProfileBtn) saveProfileBtn.classList.remove('hide');
                if (cancelEditBtn) cancelEditBtn.classList.remove('hide');
            });
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                resetProfileDetailsFormState();
                const user = firebase.auth().currentUser;
                if (user) {
                    const currentName = localStorage.getItem('userName') || user.email.split('@')[0];
                    if (profileNameInput) profileNameInput.value = currentName;
                    if (profileEmailInput) profileEmailInput.value = user.email;
                }
            });
        }

        // Submit Profile Details
        const profileDetailsForm = document.getElementById('profileDetailsForm');
        if (profileDetailsForm) {
            profileDetailsForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const user = firebase.auth().currentUser;
                if (!user) return;

                const newName = profileNameInput.value.trim();
                const newEmail = profileEmailInput.value.trim();

                if (!newName) {
                    window.showNotification("Full Name cannot be empty.", "error");
                    return;
                }
                if (!newEmail) {
                    window.showNotification("Email Address cannot be empty.", "error");
                    return;
                }

                const originalName = localStorage.getItem('userName') || user.email.split('@')[0];
                const originalEmail = user.email;

                if (newName === originalName && newEmail === originalEmail) {
                    window.showNotification("No changes detected.", "info");
                    resetProfileDetailsFormState();
                    return;
                }

                const updateFirestoreAndUI = async (updatedEmail = user.email) => {
                    const btn = document.getElementById('saveProfileBtn');
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
                    btn.disabled = true;

                    try {
                        await firebase.firestore().collection('users').doc(user.uid).set({
                            name: newName,
                            email: updatedEmail
                        }, { merge: true });

                        updateUserProfileUI(user, newName);
                        window.showNotification("Profile updated successfully!", "success");
                        resetProfileDetailsFormState();
                    } catch (err) {
                        console.error("Error updating Firestore details:", err);
                        window.showNotification(err.message || "Failed to update profile details.", "error");
                    } finally {
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    }
                };

                if (newEmail !== originalEmail) {
                    openReauthModal(async () => {
                        const btn = document.getElementById('saveProfileBtn');
                        const originalHtml = btn.innerHTML;
                        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating email...`;
                        btn.disabled = true;

                        try {
                            await user.updateEmail(newEmail);
                            await updateFirestoreAndUI(newEmail);
                        } catch (err) {
                            console.error("Failed to update email in Firebase Auth:", err);
                            let errMsg = err.message || "Failed to update email address.";
                            if (err.code === 'auth/requires-recent-login') {
                                errMsg = "Please re-authenticate again to complete this sensitive operation.";
                            }
                            window.showNotification(errMsg, "error");
                        } finally {
                            btn.innerHTML = originalHtml;
                            btn.disabled = false;
                        }
                    });
                } else {
                    await updateFirestoreAndUI();
                }
            });
        }

        // Change Password Handler
        const changePasswordForm = document.getElementById('changePasswordForm');
        const newPasswordInput = document.getElementById('profileNewPassword');
        const confirmPasswordInput = document.getElementById('profileConfirmPassword');

        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const user = firebase.auth().currentUser;
                if (!user) return;

                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                if (!newPassword || newPassword.length < 6) {
                    window.showNotification("Password must be at least 6 characters.", "error");
                    return;
                }

                if (newPassword !== confirmPassword) {
                    window.showNotification("Passwords do not match.", "error");
                    return;
                }

                openReauthModal(async () => {
                    const btn = document.getElementById('savePasswordBtn');
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;
                    btn.disabled = true;

                    try {
                        await user.updatePassword(newPassword);
                        window.showNotification("Password updated successfully!", "success");
                        newPasswordInput.value = '';
                        confirmPasswordInput.value = '';
                    } catch (err) {
                        console.error("Failed to update password in Firebase Auth:", err);
                        window.showNotification(err.message || "Failed to update password.", "error");
                    } finally {
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    }
                });
            });
        }

        // Re-authentication modal
        const reauthModal = document.getElementById('reauthModal');
        const reauthForm = document.getElementById('reauthForm');
        const reauthPasswordInput = document.getElementById('reauthPassword');
        const closeReauthModalBtn = document.getElementById('closeReauthModal');

        function openReauthModal(successCallback) {
            reauthCallback = successCallback;
            if (reauthPasswordInput) reauthPasswordInput.value = '';
            if (reauthModal) reauthModal.classList.remove('hide');
        }

        if (closeReauthModalBtn && reauthModal) {
            closeReauthModalBtn.addEventListener('click', () => {
                reauthModal.classList.add('hide');
                reauthCallback = null;
            });
        }

        if (reauthModal) {
            reauthModal.addEventListener('click', (e) => {
                if (e.target === reauthModal) {
                    reauthModal.classList.add('hide');
                    reauthCallback = null;
                }
            });
        }

        if (reauthForm) {
            reauthForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = reauthPasswordInput.value;
                if (!password) {
                    window.showNotification("Password is required.", "error");
                    return;
                }

                const user = firebase.auth().currentUser;
                if (!user) return;

                const submitBtn = document.getElementById('reauthSubmitBtn');
                const originalHtml = submitBtn.innerHTML;
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
                submitBtn.disabled = true;

                try {
                    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
                    await user.reauthenticateWithCredential(credential);
                    
                    reauthModal.classList.add('hide');
                    if (reauthCallback) {
                        const callback = reauthCallback;
                        reauthCallback = null;
                        await callback();
                    }
                } catch (err) {
                    console.error("Re-authentication failed:", err);
                    let errMsg = "Incorrect password. Please try again.";
                    if (err.message) errMsg = err.message;
                    window.showNotification(errMsg, "error");
                } finally {
                    submitBtn.innerHTML = originalHtml;
                    submitBtn.disabled = false;
                }
            });
        }

        // Toggle passwords eye visibility
        const setupPasswordToggle = (toggleId, inputId) => {
            const toggle = document.getElementById(toggleId);
            const input = document.getElementById(inputId);
            if (toggle && input) {
                toggle.addEventListener('click', () => {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    toggle.classList.toggle('fa-eye');
                    toggle.classList.toggle('fa-eye-slash');
                });
            }
        };

        setupPasswordToggle('toggleNewPassword', 'profileNewPassword');
        setupPasswordToggle('toggleConfirmPassword', 'profileConfirmPassword');
        setupPasswordToggle('toggleReauthPassword', 'reauthPassword');


        // --- Disease Image Upload Logic ---
        const uploadArea = document.getElementById('uploadArea');
        const diseaseImageInput = document.getElementById('diseaseImage');
        const previewContainer = document.getElementById('previewContainer');
        const imagePreview = document.getElementById('imagePreview');

        if (uploadArea && diseaseImageInput) {

            // Drag over effects
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--primary)';
                uploadArea.style.background = 'var(--primary-light)';
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--border)';
                uploadArea.style.background = '#FAFAFA';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--border)';
                uploadArea.style.background = '#FAFAFA';

                if (e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                }
            });

            diseaseImageInput.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    handleFileSelect(this.files[0]);
                }
            });

            function handleFileSelect(file) {
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    uploadArea.classList.add('hide');
                    previewContainer.classList.remove('hide');

                    window.showNotification("Image uploaded successfully", "success");

                    // Reset result panel
                    document.getElementById('diseaseResult').innerHTML = `
                        <i class="fa-solid fa-microscope"></i>
                        <p>Image loaded. Ready for scan.</p>
                    `;
                    document.getElementById('diseaseResult').className = 'empty-state';
                };
                reader.readAsDataURL(file);
            }

            window.clearPreview = function () {
                diseaseImageInput.value = '';
                imagePreview.src = '';
                uploadArea.classList.remove('hide');
                previewContainer.classList.add('hide');
                document.getElementById('diseaseResult').innerHTML = `
                    <i class="fa-solid fa-microscope"></i>
                    <p>Upload an image for diagnosis...</p>
                `;
                document.getElementById('diseaseResult').className = 'empty-state';
            }
        }
    }
});

// --- Market Table Filter ---
let marketSearchTimeout = null;

function saveMarketSearchToFirestore(district, crop) {
    if (marketSearchTimeout) {
        clearTimeout(marketSearchTimeout);
    }
    marketSearchTimeout = setTimeout(async () => {
        try {
            if (typeof firebase !== 'undefined') {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    const searchInputVal = document.getElementById("marketSearchInput")?.value || "";
                    if (district === "All" && crop === "All" && !searchInputVal.trim()) {
                        return;
                    }
                    await firebase.firestore().collection('market_searches').add({
                        userEmail: currentUser.email,
                        district: district,
                        crop: crop,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        } catch (err) {
            console.error("Firestore error saving market search:", err);
        }
    }, 1500);
}

window.filterMarketTable = function () {
    const searchFilter = document.getElementById("marketSearchInput")?.value.toLowerCase() || "";
    const districtFilter = document.getElementById("marketDistrictFilter")?.value || "All";
    const cropFilter = document.getElementById("marketCropFilter")?.value || "All";

    const table = document.getElementById("marketTableBody");
    if (!table) return;
    const tr = table.getElementsByTagName("tr");

    for (let i = 0; i < tr.length; i++) {
        // Skip error or loading rows
        if (tr[i].classList.contains('loading-row') || tr[i].cells.length < 2) continue;

        const rowCrop = tr[i].getAttribute('data-crop');
        const rowDistrict = tr[i].getAttribute('data-district');
        const tdName = tr[i].getElementsByTagName("td")[0];
        const tdMandi = tr[i].getElementsByTagName("td")[1];

        const txtValueName = tdName ? (tdName.textContent || tdName.innerText).toLowerCase() : "";
        const txtValueMandi = tdMandi ? (tdMandi.textContent || tdMandi.innerText).toLowerCase() : "";

        const matchesSearch = txtValueName.includes(searchFilter) || txtValueMandi.includes(searchFilter);
        const matchesDistrict = districtFilter === "All" || rowDistrict === districtFilter || txtValueMandi.includes(districtFilter.toLowerCase());
        const matchesCrop = cropFilter === "All" || rowCrop === cropFilter;

        if (matchesSearch && matchesDistrict && matchesCrop) {
            tr[i].style.display = "";
        } else {
            tr[i].style.display = "none";
        }
    }

    // Auto-update chart if crop filter changes
    const chartCrop = document.getElementById('chartCropSelector');
    if (chartCrop && cropFilter !== "All" && chartCrop.value !== cropFilter) {
        chartCrop.value = cropFilter;
        window.updateChart();
    }

    // Save search parameters to Firestore
    saveMarketSearchToFirestore(districtFilter, cropFilter);
};

// --- Market Price Fetcher & Live Updates ---
let previousPrices = {};
let isFetchingMarketPrices = false;
let isOn429Cooldown = false;
let hasShown429Warning = false;

window.loadMarketPrices = async function (isTickerOnly = false) {
    // 1. Prevent concurrent fetches
    if (isFetchingMarketPrices) {
        return;
    }

    // 2. Prevent API calls when page is hidden/inactive
    if (document.hidden || document.visibilityState === 'hidden') {
        return;
    }

    // 3. Prevent calls during 429 cooldown
    if (isOn429Cooldown) {
        return;
    }

    const tableBody = document.getElementById('marketTableBody');
    const tickerEl = document.getElementById('liveTicker');

    isFetchingMarketPrices = true;
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/market-prices`);
        
        // 4. Handle 429 Rate Limit
        if (response.status === 429) {
            isOn429Cooldown = true;
            setTimeout(() => {
                isOn429Cooldown = false;
            }, 30000);

            if (!hasShown429Warning) {
                window.showNotification("Too many requests. Pausing updates for 30 seconds.", "warning");
                hasShown429Warning = true;
            }

            if (tickerEl && (tickerEl.innerText.includes("Fetching live market data") || tickerEl.innerText.trim() === "")) {
                tickerEl.innerHTML = `<span class="ticker-item" style="color:var(--warning);">Rate limit exceeded. Waiting 30s...</span>`;
            }

            if (!isTickerOnly && tableBody && tableBody.querySelector('.loading-row')) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--warning); padding: 20px;">Rate limit exceeded. Retrying in 30 seconds...</td></tr>`;
            }
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success') {
            // Reset warning flag on success
            hasShown429Warning = false;

            // Update Ticker - Only show first 20 items to avoid freezing DOM
            if (tickerEl) {
                tickerEl.innerHTML = window.DOMPurify.sanitize(data.prices.slice(0, 20).map(item => `
                    <span class="ticker-item">
                        ${item.name} (${item.mandi}): 
                        <span class="ticker-price">₹${item.price.toLocaleString('en-IN')}</span> 
                        <span class="ticker-trend ${item.status === 'up' ? 'trend-up' : 'trend-down'}">
                            ${item.status === 'up' ? '▲' : '▼'} ${item.trend}
                        </span>
                    </span>
                `).join(''));
            }

            // Update Table
            if (!isTickerOnly && tableBody) {
                if (tableBody.querySelector('.loading-row')) tableBody.innerHTML = '';

                // Populate Dropdowns if empty
                const districtFilter = document.getElementById('marketDistrictFilter');
                const cropFilter = document.getElementById('marketCropFilter');

                if (districtFilter && districtFilter.options.length <= 1) {
                    const uniqueDistricts = [...new Set(data.prices.map(item => item.district))].sort();
                    uniqueDistricts.forEach(d => {
                        const opt = document.createElement('option');
                        opt.value = d;
                        opt.textContent = d;
                        districtFilter.appendChild(opt);
                    });
                }
                if (cropFilter && cropFilter.options.length <= 1) {
                    const uniqueCrops = [...new Set(data.prices.map(item => item.name))].sort();
                    uniqueCrops.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c;
                        opt.textContent = c;
                        cropFilter.appendChild(opt);
                    });
                }

                data.prices.forEach(item => {
                    const key = `${item.name}-${item.mandi}`.replace(/\s+/g, '-');
                    const trendIcon = item.status === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                    const trendClass = item.status === 'up' ? 'trend-up' : 'trend-down';

                    let flashClass = '';
                    if (previousPrices[key] && previousPrices[key] !== item.price) {
                        flashClass = item.price > previousPrices[key] ? 'flash-up' : 'flash-down';
                    }
                    previousPrices[key] = item.price;

                    let row = document.getElementById(`row-${key}`);
                    if (!row) {
                        row = document.createElement('tr');
                        row.id = `row-${key}`;
                        row.setAttribute('data-district', item.district || item.mandi);
                        row.setAttribute('data-crop', item.name);
                        tableBody.appendChild(row);
                    }

                    row.className = flashClass;
                    row.innerHTML = `
                        <td><strong>${window.DOMPurify.sanitize(item.name)}</strong></td>
                        <td>${window.DOMPurify.sanitize(item.district || item.mandi)}</td>
                        <td>${window.DOMPurify.sanitize(item.mandi)}</td>
                        <td style="color: var(--text-muted)">₹ ${item.min.toLocaleString('en-IN')}</td>
                        <td style="color: var(--text-muted)">₹ ${item.max.toLocaleString('en-IN')}</td>
                        <td style="font-weight: 600; color: var(--secondary)">₹ ${item.price.toLocaleString('en-IN')}</td>
                        <td class="${trendClass}"><i class="fa-solid ${trendIcon}"></i> ${item.trend}</td>
                    `;
                });

                // Re-apply filter after data load
                window.filterMarketTable();
            }
        }
    } catch (e) {
        console.error("Live update failed", e);
        if (!isTickerOnly && tableBody && tableBody.querySelector('.loading-row')) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red; padding: 20px;">Failed to load market data. Please try again later.</td></tr>`;
        }
        if (tickerEl && tickerEl.innerText.includes("Fetching live market data")) {
            tickerEl.innerHTML = `<span class="ticker-item" style="color:red;">Market data currently unavailable.</span>`;
        }
    } finally {
        isFetchingMarketPrices = false;
    }
};

// Start Auto-Updates - Merged into a single 30s interval with visibility check (only runs on dashboard)
setInterval(() => {
    if (document.querySelector('.dashboard-body')) {
        const isTableActive = !!document.querySelector('#market-prices.active');
        window.loadMarketPrices(!isTableActive);
    }
}, 30000);

// Initial Load (only runs on dashboard)
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard-body')) {
        window.loadMarketPrices(true);
    }
});

// --- Chart.js Configuration ---
let priceChart = null;

window.updateChart = async function () {
    const crop = document.getElementById('chartCropSelector').value;
    const ctx = document.getElementById('priceHistoryChart').getContext('2d');

    try {
        const response = await apiFetch(`${API_BASE_URL}/api/historical-trends?crop=${crop}`);
        const data = await response.json();

        if (data.status === 'success') {
            if (priceChart) priceChart.destroy();

            priceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: `${crop} Price (₹/Quintal)`,
                        data: data.data,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: '#f3f4f6' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    } catch (e) {
        console.error("Chart load failed", e);
    }
};

// --- Feature Action Functions (Global Scope for inline) ---

function getSoilDisplayName(soil, lang) {
    const map = {
        "Black Soil": { en: "Black Soil", ta: "கருப்பு மண்" },
        "Red Soil": { en: "Red Soil", ta: "செம்மண்" },
        "Sandy Soil": { en: "Sandy Soil", ta: "மணல் மண்" },
        "Clay Soil": { en: "Clay Soil", ta: "களிமண்" },
        "Loamy Soil": { en: "Loamy Soil", ta: "வண்டல் மண்" }
    };
    const s = map[soil] || { en: soil, ta: soil };
    return lang === 'ta' ? s.ta : s.en;
}

function getSeasonDisplayName(season, lang) {
    const map = {
        "Rainy": { en: "Kharif Season", ta: "காரிப் பருவம்" },
        "Winter": { en: "Rabi Season", ta: "ராபி பருவம்" },
        "Summer": { en: "Summer Season", ta: "கோடை பருவம்" }
    };
    const s = map[season] || { en: season, ta: season };
    return lang === 'ta' ? s.ta : s.en;
}

function getWeatherDisplayName(weather, lang) {
    const map = {
        "Sunny": { en: "Sunny", ta: "வெயிலான வானிலை" },
        "Cloudy": { en: "Cloudy", ta: "மேகமூட்டமான வானிலை" },
        "Rainy": { en: "Rainy", ta: "மழைக்காலம்" },
        "Humid": { en: "Humid", ta: "ஈரப்பதம்" }
    };
    const w = map[weather] || { en: weather, ta: weather };
    return lang === 'ta' ? w.ta : w.en;
}

function detectParametersFromLocation(loc) {
    const l = (loc || "").toLowerCase();
    
    let soil = "Red Soil";
    let season = "Rainy";
    let weather = "Sunny";

    if (l.includes("thanjavur") || l.includes("tiruvarur") || l.includes("cuddalore") || l.includes("nagapattinam") || l.includes("mayiladuthurai") || l.includes("trichy") || l.includes("tiruchirappalli")) {
        soil = "Loamy Soil";
    } else if (l.includes("coimbatore") || l.includes("tiruppur") || l.includes("erode") || l.includes("salem") || l.includes("perambalur") || l.includes("karur")) {
        soil = "Black Soil";
    } else if (l.includes("dharmapuri") || l.includes("krishnagiri") || l.includes("thoothukudi") || l.includes("ramanathapuram")) {
        soil = "Sandy Soil";
    } else if (l.includes("madurai") || l.includes("dindigul") || l.includes("theni") || l.includes("kanchipuram") || l.includes("tirunelveli")) {
        soil = "Clay Soil";
    } else {
        soil = "Red Soil";
    }

    if (l.includes("nilgiris") || l.includes("kanniyakumari") || l.includes("tenkasi")) {
        weather = "Rainy";
    } else if (l.includes("chennai") || l.includes("madurai") || l.includes("thoothukudi") || l.includes("ramanathapuram") || l.includes("virudhunagar")) {
        weather = "Sunny";
    } else if (l.includes("coimbatore") || l.includes("dindigul") || l.includes("theni")) {
        weather = "Cloudy";
    } else {
        weather = "Humid";
    }

    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) {
        season = "Rainy";
    } else if (month >= 9 || month <= 1) {
        season = "Winter";
    } else {
        season = "Summer";
    }

    return { soil, season, weather };
}

function runLocalRecommendation(params, loc) {
    const soil = params.soil || "Red Soil";
    const season = params.season || "Rainy";
    const water = params.water || "Medium";
    const fertility = params.health || "Average";
    const weather = params.weather || "Sunny";
    const location = (loc || "").toLowerCase();

    const CROPS_DB = [
        {
            name: { en: "Groundnut", ta: "நிலக்கடலை" },
            soil: ["Red Soil", "Sandy Soil", "Loamy Soil"],
            season: ["Rainy", "Winter"],
            water: ["Medium", "High"],
            fertility: ["Average", "Rich"],
            weather: ["Sunny", "Humid"],
            preferredDistricts: ["thanjavur", "erode", "cuddalore", "tiruppur", "salem", "ariyalur", "viluppuram", "tiruvannamalai"],
            baseYield: 1.8,
            basePrice: 6500,
            reasoning: {
                en: "Warm climate, well-drained sandy loamy soils, and moderate water are perfect for Groundnut cultivation.",
                ta: "வெப்பமான காலநிலை, வடிகால் வசதியுள்ள மணல் வண்டல் மண் மற்றும் மிதமான நீர் நிலக்கடலை சாகுபடிக்கு உகந்தது."
            },
            expertTip: {
                en: "Apply gypsum at 200 kg/acre on the 45th day after sowing for better pod filling.",
                ta: "பயிர்கள் நன்கு காய்பிடிக்க விதைத்த 45-வது நாளில் ஏக்கருக்கு 200 கிலோ ஜிப்சம் இடவும்."
            }
        },
        {
            name: { en: "Sesame", ta: "எள்" },
            soil: ["Sandy Soil", "Red Soil"],
            season: ["Summer", "Rainy"],
            water: ["Low", "Medium"],
            fertility: ["Poor", "Average"],
            weather: ["Sunny"],
            preferredDistricts: ["villupuram", "cuddalore", "erode", "karur", "thanjavur", "tiruvarur", "pudukkottai"],
            baseYield: 0.6,
            basePrice: 12500,
            reasoning: {
                en: "Sesame is highly drought-tolerant and performs best in light sandy soils with hot climates.",
                ta: "எள் வறட்சியைத் தாங்கக்கூடியது மற்றும் வெப்பமான காலநிலையில் மணற்பாங்கான நிலங்களில் சிறப்பாக வளரும்."
            },
            expertTip: {
                en: "Avoid water stagnation at any cost as sesame is highly sensitive to excess water.",
                ta: "எள் பயிர் அதிக தண்ணீரைத் தாங்காது என்பதால் வயலில் நீர் தேங்குவதை முற்றிலும் தவிர்க்கவும்."
            }
        },
        {
            name: { en: "Mustard", ta: "கடுகு" },
            soil: ["Loamy Soil", "Clay Soil"],
            season: ["Winter"],
            water: ["Low", "Medium"],
            fertility: ["Average", "Rich"],
            weather: ["Cloudy", "Humid"],
            preferredDistricts: ["nilgiris", "dindigul", "theni", "coimbatore", "krishnagiri"],
            baseYield: 1.2,
            basePrice: 5400,
            reasoning: {
                en: "Cool weather during winter and clay/loamy soil provide the ideal environment for Mustard.",
                ta: "குளிர்காலத்தின் குளிர்ந்த வானிலை மற்றும் களிமண் அல்லது வண்டல் மண் கடுகு சாகுபடிக்கு ஏற்றது."
            },
            expertTip: {
                en: "Maintain optimum plant population by thinning 15 days after sowing.",
                ta: "விதைத்த 15 நாட்களில் அடர்த்தியைக் குறைத்து சரியான பயிர் எண்ணிக்கையைப் பராமரிக்கவும்."
            }
        },
        {
            name: { en: "Soybean", ta: "சோயாபீன்ஸ்" },
            soil: ["Black Soil", "Loamy Soil"],
            season: ["Rainy"],
            water: ["High", "Medium"],
            fertility: ["Average", "Rich"],
            weather: ["Rainy", "Cloudy"],
            preferredDistricts: ["coimbatore", "erode", "salem", "tiruppur", "namakkal"],
            baseYield: 2.2,
            basePrice: 4800,
            reasoning: {
                en: "Soybean thrives in fertile black soils with high organic matter and regular moisture.",
                ta: "அதிக மட்கு மற்றும் வழக்கமான ஈரப்பதம் கொண்ட வளமான கருப்பு மண்ணில் சோயாபீன்ஸ் செழித்து வளரும்."
            },
            expertTip: {
                en: "Inoculate seeds with Rhizobium culture before sowing to enhance nitrogen fixation.",
                ta: "விதைப்பதற்கு முன் ரைசோபியம் கொண்டு விதை நேர்த்தி செய்வதன் மூலம் தழைச்சத்து நிலைநிறுத்தலை அதிகரிக்கலாம்."
            }
        },
        {
            name: { en: "Sunflower", ta: "சூரியகாந்தி" },
            soil: ["Black Soil", "Red Soil", "Loamy Soil"],
            season: ["Summer", "Rainy", "Winter"],
            water: ["Medium", "High"],
            fertility: ["Average", "Rich"],
            weather: ["Sunny"],
            preferredDistricts: ["karur", "trichy", "dindigul", "tirunelveli", "thoothukudi", "virudhunagar"],
            baseYield: 1.5,
            basePrice: 5800,
            reasoning: {
                en: "Sunflower is highly versatile and grows well in various soils under bright sunny conditions.",
                ta: "சூரியகாந்தி மிகவும் பல்துறை வாய்ந்தது மற்றும் பிரகாசமான வெயில் நிலையில் பல்வேறு மண்ணில் நன்கு வளரும்."
            },
            expertTip: {
                en: "Hand pollination on flower heads during peak flowering increases seed set.",
                ta: "பூக்கும் தருணத்தில் கைகளால் மகரந்தச் சேர்க்கை செய்வதன் மூலம் காய் பிடிக்கும் விகிதத்தை அதிகரிக்கலாம்."
            }
        },
        {
            name: { en: "Safflower", ta: "காசுமலர்" },
            soil: ["Black Soil", "Clay Soil"],
            season: ["Winter"],
            water: ["Low", "Medium"],
            fertility: ["Average", "Rich"],
            weather: ["Cloudy", "Sunny"],
            preferredDistricts: ["virudhunagar", "thoothukudi", "tirunelveli", "dharmapuri"],
            baseYield: 0.9,
            basePrice: 5600,
            reasoning: {
                en: "Deep black clayey soils with moisture-retention capacity are ideal for Safflower.",
                ta: "ஈரப்பதத்தை தக்கவைக்கும் திறன் கொண்ட ஆழமான கரிசல் மண் காசுமலர் சாகுபடிக்கு உகந்தது."
            },
            expertTip: {
                en: "Use row spacing of 45cm to allow plants to branch and produce more flower heads.",
                ta: "செடிகள் பக்கவாட்டில் கிளைத்து அதிக பூக்களை உருவாக்க 45 செ.மீ வரிசை இடைவெளியைப் பயன்படுத்தவும்."
            }
        },
        {
            name: { en: "Niger seed", ta: "உச்செள்ளு" },
            soil: ["Red Soil", "Sandy Soil"],
            season: ["Rainy"],
            water: ["Low"],
            fertility: ["Poor", "Average"],
            weather: ["Rainy", "Cloudy"],
            preferredDistricts: ["dharmapuri", "krishnagiri", "nilgiris", "vellore"],
            baseYield: 0.5,
            basePrice: 7200,
            reasoning: {
                en: "Niger seed grows well on poor, marginal soils and hilly terrains with minimal water supply.",
                ta: "உச்செள்ளு வளமற்ற, ஓரளவு தரிசு நிலங்களிலும் மற்றும் குறைந்த நீர் வழங்கல் கொண்ட மலைப்பாங்கான பகுதிகளிலும் நன்கு வளரும்."
            },
            expertTip: {
                en: "Beekeeping near niger fields can double pollination rates and dramatically increase yield.",
                ta: "உச்செள்ளு வயல்களுக்கு அருகில் தேனீ வளர்ப்பது மகரந்தச் சேர்க்கையை இரட்டிப்பாக்கி மகசூலை அதிகரிக்கும்."
            }
        },
        {
            name: { en: "Castor seed", ta: "ஆமணக்கு" },
            soil: ["Sandy Soil", "Red Soil", "Clay Soil", "Loamy Soil"],
            season: ["Rainy", "Winter"],
            water: ["Low", "Medium", "High"],
            fertility: ["Average", "Rich"],
            weather: ["Sunny", "Humid"],
            preferredDistricts: ["namakkal", "salem", "dharmapuri", "tiruchirappalli", "perambalur"],
            baseYield: 1.4,
            basePrice: 7000,
            reasoning: {
                en: "Castor is a sturdy crop adaptable to a wide range of soils and thrives under bright sunlight.",
                ta: "ஆமணக்கு பல்வேறு மண் வகைகளுக்கு ஏற்ற ஒரு வலுவான பயிராகும் மற்றும் பிரகாசமான சூரிய ஒளியில் செழித்து வளரும்."
            },
            expertTip: {
                en: "Nip the primary spikes early to encourage secondary branch development and spike production.",
                ta: "பக்கவாட்டுக் கிளைகள் மற்றும் அதிக கதிர்கள் உருவாவதை ஊக்குவிக்க முதன்மைக் கதிர்களை ஆரம்பத்திலேயே கிள்ளவும்."
            }
        },
        {
            name: { en: "Linseed", ta: "ஆளிவிதை" },
            soil: ["Clay Soil", "Black Soil", "Loamy Soil"],
            season: ["Winter"],
            water: ["Medium", "High"],
            fertility: ["Rich"],
            weather: ["Humid", "Cloudy"],
            preferredDistricts: ["nilgiris", "dindigul", "theni", "coimbatore"],
            baseYield: 1.0,
            basePrice: 6200,
            reasoning: {
                en: "Linseed requires cool climates, high fertile clayey soils, and regular moisture availability.",
                ta: "ஆளிவிதைக்கு குளிர்ந்த காலநிலை, அதிக வளமான களிமண் மற்றும் வழக்கமான ஈரப்பதம் தேவைப்படுகிறது."
            },
            expertTip: {
                en: "Ensure moisture availability during the flowering and seed development stages to avoid seed shrivelling.",
                ta: "விதை சுருங்குவதைத் தவிர்க்க பூக்கும் மற்றும் விதை உருவாகும் நிலைகளில் ஈரப்பதத்தை உறுதி செய்யவும்."
            }
        }
    ];

    const scoredCrops = CROPS_DB.map(crop => {
        let score = 40;

        // Soil match
        if (crop.soil.includes(soil)) {
            score += 10;
        } else {
            score += 2;
        }

        // Season match
        if (crop.season.includes(season)) {
            score += 10;
        } else {
            score += 1;
        }

        // Water match
        if (crop.water.includes(water)) {
            score += 10;
        } else {
            score += 3;
        }

        // Fertility match
        if (crop.fertility.includes(fertility)) {
            score += 10;
        } else {
            score += 3;
        }

        // Weather match
        if (crop.weather.includes(weather)) {
            score += 10;
        } else {
            score += 2;
        }

        // District match
        const matchedDistrict = crop.preferredDistricts.some(d => location.includes(d));
        if (matchedDistrict) {
            score += 10;
        } else {
            score += 4;
        }

        // Dynamic match percentage adjustment to ensure different crops get different percentages
        score += (crop.name.en.length % 5);

        // Expected yield calculation
        let yieldFactor = 1.0;
        if (crop.soil.includes(soil)) yieldFactor *= 1.1;
        if (crop.water.includes(water)) yieldFactor *= 1.1;
        if (crop.fertility.includes(fertility)) {
            if (fertility === "Rich") yieldFactor *= 1.25;
            else if (fertility === "Poor") yieldFactor *= 0.75;
        }
        if (matchedDistrict) yieldFactor *= 1.15;
        const expectedYieldValue = (crop.baseYield * yieldFactor).toFixed(2);

        // Mandi price calculation
        let priceModifier = 1.0;
        if (season === "Summer") priceModifier = 1.05;
        if (weather === "Sunny") priceModifier *= 1.02;
        if (weather === "Rainy") priceModifier *= 0.98;
        if (matchedDistrict) priceModifier *= 1.03;
        const mandiPriceValue = Math.round(crop.basePrice * priceModifier);

        return {
            name: crop.name,
            score: Math.min(99, Math.max(55, Math.round(score))),
            reasoning: crop.reasoning,
            expertTip: crop.expertTip,
            baseYieldValue: expectedYieldValue,
            basePriceValue: mandiPriceValue
        };
    });

    scoredCrops.sort((a, b) => b.score - a.score);

    const primary = scoredCrops[0];
    const alternatives = scoredCrops.slice(1, 4).map(c => ({
        name: c.name,
        accuracy: c.score,
        baseYieldValue: c.baseYieldValue
    }));

    return {
        status: "success",
        primary_crop: {
            name: primary.name,
            accuracy: primary.score,
            reasoning: primary.reasoning,
            expert_tip: primary.expertTip,
            baseYieldValue: primary.baseYieldValue,
            basePriceValue: primary.basePriceValue
        },
        alternatives: alternatives,
        detected_params: {
            soil: soil,
            season: season,
            weather: weather
        }
    };
}

window.smartAnalyze = async function () {
    const loc = document.getElementById('crop_location')?.value;
    const loading = document.getElementById('cropLoading');
    const loadText = document.getElementById('loadingText');
    const resultBox = document.getElementById('cropResult');
    const lang = localStorage.getItem('preferredLang') || 'en';

    if (!loc) {
        const errorText = lang === 'ta' ? "தயவுசெய்து சரியான மாவட்டத்தைத் தேர்ந்தெடுக்கவும்" : "Please select a valid district";
        window.showNotification(errorText, "error");
        return;
    }

    loading.style.display = 'block';
    loadText.innerText = lang === 'ta' ? "உங்கள் பகுதிக்கான தரவுகளை சேகரிக்கிறது..." : "Fetching parameters for your region...";
    const initialText = lang === 'ta' ? "வட்டார தரவுத்தளங்களுடன் இணைகிறது..." : "Synchronizing with regional databases...";
    resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="empty-state"><i class="fa-solid fa-satellite fa-spin"></i><p>${initialText}</p></div>`);

    try {
        await new Promise(resolve => setTimeout(resolve, 800));

        const detectedParams = detectParametersFromLocation(loc);
        const data = runLocalRecommendation(detectedParams, loc);

        if (data.status === 'success') {
            displayRecommendation(data);
            if (data.detected_params) {
                const params = data.detected_params;
                const soilDropdown = document.getElementById('crop_soil_type');
                const seasonDropdown = document.getElementById('crop_season');
                const weatherDropdown = document.getElementById('crop_weather');
                if (params.soil && soilDropdown) {
                    soilDropdown.value = params.soil;
                }
                if (params.season && seasonDropdown) {
                    seasonDropdown.value = params.season;
                }
                if (params.weather && weatherDropdown) {
                    weatherDropdown.value = params.weather;
                }
            }
            const successText = lang === 'ta' ? `தரவு அடிப்படையிலான பகுப்பாய்வு ${loc} பகுதிக்கு முடிந்தது` : `Analysis completed for ${loc}`;
            window.showNotification(successText, "success");
        } else {
            const failText = lang === 'ta' ? "பகுப்பாய்வு தோல்வியடைந்தது" : "Analysis failed";
            window.showNotification(failText, "error");
            resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><p>${failText}</p></div>`);
        }
    } catch (e) {
        const errText = lang === 'ta' ? "பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்." : "An error occurred. Please try again.";
        window.showNotification(errText, "error");
    } finally {
        loading.style.display = 'none';
    }
};

window.analyzeCrop = async function () {
    const locDropdown = document.getElementById('crop_location');
    const soilDropdown = document.getElementById('crop_soil_type');
    const loading = document.getElementById('cropLoading');
    const loadText = document.getElementById('loadingText');
    const resultBox = document.getElementById('cropResult');
    const lang = localStorage.getItem('preferredLang') || 'en';

    loading.style.display = 'block';
    loadText.innerText = lang === 'ta' ? "உள்ளீடுகளை பகுப்பாய்வு செய்கிறது..." : "Analyzing crop conditions...";
    const initialText = lang === 'ta' ? "பண்ணை நிலைமைகளை செயலாக்குகிறது..." : "Processing farm conditions...";
    resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="empty-state"><i class="fa-solid fa-microchip fa-spin"></i><p>${initialText}</p></div>`);

    try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const selectedParams = {
            soil: soilDropdown?.value,
            season: document.getElementById('crop_season')?.value,
            water: document.getElementById('crop_water')?.value,
            health: document.getElementById('crop_health')?.value,
            weather: document.getElementById('crop_weather')?.value
        };

        const data = runLocalRecommendation(selectedParams, locDropdown?.value || "");
        if (data.status === 'success') {
            displayRecommendation(data);
        }
    } catch (e) {
        const failText = lang === 'ta' ? "பகுப்பாய்வு தோல்வியடைந்தது" : "Analysis failed";
        resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="error-msg"><i class="fa-solid fa-circle-exclamation"></i> ${failText}</div>`);
    } finally {
        loading.style.display = 'none';
    }
};

// Add Enter key support for Location field
document.getElementById('crop_location')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        window.smartAnalyze();
    }
});

function displayRecommendation(data) {
    window.lastRecommendationData = data;

    const lang = localStorage.getItem('preferredLang') || 'en';
    const p = data.primary_crop;
    const alts = data.alternatives;
    const params = data.detected_params || {};
    const resultBox = document.getElementById('cropResult');

    if (!resultBox) return;
    resultBox.className = '';

    const cropName = typeof p.name === 'object' ? p.name[lang] : p.name;
    const reasoning = typeof p.reasoning === 'object' ? p.reasoning[lang] : p.reasoning;
    const expertTip = typeof p.expert_tip === 'object' ? p.expert_tip[lang] : p.expert_tip;

    const basePriceNum = p.basePriceValue || 6000;
    const yieldNum = p.baseYieldValue || 1.5;

    let recCropLabel, matchLabel, topChoiceLabel, mappedLabel, yieldLabel, priceLabel, expertLabel, altLabel, yieldVal, priceVal, matchPercentText;

    if (lang === 'ta') {
        recCropLabel = "பரிந்துரைக்கப்பட்ட பயிர்";
        matchLabel = "பொருத்தம்";
        topChoiceLabel = "சிறந்த தேர்வு 🌱";
        mappedLabel = "பொருந்தும் அளவுருக்கள்";
        yieldLabel = "எதிர்பார்க்கப்படும் மகசூல்";
        priceLabel = "சந்தை விலை";
        expertLabel = "நிபுணர் ஆலோசனை";
        altLabel = "மாற்றுப் பயிர்கள்";
        yieldVal = `ஏக்கருக்கு ${yieldNum} டன்`;
        priceVal = `₹${basePriceNum}/q`;
        matchPercentText = `${matchLabel}:<br>${p.accuracy}%`;
    } else {
        recCropLabel = "Recommended Crop";
        matchLabel = "Match";
        topChoiceLabel = "Top Choice 🌱";
        mappedLabel = "Mapped Parameters";
        yieldLabel = "Expected Yield";
        priceLabel = "Mandi Price";
        expertLabel = "Expert Advice";
        altLabel = "Alternatives";
        yieldVal = `${yieldNum} Tons/Acre`;
        priceVal = `₹${basePriceNum}/q`;
        matchPercentText = `${matchLabel}:<br>${p.accuracy}%`;
    }

    let html = `
        <div class="result-card primary-recommendation">
            <div class="accuracy-badge" style="line-height: 1.2; text-align: center; display: flex; align-items: center; justify-content: center; height: 50px; width: 80px; padding: 4px; border-radius: 8px;">${matchPercentText}</div>
            
            <span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${topChoiceLabel}</span>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 10px; font-weight: 600; text-transform: uppercase;">${recCropLabel}</div>
            <h2 style="color: var(--secondary); margin: 5px 0 5px 0; font-size: 1.8rem;">${cropName}</h2>
            
            ${params.soil ? `<p style="font-size:0.85rem; color:var(--primary); font-weight:600; margin-bottom:10px;">${mappedLabel}: ${getSoilDisplayName(params.soil, lang)} | ${getSeasonDisplayName(params.season, lang)}</p>` : ''}
            
            <p style="margin-bottom: 20px; font-style: italic; color: var(--text-muted); font-size: 1rem;">"${reasoning}"</p>
            
            <div class="result-info-grid">
                <div class="info-stat">
                    <i class="fa-solid fa-chart-line"></i>
                    <div>
                        <span class="label">${yieldLabel}</span>
                        <span class="val">${yieldVal}</span>
                    </div>
                </div>
                <div class="info-stat">
                    <i class="fa-solid fa-indian-rupee-sign"></i>
                    <div>
                        <span class="label">${priceLabel}</span>
                        <span class="val">${priceVal}</span>
                    </div>
                </div>
            </div>

            <div class="expert-box">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <i class="fa-solid fa-user-doctor" style="color:var(--primary)"></i>
                    <strong style="color:var(--secondary)">${expertLabel}:</strong>
                </div>
                <p>${expertTip}</p>
            </div>

            <div class="alternatives-section">
                <h4 style="text-align:left; color:var(--secondary); margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-list-check"></i> ${altLabel}
                </h4>
                <div class="alt-grid">
    `;

    alts.forEach(alt => {
        const altCropName = typeof alt.name === 'object' ? alt.name[lang] : alt.name;
        const altYieldNum = alt.baseYieldValue || 1.0;
        const altYieldVal = lang === 'ta' ? `ஏக்கருக்கு ${altYieldNum} டன்` : `${altYieldNum} Tons/Acre`;
        html += `
            <div class="alt-card">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                    <span class="alt-accuracy">${alt.accuracy}% ${matchLabel}</span>
                </div>
                <h5 style="color:var(--secondary); font-size:1rem;">${altCropName}</h5>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">${yieldLabel.split(' ')[0] || yieldLabel}: ${altYieldVal}</p>
            </div>
        `;
    });

    html += `
                </div>
            </div>
        </div>
    `;
    resultBox.innerHTML = window.DOMPurify.sanitize(html);
    
    const notificationText = lang === 'ta' ? "சிறந்த பயிர் கண்டறியப்பட்டது!" : "Best Crop Identified!";
    window.showNotification(notificationText, "success");

    // Save recommendation to Firestore (only if logged in)
    try {
        if (typeof firebase !== 'undefined') {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                firebase.firestore().collection('crop_recommendations').add({
                    userEmail: currentUser.email,
                    location: document.getElementById('crop_location')?.value || "",
                    soilType: params.soil || document.getElementById('crop_soil_type')?.value || "Unknown",
                    recommendedCrop: cropName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.error("Firestore error saving recommendation:", err));
            }
        }
    } catch (fbErr) {
        console.error("Failed to save crop recommendation to Firestore:", fbErr);
    }
}

function displayYieldResult(area, crop) {
    const resultBox = document.getElementById('yieldResult');
    if (!resultBox) return;

    const lang = localStorage.getItem('preferredLang') || 'en';

    const cropSpecs = {
        "நிலக்கடலை": { yieldPerAc: 1.8, pricePerQ: 6500, enName: "Groundnut" },
        "கடுகு": { yieldPerAc: 1.2, pricePerQ: 5400, enName: "Mustard" },
        "சோயாபீன்ஸ்": { yieldPerAc: 2.2, pricePerQ: 4800, enName: "Soybean" },
        "சூரியகாந்தி": { yieldPerAc: 1.5, pricePerQ: 5800, enName: "Sunflower" },
        "எள்": { yieldPerAc: 0.6, pricePerQ: 12500, enName: "Sesame" },
        "காசுமலர்": { yieldPerAc: 0.9, pricePerQ: 5600, enName: "Safflower" },
        "உச்செள்ளு": { yieldPerAc: 0.5, pricePerQ: 7200, enName: "Niger seed" },
        "ஆமணக்கு": { yieldPerAc: 1.4, pricePerQ: 7000, enName: "Castor seed" },
        "ஆளிவிதை": { yieldPerAc: 1.0, pricePerQ: 6200, enName: "Linseed" }
    };

    let spec = cropSpecs[crop];
    if (!spec) {
        const foundKey = Object.keys(cropSpecs).find(key => key === crop || cropSpecs[key].enName === crop);
        spec = cropSpecs[foundKey] || { yieldPerAc: 1.5, pricePerQ: 6000, enName: crop };
    }

    const totalYield = area * spec.yieldPerAc;
    const yieldInQuintals = totalYield * 10;
    const grossRevenue = yieldInQuintals * spec.pricePerQ;
    const productionCost = area * 15000;
    const netProfit = Math.max(0, grossRevenue - productionCost);

    let yieldStr, profitStr, headingText, profitLabel;
    if (lang === 'ta') {
        headingText = "எதிர்பார்க்கப்படும் மகசூல்";
        profitLabel = "மதிப்பிடப்பட்ட லாபம்";
        yieldStr = `${totalYield.toFixed(2)} டன்`;
        profitStr = `₹${Math.round(netProfit).toLocaleString('en-IN')}`;
    } else {
        headingText = "Expected Yield";
        profitLabel = "Estimated Profit";
        yieldStr = `${totalYield.toFixed(2)} Tons/Acre`;
        profitStr = `₹${Math.round(netProfit).toLocaleString('en-IN')}`;
    }

    resultBox.className = '';
    resultBox.innerHTML = window.DOMPurify.sanitize(`
        <div class="result-card" style="background:#FFFBF1; border-color:#F59E0B">
            <i class="fa-solid fa-boxes-stacked" style="font-size: 2rem; color: #F59E0B; margin-bottom: 10px;"></i>
            <h4 style="color: #D97706">${headingText}: ${yieldStr}</h4>
            <p>${profitLabel}: ${profitStr}</p>
        </div>
    `);
}

window.predictYield = async function () {
    const areaInput = document.getElementById('yield_area');
    const cropSelect = document.getElementById('yield_crop');
    const lang = localStorage.getItem('preferredLang') || 'en';
    
    const area = parseFloat(areaInput?.value);
    const crop = cropSelect?.value;

    if (!area || isNaN(area) || area <= 0) {
        const errText = lang === 'ta' ? "சாகுபடி பரப்பளவை உள்ளிடவும்" : "Enter cultivation area";
        return window.showNotification(errText, "error");
    }

    const resultBox = document.getElementById('yieldResult');
    const calcText = lang === 'ta' ? "மகசூலைக் கணக்கிடுகிறது..." : "Calculating expected yield...";
    resultBox.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><p>${calcText}</p>`;

    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        window.lastYieldData = { area, crop };
        displayYieldResult(area, crop);

        const successText = lang === 'ta' ? "மகசூல் கணக்கிடப்பட்டது" : "Yield Calculated";
        window.showNotification(successText, "info");

        try {
            if (typeof firebase !== 'undefined') {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    firebase.firestore().collection('yield_predictions').add({
                        userEmail: currentUser.email,
                        crop: crop,
                        landArea: area,
                        predictedYield: `${area * 1.5} Tons`,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.error("Firestore error saving yield prediction:", err));
                }
            }
        } catch (fbErr) {
            console.error("Failed to save yield prediction to Firestore:", fbErr);
        }
    } catch (e) {
        const failText = lang === 'ta' ? "கணக்கீட்டு பிழை" : "Calculation error";
        resultBox.innerHTML = `<p style="color:red">${failText}</p>`;
    }
};

window.scanDisease = async function () {
    const btn = document.querySelector('button[onclick="scanDisease()"]');
    const fileInput = document.getElementById('diseaseImage');
    const imagePreview = document.getElementById('imagePreview');
    const resultBox = document.getElementById('diseaseResult');
    const lang = localStorage.getItem('preferredLang') || 'en';

    if (!fileInput || !fileInput.files[0] || !imagePreview || !imagePreview.src) {
        const errText = lang === 'ta' ? "தயவுசெய்து முதலில் ஒரு படத்தை பதிவேற்றவும்" : "Please upload an image first";
        return window.showNotification(errText, "error");
    }

    btn.innerText = lang === 'ta' ? "பகுப்பாய்வு செய்கிறது..." : "Scanning...";
    
    // Create hidden canvas to analyze pixels
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    try {
        ctx.drawImage(imagePreview, 0, 0, 100, 100);
        const imgData = ctx.getImageData(0, 0, 100, 100);
        const data = imgData.data;
        
        // 1. Blurriness and Validity checks
        let graySum = 0;
        let grays = [];
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i+1], b = data[i+2];
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            grays.push(gray);
            graySum += gray;
        }
        
        let meanGray = graySum / grays.length;
        let varianceSum = 0;
        for (let g of grays) {
            varianceSum += (g - meanGray) ** 2;
        }
        let stdDev = Math.sqrt(varianceSum / grays.length);
        
        // Edge detection using average adjacent difference
        let edgeSum = 0;
        for (let y = 0; y < 99; y++) {
            for (let x = 0; x < 99; x++) {
                let idx1 = y * 100 + x;
                let idx2 = y * 100 + (x + 1);
                let idx3 = (y + 1) * 100 + x;
                edgeSum += Math.abs(grays[idx1] - grays[idx2]) + Math.abs(grays[idx1] - grays[idx3]);
            }
        }
        let avgEdge = edgeSum / (99 * 99 * 2);
        
        // Validate image
        // stdDev < 10: solid/blank background color
        // avgEdge < 1.8: extremely blurry image
        if (stdDev < 10 || avgEdge < 1.8) {
            btn.innerText = lang === 'ta' ? "மீண்டும் ஸ்கேன் செய்" : "Scan Now";
            const invalidText = lang === 'ta' ? "நோயை அடையாளம் காண முடியவில்லை. தயவுசெய்து தெளிவான படத்தை பதிவேற்றவும்." : "Unable to identify disease. Please upload a clearer image.";
            resultBox.className = '';
            resultBox.innerHTML = window.DOMPurify.sanitize(`
                <div class="result-card" style="background:#FEF3C7; border-color:#F59E0B; text-align:center; padding: 20px;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; color: #D97706; margin-bottom: 10px;"></i>
                    <p style="color:#B45309; font-weight:600; margin:0;">${invalidText}</p>
                </div>
            `);
            return;
        }
        
        // 2. Count plant pixels and classify leaf content
        let greenCount = 0;
        let yellowCount = 0;
        let rustCount = 0;
        let powderyCount = 0;
        
        // Leaf/Crop detection thresholds
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i+1], b = data[i+2];
            
            // A. Powdery check: white/grey/pale spots (high brightness, low saturation, R and B close)
            if (r > 120 && g > 120 && b > 120 && Math.abs(r - b) < 25 && g - r < 30 && g - b < 30) {
                powderyCount++;
            }
            // B. Healthy green leaf check
            else if (g > r + 3 && g > b + 3 && g > 35) {
                greenCount++;
            }
            // C. Rust check: reddish-brown/orange pustules (low blue, high red/green difference)
            else if (r > 105 && g > 30 && g < r - 20 && b < 50) {
                rustCount++;
            }
            // D. Leaf Spot check: yellow/brown spots (medium R/G, low B)
            else if (r > 75 && g > 55 && b < g - 25 && r > g - 15) {
                yellowCount++;
            }
        }
        
        let plantPixels = greenCount + yellowCount + rustCount + powderyCount;
        
        // If not enough crop/leaf pixels are found
        if (plantPixels < 1200) {
            btn.innerText = lang === 'ta' ? "மீண்டும் ஸ்கேன் செய்" : "Scan Now";
            const invalidText = lang === 'ta' ? "நோயை அடையாளம் காண முடியவில்லை. தயவுசெய்து தெளிவான படத்தை பதிவேற்றவும்." : "Unable to identify disease. Please upload a clearer image.";
            resultBox.className = '';
            resultBox.innerHTML = window.DOMPurify.sanitize(`
                <div class="result-card" style="background:#FEF3C7; border-color:#F59E0B; text-align:center; padding: 20px;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; color: #D97706; margin-bottom: 10px;"></i>
                    <p style="color:#B45309; font-weight:600; margin:0;">${invalidText}</p>
                </div>
            `);
            return;
        }
        
        // 3. Identify crop dynamically
        // Calculate average R, G, B of plant pixels to estimate crop
        let plantR = 0, plantG = 0, plantB = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i+1], b = data[i+2];
            if ((g > r + 3 && g > b + 3 && g > 35) || (r > 75 && g > 55 && b < g - 25 && r > g - 15) || (r > 105 && g > 35 && g < r - 20 && b < 50) || (r > 120 && g > 120 && b > 120 && Math.abs(r - b) < 25 && g - r < 30 && g - b < 30)) {
                plantR += r;
                plantG += g;
                plantB += b;
                count++;
            }
        }
        let avgR = plantR / count;
        let avgG = plantG / count;
        let avgB = plantB / count;
        
        let crop = "Groundnut";
        if (avgG > avgR * 1.35) {
            crop = "Mustard";
        } else if (avgR > avgG * 0.95) {
            crop = "Sesame";
        } else if (avgG + avgR > 260) {
            crop = "Sunflower";
        }
        
        // 4. Diagnose disease or health status
        let disease = "Healthy";
        let maxDiseaseCount = 0;
        
        if (yellowCount >= rustCount && yellowCount >= powderyCount) {
            disease = "Leaf Spot";
            maxDiseaseCount = yellowCount;
        } else if (powderyCount >= yellowCount && powderyCount >= rustCount) {
            disease = "Powdery Mildew";
            maxDiseaseCount = powderyCount;
        } else if (rustCount >= yellowCount && rustCount >= powderyCount) {
            disease = "Rust Disease";
            maxDiseaseCount = rustCount;
        }
        
        // Leaf health check: If the total diseased pixels comprise less than 6% of the plant pixels, it is Healthy
        const totalDiseasedPixels = yellowCount + rustCount + powderyCount;
        if (totalDiseasedPixels / plantPixels < 0.06 || totalDiseasedPixels < 300) {
            disease = "Healthy";
        }
        
        // If we found a disease but the count is very low/uncertain
        if (disease !== "Healthy" && maxDiseaseCount / plantPixels < 0.04) {
            btn.innerText = lang === 'ta' ? "மீண்டும் ஸ்கேன் செய்" : "Scan Now";
            const lowConfText = lang === 'ta' ? "நோயை அடையாளம் காண முடியவில்லை. தயவுசெய்து தெளிவான படத்தை பதிவேற்றவும்." : "Unable to identify disease. Please upload a clearer image.";
            resultBox.className = '';
            resultBox.innerHTML = window.DOMPurify.sanitize(`
                <div class="result-card" style="background:#F3F4F6; border-color:#9CA3AF; text-align:center; padding: 20px;">
                    <i class="fa-solid fa-circle-question" style="font-size: 2rem; color: #4B5563; margin-bottom: 10px;"></i>
                    <p style="color:#374151; font-weight:600; margin:0;">${lowConfText}</p>
                </div>
            `);
            return;
        }
        
        // Determine dynamic confidence & severity metrics
        let confidenceScore = 0;
        let severity = "Low";
        
        if (disease === "Healthy") {
            confidenceScore = 95 + Math.round(Math.random() * 4);
        } else {
            const ratio = maxDiseaseCount / plantPixels;
            confidenceScore = 75 + Math.round(ratio * 20) + (count % 4);
            if (ratio > 0.35) {
                severity = "High";
            } else if (ratio > 0.15) {
                severity = "Medium";
            } else {
                severity = "Low";
            }
        }
        
        // Cache the scanned disease result
        window.lastScannedDiseaseData = {
            crop,
            disease,
            confidence: confidenceScore,
            severity
        };

        btn.innerText = lang === 'ta' ? "மீண்டும் ஸ்கேன் செய்" : "Scan Now";
        resultBox.className = '';
        displayDiseaseResult(window.lastScannedDiseaseData, lang);
        
        const notificationText = lang === 'ta' ? "பயிர்ப் பகுப்பாய்வு முடிந்தது!" : "Plant analysis completed!";
        window.showNotification(notificationText, "success");

        // Save to Firestore (only if logged in)
        try {
            if (typeof firebase !== 'undefined') {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    firebase.firestore().collection('disease_detections').add({
                        userEmail: currentUser.email,
                        cropName: crop,
                        diseaseName: disease,
                        confidence: `${confidenceScore}%`,
                        severity: severity,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.error("Firestore error saving disease detection:", err));
                }
            }
        } catch (fbErr) {
            console.error("Failed to save disease detection to Firestore:", fbErr);
        }
        
    } catch (e) {
        console.error(e);
        btn.innerText = lang === 'ta' ? "மீண்டும் ஸ்கேன் செய்" : "Scan Now";
        const errText = lang === 'ta' ? "பகுப்பாய்வு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Analysis failed. Please try again.";
        window.showNotification(errText, "error");
    }
};

function displayDiseaseResult(d, lang) {
    const resultBox = document.getElementById('diseaseResult');
    if (!resultBox) return;
    
    const diseaseTranslations = {
        "Healthy": { en: "Healthy (No Disease Found)", ta: "ஆரோக்கியமானது (நோய் எதுவும் கண்டறியப்படவில்லை)" },
        "Leaf Spot": { en: "Leaf Spot", ta: "இலைப்புள்ளி நோய்" },
        "Powdery Mildew": { en: "Powdery Mildew", ta: "சாம்பல் நோய்" },
        "Rust Disease": { en: "Rust Disease", ta: "துரு நோய்" }
    };
    
    const diseaseDetails = {
        "Healthy": {
            cause: {
                en: "Proper soil nutrition and good water management.",
                ta: "சரியான மண் சத்து மற்றும் சிறந்த நீர் மேலாண்மை."
            },
            solutions: {
                en: [
                    "Continue current irrigation practices.",
                    "Maintain adequate nitrogen and potassium levels."
                ],
                ta: [
                    "தற்போதைய நீர் பாசன முறைகளைத் தொடரவும்.",
                    "தேவையான தழைச்சத்து மற்றும் சாம்பல் சத்து அளவை பராமரிக்கவும்."
                ]
            }
        },
        "Leaf Spot": {
            cause: {
                en: "Fungal infection due to high humidity.",
                ta: "அதிக ஈரப்பதம் காரணமாக பூஞ்சை தொற்று."
            },
            solutions: {
                en: [
                    "Remove infected leaves.",
                    "Improve ventilation.",
                    "Apply appropriate fungicide."
                ],
                ta: [
                    "பாதிக்கப்பட்ட இலைகளை அகற்றவும்.",
                    "காற்றோட்டத்தை மேம்படுத்தவும்.",
                    "தகுந்த பூஞ்சைக் கொல்லியைப் பயன்படுத்தவும்."
                ]
            }
        },
        "Powdery Mildew": {
            cause: {
                en: "Excess moisture in leaf canopy.",
                ta: "இலைகளில் அதிகப்படியான ஈரப்பதம்."
            },
            solutions: {
                en: [
                    "Reduce excess moisture.",
                    "Apply sulfur-based fungicide."
                ],
                ta: [
                    "அதிகப்படியான ஈரப்பதத்தைக் குறைக்கவும்.",
                    "கந்தகம் சார்ந்த பூஞ்சைக் கொல்லியைப் பயன்படுத்தவும்."
                ]
            }
        },
        "Rust Disease": {
            cause: {
                en: "Warm and wet environment suitable for rust spores.",
                ta: "துரு வித்திகளுக்கு உகந்த வெப்பமான மற்றும் ஈரமான சூழல்."
            },
            solutions: {
                en: [
                    "Remove infected plant parts.",
                    "Use recommended fungicide treatment."
                ],
                ta: [
                    "பாதிக்கப்பட்ட தாவர பாகங்களை அகற்றவும்.",
                    "பரிந்துரைக்கப்பட்ட பூஞ்சைக்கொல்லி சிகிச்சையைப் பயன்படுத்தவும்."
                ]
            }
        }
    };

    const diseaseNameDisp = diseaseTranslations[d.disease][lang];
    const causeDisp = diseaseDetails[d.disease].cause[lang];
    const solutionsList = diseaseDetails[d.disease].solutions[lang].map(s => `<li>${s}</li>`).join('');

    let html = '';
    
    if (d.disease === "Healthy") {
        const healthyTitle = lang === 'ta' ? "நோய் எதுவும் கண்டறியப்படவில்லை" : "No Disease Found";
        const healthyDesc = lang === 'ta' ? "பயிர் ஆரோக்கியமாக காட்சியளிக்கிறது." : "The crop appears healthy.";
        
        html = `
            <div class="result-card" style="background:#ECFDF5; border-color:#10B981; text-align:center; padding: 20px;">
                <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #10B981; margin-bottom: 15px;"></i>
                <h3 style="color: #065F46; font-size:1.4rem; margin-bottom:10px;">${healthyTitle}</h3>
                <p style="color:#047857; font-size:1rem; font-weight:500;">${healthyDesc}</p>
            </div>
        `;
    } else {
        const diseaseLabel = lang === 'ta' ? "நோய்" : "Disease";
        const causeLabel = lang === 'ta' ? "காரணம்" : "Cause";
        const solutionLabel = lang === 'ta' ? "பரிந்துரைக்கப்பட்ட தீர்வுகள்" : "Recommended Solution";
        
        html = `
            <div class="result-card" style="background:#FEF2F2; border-color:#EF4444; padding: 20px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
                    <i class="fa-solid fa-virus" style="font-size: 2.5rem; color: #EF4444;"></i>
                    <div>
                        <h4 style="color: #B91C1C; margin:0; font-size:1.2rem;">${diseaseLabel}: ${diseaseNameDisp}</h4>
                    </div>
                </div>
                
                <div style="margin-bottom:12px; font-size:0.9rem; color:var(--text-main); line-height: 1.5;">
                    <strong>${causeLabel}:</strong> ${causeDisp}
                </div>
                
                <div style="text-align:left; background:white; padding:15px; border-radius:8px; margin-top:15px; border:1px solid #FECACA;">
                    <strong style="color:var(--secondary); font-size:0.9rem;">${solutionLabel}:</strong>
                    <ul style="margin-left:20px; font-size:0.85rem; color:var(--text-main); margin-top:5px; line-height: 1.5; padding-left: 0;">
                        ${solutionsList}
                    </ul>
                </div>
            </div>
        `;
    }
    
    resultBox.innerHTML = window.DOMPurify.sanitize(html);
}

