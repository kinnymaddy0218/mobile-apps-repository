// lib/amc-config.js

export const AMC_CONFIG = {
    'SBI Mutual Fund': {
        searchKeyword: 'SBI Mutual Fund monthly factsheet',
        downloadPage: 'https://www.sbimf.com/en-us/investor-corner/investor-services/factsheets',
        selectors: {
            pdfLink: 'a[href*="February-2026"]',
            pdfLinkAlt: 'a[href*="february-2026"]'
        },
        directUrl: 'https://www.sbimf.com/docs/default-source/scheme-factsheets/all-sbimf-schemes-factsheet-february-2026.pdf'
    },
    'HDFC Mutual Fund': {
        searchKeyword: 'HDFC Mutual Fund monthly factsheet',
        downloadPage: 'https://www.hdfcfund.com/investor-services/fund-factsheets',
        selectors: {
            pdfLink: 'a[href$=".pdf"]'
        },
        searchKeywords: ['Factsheet', 'portfolio', 'monthly'],
        pdfSelector: 'a[href*="Factsheet"]',
        localFile: 'HDFC MF Factsheet - February 2026.pdf'
    },
    'HDFC Index Solutions': {
        searchKeyword: 'HDFC Mutual Fund index solutions factsheet',
        downloadPage: 'https://www.hdfcfund.com/investor-services/fund-factsheets',
        selectors: {
            pdfLink: 'a[href$=".pdf"]'
        },
        localFile: 'HDFC MF Index Solutions Factsheet - February 2026.pdf'
    },
    'Nippon India Mutual Fund': {
        searchKeyword: 'Nippon India Mutual Fund monthly factsheet',
        downloadPage: 'https://mf.nipponindiaim.com/InvestorServices/Pages/Factsheets.aspx',
        selectors: {
            pdfLink: 'a[href*="Nippon-FS"]'
        },
        directUrl: 'https://mf.nipponindiaim.com/InvestorServices/FactSheets/Nippon-FS-Feb-2026.pdf'
    },
    'ICICI Prudential Mutual Fund': {
        searchKeyword: 'ICICI Prudential Mutual Fund monthly factsheet',
        downloadPage: 'https://www.icicipruamc.com/investor-services/factsheet',
        selectors: {
            pdfLink: 'a[href$=".pdf"]'
        },
        directUrl: 'https://www.icicipruamc.com/blob/knowledgecentre/factsheet-complete/Complete.pdf'
    },
    'Kotak Mutual Fund': {
        searchKeyword: 'Kotak Mutual Fund monthly factsheet',
        downloadPage: 'https://www.kotakmf.com/investor-services/factsheets',
        selectors: {
            pdfLink: 'a[href*="February-2026"], a[href*="Feb-2026"]'
        },
        directUrl: 'https://www.kotakmf.com/factsheet/feb_2026/Kotak%20MF%20Factsheet%20February%202026.pdf'
    },
    'Quant Mutual Fund': {
        searchKeyword: 'Quant Mutual Fund monthly factsheet',
        downloadPage: 'https://quantmutual.com/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href*="Factsheet"][href$=".pdf"]'
        },
        directUrl: 'https://quantmutual.com/Admin/Factsheet/quant_Factsheet_February_2026.pdf'
    },
    'Axis Mutual Fund': {
        searchKeyword: 'Axis Mutual Fund monthly factsheet',
        downloadPage: 'https://www.axismf.com/investor-services/factsheets',
        selectors: {
            pdfLink: 'a[href$=".pdf"]'
        },
        directUrl: 'https://www.axismf.com/docs/default-source/monthly-factsheet/monthly-factsheet---february-2026.pdf',
        localFile: 'Axis Fund Factsheet February 2026.pdf'
    },
    'Mirae Asset Mutual Fund': {
        searchKeyword: 'Mirae Asset Mutual Fund monthly factsheet',
        downloadPage: 'https://www.miraeassetmf.co.in/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href$=".pdf"]'
        },
        localFile: 'mirae_active-factsheet---march-2026.pdf'
    },
    'Mirae Asset Index Solutions': {
        searchKeyword: 'Mirae Asset Passive Mutal Fund monthly factsheet',
        downloadPage: 'https://www.miraeassetmf.co.in/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href$=".pdf"]'
        },
        localFile: 'mirae_passive-factsheet---march-2026.pdf'
    },
    'UTI Mutual Fund': {
        searchKeyword: 'UTI Mutual Fund monthly factsheet',
        downloadPage: 'https://www.utimf.com/downloads/factsheets/',
        selectors: {
            pdfLink: 'a[href*="February-2026"]'
        },
        directUrl: 'https://www.utimf.com/-/media/uti-mutual-fund/forms-and-downloads/statutory-disclosures/monthly-factsheet/uti-mf-monthly-factsheet-february-2026.pdf'
    },
    'Tata Mutual Fund': {
        searchKeyword: 'Tata Mutual Fund monthly factsheet',
        downloadPage: 'https://www.tatamutualfund.com/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href*="Feb-2026"], a[href*="Factsheet"][href$=".pdf"]'
        },
        directUrl: 'https://betacms.tatamutualfund.com/system/files/2026-03/TataMF%20Factsheet%20-%20February%202026.pdf'
    },
    'Aditya Birla Sun Life Mutual Fund': {
        searchKeyword: 'Aditya Birla Sun Life Mutual Fund monthly factsheet',
        downloadPage: 'https://mutualfund.adityabirlacapital.com/investor-services/factsheets',
        selectors: {
            pdfLink: 'a[href*="feb26"], a[href*="Feb_2026"]'
        },
        directUrl: 'https://mutualfund.adityabirlacapital.com/-/media/bsl/files/resources/factsheets/2026/abslmf-empower_feb26.pdf'
    },
    'Motilal Oswal Mutual Fund': {
        searchKeyword: 'Motilal Oswal Mutual Fund monthly factsheet',
        downloadPage: 'https://www.motilaloswalmf.com/download-section/fact-sheets',
        selectors: {
            pdfLink: 'a[href*="factsheet"][href$=".pdf"]'
        },
        directUrl: 'https://www.motilaloswalmf.com/CMS/assets/uploads/Documents/9618a-most-factsheet-february-2026-active_.pdf'
    },
    'Invesco Mutual Fund': {
        searchKeyword: 'Invesco Mutual Fund monthly factsheet',
        downloadPage: 'https://www.invescomutualfund.com/knowledge-center/factsheets',
        selector: 'a[href$=".pdf"]',
        directUrl: 'https://invescomutualfund.com/docs/default-source/factsheet/invesco-mf-factsheet---february-2026.pdf?sfvrsn=e9389ac2_0'
    },
    'Edelweiss Mutual Fund': {
        searchKeyword: 'Edelweiss Mutual Fund monthly factsheet',
        downloadPage: 'https://www.edelweissmf.com/investor-service/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href*="Factsheet"][href$=".pdf"]'
        },
        directUrl: 'https://www.edelweissmf.com/Files/downloads/FACTSHEETS/FACTSHEETS/2026/Feb/published/Edelweiss_Factsheet_February-2026_10022026_060633_PM.pdf'
    },
    'Groww Mutual Fund': {
        searchKeyword: 'Groww Mutual Fund monthly factsheet',
        downloadPage: 'https://www.growwmf.in/statutory-disclosures',
        selectors: {
            pdfLink: 'a[href*="Feb%202026"]'
        },
        directUrl: 'https://assets-netstorage.growwmf.in/compliance_docs/Downloads/Fact%20Sheet/2025%20-%202026/Monthly%20Factsheet%20-%20Feb%202026.pdf'
    },
    'Zerodha Mutual Fund': {
        searchKeyword: 'Zerodha Mutual Fund monthly factsheet',
        downloadPage: 'https://www.zerodhamf.in/statutory-disclosures',
        selectors: {
            pdfLink: 'a[href*="Jan%2026"]'
        },
        directUrl: 'https://assets.zerodhafundhouse.com/offer-documents/factsheet/Factsheet%20-%20Jan%2026.pdf'
    },
    'HSBC Mutual Fund': {
        searchKeyword: 'HSBC Mutual Fund monthly factsheet',
        downloadPage: 'https://www.assetmanagement.hsbc.co.in/en/individual/investor-resources/fund-factsheets',
        selectors: {
            pdfLink: 'a[href*="february-2026"]'
        },
        directUrl: 'https://www.assetmanagement.hsbc.co.in/assets/documents/mutual-funds/en/576d57f7-50a6-4faf-a822-53bb68387391/the-asset-february-2026.pdf'
    },
    'PPFAS Mutual Fund': {
        searchKeyword: 'Parag Parikh Mutual Fund monthly factsheet',
        downloadPage: 'https://amc.ppfas.com/downloads/factsheet/',
        selectors: {
            pdfLink: 'a[href*=".pdf"]'
        }
    },
    'Bandhan Mutual Fund': {
        searchKeyword: 'Bandhan Mutual Fund monthly factsheet',
        downloadPage: 'https://bandhanmutual.com/download-center',
        selectors: {
            pdfLink: 'a[href*="Factsheet"][href$=".pdf"]'
        },
        directUrl: 'https://bandhanmutual.com/download/factsheet/February_2026.pdf',
        localFile: 'bandhan-factsheet-feb-2026.pdf'
    },
    'Bandhan Index Solutions': {
        searchKeyword: 'Bandhan Mutual Fund passive factsheet',
        downloadPage: 'https://www.bandhanmutual.com/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href*=".pdf"]'
        },
        localFile: 'bandhan-passive-factsheet-feb-2026.pdf'
    },
    "LIC Mutual Fund": {
        searchKeyword: 'LIC Mutual Fund monthly factsheet',
        downloadPage: 'https://www.licmf.com/downloads/factsheet',
        selectors: {
            pdfLink: 'a[href*="february-2026"]'
        },
        directUrl: 'https://www.licmf.com/assets/downloads/monthly_fact_sheet/2025-2026/03/lic-mf-factsheet-28th-february-2026-694319281.pdf'
    },
    "White Oak Capital Mutual Fund": {
        searchKeyword: 'White Oak Capital Mutual Fund monthly factsheet',
        downloadPage: 'https://whiteoakcapitalamc.com/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href*="Feb_2026"]'
        },
        directUrl: 'https://content.whiteoakamc.com/Whiteoak_Capital_Factsheet_as_at_Feb_2026_22d61a48d5.pdf'
    },
    "DSP Mutual Fund": {
        searchKeyword: 'DSP Mutual Fund monthly factsheet',
        downloadPage: 'https://www.dspim.com/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href*="factsheet"][href$=".pdf"]'
        },
        directUrl: 'https://www.dspim.com/downloads/dsp-factsheet-february-2026.pdf'
    },
    "Canara Robeco Mutual Fund": {
        searchKeyword: 'Canara Robeco Mutual Fund monthly factsheet',
        downloadPage: 'https://www.canararobeco.com/downloads/factsheets',
        selectors: {
            pdfLink: 'a[href*="February-2026"]'
        }
    }
};

