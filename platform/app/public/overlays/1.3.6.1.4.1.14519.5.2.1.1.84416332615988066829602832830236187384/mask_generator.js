
// Run this in browser console to create test overlay images
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');

// Create gradient
const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
gradient.addColorStop(0, 'rgba(0, 150, 255, 0.35294117647058826)');
gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 512);

// Download
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mask.png';
  a.click();
});
