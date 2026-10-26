# CPU Process Scheduling Simulator — SJF and SRTF

## Files
- `index.html` — dashboard and GUI layout
- `style.css` — blue-and-white responsive styling
- `script.js` — interactive browser simulation for SJF and SRTF
- `scheduler.c` — standalone C implementation of SJF and SRTF

## Run the GUI in Visual Studio Code
1. Extract the ZIP file.
2. Open the `cpu_scheduler_sla` folder in VS Code.
3. Open `index.html` in a browser, or use the Live Server extension.
4. Add processes or click **Load Example**.
5. Select SJF or SRTF and click **Run Simulation**.

The browser GUI uses JavaScript for calculations because a normal browser page cannot directly execute a C program. The included `scheduler.c` implements both algorithms separately in C.

## Compile and run the C program
With GCC installed, open a terminal in this folder:

Windows:
```bash
gcc scheduler.c -o scheduler.exe
scheduler.exe
```

Linux/macOS:
```bash
gcc scheduler.c -o scheduler
./scheduler
```

## Metrics
- Completion Time (CT)
- Turnaround Time (TAT) = CT − Arrival Time
- Waiting Time (WT) = TAT − Burst Time
- Response Time = First CPU start − Arrival Time
- Average waiting and turnaround time
- CPU utilization = Total CPU busy time / final elapsed time × 100

Algorithms included: SJF (non-preemptive) and SRTF (preemptive). Round Robin is not included.
