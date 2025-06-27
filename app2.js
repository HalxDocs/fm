// app2.js - Ministry Tracker Offline Application
class MinistryTracker {
    constructor() {
        this.currentUser = null;
        this.contacts = [];
        this.timeRecords = [];
        this.currentTab = 'contacts';
        this.selectedContactId = null;
        this.monthlyGoals = {
            hours: 10,
            bibleStudies: 4,
            returnVisits: 8
        };

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.checkAuthState();
        this.setupTabs();
        this.setDefaultDate();
        this.populateMonthSelect();
        this.updateStats();
    }

    // Storage Management
    saveToStorage() {
        const data = {
            users: JSON.parse(localStorage.getItem('ministry_users') || '{}'),
            contacts: this.contacts,
            timeRecords: this.timeRecords,
            currentUser: this.currentUser,
            monthlyGoals: this.monthlyGoals
        };
        
        if (this.currentUser) {
            data.users[this.currentUser.email] = {
                email: this.currentUser.email,
                password: this.currentUser.password,
                contacts: this.contacts,
                timeRecords: this.timeRecords,
                monthlyGoals: this.monthlyGoals
            };
            localStorage.setItem('ministry_users', JSON.stringify(data.users));
            localStorage.setItem('ministry_current_user', JSON.stringify(this.currentUser));
        }
    }

    loadFromStorage() {
        const currentUser = localStorage.getItem('ministry_current_user');
        if (currentUser) {
            this.currentUser = JSON.parse(currentUser);
            const users = JSON.parse(localStorage.getItem('ministry_users') || '{}');
            const userData = users[this.currentUser.email] || { 
                contacts: [], 
                timeRecords: [],
                monthlyGoals: this.monthlyGoals
            };
            this.contacts = userData.contacts || [];
            this.timeRecords = userData.timeRecords || [];
            this.monthlyGoals = userData.monthlyGoals || this.monthlyGoals;
        }
    }

