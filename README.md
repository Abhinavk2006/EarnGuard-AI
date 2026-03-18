# EARNGUARD AI – Context-Aware Income Protection for Gig Workers

## Problem Statement

Gig workers such as delivery partners face frequent income loss due to external disruptions like extreme weather, pollution, and sudden local restrictions. These events reduce working hours and directly impact their earnings. Existing insurance systems do not provide dynamic and automated income protection.

## Target Persona

Urban food delivery partners (e.g., Swiggy/Zomato riders) operating in high-risk zones prone to weather disruptions.

## Proposed Solution

EARNGUARD AI is an AI-powered parametric insurance platform designed to protect gig workers from income loss. The system automatically detects disruption events and triggers payouts without requiring manual claims.

## Key Innovation

The system introduces an Income Loss Confidence Score (ILCS), which determines whether a worker has experienced a genuine loss of income.

ILCS is calculated using:

* Environmental data (weather, pollution)
* Demand patterns (drop in delivery requests)
* Worker activity validation (location and engagement)

This ensures that payouts are accurate and resistant to fraud.

## Core Features

### AI-Based Risk Assessment

* Dynamic weekly premium calculation
* Risk profiling based on location and historical conditions

### Intelligent Fraud Detection

* Detection of GPS spoofing
* Validation of worker activity
* Prevention of duplicate or false claims

### Parametric Automation

* Real-time monitoring of disruption events
* Automatic claim triggering
* Instant payout simulation

### Integration Capabilities

* Weather API (real or mock)
* Demand simulation API
* Payment gateway simulation (Razorpay/Stripe sandbox)

## Weekly Pricing Model

The platform follows a weekly subscription model aligned with gig workers’ earning cycles.

Example:

* Low-risk zone: ₹15/week
* Medium-risk zone: ₹25/week
* High-risk zone: ₹35/week

## Workflow

1. Worker registers and selects delivery category
2. System calculates weekly premium using AI-based risk scoring
3. Platform continuously monitors external disruptions and activity data
4. Income Loss Confidence Score is computed
5. If threshold is exceeded, claim is triggered automatically
6. Payout is processed instantly (simulated)

## Deliverables (Phase 1)

* Problem understanding and persona definition
* System architecture and workflow design
* Initial UI prototype
* AI logic design for ILCS

## Technology Stack

* Frontend: React or HTML/CSS
* Backend: Node.js or Django
* Database: MongoDB
* AI/ML: Python (rule-based or basic ML model)
* APIs: Weather API, mock demand APIs

## Future Scope

* Integration with real delivery platforms
* Advanced machine learning models for pricing
* Blockchain-based claim transparency
* Personalized insurance plans

## Team

Team Name: TEAM ONE
Team Lead: Balasrisabhari B
Team Members: Abhinav K, Prajeen S
