window.$ = window.$ || ((id) => document.getElementById(id));
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function bind(id, evt, handler) {
  const el = $(id);
  if (!el) return;
  if (el.dataset.bound === '1') return;
  el.addEventListener(evt, (e) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    try { handler(e); } catch (err) { console.error(`Handler for #${id} threw:`, err); }
  });
  el.dataset.bound = '1';
}

function ensure(fnName, fallback = () => {}) {
  if (typeof window[fnName] !== 'function') window[fnName] = fallback;
}

document.addEventListener('DOMContentLoaded', () => {
  ensure('generateGraph');
  ensure('runGraph');
  ensure('runHuffman');
  ensure('renderHuffman');
  ensure('countFreqFromText', () => new Map());

  bind('genGraphBtn', 'click', () => { try { window.generateGraph(); } catch(e){ console.error(e); } });
  bind('runGraphBtn', 'click', () => { try { window.runGraph();   } catch(e){ console.error(e); } });

  initializeGreedyAlgorithms();

  setupMathOperations();

  bind('runHufBtn', 'click', async () => {
    const input = $('hufInput');
    const raw = input ? input.value : '';
    const freqMap = window.countFreqFromText(raw);

    try {
      const response = await fetch('/api/greedy/huffman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairs: raw }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resp = await response.json();

      if (resp.error) {
        throw new Error(resp.error);
      }

      const vis = $('g-huf-vis'); 
      if (vis) vis.style.display = 'block';

      if (typeof window.renderHuffman === 'function') {
        window.renderHuffman(resp, freqMap);
      } else if (typeof window.drawHuffmanTree === 'function') {
        window.drawHuffmanTree(resp.struct);
      }
    } catch (err) {
      console.error('Huffman request failed:', err);
      if (!err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        alert(`Huffman error: ${err.message}`);
      }
    }
  });

  $$('button').forEach(btn => { if (!btn.type) btn.type = 'button'; });

  window.addEventListener('error', (e) => {
    console.error('JS Error:', e.message, 'at', e.filename, e.lineno + ':' + e.colno);
  });
});

const $ = (id)=>document.getElementById(id);

const API_BASE = '';
async function apiPost(path, body) {
  try {
    const res = await fetch((API_BASE + path), {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body || {})
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    return await res.json();
  } catch (err) {
    console.error('API error:', err);

    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      const msg = `Cannot reach the Python backend.\nIf you're opening index.html directly (file://), please run: python server.py\nThen open http://localhost:8000 in your browser.`;
      alert(msg);
    }
    throw err;
  }
}

if (location.protocol === 'file:') {
  console.warn('Running from file:// — backend calls will fail.');
  setTimeout(()=>{
    alert('You opened index.html directly.\nTo enable Start buttons, run the backend:\n\n1) Open a terminal in this folder\n2) Run: python server.py\n3) Visit: http://localhost:8000');
  }, 100);
}

const sections = {
  sort: { settings: 'sortSettings', vis: 'sortVis' },
  search: { settings: 'searchSettings', vis: 'searchVis' },
  string: { settings: 'stringSettings', vis: 'stringVis' },
  greedy: { settings: 'greedySettings', vis: 'greedyVis' },
  converter: { settings: 'converterSettings', vis: 'converterVis' },
  graph: { settings: 'graphSettings', vis: 'graphVis' },
  prime: { settings: 'primeSettings', vis: 'primeVis' },
  crypto: { settings: 'cryptoSettings', vis: 'cryptoVis' },
  more: { settings: 'moreSettings', vis: 'moreVis' }
};

const categorySel = $('category');
categorySel.addEventListener('change', (e) => {
  const val = e.target.value;
  for (const k in sections) {
    const setId = sections[k].settings;
    const visId = sections[k].vis;
    $(setId).classList.remove('visible');
    $(setId).classList.add('section');
    const v = $(visId);
    if (v) v.style.display = 'none';
  }
  if (!val) return;
  $(sections[val].settings).classList.add('visible');
  const vis = $(sections[val].vis);
    if (vis) vis.style.display = 'flex';
});

$('sortSettings').classList.add('visible');
$('sortVis').style.display = 'flex';

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
let delay = 250;
const speedPill = $('speedPill');
if (speedPill) speedPill.textContent = 'Speed: 250ms';
const delayInput = $('delayInput');
if (delayInput) {
  delayInput.addEventListener('input', (e)=>{
    delay = Number(e.target.value) || 250;
    if (speedPill) speedPill.textContent = `Speed: ${delay}ms`;
  });
}

function initializeGreedyAlgorithms() {

  const activityStartBtn = $('activityStartBtn');
  if (activityStartBtn) {
    activityStartBtn.addEventListener('click', async () => {
      const input = $('activityInput').value;
      const resultBox = $('g-activity-result');
      const stepsBox = $('g-activity-steps');

      try {
        const greedyVis = $('greedyVis');
        const activityVis = $('g-activity-vis');
        if (greedyVis) greedyVis.style.display = 'flex';
        if (activityVis) activityVis.style.display = 'block';

        const response = await fetch('/api/greedy/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activities: input })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) throw new Error(result.error);

        resultBox.textContent = `Selected Activities: ${result.selected.join(', ')} | Count: ${result.count}`;
        stepsBox.textContent = result.steps ? result.steps.join('\n') : 'No detailed steps available';
      } catch (err) {
        console.error('Activity selection failed:', err);
        resultBox.textContent = `Error: ${err.message}`;
        stepsBox.textContent = '';
      }
    });
  }

  const knapStartBtn = $('knapStartBtn');
  if (knapStartBtn) {
    knapStartBtn.addEventListener('click', async () => {
      const items = $('knapItems').value;
      const capacity = $('knapCapacity').value;
      const resultBox = $('g-knap-result');
      const stepsBox = $('g-knap-steps');

      try {
        const response = await fetch('/api/greedy/knapsack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, capacity: parseInt(capacity) })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) throw new Error(result.error);

        resultBox.textContent = `Max Value: ${result.maxValue} | Selected Items: ${result.selectedItems.join(', ')}`;
        stepsBox.textContent = result.steps ? result.steps.join('\n') : 'No detailed steps available';
      } catch (err) {
        console.error('Knapsack failed:', err);
        resultBox.textContent = `Error: ${err.message}`;
        stepsBox.textContent = '';
      }
    });
  }

  const egyptStartBtn = $('egyptStartBtn');
  if (egyptStartBtn) {
    egyptStartBtn.addEventListener('click', async () => {
      const numerator = $('egyptNum').value;
      const denominator = $('egyptDen').value;
      const resultBox = $('g-egypt-result');
      const stepsBox = $('g-egypt-steps');

      try {
        const response = await fetch('/api/greedy/egyptian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            numerator: parseInt(numerator), 
            denominator: parseInt(denominator) 
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) throw new Error(result.error);

        resultBox.textContent = `Egyptian Fractions: ${result.fractions.join(' + ')}`;
        stepsBox.textContent = result.steps ? result.steps.join('\n') : 'No detailed steps available';
      } catch (err) {
        console.error('Egyptian fractions failed:', err);
        resultBox.textContent = `Error: ${err.message}`;
        stepsBox.textContent = '';
      }
    });
  }

  const jobStartBtn = $('jobStartBtn');
  if (jobStartBtn) {
    jobStartBtn.addEventListener('click', async () => {
      const jobs = $('jobInput').value;
      const resultBox = $('g-job-result');
      const stepsBox = $('g-job-steps');

      try {
        const response = await fetch('/api/greedy/job-sequencing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobs })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.error) throw new Error(result.error);

        resultBox.textContent = `Max Profit: ${result.maxProfit} | Job Sequence: ${result.sequence.join(' → ')}`;
        stepsBox.textContent = result.steps ? result.steps.join('\n') : 'No detailed steps available';
      } catch (err) {
        console.error('Job sequencing failed:', err);
        resultBox.textContent = `Error: ${err.message}`;
        stepsBox.textContent = '';
      }
    });
  }
}

function setupMathOperations() {
  const convModeSel = $('convMode');
  const mathOperationsDiv = $('mathOperations');
  const moduloOperationsDiv = $('moduloOperations');
  const regularConversionDiv = $('regularConversion');
  const mathStepsBox = $('mathStepsBox');
  const mathOperationSel = $('mathOperation');
  const mathOpSymbol = $('mathOpSymbol');

  if (convModeSel) {
    convModeSel.addEventListener('change', () => {
      const mode = convModeSel.value;
      if (mode === 'math') {
        if (regularConversionDiv) regularConversionDiv.style.display = 'none';
        if (moduloOperationsDiv) moduloOperationsDiv.style.display = 'none';
        if (mathOperationsDiv) mathOperationsDiv.style.display = 'block';
        if (mathStepsBox) mathStepsBox.style.display = 'block';
      } else if (mode === 'modulo') {
        if (regularConversionDiv) regularConversionDiv.style.display = 'none';
        if (mathOperationsDiv) mathOperationsDiv.style.display = 'none';
        if (moduloOperationsDiv) moduloOperationsDiv.style.display = 'block';
        if (mathStepsBox) mathStepsBox.style.display = 'block';
      } else {
        if (regularConversionDiv) regularConversionDiv.style.display = 'block';
        if (mathOperationsDiv) mathOperationsDiv.style.display = 'none';
        if (moduloOperationsDiv) moduloOperationsDiv.style.display = 'none';
        if (mathStepsBox) mathStepsBox.style.display = 'none';
      }
    });
  }

  if (mathOperationSel && mathOpSymbol) {
    mathOperationSel.addEventListener('change', () => {
      const op = mathOperationSel.value;
      const symbols = {
        'add': '+',
        'subtract': '-', 
        'multiply': '×',
        'divide': '÷'
      };
      mathOpSymbol.textContent = symbols[op] || '+';
    });
    mathOpSymbol.textContent = '+';
  }
}

async function runMathOperation() {
  const operation = $('mathOperation').value;
  const base = Number($('mathBase').value);
  const num1 = $('mathNum1').value.trim();
  const num2 = $('mathNum2').value.trim();
  const outputBox = $('converterOutput');
  const stepsBox = $('mathStepsBox');

  if (!num1 || !num2) {
    if (outputBox) outputBox.textContent = 'Please enter both numbers';
    return;
  }

  try {
    const res = await apiPost('/api/math', {
      operation,
      num1,
      num2,
      base
    });

    displayMathResult(res, operation, outputBox, stepsBox);

  } catch (err) {
    if (outputBox) outputBox.textContent = 'Error performing operation';
    if (stepsBox) stepsBox.innerHTML = '';
    console.error(err);
  }
}

async function runMathOperation() {
  const operation = $('mathOperation').value;
  const base = Number($('mathBase').value);
  const num1 = $('mathNum1').value.trim();
  const num2 = $('mathNum2').value.trim();
  const outputBox = $('converterOutput');
  const stepsBox = $('mathStepsBox');

  if (!num1 || !num2) {
    if (outputBox) outputBox.textContent = 'Please enter both numbers';
    return;
  }

  if (!isValidFloatingPointNumber(num1, base) || !isValidFloatingPointNumber(num2, base)) {
    if (outputBox) outputBox.textContent = `Invalid floating-point number for base ${base}`;
    return;
  }

  try {
    const res = await apiPost('/api/math', {
      operation,
      num1,
      num2,
      base
    });

    displayMathResult(res, operation, outputBox, stepsBox);

  } catch (err) {
    if (outputBox) outputBox.textContent = 'Error performing operation';
    if (stepsBox) stepsBox.innerHTML = '';
    console.error(err);
  }
}

function isValidFloatingPointNumber(num, base) {
  const validChars = {
    2: /^[01]*\.?[01]*$/,
    8: /^[0-7]*\.?[0-7]*$/,
    10: /^[0-9]*\.?[0-9]*$/,
    16: /^[0-9A-Fa-f]*\.?[0-9A-Fa-f]*$/
  };

  if (!validChars[base].test(num)) {
    return false;
  }

  return (num.match(/\./g) || []).length <= 1;
}

function displayMathResult(res, operation, outputBox, stepsBox) {
  if (res.error) {
    if (outputBox) outputBox.textContent = `Error: ${res.error}`;
    if (stepsBox) stepsBox.innerHTML = '';
    return;
  }

  let resultText = `Result: ${res.decimal} (decimal)\n`;
  resultText += `Binary: ${res.binary}\n`;
  resultText += `Octal: ${res.octal}\n`;
  resultText += `Hexadecimal: ${res.hexadecimal}`;

  if (outputBox) outputBox.textContent = resultText;

  if (stepsBox && res.steps) {
    let stepsHTML = '<strong>Calculation Steps:</strong><br>';

    if (operation === 'add') {
      stepsHTML += formatAdditionSteps(res.steps);
    } else if (operation === 'subtract') {
      stepsHTML += formatSubtractionSteps(res.steps);
    } else if (operation === 'multiply') {
      stepsHTML += formatMultiplicationSteps(res.steps);
    } else if (operation === 'divide') {
      stepsHTML += formatDivisionSteps(res.steps);
    } else if (operation === 'modulo') {
      stepsHTML += formatModuloSteps(res.steps);
    } else {
      stepsHTML += res.steps.map(step => `• ${step}`).join('<br>');
    }

    stepsBox.innerHTML = stepsHTML;
  }
}

function formatAdditionSteps(steps) {
  return steps.map(step => {
    if (step.includes('Carry:')) {
      return `<span style="color: #f59e0b">${step}</span>`;
    } else if (step.includes('Result digit:')) {
      return `<span style="color: #10b981">${step}</span>`;
    } else if (step.includes('Final result')) {
      return `<span style="color: #ffffffff; font-weight: bold">${step}</span>`;
    } else if (step.includes('Converted')) {
      return `<span style="color: #6b7280">📥 ${step}</span>`;
    }
    return `• ${step}`;
  }).join('<br>');
}

function formatSubtractionSteps(steps) {
  return steps.map(step => {
    if (step.includes('Borrow:')) {
      return `<span style="color: #f59e0b">${step}</span>`;
    } else if (step.includes('Result digit:')) {
      return `<span style="color: #10b981">${step}</span>`;
    } else if (step.includes('Borrow 1 from next column')) {
      return `<span style="color: #ef4444">${step}</span>`;
    } else if (step.includes('Final result')) {
      return `<span style="color: #ffffffff; font-weight: bold">${step}</span>`;
    }
    return `• ${step}`;
  }).join('<br>');
}

function formatMultiplicationSteps(steps) {
  return steps.map(step => {
    if (step.includes('Partial product:')) {
      return `<span style="color: #8b5cf6">📦 ${step}</span>`;
    } else if (step.includes('Summing partial products')) {
      return `<span style="color: #f59e0b">∑ ${step}</span>`;
    } else if (step.includes('Final result')) {
      return `<span style="color: #10b981; font-weight: bold">${step}</span>`;
    } else if (step.includes('Multiply by')) {
      return `<span style="color: #ffffffff">${step}</span>`;
    }
    return `• ${step}`;
  }).join('<br>');
}

function formatDivisionSteps(steps) {
  return steps.map(step => {
    if (step.includes('Quotient:')) {
      return `<span style="color: #10b981">${step}</span>`;
    } else if (step.includes('Remainder:')) {
      return `<span style="color: #f59e0b">${step}</span>`;
    } else if (step.includes('Bring down')) {
      return `<span style="color: #ffffffff">${step}</span>`;
    } else if (step.includes('Final quotient')) {
      return `<span style="color: #10b981; font-weight: bold">${step}</span>`;
    } else if (step.includes('Final remainder')) {
      return `<span style="color: #f59e0b; font-weight: bold">${step}</span>`;
    }
    return `• ${step}`;
  }).join('<br>');
}

function formatModuloSteps(steps) {
  return steps.map(step => {
    if (step.includes('Step 1:')) {
      return `<span style="color: #f4f8ffff">${step}</span>`;
    } else if (step.includes('Step 2:')) {
      return `<span style="color: #8b5cf6">${step}</span>`;
    } else if (step.includes('Step 3:')) {
      return `<span style="color: #f59e0b">${step}</span>`;
    } else if (step.includes('Step 4:')) {
      return `<span style="color: #ef4444">${step}</span>`;
    } else if (step.includes('Step 5:')) {
      return `<span style="color: #10b981; font-weight: bold">⑤ ${step}</span>`;
    } else if (step.includes('Modulo Operation')) {
      return `<span style="color: #000; font-weight: bold">${step}</span>`;
    }
    return `• ${step}`;
  }).join('<br>');
}

let huffmanZoom = 1.0;
let treeZoom = 1.0;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_SENSITIVITY = 0.001;

let isHuffmanDragging = false;
let huffmanLastX = 0;
let huffmanLastY = 0;
let huffmanTranslateX = 0;
let huffmanTranslateY = 0;

let isTreeDragging = false;
let treeLastX = 0;
let treeLastY = 0;
let treeTranslateX = 0;
let treeTranslateY = 0;

function setupHuffmanZoom() {
  const canvas = document.getElementById('hufCanvas');
  const canvasContainer = document.querySelector('.canvas-container');
  const zoomLevel = document.getElementById('zoomLevel');

  if (!canvas || !canvasContainer) return;

  function updateZoom() {
    updateHuffmanZoomTransform();
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(huffmanZoom * 100)}%`;
    }
  }

canvasContainer.addEventListener('wheel', function(e) {
    e.preventDefault();

    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomChange = -e.deltaY * ZOOM_SENSITIVITY;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, huffmanZoom * (1 + zoomChange)));

    if (newZoom !== huffmanZoom) {
      const scaleChange = newZoom / huffmanZoom;
      huffmanTranslateX = mouseX - (mouseX - huffmanTranslateX) * scaleChange;
      huffmanTranslateY = mouseY - (mouseY - huffmanTranslateY) * scaleChange;

      huffmanZoom = newZoom;
      updateZoom();
    }
  });

  canvasContainer.addEventListener('mousedown', function(e) {
    if (e.button === 0) {
      isHuffmanDragging = true;
      huffmanLastX = e.clientX;
      huffmanLastY = e.clientY;
      canvasContainer.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (isHuffmanDragging) {
      const deltaX = e.clientX - huffmanLastX;
      const deltaY = e.clientY - huffmanLastY;

      huffmanTranslateX += deltaX;
      huffmanTranslateY += deltaY;

      huffmanLastX = e.clientX;
      huffmanLastY = e.clientY;

      updateZoom();
    }
  });

  document.addEventListener('mouseup', function() {
    isHuffmanDragging = false;
    canvasContainer.style.cursor = 'grab';
  });

  canvasContainer.addEventListener('mouseleave', function() {
    isHuffmanDragging = false;
    canvasContainer.style.cursor = 'grab';
  });

  canvasContainer.addEventListener('dblclick', function(e) {
    if (e.target === canvas || canvas.contains(e.target)) {
      huffmanZoom = 1.0;
      huffmanTranslateX = 0;
      huffmanTranslateY = 0;
      updateZoom();
    }
  });

  canvasContainer.style.cursor = 'grab';
  updateZoom();
}

function setupTreeZoom() {
  const treeCanvas = document.getElementById('treeCanvas');
  const treeCanvasWrap = document.getElementById('treeCanvasWrap');

  if (!treeCanvas || !treeCanvasWrap) return;

  if (!document.getElementById('treeZoomControls')) {
    const zoomControls = document.createElement('div');
    zoomControls.id = 'treeZoomControls';
    zoomControls.className = 'zoom-controls';
    zoomControls.style.cssText = 'margin-bottom:10px; display:flex; gap:10px; align-items:center;';
    zoomControls.innerHTML = `
      <span style="color: var(--muted); font-size: 13px;">Zoom Level:</span>
      <span id="treeZoomLevel">100%</span>
      <span style="color: var(--muted); font-size: 12px; margin-left: auto;">
        (Scroll to zoom • Drag to pan • Double-click to reset)
      </span>
    `;
    treeCanvasWrap.parentNode.insertBefore(zoomControls, treeCanvasWrap);
  }

  function updateTreeZoom() {
    treeCanvas.style.transform = `translate(${treeTranslateX}px, ${treeTranslateY}px) scale(${treeZoom})`;
    treeCanvas.style.transformOrigin = '0 0';
    const treeZoomLevel = document.getElementById('treeZoomLevel');
    if (treeZoomLevel) {
      treeZoomLevel.textContent = `${Math.round(treeZoom * 100)}%`;
    }
  }

  treeCanvasWrap.addEventListener('wheel', function(e) {
    e.preventDefault();

    const rect = treeCanvasWrap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomChange = -e.deltaY * ZOOM_SENSITIVITY;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, treeZoom * (1 + zoomChange)));

    if (newZoom !== treeZoom) {
      const scaleChange = newZoom / treeZoom;
      treeTranslateX = mouseX - (mouseX - treeTranslateX) * scaleChange;
      treeTranslateY = mouseY - (mouseY - treeTranslateY) * scaleChange;

      treeZoom = newZoom;
      updateTreeZoom();
    }
  });

  treeCanvasWrap.addEventListener('mousedown', function(e) {
    if (e.button === 0) {
      isTreeDragging = true;
      treeLastX = e.clientX;
      treeLastY = e.clientY;
      treeCanvasWrap.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (isTreeDragging) {
      const deltaX = e.clientX - treeLastX;
      const deltaY = e.clientY - treeLastY;

      treeTranslateX += deltaX;
      treeTranslateY += deltaY;

      treeLastX = e.clientX;
      treeLastY = e.clientY;

      updateTreeZoom();
    }
  });

  document.addEventListener('mouseup', function() {
    isTreeDragging = false;
    treeCanvasWrap.style.cursor = 'grab';
  });

  treeCanvasWrap.addEventListener('mouseleave', function() {
    isTreeDragging = false;
    treeCanvasWrap.style.cursor = 'grab';
  });

  treeCanvasWrap.addEventListener('dblclick', function(e) {
    if (e.target === treeCanvas || treeCanvas.contains(e.target)) {
      treeZoom = 1.0;
      treeTranslateX = 0;
      treeTranslateY = 0;
      updateTreeZoom();
    }
  });

  treeCanvasWrap.style.cursor = 'grab';
  treeCanvasWrap.style.overflow = 'hidden';
  treeCanvasWrap.style.border = '1px solid rgba(255,255,255,0.06)';
  treeCanvasWrap.style.borderRadius = '8px';
  treeCanvasWrap.style.height = '400px';
  treeCanvasWrap.style.width = '100%';
  treeCanvasWrap.style.position = 'relative';

  treeCanvas.width = 1200;
  treeCanvas.height = 600;
  treeCanvas.style.display = 'block';

  updateTreeZoom();
}

const searchResultBox = $('searchResult');
const searchLog = $('searchLog');
function sLog(line){ if (searchLog){ searchLog.textContent += (searchLog.textContent? '\n':'') + line; searchLog.scrollTop = searchLog.scrollHeight; } }
function clearS(){ if (searchLog) searchLog.textContent=''; if (searchResultBox) searchResultBox.innerText='Status: idle'; }

function buildSearchBoxes(arr){
  const searchBoxes = $('searchBoxes');
  if (!searchBoxes) return;
  searchBoxes.innerHTML='';
  for (let i=0;i<arr.length;i++){
    const box=document.createElement('div'); 
    box.className='sbox';
    box.innerText=String(arr[i]); 
    box.dataset.val=Number(arr[i]);
    box.dataset.index = i;
    searchBoxes.appendChild(box);
  }
}

function highlightSearchBox(i, cls='compare'){ 
  const boxes = $('searchBoxes').children;
  const box = boxes[i]; 
  if(box){ 
    box.classList.add(cls); 
    setTimeout(()=>box.classList.remove(cls), delay); 
  } 
}

async function linearSearch(arr, target){
  sLog(`Input Array: [${arr.join(', ')}]`);
  sLog(`Target Value: ${target}`);
  sLog(`Array Length: ${arr.length}`);
  sLog(``);
  buildSearchBoxes(arr);

  for (let i=0;i<arr.length;i++){ 
    sLog(`STEP ${i+1}: Checking element at index ${i}`);
    sLog(`   - Current index position: ${i}`);
    sLog(`   - Array value at index ${i}: ${arr[i]}`);
    sLog(`   - Comparing ${arr[i]} with target ${target}`);
    sLog(`   - Are they equal? ${arr[i] === target ? 'YES - Target found!' : 'NO - Continue searching'}`);
    highlightSearchBox(i); 
    await sleep(delay); 

    if (arr[i]===target){ 
      sLog(``);
      sLog(`=== SEARCH COMPLETED SUCCESSFULLY ===`);
      sLog(`FINAL RESULT: Target value ${target} found at index position ${i}`);
      sLog(`Total comparisons made: ${i + 1}`);
      sLog(`Search efficiency: ${((i + 1)/arr.length * 100).toFixed(1)}% of array searched`);
      searchResultBox.innerText=`Found at index ${i}`; 
      $('searchBoxes').children[i].classList.add('match');
      return i; 
    } 
  }

  sLog(``);
  sLog(`=== SEARCH COMPLETED - TARGET NOT FOUND ===`);
  sLog(`FINAL RESULT: Target value ${target} was not found in the array`);
  sLog(`Total comparisons made: ${arr.length}`);
  sLog(`The entire array has been searched without finding the target`);
  sLog('Not found'); 
  searchResultBox.innerText='Not found'; 
  return -1;
}

async function binarySearch(arr, target){
  const a=arr.slice().sort((x,y)=>x-y); 
  sLog(`Original Array: [${arr.join(', ')}]`);
  sLog(`Sorted Array (required for binary search): [${a.join(', ')}]`);
  sLog(`Target Value: ${target}`);
  sLog(`Array Length: ${a.length}`);
  sLog(``);
  buildSearchBoxes(a);
  let l=0,r=a.length-1;
  let comparisons = 0;

  sLog(`Initial search range: left index = ${l}, right index = ${r}, search space size = ${r - l + 1} elements`);

  while(l<=r){ 
    comparisons++;
    const m=Math.floor((l+r)/2);
    sLog(``);
    sLog(`STEP ${comparisons}:`);
    sLog(`   - Current search range: [${l}, ${r}]`);
    sLog(`   - Calculating middle index: m = floor((${l} + ${r}) / 2) = ${m}`);
    sLog(`   - Array value at middle index ${m}: ${a[m]}`);
    sLog(`   - Comparing target ${target} with middle element ${a[m]}`);
    highlightSearchBox(m); 
    await sleep(delay); 

    if(a[m]===target){ 
      sLog(`   - MATCH FOUND: Middle element equals target!`);
      sLog(``);
      sLog(`=== SEARCH COMPLETED SUCCESSFULLY ===`);
      sLog(`FINAL RESULT: Target value ${target} found at sorted index position ${m}`);
      sLog(`Total comparisons made: ${comparisons}`);
      sLog(`Maximum possible comparisons for array size ${a.length}: ${Math.ceil(Math.log2(a.length))}`);
      searchResultBox.innerText=`Found at index ${m}`; 
      $('searchBoxes').children[m].classList.add('match');
      return m; 
    } 

    if(a[m]<target) {
      sLog(`   - Target ${target} is GREATER than middle element ${a[m]}`);
      sLog(`   - Discarding left half of search space [${l}, ${m}]`);
      l=m+1;
      sLog(`   - New search range: [${l}, ${r}]`);
    } else {
      sLog(`   - Target ${target} is LESS than middle element ${a[m]}`);
      sLog(`   - Discarding right half of search space [${m}, ${r}]`);
      r=m-1;
      sLog(`   - New search range: [${l}, ${r}]`);
    }
  }

  sLog(``);
  sLog(`=== SEARCH COMPLETED - TARGET NOT FOUND ===`);
  sLog(`FINAL RESULT: Target value ${target} was not found in the sorted array`);
  sLog(`Total comparisons made: ${comparisons}`);
  sLog(`The search space has been exhausted without finding the target`);
  sLog('Not found'); 
  searchResultBox.innerText='Not found'; 
  return -1;
}

async function jumpSearch(arr, target){
  const a=arr.slice().sort((x,y)=>x-y); 
  const step=Math.max(1,Math.floor(Math.sqrt(a.length))); 
  sLog(`Original Array: [${arr.join(', ')}]`);
  sLog(`Sorted Array: [${a.join(', ')}]`);
  sLog(`Target Value: ${target}`);
  sLog(`Array Length: ${a.length}`);
  sLog(``);
  buildSearchBoxes(a);
  let prev=0;
  let jumps = 0;

  sLog(`PHASE 1: Jumping through the array with step size ${step}`);

  while(prev<a.length && a[Math.min(prev+step-1,a.length-1)]<target){ 
    jumps++;
    const j=Math.min(prev+step-1,a.length-1);
    sLog(`Jump ${jumps}: Jump to index ${j}`);
    sLog(`   - Previous block end: ${prev}`);
    sLog(`   - Next jump position: min(${prev}+${step}-1, ${a.length-1}) = ${j}`);
    sLog(`   - Value at jump position ${j}: ${a[j]}`);
    sLog(`   - Is ${a[j]} < ${target}? ${a[j] < target ? 'YES - Continue jumping' : 'NO - Target block found'}`);
    highlightSearchBox(j); 
    await sleep(delay); 
    prev+=step; 
  }

  sLog(``);
  sLog(`PHASE 2: Linear search in the identified block`);
  sLog(`Identified block range: from index ${Math.max(0,prev-step)} to ${Math.min(a.length-1, prev)}`);
  sLog(`Block size: ${Math.min(a.length-1, prev) - Math.max(0,prev-step) + 1} elements`);

  let linearComparisons = 0;
  for (let i=Math.max(0,prev-step); i<=Math.min(a.length-1, prev); i++){ 
    linearComparisons++;
    sLog(`Linear search step ${linearComparisons}: Check index ${i}`);
    sLog(`   - Array value at index ${i}: ${a[i]}`);
    sLog(`   - Comparing ${a[i]} with target ${target}`);
    highlightSearchBox(i); 
    await sleep(delay); 

    if (a[i]===target){ 
      sLog(`   - MATCH FOUND!`);
      sLog(``);
      sLog(`=== SEARCH COMPLETED SUCCESSFULLY ===`);
      sLog(`FINAL RESULT: Target value ${target} found at sorted index position ${i}`);
      sLog(`Total jumps made: ${jumps}`);
      sLog(`Linear comparisons in final block: ${linearComparisons}`);
      sLog(`Total operations: ${jumps + linearComparisons}`);
      searchResultBox.innerText=`Found at index ${i}`; 
      $('searchBoxes').children[i].classList.add('match');
      return i; 
    } 
  }

  sLog(``);
  sLog(`=== SEARCH COMPLETED - TARGET NOT FOUND ===`);
  sLog(`FINAL RESULT: Target value ${target} was not found in the array`);
  sLog(`Total jumps made: ${jumps}`);
  sLog(`Linear comparisons in final block: ${linearComparisons}`);
  sLog(`The target was not found in the identified block`);
  sLog('Not found'); 
  searchResultBox.innerText='Not found'; 
  return -1;
}

async function exponentialSearch(arr, target){
  const a=arr.slice().sort((x,y)=>x-y); 
  sLog(`Original Array: [${arr.join(', ')}]`);
  sLog(`Sorted Array: [${a.join(', ')}]`);
  sLog(`Target Value: ${target}`);
  sLog(`Array Length: ${a.length}`);
  sLog(``);
  buildSearchBoxes(a);

  if (a.length && a[0]===target){ 
    sLog(`QUICK CHECK: First element at index 0 equals target!`);
    sLog(`FINAL RESULT: Target value ${target} found at index 0`);
    sLog(`No exponential growth or binary search needed`);
    searchResultBox.innerText='Found at index 0'; 
    $('searchBoxes').children[0].classList.add('match');
    return 0; 
  }

  sLog(`PHASE 1: Exponential range finding`);
  let i=1;
  let exponentialSteps = 0;

  while(i<a.length && a[i]<=target){ 
    exponentialSteps++;
    sLog(`Exponential step ${exponentialSteps}: Check index ${i}`);
    sLog(`   - Current bound index: ${i}`);
    sLog(`   - Value at index ${i}: ${a[i]}`);
    sLog(`   - Is ${a[i]} <= ${target}? ${a[i] <= target ? 'YES - Double the bound' : 'NO - Range found'}`);
    highlightSearchBox(i); 
    await sleep(delay); 
    i*=2; 
  }

  let l=Math.floor(i/2), r=Math.min(i, a.length-1);
  sLog(``);
  sLog(`PHASE 2: Binary search in identified range`);
  sLog(`Identified search range: [${l}, ${r}]`);
  sLog(`Range size: ${r - l + 1} elements`);
  sLog(`Binary search will now be performed in this range`);

  let binaryComparisons = 0;
  while(l<=r){ 
    binaryComparisons++;
    const m=Math.floor((l+r)/2);
    sLog(`Binary search step ${binaryComparisons}:`);
    sLog(`   - Current range: [${l}, ${r}]`);
    sLog(`   - Middle index: m = floor((${l} + ${r}) / 2) = ${m}`);
    sLog(`   - Value at middle index: ${a[m]}`);
    sLog(`   - Comparing ${a[m]} with target ${target}`);
    highlightSearchBox(m); 
    await sleep(delay); 

    if(a[m]===target){ 
      sLog(`   - MATCH FOUND!`);
      sLog(``);
      sLog(`=== SEARCH COMPLETED SUCCESSFULLY ===`);
      sLog(`FINAL RESULT: Target value ${target} found at sorted index position ${m}`);
      sLog(`Exponential steps: ${exponentialSteps}`);
      sLog(`Binary search comparisons: ${binaryComparisons}`);
      sLog(`Total operations: ${exponentialSteps + binaryComparisons}`);
      searchResultBox.innerText=`Found at index ${m}`; 
      $('searchBoxes').children[m].classList.add('match');
      return m; 
    } 

    if(a[m]<target) {
      sLog(`   - Target is greater, search right half`);
      l=m+1;
    } else {
      sLog(`   - Target is smaller, search left half`);
      r=m-1;
    }
  }

  sLog(``);
  sLog(`=== SEARCH COMPLETED - TARGET NOT FOUND ===`);
  sLog(`FINAL RESULT: Target value ${target} was not found`);
  sLog(`Exponential steps: ${exponentialSteps}`);
  sLog(`Binary search comparisons: ${binaryComparisons}`);
  sLog(`The target was not found in the identified range`);
  sLog('Not found'); 
  searchResultBox.innerText='Not found'; 
  return -1;
}

async function interpolationSearch(arr, target){
  const a=arr.slice().sort((x,y)=>x-y); 
  sLog(`Original Array: [${arr.join(', ')}]`);
  sLog(`Sorted Array: [${a.join(', ')}]`);
  sLog(`Target Value: ${target}`);
  sLog(`Array Length: ${a.length}`);
  sLog(``);
  buildSearchBoxes(a);
  let lo=0, hi=a.length-1;
  let steps = 0;

  sLog(`Initial search range: [${lo}, ${hi}]`);
  sLog(`Range values: a[${lo}] = ${a[lo]}, a[${hi}] = ${a[hi]}`);

  while (lo<=hi && target>=a[lo] && target<=a[hi]){
    steps++;

    if (a[lo]===a[hi]){ 
      sLog(`Step ${steps}: All elements in current range are equal`);
      sLog(`   - a[${lo}] = a[${hi}] = ${a[lo]}`);

      if (a[lo]===target){ 
        sLog(`   - MATCH FOUND: All elements equal target!`);
        sLog(`FINAL RESULT: Target found at index ${lo}`);
        searchResultBox.innerText=`Found at index ${lo}`; 
        $('searchBoxes').children[lo].classList.add('match');
        return lo; 
      } 
      sLog(`   - Target ${target} not equal to range value ${a[lo]}`);
      break; 
    }

    const pos = lo + Math.floor((target-a[lo])*(hi-lo)/(a[hi]-a[lo]));
    sLog(`Step ${steps}: Calculate probe position`);
    sLog(`   - Formula: pos = lo + (target - a[lo]) * (hi - lo) / (a[hi] - a[lo])`);
    sLog(`   - Calculation: ${lo} + (${target} - ${a[lo]}) * (${hi} - ${lo}) / (${a[hi]} - ${a[lo]})`);
    sLog(`   - Computed position: ${pos}`);
    sLog(`   - Value at position ${pos}: ${a[pos]}`);
    highlightSearchBox(pos); 
    await sleep(delay);

    if (a[pos]===target){ 
      sLog(`   - MATCH FOUND!`);
      sLog(`FINAL RESULT: Target value ${target} found at index ${pos}`);
      sLog(`Total interpolation steps: ${steps}`);
      searchResultBox.innerText=`Found at index ${pos}`; 
      $('searchBoxes').children[pos].classList.add('match');
      return pos; 
    }

    if (a[pos] < target) {
      sLog(`   - Target ${target} > position value ${a[pos]}, search right`);
      lo = pos + 1;
    } else {
      sLog(`   - Target ${target} < position value ${a[pos]}, search left`);
      hi = pos - 1;
    }

    sLog(`   - New search range: [${lo}, ${hi}]`);
  }

  sLog(``);
  sLog(`=== SEARCH COMPLETED - TARGET NOT FOUND ===`);
  sLog(`FINAL RESULT: Target value ${target} was not found`);
  sLog(`Total interpolation steps: ${steps}`);
  sLog(`Target is outside current range or range exhausted`);
  sLog('Not found'); 
  searchResultBox.innerText='Not found'; 
  return -1;
}

async function ternarySearch(arr, target){
  const a=arr.slice().sort((x,y)=>x-y); 
  sLog(`Original Array: [${arr.join(', ')}]`);
  sLog(`Sorted Array: [${a.join(', ')}]`);
  sLog(`Target Value: ${target}`);
  sLog(`Array Length: ${a.length}`);
  sLog(``);
  buildSearchBoxes(a);
  let l=0,r=a.length-1;
  let steps = 0;

  sLog(`Initial search range: [${l}, ${r}]`);

  while(l<=r){ 
    steps++;
    const third=Math.floor((r-l)/3); 
    const m1=l+third, m2=r-third; 

    sLog(`Step ${steps}:`);
    sLog(`   - Current range: [${l}, ${r}]`);
    sLog(`   - Range size: ${r - l + 1} elements`);
    sLog(`   - One-third distance: floor((${r} - ${l}) / 3) = ${third}`);
    sLog(`   - First partition point m1 = ${l} + ${third} = ${m1}, value = ${a[m1]}`);
    sLog(`   - Second partition point m2 = ${r} - ${third} = ${m2}, value = ${a[m2]}`);
    sLog(`   - Comparing target ${target} with partition values`);

    highlightSearchBox(m1); 
    highlightSearchBox(m2); 
    await sleep(delay);

    if (a[m1]===target){ 
      sLog(`   - MATCH FOUND at first partition point m1 = ${m1}!`);
      sLog(`FINAL RESULT: Target found at index ${m1}`);
      sLog(`Total ternary steps: ${steps}`);
      searchResultBox.innerText=`Found at index ${m1}`; 
      $('searchBoxes').children[m1].classList.add('match');
      return m1; 
    }

    if (a[m2]===target){ 
      sLog(`   - MATCH FOUND at second partition point m2 = ${m2}!`);
      sLog(`FINAL RESULT: Target found at index ${m2}`);
      sLog(`Total ternary steps: ${steps}`);
      searchResultBox.innerText=`Found at index ${m2}`; 
      $('searchBoxes').children[m2].classList.add('match');
      return m2; 
    }

    if (target<a[m1]) {
      sLog(`   - Target ${target} < first partition value ${a[m1]}`);
      sLog(`   - Eliminating right 2/3 of search space, searching left segment [${l}, ${m1-1}]`);
      r=m1-1;
    } else if (target>a[m2]) {
      sLog(`   - Target ${target} > second partition value ${a[m2]}`);
      sLog(`   - Eliminating left 2/3 of search space, searching right segment [${m2+1}, ${r}]`);
      l=m2+1;
    } else {
      sLog(`   - Target ${target} between partition values ${a[m1]} and ${a[m2]}`);
      sLog(`   - Eliminating outer segments, searching middle segment [${m1+1}, ${m2-1}]`);
      l=m1+1; r=m2-1;
    }
  } 

  sLog(``);
  sLog(`=== SEARCH COMPLETED - TARGET NOT FOUND ===`);
  sLog(`FINAL RESULT: Target value ${target} was not found`);
  sLog(`Total ternary steps: ${steps}`);
  sLog(`Search space has been exhausted`);
  sLog('Not found'); 
  searchResultBox.innerText='Not found'; 
  return -1;
}

async function fibonacciSearch(arr, target){
  const a=arr.slice().sort((x,y)=>x-y); 
  sLog(`Original Array: [${arr.join(', ')}]`);
  sLog(`Sorted Array: [${a.join(', ')}]`);
  sLog(`Target Value: ${target}`);
  sLog(`Array Length: ${a.length}`);
  sLog(``);
  buildSearchBoxes(a);

  sLog(`Step 1: Generate Fibonacci numbers until we find one >= array length`);
  let fibMMm2=0, fibMMm1=1, fibM=fibMMm2+fibMMm1; 
  let fibSteps = 0;

  while(fibM<a.length){ 
    fibSteps++;
    sLog(`Fibonacci generation step ${fibSteps}:`);
    sLog(`   - Current Fibonacci numbers: fibMMm2 = ${fibMMm2}, fibMMm1 = ${fibMMm1}, fibM = ${fibMMm2} + ${fibMMm1} = ${fibM}`);
    sLog(`   - Is fibM (${fibM}) < array length (${a.length})? ${fibM < a.length ? 'YES - Continue' : 'NO - Found suitable Fibonacci'}`);
    fibMMm2=fibMMm1; 
    fibMMm1=fibM; 
    fibM=fibMMm2+fibMMm1; 
  }

  sLog(`Final Fibonacci numbers: fibMMm2 = ${fibMMm2}, fibMMm1 = ${fibMMm1}, fibM = ${fibM}`);
  sLog(``);
  sLog(`Step 2: Fibonacci search iterations`);

  let offset=-1; 
  let searchSteps = 0;

  while(fibM>1){ 
    searchSteps++;
    const i=Math.min(offset+fibMMm2, a.length-1); 
    sLog(`Search step ${searchSteps}:`);
    sLog(`   - Current offset: ${offset}`);
    sLog(`   - Check index: min(${offset} + ${fibMMm2}, ${a.length-1}) = ${i}`);
    sLog(`   - Value at index ${i}: ${a[i]}`);
    sLog(`   - Fibonacci numbers: fibM = ${fibM}, fibMMm1 = ${fibMMm1}, fibMMm2 = ${fibMMm2}`);
    highlightSearchBox(i); 
    await sleep(delay);

    if(a[i] < target){ 
      sLog(`   - Target ${target} > current value ${a[i]}, move right`);
      sLog(`   - Update Fibonacci: fibM = fibMMm1 (${fibMMm1}), fibMMm1 = fibMMm2 (${fibMMm2}), fibMMm2 = fibM - fibMMm1`);
      fibM=fibMMm1; 
      fibMMm1=fibMMm2; 
      fibMMm2=fibM-fibMMm1; 
      offset=i; 
      sLog(`   - New offset: ${offset}`);
    }
    else if (a[i] > target){ 
      sLog(`   - Target ${target} < current value ${a[i]}, move left`);
      sLog(`   - Update Fibonacci: fibM = fibMMm2 (${fibMMm2}), fibMMm1 = fibMMm1 - fibMMm2, fibMMm2 = fibM - fibMMm1`);
      fibM=fibMMm2; 
      fibMMm1=fibMMm1-fibMMm2; 
      fibMMm2=fibM-fibMMm1; 
    }
    else { 
      sLog(`   - MATCH FOUND!`);
      sLog(`FINAL RESULT: Target value ${target} found at index ${i}`);
      sLog(`Fibonacci generation steps: ${fibSteps}`);
      sLog(`Search steps: ${searchSteps}`);
      searchResultBox.innerText=`Found at index ${i}`; 
      $('searchBoxes').children[i].classList.add('match');
      return i; 
    } 
  }

  if (fibMMm1 && offset+1<a.length && a[offset+1]===target){ 
    sLog(`Final check: index ${offset+1} = ${a[offset+1]}`);
    sLog(`MATCH FOUND at final check!`);
    sLog(`FINAL RESULT: Target value ${target} found at index ${offset+1}`);
    searchResultBox.innerText=`Found at index ${offset+1}`; 
    $('searchBoxes').children[offset+1].classList.add('match');
    return offset+1; 
  }

  sLog(``);
  sLog(`=== SEARCH COMPLETED - TARGET NOT FOUND ===`);
  sLog(`FINAL RESULT: Target value ${target} was not found`);
  sLog(`Fibonacci generation steps: ${fibSteps}`);
  sLog(`Search steps: ${searchSteps}`);
  sLog('Not found'); 
  searchResultBox.innerText='Not found'; 
  return -1;
}

$('searchStartBtn')?.addEventListener('click', async ()=>{
  clearS();
  const algo = $('searchAlgo').value;
  const arr = $('searchArray').value.split(',').map(s=>Number(s.trim())).filter(n=>!isNaN(n));
  const target = Number($('searchTarget').value);
  if (!arr.length) { alert('Enter array for searching.'); return; }
  if (algo==='linear') await linearSearch(arr, target);
  else if (algo==='binary') await binarySearch(arr, target);
  else if (algo==='jump') await jumpSearch(arr, target);
  else if (algo==='exponential') await exponentialSearch(arr, target);
  else if (algo==='interpolation') await interpolationSearch(arr, target);
  else if (algo==='ternary') await ternarySearch(arr, target);
  else if (algo==='fibonacci') await fibonacciSearch(arr, target);
});
$('searchResetBtn')?.addEventListener('click', ()=>{ clearS(); });

(function () {
  const wrap = document.getElementById('treeCanvasWrap');
  const sel  = document.getElementById('sortAlgo');
  if (!wrap || !sel) return;
  function applyTreeCanvasVisibility() {
    wrap.style.display = /^(heap|tree|tournament)$/.test(sel.value) ? 'block' : 'none';
  }
  if (!window.__treeCanvasInit) {
    sel.addEventListener('change', applyTreeCanvasVisibility);
    window.__treeCanvasInit = true;
  }
  applyTreeCanvasVisibility();
})();

const sortLog = $('sortLog');
function clearSortLog(){ if (sortLog) sortLog.textContent=''; }
function addSortStep(msg){ 
  if (!sortLog) return; 
  sortLog.innerHTML += (sortLog.innerHTML?'<br>':'') + msg; 
  sortLog.scrollTop = sortLog.scrollHeight; 
}
let stepCounter=0;
const stepCountLabel = $('stepCount');
function resetSortSteps(){ stepCounter=0; if (stepCountLabel) stepCountLabel.innerText='0'; clearSortLog(); }
function incSortStep(){ stepCounter++; if (stepCountLabel) stepCountLabel.innerText=String(stepCounter); }

function toggleBarsForAlgo(algo){
  const hide = (algo==='heap' || algo==='tree' || algo==='tournament');
  const ba = $('barsArea');
  if (ba) ba.style.display = hide ? 'none' : 'flex';
}
const barsArea = $('barsArea');
const curSortAlgoLabel = $('curSortAlgo');
const sortAlgoSel = $('sortAlgo');
let currentSortAlgo = sortAlgoSel ? sortAlgoSel.value : 'bubble';
if (curSortAlgoLabel) curSortAlgoLabel.innerText = currentSortAlgo;

if (sortAlgoSel) {
  sortAlgoSel.addEventListener('change', (e) => {
    currentSortAlgo = e.target.value;
    curSortAlgoLabel.innerText = currentSortAlgo;
    toggleBarsForAlgo(currentSortAlgo);
    if (currentSortAlgo==='heap' || currentSortAlgo==='tree' || currentSortAlgo==='tournament'){ 
      clearTreeCanvas(); 
      setTimeout(setupTreeZoom, 100);
    }
    else { updateTreeCanvasFromBars(); }
  });
}

function buildBars(arr) {
  if (!barsArea) return;
  barsArea.innerHTML = '';
  const maxVal = Math.max(...arr.map(x => Number(x) || 0), 1);
  for (let i=0;i<arr.length;i++){
    const d = document.createElement('div');
    d.className = 'bar';
    d.dataset.val = Number(arr[i]);
    d.dataset.index = i;
    d.style.height = Math.max(8, (Number(arr[i])/maxVal)*100) + '%';
    d.innerText = String(arr[i]);
    barsArea.appendChild(d);
  }
  if (stepCountLabel) stepCountLabel.innerText = '0';
  updateTreeCanvasFromBars();
}
function readBars(){ return Array.from(barsArea?.children || []).map(b => Number(b.dataset.val)); }

const sortRandBtn = $('sortRandBtn');
if (sortRandBtn) sortRandBtn.addEventListener('click', ()=>{
  const text = $('sortArray');
  const len = Math.max(5, (text?.value || '').split(',').filter(Boolean).length || 0);
  const arr = Array.from({length:len}, ()=>Math.floor(Math.random()*90)+1);
  if (text) text.value = arr.join(',');
  if (currentSortAlgo==='heap' || currentSortAlgo==='tree' || currentSortAlgo==='tournament'){ clearTreeCanvas(); toggleBarsForAlgo(currentSortAlgo); }
  else { buildBars(arr); }
  clearSortLog();
});

const sortStartBtn = $('sortStartBtn');
if (sortStartBtn) sortStartBtn.addEventListener('click', async ()=>{
  const algo = $('sortAlgo').value;
  const arr = $('sortArray').value.split(',').map(s=>Number(s.trim())).filter(n=>!isNaN(n));
  if (!arr.length) { alert('Enter numbers for sorting'); return; }
  curSortAlgoLabel.innerText = algo;
  resetSortSteps();
  toggleBarsForAlgo(algo);
  if (algo === 'tournament'){ await runTournamentSort(arr); return; }
  if (algo === 'heap'){ await runHeapSortVisual(arr); return; }
  if (algo === 'tree'){ await runTreeSortVisual(arr); return; }
  buildBars(arr);
  const res = await apiPost('/api/sort', { algo, array: arr });
  await playOps(res.ops, algo);
});

async function playOps(ops, algo){
  function barsList(){ return Array.from(barsArea.children); }

  let currentGap = null;
  let gapSequence = [];

  if (algo === 'shell') {
    let gap = Math.floor(barsList().length / 2);
    const n = barsList().length;
    addSortStep(`Classic Shell Sort sequence: gap = floor(n/2), then gap = floor(gap/2) until gap = 1`);
    addSortStep(`Initial: n = ${n}, gap = floor(${n}/2) = ${gap}`);

    while (gap > 0) {
      gapSequence.push(gap);
      gap = Math.floor(gap / 2);
    }

    addSortStep(`Final gap sequence: [${gapSequence.join(', ')}]`);
    addSortStep(``);
  }

  if (algo === 'comb') {
    let gap = barsList().length;
    const shrink = 1.3;
    addSortStep(`Comb Sort sequence: gap = n, then gap = floor(gap/1.3) until gap = 1`);
    addSortStep(`Initial: n = ${gap}, shrink factor = 1.3`);

    while (gap > 1) {
      gap = Math.floor(gap / shrink);
      if (gap >= 1) {
        gapSequence.push(gap);
      }
    }
    gapSequence.push(1);

    addSortStep(`Final gap sequence: [${gapSequence.join(', ')}]`);
    addSortStep(``);
  }

  let gapIndex = 0;
  let currentSubarray = 0;
  let combPass = 1;
  let currentMinIndex = null;

  let currentArray = readBars();

  let mergeStepsShown = {
    initialDivision: false,
    subarraySorting: false,
    firstMerge: false,
    finalMerge: false
  };

  if (algo === 'merge') {
    addSortStep(`Unsorted Array: [${currentArray.join(', ')}]`);
    addSortStep(`Divide the array into two parts`);

    const mid = Math.ceil(currentArray.length / 2);
    const left = currentArray.slice(0, mid);
    const right = currentArray.slice(mid);
    addSortStep(`[${left.join(', ')}] [${right.join(', ')}]`);

    addSortStep(`Divide the array into two parts again`);

    const left1 = left.slice(0, Math.ceil(left.length / 2));
    const left2 = left.slice(Math.ceil(left.length / 2));
    const right1 = right.slice(0, Math.ceil(right.length / 2));
    const right2 = right.slice(Math.ceil(right.length / 2));

    const divisions = [];
    if (left1.length > 0) divisions.push(`[${left1.join(', ')}]`);
    if (left2.length > 0) divisions.push(`[${left2.join(', ')}]`);
    if (right1.length > 0) divisions.push(`[${right1.join(', ')}]`);
    if (right2.length > 0) divisions.push(`[${right2.join(', ')}]`);
    addSortStep(divisions.join(' '));

    addSortStep(`Break each element to single parts`);
    addSortStep(`[${currentArray.map(x => `[${x}]`).join(' ')}]`);

    addSortStep(`sort the elements from the smallest to largest`);

    const sortedLeft1 = [...left1].sort((a, b) => a - b);
    const sortedLeft2 = [...left2].sort((a, b) => a - b);
    const sortedRight1 = [...right1].sort((a, b) => a - b);
    const sortedRight2 = [...right2].sort((a, b) => a - b);

    const sortedSubarrays = [];
    if (sortedLeft1.length > 0) sortedSubarrays.push(`[${sortedLeft1.join(', ')}]`);
    if (sortedLeft2.length > 0) sortedSubarrays.push(`[${sortedLeft2.join(', ')}]`);
    if (sortedRight1.length > 0) sortedSubarrays.push(`[${sortedRight1.join(', ')}]`);
    if (sortedRight2.length > 0) sortedSubarrays.push(`[${sortedRight2.join(', ')}]`);

    addSortStep(sortedSubarrays.join(' '));
    mergeStepsShown.subarraySorting = true;
  }

  if (algo === 'counting') {
    addSortStep(`Unsorted Array: [${currentArray.join(', ')}]`);

    const freq = {};
    currentArray.forEach(num => {
      freq[num] = (freq[num] || 0) + 1;
    });

    addSortStep(`Count the frequency of each element [index:frequency]`);
    const freqStr = Object.entries(freq).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(', ');
    addSortStep(freqStr);

    const sortedKeys = Object.keys(freq).map(Number).sort((a, b) => a - b);
    let cumulative = 0;
    const cumulativeArr = [];
    sortedKeys.forEach(key => {
      cumulative += freq[key];
      cumulativeArr.push(cumulative);
    });

    addSortStep(`Calculate the cumulative sum of counts array`);
    addSortStep(`[${cumulativeArr.join(', ')}]`);

    addSortStep(`Build the sorted array by iterating backward`);
  }

  if (algo === 'tim') {
    addSortStep(`Unsorted Array: [${currentArray.join(', ')}]`);

    const runs = [];
    for (let i = 0; i < currentArray.length; i += 4) {
      runs.push(currentArray.slice(i, i + 4));
    }

    addSortStep(`Divide array into runs ${runs.map(run => `[${run.join(', ')}]`).join(' ')}`);

    runs.forEach((run, index) => {
      addSortStep(`Sort Run ${index + 1} using insertion sort`);
      addSortStep(`[${run.join(', ')}]`);

      const sortedRun = [...run].sort((a, b) => a - b);
      for (let i = 1; i < run.length; i++) {
        const current = run[i];
        let j = i - 1;
        while (j >= 0 && run[j] > current) {
          addSortStep(`[${run.join(', ')}] | ${run[j]} > ${current} swap`);
          j--;
        }
      }
      addSortStep(`Sorted Run ${index + 1}: [${sortedRun.join(', ')}]`);
    });

    addSortStep(`Merge Runs`);
    const finalSorted = [...currentArray].sort((a, b) => a - b);
    addSortStep(`[${finalSorted.join(', ')}]`);
  }

  if (algo === 'quick') {
    addSortStep(`Unsorted Array: [${currentArray.join(', ')}]`);
    addSortStep(`Select pivot and partition array`);
  }

  if (algo === 'bucket') {
    addSortStep(`Unsorted Array: [${currentArray.join(', ')}]`);
    addSortStep(`Distribute elements into buckets`);
    addSortStep(`Sort individual buckets`);
    addSortStep(`Concatenate buckets into final sorted array`);
  }

  if (algo === 'radix') {
    addSortStep(`Unsorted Array: [${currentArray.join(', ')}]`);
    const maxDigits = Math.max(...currentArray.map(num => num.toString().length));
    for (let digit = 1; digit <= maxDigits; digit++) {
      addSortStep(`Sort by digit ${digit} (${digit === 1 ? 'ones' : digit === 2 ? 'tens' : 'hundreds'} place)`);
    }
  }

  for (const op of ops){
    incSortStep();
    const bl = barsList();
    bl.forEach(b=>b.classList.remove('compare','swap','gap-highlight','active','min-candidate'));

    currentArray = readBars();

    if (algo === 'selection') {
      if (op.type === 'compare') {
        if (currentMinIndex !== null) {
          bl[currentMinIndex]?.classList.add('min-candidate');
        }
        bl[op.i]?.classList.add('compare');
        bl[op.j]?.classList.add('compare');

        const vi = bl[op.i] ? bl[op.i].dataset.val : '?';
        const vj = bl[op.j] ? bl[op.j].dataset.val : '?';

        if (Number(vi) > Number(vj)) {
          currentMinIndex = op.j;
        }
      }

      if (op.type === 'swap') {
        bl[op.i]?.classList.add('swap');
        bl[op.j]?.classList.add('swap');

        const vi = bl[op.i] ? bl[op.i].dataset.val : '?';
        const vj = bl[op.j] ? bl[op.j].dataset.val : '?';

        addSortStep(`Minimum number found ${vj} at position ${op.j}, swap with ${vi} at position ${op.i}`);

        if (bl[op.i] && bl[op.j]){
          const hi=bl[op.i].style.height, hj=bl[op.j].style.height;
          bl[op.i].dataset.val=vj; bl[op.j].dataset.val=vi;
          bl[op.i].style.height=hj; bl[op.j].style.height=hi;
          bl[op.i].innerText=vj; bl[op.j].innerText=vi;
        }

        currentMinIndex = null;
      }
    }
    else if (algo === 'bubble' || algo === 'insertion') {
      if (op.type === 'compare'){
        bl[op.i]?.classList.add('compare'); 
        bl[op.j]?.classList.add('compare');
        const vi = bl[op.i] ? bl[op.i].dataset.val : '?';
        const vj = bl[op.j] ? bl[op.j].dataset.val : '?';

        const comparisonResult = Number(vi) > Number(vj);
        addSortStep(`[${currentArray.join(', ')}] | ${vi} > ${vj} ${comparisonResult ? 'YES → swap' : 'NO → no swap'}`);
      }

      if (op.type === 'swap'){
        bl[op.i]?.classList.add('swap'); 
        bl[op.j]?.classList.add('swap');
        const bi=bl[op.i], bj=bl[op.j];
        const vi = bi ? bi.dataset.val : '?';
        const vj = bj ? bj.dataset.val : '?';

        if (bi && bj){
          const hi=bi.style.height, hj=bj.style.height;
          bi.dataset.val=vj; bj.dataset.val=vi;
          bi.style.height=hj; bj.style.height=hi;
          bi.innerText=vj; bj.innerText=vi;
        }
      }
    }
    else if (algo === 'merge') {
      if (op.type === 'set') {
        const el = bl[op.i];
        if (el) {
          el.classList.add('swap');
          el.dataset.val = op.value;
          const maxVal = Math.max(...Array.from(barsArea.children).map(x=>Number(x.dataset.val)), op.value);
          el.style.height = Math.max(8, (op.value/maxVal)*100) + '%';
          el.innerText = String(op.value);

          const newArray = readBars();
          const isSorted = newArray.every((val, i, arr) => i === 0 || val >= arr[i-1]);

          if (!mergeStepsShown.firstMerge) {

            const mid = Math.ceil(newArray.length / 2);
            const leftHalf = newArray.slice(0, mid);
            const rightHalf = newArray.slice(mid);

            const leftSorted = leftHalf.slice().sort((a, b) => a - b).join(', ') === leftHalf.join(', ');
            const rightSorted = rightHalf.slice().sort((a, b) => a - b).join(', ') === rightHalf.join(', ');

            if (leftSorted && rightSorted && leftHalf.length > 1 && rightHalf.length > 1) {
              addSortStep(`merge the divided sorted arrays together`);
              addSortStep(`[${leftHalf.join(', ')}] [${rightHalf.join(', ')}]`);
              mergeStepsShown.firstMerge = true;
            }
          }

          if (isSorted && !mergeStepsShown.finalMerge) {
            addSortStep(`The array has been sorted`);
            addSortStep(`[${newArray.join(', ')}]`);
            mergeStepsShown.finalMerge = true;
          }
        }
      }
    }
    else if (algo === 'counting') {
      if (op.type === 'set') {
        const el = bl[op.i];
        if (el) {
          el.classList.add('swap');
          el.dataset.val = op.value;
          const maxVal = Math.max(...Array.from(barsArea.children).map(x=>Number(x.dataset.val)), op.value);
          el.style.height = Math.max(8, (op.value/maxVal)*100) + '%';
          el.innerText = String(op.value);

          const newArray = readBars();
          addSortStep(`[${newArray.join(', ')}]`);
        }
      }
    }
    else if (algo === 'quick') {
      if (op.type === 'compare') {
        bl[op.i]?.classList.add('compare');
        bl[op.j]?.classList.add('compare');

        const vi = bl[op.i] ? bl[op.i].dataset.val : '?';
        const vj = bl[op.j] ? bl[op.j].dataset.val : '?';

        addSortStep(`[${currentArray.join(', ')}] | Compare ${vi} with pivot ${vj}`);
      }

      if (op.type === 'swap') {
        bl[op.i]?.classList.add('swap');
        bl[op.j]?.classList.add('swap');

        const bi=bl[op.i], bj=bl[op.j];
        const vi = bi ? bi.dataset.val : '?';
        const vj = bj ? bj.dataset.val : '?';

        addSortStep(`[${currentArray.join(', ')}] | Swap ${vi} with ${vj}`);

        if (bi && bj){
          const hi=bi.style.height, hj=bj.style.height;
          bi.dataset.val=vj; bj.dataset.val=vi;
          bi.style.height=hj; bj.style.height=hi;
          bi.innerText=vj; bj.innerText=vi;
        }
      }
    }
    else {

        if ((algo === 'shell' || algo === 'comb') && op.gap !== undefined) {
        if (currentGap !== op.gap) {
          currentGap = op.gap;
          currentSubarray = 0;

          if (algo === 'shell') {
            addSortStep(`Starting shell sort with gap ${currentGap}`);
          } else {
            addSortStep(`Starting comb sort with gap ${currentGap}`);
            combPass = 1;
          }
        }

        }
       if (op.type==='compare'){
        bl[op.i]?.classList.add('compare'); 
        bl[op.j]?.classList.add('compare');
        const vi = bl[op.i] ? bl[op.i].dataset.val : '?';
        const vj = bl[op.j] ? bl[op.j].dataset.val : '?';

        if (algo === 'shell' || algo === 'comb') {
          addSortStep(`COMPARE (gap=${currentGap}): ${vi} > ${vj}? ${Number(vi) > Number(vj) ? 'YES → swap' : 'NO → no swap'}`);
        }
      }

      if (op.type==='swap'){
        bl[op.i]?.classList.add('swap'); 
        bl[op.j]?.classList.add('swap');
        const bi=bl[op.i], bj=bl[op.j];
        const vi = bi ? bi.dataset.val : '?';
        const vj = bj ? bj.dataset.val : '?';

        if (algo === 'shell' || algo === 'comb') {
          addSortStep(`SWAP (gap=${currentGap}): ${vi} ↔ ${vj}`);
        }

        if (bi && bj){
          const hi=bi.style.height, hj=bj.style.height;
          bi.dataset.val=vj; bj.dataset.val=vi;
          bi.style.height=hj; bj.style.height=hi;
          bi.innerText=vj; bj.innerText=vi;
        }
      }
    }

    if (op.type==='set'){
      const el = bl[op.i]; 
      if (el){
        el.classList.add('swap');
        el.dataset.val = op.value;
        const maxVal = Math.max(...Array.from(barsArea.children).map(x=>Number(x.dataset.val)), op.value);
        el.style.height = Math.max(8, (op.value/maxVal)*100) + '%';
        el.innerText = String(op.value);
      }
    }

    if (['heap','tree'].includes(algo)) updateTreeCanvasFromBars();
    await sleep(delay);
  }

  Array.from(barsArea.children).forEach(x=>x.classList.remove('compare','swap','gap-highlight','active','min-candidate'));
  if (['heap','tree'].includes(algo)) updateTreeCanvasFromBars();

  addSortStep(``);
  addSortStep(`=== SORTING COMPLETED ===`);
  addSortStep(`Final sorted array: [${readBars().join(', ')}]`);
  addSortStep(`Total operations performed: ${ops.length}`);

  if (algo === 'shell' || algo === 'comb') {
    addSortStep(`Gap sequence used: [${gapSequence.join(', ')}]`);
  }
}

const treeCanvas = $('treeCanvas');
const tctx = treeCanvas ? treeCanvas.getContext('2d') : null;

function clearTreeCanvas(){ if (tctx && treeCanvas) tctx.clearRect(0,0,treeCanvas.width,treeCanvas.height); }

function updateTreeCanvasFromBars(){
  if (!tctx || !treeCanvas) return;
  const arr = readBars();
  clearTreeCanvas();
  if (currentSortAlgo==='heap') drawHeapTree(arr);
  else if (currentSortAlgo==='tree') drawBSTFromArray(arr);
}

function drawHeapTree(arr, highlights){
  clearTreeCanvas();
  if (!tctx || !arr.length) return;
  const w=treeCanvas.width,h=treeCanvas.height;
  tctx.font='11px Inter, Arial'; tctx.textBaseline='middle';
  const levels=Math.floor(Math.log2(arr.length))+1;
  const levelGapY=Math.max(36,(h-20)/(levels+1));
  const pos=[];
  for(let i=0;i<arr.length;i++){
    const level=Math.floor(Math.log2(i+1));
    const indexInLevel=i-(2**level - 1);
    const nodesInLevel=2**level;
    const gapX=w/(nodesInLevel+1);
    const x=gapX*(indexInLevel+1);
    const y=16 + levelGapY*level + 10;
    pos.push({x,y});
  }
  tctx.strokeStyle='rgba(255,255,255,0.06)'; tctx.lineWidth=2;
  for (let i=0;i<arr.length;i++){
    const L=2*i+1, R=2*i+2;
    if (L<arr.length){ tctx.beginPath(); tctx.moveTo(pos[i].x,pos[i].y); tctx.lineTo(pos[L].x,pos[L].y); tctx.stroke(); }
    if (R<arr.length){ tctx.beginPath(); tctx.moveTo(pos[i].x,pos[i].y); tctx.lineTo(pos[R].x,pos[R].y); tctx.stroke(); }
  }
  for (let i=0;i<arr.length;i++){
    const {x,y}=pos[i];
    tctx.beginPath(); tctx.fillStyle=(highlights && highlights.has(i))?'#1b2438':'#0f1724'; tctx.strokeStyle='rgba(255,255,255,0.06)'; tctx.lineWidth=2;
    tctx.arc(x,y,12,0,Math.PI*2); tctx.fill(); tctx.stroke();
    tctx.fillStyle='white'; const s=String(arr[i]); tctx.fillText(s, x-(s.length>1?7:4), y+0);
  }
}

function drawBSTFromArray(arr){
  clearTreeCanvas();
  if (!tctx || !arr.length) return;
  const root = {v:arr[0],L:null,R:null};
  for (let i=1;i<arr.length;i++){
    let n=root, val=arr[i];
    while(true){
      if (val< n.v){ if(n.L) n=n.L; else {n.L={v:val,L:null,R:null}; break;} }
      else { if(n.R) n=n.R; else {n.R={v:val,L:null,R:null}; break;} }
    }
  }
  const inorder=[];
  (function dfs(n,d=0){ if(!n)return; dfs(n.L,d+1); inorder.push({n,d}); dfs(n.R,d+1);} )(root);
  const w=treeCanvas.width,h=treeCanvas.height,margin=24,usable=w-margin*2,gap=usable/(inorder.length+1);
  const depthMax=Math.max(1,...inorder.map(x=>x.d)), levelGapY=Math.max(36,(h-40)/(depthMax+2));
  const pos=new Map();
  inorder.forEach((e,i)=>{ pos.set(e.n,{x:margin+gap*(i+1), y:12+levelGapY*e.d+10}); });
  function drawEdges(n){
    if(!n) return; const p=pos.get(n);
    if(n.L){ const lp=pos.get(n.L); tctx.beginPath(); tctx.strokeStyle='rgba(255,255,255,0.06)'; tctx.moveTo(p.x,p.y); tctx.lineTo(lp.x,lp.y); tctx.stroke(); drawEdges(n.L); }
    if(n.R){ const rp=pos.get(n.R); tctx.beginPath(); tctx.strokeStyle='rgba(255,255,255,0.06)'; tctx.moveTo(p.x,p.y); tctx.lineTo(rp.x,rp.y); tctx.stroke(); drawEdges(n.R); }
  }
  drawEdges(root);
  tctx.font='11px Inter, Arial';
  for (const [node,p] of pos.entries()){
    tctx.beginPath(); tctx.fillStyle='#0f1724'; tctx.strokeStyle='rgba(255,255,255,0.06)'; tctx.lineWidth=2;
    tctx.arc(p.x,p.y,12,0,Math.PI*2); tctx.fill(); tctx.stroke();
    tctx.fillStyle='white'; const s=String(node.v); tctx.fillText(s, p.x-(s.length>1?7:4), p.y+2);
  }
}

const textBox = $('textBox');
const stringResultBox = $('stringResult');
const stringLog = $('stringLog');
function strLog(line){ if (stringLog){ stringLog.textContent += (stringLog.textContent? '\n':'') + line; stringLog.scrollTop = stringLog.scrollHeight; } }
function buildTextBox(text){
  if (!textBox) return;
  textBox.innerHTML='';
  for (let i=0;i<text.length;i++){
    const s=document.createElement('div'); s.className='char'; s.innerText=text[i]; s.dataset.i=i; textBox.appendChild(s);
  }
}
function highlightChars(from, len, cls='active'){ for (let k=0;k<len;k++){ textBox.children[from+k]?.classList.add(cls); } setTimeout(()=>{ for (let k=0;k<len;k++){ textBox.children[from+k]?.classList.remove(cls); } }, delay); }
async function runNaive(text, pattern){
  strLog(`Text: "${text}"`);
  strLog(`Pattern: "${pattern}"`);
  strLog(`Text length: ${text.length}, Pattern length: ${pattern.length}`);
  strLog(`Maximum possible shifts: ${text.length - pattern.length + 1}`);
  strLog(``);

  for (let s=0;s<=text.length-pattern.length;s++){ 
    strLog(`Shift ${s}: Checking if pattern starts at position ${s}`);
    strLog(`   - Text window: "${text.substring(s, s + pattern.length)}"`);
    strLog(`   - Pattern: "${pattern}"`);

    let k=0; 
    while(k<pattern.length && text[s+k]===pattern[k]) {
      strLog(`   - Character match at position ${k}: '${text[s+k]}' == '${pattern[k]}'`);
      k++;
    }

    highlightChars(s, Math.max(1,k)); 
    await sleep(delay);

    if (k===pattern.length){ 
      strLog(`   - COMPLETE MATCH FOUND at shift position ${s}!`);
      strLog(`   - All ${pattern.length} characters matched successfully`);
      for (let kk=0; kk<k; kk++){ textBox.children[s+kk]?.classList.add('match'); } 
    } else {
      strLog(`   - Mismatch at position ${k}: '${text[s+k]}' != '${pattern[k]}'`);
      strLog(`   - Characters matched before mismatch: ${k}`);
    }
  }

  strLog(``);
  strLog(`=== NAIVE SEARCH COMPLETED ===`);
  strLog(`Total shifts checked: ${text.length - pattern.length + 1}`);
}
async function runKMP(text, pat){
  strLog(`Text: "${text}"`);
  strLog(`Pattern: "${pat}"`);
  strLog(``);

  strLog(`PHASE 1: Building LPS (Longest Prefix Suffix) array for pattern "${pat}"`);
  const lps=new Array(pat.length).fill(0); 
  let len=0,i=1;

  while(i<pat.length){ 
    if (pat[i]===pat[len]){
      len++;
      lps[i]=len;
      strLog(`   - lps[${i}] = ${len} (char '${pat[i]}' matches prefix of length ${len})`);
      i++; 
    } else if(len){
      strLog(`   - Mismatch at i=${i}, len=${len}, backtracking to lps[${len-1}]=${lps[len-1]}`);
      len=lps[len-1]; 
    } else { 
      lps[i]=0; 
      strLog(`   - lps[${i}] = 0 (no matching prefix)`);
      i++; 
    } 
  }

  strLog(`Final LPS array: [${lps.join(', ')}]`);
  strLog(``);
  strLog(`PHASE 2: KMP Search`);

  i=0; let j=0;
  let comparisons = 0;

  while(i<text.length){ 
    comparisons++;
    if(text[i]===pat[j]){ 
      strLog(`Comparison ${comparisons}: text[${i}]='${text[i]}' == pat[${j}]='${pat[j]}' → match`);
      i++; j++; 
    } else if (j){ 
      strLog(`Comparison ${comparisons}: text[${i}]='${text[i]}' != pat[${j}]='${pat[j]}' → backtrack j from ${j} to lps[${j-1}]=${lps[j-1]}`);
      j=lps[j-1]; 
    } else { 
      strLog(`Comparison ${comparisons}: text[${i}]='${text[i]}' != pat[${j}]='${pat[j]}' → increment i`);
      i++; 
    }

    if (j===pat.length){ 
      strLog(`*** PATTERN FOUND at position ${i-j} ***`);
      for (let k=0;k<pat.length;k++){ textBox.children[i-j+k]?.classList.add('match'); } 
      j=lps[j-1]; 
    }

    highlightChars(Math.max(0,i-j), Math.max(1,Math.min(pat.length, i - Math.max(0,i-j)))); 
    await sleep(delay);
  }

  strLog(``);
  strLog(`=== KMP SEARCH COMPLETED ===`);
  strLog(`Total comparisons: ${comparisons}`);
  strLog(`Text length: ${text.length}, Pattern length: ${pat.length}`);
}
async function runRabin(text, pat){
  const d=256, q=101, M=pat.length, N=text.length; 
  if(M===0 || N<M) return;

  strLog(`Algorithm Description: Uses rolling hash to quickly check potential matches`);
  strLog(`Hash parameters: base d=${d}, modulus q=${q}`);
  strLog(`Time Complexity: O(n+m) average, O(n*m) worst case`);
  strLog(`Text: "${text}" (length ${N})`);
  strLog(`Pattern: "${pat}" (length ${M})`);
  strLog(``);

  let h=1; 
  for (let i=0;i<M-1;i++) {
    h=(h*d)%q;
    strLog(`Precompute h = ${h} (multiplier for most significant digit)`);
  }

  let p=0,t=0; 
  for (let i=0;i<M;i++){ 
    p=(d*p + pat.charCodeAt(i))%q; 
    t=(d*t + text.charCodeAt(i))%q;
  }
  strLog(`Initial pattern hash: p = ${p}`);
  strLog(`Initial text window hash: t = ${t}`);
  strLog(``);

  for (let i=0;i<=N-M;i++){ 
    strLog(`Window ${i}: Checking position ${i}, hash=${t}`);
    strLog(`   - Text window: "${text.substring(i, i+M)}"`);
    strLog(`   - Pattern: "${pat}"`);
    strLog(`   - Hash match? ${p===t ? 'YES' : 'NO'}`);

    highlightChars(i,M); 
    await sleep(delay); 

    if (p===t && text.slice(i,i+M)===pat){ 
      strLog(`   *** EXACT MATCH FOUND at position ${i} ***`);
      for (let k=0;k<M;k++){ textBox.children[i+k]?.classList.add('match'); } 
    } 

    if (i<N-M){
      strLog(`   - Rolling hash: t = (${d} * (${t} - ${text.charCodeAt(i)} * ${h}) + ${text.charCodeAt(i+M)}) % ${q}`);
      t=(d*(t - text.charCodeAt(i)*h) + text.charCodeAt(i+M))%q;
      if (t<0) t+=q;
      strLog(`   - New hash for next window: ${t}`);
    }
  }

  strLog(``);
  strLog(`=== RABIN-KARP SEARCH COMPLETED ===`);
}
async function runBM(text, pat){
  const M=pat.length, N=text.length; 
  const last={}; 
  for (const ch of new Set(text+pat)) last[ch]=-1; 
  for(let i=0;i<M;i++) last[pat[i]]=i; 

  strLog(`Algorithm Description: Uses bad character rule to skip alignments`);
  strLog(`Time Complexity: O(n/m) best case, O(n*m) worst case`);
  strLog(`Text: "${text}" (length ${N})`);
  strLog(`Pattern: "${pat}" (length ${M})`);
  strLog(`Bad character table:`, last);
  strLog(``);

  let s=0; 
  let shifts = 0;

  while(s<=N-M){ 
    shifts++;
    strLog(`Shift ${shifts}: Alignment at position ${s}`);
    strLog(`   - Text window: "${text.substring(s, s+M)}"`);

    let j=M-1; 
    while (j>=0 && pat[j]===text[s+j]) {
      strLog(`   - Character match at pattern position ${j}: '${pat[j]}' == '${text[s+j]}'`);
      j--;
    }

    highlightChars(s,M); 
    await sleep(delay);

    if (j<0){ 
      strLog(`   *** PATTERN FOUND at position ${s} ***`);
      for (let k=0;k<M;k++){ textBox.children[s+k]?.classList.add('match'); } 
      s += (s+M<N)? M - (last[text[s+M]] ?? -1) : 1;
      strLog(`   - Next shift: ${s}`);
    } else { 
      const lo = last[text[s+j]] ?? -1;
      const shift = Math.max(1, j - lo);
      strLog(`   - Bad character '${text[s+j]}' at text position ${s+j}`);
      strLog(`   - Last occurrence in pattern: ${lo}`);
      strLog(`   - Shift amount: max(1, ${j} - ${lo}) = ${shift}`);
      s += shift;
    }
  }

  strLog(``);
  strLog(`=== BOYER-MOORE SEARCH COMPLETED ===`);
  strLog(`Total shifts: ${shifts}`);
}
$('stringStartBtn')?.addEventListener('click', async ()=>{
  const algo = $('stringAlgo').value; const text = $('textInput').value; const pattern = $('patternInput').value;
  if (!text || !pattern) { alert('Enter both text and pattern'); return; }
  buildTextBox(text); stringLog.textContent=''; stringResultBox.innerText='Running...';
  if (algo==='naive') await runNaive(text, pattern);
  else if (algo==='kmp') await runKMP(text, pattern);
  else if (algo==='rabin') await runRabin(text, pattern);
  else if (algo==='bm') await runBM(text, pattern);
  stringResultBox.innerText='Done';
});
$('stringResetBtn')?.addEventListener('click', ()=>{ buildTextBox(''); stringResultBox.innerText='Status: idle'; if (stringLog) stringLog.textContent=''; });

const greedyAlgoSel = $('greedyAlgo');
if (greedyAlgoSel) {
  greedyAlgoSel.addEventListener('change', ()=>{
    const panels = ['g-activity','g-knapsack','g-egypt','g-jobseq','g-huffman'];
    const vis = ['g-activity-vis','g-knap-vis','g-egypt-vis','g-job-vis','g-huf-vis'];
    panels.forEach(id=>{ const el=$(id); if (el) el.style.display='none'; });
    vis.forEach(id=>{ const el=$(id); if (el) el.style.display='none'; });
    const v=greedyAlgoSel.value;
    if (v==='activity'){ $('g-activity').style.display='block'; $('g-activity-vis').style.display='block'; }
    if (v==='knapsack'){ $('g-knapsack').style.display='block'; $('g-knap-vis').style.display='block'; }
    if (v==='egypt'){ $('g-egypt').style.display='block'; $('g-egypt-vis').style.display='block'; }
    if (v==='jobseq'){ $('g-jobseq').style.display='block'; $('g-job-vis').style.display='block'; }
    if (v==='huffman'){ $('g-huffman').style.display='block'; $('g-huf-vis').style.display='block'; }
  });
}

const convModeSel = $('convMode');
const convInput    = $('convInput');
const convOutBox   = $('converterOutput');
const convMidBox   = $('converterVisBox');

if (convModeSel) convModeSel.addEventListener('change', ()=>{
  const m = convModeSel.value;
  const map = {
    dec2others: {ph:'e.g., 123',     label:'Enter decimal value'},
    bin2others: {ph:'e.g., 101101',  label:'Enter binary value'},
    oct2others: {ph:'e.g., 173',     label:'Enter octal value'},
    hex2others: {ph:'e.g., 7B',      label:'Enter hex value'},
    math: {ph:'', label:'Mathematical Operations'}
  };
  const cfg = map[m] || map.dec2others;
  $('convInputLabel').innerText = cfg.label;
  convInput.placeholder = cfg.ph;
});

const convRunBtn = $('convRunBtn');
if (convRunBtn) {
  convRunBtn.addEventListener('click', async () => {
    const mode = $('convMode').value;

    if (mode === 'math') {
      await runMathOperation();
    } else {
      runRegularConversion();
    }
  });
}

function runRegularConversion() {
  const mode = $('convMode').value;
  const raw  = (convInput.value || '').trim();

  const cfg = {
    dec2others: { from:10, to:[2,8,16] },
    bin2others: { from:2,  to:[8,10,16] },
    oct2others: { from:8,  to:[2,10,16] },
    hex2others: { from:16, to:[2,8,10] }
  }[mode] || { from:10, to:[2,8,16] };

  try {
    let parseRes;
    if (cfg.from === 10){
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error('Invalid decimal number');
      parseRes = { dec: n, steps:[`Input is decimal: ${n}`] };
    } else {
      parseRes = parseToDecimalWithSteps(raw, cfg.from);
    }

    const leftLines = [];
    leftLines.push(parseRes.steps.join('\n'));

    const summaryPairs = [];
    for (const b of cfg.to){
      if (b === 10){
        summaryPairs.push(`Dec: ${parseRes.dec}`);
        leftLines.push(`\nConvert to base 10 (decimal): already ${parseRes.dec}`);
      } else {
        const { out, steps } = convertFromDecimalWithSteps(parseRes.dec, b);
        summaryPairs.push(`${labelForBase(b)}: ${out}`);
        leftLines.push(`\nTo base ${b} (${labelForBase(b)}):\n` + steps.join('\n'));
      }
    }

    if (convOutBox) convOutBox.innerText = leftLines.join('\n');
    if (convMidBox) convMidBox.innerText = summaryPairs.join('  |  ');
  } catch (e){
    if (convOutBox) convOutBox.innerText = 'Error: ' + (e && e.message ? e.message : String(e));
    if (convMidBox) convMidBox.innerText = 'No conversion yet.';
  }
}

function digitVal(ch){
  const x = ch.toUpperCase();
  if (x >= '0' && x <= '9') return x.charCodeAt(0) - 48;
  if (x >= 'A' && x <= 'F') return 10 + (x.charCodeAt(0) - 65);
  return NaN;
}

function parseToDecimalWithSteps(str, base){
  const s = str.trim();
  if (!s) throw new Error('Empty input');
  let acc = 0;
  const steps = [`Parse "${s}" (base ${base}) to decimal (left→right):`];
  for (let i = 0; i < s.length; i++){
    const ch = s[i];
    if (ch === '_' || ch === ' ') continue;
    const v = digitVal(ch);
    if (isNaN(v) || v >= base) throw new Error(`Invalid digit "${ch}" for base ${base}`);
    const prev = acc;
    acc = acc * base + v;
    steps.push(`acc = ${prev} × ${base} + ${v} → ${acc}`);
  }
  return { dec: acc, steps };
}

function convertFromDecimalWithSteps(n, base){
  if (n === 0) return { out:'0', steps:[`Convert 0 to base ${base}: 0`] };
  let x = Math.abs(n);
  const rema = [];
  const steps = [`Convert ${n} to base ${base} by repeated division:`];
  while (x > 0){
    const q = Math.floor(x / base);
    const r = x % base;
    const rStr = r.toString(base).toUpperCase();
    steps.push(`${x} ÷ ${base} = ${q} remainder ${rStr}`);
    rema.push(rStr);
    x = q;
  }
  const out = rema.reverse().join('');
  steps.push(`Reverse remainders → ${out}`);
  return { out, steps };
}

function labelForBase(b){ return b===2?'Bin':b===8?'Oct':b===10?'Dec':'Hex'; }

function gLog(line){ const el=$('graphSteps'); if (el){ el.textContent += (el.textContent?'\n':'') + line; el.scrollTop = el.scrollHeight; } }
const canvas = $('graphCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let gNodes=[], gEdges=[], gMST=[];
$('genGraphBtn')?.addEventListener('click', ()=>generateGraph());

function generateGraph(){
  if (!canvas || !ctx) return;
  const n=Math.max(2, Number($('nodeCount').value));
  const density=Math.max(1, Math.min(100, Number($('edgeDensity').value)));
  gNodes=[]; gEdges=[];
  const cx=canvas.width/2, cy=canvas.height/2, r=Math.min(cx,cy)-80;
  for (let i=0;i<n;i++){ const ang=(i/n)*Math.PI*2 - Math.PI/2; gNodes.push({id:i,x:cx+Math.cos(ang)*r,y:cy+Math.sin(ang)*r}); }
  const possible=[]; for (let i=0;i<n;i++){ for (let j=i+1;j<n;j++) possible.push([i,j]); }
  possible.forEach(p=>{ if (Math.random()*100<density) gEdges.push({u:p[0], v:p[1], w:Math.floor(Math.random()*20)+1}); });
  if (gEdges.length===0){ for (let i=1;i<n;i++) gEdges.push({u:i-1, v:i, w:Math.floor(Math.random()*20)+1}); }
  gMST=[]; drawGraph(); $('graphResult').innerText = `Generated ${n} nodes, ${gEdges.length} edges.`; const gs=$('graphSteps'); if (gs){ gs.textContent = `Generated ${n} nodes, ${gEdges.length} edges.`; }
}

function drawGraph(highlights=new Set(), edgeColors={}){
  if (!ctx || !canvas) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let idx=0; idx<gEdges.length; idx++){
    const e=gEdges[idx], a=gNodes[e.u], b=gNodes[e.v];
    ctx.beginPath(); ctx.lineWidth=2;
    ctx.strokeStyle = highlights.has(idx) ? (edgeColors[idx] || 'rgba(110,231,183,0.95)') : 'rgba(255,255,255,0.06)';
    ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2; ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.font='12px Arial'; ctx.fillText(e.w, mx+6, my+6);
  }
  for (const n of gNodes){
    ctx.beginPath(); ctx.fillStyle='#0f1724'; ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=2;
    ctx.arc(n.x,n.y,18,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle='white'; ctx.font='12px Arial'; ctx.fillText(n.id, n.x-4, n.y+5);
  }
}

function runGraph(){
  const algo = $('graphAlgo').value;
  if (algo==='boruvka') runBoruvka();
  else if (algo==='kruskal') runKruskal();
  else if (algo==='prim') runPrim();
  else if (algo==='dijkstra') runDijkstra();
  else if (algo==='dial') runDial();
  else runPrim();
}

class UF{
  constructor(n){ this.p=new Array(n).fill(0).map((_,i)=>i); this.r=new Array(n).fill(0); }
  find(x){ return this.p[x]===x?x:(this.p[x]=this.find(this.p[x])); }
  union(a,b){ a=this.find(a); b=this.find(b); if(a===b) return false; if(this.r[a]<this.r[b]) this.p[a]=b; else this.p[b]=a; if(this.r[a]===this.r[b]) this.r[a]++; return true; }
}

function runKruskal(){
  const edges = gEdges.map((e,idx) => ({...e,idx})).sort((a,b) => a.w - b.w);
  const uf = new UF(gNodes.length); 
  const highlights = new Set(); 
  let step = 0;
  let totalWeight = 0;

  gLog(`=== KRUSKAL'S ALGORITHM FOR MINIMUM SPANNING TREE ===`);
  gLog(`Algorithm Description: Sort edges by weight, add smallest edge that doesn't form cycle`);
  gLog(`Time Complexity: O(E log E) for sorting, O(E α(V)) for union-find operations`);
  gLog(`Number of nodes: ${gNodes.length}, Number of edges: ${gEdges.length}`);
  gLog(`Initial edge list (sorted by weight):`);
  edges.forEach((e, i) => gLog(`   ${i+1}. Edge (${e.u}-${e.v}) weight=${e.w}`));
  gLog(``);

  $('graphResult').innerText = 'Running Kruskal...';

  function stepAnim(){
    if (step >= edges.length){
      gMST = Array.from(highlights).map(i => gEdges[i]);
      const finalWeight = gMST.reduce((sum, e) => sum + e.w, 0);
      const resultText = `Kruskal finished. MST Weight: ${finalWeight}`;
      $('graphResult').innerText = resultText;

      updateMSTTotal(finalWeight);
      gLog(`=== ALGORITHM COMPLETED ===`);
      gLog(`Minimum Spanning Tree found with total weight: ${finalWeight}`);
      gLog(`MST contains ${gMST.length} edges:`);
      gMST.forEach((e, i) => gLog(`   ${i+1}. Edge (${e.u}-${e.v}) weight=${e.w}`));
      gLog(`Number of components in original graph: 1 (MST connects all nodes)`);
      drawGraph(highlights); 
      return;
    }

    const e = edges[step]; 
    drawGraph(new Set([e.idx]), {[e.idx]: 'rgba(255,182,88,0.95)'}); 
    gLog(`Step ${step + 1}: Considering edge (${e.u}-${e.v}) with weight ${e.w}`);
    gLog(`   - Find operation: find(${e.u}) = ${uf.find(e.u)}, find(${e.v}) = ${uf.find(e.v)}`);
    gLog(`   - Are nodes in same component? ${uf.find(e.u) === uf.find(e.v) ? 'YES' : 'NO'}`);

    if (uf.union(e.u, e.v)){
      gLog(`   - UNION OPERATION: Merging components containing nodes ${e.u} and ${e.v}`);
      gLog(`   - Edge ADDED to Minimum Spanning Tree`);
      highlights.add(e.idx);
      totalWeight += e.w;
      updateMSTTotal(totalWeight);
      gLog(`   - Current MST weight: ${totalWeight}`);
      gLog(`   - Current MST edges: ${Array.from(highlights).map(i => `(${gEdges[i].u}-${gEdges[i].v})`).join(', ')}`);
    } else { 
      gLog(`   - SKIPPED: Edge would create a cycle in the MST`);
      gLog(`   - Components remain separate`);
    }

    step++; 
    setTimeout(stepAnim, 800);
  }
  stepAnim();
}

function runPrim(){
  const n = gNodes.length; 
  const adj = Array.from({length: n}, () => []);
  gEdges.forEach((e,idx) => { 
    adj[e.u].push({v: e.v, w: e.w, idx}); 
    adj[e.v].push({v: e.u, w: e.w, idx}); 
  });

  const visited = new Array(n).fill(false); 
  visited[0] = true; 
  const highlights = new Set();
  let totalWeight = 0;

  gLog(`=== PRIM'S ALGORITHM FOR MINIMUM SPANNING TREE ===`);
  gLog(`Algorithm Description: Grow MST from starting node, always add minimum edge connecting to tree`);
  gLog(`Time Complexity: O(V²) with array, O(E log V) with priority queue`);
  gLog(`Number of nodes: ${n}, Number of edges: ${gEdges.length}`);
  gLog(`Starting from node 0`);
  gLog(`Initial visited set: [0]`);
  gLog(``);

  $('graphResult').innerText = 'Running Prim...';

  function pickMinEdge(){ 
    let best = null; 
    for (let u = 0; u < n; u++){ 
      if(!visited[u]) continue; 
      for (const nb of adj[u]){ 
        if(!visited[nb.v] && (!best || nb.w < best.w)) {
          best = {...nb, from: u}; 
        }
      } 
    } 
    return best; 
  }

  let stepCount = 0;
  function step(){ 
    const best = pickMinEdge(); 
    if(!best){ 
      drawGraph(highlights); 
      const resultText = `Prim finished. MST Weight: ${totalWeight}`;
      $('graphResult').innerText = resultText;
      updateMSTTotal(totalWeight);
      gLog(`=== ALGORITHM COMPLETED ===`);
      gLog(`Minimum Spanning Tree found with total weight: ${totalWeight}`);
      gLog(`All ${n} nodes are connected in the MST`);
      gLog(`MST contains ${highlights.size} edges`);
      return; 
    }

    stepCount++;
    gLog(`Step ${stepCount}: Selected minimum edge (${best.from}-${best.v}) with weight ${best.w}`);
    gLog(`   - This edge connects visited node ${best.from} to unvisited node ${best.v}`);
    gLog(`   - Adding node ${best.v} to visited set`);
    visited[best.v] = true; 
    highlights.add(best.idx);
    totalWeight += best.w;
    updateMSTTotal(totalWeight);
    gLog(`   - Current MST weight: ${totalWeight}`);
    gLog(`   - Visited nodes: [${visited.map((v, i) => v ? i : null).filter(x => x !== null).join(', ')}]`);
    drawGraph(highlights); 
    setTimeout(step, 800); 
  }
  step();
}

function runBoruvka(){
  const n = gNodes.length;
  if (!n) return;

  const edges = gEdges.map((e,idx) => ({...e,idx}));
  const uf = new UF(n);
  let numComponents = n;
  const highlights = new Set();
  let totalWeight = 0;
  let phaseCount = 0;

  gLog(`=== BORUVKA'S ALGORITHM FOR MINIMUM SPANNING TREE ===`);
  gLog(`Algorithm Description: Each component finds cheapest outgoing edge, merge components in phases`);
  gLog(`Time Complexity: O(E log V) - Good for distributed computing`);
  gLog(`Number of nodes: ${n}, Number of edges: ${gEdges.length}`);
  gLog(`Initial state: ${n} components (each node is its own component)`);
  gLog(``);

  const adj = Array.from({length:n}, () => []);
  for (const e of edges){
    adj[e.u].push({to: e.v, w: e.w, idx: e.idx});
    adj[e.v].push({to: e.u, w: e.w, idx: e.idx});
  }

  async function phase(){
    phaseCount++;
    gLog(`=== PHASE ${phaseCount} ===`);
    gLog(`Components remaining: ${numComponents}`);

    if (numComponents === 1){
      drawGraph(highlights);
      const resultText = `Borůvka finished. MST Weight: ${totalWeight}`;
      $('graphResult').innerText = resultText;
      updateMSTTotal(totalWeight);
      gLog(`=== ALGORITHM COMPLETED ===`);
      gLog(`Single component remaining - MST is complete`);
      gLog(`Total MST weight: ${totalWeight}`);
      gLog(`Number of phases: ${phaseCount}`);
      return;
    }

    const cheapest = new Map();
    for (let u = 0; u < n; u++){
      const cu = uf.find(u);
      for (const nb of adj[u]){
        const cv = uf.find(nb.to);
        if (cu === cv) continue;
        const cur = cheapest.get(cu);
        if (!cur || nb.w < cur.w) cheapest.set(cu, {u, v: nb.to, w: nb.w, idx: nb.idx});
      }
    }

    if (cheapest.size === 0){
      drawGraph(highlights);
      $('graphResult').innerText = 'Graph is disconnected — partial forest drawn.';
      updateMSTTotal(totalWeight);
      gLog(`=== ALGORITHM TERMINATED ===`);
      gLog(`Graph is disconnected - found ${numComponents} connected components`);
      gLog(`This is a minimum spanning forest, not a single tree`);
      return;
    }

    gLog(`Found ${cheapest.size} candidate edges (cheapest outgoing edge for each component)`);
    for (const {idx, u, v, w} of cheapest.values()){
      gLog(`   - Component chooses edge (${u}-${v}) weight=${w}`);
      drawGraph(new Set([idx]), {[idx]: 'rgba(255,182,88,0.95)'});
      await sleep(600);
    }

    let merged = 0;
    for (const {u, v, idx, w} of cheapest.values()){
      if (uf.union(u, v)){
        merged++;
        numComponents--;
        highlights.add(idx);
        totalWeight += w;
        gLog(`   - MERGE: Components containing nodes ${u} and ${v} merged using edge (${u}-${v})`);
        updateMSTTotal(totalWeight);
        drawGraph(highlights);
        await sleep(500);
      }
    }

    gLog(`Phase ${phaseCount} results: Merged ${merged} components`);
    gLog(`Components remaining: ${numComponents}`);
    gLog(`Current MST weight: ${totalWeight}`);

    if (merged === 0){
      drawGraph(highlights);
      $('graphResult').innerText = 'Borůvka stopped (no merges possible).';
      updateMSTTotal(totalWeight);
      gLog(`=== ALGORITHM TERMINATED ===`);
      gLog(`No merges possible in this phase - algorithm cannot proceed`);
      return;
    }

    await sleep(500);
    phase();
  }

  phase();
}

function runDijkstra(){
  const n=gNodes.length;
  const adj=Array.from({length:n},()=>[]);
  gEdges.forEach((e,idx)=>{ adj[e.u].push({v:e.v,w:e.w,idx}); adj[e.v].push({v:e.u,w:e.w,idx}); });
  const dist=new Array(n).fill(Infinity); dist[0]=0;
  const vis=new Array(n).fill(false);

  gLog(`=== DIJKSTRA'S SHORTEST PATH ALGORITHM ===`);
  gLog(`Algorithm Description: Find shortest paths from source to all nodes using greedy approach`);
  gLog(`Time Complexity: O(V²) with array, O(E + V log V) with priority queue`);
  gLog(`Source node: 0, Number of nodes: ${n}`);
  gLog(`Initial distances: [${dist.join(', ')}]`);
  gLog(``);

  $('graphResult').innerText='Dijkstra running...'; 

  function minNode(){ 
    let id=-1,best=Infinity; 
    for(let i=0;i<n;i++) {
      if(!vis[i] && dist[i]<best){
        best=dist[i]; id=i;
      }
    }
    return id; 
  }

  let steps = 0;
  async function loop(){
    const u=minNode(); 
    if (u===-1){ 
      $('graphResult').innerText='Done'; 
      gLog(`=== ALGORITHM COMPLETED ===`);
      gLog(`Final shortest path distances from node 0:`);
      dist.forEach((d, i) => gLog(`   - Distance to node ${i}: ${d === Infinity ? '∞ (unreachable)' : d}`));
      return; 
    }

    steps++;
    vis[u]=true; 
    gLog(`Step ${steps}: Select node ${u} with current distance ${dist[u]}`);
    gLog(`   - Marking node ${u} as visited`);

    for (const nb of adj[u]){ 
      if (vis[nb.v]) continue; 
      const alt=dist[u]+nb.w; 
      gLog(`   - Relaxing edge (${u}-${nb.v}) with weight ${nb.w}`);
      gLog(`   - Alternative distance: ${dist[u]} + ${nb.w} = ${alt}`);
      gLog(`   - Current distance to node ${nb.v}: ${dist[nb.v]}`);

      drawGraph(new Set([nb.idx]), {[nb.idx]:'rgba(110,231,183,0.95)'}); 
      await sleep(600); 

      if (alt<dist[nb.v]){
        dist[nb.v]=alt; 
        gLog(`   - UPDATE: New shortest distance to node ${nb.v} = ${alt}`);
      } else {
        gLog(`   - No improvement, keeping current distance`);
      }
    } 
    await sleep(400); 
    loop();
  }
  loop();
}

function runDial(){
  const n=gNodes.length;
  const maxW = Math.max(...gEdges.map(e=>e.w),1);
  const adj=Array.from({length:n},()=>[]); 
  gEdges.forEach((e,idx)=>{ adj[e.u].push({v:e.v,w:e.w,idx}); adj[e.v].push({v:e.u,w:e.w,idx}); });
  const dist=new Array(n).fill(Infinity); dist[0]=0;
  const B = Array.from({length:maxW*n+1}, ()=>[]); B[0].push(0);

  gLog(`=== DIAL'S ALGORITHM (OPTIMIZED DIJKSTRA) ===`);
  gLog(`Algorithm Description: Uses buckets to store nodes based on distance, optimized for small edge weights`);
  gLog(`Time Complexity: O(E + V*W) where W is maximum edge weight`);
  gLog(`Maximum edge weight: ${maxW}, Number of buckets: ${maxW*n+1}`);
  gLog(`Source node: 0, Initial bucket[0] = [0]`);
  gLog(``);

  let idxB=0;
  let steps = 0;

  async function process(){
    while(idxB<B.length && B[idxB].length===0) idxB++;
    if (idxB>=B.length){ 
      gLog(`=== ALGORITHM COMPLETED ===`);
      gLog(`Final distances: [${dist.join(', ')}]`);
      $('graphResult').innerText='Done'; 
      return; 
    }

    steps++;
    const u=B[idxB].shift(); 
    gLog(`Step ${steps}: Process node ${u} from bucket[${idxB}] (distance = ${idxB})`);

    for (const nb of adj[u]){ 
      const alt=dist[u]+nb.w; 
      if (alt<dist[nb.v]){ 
        const old=dist[nb.v]; 
        dist[nb.v]=alt; 
        const bIdx=alt % B.length; 
        B[bIdx].push(nb.v); 
        gLog(`   - Relax edge (${u}-${nb.v}): ${dist[u]} + ${nb.w} = ${alt}`);
        gLog(`   - Update dist[${nb.v}] from ${old} to ${alt}`);
        gLog(`   - Move node ${nb.v} to bucket[${bIdx}]`);
        drawGraph(new Set([nb.idx]), {[nb.idx]:'rgba(110,231,183,0.95)'}); 
        await sleep(500); 
      } 
    }
    idxB++; 
    await sleep(400); 
    process();
  }
  process();
}

function updateMSTTotal(weight) {
  let mstTotalEl = $('mstTotal');
  if (!mstTotalEl) {
    mstTotalEl = document.createElement('div');
    mstTotalEl.id = 'mstTotal';
    mstTotalEl.className = 'mst-total';
    const graphResult = $('graphResult');
    graphResult.parentNode.insertBefore(mstTotalEl, graphResult.nextSibling);
  }
  mstTotalEl.textContent = `MST Total Weight: ${weight}`;
}

const primeGrid = $('primeGrid');
const primeLog  = $('primeLog');
let __primeStepN = 0;
function resetPrimeSteps(){
  __primeStepN = 0;
  if (primeLog) primeLog.textContent = '';
}
function pLog(s){
  if (!primeLog) return;
  __primeStepN += 1;
  primeLog.textContent += (primeLog.textContent ? '\n' : '') + `Step ${__primeStepN}. ${s}`;
  primeLog.scrollTop = primeLog.scrollHeight;
}

const primeStartBtn = $('primeStartBtn');
if (primeStartBtn) primeStartBtn.addEventListener('click', async ()=>{
  const algo = $('primeAlgo').value;
  const n    = Math.max(2, Number($('primeN').value) || 50);

  resetPrimeSteps();
  if (primeGrid) {
    primeGrid.innerHTML = '';
    for (let i=1;i<=n;i++){
      const d = document.createElement('div');
      d.className = 'numCell';
      d.id = 'num_'+i;
      d.innerText = String(i);
      primeGrid.appendChild(d);
    }
  }
  const mark = i => { const el=$('num_'+i); if (el){ el.classList.add('crossed'); el.classList.remove('prime'); } };
  const setP = i => { const el=$('num_'+i); if (el){ el.classList.add('prime');   el.classList.remove('crossed'); } };

  const sleepMs = 500;
  const wait = (t)=> new Promise(r=>setTimeout(r, t));

  if (algo === 'sieve'){
    pLog(`=== SIEVE OF ERATOSTHENES PRIME FINDING ALGORITHM ===`);
    pLog(`Finding all primes up to: ${n}`);
    pLog(`Initial state: Assume all numbers from 2 to ${n} are prime`);
    pLog(``);
    const comp = new Array(n+1).fill(false);

    for (let p=2; p*p<=n; p++){
      if (!comp[p]){
        setP(p);
        pLog(`Current prime: ${p}`);
        pLog(`Starting to mark multiples of ${p} from ${p*p} to ${n}`);
        for (let m=p*p; m<=n; m+=p){
          if (!comp[m]){
            comp[m]=true;
            mark(m);
            pLog(`   - Mark ${m} as composite (${p} × ${m/p})`);
            if (sleepMs) await wait(sleepMs);
          }
        }
        pLog(`Completed marking multiples of ${p}`);
        pLog(``);
      }
    }
    for (let i=2;i<=n;i++) if (!comp[i]) setP(i);
    pLog(`=== ALGORITHM COMPLETED ===`);
    pLog(`Prime numbers found: [${Array.from({length: n-1}, (_, i) => i+2).filter(i => !comp[i]).join(', ')}]`);
    pLog(`Total primes up to ${n}: ${Array.from({length: n-1}, (_, i) => i+2).filter(i => !comp[i]).length}`);
    return;
  }

  if (algo === 'trial'){
    pLog(`=== TRIAL DIVISION PRIME TESTING ALGORITHM ===`);
    pLog(`Testing numbers from 2 to ${n} for primality`);
    pLog(``);
    for (let x=2;x<=n;x++){
      pLog(`Testing number: ${x}`);
      let isPrime = true;
      for (let d=2; d*d<=x; d++){
        const r = x % d;
        pLog(`   - Test division: ${x} ÷ ${d} = ${Math.floor(x/d)} remainder ${r}`);
        if (r===0){ 
          isPrime=false; 
          mark(x); 
          pLog(`   - DIVISIBLE FOUND: ${x} is composite (divisible by ${d})`);
          break; 
        }
        if (sleepMs) await wait(sleepMs/2);
      }
      if (isPrime){ 
        setP(x); 
        pLog(`   - PRIME: ${x} has no divisors ≤ √${x} (${Math.floor(Math.sqrt(x))})`);
      }
      pLog(``);
    }
    pLog(`=== ALGORITHM COMPLETED ===`);
    return;
  }

  if (algo === 'fermat'){
    const bases = [2,3,5];
    pLog(`=== FERMAT PRIMALITY TEST ===`);
    pLog(`Algorithm Description: Based on Fermat's Little Theorem: if p is prime, then a^(p-1) ≡ 1 mod p`);
    pLog(`Note: Some composite numbers (Carmichael numbers) may pass this test`);
    pLog(`Test bases used: [${bases.join(', ')}]`);
    pLog(`Testing numbers from 2 to ${n}`);
    pLog(``);
    const modPow = (a,e,m)=>{ let res=1n, b=BigInt(a)%BigInt(m); let E=BigInt(e), M=BigInt(m);
      while(E>0n){ if(E&1n) res=(res*b)%M; b=(b*b)%M; E>>=1n; } return Number(res); };

    for (let x=2; x<=n; x++){
      pLog(`Testing number: ${x}`);
      if (x===2 || x===3){ 
        setP(x); 
        pLog(`   - Small prime (2 or 3), automatically prime`);
        continue; 
      }
      if (x%2===0){ 
        mark(x); 
        pLog(`   - Even number > 2, composite`);
        continue; 
      }
      let probable = true;
      for (const a of bases){
        if (a>=x) continue;
        const r = modPow(a, x-1, x);
        pLog(`   - Base ${a}: ${a}^(${x-1}) mod ${x} = ${r}`);
        if (r!==1){ 
          probable=false; 
          pLog(`   - FERMAT WITNESS: ${a}^(${x-1}) ≢ 1 mod ${x}, so ${x} is composite`);
          break; 
        }
        if (sleepMs) await wait(sleepMs/2);
      }
      probable ? setP(x) : mark(x);
      pLog(`   - Result: ${x} is ${probable ? 'probably prime' : 'composite'}`);
      pLog(``);
    }
    pLog(`=== ALGORITHM COMPLETED ===`);
    pLog(`Note: 'Probably prime' means it passed all Fermat tests but could still be composite (Carmichael number)`);
    return;
  }

  if (algo === 'miller'){
    pLog(`=== MILLER-RABIN PRIMALITY TEST ===`);
    pLog(`Algorithm Description: Strong probabilistic test, more reliable than Fermat test`);
    pLog(`Deterministic for numbers < 2,152,302,898,747 with bases [2, 3, 5, 7, 11]`);
    pLog(`Testing numbers from 2 to ${n}`);
    pLog(``);
    const modPow = (a,e,m)=>{ let res=1n, b=BigInt(a)%BigInt(m); let E=BigInt(e), M=BigInt(m);
      while(E>0n){ if(E&1n) res=(res*b)%M; b=(b*b)%M; E>>=1n; } return Number(res); };

    function isProbable(nv){
      if (nv<2) return false;
      if (nv===2 || nv===3) return true;
      if (nv%2===0) return false;
      let d = nv-1, s=0; 
      while ((d&1)===0){ d>>=1; s++; }
      pLog(`   - Factorization: ${nv}-1 = 2^${s} × ${d}`);
      for (const a of [2,3,5,7,11]){
        if (a % nv === 0) continue;
        let x = modPow(a, d, nv);
        pLog(`   - Base ${a}: ${a}^${d} mod ${nv} = ${x}`);
        if (x===1 || x===nv-1) {
          pLog(`     - ${x} is 1 or ${nv-1}, continue to next base`);
          continue;
        }
        let witness = true;
        for (let r=1; r<s; r++){
          x = (x*x) % nv;
          pLog(`     - Square ${r}: ${x}^2 mod ${nv} = ${x}`);
          if (x===nv-1){ 
            witness=false; 
            pLog(`     - Found ${nv-1}, not a witness`);
            break; 
          }
        }
        if (witness) {
          pLog(`     - MILLER-RABIN WITNESS: base ${a} proves ${nv} is composite`);
          return false;
        }
      }
      pLog(`   - No witnesses found, ${nv} is probably prime`);
      return true;
    }

    for (let x=2; x<=n; x++){
      pLog(`Testing ${x}:`);
      isProbable(x) ? setP(x) : mark(x);
      pLog(``);
      if (sleepMs) await wait(sleepMs);
    }
    pLog(`=== ALGORITHM COMPLETED ===`);
    return;
  }

  pLog(`=== AKS PRIMALITY TEST (SIMPLIFIED) ===`);
  pLog(`Simplified version: Check if number is a perfect power`);
  pLog(`Note: Full AKS test is more complex, this is a simplified demonstration`);
  pLog(`Testing numbers from 2 to ${n}`);
  pLog(``);
  function isPerfectPower(x){
    for (let b=2; b<=Math.floor(Math.log2(x))+1; b++){
      const a = Math.round(Math.pow(x, 1/b));
      if (a**b === x) return true;
    }
    return false;
  }
  for (let x=2;x<=n;x++){
    pLog(`Testing ${x}:`);
    if (isPerfectPower(x)){
      mark(x); 
      pLog(`   - Perfect power: ${x} = a^b for some integers a,b > 1`);
      pLog(`   - Therefore composite`);
    } else {
      setP(x);
      pLog(`   - Not a perfect power (simplified AKS test passed)`);
    }
    pLog(``);
    if (sleepMs) await wait(sleepMs);
  }
  pLog(`=== ALGORITHM COMPLETED ===`);
});

function fmt(x){ return (x === -Infinity || x === Number.NEGATIVE_INFINITY) ? '∞' : String(x); }

async function runTournamentSort(arr){
  toggleBarsForAlgo('tournament'); clearTreeCanvas(); clearSortLog();
  setupTreeZoom();

  addSortStep(`=== TOURNAMENT SORT ALGORITHM ===`);
  addSortStep(`Input array: [${arr.join(', ')}]`);
  addSortStep(`Array length: ${arr.length}`);
  addSortStep(``);

  addSortStep(`PHASE 1: Building tournament tree`);
  const n=arr.length, pow2 = 1 << Math.ceil(Math.log2(Math.max(1,n)));
  addSortStep(`   - Next power of 2 >= ${n}: ${pow2}`);
  addSortStep(`   - Tournament tree size: ${2*pow2-1} nodes (${pow2} leaves)`);

  const leaves = arr.slice(); 
  while (leaves.length<pow2) leaves.push(-Infinity);
  addSortStep(`   - Leaves array: [${leaves.join(', ')}] (padded with -∞)`);

  const T = new Array(2*pow2-1).fill(null).map(() => ({ val: -Infinity, winner: null, leaf: false }));
  const startLeaf = pow2-1;

  for (let i=0;i<pow2;i++){ 
    T[startLeaf+i].val = leaves[i]; 
    T[startLeaf+i].leaf = true;
  }
  addSortStep(`   - Initialized leaves at indices ${startLeaf} to ${startLeaf+pow2-1}`);

  for (let i=startLeaf-1;i>=0;i--){
    const L=2*i+1,R=2*i+2,vl=T[L].val, vr=T[R].val;
    addSortStep(`   - Internal node ${i}: comparing children ${L}(${fmt(vl)}) and ${R}(${fmt(vr)})`);
    incSortStep();
    if (vl>=vr){ 
      T[i].val=vl; T[i].winner=L; 
      addSortStep(`     - Winner: left child ${L} with value ${fmt(vl)}`);
    } else { 
      T[i].val=vr; T[i].winner=R; 
      addSortStep(`     - Winner: right child ${R} with value ${fmt(vr)}`);
    }
    drawTournamentTree(T,pow2,new Set([i,L,R])); 
    await sleep(delay);
  }

  addSortStep(`   - Root node value: ${fmt(T[0].val)}`);
  addSortStep(``);
  addSortStep(`PHASE 2: Extracting winners and replaying matches`);

  const result=[];
  let extractionCount = 0;

  while (result.length<n){
    extractionCount++;
    const win = T[0].val; 
    result.push(win);
    addSortStep(`Extraction ${extractionCount}: Winner = ${fmt(win)}`);
    addSortStep(`   - Current result: [${result.join(', ')}]`);
    incSortStep();

    let idx=0; 
    const path=[0];
    while (!T[idx].leaf){ 
      idx=T[idx].winner; 
      path.push(idx);
    }
    addSortStep(`   - Path to winner leaf: [${path.join(' → ')}]`);

    T[idx].val = -Infinity; 
    addSortStep(`   - Set leaf ${idx} to -∞`);
    drawTournamentTree(T,pow2,new Set(path)); 
    await sleep(delay);

    for (let p=path.length-2;p>=0;p--){
      const u=path[p], L=2*u+1, R=2*u+2, vl=T[L].val, vr=T[R].val;
      addSortStep(`   - Replaying at node ${u}: comparing ${L}(${fmt(vl)}) vs ${R}(${fmt(vr)})`);
      incSortStep();
      if (vl>=vr){ 
        T[u].val=vl; T[u].winner=L; 
        addSortStep(`     - New winner: left child ${L}`);
      } else { 
        T[u].val=vr; T[u].winner=R; 
        addSortStep(`     - New winner: right child ${R}`);
      }
      drawTournamentTree(T,pow2,new Set([u,L,R])); 
      await sleep(delay);
    }
    addSortStep(``);
  }

  const ascending = result.slice().reverse();
  addSortStep(`=== ALGORITHM COMPLETED ===`);
  addSortStep(`Final sorted array (ascending): [${ascending.join(', ')}]`);
  addSortStep(`Total extractions: ${extractionCount}`);
  addSortStep(`Total operations: ${stepCounter}`);
}

function drawTournamentTree(T, leafCount, highlights=new Set()){
  const canvas=document.getElementById('treeCanvas'); 
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const levels=Math.log2(leafCount)+1;
  const levelGapY=Math.max(80,(canvas.height-40)/(levels+1));
  const nodeRadius = 20;

  const maxLeaves = 2**(levels-1);
  const minLeafGap = 80;
  const requiredWidth = Math.max(canvas.width, maxLeaves * minLeafGap);

  if (requiredWidth > canvas.width) {
    canvas.width = requiredWidth;
  }

  const pos=T.map((_,i)=>{ 
    const level=Math.floor(Math.log2(i+1)); 
    const nodes=2**level;
    const idx=i-(2**level-1); 
    const gapX=canvas.width/(nodes+1);
    return {x:gapX*(idx+1), y:40+levelGapY*level}; 
  });

  for (let i=0;i<T.length;i++){ 
    const L=2*i+1,R=2*i+2; 
    if (L<T.length){ 
      ctx.beginPath(); 
      ctx.strokeStyle= (highlights.has(i)||highlights.has(L))?'rgba(255,182,88,0.85)':'rgba(255,255,255,0.06)'; 
      ctx.lineWidth = 2;
      ctx.moveTo(pos[i].x,pos[i].y); 
      ctx.lineTo(pos[L].x,pos[L].y); 
      ctx.stroke(); 
    } 
    if (R<T.length){ 
      ctx.beginPath(); 
      ctx.strokeStyle=(highlights.has(i)||highlights.has(R))?'rgba(255,182,88,0.85)':'rgba(255,255,255,0.06)'; 
      ctx.lineWidth = 2;
      ctx.moveTo(pos[i].x,pos[i].y); 
      ctx.lineTo(pos[R].x,pos[R].y); 
      ctx.stroke(); 
    } 
  }

  ctx.font='14px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i=0;i<T.length;i++){ 
    const {x,y}=pos[i]; 
    ctx.beginPath(); 
    ctx.fillStyle=highlights.has(i)?'#1b2438':'#0f1724'; 
    ctx.strokeStyle=highlights.has(i)?'rgba(255,182,88,0.8)':'rgba(255,255,255,0.08)'; 
    ctx.lineWidth=2;
    ctx.arc(x,y,nodeRadius,0,Math.PI*2); 
    ctx.fill(); 
    ctx.stroke(); 

    ctx.fillStyle='white'; 
    const s=fmt(T[i].val); 
    ctx.fillText(s, x, y+1); 
  }
}

async function runHeapSortVisual(arr){
  toggleBarsForAlgo('heap'); clearTreeCanvas(); clearSortLog();
  setupTreeZoom();

  addSortStep(`=== HEAP SORT ALGORITHM ===`);
  addSortStep(`Input array: [${arr.join(', ')}]`);
  addSortStep(`Array length: ${arr.length}`);
  addSortStep(``);

  addSortStep(`PHASE 1: Building max heap from array`);
  const a = arr.slice(); const n=a.length;

  async function heapify(nsize, i){
    while (true){
      const L=2*i+1, R=2*i+2; 
      let largest=i;

      addSortStep(`   Heapify called on node ${i} (value: ${a[i]}) with heap size ${nsize}`);
      addSortStep(`     - Left child index: ${L}, value: ${L < nsize ? a[L] : 'N/A'}`);
      addSortStep(`     - Right child index: ${R}, value: ${R < nsize ? a[R] : 'N/A'}`);

      if (L<nsize && a[L]>a[largest]) {
        largest=L;
        addSortStep(`     - Left child larger, largest = ${L}`);
      }
      if (R<nsize && a[R]>a[largest]) {
        largest=R;
        addSortStep(`     - Right child larger, largest = ${R}`);
      }

      addSortStep(`     - Current largest: ${largest} (value: ${a[largest]})`);
      incSortStep();

      if (largest!==i){ 
        addSortStep(`     - SWAP NEEDED: swapping parent ${i}(${a[i]}) with child ${largest}(${a[largest]})`);
        [a[i], a[largest]] = [a[largest], a[i]];
        drawHeapTree(a.slice(0, nsize), new Set([i,largest].filter(idx => idx < nsize))); 
        await sleep(delay); 
        i=largest;
        addSortStep(`     - Continue heapifying from new position ${i}`);
      }
      else { 
        addSortStep(`     - Heap property satisfied at node ${i}`);
        drawHeapTree(a.slice(0, nsize), new Set([i].filter(idx => idx < nsize))); 
        await sleep(delay); 
        break; 
      }
    }
  }

  addSortStep(`Building heap from bottom up (starting from last non-leaf node)`);
  for (let i=Math.floor(n/2)-1;i>=0;i--) {
    addSortStep(`Heapifying node ${i}`);
    await heapify(n,i);
  }
  addSortStep(`Max heap construction completed`);
  addSortStep(`Root value (maximum): ${a[0]}`);
  addSortStep(``);

  addSortStep(`PHASE 2: Extracting elements from heap`);
  for (let end=n-1; end>0; end--){ 
    addSortStep(`Extraction ${n-end}: Swap root ${a[0]} with last element ${a[end]} at position ${end}`);
    incSortStep(); 
    [a[0], a[end]] = [a[end], a[0]];

    const currentHeap = a.slice(0, end);
    drawHeapTree(currentHeap, new Set([0])); 
    await sleep(delay); 

    addSortStep(`   - Array after swap: [${a.join(', ')}]`);
    addSortStep(`   - Heapifying root with reduced heap size ${end}`);
    await heapify(end,0); 
  }

  addSortStep(`Final step: Only one element remaining, array is sorted`);
  addSortStep(`   - Single element: ${a[0]} at position 0`);
  drawHeapTree([a[0]], new Set([0])); 
  await sleep(delay);

  addSortStep(`=== ALGORITHM COMPLETED ===`);
  addSortStep(`Final sorted array: [${a.join(', ')}]`);
  addSortStep(`Total operations: ${stepCounter}`);
}

function drawHeapTree(arr, highlights){
  clearTreeCanvas();
  const canvas = document.getElementById('treeCanvas');
  const ctx = canvas.getContext('2d');
  if (!ctx || !arr.length) return;

  const levels=Math.floor(Math.log2(arr.length))+1;
  const levelGapY=Math.max(80,(canvas.height-40)/(levels+1));
  const nodeRadius = 20;

  const maxNodes = 2**(levels-1);
  const minNodeGap = 80;
  const requiredWidth = Math.max(canvas.width, maxNodes * minNodeGap);

  if (requiredWidth > canvas.width) {
    canvas.width = requiredWidth;
  }

  const pos=[];
  for(let i=0;i<arr.length;i++){
    const level=Math.floor(Math.log2(i+1));
    const indexInLevel=i-(2**level - 1);
    const nodesInLevel=2**level;
    const gapX=canvas.width/(nodesInLevel+1);
    const x=gapX*(indexInLevel+1);
    const y=40 + levelGapY*level;
    pos.push({x,y});
  }

  ctx.strokeStyle='rgba(255,255,255,0.06)'; 
  ctx.lineWidth=2;
  for (let i=0;i<arr.length;i++){
    const L=2*i+1, R=2*i+2;
    if (L<arr.length){ 
      ctx.beginPath(); 
      ctx.moveTo(pos[i].x,pos[i].y); 
      ctx.lineTo(pos[L].x,pos[L].y); 
      ctx.stroke(); 
    }
    if (R<arr.length){ 
      ctx.beginPath(); 
      ctx.moveTo(pos[i].x,pos[i].y); 
      ctx.lineTo(pos[R].x,pos[R].y); 
      ctx.stroke(); 
    }
  }

  ctx.font='14px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i=0;i<arr.length;i++){
    const {x,y}=pos[i];
    ctx.beginPath(); 
    ctx.fillStyle=(highlights && highlights.has(i))?'#1b2438':'#0f1724'; 
    ctx.strokeStyle=(highlights && highlights.has(i))?'rgba(255,182,88,0.8)':'rgba(255,255,255,0.08)'; 
    ctx.lineWidth=2;
    ctx.arc(x,y,nodeRadius,0,Math.PI*2); 
    ctx.fill(); 
    ctx.stroke();

    ctx.fillStyle='white'; 
    const s=String(arr[i]); 
    ctx.fillText(s, x, y+1);
  }
}

async function runTreeSortVisual(arr){
  toggleBarsForAlgo('tree'); clearTreeCanvas(); clearSortLog();
  setupTreeZoom();

  addSortStep(`=== TREE SORT ALGORITHM ===`);
  addSortStep(`Input array: [${arr.join(', ')}]`);
  addSortStep(`Array length: ${arr.length}`);
  addSortStep(``);

  addSortStep(`PHASE 1: Building Binary Search Tree`);
  let root=null;

  function insert(val){ 
    if(!root){ 
      root={v:val,L:null,R:null}; 
      return ['root']; 
    } 
    let n=root, path=['root']; 
    while(true){ 
      if(val<n.v){ 
        path.push('L'); 
        if(n.L) n=n.L; 
        else { 
          n.L={v:val,L:null,R:null}; 
          break; 
        } 
      } else { 
        path.push('R'); 
        if(n.R) n=n.R; 
        else { 
          n.R={v:val,L:null,R:null}; 
          break; 
        } 
      } 
    } 
    return path; 
  }

  for (const x of arr){ 
    const path=insert(x); 
    addSortStep(`Insert ${x}: Path = ${path.join(' → ')}`);
    incSortStep(); 
    drawBST(root); 
    await sleep(delay); 
  }

  addSortStep(`Binary Search Tree construction completed`);
  addSortStep(``);
  addSortStep(`PHASE 2: Inorder Traversal for Sorted Order`);

  const out=[]; 
  (function inorder(n){ 
    if(!n) return; 
    inorder(n.L); 
    out.push(n.v); 
    inorder(n.R); 
  })(root);

  addSortStep(`Inorder traversal result: [${out.join(', ')}]`); 
  addSortStep(`=== ALGORITHM COMPLETED ===`);
  addSortStep(`Final sorted array: [${out.join(', ')}]`);
  addSortStep(`Total insertions: ${arr.length}`);
}

function drawBST(root){
  const canvas=document.getElementById('treeCanvas'); 
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height); 
  if(!root) return;

  const nodes=[]; 
  (function inorder(n,d=0){ 
    if(!n) return; 
    inorder(n.L,d+1); 
    nodes.push({n,d}); 
    inorder(n.R,d+1);
  })(root,0);

  const depth=Math.max(0,...nodes.map(x=>x.d));
  const levelGapY=Math.max(80,(canvas.height-40)/(depth+2));
  const nodeRadius = 20;

  const pos=new Map(); 
  nodes.forEach((e,i)=>{
    const x = 40 + (i * 100);
    const y = 40 + levelGapY * e.d;
    pos.set(e.n,{x, y, depth: e.d});
  });

  function drawEdges(n){
    if(!n) return; 
    const p=pos.get(n);
    if(n.L && pos.has(n.L)){ 
      const lp=pos.get(n.L); 
      ctx.beginPath(); 
      ctx.strokeStyle='rgba(255,255,255,0.06)'; 
      ctx.lineWidth = 2;
      ctx.moveTo(p.x,p.y); 
      ctx.lineTo(lp.x,lp.y); 
      ctx.stroke(); 
      drawEdges(n.L); 
    } 
    if(n.R && pos.has(n.R)){ 
      const rp=pos.get(n.R); 
      ctx.beginPath(); 
      ctx.strokeStyle='rgba(255,255,255,0.06)'; 
      ctx.lineWidth = 2;
      ctx.moveTo(p.x,p.y); 
      ctx.lineTo(rp.x,rp.y); 
      ctx.stroke(); 
      drawEdges(n.R); 
    } 
  }
  drawEdges(root);

  ctx.font='14px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const [node,p] of pos){ 
    ctx.beginPath(); 
    ctx.fillStyle='#0f1724'; 
    ctx.strokeStyle='rgba(255,255,255,0.08)'; 
    ctx.lineWidth=2;
    ctx.arc(p.x,p.y,nodeRadius,0,Math.PI*2); 
    ctx.fill(); 
    ctx.stroke(); 

    ctx.fillStyle='white'; 
    const s=String(node.v); 
    ctx.fillText(s, p.x, p.y+1); 
  }
}

