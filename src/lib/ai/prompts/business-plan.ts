import type { QuestionnaireResponses } from '@/lib/questionnaires/types';

export const BUSINESS_PLAN_SYSTEM_PROMPT = `You are a seasoned Chief Operating Officer and business strategist with 20+ years of experience helping startups and small businesses succeed. You've helped hundreds of first-time founders create actionable business plans.

Your task is to generate a comprehensive, actionable business plan based on the founder's questionnaire responses.

## Your Approach:
1. Be SPECIFIC and ACTIONABLE - avoid generic advice. Reference their actual business, industry, and situation.
2. Be REALISTIC - calibrate recommendations to their stage, resources, and experience level.
3. Be ENCOURAGING but HONEST - don't sugarcoat challenges, but frame them constructively.
4. Think like a mentor - explain the "why" behind recommendations.
5. Use CONCRETE EXAMPLES and NUMBERS wherever possible.

## Writing Style:
- Write in second person ("You should..." / "Your business...")
- Use simple, clear language - no jargon without explanation
- Break complex concepts into digestible pieces
- Include specific action items they can take immediately
- Format with clear headers, bullet points, and numbered lists for easy scanning

## Output Format:
You must return a valid JSON object with the structure specified in the user prompt. Each section should be a string containing well-formatted markdown.

CRITICAL JSON RULES:
- Return ONLY the JSON object, no other text
- Use double quotes for all strings
- Escape newlines as \\n within strings
- Escape quotes as \\" within strings
- Do NOT include actual line breaks inside string values
- Keep each section value as a single-line string with \\n for line breaks`;

export interface BusinessPlanContext {
  businessName: string;
  oneLiner: string;
  businessStage: string;
  industry: string;
  industryOther?: string;
  problem: string;
  solution: string;
  uniqueValue: string;
  targetCustomer: string;
  customerAcquisition: string;
  marketSize: string;
  revenueModel: string;
  pricing: string;
  unitEconomics?: string;
  goals12Months: string;
  fundingStatus: string;
  teamSize: string;
  biggestChallenge: string;
}

export function mapResponsesToBusinessPlanContext(
  responses: QuestionnaireResponses
): BusinessPlanContext {
  return {
    businessName: (responses.business_name as string) || '',
    oneLiner: (responses.one_liner as string) || '',
    businessStage: (responses.business_stage as string) || '',
    industry: (responses.industry as string) || '',
    industryOther: responses.industry_other as string | undefined,
    problem: (responses.problem as string) || '',
    solution: (responses.solution as string) || '',
    uniqueValue: (responses.unique_value as string) || '',
    targetCustomer: (responses.target_customer_description as string) || '',
    customerAcquisition: (responses.customer_acquisition_current as string) || '',
    marketSize: (responses.market_size_estimate as string) || '',
    revenueModel: (responses.revenue_model as string) || '',
    pricing: (responses.pricing as string) || '',
    unitEconomics: responses.unit_economics as string | undefined,
    goals12Months: (responses.goals_12_months as string) || '',
    fundingStatus: (responses.funding_status as string) || '',
    teamSize: (responses.team_size as string) || '',
    biggestChallenge: (responses.biggest_challenge as string) || '',
  };
}

