document.addEventListener('DOMContentLoaded', () => {
    const createAccountForm = document.getElementById('create-account-form');
    const alertContainer = document.getElementById('alert-container');
    
    // Show alert message
    const showAlert = (message, type = 'danger') => {
      alertContainer.innerHTML = `
        <div class="alert alert-${type}">
          ${message}
        </div>
      `;
      
      // Auto dismiss after 5 seconds if it's a success message
      if (type === 'success') {
        setTimeout(() => {
          alertContainer.innerHTML = '';
        }, 5000);
      }
      
      // Scroll to top to show the alert
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // Password validation
    const validatePassword = (password) => {
      // At least 8 characters, one uppercase, one lowercase, and one number
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      return passwordRegex.test(password);
    };
    
    // Handle form submission
    createAccountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const specialization = document.getElementById('specialization').value;
      
      // Basic validation
      if (!username || !password || !fullName || !email || !specialization) {
        showAlert('All required fields must be filled out');
        return;
      }
      
      // Password validation
      if (!validatePassword(password)) {
        showAlert('Password must be at least 8 characters long and include uppercase, lowercase, and number');
        return;
      }
      
      try {
        const response = await fetch('/create-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            password,
            fullName,
            email,
            phone,
            specialization
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          showAlert(data.error || 'Failed to create account');
          return;
        }
        
        // Reset the form
        createAccountForm.reset();
        
        // Show success message
        showAlert(data.success || 'Account request submitted successfully. Please wait for admin approval.', 'success');
        
      } catch (error) {
        console.error('Account creation error:', error);
        showAlert('Failed to create account. Please try again later.');
      }
    });
  });