function updateTreeCanvasWrapper() {
  const wrap = document.getElementById('treeCanvasWrap');
  if (wrap) {
    wrap.style.overflow = 'hidden';
    wrap.style.border = '1px solid rgba(255,255,255,0.06)';
    wrap.style.borderRadius = '8px';
    wrap.style.height = '400px';
    wrap.style.width = '100%';
    wrap.style.position = 'relative';
  }
}

const moreStartBtn = $('moreStartBtn');
if (moreStartBtn) moreStartBtn.addEventListener('click', async ()=>{
  const algo = $('moreAlgo').value;
  const aRaw = $('moreA').value.trim();
  const bRaw = $('moreB').value.trim();

  const moreLog = $('moreLog');
  const moreVisBox = $('moreVisBox');

  moreLog.innerText = 'Running algorithm...';
  moreVisBox.innerHTML = 'Processing...';

  try {

    if (['gcd', 'lcm', 'fibonacci', 'factorial'].includes(algo)) {
      let result;
      let steps = [];

      switch(algo) {
        case 'gcd':
          if (!aRaw || !bRaw) throw new Error('Please enter both numbers a and b');
          result = await runGCD(parseInt(aRaw), parseInt(bRaw), steps);
          break;
        case 'lcm':
          if (!aRaw || !bRaw) throw new Error('Please enter both numbers a and b');
          result = await runLCM(parseInt(aRaw), parseInt(bRaw), steps);
          break;
        case 'fibonacci':
          if (!aRaw) throw new Error('Please enter a number n');
          result = await runFibonacci(parseInt(aRaw), steps);
          break;
        case 'factorial':
          if (!aRaw) throw new Error('Please enter a number n');
          result = await runFactorial(parseInt(aRaw), steps);
          break;
      }

      moreLog.innerText = 'Algorithm completed';
      moreVisBox.innerHTML = `
        <strong>Result:</strong> ${result}<br><br>
        <strong>Steps:</strong><br>
        ${steps.map(step => `• ${step}`).join('<br>')}
      `;
    }

    else if (['extended-euclidean', 'chinese-remainder'].includes(algo)) {
      let requestBody = {};
      let endpoint = '';

      if (algo === 'extended-euclidean') {
        if (!aRaw || !bRaw) {
          throw new Error('Please enter both numbers a and b');
        }
        endpoint = '/api/more';  
        requestBody = {
          algo: 'extended-euclidean',  
          a: parseInt(aRaw),
          b: parseInt(bRaw)
        };
      } 
      else if (algo === 'chinese-remainder') {
        if (!bRaw) {
          throw new Error('Please enter congruence pairs in format: a1,m1;a2,m2;...');
        }
        endpoint = '/api/more';  
        requestBody = {
          algo: 'chinese-remainder',  
          pairs: bRaw
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      moreLog.innerText = 'Algorithm completed';

      if (algo === 'extended-euclidean') {
        moreVisBox.innerHTML = `
          <strong>Extended Euclidean Algorithm Result:</strong><br>
          gcd(${aRaw}, ${bRaw}) = ${result.gcd}<br>
          Bézout coefficients: x = ${result.x}, y = ${result.y}<br>
          Verification: ${aRaw}×${result.x} + ${bRaw}×${result.y} = ${result.verification}<br><br>
          <strong>Steps:</strong><br>
          ${result.steps.map(step => `• ${step}`).join('<br>')}
        `;
      } 
      else if (algo === 'chinese-remainder') {
        moreVisBox.innerHTML = `
          <strong>Chinese Remainder Theorem Result:</strong><br>
          Solution: x ≡ ${result.solution} (mod ${result.modulus})<br>
          General solution: ${result.general_solution}<br><br>
          <strong>Steps:</strong><br>
          ${result.steps.map(step => `• ${step}`).join('<br>')}
        `;
      }
    }
    else {
      throw new Error('Unknown algorithm selected');
    }

  } catch (error) {
    moreLog.innerText = 'Error: ' + error.message;
    moreVisBox.innerHTML = `<strong>Error:</strong> ${error.message}`;
    console.error('Algorithm error:', error);
  }
});

async function runGCD(a, b, steps) {
  steps.push(`Finding GCD of ${a} and ${b}`);
  let x = Math.abs(a);
  let y = Math.abs(b);

  while(y) {
    steps.push(`${x} % ${y} = ${x % y}`);
    [x, y] = [y, x % y];
  }

  steps.push(`GCD is ${x}`);
  return x;
}

async function runLCM(a, b, steps) {
  steps.push(`Finding LCM of ${a} and ${b}`);
  const gcd = await runGCD(a, b, []);
  const lcm = Math.abs(a * b) / gcd;
  steps.push(`LCM = |${a} × ${b}| / GCD(${a}, ${b}) = ${lcm}`);
  return lcm;
}

function drawHuffmanTree(struct) {
  const canvas = document.getElementById('hufCanvas');
  const canvasContainer = document.querySelector('.canvas-container');
  if (!canvas || !struct) return;

  const ctx = canvas.getContext('2d');

  huffmanZoom = 1.0;
  huffmanTranslateX = 0;
  huffmanTranslateY = 0;

  function getTreeDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
  }

  function countLeaves(node) {
    if (!node) return 0;
    if (!node.left && !node.right) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
  }

  const maxDepth = getTreeDepth(struct);
  const leafCount = countLeaves(struct);

  const levelGap = 120;
  const nodeRadius = 28;
  const horizontalSpacing = 80;

  const requiredWidth = Math.max(1200, leafCount * horizontalSpacing * 2);
  const requiredHeight = Math.max(800, maxDepth * levelGap + 200);

  canvas.width = requiredWidth;
  canvas.height = requiredHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nodePositions = new Map();

  function calculatePositions(node, depth, leftBound, rightBound) {
    if (!node) return null;

    if (!node.left && !node.right) {
      const x = (leftBound + rightBound) / 2;
      const y = 100 + depth * levelGap;
      nodePositions.set(node, { x, y });
      return { x, width: horizontalSpacing };
    }

    let leftResult = { x: 0, width: 0 };
    let rightResult = { x: 0, width: 0 };

    if (node.left) {
      leftResult = calculatePositions(node.left, depth + 1, leftBound, (leftBound + rightBound) / 2);
    }
    if (node.right) {
      rightResult = calculatePositions(node.right, depth + 1, (leftBound + rightBound) / 2, rightBound);
    }

    const childrenWidth = leftResult.width + rightResult.width;
    const x = (leftResult.x + rightResult.x) / 2;
    const y = 100 + depth * levelGap;

    nodePositions.set(node, { x, y });

    return { 
      x, 
      width: Math.max(horizontalSpacing, childrenWidth) 
    };
  }

  calculatePositions(struct, 0, 100, canvas.width - 100);

  function drawEdges(node) {
    if (!node) return;

    const parentPos = nodePositions.get(node);
    if (!parentPos) return;

    if (node.left) {
      const childPos = nodePositions.get(node.left);
      if (childPos) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(parentPos.x, parentPos.y);
        ctx.lineTo(childPos.x, childPos.y);
        ctx.stroke();

        const midX = (parentPos.x + childPos.x) / 2;
        const midY = (parentPos.y + childPos.y) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, Arial';
        ctx.fillText('0', midX - 20, midY - 15);
      }
    }

    if (node.right) {
      const childPos = nodePositions.get(node.right);
      if (childPos) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(parentPos.x, parentPos.y);
        ctx.lineTo(childPos.x, childPos.y);
        ctx.stroke();

        const midX = (parentPos.x + childPos.x) / 2;
        const midY = (parentPos.y + childPos.y) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, Arial';
        ctx.fillText('1', midX + 15, midY - 15);
      }
    }

    drawEdges(node.left);
    drawEdges(node.right);
  }

  drawEdges(struct);

  function drawNodes() {
    for (const [node, pos] of nodePositions) {

      ctx.beginPath();
      ctx.fillStyle = '#0f1724';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (node.sym) {

        const displayChar = node.sym === ' ' ? '␠' : 
                           node.sym === '\n' ? '↵' : 
                           node.sym;

        ctx.font = 'bold 18px Inter, Arial';
        ctx.fillText(displayChar, pos.x, pos.y - 10);

        ctx.font = 'bold 16px Inter, Arial';
        ctx.fillText(node.freq.toString(), pos.x, pos.y + 12);
      } else {

        ctx.font = 'bold 20px Inter, Arial';
        ctx.fillText(node.freq.toString(), pos.x, pos.y);
      }
    }
  }

  drawNodes();

  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) {
    zoomLevel.textContent = '100%';
  }

  updateHuffmanZoomTransform();
}

