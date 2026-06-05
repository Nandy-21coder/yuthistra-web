console.log(firebase);
const API_BASE_URL = 'https://nandha-backend-6azag5bue-raghavan-18s-projects.vercel.app';

window.currentResultLanguage = 'en';

window.translateTanglishText = function (text) {
    if (!text || typeof text !== 'string') return text;
    
    let result = text;
    
    // 1. Direct Tanglish Word Replacements
    const wordMap = {
        'Karichal': 'கரிசல் மண்',
        'Vandhal': 'வண்டல் மண்',
        'Semman': 'செம்மண்',
        'Manal': 'மணல் மண்',
        'Loamy': 'இருவாட்டி மண்',
        'Mazhai Kaalam': 'மழைக்காலம்',
        'MazhaiKaalam': 'மழைக்காலம்',
        'Pani Kaalam': 'குளிர்காலம்',
        'PaniKaalam': 'குளிர்காலம்',
        'Veiyil Kaalam': 'கோடைகாலம்',
        'VeiyilKaalam': 'கோடைகாலம்',
        'Nilakkadalai': 'நிலக்கடலை',
        'Kadugu': 'கடுகு',
        'Suryagandhi': 'சூரியகாந்தி',
        'Ellu': 'எள்',
        'Kusuma': 'குசும்பா',
        'Uchellu': 'உச்செள்',
        'Amanakku': 'ஆமணக்கு',
        'Alivithai': 'ஆளிவிதை'
    };
    
    for (const [tanglish, tamil] of Object.entries(wordMap)) {
        const regex = new RegExp(tanglish, 'gi');
        result = result.replace(regex, tamil);
    }
    
    // 2. Format English options (if they don't already have Tamil in brackets)
    // Crop translations
    const cropTranslations = {
        'Groundnut': 'நிலக்கடலை',
        'Mustard': 'கடுகு',
        'Soybean': 'சோயாபீன்ஸ்',
        'Sunflower': 'சூரியகாந்தி',
        'Sesame': 'எள்',
        'Safflower': 'குசும்பா',
        'Niger seed': 'உச்செள்',
        'Castor seed': 'ஆமணக்கு',
        'Linseed': 'ஆளிவிதை'
    };
    
    // Soil translations
    const soilTranslations = {
        'Black Soil': 'கரிசல் மண்',
        'Alluvial Soil': 'வண்டல் மண்',
        'Red Soil': 'செம்மண்',
        'Sandy Soil': 'மணல் மண்',
        'Loamy Soil': 'இருவாட்டி மண்'
    };
    
    // Season translations
    const seasonTranslations = {
        'Kharif': 'மழைக்காலம்',
        'Rabi': 'குளிர்காலம்',
        'Zaid': 'கோடைகாலம்',
        'Rainy': 'மழைக்காலம்',
        'Winter': 'குளிர்காலம்',
        'Summer': 'கோடைகாலம்'
    };

    // Weather translations
    const weatherTranslations = {
        'Cool': 'குளிர்ச்சியான',
        'Cold': 'குளிர்ச்சியான',
        'Pleasant': 'இதமான / சாதாரண',
        'Normal': 'இதமான / சாதாரண',
        'Hot': 'வெப்பமான',
        'Very Warm': 'வெப்பமான'
    };

    // Water translations
    const waterTranslations = {
        'Low': 'குறைந்த நீர்ப்பாசனம் / மானாவாரி',
        'Medium': 'பகுதி நீர்ப்பாசனம்',
        'High': 'நன்கு நீர்ப்பாசனம்'
    };

    // Soil fertility translations
    const fertilityTranslations = {
        'Poor': 'நலிந்த மண் / உரம் தேவை',
        'Average': 'சராசரி மண் வளம்',
        'Rich': 'செழிப்பான மண் வளம்'
    };

    // Apply fallback translation if only English name is present without Tamil script
    const hasTamil = /[\u0b80-\u0bff]/.test(result);
    if (!hasTamil) {
        // Check crops
        for (const [eng, tamil] of Object.entries(cropTranslations)) {
            if (result.toLowerCase() === eng.toLowerCase()) {
                return `${eng} (${tamil})`;
            }
        }
        // Check soils
        for (const [eng, tamil] of Object.entries(soilTranslations)) {
            if (result.toLowerCase() === eng.toLowerCase()) {
                return `${eng} (${tamil})`;
            }
        }
        // Check seasons
        for (const [eng, tamil] of Object.entries(seasonTranslations)) {
            if (result.toLowerCase() === eng.toLowerCase()) {
                return `${eng} (${tamil})`;
            }
        }
        // Check weather
        for (const [eng, tamil] of Object.entries(weatherTranslations)) {
            if (result.toLowerCase() === eng.toLowerCase()) {
                return `${eng} (${tamil})`;
            }
        }
        // Check water
        for (const [eng, tamil] of Object.entries(waterTranslations)) {
            if (result.toLowerCase() === eng.toLowerCase()) {
                return `${eng} (${tamil})`;
            }
        }
        // Check fertility
        for (const [eng, tamil] of Object.entries(fertilityTranslations)) {
            if (result.toLowerCase() === eng.toLowerCase()) {
                return `${eng} (${tamil})`;
            }
        }
    }
    
    return result;
};

