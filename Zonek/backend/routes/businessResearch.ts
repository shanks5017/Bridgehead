import express from 'express';
import {
  generateBusinessPlan,
  generateFinancialProjections,
  generateCompetitiveAnalysis,
  generateMarketingStrategy,
  generateRoadmap,
  generateFullBusinessDocumentation,
} from '../controllers/businessResearchController';
import {
  getReportHistory,
  getSingleReport,
  toggleStarReport,
  deleteReport,
} from '../controllers/reportHistoryController';
import { auth, optionalAuth } from '../middleware/auth';

const router = express.Router();

// ─── Full comprehensive report (all skills combined) ─────────────────────────
// optionalAuth attaches req.userId if user is signed in
router.post('/full-report', optionalAuth, generateFullBusinessDocumentation);

// ─── Individual skill endpoints (modular) ────────────────────────────────────
router.post('/business-plan',          generateBusinessPlan);
router.post('/financial-projections',  generateFinancialProjections);
router.post('/competitive-analysis',   generateCompetitiveAnalysis);
router.post('/marketing-strategy',     generateMarketingStrategy);
router.post('/roadmap',                generateRoadmap);

// ─── Report History (authenticated) ─────────────────────────────────────────
router.get('/history',              auth, getReportHistory);
router.get('/report/:id',           auth, getSingleReport);
router.patch('/report/:id/star',    auth, toggleStarReport);
router.delete('/report/:id',        auth, deleteReport);

export default router;