    // Authentication Functions
    checkAuthState() {
        if (this.currentUser) {
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-content').classList.add('hidden');
        document.getElementById('bottom-nav').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        document.getElementById('bottom-nav').classList.remove('hidden');
        this.renderContacts();
        this.renderTimeRecords();
        this.updateStats();
    }

    handleLogin(e) {
        if (e) e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showAuthMessage('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAuthMessage('Please enter a valid email address', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('ministry_users') || '{}');
        const user = users[email];

        if (user && user.password === this.hashPassword(password)) {
            this.currentUser = { email: email, password: user.password };
            this.contacts = user.contacts || [];
            this.timeRecords = user.timeRecords || [];
            this.monthlyGoals = user.monthlyGoals || this.monthlyGoals;
            this.saveToStorage();
            this.showAuthMessage('Login successful!', 'success');
            setTimeout(() => this.showApp(), 1000);
        } else {
            this.showAuthMessage('Invalid email or password', 'error');
        }
    }

    handleSignUp(e) {
        if (e) e.preventDefault();
        
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        if (!email || !password) {
            this.showAuthMessage('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAuthMessage('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('Password must be at least 6 characters', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('ministry_users') || '{}');
        
        if (users[email]) {
            this.showAuthMessage('User already exists. Please login instead.', 'error');
            return;
        }

        users[email] = {
            email: email,
            password: this.hashPassword(password),
            contacts: [],
            timeRecords: [],
            monthlyGoals: this.monthlyGoals
        };

        localStorage.setItem('ministry_users', JSON.stringify(users));
        this.currentUser = { email: email, password: this.hashPassword(password) };
        this.contacts = [];
        this.timeRecords = [];
        this.saveToStorage();
        
        this.showAuthMessage('Account created successfully!', 'success');
        setTimeout(() => this.showApp(), 1000);
    }

    handlePasswordReset(e) {
        if (e) e.preventDefault();
        
        const email = document.getElementById('reset-email').value.trim();
        
        if (!email) {
            this.showAuthMessage('Please enter your email address', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAuthMessage('Please enter a valid email address', 'error');
            return;
        }

        // Simulate password reset
        this.showAuthMessage('Password reset link sent to your email!', 'success');
        setTimeout(() => this.switchAuthForm('login'), 2000);
    }

    handleSignOut() {
        if (confirm('Are you sure you want to sign out?')) {
            this.currentUser = null;
            localStorage.removeItem('ministry_current_user');
            this.contacts = [];
            this.timeRecords = [];
            this.showAuth();
            this.clearAuthForms();
        }
    }

    // Utility Functions
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    hashPassword(password) {
        // Simple hash - in production, use proper hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    switchAuthForm(formType) {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('forgot-form').classList.add('hidden');
        
        if (formType === 'login') {
            document.getElementById('login-form').classList.remove('hidden');
        } else if (formType === 'signup') {
            document.getElementById('signup-form').classList.remove('hidden');
        } else if (formType === 'forgot') {
            document.getElementById('forgot-form').classList.remove('hidden');
        }
        
        this.hideAuthMessage();
    }

    showAuthMessage(message, type) {
        const messageDiv = document.getElementById('auth-message');
        messageDiv.textContent = message;
        messageDiv.className = `mt-4 p-3 rounded-lg text-sm ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
        messageDiv.classList.remove('hidden');
    }

    hideAuthMessage() {
        document.getElementById('auth-message').classList.add('hidden');
    }

    clearAuthForms() {
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('reset-email').value = '';
    }

    showToast(message, type) {
        const toast = type === 'success' ? document.getElementById('success-toast') : document.getElementById('error-toast');
        const toastMessage = type === 'success' ? document.getElementById('success-message') : document.getElementById('error-message');
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Tab Management
    setupTabs() {
        // Desktop tabs
        document.getElementById('contacts-tab').addEventListener('click', () => this.switchTab('contacts'));
        document.getElementById('time-tab').addEventListener('click', () => this.switchTab('time'));
        document.getElementById('stats-tab').addEventListener('click', () => this.switchTab('stats'));
        
        // Mobile tabs
        document.getElementById('mobile-contacts-tab').addEventListener('click', () => this.switchTab('contacts'));
        document.getElementById('mobile-time-tab').addEventListener('click', () => this.switchTab('time'));
        document.getElementById('mobile-stats-tab').addEventListener('click', () => this.switchTab('stats'));
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Deactivate all tabs
        document.querySelectorAll('[id$="-tab"]').forEach(tab => {
            tab.classList.remove('text-blue-600', 'border-blue-600');
            tab.classList.add('text-gray-500', 'hover:text-blue-600');
        });
        
        // Activate selected tab
        document.getElementById(`${tabName}-tab`).classList.remove('text-gray-500', 'hover:text-blue-600');
        document.getElementById(`${tabName}-tab`).classList.add('text-blue-600', 'border-blue-600');
        
        // Show selected content
        document.getElementById(`${tabName}-content`).classList.remove('hidden');
        
        // Mobile tabs
        document.querySelectorAll('#bottom-nav button').forEach(btn => {
            btn.classList.remove('text-blue-600', 'border-blue-600');
            btn.classList.add('text-gray-500');
        });
        
        document.getElementById(`mobile-${tabName}-tab`).classList.remove('text-gray-500');
        document.getElementById(`mobile-${tabName}-tab`).classList.add('text-blue-600', 'border-blue-600');
    }

    // Contact Management
    handleAddContact(e) {
        if (e) e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const publication = document.getElementById('publication').value.trim();
        const returnTime = document.getElementById('return-time').value;

        if (!name) {
            this.showToast('Please enter a name', 'error');
            return;
        }

        const contact = {
            id: Date.now().toString(),
            name: name,
            phone: phone,
            address: address,
            publication: publication,
            returnTime: returnTime,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        this.contacts.push(contact);
        this.saveToStorage();
        this.renderContacts();
        this.clearContactForm();
        this.showToast('Contact added successfully!', 'success');
    }

    editContact(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        document.getElementById('name').value = contact.name;
        document.getElementById('phone').value = contact.phone || '';
        document.getElementById('address').value = contact.address || '';
        document.getElementById('publication').value = contact.publication || '';
        document.getElementById('return-time').value = contact.returnTime || '';

        // Remove the contact and add button will re-add it
        this.deleteContact(contactId, false);
        document.getElementById('name').focus();
    }

    deleteContact(contactId, showConfirm = true) {
        if (showConfirm && !confirm('Are you sure you want to delete this contact?')) {
            return;
        }

        this.contacts = this.contacts.filter(c => c.id !== contactId);
        this.saveToStorage();
        this.renderContacts();
        this.hideContactModal();
        if (showConfirm) {
            this.showToast('Contact deleted successfully!', 'success');
        }
    }

    markContactCompleted() {
        const contactId = document.getElementById('contact-modal').getAttribute('data-contact-id');
        const contact = this.contacts.find(c => c.id === contactId);
        if (contact) {
            contact.status = contact.status === 'Completed' ? 'Pending' : 'Completed';
            this.saveToStorage();
            this.renderContacts();
            this.hideContactModal();
            this.showToast(`Contact marked as ${contact.status.toLowerCase()}!`, 'success');
        }
    }

    clearContactForm() {
        document.getElementById('contact-form').reset();
    }

    renderContacts() {
        const searchTerm = document.getElementById('contact-search').value.toLowerCase();
        const filteredContacts = this.contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) ||
            (contact.phone && contact.phone.toLowerCase().includes(searchTerm)) ||
            (contact.address && contact.address.toLowerCase().includes(searchTerm))
        );

        // Sort by return visit time (soonest first)
        filteredContacts.sort((a, b) => {
            if (!a.returnTime && !b.returnTime) return 0;
            if (!a.returnTime) return 1;
            if (!b.returnTime) return -1;
            return new Date(a.returnTime) - new Date(b.returnTime);
        });

        // Desktop table view
        const desktopList = document.getElementById('contacts-list');
        desktopList.innerHTML = '';

        // Mobile cards view
        const mobileList = document.getElementById('contacts-list-mobile');
        mobileList.innerHTML = '';

        if (filteredContacts.length === 0) {
            const emptyMessage = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No contacts found</td></tr>';
            desktopList.innerHTML = emptyMessage;
            mobileList.innerHTML = '<div class="text-center text-gray-500 py-8">No contacts found</div>';
            return;
        }

        filteredContacts.forEach(contact => {
            // Desktop row
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 cursor-pointer';
            row.onclick = () => this.showContactModal(contact.id);
            
            const returnTimeFormatted = contact.returnTime ? 
                new Date(contact.returnTime).toLocaleDateString() + ' ' + 
                new Date(contact.returnTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                'Not set';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">${contact.name}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${contact.phone || 'Not provided'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${returnTimeFormatted}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contact.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }">
                        ${contact.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="event.stopPropagation(); app.editContact('${contact.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); app.deleteContact('${contact.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            desktopList.appendChild(row);

            // Mobile card
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow';
            card.onclick = () => this.showContactModal(contact.id);
            
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium text-gray-900">${contact.name}</h3>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                        contact.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }">
                        ${contact.status}
                    </span>
                </div>
                <div class="space-y-1 text-sm text-gray-600 mb-3">
                    ${contact.phone ? `<div><i class="fas fa-phone w-4"></i> ${contact.phone}</div>` : ''}
                    ${contact.address ? `<div><i class="fas fa-map-marker-alt w-4"></i> ${contact.address}</div>` : ''}
                    <div><i class="fas fa-calendar-alt w-4"></i> ${returnTimeFormatted}</div>
                </div>
                <div class="flex justify-end space-x-2">
                    <button onclick="event.stopPropagation(); app.editContact('${contact.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); app.deleteContact('${contact.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            mobileList.appendChild(card);
        });
    }

    showContactModal(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        this.selectedContactId = contactId;
        document.getElementById('contact-modal').setAttribute('data-contact-id', contactId);
        
        document.getElementById('modal-contact-name').textContent = contact.name;
        document.getElementById('modal-contact-phone').textContent = contact.phone || 'Not provided';
        document.getElementById('modal-contact-address').textContent = contact.address || 'Not provided';
        document.getElementById('modal-contact-publication').textContent = contact.publication || 'None';
        
        const returnTimeFormatted = contact.returnTime ? 
            new Date(contact.returnTime).toLocaleDateString() + ' ' + 
            new Date(contact.returnTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
            'Not set';
        document.getElementById('modal-contact-return-time').textContent = returnTimeFormatted;
        document.getElementById('modal-contact-status').textContent = contact.status;

        // Update button text based on status
        const markButton = document.getElementById('mark-completed');
        markButton.innerHTML = contact.status === 'Completed' ? 
            '<i class="fas fa-undo mr-2"></i> Mark Pending' : 
            '<i class="fas fa-check-circle mr-2"></i> Mark Completed';

        document.getElementById('contact-modal').classList.remove('hidden');
    }

    hideContactModal() {
        document.getElementById('contact-modal').classList.add('hidden');
        this.selectedContactId = null;
    }

    searchContacts() {
        const searchTerm = document.getElementById('contact-search').value.toLowerCase();
        this.renderContacts();
    }

    // Time Tracking
    handleAddTimeRecord(e) {
        if (e) e.preventDefault();
        
        const date = document.getElementById('time-date').value;
        const hours = parseInt(document.getElementById('hours').value) || 0;
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        const bibleStudies = parseInt(document.getElementById('bible-studies').value) || 0;
        const returnVisits = parseInt(document.getElementById('return-visits').value) || 0;

        if (!date) {
            this.showToast('Please select a date', 'error');
            return;
        }

        if (hours === 0 && minutes === 0) {
            this.showToast('Please enter time spent', 'error');
            return;
        }

        const totalMinutes = (hours * 60) + minutes;
        const timeRecord = {
            id: Date.now().toString(),
            date: date,
            totalMinutes: totalMinutes,
            bibleStudies: bibleStudies,
            returnVisits: returnVisits,
            createdAt: new Date().toISOString()
        };

        this.timeRecords.push(timeRecord);
        this.saveToStorage();
        this.renderTimeRecords();
        this.clearTimeForm();
        this.updateStats();
        this.showToast('Time record added successfully!', 'success');
    }

    editTimeRecord(recordId) {
        const record = this.timeRecords.find(r => r.id === recordId);
        if (!record) return;

        document.getElementById('time-date').value = record.date;
        document.getElementById('hours').value = Math.floor(record.totalMinutes / 60);
        document.getElementById('minutes').value = record.totalMinutes % 60;
        document.getElementById('bible-studies').value = record.bibleStudies;
        document.getElementById('return-visits').value = record.returnVisits;

        // Remove the record and add button will re-add it
        this.deleteTimeRecord(recordId, false);
        document.getElementById('time-date').focus();
    }

    deleteTimeRecord(recordId, showConfirm = true) {
        if (showConfirm && !confirm('Are you sure you want to delete this time record?')) {
            return;
        }

        this.timeRecords = this.timeRecords.filter(r => r.id !== recordId);
        this.saveToStorage();
        this.renderTimeRecords();
        this.updateStats();
        if (showConfirm) {
            this.showToast('Time record deleted successfully!', 'success');
        }
    }

    clearTimeForm() {
        document.getElementById('time-form').reset();
        this.setDefaultDate();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('time-date').value = today;
    }

    renderTimeRecords() {
        const searchTerm = document.getElementById('time-search').value.toLowerCase();
        const filteredRecords = this.timeRecords.filter(record => 
            record.date.includes(searchTerm) ||
            record.bibleStudies.toString().includes(searchTerm) ||
            record.returnVisits.toString().includes(searchTerm)
        );

        // Sort by date descending
        filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Desktop table view
        const desktopList = document.getElementById('time-records');
        desktopList.innerHTML = '';

        // Mobile cards view
        const mobileList = document.getElementById('time-records-mobile');
        mobileList.innerHTML = '';

        if (filteredRecords.length === 0) {
            const emptyMessage = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No time records found</td></tr>';
            desktopList.innerHTML = emptyMessage;
            mobileList.innerHTML = '<div class="text-center text-gray-500 py-8">No time records found</div>';
            return;
        }

        filteredRecords.forEach(record => {
            const hours = Math.floor(record.totalMinutes / 60);
            const minutes = record.totalMinutes % 60;
            const timeString = `${hours}h ${minutes}m`;
            const dateFormatted = new Date(record.date).toLocaleDateString();

            // Desktop row
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${dateFormatted}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${timeString}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${record.bibleStudies}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${record.returnVisits}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="event.stopPropagation(); app.editTimeRecord('${record.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); app.deleteTimeRecord('${record.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            desktopList.appendChild(row);

            // Mobile card
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-lg p-4';
            
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium text-gray-900">${dateFormatted}</h3>
                    <div class="text-lg font-semibold text-blue-600">${timeString}</div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div><i class="fas fa-bible w-4"></i> ${record.bibleStudies} Studies</div>
                    <div><i class="fas fa-undo w-4"></i> ${record.returnVisits} Visits</div>
                </div>
                <div class="flex justify-end space-x-2">
                    <button onclick="event.stopPropagation(); app.editTimeRecord('${record.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); app.deleteTimeRecord('${record.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            mobileList.appendChild(card);
        });
    }

    searchTimeRecords() {
        const searchTerm = document.getElementById('time-search').value.toLowerCase();
        this.renderTimeRecords();
    }

    // Statistics
    updateStats() {
        const selectedMonth = document.getElementById('month-select').value;
        let monthToAnalyze = new Date().getMonth();
        let yearToAnalyze = new Date().getFullYear();
        
        if (selectedMonth) {
            [yearToAnalyze, monthToAnalyze] = selectedMonth.split('-').map(Number);
            monthToAnalyze -= 1; // Convert to 0-based month
        }

        const monthRecords = this.timeRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === monthToAnalyze && recordDate.getFullYear() === yearToAnalyze;
        });

        const totalMinutes = monthRecords.reduce((sum, record) => sum + record.totalMinutes, 0);
        const totalHours = (totalMinutes / 60).toFixed(1);
        const totalBibleStudies = monthRecords.reduce((sum, record) => sum + record.bibleStudies, 0);
        const totalReturnVisits = monthRecords.reduce((sum, record) => sum + record.returnVisits, 0);

        document.getElementById('total-hours').textContent = totalHours;
        document.getElementById('total-bible-studies').textContent = totalBibleStudies;
        document.getElementById('total-return-visits').textContent = totalReturnVisits;

        // Update progress bars
        const hoursProgress = Math.min((totalHours / this.monthlyGoals.hours) * 100, 100);
        const studiesProgress = Math.min((totalBibleStudies / this.monthlyGoals.bibleStudies) * 100, 100);
        const visitsProgress = Math.min((totalReturnVisits / this.monthlyGoals.returnVisits) * 100, 100);

        document.getElementById('hours-progress').style.width = hoursProgress + '%';
        document.getElementById('studies-progress').style.width = studiesProgress + '%';
        document.getElementById('visits-progress').style.width = visitsProgress + '%';

        document.getElementById('hours-percentage').textContent = Math.round(hoursProgress) + '%';
        document.getElementById('studies-percentage').textContent = Math.round(studiesProgress) + '%';
        document.getElementById('visits-percentage').textContent = Math.round(visitsProgress) + '%';
    }

    populateMonthSelect() {
        const select = document.getElementById('month-select');
        select.innerHTML = '';
        
        // Get all unique months from time records
        const months = new Set();
        this.timeRecords.forEach(record => {
            const date = new Date(record.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthYear);
        });
        
        // Add current month if empty
        if (months.size === 0) {
            const now = new Date();
            months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        }
        
        // Convert to array and sort (newest first)
        const sortedMonths = Array.from(months).sort().reverse();
        
        // Add options
        sortedMonths.forEach(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1, 1);
            const option = document.createElement('option');
            option.value = month;
            option.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            select.appendChild(option);
        });
        
        // Set to current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (sortedMonths.includes(currentMonth)) {
            select.value = currentMonth;
        }
    }

    // Export Functions
    printReport() {
        const selectedMonth = document.getElementById('month-select').value;
        let monthText = 'Current Month';
        
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const date = new Date(year, month - 1, 1);
            monthText = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }

        const totalHours = document.getElementById('total-hours').textContent;
        const totalStudies = document.getElementById('total-bible-studies').textContent;
        const totalVisits = document.getElementById('total-return-visits').textContent;

        const printContent = `
            <html>
                <head>
                    <title>Ministry Report - ${monthText}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                        .stat { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                        .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
                        .stat-label { color: #666; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Ministry Report</h1>
                        <h2>${monthText}</h2>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value">${totalHours}</div>
                            <div class="stat-label">Total Hours</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${totalStudies}</div>
                            <div class="stat-label">Bible Studies</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${totalVisits}</div>
                            <div class="stat-label">Return Visits</div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    exportToWhatsApp() {
        const selectedMonth = document.getElementById('month-select').value;
        let monthText = 'Current Month';
        
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const date = new Date(year, month - 1, 1);
            monthText = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }

        const totalHours = document.getElementById('total-hours').textContent;
        const totalStudies = document.getElementById('total-bible-studies').textContent;
        const totalVisits = document.getElementById('total-return-visits').textContent;

        const message = `📊 *Ministry Report - ${monthText}*\n\n` +
                       `⏱️ *Total Hours:* ${totalHours}\n` +
                       `📖 *Bible Studies:* ${totalStudies}\n` +
                       `↩️ *Return Visits:* ${totalVisits}\n\n` +
                       `Generated on ${new Date().toLocaleDateString()}`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Auth forms
        document.getElementById('login-form-element').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signup-form-element').addEventListener('submit', (e) => this.handleSignUp(e));
        document.getElementById('forgot-form-element').addEventListener('submit', (e) => this.handlePasswordReset(e));
        
        // Form switching buttons
        document.getElementById('show-signup-btn').addEventListener('click', () => this.switchAuthForm('signup'));
        document.getElementById('show-login-btn').addEventListener('click', () => this.switchAuthForm('login'));
        document.getElementById('forgot-password-btn').addEventListener('click', () => this.switchAuthForm('forgot'));
        document.getElementById('back-to-login-btn').addEventListener('click', () => this.switchAuthForm('login'));
        
        // Contact form
        document.getElementById('contact-form').addEventListener('submit', (e) => this.handleAddContact(e));
        
        // Time form
        document.getElementById('time-form').addEventListener('submit', (e) => this.handleAddTimeRecord(e));
        
        // Search functionality
        document.getElementById('contact-search').addEventListener('input', () => this.searchContacts());
        document.getElementById('time-search').addEventListener('input', () => this.searchTimeRecords());
        
        // Month selector
        document.getElementById('month-select').addEventListener('change', () => this.updateStats());
        
        // Export buttons
        document.getElementById('print-btn').addEventListener('click', () => this.printReport());
        document.getElementById('export-btn').addEventListener('click', () => this.exportToWhatsApp());
        
        // Sign out
        document.getElementById('sign-out-btn').addEventListener('click', () => this.handleSignOut());
        
        // Contact modal buttons
        document.getElementById('close-modal').addEventListener('click', () => this.hideContactModal());
        document.getElementById('mark-completed').addEventListener('click', () => this.markContactCompleted());
        document.getElementById('delete-contact').addEventListener('click', () => this.deleteContact(this.selectedContactId));

                // Toggle contact form visibility
        document.getElementById('toggle-contact-form').addEventListener('click', () => {
            const form = document.getElementById('contact-form');
            const icon = document.getElementById('toggle-contact-form').querySelector('i');
            
            if (form.style.maxHeight) {
                form.style.maxHeight = null;
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                form.style.maxHeight = form.scrollHeight + 'px';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        });

        // Initialize contact form height
        const contactForm = document.getElementById('contact-form');
        contactForm.style.maxHeight = contactForm.scrollHeight + 'px';
        contactForm.querySelector('i').classList.add('fa-chevron-up');

        // Close modals when clicking outside
        document.getElementById('contact-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('contact-modal')) {
                this.hideContactModal();
            }
        });

        // Check online/offline status
        window.addEventListener('online', this.updateConnectionStatus.bind(this));
        window.addEventListener('offline', this.updateConnectionStatus.bind(this));
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const statusDiv = document.getElementById('connection-status');
        if (navigator.onLine) {
            statusDiv.className = 'mb-4 p-3 rounded-lg text-sm flex items-center bg-green-100 text-green-700';
            statusDiv.querySelector('i').className = 'fas fa-circle mr-2 text-xs text-green-500';
            statusDiv.querySelector('p').textContent = 'Online - Data is saved locally';
        } else {
            statusDiv.className = 'mb-4 p-3 rounded-lg text-sm flex items-center bg-yellow-100 text-yellow-700';
            statusDiv.querySelector('i').className = 'fas fa-circle mr-2 text-xs text-yellow-500';
            statusDiv.querySelector('p').textContent = 'Offline - Working locally, changes will sync when back online';
        }
        statusDiv.classList.remove('hidden');
    }

    // Service Worker Registration for PWA
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').then(registration => {
                    console.log('ServiceWorker registration successful');
                }).catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MinistryTracker();
    app.registerServiceWorker();
});