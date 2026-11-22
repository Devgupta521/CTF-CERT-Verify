
let certificates = {};

const PORTAL_URL =
  "https://devgupta521.github.io/CTF-CERT-Verify/";

async function loadCertificates() {
  const message = document.getElementById("message");

  try {
    const databaseURL = new URL(
      "certificates.json",
      PORTAL_URL
    );

    const response = await fetch(databaseURL.href, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Database request failed: ${response.status}`);
    }

    certificates = await response.json();

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
      document.getElementById("certificateId").value = id;
      verifyCertificate();
    }

  } catch (error) {
    message.textContent =
      "Certificate database unavailable. Please try again later.";

    console.error("Database error:", error);
  }
}

function verifyCertificate() {
  const id = document.getElementById("certificateId")
    .value.trim();

  const result = document.getElementById("result");
  const message = document.getElementById("message");
  const qrContainer = document.getElementById("qrCode");
  const image = document.getElementById("certificateImage");

  result.classList.add("hidden");
  message.textContent = "";
  qrContainer.replaceChildren();
  image.hidden = true;
  image.removeAttribute("src");

  if (!id) {
    message.textContent = "Enter a certificate ID.";
    return;
  }

  const certificate = certificates[id];

  if (!certificate) {
    message.textContent = "Certificate not found.";
    return;
  }

  result.classList.remove("hidden");

  const statusBadge = document.getElementById("statusBadge");
  const details = document.getElementById("details");

  statusBadge.className = "status";
  details.replaceChildren();

  if (certificate.status !== "Valid") {
    statusBadge.textContent = "✕ CERTIFICATE REVOKED";
    statusBadge.classList.add("revoked");

    details.textContent =
      "This certificate has been revoked and is no longer valid.";

    return;
  }

  statusBadge.textContent = "✓ VALID CERTIFICATE";

  const fields = [
    ["Participant Name", certificate.name],
    ["Certificate ID", id],
    ["Certificate Type", certificate.type],
    ["Event", certificate.event],
    ["Position", certificate.position],
    ["Issue Date", certificate.issueDate]
  ];

  fields.forEach(([label, value]) => {
    const p = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = label + ": ";

    p.append(
      strong,
      document.createTextNode(value || "-")
    );

    details.appendChild(p);
  });

  // Display certificate image
  if (certificate.certificate) {
    image.src = new URL(
      certificate.certificate,
      PORTAL_URL
    ).href;

    image.hidden = false;

    image.onerror = () => {
      image.hidden = true;
    };
  }

  // Generate the permanent QR verification URL
  const verificationURL =
    PORTAL_URL + "?id=" + encodeURIComponent(id);

  if (typeof QRCode !== "undefined") {
    new QRCode(qrContainer, {
      text: verificationURL,
      width: 200,
      height: 200,
      colorDark: "#06111f",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    message.textContent = "QR code library unavailable.";
  }

  // Download certificate
  const downloadBtn = document.getElementById("downloadBtn");

  downloadBtn.onclick = () => {
    if (!certificate.certificate) return;

    const link = document.createElement("a");
    link.href = new URL(
      certificate.certificate,
      PORTAL_URL
    ).href;

    link.download = certificate.certificate.split("/").pop();

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print certificate
  document.getElementById("printBtn").onclick = () => {
    window.print();
  };

  // Update address bar
  history.replaceState(
    null,
    "",
    PORTAL_URL + "?id=" + encodeURIComponent(id)
  );
}

// Enter key verification
document.getElementById("certificateId")
  .addEventListener("keydown", event => {
    if (event.key === "Enter") {
      verifyCertificate();
    }
  });

// Load certificate database
loadCertificates();