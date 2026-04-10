const tableBody = document.getElementById("tableBody");
const tableHeader = document.getElementById("tableHeader");
const pageTitle = document.getElementById("pageTitle");
const loader = document.getElementById("loader");

const companyNav = document.getElementById("companyNav");
const studentNav = document.getElementById("studentNav");
const drivesNav = document.getElementById("drivesNav");

const detailModal = new bootstrap.Modal(document.getElementById("detailModal"));
const modalBody = document.getElementById("modalBody");
const modalTitle = document.getElementById("detailModalLabel");
const searchContainer = document.getElementById("searchContainer");

let placementChartInstance = null;
let currentDataType = "companies";

const handleSearch = async (event) => {
    event.preventDefault();
    const searchType = document.getElementById("searchType").value;
    const searchInput = document.getElementById("searchInput").value.trim();

    if (!searchInput) {
        fetchData(currentDataType);
        return;
    }

    loader.style.display = "block";
    tableBody.innerHTML = "";

    let baseUrl = "";
    if (currentDataType === "companies") {
        baseUrl = "/api/company/search_companies";
    } else if (currentDataType === "students") {
        baseUrl = "/api/student/search_students";
    } else {
        loader.style.display = "none";
        return;
    }

    const url = `${baseUrl}/by_${searchType}/${encodeURIComponent(searchInput)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (currentDataType === "companies") renderCompanies(data);
        if (currentDataType === "students") renderStudents(data);
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error connecting to "${url}": ${error.message}</td></tr>`;
    } finally {
        loader.style.display = "none";
    }
};

const clearSearch = () => {
    document.getElementById("searchInput").value = "";
    fetchData(currentDataType);
};


const viewDetails = async (id, type) => {
    modalBody.innerHTML =
        '<div class="text-center"><div class="spinner-border text-primary"></div></div>';
    detailModal.show();

    try {
        if (type === "drive") {
            const driveRes = await fetch(`/api/placement/get_drives/${id}`);
            const drive = await driveRes.json();
            console.log(drive);

            modalTitle.innerText = `Drive Details: ${drive.title}`;
            modalBody.innerHTML = `
        <div class="mb-3 text-center">
            <img src="/static/uploads/profiles/${drive.company_profile_pic}" alt="${drive.company_name} logo" class="img-fluid rounded-circle shadow-sm" style="width: 80px; height: 80px; object-fit: cover;">
            <p class="mt-2 text-muted fw-bold">${drive.company_name}</p>
        </div>
        <h6><strong>Requirements:</strong> ${drive.requirements || "No requirements provided."}</h6>
        <p><strong>Description:</strong> ${drive.description}</p>
        <hr>
        <h6>Applications (${drive.total_applications})</h6>
        <table class="table table-sm">
            <thead><tr><th>Student ID</th><th>Student Name</th><th>View Resume</th><th>Status</th></tr></thead>
            <tbody>
                ${drive.applications
                    .map(
                        (app) => `
                    <tr>
                        <td>${app.student_id}</td>
                        <td>${app.student_name}</td>
                        <td>
                          <a href="${app.resume_link}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-file-earmark-pdf"></i> View Resume
                          </a>
                        </td>
                        <td><span class="badge bg-secondary">${app.status}</span></td>
                    </tr>
                `,
                    )
                    .join("")}
            </tbody>
        </table>
      `;
        } else if (type === "company") {
            const res = await fetch(
                `/api/company/search_companies/by_id/${id}`,
            );
            const data = await res.json();
            const company = data[0];
            modalTitle.innerText = company.name;
            modalBody.innerHTML = `
        <div class="mb-3 text-center">
            <img src="/static/uploads/profiles/${company.profile_pic}" alt="${company.name} logo" class="img-fluid rounded-circle shadow-sm" style="width: 100px; height: 100px; object-fit: cover;">
        </div>
        <p><strong>Email:</strong> ${company.email}</p>
        <p><strong>Status:</strong> ${company.is_active ? "Verified" : "Pending"}</p>
      `;
        } else if (type === "student") {
            const res = await fetch(`/api/student/search_students/by_id/${id}`);
            const data = await res.json();
            const student = data[0];
            modalTitle.innerText = student.name;
            modalBody.innerHTML = `
        <div class="mb-3 text-center">
            <img src="/static/uploads/profiles/${student.profile_pic}" alt="${student.name} photo" class="img-fluid rounded-circle shadow-sm" style="width: 100px; height: 100px; object-fit: cover;">
        </div>
        <p><strong>Email:</strong> ${student.email}</p>
        <p><strong>Status:</strong> ${student.is_active ? "Verified" : "Pending"}</p>
      `;
        }
    } catch (err) {
        modalBody.innerHTML = `<div class="alert alert-danger">Failed to load details: ${err.message}</div>`;
    }
};

