# 🧠 AlphaEngine: Portfolio Intelligence Guide

This document explains the logic, mathematics, and strategic reasoning behind the **Market Impact Analysis** suite.

## 0. UI Design Concept
The system uses a **Bento Strip (Horizontal)** layout to ensure maximum information density without whitespace. This ensures that the professional metrics are always presented in a premium, structured way.

## 1. The Core Equation
The system calculates potential drawdowns using the **Beta-Shock Model**:
> **Projected Impact (%) = Portfolio Beta × Scenario Shock (%)**

- **Portfolio Beta:** The weighted sensitivity of all your holdings compared to the Nifty 50 (3-year rolling window).
- **Scenario Shock:** A predetermined volatility magnitude based on historical precedents (e.g., -3.5% for geopolitical crises).

---

## 2. Dynamic Scenarios (Stress Tests)
The system currently simulates four primary macroeconomic events:

| Event ID | Scenario Name | Shock Magnitude | Risk Severity |
| :--- | :--- | :--- | :--- |
| `gdp` | India GDP Growth Data | -2.00% | Moderate |
| `west-asia` | West Asia Crisis (Oil/Gas) | -3.50% | High |
| `fed-hike` | US Fed Interest Rate Hike | -1.50% | Medium |
| `tech-correction`| Global Tech Correction | -4.00% | Critical |

---

## 3. Strategic Advisory Logic
The "Strategic Guidance" and "Advisory" sections follow these heuristic rules:

### A. Sensitivity Assessment
- **Beta > 1.1 (Aggressive):** High sensitivity. Gains are amplified in rallies, but drawdowns are sharper.
- **Beta < 0.9 (Safe):** Defensive cushion. Portfolio loses significantly less than the market during crashes.
- **0.9 ≤ Beta ≤ 1.1 (Balanced):** Portfolio moves in lock-step with the general economy.

### B. Actionable Recommendations
- **Critical Risk Alert:** Triggered if `Projected Impact > 4%`.
- **Hedge Suggestion:** If Beta is > 1.2 during a high-severity scenario, the system suggests a **12-15% shift into Liquid/Debt funds**.
- **Alpha Swap:** If Beta is low but Alpha (excess return) is also low, it suggests swapping for "Alpha Funds" to improve efficiency.

---

## 4. Layman's Metaphor: The Car Analogy
To make these professional metrics accessible, we use the **Car Engine** metaphor:
- **Alpha (Speed):** How much faster you are than the "Traffic" (Index).
- **Beta (Brakes/Suspension):** How much you feel the "Bumps" (Market Dips) in the road.
- **Simulation (Stress Test):** Testing how the car handles a "Sudden Pothole" (Economic Shock).

---

> [!NOTE]
> These instructions are stored for transparency. The logic is executed in `app/portfolio/page.js` using `useMemo` for real-time responsiveness.
