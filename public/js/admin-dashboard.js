document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();
  fetchPendingRequests();
  fetchAllPatients();

  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('patientSearch')?.addEventListener('input', filterPatients);
});

async function fetchDashboardData() {
  try {
    const response = await fetch('/api/admin-dashboard-data');
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    const data = await response.json();
    updateDashboard(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    showNotification('Error loading dashboard data', 'error');
  }
}

function updateDashboard(data) {
  // Admin name
  if (data.user) {
    document.getElementById('userName').textContent = data.user.fullName;
  }

  // Stats
  if (data.stats) {
    document.getElementById('doctorCount').textContent = data.stats.doctorCount;
    document.getElementById('patientCount').textContent = data.stats.patientCount;
    document.getElementById('pendingRequestsCount').textContent = data.stats.pendingRequests;
  }

  // Doctors
  if (Array.isArray(data.doctors)) {
    const doctorsList = document.getElementById('doctorsList');
    doctorsList.innerHTML = '';
    data.doctors.forEach(doctor => {
      doctorsList.innerHTML += `
        <li class="doctor-item">
          <div class="doctor-info">
            <h4>${doctor.fullName}</h4>
            <p>${doctor.specialization || 'General'}</p>
          </div>
        </li>`;
    });
  }

  // Recent patients
  if (Array.isArray(data.recentPatients)) {
    const tbody = document.querySelector('#recentPatientsTable tbody');
    tbody.innerHTML = '';
    data.recentPatients.forEach(patient => {
      const [age, gender] = (patient.ageGender || '').split(' ');
      const visitDate = patient.visit1 ? new Date(patient.visit1).toLocaleDateString('en-IN') : '-';

      tbody.innerHTML += `
        <tr>
          <td>${patient.patientName || '-'}</td>
          <td>${age || '-'}</td>
          <td>${gender || '-'}</td>
          <td>${patient.diagnosis || '-'}</td>
          <td>${patient.doctorAssigned?.fullName || 'Unassigned'}</td>
          <td>${visitDate}</td>
          <td><a href="/view-patient/${patient._id}" class="btn btn-sm btn-outline-primary">View</a></td>
        </tr>`;
    });
  }
}

async function fetchPendingRequests() {
  try {
    const res = await fetch('/api/admin/pending-requests');
    if (!res.ok) throw new Error('Failed to fetch pending requests');
    const requests = await res.json();
    displayPendingRequests(requests);
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    showNotification('Error loading pending requests', 'error');
  }
}

function displayPendingRequests(requests) {
  const container = document.getElementById('pendingRequestsContainer');
  if (!requests.length) {
    container.innerHTML = '<p>No pending account requests.</p>';
    return;
  }

  container.innerHTML = '';
  requests.forEach(req => {
    container.innerHTML += `
      <div class="request-card" data-id="${req._id}">
        <div class="request-info">
          <h3>${req.fullName}</h3>
          <p><strong>Username:</strong> ${req.username}</p>
          <p><strong>Email:</strong> ${req.email}</p>
          <p><strong>Phone:</strong> ${req.phone || 'Not provided'}</p>
          <p><strong>Specialization:</strong> ${req.specialization || 'Not specified'}</p>
          <p><strong>Date:</strong> ${new Date(req.requestDate || Date.now()).toLocaleDateString()}</p>
        </div>
        <div class="request-actions">
          <button class="approve-btn" onclick="approveRequest('${req._id}')">Approve</button>
          <button class="reject-btn" onclick="rejectRequest('${req._id}')">Reject</button>
        </div>
      </div>`;
  });
}

async function approveRequest(id) {
  try {
    const res = await fetch(`/api/approve-account/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Unknown error');

    showNotification('Account approved successfully', 'success');
    document.querySelector(`.request-card[data-id="${id}"]`)?.remove();
    fetchDashboardData();
  } catch (err) {
    console.error(err);
    showNotification('Error approving request: ' + err.message, 'error');
  }
}

async function rejectRequest(id) {
  try {
    const res = await fetch(`/api/reject-account/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Unknown error');

    showNotification('Request rejected', 'success');
    document.querySelector(`.request-card[data-id="${id}"]`)?.remove();
  } catch (err) {
    console.error(err);
    showNotification('Error rejecting request: ' + err.message, 'error');
  }
}

function showNotification(message, type = 'info') {
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => {
    div.classList.add('fade-out');
    setTimeout(() => div.remove(), 500);
  }, 5000);
}

function logout() {
  window.location.href = '/logout';
}

// ========================
// All Patients Table Logic
// ========================
let allPatients = [];

async function fetchAllPatients() {
  try {
    const res = await fetch('/api/admin/patients');
    allPatients = await res.json();
    renderPatientList(allPatients);
  } catch (err) {
    console.error('Error fetching patients:', err);
  }
}

function renderPatientList(patients) {
  const container = document.getElementById('patientListContainer');
  if (!patients.length) {
    container.innerHTML = '<p>No patients found.</p>';
    return;
  }

  const rows = patients.map(p => {
    const [age, gender] = (p.ageGender || '').split(' ');
    const visitDate = p.visit1 ? new Date(p.visit1).toLocaleDateString('en-IN') : '-';

    return `
      <tr>
        <td>${p.patientName || '-'}</td>
        <td>${age || '-'}</td>
        <td>${gender || '-'}</td>
        <td>${p.group || '-'}</td>
        <td>${p.doctorAssigned?.fullName || '—'}</td>
        <td>${visitDate}</td>
        <td>
          <a class="btn btn-sm btn-outline-primary" href="/view-patient/${p._id}">View</a>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
          <th>Gender</th>
          <th>Group</th>
          <th>Doctor</th>
          <th>Visit Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function filterPatients(e) {
  const keyword = e.target.value.toLowerCase();
  const filtered = allPatients.filter(p =>
    p.patientName?.toLowerCase().includes(keyword) ||
    p.diagnosis?.toLowerCase().includes(keyword) ||
    p.ageGender?.toLowerCase().includes(keyword)
  );
  renderPatientList(filtered);
}
