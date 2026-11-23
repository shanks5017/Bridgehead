import express from 'express';
import {
  generateBusinessPlan,
  generateFinancialProjections,
  generateCompetitiveAnalysis,
  generateMarketingStrategy,
  generateRoadmap,
  generateFullBusinessDocumentation,
} from '../controllers/businessResearchController';

const router = express.Router();

// Full comprehensive report (all skills combined)
router.post('/full-report', generateFullBusinessDocumentation);

// Individual skill endpoints (modular)
router.post('/business-plan', generateBusinessPlan);
router.post('/financial-projections', generateFinancialProjections);
router.post('/competitive-analysis', generateCompetitiveAnalysis);
router.post('/marketing-strategy', generateMarketingStrategy);
router.post('/roadmap', generateRoadmap);

export default router;