export function buildBusinessPlanPrompt(context: BusinessPlanContext): string {
  const industry = context.industryOther || context.industry;

  return `## Founder's Business Information

**Business Name:** ${context.businessName}
**One-liner:** ${context.oneLiner}
**Stage:** ${context.businessStage}
**Industry:** ${industry}

**Problem they solve:**
${context.problem}

**Their solution:**
${context.solution}

**Unique value proposition:**
${context.uniqueValue}

**Target customer:**
${context.targetCustomer}

**Customer acquisition approach:** ${context.customerAcquisition}
**Market size estimate:** ${context.marketSize}

**Revenue model:** ${context.revenueModel}
**Pricing:** ${context.pricing}
${context.unitEconomics ? `**Unit economics:** ${context.unitEconomics}` : ''}

**12-month goals:**
${context.goals12Months}

**Funding:** ${context.fundingStatus}
**Team size:** ${context.teamSize}

**Biggest challenge:**
${context.biggestChallenge}

---

Based on this information, generate a comprehensive business plan with the following sections. Each section should be substantive (200-500 words) and highly specific to THIS business.

Return a JSON object with these exact keys:

{
  "executive_summary": "A compelling 2-3 paragraph summary of the entire business plan. Hook the reader, explain the opportunity, and summarize the key strategies. This should stand alone as a complete overview.",

  "problem_and_opportunity": "Deep dive into the problem. Include: market pain points, current alternatives and their limitations, the cost of the status quo, why this problem is worth solving NOW. Use specific examples relevant to their industry.",

  "solution_and_value_proposition": "Detailed explanation of how their solution works and why it's compelling. Include: key features/benefits (tied to pain points), unique differentiators, why customers will choose this over alternatives. Make the value concrete.",

  "target_market_analysis": "Comprehensive market analysis including: detailed customer persona, market size estimates (TAM/SAM/SOM with reasoning), market trends that favor this business, potential market segments to target first.",

  "competitive_analysis": "Honest assessment of the competitive landscape: direct competitors, indirect alternatives, their positioning strategy, sustainable competitive advantages, potential competitive responses to watch for.",

  "business_model": "Detailed breakdown of how they'll make money: revenue streams, pricing strategy analysis, unit economics (with assumptions), path to profitability, key financial metrics to track.",

  "go_to_market_strategy": "Initial GTM approach: launch strategy, first 100 customers plan, marketing channels to prioritize, messaging framework, early partnership opportunities. Be specific to their stage and resources.",

  "operations_plan": "Key operational considerations: core processes needed, technology/tools required, team structure (current and future), key vendors/partners, quality assurance approach.",

  "financial_projections": "Realistic financial outlook: key assumptions, 12-month revenue projection (with scenarios), major cost categories, funding needs assessment, key financial milestones.",

  "milestones_and_metrics": "Specific milestones for the next 12 months broken into quarters. Include: launch milestones, customer milestones, revenue milestones, product milestones, team milestones. Each milestone should be measurable.",

  "risks_and_mitigation": "Honest assessment of key risks: market risks, execution risks, competitive risks, financial risks. For each risk, provide specific mitigation strategies.",

  "immediate_action_items": "The 5-7 most important things they should do in the next 30 days. Make these extremely specific and actionable. Prioritize by impact."
}

Important: Return ONLY the JSON object, no additional text before or after.`;
}

export const BUSINESS_PLAN_SECTIONS = [
  { key: 'executive_summary', title: 'Executive Summary', icon: 'FileText' },
  { key: 'problem_and_opportunity', title: 'Problem & Opportunity', icon: 'AlertCircle' },
  { key: 'solution_and_value_proposition', title: 'Solution & Value Proposition', icon: 'Lightbulb' },
  { key: 'target_market_analysis', title: 'Target Market Analysis', icon: 'Users' },
  { key: 'competitive_analysis', title: 'Competitive Analysis', icon: 'Target' },
  { key: 'business_model', title: 'Business Model', icon: 'DollarSign' },
  { key: 'go_to_market_strategy', title: 'Go-to-Market Strategy', icon: 'Rocket' },
  { key: 'operations_plan', title: 'Operations Plan', icon: 'Settings' },
  { key: 'financial_projections', title: 'Financial Projections', icon: 'TrendingUp' },
  { key: 'milestones_and_metrics', title: 'Milestones & Metrics', icon: 'Flag' },
  { key: 'risks_and_mitigation', title: 'Risks & Mitigation', icon: 'Shield' },
  { key: 'immediate_action_items', title: 'Immediate Action Items', icon: 'CheckSquare' },
] as const;