const renderCompanies = (companies) => {
    pageTitle.innerText = "Company Management";
    tableHeader.innerHTML = `<tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th><th>View Details</th></tr>`;

    companyNav.classList.add("active");
    studentNav.classList.remove("active");
    drivesNav.classList.remove("active");

    const statsContainer = document.getElementById("statsContainer");
    if (statsContainer) statsContainer.classList.add("d-none");
    if (searchContainer) searchContainer.classList.remove("d-none");

    companies.forEach((company) => {
        const actionBtn = company.is_active
            ? `<button class="btn btn-sm btn-outline-danger" onclick="apiAction('/api/company/deactivate/${company.id}', 'PATCH', 'companies')">Deactivate</button>`
            : `<button class="btn btn-sm btn-success" onclick="apiAction('/api/company/activate/${company.id}', 'PATCH', 'companies')">Approve</button>`;

        tableBody.innerHTML += `
            <tr>
                <td>${company.id}</td>
                <td><strong>${company.name}</strong></td>
                <td>${company.email}</td>
                <td><span class="badge ${company.is_active ? "bg-success" : "bg-warning"}">${company.is_active ? "Active" : "Pending"}</span></td>
                <td>${actionBtn}</td>
                <td><button class="btn btn-sm btn-info text-white" onclick="viewDetails('${company.id}', 'company')">View</button></td>
            </tr>`;
    });
};

const renderStudents = (students) => {
    pageTitle.innerText = "Student Management";
    tableHeader.innerHTML = `<tr><th>ID</th><th>Student Name</th><th>Email</th><th>Status</th><th>Actions</th><th>View Details</th></tr>`;

    companyNav.classList.remove("active");
    studentNav.classList.add("active");
    drivesNav.classList.remove("active");

    const statsContainer = document.getElementById("statsContainer");
    if (statsContainer) statsContainer.classList.add("d-none");
    if (searchContainer) searchContainer.classList.remove("d-none");

    students.forEach((student) => {
        const actionBtn = student.is_active
            ? `<button class="btn btn-sm btn-outline-danger" onclick="apiAction('/api/student/deactivate/${student.id}', 'PATCH', 'students')">Deactivate</button>`
            : `<button class="btn btn-sm btn-success" onclick="apiAction('/api/student/activate/${student.id}', 'PATCH', 'students')">Approve</button>`;

        tableBody.innerHTML += `
            <tr>
                <td>${student.id}</td>
                <td>${student.name || "N/A"}</td>
                <td>${student.email}</td>
                <td><span class="badge ${student.is_active ? "bg-success" : "bg-warning"}">${student.is_active ? "Active" : "Pending"}</span></td>
                <td>${actionBtn}</td>
                <td><button class="btn btn-sm btn-info text-white" onclick="viewDetails('${student.id}', 'student')">View</button></td>
            </tr>`;
    });
};

