// Database simulation
const DB = {
    users: [
        {
            id: 1,
            name: "Mr.Mostafa Nassar",
            email: "mostafa.nassar@4am-system.com",
            password: "Admin@123",
            role: "admin",
            department: null,
            isMainAdmin: true
        },
        {
            id: 2,
            name: "Mr.Ahmed Nagy",
            email: "ahmed.nagy@4am-system.com",
            password: "Admin@123",
            role: "admin",
            department: null,
            isMainAdmin: false
        },
        {
            id: 3,
            name: "Mr.Ebrahim Ahmed",
            email: "ebrahim.ahmed@4am-system.com",
            password: "Admin@123",
            role: "admin",
            department: null,
            isMainAdmin: false
        }
    ],
    tickets: [],
    incentives: [],
    nextUserId: 4,
    nextTicketId: 1,
    nextIncentiveId: 1
};

const DEPARTMENTS = [
    "Account Manager",
    "Monitor",
    "Moderator",
    "Media Buyer",
    "Graphic Designer",
    "Reel Creator",
    "Content Creator",
    "Photographer"
];

// Save to localStorage
function saveDB() {
    localStorage.setItem('4am_db', JSON.stringify(DB));
}

// Load from localStorage
function loadDB() {
    const saved = localStorage.getItem('4am_db');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(DB, data);
    }
}

// Initialize
loadDB();
