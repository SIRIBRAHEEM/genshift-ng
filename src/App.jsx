import { useEffect, useMemo, useState } from "react";
import {
  summariseLogs, shiftSavings, paybackMonths, applianceKwh,
  monthlyCost, formatNaira, treesEquivalent, DEFAULT_FUEL_PRICE, DEFAULT_TARIFF,
} from "./lib/calc.js";

const SEED_LOGS = [
  { id: "s1", date: "2026-11-20", genHours: 6, fuelLitres: 5.0, nepaHours: 5 },
  { id: "s2", date: "2026-11-21", genHours: 7, fuelLitres: 5.6, nepaHours: 4 },
  { id: "s3", date: "2026-11-22", genHours: 5, fuelLitres: 4.0, nepaHours: 7 },
  { id: "s4", date: "2026-11-23", genHours: 8, fuelLitres: 6.4, nepaHours: 3 },
  { id: "s5", date: "2026-11-24", genHours: 6, fuelLitres: 4.8, nepaHours: 6 },
  { id: "s6", date: "2026-11-25", genHours: 5, fuelLitres: 4.0, nepaHours: 8 },
];

const APPLIANCES = [
  { name: "LED bulb", watts: 9 },
  { name: "Ceiling fan", watts: 75 },
  { name: "TV 43 inch", watts: 90 },
  { name: "Fridge", watts: 150 },
  { name: "Freezer", watts: 200 },
  { name: "Water pump", watts: 750 },
  { name: "Iron", watts: 1000 },
  { name: "AC 1.5hp", watts: 1200 },
];

const KITS = [
  { name: "Starter inverter kit", spec: "1.5kVA inverter, 200Ah battery", cost: 650000 },
  { name: "Family solar kit", spec: "3.5kVA inverter, 2 panels, lithium battery", cost: 1850000 },
  { name: "Full home solar", spec: "5kVA inverter, 4 panels, lithium battery", cost: 3200000 },
];

