import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const supabase = await createClient();

    // Verify user owns this plan
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify plan exists and belongs to user
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Delete related records first (cascade manually for safety)
    // Delete milestones
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('milestones') as any)
      .delete()
      .eq('plan_id', planId);

    // Delete check-ins
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('check_ins') as any)
      .delete()
      .eq('plan_id', planId);

    // Delete refinements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('refinements') as any)
      .delete()
      .eq('plan_id', planId);

    // Delete questionnaire progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('questionnaire_progress') as any)
      .delete()
      .eq('plan_id', planId);

    // Finally delete the plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase.from('plans') as any)
      .delete()
      .eq('id', planId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
