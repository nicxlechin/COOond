import type { QuestionnaireResponses } from '@/lib/questionnaires/types';

export const BUSINESS_PLAN_SECTIONS = [
  { key: 'executive_summary', title: 'Executive Summary', icon: 'FileText' },
  { key: 'market_opportunity', title: 'Market Opportunity', icon: 'TrendingUp' },
  { key: 'problem_solution', title: 'Problem & Solution', icon: 'Lightbulb' },
  { key: 'target_customer', title: 'Target Customer', icon: 'Users' },
  { key: 'business_model', title: 'Business Model & Pricing', icon: 'DollarSign' },
  { key: 'competitive_landscape', title: 'Competitive Landscape', icon: 'Target' },
  { key: 'go_to_market', title: 'Go-to-Market Strategy', icon: 'Rocket' },
  { key: 'roadmap', title: 'Roadmap & Milestones', icon: 'Flag' },
  { key: 'financials', title: 'Financial Projections', icon: 'BarChart' },
  { key: 'risks_challenges', title: 'Risks & How to Overcome Them', icon: 'Shield' },
  { key: 'next_steps', title: 'Your Next Steps', icon: 'CheckSquare' },
] as const;

export const BUSINESS_PLAN_SYSTEM_PROMPT = `You are an experienced business strategist and market researcher. The founder has shared their business idea with you, and your job is to create a comprehensive business plan.

## YOUR ROLE:
- When they provide information, USE IT and build on it
- When they say "not sure" or "help me", YOU DO THE RESEARCH and provide specific recommendations
- Fill in ALL gaps with your expertise - never leave sections empty or vague
- Be specific with numbers, timelines, and action items

## FOR EVERY SECTION:
1. Use what the founder told you as the foundation
2. Add your own research and insights
3. Provide specific recommendations
4. Include actionable next steps

## HANDLING UNCERTAINTY:
When the founder says "not sure", "help me", "I don't know":
- DO NOT say "we need more information"
- DO provide your best recommendation based on the industry and context
- EXPLAIN your reasoning so they understand

## CALIBRATE TO THEIR SITUATION:
- Side income goal → lean, simple strategies
- Scale big → growth-focused with funding paths
- Bootstrapping → capital-efficient tactics
- Part-time → realistic timelines for limited time

## FORMATTING:
- Use ## for main headers, ### for sub-headers
- Use **bold** for key numbers and recommendations
- Use tables for comparisons and data
- Use bullet points for lists
- Use > blockquotes for key insights`;

export interface BusinessPlanContext {
  businessName: string;
  productService: string;
  problemSolved: string;
  industry: string;
  industryOther?: string;
  targetCustomer: string;
  marketSizeKnowledge: string;
  marketSizeDetails?: string;
  geographicFocus: string;
  geographicDetails?: string;
  knowCompetitors: string;
  competitorsList?: string;
  whyDifferent: string;
  revenueModel: string;
  pricingThoughts: string;
  currentStatus: string;
  existingRevenue?: string;
  successVision: string;
  revenueGoal: string;
  teamSituation: string;
  timeCommitment: string;
  fundingSituation: string;
  startupBudget?: string;
  biggestChallenge?: string;
}

export function mapResponsesToBusinessPlanContext(
  responses: QuestionnaireResponses
): BusinessPlanContext {
  return {
    businessName: (responses.business_name as string) || 'Unnamed Business',
    productService: (responses.product_service as string) || '',
    problemSolved: (responses.problem_solved as string) || '',
    industry: (responses.industry as string) || '',
    industryOther: responses.industry_other as string | undefined,
    targetCustomer: (responses.target_customer as string) || '',
    marketSizeKnowledge: (responses.market_size_knowledge as string) || 'no_idea',
    marketSizeDetails: responses.market_size_details as string | undefined,
    geographicFocus: (responses.geographic_focus as string) || '',
    geographicDetails: responses.geographic_details as string | undefined,
    knowCompetitors: (responses.know_competitors as string) || 'no_idea',
    competitorsList: responses.competitors_list as string | undefined,
    whyDifferent: (responses.why_different as string) || '',
    revenueModel: (responses.revenue_model as string) || '',
    pricingThoughts: (responses.pricing_thoughts as string) || '',
    currentStatus: (responses.current_status as string) || '',
    existingRevenue: responses.existing_revenue as string | undefined,
    successVision: (responses.success_vision as string) || '',
    revenueGoal: (responses.revenue_goal as string) || '',
    teamSituation: (responses.team_situation as string) || '',
    timeCommitment: (responses.time_commitment as string) || '',
    fundingSituation: (responses.funding_situation as string) || '',
    startupBudget: responses.startup_budget as string | undefined,
    biggestChallenge: responses.biggest_challenge as string | undefined,
  };
}

