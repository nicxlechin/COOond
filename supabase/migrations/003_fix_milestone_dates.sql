-- Fix milestone dates to be relative to plan finalization date
-- Milestones should not have target_dates before the plan was finalized

-- Update milestones where target_date is before the plan's finalized_at
-- Shift them forward by the difference plus a small buffer
UPDATE public.milestones m
SET target_date = (
  SELECT
    p.finalized_at::date + (m.target_date - m.created_at::date) + INTERVAL '1 day'
  FROM public.plans p
  WHERE p.id = m.plan_id
    AND p.finalized_at IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM public.plans p
  WHERE p.id = m.plan_id
    AND p.finalized_at IS NOT NULL
    AND m.target_date < p.finalized_at::date
);

-- For any remaining milestones that are still in the past relative to finalized_at,
-- recalculate based on their position (priority and creation order)
UPDATE public.milestones m
SET target_date = (
  SELECT
    p.finalized_at::date + INTERVAL '7 days' * m.priority + INTERVAL '14 days' * (
      SELECT COUNT(*) FROM public.milestones m2
      WHERE m2.plan_id = m.plan_id
        AND m2.created_at < m.created_at
    )
  FROM public.plans p
  WHERE p.id = m.plan_id
    AND p.finalized_at IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM public.plans p
  WHERE p.id = m.plan_id
    AND p.finalized_at IS NOT NULL
    AND m.target_date < p.finalized_at::date
);
