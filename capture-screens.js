// ─── Versa AI Gateway — Screen Capture Script ─────────────────────────────
// Paste this entire script into the browser DevTools Console while the
// prototype is open. It will cycle through every screen, capture a PNG,
// and trigger automatic downloads.
// Dependencies: html2canvas (loaded dynamically by this script).

(async function captureAllScreens() {
  // ── 1. Load html2canvas ──────────────────────────────────────────────────
  await new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(s);
  });
  console.log('✓ html2canvas loaded');

  // ── 2. Screens to capture ────────────────────────────────────────────────
  const screens = [
    { id: 'configure-home',    label: '01-configure-home' },
    { id: 'ai-security',       label: '02-ai-security-list' },
    { id: 'configure-gateway', label: '03-configure-ai-security' },
    { id: 'view-gateway',      label: '04-view-ai-security' },
    { id: 'mcp-list',          label: '05-mcp-list' },
    { id: 'configure-mcp',     label: '06-configure-mcp' },
    { id: 'view-mcp',          label: '07-view-mcp' },
    { id: 'agentic-list',      label: '08-agentic-list' },
    { id: 'configure-agentic', label: '09-configure-agentic' },
    { id: 'view-agentic',      label: '10-view-agentic' },
    { id: 'stub-deploy',       label: '11-deploy' },
    { id: 'stub-analytics',    label: '12-analytics' },
    { id: 'stub-inventory',    label: '13-inventory' },
    { id: 'stub-users',        label: '14-users' },
    { id: 'stub-settings',     label: '15-settings' },
    { id: 'stub-tenants',      label: '16-tenants' },
  ];

  // ── 3. Helper: download a canvas as PNG ──────────────────────────────────
  function download(canvas, filename) {
    const a = document.createElement('a');
    a.download = filename + '.png';
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── 4. Helper: wait for ms ───────────────────────────────────────────────
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // ── 5. Capture loop ──────────────────────────────────────────────────────
  const target = document.querySelector('.app-body') || document.body;
  let done = 0;

  for (const screen of screens) {
    console.log(`📸 Capturing ${screen.label}…`);

    // Navigate to screen
    if (typeof navigate === 'function') {
      navigate(screen.id);
    } else if (typeof window.navigate === 'function') {
      window.navigate(screen.id);
    } else {
      console.warn('navigate() not found — make sure the prototype is open');
      break;
    }

    // Wait for render
    await wait(600);

    // Capture
    try {
      const canvas = await html2canvas(document.body, {
        scale: 2,              // 2× for retina-quality PNGs
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f4f5f7',
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
        windowWidth: 1440,
        windowHeight: 900,
        logging: false,
      });
      download(canvas, `versa-ai-gateway_${screen.label}`);
      done++;
      console.log(`  ✓ ${screen.label}.png (${canvas.width}×${canvas.height}px)`);
      // Brief pause so downloads don't queue-block
      await wait(400);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  console.log(`\n✅ Done — ${done}/${screens.length} screens captured.`);
  console.log('Check your Downloads folder for the PNG files.');
})();