export function getAMCFromFundName(fundName) {
    if (!fundName) return null;
    const lower = fundName.toLowerCase();
    
    if (lower.includes('sbi')) return 'SBI Mutual Fund';
    if (lower.includes('hdfc')) {
        if (lower.includes('index') || lower.includes('passive') || lower.includes('nifty') || lower.includes('sensex') || lower.includes('etf')) {
            return 'HDFC Index Solutions';
        }
        return 'HDFC Mutual Fund';
    }
    if (lower.includes('nippon')) return 'Nippon India Mutual Fund';
    if (lower.includes('icici')) return 'ICICI Prudential Mutual Fund';
    if (lower.includes('kotak')) return 'Kotak Mutual Fund';
    if (lower.includes('quant')) return 'Quant Mutual Fund';
    if (lower.includes('axis')) return 'Axis Mutual Fund';
    if (lower.includes('mirae')) {
        if (lower.includes('index') || lower.includes('passive') || lower.includes('nifty') || lower.includes('etf')) {
            return 'Mirae Asset Index Solutions';
        }
        return 'Mirae Asset Mutual Fund';
    }
    if (lower.includes('uti')) return 'UTI Mutual Fund';
    if (lower.includes('tata')) return 'Tata Mutual Fund';
    if (lower.includes('aditya') || lower.includes('absl') || lower.includes('birla')) return 'Aditya Birla Sun Life Mutual Fund';
    if (lower.includes('motilal') || lower.includes('mosl')) return 'Motilal Oswal Mutual Fund';
    if (lower.includes('parag parikh') || lower.includes('ppfas')) return 'PPFAS Mutual Fund';
    if (lower.includes('dsp')) return 'DSP Mutual Fund';
    if (lower.includes('canara')) return 'Canara Robeco Mutual Fund';
    if (lower.includes('bandhan') || lower.includes('idfc')) {
        if (lower.includes('index') || lower.includes('passive') || lower.includes('nifty') || lower.includes('etf')) {
            return 'Bandhan Index Solutions';
        }
        return 'Bandhan Mutual Fund';
    }
    if (lower.includes('invesco')) return 'Invesco Mutual Fund';
    if (lower.includes('edelweiss')) return 'Edelweiss Mutual Fund';
    if (lower.includes('groww')) return 'Groww Mutual Fund';
    if (lower.includes('zerodha')) return 'Zerodha Mutual Fund';
    if (lower.includes('hsbc')) return 'HSBC Mutual Fund';
    if (lower.includes('lic')) return 'LIC Mutual Fund';
    if (lower.includes('white oak')) return 'White Oak Capital Mutual Fund';
    
    return null;
}
