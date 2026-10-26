(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const MAX_IMAGE = 10 * 1024 * 1024;
  const MAX_PDF = 15 * 1024 * 1024;
  const PDF_LIB = () => window.PDFLib;
  let photoImage = null, photoUrl = null, imageFile = null, imageUrl = null, pdfFiles = [];

  $("year").textContent = new Date().getFullYear();
  document.querySelectorAll("[data-trigger]").forEach(button => button.addEventListener("click", () => $(button.dataset.trigger).click()));

  function status(id, message, type = "") {
    const el = $(id); el.textContent = message; el.className = "status" + (type ? " " + type : "");
  }
  function validImage(file) {
    return file && ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= MAX_IMAGE;
  }
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth > 10000 || img.naturalHeight > 10000 || img.naturalWidth * img.naturalHeight > 40000000) {
          URL.revokeObjectURL(url); reject(new Error("Image dimensions are too large to process safely.")); return;
        }
        resolve({ img, url });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be opened. Try a different file.")); };
      img.src = url;
    });
  }
  function setupDrop(zoneId, inputId, handler, multiple = false) {
    const zone = $(zoneId), input = $(inputId);
    zone.addEventListener("click", e => { if (!e.target.closest("button")) input.click(); });
    input.addEventListener("change", () => { if (input.files?.length) handler(Array.from(input.files)); });
    ["dragenter", "dragover"].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.add("dragover"); }));
    ["dragleave", "drop"].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.remove("dragover"); }));
    zone.addEventListener("drop", e => {
      const dropped = Array.from(e.dataTransfer.files || []);
      handler(multiple ? dropped : dropped.slice(0, 1));
    });
  }
  function setPhotoPreset() {
    const [w, h] = $("photoPreset").value.split("x").map(Number);
    $("photoCanvas").width = w; $("photoCanvas").height = h; drawPhoto();
  }
  function drawPhoto() {
    if (!photoImage) return;
    const canvas = $("photoCanvas"), ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = $("photoBg").value; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const zoom = Number($("photoZoom").value) / 100;
    const ratio = canvas.width / canvas.height;
    let sw = photoImage.naturalWidth, sh = photoImage.naturalHeight;
    // Center-crop to target aspect ratio, with optional zoom.
    if (sw / sh > ratio) sw = sh * ratio; else sh = sw / ratio;
    sw /= zoom; sh /= zoom;
    const sx = (photoImage.naturalWidth - sw) / 2, sy = (photoImage.naturalHeight - sh) / 2;
    ctx.drawImage(photoImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }
  async function choosePhoto(files) {
    const file = files[0];
    if (!validImage(file)) { status("photoStatus", "Choose a JPG, PNG or WebP image smaller than 10 MB.", "error"); return; }
    try {
      const loaded = await loadImage(file);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoImage = loaded.img; photoUrl = loaded.url;
      $("photoDrop").classList.add("hidden"); $("photoEditor").classList.remove("hidden");
      $("photoZoom").value = 100; setPhotoPreset();
      status("photoStatus", `${file.name} loaded locally. Original size: ${file.size.toLocaleString()} bytes.`, "success");
    } catch (e) { status("photoStatus", e.message, "error"); }
  }
  setupDrop("photoDrop", "photoFile", choosePhoto);
  $("photoZoom").addEventListener("input", drawPhoto);
  $("photoBg").addEventListener("change", drawPhoto);
  $("photoPreset").addEventListener("change", setPhotoPreset);
  $("downloadPhoto").addEventListener("click", () => {
    if (!photoImage) return;
    $("photoCanvas").toBlob(blob => {
      if (!blob) { status("photoStatus", "Could not export this image.", "error"); return; }
      downloadBlob(blob, "passport-photo.jpg");
      status("photoStatus", `Ready: ${(blob.size / 1024).toFixed(1)} KB JPEG downloaded. Check the target application's official photo rules.`, "success");
    }, "image/jpeg", .92);
  });
  $("resetPhoto").addEventListener("click", () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoImage = null; photoUrl = null; $("photoFile").value = "";
    $("photoEditor").classList.add("hidden"); $("photoDrop").classList.remove("hidden"); status("photoStatus", "");
  });

  async function chooseImage(files) {
    const file = files[0];
    if (!validImage(file)) { status("imageStatus", "Choose a JPG, PNG or WebP image smaller than 10 MB.", "error"); return; }
    try {
      const loaded = await loadImage(file);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageFile = file; imageUrl = loaded.url; $("imagePreview").src = imageUrl;
      $("imgWidth").value = loaded.img.naturalWidth; $("imgHeight").value = loaded.img.naturalHeight;
      $("imageEditor").classList.remove("hidden"); $("imageDrop").classList.add("hidden");
      status("imageStatus", `Loaded ${loaded.img.naturalWidth} × ${loaded.img.naturalHeight}px · ${(file.size / 1024).toFixed(1)} KB`, "success");
      imageFile._loadedImage = loaded.img;
    } catch (e) { status("imageStatus", e.message, "error"); }
  }
  setupDrop("imageDrop", "imageFile", chooseImage);
  $("imgQuality").addEventListener("input", () => $("qualityValue").textContent = `${$("imgQuality").value}%`);
  $("imgWidth").addEventListener("input", () => {
    if (!$("keepRatio").checked || !imageFile?._loadedImage) return;
    const w = Number($("imgWidth").value), img = imageFile._loadedImage;
    if (w > 0) $("imgHeight").value = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
  });
  $("imgHeight").addEventListener("input", () => {
    if (!$("keepRatio").checked || !imageFile?._loadedImage) return;
    const h = Number($("imgHeight").value), img = imageFile._loadedImage;
    if (h > 0) $("imgWidth").value = Math.max(1, Math.round(h * img.naturalWidth / img.naturalHeight));
  });
  $("downloadImage").addEventListener("click", async () => {
    if (!imageFile?._loadedImage) return;
    const w = Number($("imgWidth").value), h = Number($("imgHeight").value);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 5000 || h > 5000) {
      status("imageStatus", "Enter width and height between 1 and 5000 pixels.", "error"); return;
    }
    const type = $("imgFormat").value, quality = Number($("imgQuality").value) / 100, target = Number($("targetKB").value);
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(imageFile._loadedImage, 0, 0, w, h);
    const toBlob = q => new Promise(resolve => canvas.toBlob(resolve, type, q));
    let blob = await toBlob(quality);
    if (target > 0 && type === "image/jpeg") {
      let q = quality;
      for (let i = 0; i < 7 && blob && blob.size > target * 1024 && q > .2; i++) { q = Math.max(.2, q - .1); blob = await toBlob(q); }
      if (blob && blob.size > target * 1024) status("imageStatus", `Best result is ${(blob.size / 1024).toFixed(1)} KB; target ${target} KB could not be reached at this size. Try smaller dimensions.`, "error");
    }
    if (!blob) { status("imageStatus", "Could not export the image.", "error"); return; }
    downloadBlob(blob, type === "image/png" ? "resized-image.png" : "resized-image.jpg");
    status("imageStatus", `Downloaded ${w} × ${h}px · ${(blob.size / 1024).toFixed(1)} KB.`, "success");
  });
  $("resetImage")?.addEventListener("click", resetImage);
  const resetImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = null; imageFile = null; $("imageFile").value = ""; $("imagePreview").removeAttribute("src");
    $("imageEditor").classList.add("hidden"); $("imageDrop").classList.remove("hidden"); status("imageStatus", "");
  };
  // Add a reset button to the editor without requiring another static markup control.
  const resetBtn = document.createElement("button");
  resetBtn.className = "btn secondary full"; resetBtn.textContent = "Choose another image"; resetBtn.addEventListener("click", resetImage);
  $("imageEditor").querySelector(".editor-controls").appendChild(resetBtn);

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function formatBytes(n) { return n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`; }
  async function choosePdfs(files) {
    if (!files.length) return;
    if (files.length > 5) { status("pdfStatus", "Please choose no more than 5 PDFs at once.", "error"); return; }
    if (files.some(f => !(f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) || f.size > MAX_PDF)) {
      status("pdfStatus", "Choose PDF files only, each smaller than 15 MB.", "error"); return;
    }
    pdfFiles = files;
    $("pdfDrop").classList.add("hidden"); $("pdfEditor").classList.remove("hidden");
    renderPdfList();
    status("pdfStatus", "Files selected. PDF processing happens in your browser.", "success");
  }
  function renderPdfList() {
    const list = $("pdfFileList"); list.replaceChildren();
    pdfFiles.forEach((f, i) => {
      const row = document.createElement("div"); row.className = "pdf-item";
      const badge = document.createElement("span"); badge.className = "pdf-badge"; badge.textContent = "PDF";
      const name = document.createElement("span"); name.textContent = f.name;
      const size = document.createElement("small"); size.textContent = formatBytes(f.size);
      row.append(badge, name, size); list.appendChild(row);
    });
  }
  setupDrop("pdfDrop", "pdfFiles", choosePdfs, true);
  $("mergePdf").addEventListener("click", async () => {
    if (!pdfFiles.length) return;
    if (!PDF_LIB()) { status("pdfStatus", "PDF library did not load. Check your internet connection and reload.", "error"); return; }
    try {
      status("pdfStatus", "Merging PDFs…");
      const merged = await PDF_LIB().PDFDocument.create();
      for (const file of pdfFiles) {
        const bytes = await file.arrayBuffer();
        const doc = await PDF_LIB().PDFDocument.load(bytes, { ignoreEncryption: false });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), "merged-document.pdf");
      status("pdfStatus", `Merged ${pdfFiles.length} files into ${merged.getPageCount()} pages. Download started.`, "success");
    } catch (e) { status("pdfStatus", "Could not merge these PDFs. They may be encrypted, damaged or unsupported.", "error"); }
  });
  $("splitPdf").addEventListener("click", async () => {
    if (!pdfFiles.length) { status("pdfStatus", "Choose a PDF first.", "error"); return; }
    if (!PDF_LIB()) { status("pdfStatus", "PDF library did not load. Check your internet connection and reload.", "error"); return; }
    const raw = $("splitRange").value.trim();
    if (!raw) { status("pdfStatus", "Enter pages, for example 1-3, 5.", "error"); return; }
    try {
      status("pdfStatus", "Extracting pages…");
      const source = await PDF_LIB().PDFDocument.load(await pdfFiles[0].arrayBuffer());
      const total = source.getPageCount(), indices = new Set();
      for (const part of raw.split(",")) {
        const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) throw new Error("Invalid page range");
        const start = Number(match[1]), end = Number(match[2] || match[1]);
        if (start < 1 || end < start || end > total || end - start > 500) throw new Error("Page range outside document");
        for (let n = start; n <= end; n++) indices.add(n - 1);
      }
      if (!indices.size) throw new Error("No pages selected");
      const out = await PDF_LIB().PDFDocument.create();
      const pages = await out.copyPages(source, Array.from(indices).sort((a,b) => a-b));
      pages.forEach(p => out.addPage(p));
      const bytes = await out.save();
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), "extracted-pages.pdf");
      status("pdfStatus", `Extracted ${pages.length} page(s) from a ${total}-page PDF.`, "success");
    } catch (e) { status("pdfStatus", e.message === "Invalid page range" || e.message === "Page range outside document" ? e.message + "." : "Could not extract pages. Check the range and make sure the first PDF is valid and not encrypted.", "error"); }
  });
  $("resetPdf").addEventListener("click", () => {
    pdfFiles = []; $("pdfFiles").value = ""; $("pdfEditor").classList.add("hidden"); $("pdfDrop").classList.remove("hidden"); status("pdfStatus", "");
  });
})();