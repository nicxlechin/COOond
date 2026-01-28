import type { QuestionnaireResponses } from '@/lib/questionnaires/types';

export const BUSINESS_PLAN_SECTIONS = [
  { key: 'executive_summary', title: 'Executive Summary', icon: 'FileText' },
  { key: 'market_opportunity', title: 'Market Opportunity', icon: 'TrendingUp' },
  { key: 'problem_analysis', title: 'Problem Analysis', icon: 'AlertCircle' },
  { key: 'solution_value_prop', title: 'Solution & Value Proposition', icon: 'Lightbulb' },
  { key: 'business_model', title: 'Business Model', icon: 'DollarSign' },
  { key: 'go_to_market', title: 'Go-to-Market Strategy', icon: 'Rocket' },
  { key: 'competitive_analysis', title: 'Competitive Analysis', icon: 'Target' },
  { key: 'traction_milestones', title: 'Traction & Milestones', icon: 'Flag' },
  { key: 'financial_projections', title: 'Financial Projections', icon: 'BarChart' },
  { key: 'team_section', title: 'Team', icon: 'Users' },
  { key: 'risks_mitigation', title: 'Risks & Mitigation', icon: 'Shield' },
  { key: 'action_plan', title: '90-Day Action Plan', icon: 'CheckSquare' },
] as const;

export const BUSINESS_PLAN_SYSTEM_PROMPT = `You are an experienced business strategist and mentor who has helped hundreds of entrepreneurs build successful businesses - from solo lifestyle businesses to venture-backed startups. You adapt your advice to what the founder actually needs, not what sounds impressive.

Your task is to generate a practical, actionable business plan tailored to the founder's specific goals, stage, and ambitions.

## Your Approach - ADAPT TO THE FOUNDER:
1. **Match their ambition level** - If they want a lifestyle business doing $200K/year, help them build that. If they want to raise VC and scale to $100M, help them with that. Don't assume everyone wants to be the next unicorn.
2. **Be practical first** - Give advice they can actually execute with their current resources and constraints.
3. **Be honest and direct** - If something won't work, say so. If they're being unrealistic, gently push back with alternatives.
4. **Focus on fundamentals** - Revenue, customers, product-market fit, sustainable growth. Not buzzwords.
5. **Provide clear next steps** - Every section should end with specific actions they can take this week.

## Calibrate Your Advice Based On:
- **Funding status**: Bootstrapped? Give capital-efficient strategies. Seeking VC? Include investor-ready metrics.
- **Business stage**: Idea stage needs validation steps. Growth stage needs scaling strategies.
- **Revenue goals**: $50K/year needs different advice than $5M/year.
- **Team size**: Solo founder gets different ops advice than a team of 10.

## Writing Style:
- Write like a smart mentor having coffee with the founder - warm but direct
- Use clear, simple language - explain concepts if needed
- Be specific with numbers and timelines
- Include examples and "try this" suggestions
- Avoid unnecessary jargon - if you use a business term, make sure it adds value

## Formatting Rules:
- Use ## for major section headers
- Use ### for subsections
- Use **bold** for key metrics and important terms
- Use bullet points for actionable lists
- Use numbered lists for step-by-step processes
- Include > blockquotes for key insights or important warnings

## Quality Bar:
This plan should:
- Feel personally relevant to THIS founder's situation
- Have at least 5 specific actions they can take immediately
- Be realistic about challenges while remaining encouraging
- Scale appropriately to their goals (not everyone needs a 50-page VC deck)

CRITICAL JSON RULES:
- Return ONLY valid JSON, no other text
- Use double quotes for all strings
- For line breaks in content, use the literal characters \\n
- Each section value should be a markdown-formatted string`;

