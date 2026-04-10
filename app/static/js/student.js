const dynamicContent = document.getElementById("dynamicContent");
const pageTitle = document.getElementById("pageTitle");
const loader = document.getElementById("loader");
const drivesNav = document.getElementById("drivesNav");
const historyNav = document.getElementById("historyNav");

let detailModal;
const modalBody = document.getElementById("modalBody");
const modalFooter = document.getElementById("modalFooter");
const modalTitle = document.getElementById("detailModalLabel");
let currentOpenDriveId = null;

document.addEventListener("DOMContentLoaded", () => {
    detailModal = new bootstrap.Modal(document.getElementById("detailModal"));
    fetchAvailableDrives();
});

const fetchAvailableDrives = async () => {
    loader.style.display = "inline-block";
    pageTitle.innerText = "Active Placement Drives";
    drivesNav.classList.add("active");
    historyNav.classList.remove("active");

    try {
        const res = await fetch("/api/placement/get_drives");
        const allDrives = await res.json();

        const drives = allDrives.filter((d) => d.is_approved && !d.is_closed);

        if (drives.length === 0) {
            dynamicContent.innerHTML = `<div class="text-center py-5 text-muted"><h5>No active drives at the moment.</h5></div>`;
            return;
        }

        dynamicContent.innerHTML = drives
            .map(
                (drive) => `
            <div class="col-md-4">
                <div class="card h-100 border-0 shadow-sm card-drive">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="badge bg-info-subtle text-info px-3 py-2">ID: #${drive.id}</span>
                            <i class="bi bi-briefcase text-secondary h4"></i>
                        </div>
                        <h5 class="card-title fw-bold text-dark">${drive.title}</h5>
                        <p class="text-muted small mb-3">
                            ${drive.description.substring(0, 100)}${drive.description.length > 100 ? "..." : ""}
                        </p>
                        <div class="mb-3">
                            <small class="text-secondary fw-bold">Requirements:</small><br>
                            <small class="text-dark">${drive.requirements || "General"}</small>
                        </div>
                        <button class="btn btn-outline-info w-100 fw-bold" onclick="showDriveDetails(${JSON.stringify(drive).replace(/"/g, "&quot;")})">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `,
            )
            .join("");
    } catch (err) {
        dynamicContent.innerHTML = `<div class="alert alert-danger">Failed to load drives.</div>`;
    } finally {
        loader.style.display = "none";
    }
};

const showDriveDetails = (drive) => {
    modalTitle.innerText = drive.title;
    modalBody.innerHTML = `
        <div class="mb-4 text-center">
            <img src="/static/uploads/profiles/${drive.company_profile_pic}" alt="${drive.company_name} logo" class="img-fluid rounded-circle shadow-sm" style="width: 80px; height: 80px; object-fit: cover;">
            <p class="mt-2 text-muted fw-bold mb-0">${drive.company_name}</p>
        </div>
        <div class="mb-3">
            <label class="small fw-bold text-secondary text-uppercase">Job Description</label>
            <p class="text-dark">${drive.description}</p>
        </div>
        <div class="mb-3">
            <label class="small fw-bold text-secondary text-uppercase">Eligibility Criteria</label>
            <p class="text-dark">${drive.requirements || "No specific requirements mentioned."}</p>
        </div>
    `;

    currentOpenDriveId = drive.id;
    document.getElementById("uploadSection").classList.add("d-none");
    const actionBtn = document.getElementById("mainActionBtn");
    actionBtn.innerText = "Apply Now";
    actionBtn.onclick = () => prepareUpload();
    document.getElementById("resumeFile").value = "";

    detailModal.show();
};

const fetchHistory = async () => {
    loader.style.display = "inline-block";
    pageTitle.innerText = "My Application History";
    drivesNav.classList.remove("active");
    historyNav.classList.add("active");

    try {
        const res = await fetch("/api/application/my-applications");
        const apps = await res.json();

        dynamicContent.innerHTML = `
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-3">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Sr No.</th>
                                    <th>Drive Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    apps.length
                                        ? apps
                                              .map(
                                                  (app, index) => `
                                    <tr>
                                        <td>${index + 1}.</td>
                                        <td><strong>${app.drive_title}</strong></td>
                                        <td><span class="badge ${getStatusBadge(app.status)}">${app.status}</span></td>
                                    </tr>
                                `,
                                              )
                                              .join("")
                                        : '<tr><td colspan="4" class="text-center py-4">You haven\'t applied to any drives yet.</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        dynamicContent.innerHTML = `<div class="alert alert-danger">Failed to load history.</div>`;
    } finally {
        loader.style.display = "none";
    }
};

const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s.includes("shortlist")) return "bg-success";
    if (s.includes("reject")) return "bg-danger";
    if (s.includes("wait")) return "bg-warning text-dark";
    return "bg-secondary";
};

const prepareUpload = () => {
    const uploadSection = document.getElementById("uploadSection");
    const actionBtn = document.getElementById("mainActionBtn");

    if (uploadSection.classList.contains("d-none")) {
        uploadSection.classList.remove("d-none");
        actionBtn.innerText = "Submit Application";
        actionBtn.onclick = () => submitWithResume();
    }
};

const submitWithResume = async () => {
    const fileInput = document.getElementById("resumeFile");
    const driveId = currentOpenDriveId;

    if (!fileInput.files[0]) {
        alert("Please select a PDF resume first.");
        return;
    }

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);

    const actionBtn = document.getElementById("mainActionBtn");
    const originalText = actionBtn.innerText;
    actionBtn.disabled = true;
    actionBtn.innerText = "Submitting...";

    try {
        const res = await fetch(`/api/application/apply/${driveId}`, {
            method: "POST",
            body: formData,
        });

        const result = await res.json();

        if (res.ok) {
            alert("Application and Resume uploaded successfully!");
            detailModal.hide();
            fetchHistory();
        } else {
            alert(
                result.error ||
                    "Upload failed. Ensure the file is a valid PDF under 2MB.",
            );
        }
    } catch (err) {
        console.error(err);
        alert("Server error during upload.");
    } finally {
        actionBtn.disabled = false;
        actionBtn.innerText = originalText;
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
