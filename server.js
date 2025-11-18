const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve frontend files

// Database functions
function loadDB() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading database:', error);
            return getDefaultDB();
        }
    }
    return getDefaultDB();
}

function saveDB() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2), 'utf8');
        console.log('Database saved successfully');
    } catch (error) {
        console.error('Error saving database:', error);
    }
}

function getDefaultDB() {
    return {
        users: [
            {
                id: 1,
                name: "Mr.Mostafa Nassar",
                email: "mostafa.nassar@4am-system.com",
                password: bcrypt.hashSync("Admin@123", 10),
                role: "admin",
                department: null,
                isMainAdmin: true
            },
            {
                id: 2,
                name: "Mr.Ahmed Nagy",
                email: "ahmed.nagy@4am-system.com",
                password: bcrypt.hashSync("Admin@123", 10),
                role: "admin",
                department: null,
                isMainAdmin: false
            },
            {
                id: 3,
                name: "Mr.Ebrahim Ahmed",
                email: "ebrahim.ahmed@4am-system.com",
                password: bcrypt.hashSync("Admin@123", 10),
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
}

// Load database
let DB = loadDB();

// Save database on exit
process.on('SIGINT', () => {
    console.log('\nSaving database before exit...');
    saveDB();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nSaving database before exit...');
    saveDB();
    process.exit(0);
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth check:', {
        path: req.path,
        hasAuthHeader: !!authHeader,
        hasToken: !!token
    });

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Access denied - No token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }
        console.log('Token verified for user:', user.email);
        req.user = user;
        next();
    });
};

// Routes

// Register
app.post('/api/register', (req, res) => {
    const { name, email, password, role, department } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    if (role === 'employee' && !department) {
        return res.status(400).json({ error: 'يرجى اختيار القسم' });
    }

    if (!['assistant', 'employee'].includes(role)) {
        return res.status(400).json({ error: 'الدور الوظيفي غير صحيح' });
    }

    // Check if email already exists
    const existingUser = DB.users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // Create new user
    const newUser = {
        id: DB.nextUserId++,
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        role,
        department: role === 'employee' ? department : null,
        isMainAdmin: false
    };

    DB.users.push(newUser);
    saveDB();

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
        message: 'تم إنشاء الحساب بنجاح',
        user: userWithoutPassword 
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const user = DB.users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
});

// Get current user
app.get('/api/user', authenticateToken, (req, res) => {
    const user = DB.users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// Users Routes
app.get('/api/users', authenticateToken, (req, res) => {
    // Allow all authenticated users to get basic user info (for displaying names in tickets)
    const users = DB.users.map(({ password, ...user }) => user);
    res.json(users);
});

app.post('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = DB.users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = {
        id: DB.nextUserId++,
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        role,
        department: department || null,
        isMainAdmin: false
    };

    DB.users.push(newUser);
    saveDB();
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const userId = parseInt(req.params.id);
    const user = DB.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
        return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    DB.users = DB.users.filter(u => u.id !== userId);
    saveDB();
    res.json({ message: 'User deleted successfully' });
});

// Tickets Routes
app.get('/api/tickets', authenticateToken, (req, res) => {
    let tickets = DB.tickets;

    if (req.user.role === 'employee') {
        tickets = tickets.filter(t => t.toUserId === req.user.id);
    } else if (req.user.role === 'assistant') {
        tickets = tickets.filter(t => 
            t.toUserId === req.user.id || t.fromUserId === req.user.id
        );
    }

    res.json(tickets);
});

app.post('/api/tickets', authenticateToken, (req, res) => {
    const { toUserId, message } = req.body;

    if (!toUserId || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const currentUser = DB.users.find(u => u.id === req.user.id);
    const toUser = DB.users.find(u => u.id === toUserId);

    if (!toUser) {
        return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check permissions
    if (currentUser.role === 'assistant' && toUser.role !== 'employee') {
        return res.status(403).json({ error: 'Assistants can only send tickets to employees' });
    }

    if (currentUser.role === 'admin' && !currentUser.isMainAdmin && toUser.role === 'admin') {
        return res.status(403).json({ error: 'Only main admin can send tickets to other admins' });
    }

    const ticket = {
        id: DB.nextTicketId++,
        fromUserId: req.user.id,
        toUserId,
        message,
        status: 'open',
        comments: [],
        createdAt: new Date().toISOString()
    };

    DB.tickets.push(ticket);
    saveDB();
    res.status(201).json(ticket);
});

app.post('/api/tickets/:id/comments', authenticateToken, (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Comment text is required' });
    }

    const ticket = DB.tickets.find(t => t.id === ticketId);
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    const comment = {
        userId: req.user.id,
        text,
        createdAt: new Date().toISOString()
    };

    ticket.comments.push(comment);
    saveDB();
    res.status(201).json(comment);
});

app.patch('/api/tickets/:id/status', authenticateToken, (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;

    // Updated status options: open, in_progress, completed
    if (!status || !['open', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = DB.tickets.find(t => t.id === ticketId);
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user has permission to update status
    const currentUser = DB.users.find(u => u.id === req.user.id);
    
    // Employees can only update their own tickets
    if (currentUser.role === 'employee' && ticket.toUserId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own tickets' });
    }

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    saveDB();
    
    console.log(`Ticket ${ticketId} status updated to ${status} by ${currentUser.email}`);
    res.json(ticket);
});

// Incentives Routes
app.get('/api/incentives', authenticateToken, (req, res) => {
    let incentives = DB.incentives;

    if (req.user.role === 'employee') {
        incentives = incentives.filter(i => i.userId === req.user.id);
    }

    res.json(incentives);
});

app.post('/api/incentives', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can add incentives' });
    }

    const { userId, type, amount, reason, month, year } = req.body;

    if (!userId || !type || !amount || !reason || !month || !year) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['incentive', 'deduction'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
    }

    const user = DB.users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const incentive = {
        id: DB.nextIncentiveId++,
        userId,
        type,
        amount: parseFloat(amount),
        reason,
        month: parseInt(month),
        year: parseInt(year),
        createdAt: new Date().toISOString()
    };

    DB.incentives.push(incentive);
    saveDB();
    res.status(201).json(incentive);
});

// Stats Route
app.get('/api/stats', authenticateToken, (req, res) => {
    let stats = {};

    if (req.user.role === 'admin') {
        stats = {
            totalUsers: DB.users.length,
            totalTickets: DB.tickets.length,
            totalIncentives: DB.incentives.filter(i => i.type === 'incentive').length,
            totalDeductions: DB.incentives.filter(i => i.type === 'deduction').length,
            openTickets: DB.tickets.filter(t => t.status === 'open').length,
            closedTickets: DB.tickets.filter(t => t.status === 'closed').length
        };
    } else {
        const myTickets = DB.tickets.filter(t => t.toUserId === req.user.id);
        stats = {
            myTickets: myTickets.length,
            openTickets: myTickets.filter(t => t.status === 'open').length,
            closedTickets: myTickets.filter(t => t.status === 'closed').length
        };
    }

    res.json(stats);
});

// Admin Routes (no authentication for development)
app.get('/api/admin/users', (req, res) => {
    const users = DB.users.map(({ password, ...user }) => user);
    res.json(users);
});

app.post('/api/admin/reset-password/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const user = DB.users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    saveDB();

    res.json({ 
        message: 'تم إعادة تعيين كلمة المرور بنجاح',
        email: user.email 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database loaded with ${DB.users.length} users, ${DB.tickets.length} tickets`);
    console.log(`Admin panel: http://localhost:${PORT}/admin-panel.html`);
});
