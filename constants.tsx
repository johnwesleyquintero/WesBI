import React from 'react';

// --- Risk Score Calculation & Thresholds ---
export const RISK_SCORE_THRESHOLDS = {
    HIGH_RISK: 85,
    MEDIUM_RISK: 70,
};

export const RISK_SCORE_CONFIG = {
    MAX_SCORE: 100,
    AGE: {
        POINTS_365_PLUS: 40,
        POINTS_181_TO_365: 25,
        POINTS_91_TO_180: 15,
        THRESHOLD_365_PLUS: 365,
        THRESHOLD_181_PLUS: 180,
        THRESHOLD_91_PLUS: 90,
    },
    DAYS_OF_COVER: {
        POINTS_STRANDED: 40,
        POINTS_OVER_180: 35,
        POINTS_90_TO_180: 20,
        POINTS_60_TO_90: 10,
        THRESHOLD_180_DAYS: 180,
        THRESHOLD_90_DAYS: 90,
        THRESHOLD_60_DAYS: 60,
    },
    REMOVAL_RATIO: {
        POINTS_OVER_50_PERCENT: 20,
        POINTS_20_TO_50_PERCENT: 10,
        POINTS_10_TO_20_PERCENT: 5,
        THRESHOLD_50_PERCENT: 0.5,
        THRESHOLD_20_PERCENT: 0.2,
        THRESHOLD_10_PERCENT: 0.1,
    },
};

// --- Inventory & Performance ---
export const INVENTORY_AGE_WEIGHTS = {
    DAYS_0_TO_90: 45,
    DAYS_91_TO_180: 135,
    DAYS_181_TO_270: 225,
    DAYS_271_TO_365: 318,
    DAYS_365_PLUS: 400,
};

export const SELL_THROUGH_THRESHOLDS = {
    HOT_ITEM: 70,
};

export const VELOCITY_TREND_INDICATOR = {
    NEW_ITEM: 999,
};

// --- Logistics & Urgency ---
export const URGENCY_CONFIG = {
    COVERAGE_CRITICAL_DAYS: 2,
    COVERAGE_WARNING_DAYS: 5,
    URGENCY_SCORE_THRESHOLD: 0, // Positive score implies urgency
};

// --- Restock Forecasting ---
export const FORECAST_CONFIG = {
    SHIPMENT_QUANTITY_TIERS: [30, 50, 100, 150, 200, 250, 300, 400, 500],
    LARGE_SHIPMENT_ROUNDING_UNIT: 50,
    VELOCITY_TREND: {
        GROWTH_STRONG_THRESHOLD: 25,
        GROWTH_MODERATE_THRESHOLD: 10,
        DECLINE_STRONG_THRESHOLD: -25,
        DECLINE_MODERATE_THRESHOLD: -10,
        ADJUSTMENT_STRONG_GROWTH: 1.25,
        ADJUSTMENT_MODERATE_GROWTH: 1.1,
        ADJUSTMENT_STRONG_DECLINE: 0.75,
        ADJUSTMENT_MODERATE_DECLINE: 0.9,
    },
    SELL_THROUGH_SAFETY_STOCK: {
        HIGH_RATE_THRESHOLD: 75,
        LOW_RATE_THRESHOLD: 25,
        HIGH_RATE_MULTIPLIER: 1.5,
        LOW_RATE_MULTIPLIER: 0.5,
    }
};

// --- Stock Status Filtering ---
export const STOCK_STATUS_THRESHOLDS = {
    LOW_STOCK_DAYS: 30,
    HIGH_STOCK_DAYS: 180,
    STRANDED_HIGH_UNITS: 100,
};

// --- File Processing ---
export const FILE_PROCESSING_THRESHOLDS = {
    MAX_FILE_SIZE_MB: 5,
};