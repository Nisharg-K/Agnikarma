// public/js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logout-btn").addEventListener("click", () => {
        fetch('/logout', { method: 'POST' })
            .then(() => {
                window.location.href = "/login";
            });
    });

    fetch('/api/me')
        .then(res => res.json())
        .then(user => {
            document.getElementById("user-greeting").textContent = `Welcome, ${user.name}`;
        });
});
