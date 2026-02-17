const banner = document.getElementById('update-banner');
const message = document.getElementById('update-message');
const actionBtn = document.getElementById('update-action');

// macOS/Linux: update disponible → banner con botón "Download from GitHub"
window.electron.ipc.on('update:available', (data) => {
  message.textContent = `Version ${data.version} is available.`;
  actionBtn.textContent = 'Download from GitHub';
  actionBtn.classList.remove('hidden');
  actionBtn.onclick = () => {
    window.electron.ipc.invoke('update:open-release');
  };
  banner.classList.remove('hidden');
});

// Windows: descarga completa → banner con botón "Restart & Update"
window.electron.ipc.on('update:downloaded', (data) => {
  message.textContent = `Version ${data.version} is ready to install.`;
  actionBtn.textContent = 'Restart & Update';
  actionBtn.classList.remove('hidden');
  actionBtn.onclick = () => {
    window.electron.ipc.invoke('update:install');
  };
  banner.classList.remove('hidden');
});
