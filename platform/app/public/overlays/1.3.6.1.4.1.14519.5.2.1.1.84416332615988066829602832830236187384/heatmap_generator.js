
// Run this in browser console to create test overlay images
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');

// Create gradient
const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
gradient.addColorStop(0, 'rgba(255, 100, 0, 0.5019607843137255)');
gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 512);

// Download
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'heatmap.png';
  a.click();
});
