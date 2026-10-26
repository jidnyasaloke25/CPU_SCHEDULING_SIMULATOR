const processes = [];
let lastResult = null;
const $ = id => document.getElementById(id);

function renderProcesses() {
  const body = $("processTable");
  $("statProcesses").textContent = processes.length;
  if (!processes.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty">No processes added yet. Add a process or load the example.</td></tr>';
    return;
  }
  body.innerHTML = processes.map((p, i) => `<tr>
    <td><span class="pid-chip">${escapeHtml(p.pid)}</span></td>
    <td>${p.at}</td><td>${p.bt}</td><td>${p.bt}</td>
    <td><button class="delete-btn" data-delete="${i}" aria-label="Delete ${escapeHtml(p.pid)}">Delete</button></td>
  </tr>`).join("");
  body.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => {
    processes.splice(Number(btn.dataset.delete), 1);
    renderProcesses();
    resetResults();
  }));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
$("processForm").addEventListener("submit", e => {
  e.preventDefault();
  const pid = $("pid").value.trim();
  const at = Number($("arrival").value);
  const bt = Number($("burst").value);
  if (!pid || !Number.isInteger(at) || at < 0 || !Number.isInteger(bt) || bt < 1) {
    alert("Enter a process ID, arrival time ≥ 0 and burst time ≥ 1 (whole numbers).");
    return;
  }
  if (processes.some(p => p.pid.toLowerCase() === pid.toLowerCase())) {
    alert("Process IDs must be unique.");
    return;
  }
  processes.push({pid, at, bt});
  renderProcesses();
  resetResults();
  $("pid").value = "";
  $("pid").focus();
});
$("loadExample").addEventListener("click", () => {
  processes.splice(0, processes.length,
    {pid:"P1",at:0,bt:7},{pid:"P2",at:2,bt:4},{pid:"P3",at:4,bt:1},{pid:"P4",at:5,bt:4});
  renderProcesses(); resetResults();
});
$("clearAll").addEventListener("click", () => {
  processes.length = 0; renderProcesses(); resetResults();
});
$("runSimulation").addEventListener("click", () => {
  if (!processes.length) { alert("Please add at least one process first."); return; }
  const algorithm = document.querySelector('input[name="algorithm"]:checked').value;
  lastResult = algorithm === "SJF" ? runSJF(processes) : runSRTF(processes);
  showResults(lastResult, algorithm);
});