const TIPS = [
  "Run the generator only when NEPA and battery are both down.",
  "Charge phones, laptops and power banks during NEPA hours.",
  "Swap every bulb for LED. One LED uses about one tenth of an old bulb.",
  "Service the generator monthly. A dirty filter wastes fuel.",
  "Iron and pump water during NEPA hours, not on generator.",
  "Turn off the fridge at night if it is already cold and rarely opened.",
];

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="border border-line bg-panel p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-lime/80">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold ${accent ? "text-lime" : "text-white"}`}>{value}</p>
      <p className="mt-1 text-xs text-white/50">{sub}</p>
    </div>
  );
}

export default function App() {
  const [logs, setLogs] = useState(() => load("genshift_logs", SEED_LOGS));
  const [fuelPrice, setFuelPrice] = useState(() => load("genshift_price", DEFAULT_FUEL_PRICE));
  const [tariff, setTariff] = useState(() => load("genshift_tariff", DEFAULT_TARIFF));
  const [cutHours, setCutHours] = useState(3);
  const [litresPerHour, setLitresPerHour] = useState(0.8);
  const [picked, setPicked] = useState(() => load("genshift_appliances", { "LED bulb": { qty: 6, hours: 6 }, "Ceiling fan": { qty: 2, hours: 8 }, "TV 43 inch": { qty: 1, hours: 5 }, "Fridge": { qty: 1, hours: 12 } }));
  const [doneTips, setDoneTips] = useState(() => load("genshift_tips", []));
  const [form, setForm] = useState({ date: "2026-11-26", genHours: "", fuelLitres: "", nepaHours: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => { localStorage.setItem("genshift_logs", JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem("genshift_price", JSON.stringify(fuelPrice)); }, [fuelPrice]);
  useEffect(() => { localStorage.setItem("genshift_tariff", JSON.stringify(tariff)); }, [tariff]);
  useEffect(() => { localStorage.setItem("genshift_appliances", JSON.stringify(picked)); }, [picked]);
  useEffect(() => { localStorage.setItem("genshift_tips", JSON.stringify(doneTips)); }, [doneTips]);

  const s = useMemo(() => summariseLogs(logs, fuelPrice), [logs, fuelPrice]);
  const shift = useMemo(() => shiftSavings({ cutHoursPerDay: cutHours, litresPerHour, fuelPrice }), [cutHours, litresPerHour, fuelPrice]);
  const maxFuel = Math.max(...logs.map((l) => Number(l.fuelLitres) || 0), 1);

  const dailyKwh = useMemo(() => Object.entries(picked).reduce((sum, [name, v]) => {
    const a = APPLIANCES.find((x) => x.name === name);
    return a ? sum + applianceKwh(a.watts, Number(v.hours) || 0, Number(v.qty) || 0) : sum;
  }, 0), [picked]);

  function addLog(e) {
    e.preventDefault();
    if (!form.date || form.genHours === "" || form.fuelLitres === "") { setMsg("Fill date, generator hours and fuel litres."); return; }
    setLogs((prev) => [...prev, { id: Date.now().toString(), date: form.date, genHours: Number(form.genHours), fuelLitres: Number(form.fuelLitres), nepaHours: Number(form.nepaHours) || 0 }].sort((a, b) => a.date.localeCompare(b.date)));
    setForm({ date: "2026-11-26", genHours: "", fuelLitres: "", nepaHours: "" });
    setMsg("Day saved. Your dashboard has updated.");
  }

  function removeLog(id) { setLogs((prev) => prev.filter((l) => l.id !== id)); }

  function setAppliance(name, field, value) {
    setPicked((prev) => ({ ...prev, [name]: { qty: prev[name]?.qty ?? 0, hours: prev[name]?.hours ?? 0, [field]: value } }));
  }

  const inputCls = "w-full border border-line bg-ink px-3 py-2 font-mono text-sm text-white outline-none focus:border-lime";
  const labelCls = "text-[11px] font-semibold uppercase tracking-widest text-white/60";

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-lime font-mono text-lg font-bold text-ink">G</div>
            <div>
              <p className="text-lg font-extrabold leading-none tracking-tight">GenShift <span className="text-lime">NG</span></p>
              <p className="mt-1 text-xs text-white/50">Cut generator cost. Plan the shift to solar.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="border border-line px-2 py-1 text-white/60">OFFLINE READY</span>
            <span className="border border-lime px-2 py-1 text-lime">NO SIGN UP</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="border border-line bg-panel p-5">
          <p className="font-mono text-xs text-lime">FOR NIGERIAN HOMES RUNNING GENERATORS</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight">See what your generator really costs, then plan your way off it.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Log your generator hours and fuel each day. GenShift shows your true monthly cost, your carbon emissions,
            and how much you save for every generator hour you replace with inverter or solar power.
          </p>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Your totals">
          <Stat label="Fuel used" value={`${s.totalFuel.toFixed(1)} L`} sub={`Across ${s.days} logged days`} accent />
          <Stat label="Fuel cost" value={formatNaira(s.fuelCost)} sub={`At ${formatNaira(fuelPrice)} per litre`} />
          <Stat label="Emissions" value={`${s.co2Kg.toFixed(1)} kg`} sub={`About ${treesEquivalent(s.co2Kg).toFixed(1)} tree-years of CO2`} />
          <Stat label="Generator time" value={`${s.totalGenHours.toFixed(0)} hrs`} sub={`${s.avgGenHoursPerDay.toFixed(1)} hrs per day on average`} />
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <section className="border border-line bg-panel p-5 lg:col-span-3">
            <h2 className="text-base font-bold">Daily fuel use</h2>
            <p className="mt-1 text-xs text-white/50">Litres per day from your log. Taller bar, more money burned.</p>
            <div className="mt-4 flex h-40 items-end gap-2">
              {logs.map((l) => (
                <div key={l.id} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[10px] text-lime">{Number(l.fuelLitres).toFixed(1)}</span>
                  <div className="w-full bg-lime" style={{ height: `${Math.max(8, (Number(l.fuelLitres) / maxFuel) * 110)}px` }} />
                  <span className="font-mono text-[9px] text-white/40">{l.date.slice(5)}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-sm text-white/50">No days logged yet. Add your first day below.</p>}
            </div>

            <form onSubmit={addLog} className="mt-5 border-t border-line pt-4">
              <h3 className="text-sm font-bold">Log today</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div><label className={labelCls} htmlFor="d">Date</label><input id="d" type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><label className={labelCls} htmlFor="g">Gen hours</label><input id="g" type="number" min="0" step="0.5" placeholder="6" className={inputCls} value={form.genHours} onChange={(e) => setForm({ ...form, genHours: e.target.value })} /></div>
                <div><label className={labelCls} htmlFor="f">Fuel litres</label><input id="f" type="number" min="0" step="0.1" placeholder="5.0" className={inputCls} value={form.fuelLitres} onChange={(e) => setForm({ ...form, fuelLitres: e.target.value })} /></div>
                <div><label className={labelCls} htmlFor="n">NEPA hours</label><input id="n" type="number" min="0" step="0.5" placeholder="5" className={inputCls} value={form.nepaHours} onChange={(e) => setForm({ ...form, nepaHours: e.target.value })} /></div>
              </div>
              <button type="submit" className="mt-3 bg-lime px-5 py-2.5 text-sm font-bold text-ink hover:bg-lime-dim">Save day</button>
              {msg && <p className="mt-2 text-sm text-lime" role="status">{msg}</p>}
            </form>

            {logs.length > 0 && (
              <ul className="mt-4 divide-y divide-line border-t border-line text-sm">
                {[...logs].reverse().slice(0, 7).map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2 font-mono text-xs">
                    <span>{l.date}</span>
                    <span className="text-white/60">GEN {l.genHours}h</span>
                    <span className="text-lime">{Number(l.fuelLitres).toFixed(1)}L</span>
                    <span className="text-white/60">NEPA {l.nepaHours}h</span>
                    <button onClick={() => removeLog(l.id)} className="text-white/40 hover:text-red-400" aria-label={`Delete ${l.date}`}>DELETE</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-lime bg-panel p-5 lg:col-span-2">
            <p className="font-mono text-xs text-lime">SHIFT PLANNER</p>
            <h2 className="mt-1 text-base font-bold">What if you run the generator less?</h2>
            <label className={`${labelCls} mt-4 block`} htmlFor="cut">Generator hours cut per day: <span className="font-mono text-lime">{cutHours}h</span></label>
            <input id="cut" type="range" min="0" max="10" step="0.5" value={cutHours} onChange={(e) => setCutHours(Number(e.target.value))} className="mt-2 w-full" />
            <label className={`${labelCls} mt-3 block`} htmlFor="lph">Your generator fuel use (litres per hour)</label>
            <input id="lph" type="number" min="0.2" max="3" step="0.1" value={litresPerHour} onChange={(e) => setLitresPerHour(Number(e.target.value))} className={`${inputCls} mt-1`} />
            <div className="mt-4 space-y-2 border-t border-line pt-4 font-mono text-sm">
              <p className="flex justify-between"><span className="text-white/60">Fuel saved / month</span><span className="text-lime">{shift.litresSavedPerMonth.toFixed(0)} L</span></p>
              <p className="flex justify-between"><span className="text-white/60">Money saved / month</span><span className="text-lime">{formatNaira(shift.nairaSavedPerMonth)}</span></p>
              <p className="flex justify-between"><span className="text-white/60">CO2 saved / month</span><span className="text-lime">{shift.co2SavedPerMonth.toFixed(0)} kg</span></p>
              <p className="flex justify-between"><span className="text-white/60">Money saved / year</span><span className="text-lime">{formatNaira(shift.nairaSavedPerMonth * 12)}</span></p>
            </div>
            <h3 className="mt-5 text-sm font-bold">When does a kit pay for itself?</h3>
            <ul className="mt-2 space-y-2">
              {KITS.map((k) => {
                const m = paybackMonths(k.cost, shift.nairaSavedPerMonth);
                return (
                  <li key={k.name} className="border border-line p-3">
                    <p className="flex justify-between text-sm font-semibold"><span>{k.name}</span><span className="font-mono text-lime">{formatNaira(k.cost)}</span></p>
                    <p className="mt-0.5 text-xs text-white/50">{k.spec}</p>
                    <p className="mt-1 font-mono text-xs text-mint">{isFinite(m) ? `Pays back in about ${m.toFixed(1)} months at this saving` : "Move the slider to see payback"}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-white/40">Kit prices are rough market estimates for planning only. Get a quote from a local installer before you buy.</p>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="border border-line bg-panel p-5">
            <h2 className="text-base font-bold">Appliance load calculator</h2>
            <p className="mt-1 text-xs text-white/50">Set quantity and hours per day. This is the load your inverter or solar must carry.</p>
            <div className="mt-3 space-y-2">
              {APPLIANCES.map((a) => {
                const v = picked[a.name] || { qty: 0, hours: 0 };
                const kwh = applianceKwh(a.watts, Number(v.hours) || 0, Number(v.qty) || 0);
                return (
                  <div key={a.name} className="flex items-center gap-2 border border-line px-3 py-2">
                    <span className="flex-1 text-sm">{a.name} <span className="font-mono text-xs text-white/40">{a.watts}W</span></span>
                    <label className="sr-only" htmlFor={`q-${a.name}`}>Quantity of {a.name}</label>
                    <input id={`q-${a.name}`} type="number" min="0" className="w-14 border border-line bg-ink px-2 py-1 font-mono text-xs" value={v.qty} onChange={(e) => setAppliance(a.name, "qty", e.target.value)} />
                    <span className="text-xs text-white/40">x</span>
                    <label className="sr-only" htmlFor={`h-${a.name}`}>Hours per day for {a.name}</label>
                    <input id={`h-${a.name}`} type="number" min="0" max="24" className="w-14 border border-line bg-ink px-2 py-1 font-mono text-xs" value={v.hours} onChange={(e) => setAppliance(a.name, "hours", e.target.value)} />
                    <span className="text-xs text-white/40">hrs</span>
                    <span className="w-20 text-right font-mono text-xs text-lime">{kwh.toFixed(2)} kWh</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-line pt-3 font-mono text-sm">
              <span>Total load: <span className="text-lime">{dailyKwh.toFixed(2)} kWh/day</span></span>
              <span>Grid cost: <span className="text-lime">{formatNaira(monthlyCost(dailyKwh, tariff))}/month</span></span>
            </div>
            <p className="mt-2 text-xs text-white/50">Rule of thumb: pick a battery that stores at least your daily kWh, and panels that can refill it in about 5 hours of good sun.</p>
          </section>

          <section className="border border-line bg-panel p-5">
            <h2 className="text-base font-bold">Prices and saving habits</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><label className={labelCls} htmlFor="fp">Fuel price (NGN / litre)</label><input id="fp" type="number" min="0" className={inputCls} value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value))} /></div>
              <div><label className={labelCls} htmlFor="tf">Grid tariff (NGN / kWh)</label><input id="tf" type="number" min="0" className={inputCls} value={tariff} onChange={(e) => setTariff(Number(e.target.value))} /></div>
            </div>
            <p className="mt-2 text-[11px] text-white/40">Update these when pump price or your band tariff changes. Everything recalculates at once.</p>
            <h3 className="mt-5 text-sm font-bold">Habits that cut fuel use <span className="font-mono text-xs text-lime">{doneTips.length}/{TIPS.length} done</span></h3>
            <ul className="mt-2 space-y-2">
              {TIPS.map((t, i) => {
                const done = doneTips.includes(i);
                return (
                  <li key={t}>
                    <button onClick={() => setDoneTips((p) => done ? p.filter((x) => x !== i) : [...p, i])} className={`flex w-full items-start gap-2 border p-3 text-left text-sm ${done ? "border-lime text-white/50 line-through" : "border-line hover:border-lime"}`} aria-pressed={done}>
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border font-mono text-[10px] ${done ? "border-lime bg-lime text-ink" : "border-white/40"}`}>{done ? "X" : ""}</span>
                      <span>{t}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className="mt-4 border border-line bg-panel p-5">
          <h2 className="text-base font-bold">How the numbers work</h2>
          <div className="mt-2 grid gap-3 text-sm leading-relaxed text-white/60 md:grid-cols-3">
            <p><span className="font-mono text-lime">01 COST</span><br />Fuel cost is litres times your pump price. Most small petrol generators burn 0.6 to 1.2 litres per hour, so a few hours daily adds up fast.</p>
            <p><span className="font-mono text-lime">02 EMISSIONS</span><br />Burning one litre of petrol releases about 2.31 kg of CO2. GenShift uses that factor so your monthly footprint is easy to see.</p>
            <p><span className="font-mono text-lime">03 PAYBACK</span><br />Payback is kit cost divided by monthly fuel saving. It is a planning guide, not a quote. Battery life and installer prices vary.</p>
          </div>
          <p className="mt-3 text-xs text-white/40">Your data stays on this device in local storage. Nothing is uploaded. Works offline after first load.</p>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 font-mono text-xs text-white/40">
          <span>GenShift NG - built for Nigerian homes</span>
          <span>React + Vite + Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}
