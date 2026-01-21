// Elementos
const upload = document.getElementById("upload");
const previewCanvas = document.getElementById("previewCanvas");
const originalCanvas = document.getElementById("originalCanvas");
const previewCtx = previewCanvas.getContext("2d");
const originalCtx = originalCanvas.getContext("2d");
const status = document.getElementById("status");
const confirmBtn = document.getElementById("confirmBtn");
const removeBtn = document.getElementById("removeBg");
const downloadBtn = document.getElementById("downloadBtn");
const downloadLink = document.getElementById("downloadLink");
const slider = document.getElementById("slider");

let confirmedFile = null;
let originalImage = null;

// -------------------------
// Upload da imagem
// -------------------------
upload.addEventListener("change", ()=>{
  const file = upload.files[0];
  if(!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = ()=>{
    originalImage = img;
    fitCanvasToContainer();
    drawImageCover(previewCanvas, previewCtx, img);
    drawImageCover(originalCanvas, originalCtx, img);

    confirmedFile = file;

    confirmBtn.disabled = false;
    removeBtn.disabled = true;
    downloadBtn.disabled = true;
    status.textContent = "Confira a imagem e clique em ➜ Confirmar";
  };
});

// -------------------------
// Confirmar imagem
// -------------------------
confirmBtn.addEventListener("click", ()=>{
  if(!confirmedFile) return;
  confirmBtn.disabled = true;
  removeBtn.disabled = false;
  status.textContent = "Imagem confirmada. Pronto para remover fundo.";
});

// -------------------------
// Redimensiona canvas ao container
// -------------------------
function fitCanvasToContainer(){
  const container = document.querySelector('.preview-container');
  const w = container.clientWidth;
  const h = container.clientHeight;

  previewCanvas.width = w;
  previewCanvas.height = h;
  originalCanvas.width = w;
  originalCanvas.height = h;

  if(originalImage){
    drawImageCover(previewCanvas, previewCtx, originalImage);
    drawImageCover(originalCanvas, originalCtx, originalImage);
  }
}

// Desenha imagem mantendo proporção dentro do canvas
function drawImageCover(canvas, ctx, img){
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.width;
  const ih = img.height;

  const scale = Math.min(cw/iw, ch/ih); // usar MIN para caber verticalmente
  const nw = iw*scale;
  const nh = ih*scale;
  const dx = (cw - nw)/2;
  const dy = (ch - nh)/2;

  ctx.clearRect(0,0,cw,ch);
  ctx.drawImage(img, dx, dy, nw, nh);
}

// -------------------------
// Slider Antes/Depois
// -------------------------
let isSliding = false;
slider.addEventListener("mousedown", ()=> isSliding=true);
window.addEventListener("mouseup", ()=> isSliding=false);
window.addEventListener("mousemove", e=>{
  if(!isSliding) return;
  const rect = slider.parentElement.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(rect.width, x));
  slider.style.left = `${x}px`;
  originalCanvas.style.clip = `rect(0px, ${x}px, ${rect.height}px, 0px)`;
});

window.addEventListener("resize", fitCanvasToContainer);

// -------------------------
// Remover fundo via API Remove.bg
// -------------------------
removeBtn.addEventListener("click", async ()=>{
  if(!confirmedFile) return;

  removeBtn.disabled = true;
  downloadBtn.disabled = true;
  status.textContent = "A remover fundo via Remove.bg…";

  const formData = new FormData();
  formData.append("image_file", confirmedFile);
  formData.append("size","auto");

  try{
    const response = await fetch("https://api.remove.bg/v1.0/removebg",{
      method:"POST",
      headers:{ "X-Api-Key":"ym6UERBcqNZTQbg4TEyLz5xc" },
      body: formData
    });

    if(!response.ok) throw new Error("Falha ao remover fundo");

    const blob = await response.blob();
    const resultURL = URL.createObjectURL(blob);

    const img = new Image();
    img.src = resultURL;
    img.onload = ()=>{
      drawImageCover(previewCanvas, previewCtx, img);
      drawImageCover(originalCanvas, originalCtx, originalImage);

      downloadLink.href = resultURL;
      downloadBtn.disabled = false;

      status.textContent = "Concluído ✅ Fundo removido!";
    };
  }catch(err){
    console.error(err);
    status.textContent = "Erro ao remover fundo ❌";
    removeBtn.disabled = false;
  }
});