export interface BusinessPlanContext {
  businessName: string;
  oneLiner: string;
  visionStatement: string;
  businessStage: string;
  industry: string;
  industryOther?: string;
  problem: string;
  problemSeverity: string;
  currentAlternatives: string;
  solution: string;
  uniqueValue: string;
  keyDifferentiators: string[];
  targetCustomer: string;
  customerSegments: string;
  tamSamSom: string;
  marketTrends: string;
  customerAcquisition: string[];
  cacEstimate?: string;
  revenueModel: string;
  pricingStrategy: string;
  ltvEstimate?: string;
  grossMargin: string;
  revenueGoal12m: string;
  revenueGoal36m: string;
  pathToProfitability: string;
  competitors: string;
  competitivePositioning: string;
  moat: string[];
  goToMarket: string;
  foundingTeam: string;
  teamSize: string;
  keyHires?: string;
  fundingStatus: string;
  fundingNeeds?: string;
  biggestChallenges: string;
}

export function mapResponsesToBusinessPlanContext(
  responses: QuestionnaireResponses
): BusinessPlanContext {
  return {
    businessName: (responses.business_name as string) || 'Unnamed Company',
    oneLiner: (responses.one_liner as string) || '',
    visionStatement: (responses.vision_statement as string) || '',
    businessStage: (responses.business_stage as string) || '',
    industry: (responses.industry as string) || '',
    industryOther: responses.industry_other as string | undefined,
    problem: (responses.problem as string) || '',
    problemSeverity: (responses.problem_severity as string) || '',
    currentAlternatives: (responses.current_alternatives as string) || '',
    solution: (responses.solution as string) || '',
    uniqueValue: (responses.unique_value as string) || '',
    keyDifferentiators: (responses.key_differentiators as string[]) || [],
    targetCustomer: (responses.target_customer as string) || '',
    customerSegments: (responses.customer_segments as string) || '',
    tamSamSom: (responses.tam_sam_som as string) || '',
    marketTrends: (responses.market_trends as string) || '',
    customerAcquisition: (responses.customer_acquisition as string[]) || [],
    cacEstimate: responses.cac_estimate as string | undefined,
    revenueModel: (responses.revenue_model as string) || '',
    pricingStrategy: (responses.pricing_strategy as string) || '',
    ltvEstimate: responses.ltv_estimate as string | undefined,
    grossMargin: (responses.gross_margin as string) || '',
    revenueGoal12m: (responses.revenue_goal_12m as string) || '',
    revenueGoal36m: (responses.revenue_goal_36m as string) || '',
    pathToProfitability: (responses.path_to_profitability as string) || '',
    competitors: (responses.competitors as string) || '',
    competitivePositioning: (responses.competitive_positioning as string) || '',
    moat: (responses.moat as string[]) || [],
    goToMarket: (responses.go_to_market as string) || '',
    foundingTeam: (responses.founding_team as string) || '',
    teamSize: (responses.team_size as string) || '',
    keyHires: responses.key_hires as string | undefined,
    fundingStatus: (responses.funding_status as string) || '',
    fundingNeeds: responses.funding_needs as string | undefined,
    biggestChallenges: (responses.biggest_challenges as string) || '',
  };
}

