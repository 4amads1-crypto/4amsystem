// Check authentication
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'index.html';
}

// Global variables
let allUsers = [];
let allTickets = [];
let allIncentives = [];

// Helper function to get status text in Arabic
function getStatusText(status) {
    switch(status) {
        case 'open': return 'مفتوحة';
        case 'in_progress': return 'قيد التنفيذ';
        case 'completed': return 'تم الإنجاز';
        case 'closed': return 'مغلقة';
        default: return status;
    }
}

// Update user info
document.getElementById('userName').textContent = currentUser.name;
const roleText = currentUser.role === 'admin' ? 'مدير' : 
                 currentUser.role === 'assistant' ? 'مساعد' : 'موظف';
document.getElementById('userRole').textContent = roleText;

// Show/hide menu items based on role
if (currentUser.role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
}
if (currentUser.role !== 'employee') {
    document.querySelectorAll('.employee-only').forEach(el => el.classList.add('hidden'));
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    AuthAPI.logout();
    window.location.href = 'index.html';
});

// Navigation
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const page = this.dataset.page;
        loadPage(page);
    });
});

async function loadPage(page) {
    const content = document.getElementById('content');
    const pageTitle = document.getElementById('pageTitle');
    
    try {
        switch(page) {
            case 'home':
                pageTitle.textContent = 'الرئيسية';
                await renderHomePage(content);
                break;
            case 'tickets':
                pageTitle.textContent = 'التذاكر';
                await renderTicketsPage(content);
                break;
            case 'users':
                pageTitle.textContent = 'إدارة المستخدمين';
                await renderUsersPage(content);
                break;
            case 'incentives':
                pageTitle.textContent = 'الحوافز والخصومات';
                await renderIncentivesPage(content);
                break;
            case 'my-incentives':
                pageTitle.textContent = 'حوافزي';
                await renderMyIncentivesPage(content);
                break;
        }
    } catch (error) {
        content.innerHTML = `<div style="color: red; text-align: center;">حدث خطأ: ${error.message}</div>`;
    }
}

async function renderHomePage(content) {
    const stats = await StatsAPI.get();
    allTickets = await TicketsAPI.getAll();
    
    content.innerHTML = `
        <div class="stats-grid">
            ${currentUser.role === 'admin' ? `
            <div class="stat-card">
                <h3>المستخدمين</h3>
                <div class="number">${stats.totalUsers}</div>
            </div>
            <div class="stat-card">
                <h3>التذاكر المفتوحة</h3>
                <div class="number">${stats.openTickets}</div>
            </div>
            <div class="stat-card">
                <h3>الحوافز</h3>
                <div class="number">${stats.totalIncentives}</div>
            </div>
            <div class="stat-card">
                <h3>الخصومات</h3>
                <div class="number">${stats.totalDeductions}</div>
            </div>
            ` : `
            <div class="stat-card">
                <h3>تذاكري</h3>
                <div class="number">${stats.myTickets}</div>
            </div>
            <div class="stat-card">
                <h3>المفتوحة</h3>
                <div class="number">${stats.openTickets}</div>
            </div>
            <div class="stat-card">
                <h3>المغلقة</h3>
                <div class="number">${stats.closedTickets}</div>
            </div>
            `}
        </div>
        <div class="table-container">
            <h2 style="margin-bottom: 20px;">آخر التذاكر</h2>
            <div id="recentTickets"></div>
        </div>
    `;
    
    renderRecentTickets();
}

async function renderRecentTickets() {
    const container = document.getElementById('recentTickets');
    if (!allUsers.length) allUsers = await UsersAPI.getAll();
    
    const tickets = allTickets.slice(-5).reverse();
    
    if (tickets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">لا توجد تذاكر</p>';
        return;
    }
    
    tickets.forEach(ticket => {
        const fromUser = allUsers.find(u => u.id === ticket.fromUserId);
        const toUser = allUsers.find(u => u.id === ticket.toUserId);
        
        const ticketEl = document.createElement('div');
        ticketEl.className = 'ticket-item';
        ticketEl.innerHTML = `
            <div class="ticket-header">
                <div>
                    <strong>من:</strong> ${fromUser?.name || 'غير معروف'} → <strong>إلى:</strong> ${toUser?.name || 'غير معروف'}
                </div>
                <span class="badge badge-${ticket.status}">${ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}</span>
            </div>
            <div class="ticket-body">${ticket.message}</div>
            <small style="color: #999;">${new Date(ticket.createdAt).toLocaleString('ar-EG')}</small>
        `;
        container.appendChild(ticketEl);
    });
}

