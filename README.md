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

---

## AI Decision Engine

EARNGUARD AI uses a hybrid AI-based decision system to determine genuine income loss and trigger payouts.

### 1. Income Loss Confidence Score (ILCS)

ILCS is calculated using a weighted model:

ILCS = f(Environmental Risk + Demand Drop + Worker Activity Score)

* Environmental Risk: Weather severity, pollution index
* Demand Drop: Reduction in delivery requests in that area
* Worker Activity Score: Actual movement and delivery attempts

If ILCS exceeds a defined threshold, the system automatically triggers a claim.

---

### 2. Worker Activity Verification (Fraud Prevention)

To ensure that a delivery partner is genuinely affected and not making false claims, the system validates:

* GPS Movement Tracking: Confirms whether the worker was active in delivery zones
* Route Consistency: Checks if the worker followed realistic delivery paths
* Order Interaction Logs: Verifies if delivery requests were accepted but not completed due to disruptions
* Idle vs Active Behavior: Differentiates between inactivity and forced downtime

---

### 3. Fraud Detection Logic

The system flags suspicious patterns such as:

* GPS spoofing or unrealistic jumps in location
* Claims without corresponding demand drop
* Repeated claims under normal conditions

Such cases are either rejected or sent for manual review.

---

## Delivery Verification Mechanism

To ensure that claims are valid, the system verifies whether the delivery partner genuinely attempted to work.

This is done using:

* GPS Tracking: Confirms movement within delivery zones
* Route Matching: Compares movement with expected delivery routes
* Order Interaction Data (mock/API): Checks if deliveries were accepted or attempted
* Time-Based Activity: Ensures activity during peak working hours

If the system detects no genuine work attempt, the claim is rejected.

---

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

---

## Weekly Pricing Model

The platform follows a weekly subscription model aligned with gig workers’ earning cycles.

Example:

* Low-risk zone: ₹15/week
* Medium-risk zone: ₹25/week
* High-risk zone: ₹35/week

---

## System Workflow

1. User Onboarding

   * Delivery partner registers and selects platform and location

2. Risk Profiling

   * AI analyzes historical data and assigns risk level
   * Weekly premium is calculated

3. Real-Time Monitoring

   * Tracks weather conditions, demand trends, and worker activity

4. Disruption Detection

   * Identifies events like heavy rain, pollution, or curfews
   * Confirms demand drop and reduced activity

5. AI Decision (ILCS Calculation)

   * Computes Income Loss Confidence Score
   * If threshold exceeded → claim triggered

6. Claim Processing

   * Validates worker activity and applies fraud checks

7. Instant Payout

   * Approved claims trigger immediate payout (simulated)

---

## Deliverables (Phase 1)

* Problem understanding and persona definition
* System architecture and workflow design
* Initial UI prototype
* AI logic design for ILCS

---

## Technology Stack

* Frontend: React or HTML/CSS
* Backend: Node.js or Django
* Database: MongoDB
* AI/ML: Python (rule-based or basic ML model)
* APIs: Weather API, mock demand APIs

---

## Future Scope

* Integration with real delivery platforms
* Advanced machine learning models for pricing
* Blockchain-based claim transparency
* Personalized insurance plans

---

## Team

* Team Name: Team One
* Team Lead: Balasrisabhari B
* Team Members: Abhinav K, Prajeen S
