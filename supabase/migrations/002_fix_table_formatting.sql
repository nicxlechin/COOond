-- Fix markdown table formatting in finalized plans
-- Removes blank lines between table rows so they render properly

-- Create a function to fix table formatting in a text string
CREATE OR REPLACE FUNCTION fix_table_formatting(content TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT := content;
BEGIN
  -- Remove blank lines between table rows (pipe at end, blank lines, pipe at start)
  -- Run multiple times to catch consecutive issues
  FOR i IN 1..5 LOOP
    result := regexp_replace(result, '\|\s*\n\s*\n+\s*\|', E'|\n|', 'g');
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update all finalized plans
UPDATE public.plans
SET finalized_content = (
  SELECT jsonb_object_agg(
    key,
    fix_table_formatting(value::text)
  )
  FROM jsonb_each_text(finalized_content)
)
WHERE finalized_content IS NOT NULL
  AND status = 'finalized';

-- Also fix generated_content for plans in review
UPDATE public.plans
SET generated_content = (
  SELECT jsonb_object_agg(
    key,
    fix_table_formatting(value::text)
  )
  FROM jsonb_each_text(generated_content)
)
WHERE generated_content IS NOT NULL
  AND status IN ('review', 'refining');

-- Drop the helper function
DROP FUNCTION fix_table_formatting(TEXT);