const renderDrives = (drives) => {
    pageTitle.innerText = "Placement Drives";
    tableHeader.innerHTML =
        "<tr><th>ID</th><th>Title</th><th>Company Name</th><th>Status</th><th>Actions</th><th>View Details</th></tr>";

    companyNav.classList.remove("active");
    studentNav.classList.remove("active");
    drivesNav.classList.add("active");
    if (searchContainer) searchContainer.classList.add("d-none");

    drives.forEach(async (drive) => {
        const response = await fetch(
            `/api/company/search_companies/by_id/${drive.company_id}`,
        );
        const data = await response.json();
        const company_name = data[0].name;

        const actionBtn = drive.is_approved
            ? `<button class="btn btn-sm btn-outline-danger" onclick="apiAction('/api/placement/reject_drive/${drive.id}', 'PATCH', 'drives')">Reject</button>`
            : `<button class="btn btn-sm btn-success" onclick="apiAction('/api/placement/approve_drive/${drive.id}', 'PATCH', 'drives')">Approve</button>`;

        tableBody.innerHTML += `
            <tr>
                <td>#${drive.id}</td>
                <td><strong>${drive.title || "Title not found"}</strong></td>
                <td>${company_name || "Company Name not found"}</td>
                <td><span class="badge ${drive.is_approved ? "bg-success" : "bg-warning"}">${drive.is_approved ? "Active" : "Pending"}</span></td>
                <td>${actionBtn}</td>
                <td><button class="btn btn-sm btn-info text-white" onclick="viewDetails('${drive.id}', 'drive')">View</button></td>
            </tr>`;
    });

    const statsContainer = document.getElementById("statsContainer");
    if (statsContainer) {
        statsContainer.classList.remove("d-none");

        const approvedDrives = drives.filter(d => d.is_approved);
        const driveTitles = approvedDrives.map(d => d.title || `Drive #${d.id}`);
        
        const appliedData = approvedDrives.map(d => d.application_stats?.applied || 0);
        const shortlistedData = approvedDrives.map(d => d.application_stats?.shortlisted || 0);
        const selectedData = approvedDrives.map(d => d.application_stats?.selected || 0);
        const rejectedData = approvedDrives.map(d => d.application_stats?.rejected || 0);

        const ctx = document.getElementById('placementChart').getContext('2d');
        if (placementChartInstance) {
            placementChartInstance.destroy();
        }
        placementChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: driveTitles,
                datasets: [
                    {
                        label: 'Applied',
                        data: appliedData,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)'
                    },
                    {
                        label: 'Shortlisted',
                        data: shortlistedData,
                        backgroundColor: 'rgba(255, 193, 7, 0.7)'
                    },
                    {
                        label: 'Selected',
                        data: selectedData,
                        backgroundColor: 'rgba(25, 135, 84, 0.7)'
                    },
                    {
                        label: 'Rejected',
                        data: rejectedData,
                        backgroundColor: 'rgba(220, 53, 69, 0.7)'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Application Status per Approved Drive',
                        font: { size: 16 }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: { 
                        stacked: true,
                        beginAtZero: true, 
                        ticks: { stepSize: 1 } 
                    }
                }
            }
        });
    }
};

const fetchData = async (type) => {
    currentDataType = type;
    loader.style.display = "block";
    tableBody.innerHTML = "";

    let url = "";
    if (type === "companies") url = "/api/company/get_companies";
    if (type === "students") url = "/api/student/get_students";
    if (type === "drives") url = "/api/placement/get_drives";
    console.log(type, url);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (type === "companies") renderCompanies(data);
        if (type === "students") renderStudents(data);
        if (type === "drives") renderDrives(data);
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error connecting to "${url}"</td></tr>`;
    } finally {
        loader.style.display = "none";
    }
};

const apiAction = async (url, method = "PATCH", refreshType) => {
    try {
        const response = await fetch(url, { method: method });
        if (response.ok) {
            fetchData(refreshType);
        } else {
            const data = await response.json();
            alert(`Action failed. Error: ${data.error}`);
        }
    } catch (err) {
        console.error("API Error:", err);
    }
};

const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
        try {
            const response = await fetch("/logout", { method: "GET" });

            if (response.redirected) {
                window.location.href = response.url;
            } else {
                window.location.href = "/login";
            }
        } catch (err) {
            console.error("Logout failed:", err);
            window.location.href = "/login";
        }
    }
};

window.onload = () => fetchData("companies");
