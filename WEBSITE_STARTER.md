# 🚀 MF Research India — Website Starter Guide

## Quick Start (2 steps)

### Step 1: Open Terminal
Open **PowerShell** or **Command Prompt** and run:
```bash
cd c:\Users\maddy\OneDrive\Documents\Antigravity\mf-research
npm run dev
```

### Step 2: Open Browser
Go to **http://localhost:3000**

That's it! 🎉

---

## Commands Reference

| Action | Command |
|--------|---------|
| **Start the server** | `npm run dev` |
| **Stop the server** | `Ctrl + C` in terminal |
| **Restart the server** | `Ctrl + C` → then `npm run dev` |
| **Install dependencies** (first time or after pulling updates) | `npm install` |

---

## Pages

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000 |
| Search Funds | http://localhost:3000/search |
| Fund Detail | http://localhost:3000/fund/{schemeCode} |
| Compare Funds | http://localhost:3000/compare |
| Categories | http://localhost:3000/categories |
| MF News | http://localhost:3000/news |
| Watchlist | http://localhost:3000/watchlist |
| Sign In | http://localhost:3000/login |
| Sign Up | http://localhost:3000/signup |

---

## Notes

- **First load** takes ~30 seconds (fetching live data for 111+ funds). After that, data is cached for 30 minutes.
- **Sign in** is only required for the Watchlist feature. Everything else works without it.
- **Firebase project:** `mf-research-india-b9c14`
- **Tech stack:** Next.js 14, Firebase Auth/Firestore, Chart.js, MFAPI.in
