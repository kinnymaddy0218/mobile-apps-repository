/**
 * Formatting utilities for Indian mutual fund data display
 */

/**
 * Format number as Indian currency (₹)
 */
export function formatCurrency(value) {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format NAV value
 */
export function formatNAV(value) {
    if (value === null || value === undefined) return '—';
    return `₹${parseFloat(value).toFixed(4)}`;
}

/**
 * Format percentage with color indication
 */
export function formatPercent(value, decimals = 2) {
    if (value === null || value === undefined) return '—';
    const formatted = parseFloat(value).toFixed(decimals);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
}

/**
 * Format large numbers in Indian notation (Cr, Lakh)
 */
export function formatAUM(value) {
    if (value === null || value === undefined) return '—';
    const num = parseFloat(value);
    if (num >= 10000000) {
        return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
        return `₹${(num / 100000).toFixed(2)} L`;
    } else if (num >= 1000) {
        return `₹${(num / 1000).toFixed(2)} K`;
    }
    return formatCurrency(num);
}

/**
 * Format date from DD-MM-YYYY to readable format
 */
export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }
    return dateStr;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    
    // Check for Invalid Date
    if (isNaN(date.getTime())) {
        return '—';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Get CSS class name for positive/negative values
 */
export function getChangeClass(value) {
    if (value === null || value === undefined) return '';
    return parseFloat(value) >= 0 ? 'positive' : 'negative';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 40) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Format a metric value (handles null, infinity)
 */
export function formatMetric(value, decimals = 2) {
    if (value === null || value === undefined) return '—';
    if (!isFinite(value)) return '∞';
    return parseFloat(value).toFixed(decimals);
}
