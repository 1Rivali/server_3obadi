export interface IsMetalizedResponse {
    filename: string
    is_metalized: boolean
    confidence: number
    processing_time_seconds: number
    details: Details
}

interface Details {
    metrics: Metrics
    decision_factors: DecisionFactors
}

interface Metrics {
    bright_ratio: number
    highlight_ratio: number
    contrast_score: number
    std_dev: number
    mean_brightness: number
    channel_correlation: number
}

interface DecisionFactors {
    has_reflections: boolean
    has_highlights: boolean
    reasonable_contrast: boolean
    has_texture: boolean
    not_too_bright: boolean
    good_variation: boolean
    is_metallic_tone: boolean
}