async function renderTicketsPage(content) {
    content.innerHTML = `
        ${currentUser.role !== 'employee' ? `
        <button class="btn btn-primary" onclick="openNewTicketModal()" style="margin-bottom: 20px; width: auto;">
            إرسال تذكرة جديدة
        </button>
        ` : ''}
        <div class="table-container">
            <h2 style="margin-bottom: 20px;">التذاكر</h2>
            <div id="ticketsList"></div>
        </div>
        
        <div id="ticketModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>تذكرة جديدة</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>إلى</label>
                        <select id="ticketTo"></select>
                    </div>
                    <div class="form-group">
                        <label>الرسالة</label>
                        <textarea id="ticketMessage"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-small" onclick="closeTicketModal()">إلغاء</button>
                    <button class="btn btn-primary btn-small" onclick="sendTicket()">إرسال</button>
                </div>
            </div>
        </div>
        
        <div id="viewTicketModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>تفاصيل التذكرة</h2>
                </div>
                <div class="modal-body" id="ticketDetails"></div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-small" onclick="closeViewTicketModal()">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    
    await renderTicketsList();
}

async function renderTicketsList() {
    const container = document.getElementById('ticketsList');
    allTickets = await TicketsAPI.getAll();
    if (!allUsers.length) allUsers = await UsersAPI.getAll();
    
    if (allTickets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">لا توجد تذاكر</p>';
        return;
    }
    
    allTickets.slice().reverse().forEach(ticket => {
        const fromUser = allUsers.find(u => u.id === ticket.fromUserId);
        const toUser = allUsers.find(u => u.id === ticket.toUserId);
        
        const ticketEl = document.createElement('div');
        ticketEl.className = 'ticket-item';
        ticketEl.style.cursor = 'pointer';
        ticketEl.onclick = () => viewTicket(ticket.id);
        ticketEl.innerHTML = `
            <div class="ticket-header">
                <div>
                    <strong>من:</strong> ${fromUser?.name || 'غير معروف'} → <strong>إلى:</strong> ${toUser?.name || 'غير معروف'}
                </div>
                <span class="badge badge-${ticket.status}">${ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}</span>
            </div>
            <div class="ticket-body">${ticket.message}</div>
            <small style="color: #999;">${new Date(ticket.createdAt).toLocaleString('ar-EG')}</small>
        `;
        container.appendChild(ticketEl);
    });
}

async function openNewTicketModal() {
    const modal = document.getElementById('ticketModal');
    const select = document.getElementById('ticketTo');
    select.innerHTML = '<option value="">اختر المستخدم</option>';
    
    if (!allUsers.length) allUsers = await UsersAPI.getAll();
    
    let users = allUsers.filter(u => u.id !== currentUser.id);
    
    if (currentUser.role === 'assistant') {
        users = users.filter(u => u.role === 'employee');
    } else if (currentUser.role === 'admin' && !currentUser.isMainAdmin) {
        users = users.filter(u => u.role !== 'admin');
    }
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        const roleText = user.role === 'admin' ? 'مدير' : 
                        user.role === 'assistant' ? 'مساعد' : 'موظف';
        option.textContent = `${user.name} (${roleText})`;
        select.appendChild(option);
    });
    
    modal.classList.add('active');
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('active');
    document.getElementById('ticketMessage').value = '';
}

async function sendTicket() {
    const toUserId = parseInt(document.getElementById('ticketTo').value);
    const message = document.getElementById('ticketMessage').value;
    
    if (!toUserId || !message) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    try {
        await TicketsAPI.create({ toUserId, message });
        closeTicketModal();
        await renderTicketsList();
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
}

async function viewTicket(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    const fromUser = allUsers.find(u => u.id === ticket.fromUserId);
    const toUser = allUsers.find(u => u.id === ticket.toUserId);
    
    const modal = document.getElementById('viewTicketModal');
    const details = document.getElementById('ticketDetails');
    
    // Get status text and badge
    let statusText = 'مفتوحة';
    if (ticket.status === 'in_progress') statusText = 'قيد التنفيذ';
    else if (ticket.status === 'completed') statusText = 'تم الإنجاز';
    else if (ticket.status === 'closed') statusText = 'مغلقة';
    
    let commentsHtml = '';
    if (ticket.comments.length > 0) {
        commentsHtml = '<div class="comments"><h3>التعليقات</h3>';
        ticket.comments.forEach(comment => {
            const commentUser = allUsers.find(u => u.id === comment.userId);
            commentsHtml += `
                <div class="comment">
                    <div class="comment-author">${commentUser?.name || 'غير معروف'}</div>
                    <div>${comment.text}</div>
                    <small style="color: #999;">${new Date(comment.createdAt).toLocaleString('ar-EG')}</small>
                </div>
            `;
        });
        commentsHtml += '</div>';
    }
    
    // Status buttons for employees
    let statusButtonsHtml = '';
    if (currentUser.role === 'employee' && ticket.toUserId === currentUser.id) {
        statusButtonsHtml = `
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h4 style="margin-bottom: 10px;">تحديث حالة المهمة:</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${ticket.status !== 'in_progress' ? `
                        <button class="btn btn-small" style="background: #f39c12; color: white;" 
                                onclick="updateTicketStatus(${ticketId}, 'in_progress')">
                            قيد التنفيذ
                        </button>
                    ` : ''}
                    ${ticket.status !== 'completed' ? `
                        <button class="btn btn-small" style="background: #27ae60; color: white;" 
                                onclick="updateTicketStatus(${ticketId}, 'completed')">
                            تم الإنجاز
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    details.innerHTML = `
        <div class="ticket-item">
            <div class="ticket-header">
                <div>
                    <strong>من:</strong> ${fromUser?.name || 'غير معروف'}<br>
                    <strong>إلى:</strong> ${toUser?.name || 'غير معروف'}
                </div>
                <span class="badge badge-${ticket.status}">${statusText}</span>
            </div>
            <div class="ticket-body">${ticket.message}</div>
            <small style="color: #999;">${new Date(ticket.createdAt).toLocaleString('ar-EG')}</small>
            ${statusButtonsHtml}
            ${commentsHtml}
        </div>
        <div class="form-group">
            <label>إضافة تعليق</label>
            <textarea id="newComment"></textarea>
        </div>
        <button class="btn btn-primary btn-small" onclick="addComment(${ticketId})">إضافة تعليق</button>
    `;
    
    modal.classList.add('active');
}

function closeViewTicketModal() {
    document.getElementById('viewTicketModal').classList.remove('active');
}

async function addComment(ticketId) {
    const commentText = document.getElementById('newComment').value;
    if (!commentText) {
        alert('يرجى كتابة تعليق');
        return;
    }
    
    try {
        await TicketsAPI.addComment(ticketId, commentText);
        allTickets = await TicketsAPI.getAll();
        viewTicket(ticketId);
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
}

async function updateTicketStatus(ticketId, status) {
    try {
        await TicketsAPI.updateStatus(ticketId, status);
        allTickets = await TicketsAPI.getAll();
        
        let statusText = status === 'in_progress' ? 'قيد التنفيذ' : 'تم الإنجاز';
        alert(`تم تحديث حالة المهمة إلى: ${statusText}`);
        
        viewTicket(ticketId);
        
        // Refresh tickets list if on tickets page
        const ticketsList = document.getElementById('ticketsList');
        if (ticketsList) {
            await renderTicketsList();
        }
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
}

async function renderUsersPage(content) {
    content.innerHTML = `
        <button class="btn btn-primary" onclick="openNewUserModal()" style="margin-bottom: 20px; width: auto;">
            إضافة مستخدم جديد
        </button>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الدور</th>
                        <th>القسم</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody id="usersTable"></tbody>
            </table>
        </div>
        
        <div id="userModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>مستخدم جديد</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>الاسم</label>
                        <input type="text" id="userName">
                    </div>
                    <div class="form-group">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="userEmail">
                    </div>
                    <div class="form-group">
                        <label>كلمة المرور</label>
                        <input type="password" id="userPassword">
                    </div>
                    <div class="form-group">
                        <label>الدور</label>
                        <select id="userRole">
                            <option value="assistant">مساعد</option>
                            <option value="employee">موظف</option>
                        </select>
                    </div>
                    <div class="form-group" id="departmentGroup">
                        <label>القسم</label>
                        <select id="userDepartment"></select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-small" onclick="closeUserModal()">إلغاء</button>
                    <button class="btn btn-primary btn-small" onclick="saveUser()">حفظ</button>
                </div>
            </div>
        </div>
    `;
    
    await renderUsersTable();
}

async function renderUsersTable() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';
    
    allUsers = await UsersAPI.getAll();
    
    allUsers.forEach(user => {
        const tr = document.createElement('tr');
        const roleText = user.role === 'admin' ? 'مدير' : 
                        user.role === 'assistant' ? 'مساعد' : 'موظف';
        const badgeClass = user.role === 'admin' ? 'badge-admin' : 
                          user.role === 'assistant' ? 'badge-assistant' : 'badge-employee';
        
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge ${badgeClass}">${roleText}</span></td>
            <td>${user.department || '-'}</td>
            <td>
                ${user.role !== 'admin' ? `
                <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">حذف</button>
                ` : '<span style="color: #999;">-</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openNewUserModal() {
    const modal = document.getElementById('userModal');
    const deptSelect = document.getElementById('userDepartment');
    deptSelect.innerHTML = '<option value="">اختر القسم</option>';
    
    const departments = [
        "Account Manager", "Monitor", "Moderator", "Media Buyer",
        "Graphic Designer", "Reel Creator", "Content Creator", "Photographer"
    ];
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptSelect.appendChild(option);
    });
    
    document.getElementById('userRole').addEventListener('change', function() {
        document.getElementById('departmentGroup').style.display = 
            this.value === 'employee' ? 'block' : 'none';
    });
    
    modal.classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

async function saveUser() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const department = role === 'employee' ? document.getElementById('userDepartment').value : null;
    
    if (!name || !email || !password || (role === 'employee' && !department)) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    try {
        await UsersAPI.create({ name, email, password, role, department });
        closeUserModal();
        await renderUsersTable();
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        try {
            await UsersAPI.delete(userId);
            await renderUsersTable();
        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        }
    }
}

async function renderIncentivesPage(content) {
    content.innerHTML = `
        <button class="btn btn-primary" onclick="openNewIncentiveModal()" style="margin-bottom: 20px; width: auto;">
            إضافة حافز/خصم
        </button>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>الموظف</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>السبب</th>
                        <th>الشهر/السنة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody id="incentivesTable"></tbody>
            </table>
        </div>
        
        <div id="incentiveModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>إضافة حافز/خصم</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>الموظف</label>
                        <select id="incentiveUser"></select>
                    </div>
                    <div class="form-group">
                        <label>النوع</label>
                        <select id="incentiveType">
                            <option value="incentive">حافز</option>
                            <option value="deduction">خصم</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>المبلغ</label>
                        <input type="number" id="incentiveAmount">
                    </div>
                    <div class="form-group">
                        <label>السبب</label>
                        <textarea id="incentiveReason"></textarea>
                    </div>
                    <div class="form-group">
                        <label>الشهر</label>
                        <select id="incentiveMonth">
                            <option value="1">يناير</option>
                            <option value="2">فبراير</option>
                            <option value="3">مارس</option>
                            <option value="4">أبريل</option>
                            <option value="5">مايو</option>
                            <option value="6">يونيو</option>
                            <option value="7">يوليو</option>
                            <option value="8">أغسطس</option>
                            <option value="9">سبتمبر</option>
                            <option value="10">أكتوبر</option>
                            <option value="11">نوفمبر</option>
                            <option value="12">ديسمبر</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>السنة</label>
                        <input type="number" id="incentiveYear" value="2025">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-small" onclick="closeIncentiveModal()">إلغاء</button>
                    <button class="btn btn-primary btn-small" onclick="saveIncentive()">حفظ</button>
                </div>
            </div>
        </div>
    `;
    
    await renderIncentivesTable();
}

async function renderIncentivesTable() {
    const tbody = document.getElementById('incentivesTable');
    tbody.innerHTML = '';
    
    allIncentives = await IncentivesAPI.getAll();
    if (!allUsers.length) allUsers = await UsersAPI.getAll();
    
    if (allIncentives.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">لا توجد حوافز أو خصومات</td></tr>';
        return;
    }
    
    allIncentives.slice().reverse().forEach(inc => {
        const user = allUsers.find(u => u.id === inc.userId);
        const tr = document.createElement('tr');
        const typeText = inc.type === 'incentive' ? 'حافز' : 'خصم';
        const badgeClass = inc.type === 'incentive' ? 'badge-positive' : 'badge-negative';
        
        tr.innerHTML = `
            <td>${user?.name || 'غير معروف'}</td>
            <td><span class="badge ${badgeClass}">${typeText}</span></td>
            <td>${inc.amount} جنيه</td>
            <td>${inc.reason}</td>
            <td>${inc.month}/${inc.year}</td>
            <td>${new Date(inc.createdAt).toLocaleDateString('ar-EG')}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function openNewIncentiveModal() {
    const modal = document.getElementById('incentiveModal');
    const select = document.getElementById('incentiveUser');
    select.innerHTML = '<option value="">اختر الموظف</option>';
    
    if (!allUsers.length) allUsers = await UsersAPI.getAll();
    
    const employees = allUsers.filter(u => u.role === 'employee');
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.department})`;
        select.appendChild(option);
    });
    
    modal.classList.add('active');
}

function closeIncentiveModal() {
    document.getElementById('incentiveModal').classList.remove('active');
}

async function saveIncentive() {
    const userId = parseInt(document.getElementById('incentiveUser').value);
    const type = document.getElementById('incentiveType').value;
    const amount = parseFloat(document.getElementById('incentiveAmount').value);
    const reason = document.getElementById('incentiveReason').value;
    const month = parseInt(document.getElementById('incentiveMonth').value);
    const year = parseInt(document.getElementById('incentiveYear').value);
    
    if (!userId || !amount || !reason || !month || !year) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    try {
        await IncentivesAPI.create({ userId, type, amount, reason, month, year });
        closeIncentiveModal();
        await renderIncentivesTable();
    } catch (error) {
        alert('حدث خطأ: ' + error.message);
    }
}

async function renderMyIncentivesPage(content) {
    allIncentives = await IncentivesAPI.getAll();
    
    content.innerHTML = `
        <div class="table-container">
            <h2 style="margin-bottom: 20px;">حوافزي وخصوماتي</h2>
            <table>
                <thead>
                    <tr>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>السبب</th>
                        <th>الشهر/السنة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody id="myIncentivesTable"></tbody>
            </table>
        </div>
    `;
    
    const tbody = document.getElementById('myIncentivesTable');
    
    if (allIncentives.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">لا توجد حوافز أو خصومات</td></tr>';
        return;
    }
    
    allIncentives.slice().reverse().forEach(inc => {
        const tr = document.createElement('tr');
        const typeText = inc.type === 'incentive' ? 'حافز' : 'خصم';
        const badgeClass = inc.type === 'incentive' ? 'badge-positive' : 'badge-negative';
        
        tr.innerHTML = `
            <td><span class="badge ${badgeClass}">${typeText}</span></td>
            <td>${inc.amount} جنيه</td>
            <td>${inc.reason}</td>
            <td>${inc.month}/${inc.year}</td>
            <td>${new Date(inc.createdAt).toLocaleDateString('ar-EG')}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Load home page on start
loadPage('home');



