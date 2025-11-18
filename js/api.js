// API Configuration
// Auto-detect if running locally or online
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`;

// Get token from sessionStorage
function getToken() {
    return sessionStorage.getItem('token');
}

// Set token in sessionStorage
function setToken(token) {
    sessionStorage.setItem('token', token);
}

// Remove token
function removeToken() {
    sessionStorage.removeItem('token');
}

// API call helper
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            // If unauthorized, redirect to login
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication error - redirecting to login');
                removeToken();
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(data.error || 'حدث خطأ');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        console.error('Token:', token ? 'exists' : 'missing');
        console.error('Endpoint:', endpoint);
        throw error;
    }
}

// Auth API
const AuthAPI = {
    login: async (email, password) => {
        const data = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        setToken(data.token);
        return data.user;
    },

    getCurrentUser: async () => {
        return await apiCall('/user');
    },

    logout: () => {
        removeToken();
        sessionStorage.removeItem('currentUser');
    }
};

// Users API
const UsersAPI = {
    getAll: async () => {
        return await apiCall('/users');
    },

    create: async (userData) => {
        return await apiCall('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    delete: async (userId) => {
        return await apiCall(`/users/${userId}`, {
            method: 'DELETE'
        });
    }
};

// Tickets API
const TicketsAPI = {
    getAll: async () => {
        return await apiCall('/tickets');
    },

    create: async (ticketData) => {
        return await apiCall('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData)
        });
    },

    addComment: async (ticketId, text) => {
        return await apiCall(`/tickets/${ticketId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    },

    updateStatus: async (ticketId, status) => {
        return await apiCall(`/tickets/${ticketId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
};

// Incentives API
const IncentivesAPI = {
    getAll: async () => {
        return await apiCall('/incentives');
    },

    create: async (incentiveData) => {
        return await apiCall('/incentives', {
            method: 'POST',
            body: JSON.stringify(incentiveData)
        });
    }
};

// Stats API
const StatsAPI = {
    get: async () => {
        return await apiCall('/stats');
    }
};
