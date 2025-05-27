// admin-dashboard.js - Client-side JavaScript for the admin dashboard

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in and has admin privileges
  fetchDashboardData();
  fetchPendingRequests();

  // Setup event listeners
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// Fetch dashboard data from the server
async function fetchDashboardData() {
  try {
      const response = await fetch('/api/admin-dashboard-data');
      if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      updateDashboard(data);
  } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('Error loading dashboard data', 'error');
  }
}

// Update dashboard UI with data
function updateDashboard(data) {
  // Update user information
  if (data.user) {
      document.getElementById('userName').textContent = data.user.fullName;
  }
  
  // Update statistics
  if (data.stats) {
      document.getElementById('doctorCount').textContent = data.stats.doctorCount;
      document.getElementById('patientCount').textContent = data.stats.patientCount;
      document.getElementById('pendingRequestsCount').textContent = data.stats.pendingRequests;
  }
  
  // Update doctors list
  if (data.doctors && data.doctors.length > 0) {
      const doctorsList = document.getElementById('doctorsList');
      doctorsList.innerHTML = '';
      
      data.doctors.forEach(doctor => {
          const li = document.createElement('li');
          li.className = 'doctor-item';
          li.innerHTML = `
              <div class="doctor-info">
                  <h4>${doctor.fullName}</h4>
                  <p>${doctor.specialization || 'General'}</p>
              </div>
          `;
          doctorsList.appendChild(li);
      });
  }
  
  // Update recent patients
  if (data.recentPatients && data.recentPatients.length > 0) {
      const recentPatientsTable = document.getElementById('recentPatientsTable');
      const tbody = recentPatientsTable.querySelector('tbody') || recentPatientsTable;
      tbody.innerHTML = '';
      
      data.recentPatients.forEach(patient => {
          const row = document.createElement('tr');
          const admissionDate = new Date(patient.admissionDate).toLocaleDateString();
          //insert element at a particular positon
          row.innerHTML = `
              <td>${patient.name}</td>
              <td>${patient.age}</td>
              <td>${patient.gender}</td>
              <td>${patient.diagnosis || 'Not specified'}</td>
              <td>${patient.assignedDoctor ? patient.assignedDoctor.fullName : 'Unassigned'}</td>
              <td>${admissionDate}</td>
          `;
          tbody.appendChild(row);
      });
  }
}

// Fetch pending account requests
async function fetchPendingRequests() {
  try {
      const response = await fetch('/api/admin/pending-requests');
      if (!response.ok) {
          throw new Error('Failed to fetch pending requests');
      }
      
      const requests = await response.json();
      displayPendingRequests(requests);
  } catch (error) {
      console.error('Error fetching pending requests:', error);
      showNotification('Error loading pending account requests', 'error');
  }
}

// Display pending account requests
function displayPendingRequests(requests) {
  const requestsContainer = document.getElementById('pendingRequestsContainer');
  
  if (!requests || requests.length === 0) {
      requestsContainer.innerHTML = '<p>No pending account requests.</p>';
      return;
  }
  
  requestsContainer.innerHTML = '';
  
  requests.forEach(request => {
      const requestCard = document.createElement('div');
      requestCard.className = 'request-card';
      requestCard.dataset.id = request._id;
      
      requestCard.innerHTML = `
          <div class="request-info">
              <h3>${request.fullName}</h3>
              <p><strong>Username:</strong> ${request.username}</p>
              <p><strong>Email:</strong> ${request.email}</p>
              <p><strong>Phone:</strong> ${request.phone || 'Not provided'}</p>
              <p><strong>Specialization:</strong> ${request.specialization || 'Not specified'}</p>
              <p><strong>Date:</strong> ${new Date(request.requestDate || Date.now()).toLocaleDateString()}</p>
          </div>
          <div class="request-actions">
              <button class="approve-btn" onclick="approveRequest('${request._id}')">Approve</button>
              <button class="reject-btn" onclick="rejectRequest('${request._id}')">Reject</button>
          </div>
      `;
      
      requestsContainer.appendChild(requestCard);
  });
}

// Approve account request
async function approveRequest(requestId) {
  try {
      const response = await fetch(`/api/approve-account/${requestId}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          }
      });
      
      if (!response.ok) {
          throw new Error('Failed to approve request');
      }
      
      const result = await response.json();
      if (result.success) {
          showNotification('Account approved successfully', 'success');
          // Remove the request card from UI
          const requestCard = document.querySelector(`.request-card[data-id="${requestId}"]`);
          requestCard?.remove();
          
          // Refresh dashboard data
          fetchDashboardData();
      } else {
          throw new Error(result.error || 'Unknown error');
      }
  } catch (error) {
      console.error('Error approving request:', error);
      showNotification('Error approving account: ' + error.message, 'error');
  }
}

// Reject account request
async function rejectRequest(requestId) {
  try {
      const response = await fetch(`/api/reject-account/${requestId}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          }
      });
      
      if (!response.ok) {
          throw new Error('Failed to reject request');
      }
      
      const result = await response.json();
      if (result.success) {
          showNotification('Account request rejected', 'success');
          // Remove the request card from UI
          const requestCard = document.querySelector(`.request-card[data-id="${requestId}"]`);
          requestCard?.remove();
      } else {
          throw new Error(result.error || 'Unknown error');
      }
  } catch (error) {
      console.error('Error rejecting request:', error);
      showNotification('Error rejecting account: ' + error.message, 'error');
  }
}

// Display notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
          notification.remove();
      }, 500);
  }, 5000);
}

// Logout function
function logout() {
  window.location.href = '/logout';
}