window.cropDatabase = window.cropSuitabilityDatabase;

window.getCropMetrics = function (key, isPrimary = false) {
    const soil_type = document.getElementById('crop_soil_type')?.value || "Black Soil";
    const season = document.getElementById('crop_season')?.value || "Rainy";
    const water = document.getElementById('crop_water')?.value || "Medium";
    const health = document.getElementById('crop_health')?.value || "Average";
    const weather = document.getElementById('crop_weather')?.value || "Pleasant";
    const locationInput = document.getElementById('crop_location')?.value || "";

    const districtObj = window.parseDistrictFromLocation(locationInput);
    const districtName = districtObj ? districtObj.name : "Tiruvannamalai";

    const inputs = {
        soil_type,
        season,
        water,
        health,
        weather,
        districtName
    };

    return window.evaluateCropSuitability(key, inputs);
};;

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

            locationInput.placeholder = "Detecting your location...";

            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    // Using OpenStreetMap's free reverse geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
                    const data = await response.json();

                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
                        const state = data.address.state || "";
                        const country = data.address.country || "";

                        locationInput.value = `${city}${city && state ? ', ' : ''}${state}${state && country ? ', ' : ''}${country}`;
                        window.showNotification("Location detected successfully!", "success");

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
                                    const options = Array.from(soilDropdown.options);
                                    const match = options.find(opt => opt.value === soilData.soil_type);
                                    if (match) {
                                        soilDropdown.value = soilData.soil_type;
                                        window.showNotification(`Detected ${window.translateTanglishText(soilData.soil_type)} for your region`, "info");
                                    }
                                }
                            } else {
                                window.showNotification(soilData.message || "Invalid location. Please enter a real farming area.", "error");
                            }
                        } catch (soilErr) {
                            // If API returns 400, it's an error status
                            window.showNotification("Invalid location detected. Please check your input.", "error");
                        }
                    } else {
                        locationInput.value = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                        window.showNotification("Coordinates found, but address service failed.", "info");
                    }
                } catch (e) {
                    locationInput.value = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                    window.showNotification("Using raw coordinates due to network error.", "info");
                }
            }, (error) => {
                locationInput.placeholder = "e.g. Indore, MP";
                window.showNotification("Location access denied. Please type manually.", "error");
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
            window.rawMarketPrices = data.prices;
            // Reset warning flag on success
            hasShown429Warning = false;

            // Update Ticker - Only show first 20 items to avoid freezing DOM
            if (tickerEl) {
                tickerEl.innerHTML = window.DOMPurify.sanitize(data.prices.slice(0, 20).map(item => `
                    <span class="ticker-item">
                        ${window.translateTanglishText(item.name)} (${item.mandi}): 
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
                        opt.textContent = window.translateTanglishText(c);
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
                        <td><strong>${window.DOMPurify.sanitize(window.translateTanglishText(item.name))}</strong></td>
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
                        label: `${window.translateTanglishText(crop)} Price (₹/Quintal)`,
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

// --- Feature Action Functions (Global Scope for inline onclick) ---

window.smartAnalyze = async function () {
    const loc = document.getElementById('crop_location')?.value;
    const loading = document.getElementById('cropLoading');
    const loadText = document.getElementById('loadingText');
    const resultBox = document.getElementById('cropResult');

    if (!loc || loc.length < 3) {
        window.showNotification("Please enter a valid district or enable location access", "error");
        return;
    }

    // Show loading
    if (loading) loading.style.display = 'block';
    if (loadText) loadText.innerText = "Analyzing soil, climate and crop suitability...";
    if (resultBox) resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="empty-state"><i class="fa-solid fa-satellite fa-spin"></i><p>Analyzing soil, climate and crop suitability...</p></div>`);

    try {
        // Simulate database lookup delay for premium user experience
        await new Promise(resolve => setTimeout(resolve, 800));

        // Parse district from location input
        const districtObj = window.parseDistrictFromLocation(loc);
        if (!districtObj) {
            window.showNotification("Location not recognized in Tamil Nadu. Using manual or default parameters.", "warning");
            if (loading) loading.style.display = 'none';
            window.analyzeCrop();
            return;
        }

        // Auto-detect parameters based on District and Current Month
        const currentMonth = new Date().getMonth(); // 0=Jan ... 11=Dec
        let detectedSeason = "Rainy"; // Default Kharif (Rainy) Jun-Sep
        if (currentMonth >= 9 || currentMonth <= 0) { // Oct - Jan
            detectedSeason = "Winter"; // Rabi (Winter)
        } else if (currentMonth >= 1 && currentMonth <= 4) { // Feb - May
            detectedSeason = "Summer"; // Zaid (Summer)
        }

        // Predominant soil for district (first in list)
        const detectedSoil = districtObj.preferredSoils[0];

        // Default water for district
        const detectedWater = districtObj.waterAvailability;

        // Weather based on month/season
        const detectedWeather = districtObj.typicalWeather[detectedSeason] || "Pleasant";

        // Auto-update form elements in UI
        const soilDropdown = document.getElementById('crop_soil_type');
        const seasonDropdown = document.getElementById('crop_season');
        const waterDropdown = document.getElementById('crop_water');
        const weatherDropdown = document.getElementById('crop_weather');

        if (soilDropdown) soilDropdown.value = detectedSoil;
        if (seasonDropdown) seasonDropdown.value = detectedSeason;
        if (waterDropdown) waterDropdown.value = detectedWater;
        if (weatherDropdown) weatherDropdown.value = detectedWeather;

        // Run recommendation logic
        const inputs = {
            soil_type: detectedSoil,
            season: detectedSeason,
            water: detectedWater,
            health: document.getElementById('crop_health')?.value || "Average",
            weather: detectedWeather,
            districtName: districtObj.name
        };

        // Validate the database is available
        if (!window.cropSuitabilityDatabase || Object.keys(window.cropSuitabilityDatabase).length === 0) {
            throw new Error("Crop database not loaded. Please refresh the page.");
        }

        // Calculate suitability scores for all crops
        const results = Object.keys(window.cropSuitabilityDatabase).map(key => {
            return window.evaluateCropSuitability(key, inputs);
        }).filter(Boolean);

        if (results.length === 0) {
            throw new Error("No crop data available for analysis.");
        }

        // Sort by suitability score descending
        results.sort((a, b) => b.accuracy - a.accuracy);

        const primaryCrop = results[0];
        const alternatives = results.slice(1, 4);

        // Save to lastRecommendationDetails
        window.lastRecommendationDetails = {
            params: {
                soil: detectedSoil,
                season: detectedSeason,
                water: detectedWater,
                health: inputs.health,
                weather: detectedWeather,
                location: loc
            },
            primary: primaryCrop,
            alternatives: alternatives
        };

        // Render result
        window.renderRecommendationResult();
        window.showNotification(`Data-driven analysis complete for ${districtObj.name} district`, "success");

        // Save recommendation to Firestore (only if logged in)
        try {
            if (typeof firebase !== 'undefined') {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    firebase.firestore().collection('crop_recommendations').add({
                        userEmail: currentUser.email,
                        location: loc,
                        soilType: detectedSoil,
                        recommendedCrop: primaryCrop.name,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.error("Firestore error saving recommendation:", err));
                }
            }
        } catch (fbErr) {
            console.error("Failed to save crop recommendation to Firestore:", fbErr);
        }

    } catch (err) {
        console.error("Smart Detect error:", err);
        window.showNotification("Unable to process recommendations. Please try again.", "error");
        if (resultBox) resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Unable to process recommendations. Please try again.</p></div>`);
    } finally {
        // Always hide the loader
        if (loading) loading.style.display = 'none';
    }
};

window.analyzeCrop = async function () {
    const locInput = document.getElementById('crop_location');
    const soilDropdown = document.getElementById('crop_soil_type');
    const loading = document.getElementById('cropLoading');
    const loadText = document.getElementById('loadingText');
    const resultBox = document.getElementById('cropResult');

    // Show loading
    if (loading) loading.style.display = 'block';
    if (loadText) loadText.innerText = "Analyzing soil, climate and crop suitability...";
    if (resultBox) resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="empty-state"><i class="fa-solid fa-microchip fa-spin"></i><p>Analyzing soil, climate and crop suitability...</p></div>`);

    try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const loc = locInput?.value || "";
        const districtObj = window.parseDistrictFromLocation(loc);
        const districtName = districtObj ? districtObj.name : "Tiruvannamalai";

        const inputs = {
            soil_type: soilDropdown?.value || "Black Soil",
            season: document.getElementById('crop_season')?.value || "Rainy",
            water: document.getElementById('crop_water')?.value || "Medium",
            health: document.getElementById('crop_health')?.value || "Average",
            weather: document.getElementById('crop_weather')?.value || "Pleasant",
            districtName: districtName
        };

        // Validate the database is available
        if (!window.cropSuitabilityDatabase || Object.keys(window.cropSuitabilityDatabase).length === 0) {
            throw new Error("Crop database not loaded. Please refresh the page.");
        }

        // Calculate suitability scores for all crops
        const results = Object.keys(window.cropSuitabilityDatabase).map(key => {
            return window.evaluateCropSuitability(key, inputs);
        }).filter(Boolean);

        if (results.length === 0) {
            throw new Error("No crop data available for analysis.");
        }

        // Sort by suitability score descending
        results.sort((a, b) => b.accuracy - a.accuracy);

        const primaryCrop = results[0];
        const alternatives = results.slice(1, 4);

        // Save to lastRecommendationDetails
        window.lastRecommendationDetails = {
            params: {
                soil: inputs.soil_type,
                season: inputs.season,
                water: inputs.water,
                health: inputs.health,
                weather: inputs.weather,
                location: loc
            },
            primary: primaryCrop,
            alternatives: alternatives
        };

        // Render result
        window.renderRecommendationResult();
        window.showNotification("Analysis Complete", "success");

        // Save recommendation to Firestore (only if logged in)
        try {
            if (typeof firebase !== 'undefined') {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    firebase.firestore().collection('crop_recommendations').add({
                        userEmail: currentUser.email,
                        location: loc,
                        soilType: inputs.soil_type,
                        recommendedCrop: primaryCrop.name,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.error("Firestore error saving recommendation:", err));
                }
            }
        } catch (fbErr) {
            console.error("Failed to save crop recommendation to Firestore:", fbErr);
        }

    } catch (err) {
        console.error("Analyze Crop error:", err);
        window.showNotification("Unable to process recommendations. Please try again.", "error");
        if (resultBox) resultBox.innerHTML = window.DOMPurify.sanitize(`<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Unable to process recommendations. Please try again.</p></div>`);
    } finally {
        // Always hide the loader regardless of success or failure
        if (loading) loading.style.display = 'none';
    }
};

// Add Enter key support for Location field
document.getElementById('crop_location')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        window.smartAnalyze();
    }
});

