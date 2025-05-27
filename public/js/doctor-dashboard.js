// public/js/doctor-dashboard.js
document.addEventListener("DOMContentLoaded", () => {
    fetch('/api/my-patients')
        .then(res => res.json())
        .then(data => {
            const patientList = document.getElementById("my-patients");
            patientList.innerHTML = "";
            data.forEach(patient => {
                const li = document.createElement("li");
                li.textContent = `${patient.name}, Age: ${patient.age}, Condition: ${patient.condition}`;
                patientList.appendChild(li);
            });
        });
});
