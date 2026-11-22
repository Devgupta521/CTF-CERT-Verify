
let certificates = {};

async function loadCertificates() {
  const message = document.getElementById("message");

  try {
    const response = await fetch("./certificates.json", {
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
      "Certificate database is unavailable. Please try again later.";

    console.error("Certificate database error:", error);
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
  image.src = certificate.certificate;
  image.hidden = false;

  image.onerror = () => {
    image.hidden = true;
  };

  // Generate unique verification URL
  const verificationURL = new URL(
    window.location.pathname,
    window.location.origin
  );

  verificationURL.searchParams.set("id", id);

  // Generate QR code
  if (typeof QRCode === "undefined") {
    message.textContent = "QR code library unavailable.";
    return;
  }

  new QRCode(qrContainer, {
    text: verificationURL.href,
    width: 200,
    height: 200,
    colorDark: "#06111f",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  // Download certificate
  document.getElementById("downloadBtn").onclick = () => {
    const link = document.createElement("a");

    link.href = certificate.certificate;
    link.download = certificate.certificate.split("/").pop();

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print certificate
  document.getElementById("printBtn").onclick = () => {
    window.print();
  };

  // Update browser URL
  history.replaceState(null, "", verificationURL.href);
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