window.changeResultLanguage = function (lang) {
    window.currentResultLanguage = lang;
    window.renderRecommendationResult();
};

window.renderRecommendationResult = function () {
    const details = window.lastRecommendationDetails;
    if (!details) return;

    const p = details.primary;
    const alternatives = details.alternatives;
    const params = details.params;
    const lang = window.currentResultLanguage || 'en';
    const resultBox = document.getElementById('cropResult');
    if (!resultBox) return;

    let cropName = lang === 'ta' ? p.nameTam : p.nameEng;
    let mappedText = '';
    if (params.soil) {
        if (lang === 'ta') {
            mappedText = `பொருத்தப்பட்டது: ${window.translateTanglishText(params.soil)} | ${window.translateTanglishText(params.season)} பருவம்`;
        } else {
            const cleanSoil = params.soil.split(' (')[0];
            const cleanSeason = params.season.split(' (')[0];
            mappedText = `Mapped: ${cleanSoil} | ${cleanSeason} Season`;
        }
    }

    let reasoningText = lang === 'ta' ? p.reasoningTam || p.reasoning : p.reasoning;

    const accuracyBadge = `${p.accuracy}% ${lang === 'ta' ? 'பொருத்தம்' : 'Match'}`;
    const topChoiceLabel = lang === 'ta' ? 'சிறந்த தேர்வு 🌱' : 'Top Choice 🌱';

    const yieldVal = p.expected_yield.split(' ')[0];
    const yieldLabel = lang === 'ta' ? 'எதிர்பார்க்கப்படும் மகசூல்' : 'Exp. Yield';
    const yieldDisplay = lang === 'ta' ? `ஏக்கருக்கு ${yieldVal} டன்` : p.expected_yield;

    const mandiLabel = lang === 'ta' ? 'சந்தை விலை' : 'Mandi Price';
    const mandiDisplay = lang === 'ta' ? `₹ ${parseInt(p.mandi_price).toLocaleString('en-IN')} / குவிண்டால்` : `₹ ${parseInt(p.mandi_price).toLocaleString('en-IN')}/q`;

    const expertHeader = lang === 'ta' ? 'நிபுணர் ஆலோசனை:' : 'Expert Advice:';
    const expertAdviceText = lang === 'ta' ? p.expert_tip : p.expert_tip_eng;

    const alternativesHeader = lang === 'ta' ? 'மாற்றுப் பயிர்கள்' : 'Alternatives';

    let html = `
        <div class="result-card primary-recommendation" style="position: relative; background: linear-gradient(to bottom, #f0fdf4, #ffffff); border: 2px solid #10b981; border-radius: 20px; padding: 2.5rem 1.5rem 1.5rem; text-align: center; box-shadow: 0 20px 40px rgba(16, 185, 129, 0.1);">
            <div class="accuracy-badge" style="position: absolute; top: 15px; right: 15px; background: var(--primary); color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">${accuracyBadge}</div>
            
            <div style="margin-top: 15px; margin-bottom: 15px; display: inline-flex; background: #e5e7eb; border-radius: 20px; padding: 2px; gap: 2px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                <button class="lang-toggle-btn lang-btn-en" data-lang="en" style="border: none; outline: none; background: ${lang === 'en' ? '#10b981' : 'transparent'}; color: ${lang === 'en' ? 'white' : '#4b5563'}; padding: 5px 12px; border-radius: 18px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; ${lang === 'en' ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.15);' : ''}">English</button>
                <button class="lang-toggle-btn lang-btn-ta" data-lang="ta" style="border: none; outline: none; background: ${lang === 'ta' ? '#10b981' : 'transparent'}; color: ${lang === 'ta' ? 'white' : '#4b5563'}; padding: 5px 12px; border-radius: 18px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; ${lang === 'ta' ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.15);' : ''}">தமிழ்</button>
            </div>
            <br>
            
            <span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${topChoiceLabel}</span>
            <h2 style="color: var(--secondary); margin: 10px 0 5px 0; font-size: 1.8rem;">${cropName}</h2>
            
            ${mappedText ? `<p style="font-size:0.85rem; color:var(--primary); font-weight:600; margin-bottom:10px;">${mappedText}</p>` : ''}
            
            <p style="margin-bottom: 20px; font-style: italic; color: var(--text-muted); font-size: 1rem;">"${reasoningText}"</p>
            
            <div class="result-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                <div class="info-stat" style="background: #ffffff; padding: 12px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; gap: 12px; text-align: left;">
                    <i class="fa-solid fa-chart-line" style="color: var(--primary); font-size: 1.2rem;"></i>
                    <div>
                        <span class="label" style="display: block; font-size: 0.75rem; color: var(--text-muted);">${yieldLabel}</span>
                        <span class="val" style="display: block; font-weight: 700; color: var(--secondary); font-size: 1rem;">${yieldDisplay}</span>
                    </div>
                </div>
                <div class="info-stat" style="background: #ffffff; padding: 12px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; gap: 12px; text-align: left;">
                    <i class="fa-solid fa-indian-rupee-sign" style="color: var(--primary); font-size: 1.2rem;"></i>
                    <div>
                        <span class="label" style="display: block; font-size: 0.75rem; color: var(--text-muted);">${mandiLabel}</span>
                        <span class="val" style="display: block; font-weight: 700; color: var(--secondary); font-size: 1rem;">${mandiDisplay}</span>
                    </div>
                </div>
            </div>

            <div class="expert-box" style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; text-align: left; margin: 20px 0;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <i class="fa-solid fa-user-doctor" style="color:var(--primary)"></i>
                    <strong style="color:var(--secondary)">${expertHeader}</strong>
                </div>
                <p style="font-size: 0.9rem; line-height: 1.5; color: #92400e; margin-bottom: 0;">${expertAdviceText}</p>
            </div>

            <div class="alternatives-section" style="border-top: 1px solid var(--border); padding-top: 20px; margin-top: 20px;">
                <h4 style="text-align:left; color:var(--secondary); margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-list-check"></i> ${alternativesHeader}
                </h4>
                <div class="alt-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    `;

    alternatives.forEach(alt => {
        const altCropName = lang === 'ta' ? alt.nameTam : alt.nameEng;
        const altYieldVal = alt.expected_yield.split(' ')[0];
        const altYieldDisplay = lang === 'ta' ? `ஏக்கருக்கு ${altYieldVal} டன்` : alt.expected_yield;
        const altMandiDisplay = lang === 'ta' ? `₹${parseInt(alt.mandi_price).toLocaleString('en-IN')}/குவிண்டால்` : `₹${parseInt(alt.mandi_price).toLocaleString('en-IN')}/q`;
        const altAdviceText = lang === 'ta' ? alt.expert_tip : alt.expert_tip_eng;

        html += `
            <div class="alt-card" style="background: #f9fafb; padding: 12px; border-radius: 12px; border: 1px dashed var(--border); text-align: left; transition: all 0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                    <span class="alt-accuracy" style="background: #e5e7eb; color: #374151; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 10px;">${alt.accuracy}% ${lang === 'ta' ? 'பொருத்தம்' : 'Match'}</span>
                </div>
                <h5 style="color:var(--secondary); font-size:1rem; margin-bottom: 5px;">${altCropName}</h5>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom: 3px;">${yieldLabel}: ${altYieldDisplay}</p>
                <p style="font-size:0.75rem; color:var(--secondary); font-weight:600; margin-bottom: 5px;">${mandiLabel}: ${altMandiDisplay}</p>
                <p style="font-size:0.7rem; color:var(--text-muted); margin-top:5px; border-top: 1px solid #e5e7eb; padding-top:5px; margin-bottom: 0;">${altAdviceText}</p>
            </div>
        `;
    });

    html += `
                </div>
            </div>
        </div>
    `;
    
    resultBox.innerHTML = window.DOMPurify.sanitize(html);

    // Bind event listeners programmatically
    const langBtnEn = resultBox.querySelector('.lang-btn-en');
    if (langBtnEn) langBtnEn.addEventListener('click', () => window.changeResultLanguage('en'));

    const langBtnTa = resultBox.querySelector('.lang-btn-ta');
    if (langBtnTa) langBtnTa.addEventListener('click', () => window.changeResultLanguage('ta'));
};