export function buildBusinessPlanPrompt(context: BusinessPlanContext): string {
  const industry = context.industry === 'other' ? context.industryOther : context.industry;

  return `Generate a comprehensive, investor-ready business plan for the following company.

## COMPANY INFORMATION

**Company Name:** ${context.businessName}
**One-Liner:** ${context.oneLiner}
**5-Year Vision:** ${context.visionStatement}
**Stage:** ${context.businessStage}
**Industry:** ${industry}

## PROBLEM & SOLUTION

**Problem Statement:** ${context.problem}
**Problem Severity:** ${context.problemSeverity}
**Current Alternatives:** ${context.currentAlternatives}
**Our Solution:** ${context.solution}
**Unfair Advantage:** ${context.uniqueValue}
**Key Differentiators:** ${context.keyDifferentiators.join(', ')}

## MARKET & CUSTOMER

**Target Customer:** ${context.targetCustomer}
**Customer Segments:** ${context.customerSegments}
**Market Size (TAM/SAM/SOM):** ${context.tamSamSom}
**Market Trends:** ${context.marketTrends}
**Acquisition Channels:** ${context.customerAcquisition.join(', ')}
${context.cacEstimate ? `**Estimated CAC:** ${context.cacEstimate}` : ''}

## BUSINESS MODEL

**Revenue Model:** ${context.revenueModel}
**Pricing Strategy:** ${context.pricingStrategy}
${context.ltvEstimate ? `**Estimated LTV:** ${context.ltvEstimate}` : ''}
**Gross Margin:** ${context.grossMargin}
**12-Month Revenue Goal:** ${context.revenueGoal12m}
**36-Month Revenue Goal:** ${context.revenueGoal36m}
**Path to Profitability:** ${context.pathToProfitability}

## COMPETITION & STRATEGY

**Competitors:** ${context.competitors}
**Competitive Positioning:** ${context.competitivePositioning}
**Moat/Defensibility:** ${context.moat.join(', ')}
**Go-to-Market Strategy:** ${context.goToMarket}

## TEAM & FUNDING

**Founding Team:** ${context.foundingTeam}
**Team Size:** ${context.teamSize}
${context.keyHires ? `**Key Hires Needed:** ${context.keyHires}` : ''}
**Funding Status:** ${context.fundingStatus}
${context.fundingNeeds ? `**Funding Needs:** ${context.fundingNeeds}` : ''}
**Biggest Challenges:** ${context.biggestChallenges}

---

Generate a JSON object with the following sections. Each section should be rich, detailed markdown content (500-1000 words each) worthy of a McKinsey presentation:

{
  "executive_summary": "A compelling 1-page executive summary with: company overview, the opportunity, solution, business model, traction/goals, team strength, and funding ask. Include a 'Bottom Line' callout.",

  "market_opportunity": "Deep market analysis including: TAM/SAM/SOM breakdown with sources, market growth drivers, industry trends, timing analysis (why now?), and market entry strategy. Include a market sizing table.",

  "problem_analysis": "Thorough problem analysis: customer pain points with specific examples, quantified cost of the problem, why existing solutions fail, customer quotes/insights if available. Use the Jobs-to-be-Done framework.",

  "solution_value_prop": "Detailed solution description: how it works, key features/benefits, unique value proposition, product roadmap vision. Include a comparison table vs alternatives.",

  "business_model": "Complete business model: revenue streams, pricing strategy with rationale, unit economics (LTV, CAC, LTV:CAC ratio, payback period), gross margin analysis, path to profitability with timeline.",

  "go_to_market": "Comprehensive GTM strategy: customer acquisition channels with prioritization, marketing strategy, sales process, partnerships strategy, launch plan. Include a 12-month GTM timeline.",

  "competitive_analysis": "Strategic competitive analysis: competitor landscape, competitive positioning map, sustainable competitive advantages (moat), barriers to entry, competitive response strategy.",

  "traction_milestones": "Traction & Milestones: current traction metrics, key milestones achieved, 12-month milestone roadmap with specific targets, 36-month vision milestones, KPIs to track.",

  "financial_projections": "Financial projections: 3-year revenue forecast, key assumptions, expense breakdown, break-even analysis, funding requirements and use of funds. Include a financial summary table.",

  "team_section": "Team section: founder backgrounds and why they win, team structure, key hires needed, advisory board opportunities, team's unfair advantages.",

  "risks_mitigation": "Risk analysis: top 5 risks (market, execution, competitive, financial, team), mitigation strategies for each, contingency plans.",

  "action_plan": "90-Day Action Plan: immediate priorities (Week 1-2), short-term goals (Month 1), medium-term objectives (Month 2-3), key decisions needed, resources required."
}

IMPORTANT: Tailor your advice to this founder's specific situation:
- Their stage is "${context.businessStage}" - calibrate complexity accordingly
- Their funding status is "${context.fundingStatus}" - adjust financial advice appropriately
- Their 12-month goal is "${context.revenueGoal12m}" - make sure advice scales to this ambition level
- Their team size is "${context.teamSize}" - be realistic about what they can execute

Be their strategic partner, not a generic business plan template. Make it feel like advice written specifically for them.`;
}
