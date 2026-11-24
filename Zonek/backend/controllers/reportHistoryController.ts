/**
 * reportHistoryController.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles fetching saved research reports for authenticated users.
 * GET /api/business-research/history       → last 20 report cards
 * GET /api/business-research/report/:id    → single full report
 * PATCH /api/business-research/report/:id/star → toggle star
 * DELETE /api/business-research/report/:id → delete report
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Request, Response } from 'express';
import supabase from '../lib/supabase';

// ─── GET /history ─────────────────────────────────────────────────────────────
export const getReportHistory = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { data, error } = await supabase
      .from('research_reports')
      .select(`
        id,
        report_title,
        business_type,
        location,
        budget_inr,
        verdict,
        firewall_violations,
        generation_time_ms,
        is_starred,
        pdf_url,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return res.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    console.error('getReportHistory error:', err.message ?? err);
    return res.status(500).json({ success: false, error: 'Failed to fetch report history' });
  }
};

// ─── GET /report/:id ──────────────────────────────────────────────────────────
export const getSingleReport = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { data, error } = await supabase
      .from('research_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)   // RLS: users can only access their own
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('getSingleReport error:', err.message ?? err);
    return res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
};

// ─── PATCH /report/:id/star ───────────────────────────────────────────────────
export const toggleStarReport = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    // First fetch current state
    const { data: existing, error: fetchErr } = await supabase
      .from('research_reports')
      .select('id, is_starred')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const { data, error } = await supabase
      .from('research_reports')
      .update({ is_starred: !existing.is_starred })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, is_starred')
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('toggleStarReport error:', err.message ?? err);
    return res.status(500).json({ success: false, error: 'Failed to update report' });
  }
};

// ─── DELETE /report/:id ───────────────────────────────────────────────────────
export const deleteReport = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { error } = await supabase
      .from('research_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return res.json({ success: true, message: 'Report deleted' });
  } catch (err: any) {
    console.error('deleteReport error:', err.message ?? err);
    return res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
};