function displayRecommendation(data) {
    // Left as a compatibility helper in case any external scripts call it
    const params = data.detected_params || {};
    const rawPrimaryName = data.primary_crop?.name || "Soybean";
    let cropKey = "Soybean";
    for (const key of Object.keys(window.cropDatabase)) {
        if (rawPrimaryName.toLowerCase().includes(key.toLowerCase())) {
            cropKey = key;
            break;
        }
    }
    const p = window.getCropMetrics(cropKey, true);
    const allAlternativeKeys = Object.keys(window.cropDatabase).filter(key => key !== cropKey);
    const parsedAlternatives = allAlternativeKeys.map(key => window.getCropMetrics(key, false));
    parsedAlternatives.sort((a, b) => b.accuracy - a.accuracy);
    const topAlternatives = parsedAlternatives.slice(0, 3);

    window.lastRecommendationDetails = {
        params: params,
        primary: p,
        alternatives: topAlternatives
    };

    window.renderRecommendationResult();
    window.showNotification("Best Crop Identified!", "success");
}

window.predictYield = async function () {
    const resultBox = document.getElementById('yieldResult');
    const area = document.getElementById('yield_area').value;
    const cropSelector = document.getElementById('yield_crop');
    
    if (!area) return window.showNotification("Please enter land area", "error");
    const acreage = parseFloat(area);
    if (isNaN(acreage) || acreage <= 0) return window.showNotification("Please enter a valid positive land area", "error");

    resultBox.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><p>Calculating yield...</p>`;

    await new Promise(resolve => setTimeout(resolve, 500));

    const rawCropVal = cropSelector?.value || "Groundnut (Nilakkadalai)";
    let cropKey = "Groundnut";
    for (const key of Object.keys(window.cropSuitabilityDatabase)) {
        if (rawCropVal.toLowerCase().includes(key.toLowerCase())) {
            cropKey = key;
            break;
        }
    }

    const locInput = document.getElementById('crop_location')?.value || "";
    const soilType = document.getElementById('crop_soil_type')?.value || "Red Soil";
    const season = document.getElementById('crop_season')?.value || "Rainy";
    const water = document.getElementById('crop_water')?.value || "Medium";
    const health = document.getElementById('crop_health')?.value || "Average";
    const weather = document.getElementById('crop_weather')?.value || "Pleasant";

    const districtObj = window.parseDistrictFromLocation(locInput);
    const districtName = districtObj ? districtObj.name : "Tiruvannamalai";

    const inputs = {
        soil_type: soilType,
        season: season,
        water: water,
        health: health,
        weather: weather,
        districtName: districtName
    };

    const suitability = window.evaluateCropSuitability(cropKey, inputs);
    const yieldPerAcre = parseFloat(suitability.expected_yield);
    const totalYield = (yieldPerAcre * acreage).toFixed(1);
    
    const mandiPrice = parseInt(suitability.mandi_price);
    const totalYieldQuintals = totalYield * 10;
    const totalRevenue = Math.round(totalYieldQuintals * mandiPrice);
    
    const baselineCostPerAcre = window.cropSuitabilityDatabase[cropKey].basePrice * window.cropSuitabilityDatabase[cropKey].baseYield * 3.5;
    const totalCost = Math.round(baselineCostPerAcre * acreage);
    const estimatedProfit = Math.max(0, totalRevenue - totalCost);

    const profitDisplay = `₹ ${estimatedProfit.toLocaleString('en-IN')}`;
    const expectedYieldDisplay = `${totalYield} Tons`;

    resultBox.className = '';
    resultBox.innerHTML = window.DOMPurify.sanitize(`
        <div class="result-card" style="background:#FFFBF1; border-color:#F59E0B">
            <i class="fa-solid fa-boxes-stacked" style="font-size: 2rem; color: #F59E0B; margin-bottom: 10px;"></i>
            <h4 style="color: #D97706">Expected Yield: ${expectedYieldDisplay}</h4>
            <p><strong>Calculated at:</strong> ${yieldPerAcre.toFixed(2)} Tons/Acre for ${acreage} Acres</p>
            <p><strong>Soil Suitability Match:</strong> ${suitability.accuracy}%</p>
            <p><strong>Estimated Gross Revenue:</strong> ₹ ${totalRevenue.toLocaleString('en-IN')}</p>
            <p style="font-weight: 600; color: #16a34a; margin-top: 5px;">Estimated Profit: ${profitDisplay}</p>
        </div>
    `);
    window.showNotification("Yield Calculated", "success");

    try {
        if (typeof firebase !== 'undefined') {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                firebase.firestore().collection('yield_predictions').add({
                    userEmail: currentUser.email,
                    crop: rawCropVal,
                    landArea: acreage,
                    predictedYield: expectedYieldDisplay,
                    estimatedProfit: profitDisplay,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.error("Firestore error saving yield prediction:", err));
            }
        }
    } catch (fbErr) {
        console.error("Failed to save yield prediction to Firestore:", fbErr);
}
};

window.scanDisease = async function () {
    const btn = document.querySelector('button[onclick="scanDisease()"]');
    const fileInput = document.getElementById('diseaseImage');
    if (!fileInput.files[0]) return window.showNotification("Upload image", "error");

    btn.innerText = `Scanning...`;
    const resultBox = document.getElementById('diseaseResult');

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
        const response = await apiFetch(`${API_BASE_URL}/api/detect`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            const d = data.detection;
            btn.innerText = `Scan Now`;

            // Format remedies as list items
            const remediesList = d.remedy.map(r => `<li>${r}</li>`).join('');

            resultBox.className = '';
            resultBox.innerHTML = window.DOMPurify.sanitize(`
                <div class="result-card" style="background:#FEF2F2; border-color:#EF4444">
                    <i class="fa-solid fa-virus" style="font-size: 2rem; color: #EF4444; margin-bottom: 10px;"></i>
                    <h4 style="color: #B91C1C">Detected: ${d.name}</h4>
                    <p><strong>Description:</strong> ${d.description}</p>
                    
                    <div style="text-align:left; background:white; padding:15px; border-radius:8px; margin-top:15px; border:1px solid #FECACA;">
                        <strong style="color:var(--secondary); font-size:0.9rem;">Recommended Solutions:</strong>
                        <ul style="margin-left:20px; font-size:0.85rem; color:var(--text-main); margin-top:5px;">
                            ${remediesList}
                        </ul>
                    </div>
                </div>
            `);

            // Save to Firestore (only if logged in)
            try {
                if (typeof firebase !== 'undefined') {
                    const currentUser = firebase.auth().currentUser;
                    if (currentUser) {
                        const confidence = (85 + Math.random() * 14).toFixed(1) + "%";
                        firebase.firestore().collection('disease_detections').add({
                            userEmail: currentUser.email,
                            diseaseName: d.name,
                            confidence: confidence,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        }).catch(err => console.error("Firestore error saving disease detection:", err));
                    }
                }
            } catch (fbErr) {
                console.error("Failed to save disease detection to Firestore:", fbErr);
            }
        }
    } catch (e) {
        btn.innerText = `Scan Now`;
    }
};

