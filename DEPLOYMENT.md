# Deployment Workflow

Canonical workflow for this repository:

Development -> GitHub -> Vercel Preview/Review -> Human Verification -> Stable

## Current baseline

Build 0.7.3 — Meeting Orchestration & Decision Brief Bridge V1

## Governance

- Preview deployments are for human review before stabilization.
- A preview deployment does not imply product approval.
- AI candidates, briefs, transcripts, and agenda items do not create organizational authority.
- Only explicit authorized human confirmation may create canonical organizational decisions.

## Vercel

This project is deployable as a Node web service. `npm start` launches `server.js` and the health endpoint is `/api/v1/health`.