export function buildBusinessPlanPrompt(context: BusinessPlanContext): string {
  const industry = context.industry === 'other' ? context.industryOther : context.industry;

  const needsMarketResearch = context.marketSizeKnowledge === 'no_idea';
  const needsCompetitorResearch = context.knowCompetitors === 'no_idea';
  const needsPricingHelp = context.pricingThoughts.toLowerCase().includes('not sure') || context.revenueModel === 'not_sure';

  return `Create a comprehensive business plan based on the founder's input below.

## FOUNDER'S BUSINESS INFORMATION

### The Business
- **Business Name:** ${context.businessName}
- **Product/Service:** ${context.productService}
- **Problem Being Solved:** ${context.problemSolved}
- **Industry:** ${industry}

### Target Market
- **Target Customer:** ${context.targetCustomer}
- **Geographic Focus:** ${context.geographicFocus}${context.geographicDetails ? ` (${context.geographicDetails})` : ''}
- **Market Size Knowledge:** ${context.marketSizeKnowledge}
${context.marketSizeDetails ? `- **Their Market Research:** ${context.marketSizeDetails}` : ''}
${needsMarketResearch ? '⚠️ FOUNDER NEEDS HELP: Research and estimate the market size for them' : ''}

### Competition
- **Competitor Knowledge:** ${context.knowCompetitors}
${context.competitorsList ? `- **Known Competitors:** ${context.competitorsList}` : ''}
- **Their Differentiation:** ${context.whyDifferent}
${needsCompetitorResearch ? '⚠️ FOUNDER NEEDS HELP: Identify and analyze competitors for them' : ''}

### Business Model
- **Revenue Model:** ${context.revenueModel}
- **Pricing Thoughts:** ${context.pricingThoughts}
- **Current Status:** ${context.currentStatus}
${context.existingRevenue ? `- **Current Revenue:** ${context.existingRevenue}` : ''}
${needsPricingHelp ? '⚠️ FOUNDER NEEDS HELP: Recommend specific pricing for them' : ''}

### Goals & Resources
- **Success Vision:** ${context.successVision}
- **Revenue Goal (Year 1):** ${context.revenueGoal}
- **Team:** ${context.teamSituation}
- **Time Available:** ${context.timeCommitment}
- **Funding:** ${context.fundingSituation}
${context.startupBudget ? `- **Startup Budget:** ${context.startupBudget}` : ''}
${context.biggestChallenge ? `- **Biggest Challenge:** ${context.biggestChallenge}` : ''}

---

## YOUR OUTPUT

Generate a JSON object with these sections. EVERY section must have substantial content (300-800 words each). Use the founder's information and ADD your expertise:

{
  "executive_summary": "Compelling overview: the business concept, market opportunity (with size), unique value, business model, and key goals. Make it exciting but realistic for their situation.",

  "market_opportunity": "Market analysis with specific numbers. ${needsMarketResearch ? 'RESEARCH AND ESTIMATE TAM/SAM/SOM since they need help.' : 'Build on their research with additional insights.'} Include market trends, growth drivers, and why now is a good time. Use a table for market sizing.",

  "problem_solution": "Deep dive into the problem (${context.problemSolved}) and how their solution (${context.productService}) addresses it. Add additional pain points they may not have mentioned. Explain what makes their approach compelling.",

  "target_customer": "Detailed profile of their ideal customer (${context.targetCustomer}). Create 2-3 specific customer personas with demographics, behaviors, pain points, and where to find them.",

  "business_model": "Complete business model based on their ${context.revenueModel} approach. ${needsPricingHelp ? 'RECOMMEND specific pricing tiers with your reasoning.' : 'Build on their pricing ideas.'} Include unit economics estimates and revenue projections.",

  "competitive_landscape": "${needsCompetitorResearch ? 'IDENTIFY 4-6 competitors in this space and analyze them.' : 'Analyze the competitors they mentioned and add any they missed.'} Include a comparison table and specific strategies to differentiate.",

  "go_to_market": "Specific launch strategy for a ${context.teamSituation} team with ${context.timeCommitment} time and ${context.fundingSituation} funding. Include priority channels, specific tactics, timeline, and budget allocation.",

  "roadmap": "Phased roadmap: 30-day quick wins, 90-day milestones, 6-month targets, 12-month goals. Make it realistic for their situation and time availability.",

  "financials": "Financial projections based on their ${context.revenueGoal} goal. Include monthly Year 1 forecast, Years 2-3 annual, break-even analysis. Show assumptions clearly in tables.",

  "risks_challenges": "Top 5-7 risks for this business. ${context.biggestChallenge ? `Address their stated challenge: "${context.biggestChallenge}"` : ''} For each risk, provide a specific mitigation strategy.",

  "next_steps": "Specific actions for THIS WEEK and THIS MONTH. Prioritize based on their stage (${context.currentStatus}) and biggest challenge. Make it actionable and realistic for ${context.timeCommitment} time commitment."
}

IMPORTANT: Every section must have real, specific content. No empty sections. No generic filler. Use your expertise to provide value.`;
}
