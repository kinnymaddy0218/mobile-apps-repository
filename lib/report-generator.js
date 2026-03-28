/**
 * Portfolio Analysis Markdown Generator
 * Generates a high-fidelity, layman-friendly report for portfolio documentation.
 */

export function generateMarketImpactMD(metrics, userProfile = {}) {
    const {
        weightedAlpha = 0,
        weightedBeta = 1,
        totalValuation = 0,
        funds = [],
        categoryMix = {},
        investmentHorizon = 5,
        riskAppetite = 'Moderate',
        scenario = { name: 'India GDP Growth Data (Q3 FY25)', shock: -2.00 }
    } = metrics;

    const projectedDelta = scenario.shock * weightedBeta;
    const date = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `# ⚡ AlphaEngine Deep Analysis
*Generated on ${date}*

## 📝 Layman's Executive Summary
This report analyzes how your portfolio reacts to market changes. Think of your portfolio as a car:
- **Speed (Alpha):** How much extra profit you're making compared to a basic index. Your current "extra speed" is **${weightedAlpha.toFixed(2)}%**.
- **Brakes (Beta):** How much you'll slide when the market hits a bump. A Beta of **${weightedBeta.toFixed(2)}x** means you move ${weightedBeta < 1 ? 'less' : 'more'} than the market.
- **The Verdict:** In the event of **${scenario.name}**, your money is expected to ${projectedDelta < 0 ? 'dip' : 'rise'} by **${Math.abs(projectedDelta).toFixed(2)}%**. ${weightedBeta < 1 ? 'You have good cushions in place.' : 'You are driving fast; expect some bumps.'}

---

## 📊 Portfolio Snapshot
| Data Point | Value |
| :--- | :--- |
| **Total Assets** | ₹${totalValuation.toLocaleString('en-IN')} |
| **Risk DNA** | ${riskAppetite} |
| **Time Horizon** | ${investmentHorizon} Years |
| **Overall Sensitivity** | ${weightedBeta.toFixed(2)}x |

### 🏆 Top Holdings Allocation
${funds.slice(0, 5).map(f => `- **${f.schemeName}:** ${f.weight.toFixed(1)}% (${f.category})`).join('\n')}

---

## 🌩️ Market Stress Test (${scenario.name})
In a scenario where the **${scenario.name}** triggers a **${scenario.shock.toFixed(2)}%** shock:

- **Portfolio Sensitivity:** ${weightedBeta.toFixed(2)}x
- **Projected Impact:** **${projectedDelta.toFixed(2)}%**
- **Mental Note:** ${
    weightedBeta > 1.1 
    ? "Your strategy is aggressive. Rallies feel great, but dips will be sharper. Stay calm during volatility."
    : weightedBeta < 0.9
    ? "Your strategy is defensive. You will significantly outperform the market during crashes by losing much less."
    : "Your strategy is balanced. You will move in lock-step with the general economy."
}

- **Portfolio Sensitivity:** ${weightedBeta.toFixed(2)}x
- **Projected Impact:** **${projectedDelta.toFixed(2)}%**
- **Mental Note:** ${
    weightedBeta > 1.1 
    ? "Your strategy is aggressive. Rallies feel great, but dips will be sharper. Stay calm during volatility."
    : weightedBeta < 0.9
    ? "Your strategy is defensive. You will significantly outperform the market during crashes by losing much less."
    : "Your strategy is balanced. You will move in lock-step with the general economy."
}

---

## 🎯 Strategic Rebalancing roadmap
Based on your **${riskAppetite}** profile:

1. **Current Alignment:** Your portfolio is currently ${Math.abs(weightedBeta - 1.0) < 0.2 ? 'well-aligned' : 'drifting'} from the standard benchmark.
2. **Tactical Suggestion:** ${
    weightedBeta > 1.2 ? "Consider moving 10-15% into Liquid/Debt funds to create a safety buffer." :
    weightedAlpha < 1.0 ? "Consider swapping your lowest Alpha performers for high-conviction momentum funds." :
    "Maintain your current core holdings; your efficiency ratio is optimal."
}
3. **Smart Swap Idea:** ${weightedBeta > 1.2 ? "HDFC Liquid Fund / SBI Conservative Hybrid" : "Quant Small Cap / ICICI Pru Bluechip"}

---

> [!IMPORTANT]
> This analysis is based on 3-year historical volatility patterns (Beta). Past performance does not guarantee future results, but it provides a high-probability roadmap of how your capital reacts to market stress.
`;
}