function runSJF(input) {
  const ps = input.map(p => ({...p, remaining:p.bt, ct:0, tat:0, wt:0, rt:null, done:false}));
  let time = 0, completed = 0, busy = 0;
  const timeline = [];
  while (completed < ps.length) {
    const ready = ps.filter(p => !p.done && p.at <= time)
      .sort((a,b) => a.bt-b.bt || a.at-b.at || a.pid.localeCompare(b.pid));
    if (!ready.length) {
      const next = Math.min(...ps.filter(p => !p.done).map(p => p.at));
      if (next > time) timeline.push({pid:"Idle",start:time,end:next});
      time = next; continue;
    }
    const p = ready[0], start = time;
    if (p.rt === null) p.rt = time - p.at;
    time += p.bt; busy += p.bt; p.remaining = 0; p.done = true; p.ct = time;
    p.tat = p.ct - p.at; p.wt = p.tat - p.bt; completed++;
    timeline.push({pid:p.pid,start,end:time});
  }
  return summarize(ps,timeline,busy,time);
}
function runSRTF(input) {
  const ps = input.map(p => ({...p, remaining:p.bt, ct:0, tat:0, wt:0, rt:null, done:false}));
  let time = 0, completed = 0, busy = 0, current = null, segmentStart = 0;
  const timeline = [];
  while (completed < ps.length) {
    const ready = ps.filter(p => !p.done && p.at <= time)
      .sort((a,b) => a.remaining-b.remaining || a.at-b.at || a.pid.localeCompare(b.pid));
    if (!ready.length) {
      if (current !== null) {
        timeline.push({pid:current.pid,start:segmentStart,end:time}); current = null;
      }
      const next = Math.min(...ps.filter(p => !p.done).map(p => p.at));
      if (next > time) timeline.push({pid:"Idle",start:time,end:next});
      time = next; continue;
    }
    const p = ready[0];
    if (current !== p) {
      if (current !== null) timeline.push({pid:current.pid,start:segmentStart,end:time});
      current = p; segmentStart = time;
      if (p.rt === null) p.rt = time - p.at;
    }
    p.remaining--; time++; busy++;
    if (p.remaining === 0) {
      p.done = true; p.ct = time; p.tat = p.ct-p.at; p.wt = p.tat-p.bt;
      completed++;
      timeline.push({pid:p.pid,start:segmentStart,end:time});
      current = null;
    }
  }
  return summarize(ps,timeline,busy,time);
}
function summarize(ps,timeline,busy,totalTime) {
  const avgWt = ps.reduce((s,p)=>s+p.wt,0)/ps.length;
  const avgTat = ps.reduce((s,p)=>s+p.tat,0)/ps.length;
  return {ps,timeline,busy,totalTime,avgWt,avgTat,util:totalTime ? busy/totalTime*100 : 0};
}
function showResults(result, algorithm) {
  $("algorithmTag").textContent = algorithm;
  $("ganttSubtitle").textContent = algorithm === "SJF" ? "Non-preemptive execution timeline." : "Preemptive execution timeline; repeated blocks show context changes.";
  $("resultsTable").innerHTML = result.ps.slice().sort((a,b)=>a.pid.localeCompare(b.pid)).map(p =>
    `<tr><td><span class="pid-chip">${escapeHtml(p.pid)}</span></td><td>${p.at}</td><td>${p.bt}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td><td><span class="response-pill">${p.rt}</span></td></tr>`
  ).join("");
  $("avgWait").textContent = result.avgWt.toFixed(2);
  $("avgTurn").textContent = result.avgTat.toFixed(2);
  $("cpuUtil").textContent = result.util.toFixed(2) + "%";
  $("statWaiting").textContent = result.avgWt.toFixed(2);
  $("statTurnaround").textContent = result.avgTat.toFixed(2);
  $("statUtilization").textContent = result.util.toFixed(1) + "%";
  renderGantt(result.timeline);
}
function renderGantt(timeline) {
  const chart = $("ganttChart");
  if (!timeline.length) { chart.innerHTML = '<div class="empty">No timeline available.</div>'; return; }
  const start = timeline[0].start, end = timeline[timeline.length-1].end;
  const span = Math.max(1,end-start);
  const blocks = timeline.map((s,i) => {
    const width = Math.max(55, (s.end-s.start)/span*650);
    const cls = s.pid === "Idle" ? "idle" : (i%2 ? "alt" : "");
    return `<div class="gantt-unit" style="width:${width}px"><div class="gantt-block ${cls}" title="${escapeHtml(s.pid)}: ${s.start}–${s.end}">${escapeHtml(s.pid)}</div><div class="gantt-time"><span>${s.start}</span><span>${s.end}</span></div></div>`;
  }).join("");
  chart.innerHTML = `<div class="gantt-track">${blocks}</div>`;
}
function resetResults() {
  lastResult = null;
  $("algorithmTag").textContent = "Not run";
  $("ganttSubtitle").textContent = "Run a simulation to view the execution timeline.";
  $("ganttChart").innerHTML = '<div class="empty gantt-empty">Your CPU execution timeline will appear here.</div>';
  $("resultsTable").innerHTML = '<tr><td colspan="7" class="empty">No results to display.</td></tr>';
  $("avgWait").textContent = $("avgTurn").textContent = $("cpuUtil").textContent = "—";
  $("statWaiting").textContent = $("statTurnaround").textContent = $("statUtilization").textContent = "—";
}
renderProcesses();
