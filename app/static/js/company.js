const tableBody = document.getElementById("tableBody");
const tableHeader = document.getElementById("tableHeader");
const pageTitle = document.getElementById("pageTitle");
const loader = document.getElementById("loader");

const activeDrivesNav = document.getElementById("activeDrivesNav");
const closedDrivesNav = document.getElementById("closedDrivesNav");

const detailModal = new bootstrap.Modal(document.getElementById("detailModal"));
const modalBody = document.getElementById("modalBody");
const modalTitle = document.getElementById("detailModalLabel");

const viewApplications = async (driveId) => {
    modalBody.innerHTML =
        '<div class="text-center py-5"><div class="spinner-border text-info"></div></div>';
    detailModal.show();

    try {
        const res = await fetch(`/api/placement/get_drives/${driveId}`);
        const drive = await res.json();

        modalTitle.innerText = `Applications: ${drive.title}`;
        modalBody.innerHTML = `
        <div class="mb-4">
            <p class="text-muted mb-1">Job Title</p>
            <h5 class="fw-bold">${drive.title}</h5>
        </div>
        <div class="mb-4">
            <p class="text-muted mb-1">Job Description</p>
            <h5 class="fw-bold">${drive.description}</h5>
        </div>
        <div class="mb-4">
            <p class="text-muted mb-1">Job Requirments</p>
            <h5 class="fw-bold">${drive.requirements}</h5>
        </div>
        <table class="table align-middle">
            <thead class="table-light">
                <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Resume</th>
                    <th>Status</th>
                    <th class="text-end">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${drive.applications
                    .map(
                        (app) => `
                    <tr>
                        <td><strong>${app.student_name}</strong></td>
                        <td>${app.student_email}</td>
                        <td>
                            <a href="${app.resume_link}" target="_blank" class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-file-earmark-pdf"></i> View PDF
                            </a>
                        </td>
                        <td><span class="badge bg-secondary">${app.status}</span></td>
                        <td class="text-end">
                            <select class="form-select form-select-sm d-inline-block w-auto"
                                onchange="updateStatus(${app.id}, this.value)">
                                <option value="" selected disabled>Update Status</option>
                                <option value="Shortlisted">Shortlist</option>
                                <option value="Waiting">Waiting</option>
                                <option value="Rejected">Reject</option>
                            </select>
                        </td>
                    </tr>
                    `,
                    )
                    .join("")}
            </tbody>
        </table>
    `;
    } catch (err) {
        modalBody.innerHTML = `<div class="alert alert-danger m-3">Error: ${err.message}</div>`;
    }
};

const fetchDrives = async (statusType) => {
    loader.style.display = "inline-block";
    tableBody.innerHTML = "";

    if (statusType === "active") {
        pageTitle.innerText = "Active Placement Drives";
        activeDrivesNav.classList.add("active");
        closedDrivesNav.classList.remove("active");
    } else {
        pageTitle.innerText = "Closed Drives Archive";
        activeDrivesNav.classList.remove("active");
        closedDrivesNav.classList.add("active");
    }

    tableHeader.innerHTML = `<tr><th>ID</th><th>Drive Name</th><th>Status</th><th>Applications</th><th>Change Status</th><th>Delete Recruitment Drive</th></tr>`;

    try {
        const response = await fetch("/api/placement/my_drives");
        const drives = await response.json();

        const filtered = drives.filter((d) =>
            statusType === "active"
                ? d.is_approved && !d.is_closed
                : !d.is_approved || d.is_closed,
        );

        filtered.forEach((drive) => {
            tableBody.innerHTML += `
        <tr>
            <td>#${drive.id}</td>
            <td><strong>${drive.title}</strong></td>
            <td><span class="badge ${drive.is_approved ? (drive.is_closed ? "bg-danger" : "bg-success") : "bg-warning"}">
                ${drive.is_approved ? (drive.is_closed ? "Closed" : "Approved") : "Pending Approval"}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-info px-3" onclick="viewApplications(${drive.id}, '${drive.title}')">
                    Review Applications
                </button>
            </td>
            <td>
                <button ${drive.is_approved ? "" : "disabled"} class="btn btn-sm btn-outline-secondary" onclick="toggleDriveStatus(${drive.id}, ${drive.is_closed})">
                    ${drive.is_closed ? "Reopen" : drive.is_approved ? "Close" : "Cannot change status"}
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-danger px-3" onclick="deleteDrive(${drive.id})">
                    Delete Drive
                </button>
            </td>
        </tr>
      `;
        });
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading drives. ${error}</td></tr>`;
    } finally {
        loader.style.display = "none";
    }
};

const toggleDriveStatus = async (driveId, closeStatus) => {
    if (!confirm("Are you sure you want to toggle this drives status?")) {
        return;
    }

    try {
        const response = await fetch(`/api/placement/edit_drive/${driveId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_closed: !closeStatus }),
        });

        if (response.ok) {
            fetchDrives("active");
        } else {
            const data = await response.json();
            alert(`Error: ${data.error || "Could not close drive"}`);
        }
    } catch (err) {
        console.error("API Error:", err);
        alert("Failed to connect to server.");
    }
};

const deleteDrive = async (driveId) => {
    if (!confirm("Are you sure you want to delete this drive?")) {
        return;
    }

    try {
        const response = await fetch(`/api/placement/remove_drive/${driveId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            fetchDrives("active");
        } else {
            const data = await response.json();
            alert(`Error: ${data.error || "Could not delete drive"}`);
        }
    } catch (err) {
        console.error("API Error:", err);
        alert("Failed to connect to server.");
    }
};

const updateStatus = async (appId, newStatus) => {
    try {
        const res = await fetch(`/api/application/update-status/${appId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) alert(`Application ${newStatus}`);
    } catch (err) {
        alert(`Failed to update status. ${err}`);
    }
};

document
    .getElementById("createDriveForm")
    .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch("/api/placement/create_drive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                // Close modal
                const modalInstance = bootstrap.Modal.getInstance(
                    document.getElementById("createDriveModal"),
                );
                modalInstance.hide();
                // Refresh the list
                fetchDrives("active");
                e.target.reset();
            } else {
                const errorData = await response.json();
                alert(
                    `Error: ${errorData.message || "Failed to create drive"}`,
                );
            }
        } catch (err) {
            console.error("Creation Error:", err);
        }
    });

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

window.onload = () => fetchDrives("active");
