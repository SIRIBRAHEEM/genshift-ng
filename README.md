# GenShift NG

GenShift helps Nigerian homes see what their generator really costs, then plan a practical shift to inverter and solar power.

## What it does

- Daily log: generator hours, fuel litres and NEPA hours per day, saved on the device.
- Dashboard: total fuel, true fuel cost in naira, CO2 emissions and average generator hours.
- Shift planner: move a slider to cut generator hours and see monthly fuel, money and CO2 savings, plus payback time for three typical inverter and solar kits.
- Appliance load calculator: quantity and hours per appliance, total kWh per day and grid cost, to size a battery and panels.
- Saving habits checklist for cutting fuel use today.

## Run it

```bash
npm install
npm run dev
```

## Test it

```bash
npx vitest run
```

## Build it

```bash
npm run build
```

The build output in `dist/` is a static site. It works offline after first load because all data stays in local storage on the device. Nothing is uploaded.

## How the numbers work

- Fuel cost: litres times pump price (editable, default NGN 1,100 per litre).
- Emissions: 2.31 kg CO2 per litre of petrol burned.
- Payback: kit cost divided by monthly fuel saving. Kit prices are rough planning estimates, not quotes.

## Stack

React, Vite, Tailwind CSS, Vitest. No backend, no sign up.