function updateHuffmanZoomTransform() {
  const canvas = document.getElementById('hufCanvas');
  if (!canvas) return;

  canvas.style.transform = `translate(${huffmanTranslateX}px, ${huffmanTranslateY}px) scale(${huffmanZoom})`;
  canvas.style.transformOrigin = '0 0';
}

function setupHuffmanZoom() {
  const canvas = document.getElementById('hufCanvas');
  const canvasContainer = document.querySelector('.canvas-container');
  const zoomLevel = document.getElementById('zoomLevel');

  if (!canvas || !canvasContainer) return;

  function updateZoom() {
    updateHuffmanZoomTransform();
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(huffmanZoom * 100)}%`;
    }
  }

  canvasContainer.addEventListener('wheel', function(e) {
    e.preventDefault();

    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomChange = -e.deltaY * ZOOM_SENSITIVITY;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, huffmanZoom * (1 + zoomChange)));

    if (newZoom !== huffmanZoom) {
      const scaleChange = newZoom / huffmanZoom;
      huffmanTranslateX = mouseX - (mouseX - huffmanTranslateX) * scaleChange;
      huffmanTranslateY = mouseY - (mouseY - huffmanTranslateY) * scaleChange;

      huffmanZoom = newZoom;
      updateZoom();
    }
  });

  canvasContainer.addEventListener('mousedown', function(e) {
    if (e.button === 0) {
      isHuffmanDragging = true;
      huffmanLastX = e.clientX;
      huffmanLastY = e.clientY;
      canvasContainer.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (isHuffmanDragging) {
      const deltaX = e.clientX - huffmanLastX;
      const deltaY = e.clientY - huffmanLastY;

      huffmanTranslateX += deltaX;
      huffmanTranslateY += deltaY;

      huffmanLastX = e.clientX;
      huffmanLastY = e.clientY;

      updateZoom();
    }
  });

  document.addEventListener('mouseup', function() {
    isHuffmanDragging = false;
    canvasContainer.style.cursor = 'grab';
  });

  canvasContainer.addEventListener('mouseleave', function() {
    isHuffmanDragging = false;
    canvasContainer.style.cursor = 'grab';
  });

  canvasContainer.addEventListener('dblclick', function(e) {
    if (e.target === canvas || canvas.contains(e.target)) {
      huffmanZoom = 1.0;
      huffmanTranslateX = 0;
      huffmanTranslateY = 0;
      updateZoom();
    }
  });

  canvasContainer.style.cursor = 'grab';
  updateZoom();
}

function renderHuffmanTable(codes, freqMap) {
  const box = document.getElementById('hufVisBox');
  if (!box) return;

  let frequencyMap;
  if (freqMap instanceof Map) {
    frequencyMap = {};
    for (const [key, value] of freqMap) {
      frequencyMap[key] = value;
    }
  } else {
    frequencyMap = freqMap || {};
  }

  const rows = Object.keys(codes)
    .sort((a, b) => a.localeCompare(b))
    .map(ch => {
      const code = codes[ch];
      const freq = frequencyMap[ch] || 0;
      const totalBits = freq * code.length;
      const label = ch === ' ' ? '␠ (space)' : 
                   ch === '\n' ? '↵ (newline)' : 
                   ch;
      return { label, freq, code, totalBits };
    });

  const U = rows.length;
  const symbolTableBits = 8 * U;
  const treeOverheadBits = 3 * U;
  const treeTableBits = symbolTableBits + treeOverheadBits;
  const messageBits = rows.reduce((s, r) => s + r.totalBits, 0);
  const grandTotalBits = messageBits + treeTableBits;

  const tbody = rows.map(r => `
    <tr>
      <td class="char-col" style="font-size: 16px; font-weight: bold;">${r.label}</td>
      <td class="freq-col tabnums" style="font-size: 16px;">${r.freq}</td>
      <td class="code-col tabnums" style="font-size: 16px; font-weight: bold;"><code>${r.code}</code></td>
      <td class="bits-col tabnums" style="font-size: 16px;">${r.totalBits}</td>
    </tr>
  `).join('');

  box.innerHTML = `
    <table class="huf-table" style="font-size: 16px; width: 100%;">
      <colgroup>
        <col style="width:28%">
        <col style="width:16%">
        <col style="width:36%">
        <col style="width:20%">
      </colgroup>
      <thead>
        <tr>
          <th class="char-col" style="font-size: 16px; padding: 12px 8px;">character</th>
          <th class="freq-col" style="font-size: 16px; padding: 12px 8px;">frequency</th>
          <th class="code-col" style="font-size: 16px; padding: 12px 8px;">code</th>
          <th class="bits-col" style="font-size: 16px; padding: 12px 8px;">#ofbits</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
    </table>

    <div class="small" style="margin-top:16px; font-style:italic; font-size: 14px;">8 bit × ${U} char</div>
    <div class="small" style="margin-top:6px; display:flex; gap:20px; max-width:520px; justify-content:space-between; font-variant-numeric:tabular-nums; font-size: 14px;">
      <div style="flex:1; text-align:center">${symbolTableBits}</div>
      <div style="flex:1; text-align:center">${rows.reduce((s,r)=>s+r.freq,0)}</div>
      <div style="flex:1; text-align:center">${treeOverheadBits}</div>
      <div style="flex:1; text-align:center">${messageBits}</div>
    </div>

    <div class="small" style="margin-top:14px; font-size: 14px;"><b>Message:</b> ${messageBits} bits</div>
    <div class="small" style="font-size: 14px;"><b>Tree/Table:</b> ${treeTableBits} bits (${symbolTableBits}+${treeOverheadBits})</div>
    <div class="small" style="font-size: 14px;"><b>Total #ofbits:</b> ${grandTotalBits} bits (${messageBits}+${treeTableBits})</div>
  `;
}

function renderHuffman(resp, freqMap) {

  const canvas = document.getElementById('hufCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  drawHuffmanTree(resp.struct);

  renderHuffmanTable(resp.codes, freqMap);

  setTimeout(() => {
    setupHuffmanZoom();
  }, 100);
}

function countFreqFromText(text) {
  const freqMap = new Map();
  for (const char of text) {
    freqMap.set(char, (freqMap.get(char) || 0) + 1);
  }
  return freqMap;
}

function initializeHuffman() {
  const runHufBtn = document.getElementById('runHufBtn');
  if (runHufBtn) {
    runHufBtn.addEventListener('click', async () => {
      const input = document.getElementById('hufInput');
      const raw = input ? input.value : '';
      const freqMap = countFreqFromText(raw);

      try {
        const response = await fetch('/api/greedy/huffman', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairs: raw }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resp = await response.json();

        if (resp.error) {
          throw new Error(resp.error);
        }

        const vis = document.getElementById('g-huf-vis'); 
        if (vis) vis.style.display = 'block';

        console.log('Huffman Response:', resp);
        console.log('Frequency Map:', freqMap);
        console.log('Codes:', resp.codes);

        renderHuffman(resp, freqMap);
      } catch (err) {
        console.error('Huffman request failed:', err);
        if (!err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
          alert(`Huffman error: ${err.message}`);
        }
      }
    });
  }
}

function initializeHuffman() {
  const runHufBtn = document.getElementById('runHufBtn');
  if (runHufBtn) {
    runHufBtn.addEventListener('click', async () => {
      const input = document.getElementById('hufInput');
      const raw = input ? input.value : '';
      const freqMap = countFreqFromText(raw);

      try {
        const response = await fetch('/api/greedy/huffman', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairs: raw }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resp = await response.json();

        if (resp.error) {
          throw new Error(resp.error);
        }

        const vis = document.getElementById('g-huf-vis'); 
        if (vis) vis.style.display = 'block';
        renderHuffman(resp, freqMap);
      } catch (err) {
        console.error('Huffman request failed:', err);
        if (!err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
          alert(`Huffman error: ${err.message}`);
        }
      }
    });
  }
}

const cryptoAlgoSel = $('cryptoAlgo');
const cryptoKeyContainer = $('cryptoKeyContainer');
const cryptoAdditionalInputs = $('cryptoAdditionalInputs');

if (cryptoAlgoSel) {
  cryptoAlgoSel.addEventListener('change', updateCryptoInputs);
}

function updateCryptoInputs() {
  const algo = cryptoAlgoSel.value;
  let keyLabel = 'Key';
  let keyPlaceholder = 'Enter key';
  let keyValue = '3';
  let additionalHTML = '';
  let showAnalyze = false;
  let showDecrypt = true;

  switch(algo) {
    case 'caesar':
      keyLabel = 'Shift Value';
      keyPlaceholder = 'e.g., 3';
      keyValue = '3';
      break;
    case 'railfence':
      keyLabel = 'Number of Rails';
      keyPlaceholder = 'e.g., 3';
      keyValue = '3';
      break;
    case 'onetimepad':
      keyLabel = 'One-Time Pad Key';
      keyPlaceholder = 'Random key of same length as message';
      keyValue = '';
      break;
    case 'columnar':
      keyLabel = 'Keyword';
      keyPlaceholder = 'e.g., KEYWORD';
      keyValue = 'KEYWORD';
      break;
    case 'vernam':
      keyLabel = 'Vernam Key';
      keyPlaceholder = 'Random key (binary or text)';
      keyValue = '';
      break;
    case 'playfair':
      keyLabel = 'Keyword';
      keyPlaceholder = 'e.g., MONARCHY';
      keyValue = 'MONARCHY';
      break;
    case 'vigenere':
      keyLabel = 'Keyword';
      keyPlaceholder = 'e.g., KEY';
      keyValue = 'KEY';
      break;
    case 'affine':
      keyLabel = 'Keys (a,b)';
      keyPlaceholder = 'e.g., 5,8';
      keyValue = '5,8';
      break;
    case 'scytale':
      keyLabel = 'Diameter';
      keyPlaceholder = 'e.g., 3';
      keyValue = '3';
      break;
    case 'hill':
      keyLabel = 'Matrix Key';
      keyPlaceholder = 'e.g., 3,2,1,4 for 2x2';
      keyValue = '3,2,1,4';
      additionalHTML = `
        <label>Matrix Size</label>
        <select id="hillSize">
          <option value="2">2x2</option>
          <option value="3">3x3</option>
        </select>
      `;
      break;
    case 'substitution':
      keyLabel = 'Substitution Alphabet';
      keyPlaceholder = 'e.g., ZYXWVUTSRQPONMLKJIHGFEDCBA';
      keyValue = 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
      break;
    case 'transposition':
      keyLabel = 'Key';
      keyPlaceholder = 'e.g., 3124';
      keyValue = '3124';
      break;
    case 'sha256':
      keyLabel = 'No Key Required';
      keyPlaceholder = 'Hash function - no key needed';
      keyValue = '';
      showDecrypt = false;
      break;
    case 'monoalphabetic':
      keyLabel = 'Substitution Key';
      keyPlaceholder = 'e.g., ZYXWVUTSRQPONMLKJIHGFEDCBA';
      keyValue = 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
      break;
    case 'polyalphabetic':
      keyLabel = 'Keyword';
      keyPlaceholder = 'e.g., KEY';
      keyValue = 'KEY';
      break;
    case 'product':
      keyLabel = 'Key';
      keyPlaceholder = 'e.g., KEY';
      keyValue = 'KEY';
      break;
    case 'kasiski':
      keyLabel = 'Not Required';
      keyPlaceholder = 'Analysis only - no key needed';
      keyValue = '';
      showAnalyze = true;
      showDecrypt = false;
      break;
    case 'rsa':
      keyLabel = 'RSA Parameters';
      keyPlaceholder = 'p,q,e or n,d for decryption';
      keyValue = '61,53,17';
      additionalHTML = `
        <label>Operation Mode</label>
        <select id="rsaMode">
          <option value="keygen">Key Generation</option>
          <option value="encrypt">Encrypt</option>
          <option value="decrypt">Decrypt</option>
        </select>
      `;
      break;
    case 'diffiehellman':
      keyLabel = 'Parameters (p,g,a,b)';
      keyPlaceholder = 'e.g., 23,5,6,15';
      keyValue = '23,5,6,15';
      showDecrypt = false;
      break;
  }

  cryptoKeyContainer.innerHTML = `
    <label>${keyLabel}</label>
    <input id="cryptoKey" placeholder="${keyPlaceholder}" value="${keyValue}">
  `;

  if (additionalHTML) {
    cryptoAdditionalInputs.innerHTML = additionalHTML;
    cryptoAdditionalInputs.style.display = 'block';
  } else {
    cryptoAdditionalInputs.style.display = 'none';
  }

  $('cryptoDecryptBtn').style.display = showDecrypt ? 'inline-block' : 'none';
  $('cryptoAnalyzeBtn').style.display = showAnalyze ? 'inline-block' : 'none';
}

updateCryptoInputs();

$('cryptoEncryptBtn')?.addEventListener('click', async () => {
  await runCryptoAlgorithm('encrypt');
});

$('cryptoDecryptBtn')?.addEventListener('click', async () => {
  await runCryptoAlgorithm('decrypt');
});

$('cryptoAnalyzeBtn')?.addEventListener('click', async () => {
  await runCryptoAlgorithm('analyze');
});

async function runCryptoAlgorithm(operation) {
  const algo = $('cryptoAlgo').value;
  const input = $('cryptoInput').value;
  const key = $('cryptoKey').value;

  const resultBox = $('cryptoResult');
  const stepsBox = $('cryptoSteps');
  const detailsBox = $('cryptoDetails');

  resultBox.textContent = 'Processing...';
  stepsBox.textContent = '';
  detailsBox.textContent = '';

  try {
    const requestData = {
      algorithm: algo,
      operation: operation,
      input: input,
      key: key
    };

    // Add additional parameters for specific algorithms
    const hillSize = $('hillSize');
    if (hillSize) {
      requestData.hillSize = hillSize.value;
    }

    const rsaMode = $('rsaMode');
    if (rsaMode) {
      requestData.rsaMode = rsaMode.value;
    }

    const response = await fetch('/api/crypto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    resultBox.innerHTML = `<strong>Result:</strong> ${result.result || 'No result'}`;

    if (result.steps && result.steps.length > 0) {
      stepsBox.innerHTML = '<strong>Step-by-Step Process:</strong><br>' + 
        result.steps.map(step => `• ${step}`).join('<br>');
    } else {
      stepsBox.textContent = 'No detailed steps available.';
    }

    if (result.details && result.details.length > 0) {
      detailsBox.innerHTML = '<strong>Additional Details:</strong><br>' + 
        result.details.map(detail => `• ${detail}`).join('<br>');
    } else {
      detailsBox.textContent = 'No additional details.';
    }

  } catch (err) {
    console.error('Crypto algorithm failed:', err);
    resultBox.innerHTML = `<strong>Error:</strong> ${err.message}`;
    stepsBox.textContent = 'Failed to process the request. Check console for details.';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initializeHuffman();
  updateTreeCanvasWrapper();

  const sortAlgoSel = document.getElementById('sortAlgo');
  if (sortAlgoSel) {
    sortAlgoSel.addEventListener('change', function() {
      const algo = this.value;
      if (algo === 'heap' || algo === 'tree' || algo === 'tournament') {
        setTimeout(setupTreeZoom, 100);
      }
    });
  }
});

const style = document.createElement('style');
style.textContent = `
  .gap-highlight {
    border: 2px solid #f59e0b !important;
    box-shadow: 0 0 8px #f59e0b !important;
  }
`;
document.head.appendChild(style);