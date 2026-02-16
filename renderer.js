const banner = document.getElementById('update-banner');
const message = document.getElementById('update-message');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const actionBtn = document.getElementById('update-action');

function showBanner() {
  banner.classList.remove('hidden');
}

function showAction(text, handler) {
  actionBtn.textContent = text;
  actionBtn.classList.remove('hidden');
  actionBtn.onclick = handler;
}

function hideAction() {
  actionBtn.classList.add('hidden');
  actionBtn.onclick = null;
}

// Update disponible → mostrar banner con botón Download
window.electron.ipc.on('update:available', (data) => {
  message.textContent = `A new version (${data.version}) is available.`;
  showBanner();
  showAction('Download', async () => {
    hideAction();
    message.textContent = `Downloading ${data.version}...`;
    progressContainer.classList.remove('hidden');
    await window.electron.ipc.invoke('update:download');
  });
});

// Progreso de descarga
window.electron.ipc.on('update:download-progress', (data) => {
  progressBar.value = data.percent;
  progressText.textContent = `${data.percent.toFixed(1)}%`;
});

// Descarga completa → botón Restart & Update
window.electron.ipc.on('update:downloaded', (data) => {
  progressContainer.classList.add('hidden');
  message.textContent = `Version ${data.version} is ready to install.`;
  showAction('Restart & Update', () => {
    window.electron.ipc.invoke('update:install');
  });
});

// Error
window.electron.ipc.on('update:error', (data) => {
  message.textContent = `Update error: ${data.message}`;
  showBanner();
  hideAction();
  progressContainer.classList.add('hidden');
});
