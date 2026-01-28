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

export const BUSINESS_PLAN_SYSTEM_PROMPT = `You are an experienced business strategist, market researcher, and startup advisor. Your job is to DO THE WORK for the founder - they give you basic information about their idea, and YOU figure out the rest.

## YOUR JOB IS TO:
1. **Research and estimate market size** - Based on their industry and target customer, YOU calculate TAM/SAM/SOM. Use real industry data and logical estimates.
2. **Identify competitors** - YOU find and analyze the main competitors they'll face. They don't need to tell you - you should know the landscape.
3. **Recommend pricing** - Based on the market and business model, YOU suggest specific pricing strategies with numbers.
4. **Calculate unit economics** - YOU estimate CAC, LTV, margins based on industry benchmarks.
5. **Create financial projections** - YOU build realistic revenue scenarios based on their goals and situation.
6. **Develop the strategy** - YOU create the go-to-market plan, not them.

## HANDLING "I'M NOT SURE" RESPONSES:
When the founder says they're not sure about something, DON'T leave it blank or generic. Instead:
- Research and provide YOUR recommendation
- Explain your reasoning
- Give them options to consider

## CALIBRATE TO THEIR SITUATION:
- **Side income goal?** → Give them a lean, simple plan they can execute in spare time
- **Want to scale big?** → Give them a growth-focused plan with funding strategies
- **Bootstrapping?** → Focus on capital-efficient tactics and quick revenue
- **Looking for funding?** → Include investor-ready metrics and projections

## WRITING STYLE:
- Write like a smart advisor talking directly to them
- Be specific with numbers, timelines, and action items
- Use "you should" and "I recommend" - take a stance
- Include tables and bullet points for clarity
- Every section should end with specific actions

## FORMATTING:
- Use ## for section headers
- Use ### for subsections
- Use **bold** for key metrics and recommendations
- Use tables for comparisons and financial data
- Use > blockquotes for key insights

Your output should feel like they hired a consultant who did all the research and is presenting findings and recommendations.`;

export interface BusinessPlanContext {
  businessName: string;
  businessIdea: string;
  industry: string;
  industryOther?: string;
  targetCustomer: string;
  customerProblem: string;
  whyYou?: string;
  howMakeMoney: string;
  priceIdea?: string;
  existingRevenue: string;
  currentStage: string;
  workingOnThis: string;
  timeCommitment: string;
  fundingSituation: string;
  successVision: string;
  timeline: string;
  biggestChallenge?: string;
  anythingElse?: string;
}

export function mapResponsesToBusinessPlanContext(
  responses: QuestionnaireResponses
): BusinessPlanContext {
  return {
    businessName: (responses.business_name as string) || 'Unnamed Business',
    businessIdea: (responses.business_idea as string) || '',
    industry: (responses.industry as string) || '',
    industryOther: responses.industry_other as string | undefined,
    targetCustomer: (responses.target_customer as string) || '',
    customerProblem: (responses.customer_problem as string) || '',
    whyYou: responses.why_you as string | undefined,
    howMakeMoney: (responses.how_make_money as string) || '',
    priceIdea: responses.price_idea as string | undefined,
    existingRevenue: (responses.existing_revenue as string) || '',
    currentStage: (responses.current_stage as string) || '',
    workingOnThis: (responses.working_on_this as string) || '',
    timeCommitment: (responses.time_commitment as string) || '',
    fundingSituation: (responses.funding_situation as string) || '',
    successVision: (responses.success_vision as string) || '',
    timeline: (responses.timeline as string) || '',
    biggestChallenge: responses.biggest_challenge as string | undefined,
    anythingElse: responses.anything_else as string | undefined,
  };
}

export function buildBusinessPlanPrompt(context: BusinessPlanContext): string {
  const industry = context.industry === 'other' ? context.industryOther : context.industry;

  return `Create a comprehensive business plan for this founder. DO THE RESEARCH AND ANALYSIS FOR THEM.

## FOUNDER'S INPUT

**Business Name:** ${context.businessName}
**Business Idea:** ${context.businessIdea}
**Industry:** ${industry}

**Target Customer:** ${context.targetCustomer}
**Problem They're Solving:** ${context.customerProblem}
**Why Customers Would Choose Them:** ${context.whyYou || "Not sure yet - you should suggest differentiators"}

**Revenue Model:** ${context.howMakeMoney}
**Pricing Ideas:** ${context.priceIdea || "Not sure - you should research and recommend pricing"}
**Current Revenue:** ${context.existingRevenue}

**Current Stage:** ${context.currentStage}
**Team:** ${context.workingOnThis}
**Time Available:** ${context.timeCommitment}
**Funding Situation:** ${context.fundingSituation}

**Success Vision:** ${context.successVision}
**Timeline:** ${context.timeline}
**Biggest Challenge:** ${context.biggestChallenge || "Not specified"}
**Additional Context:** ${context.anythingElse || "None"}

---

## YOUR TASK

Generate a JSON object with these sections. For each section, DO THE WORK - don't just reflect what they told you, add your research, analysis, and recommendations:

{
  "executive_summary": "Compelling overview of the business opportunity. Include: the problem, solution, target market size (YOU estimate this), business model, and why now is the right time. End with key metrics they should aim for.",

  "market_opportunity": "YOU research and estimate the market size. Include: TAM/SAM/SOM with your calculations, market trends supporting this business, growth drivers, and timing analysis. Use real industry data and logical estimates. Present in a table format.",

  "problem_solution": "Deep dive into the problem and how their solution addresses it. YOU identify additional pain points they may not have mentioned. Explain why existing solutions fail and what makes their approach compelling.",

  "target_customer": "Detailed customer profile that YOU flesh out based on their description. Include demographics, psychographics, buying behavior, where to find them, and customer personas. Create 2-3 specific personas.",

  "business_model": "Complete business model analysis. YOU recommend specific pricing based on market research - give them actual numbers. Include pricing tiers, unit economics estimates (CAC, LTV, margins), and revenue streams. If they said 'not sure', YOU decide and explain why.",

  "competitive_landscape": "YOU identify and analyze 4-6 competitors they'll face. Include a comparison table, competitive positioning analysis, and specific strategies to differentiate. Don't wait for them to tell you competitors - you should know the market.",

  "go_to_market": "Specific launch and growth strategy calibrated to their situation (${context.timeCommitment}, ${context.fundingSituation}). Include: priority channels, tactics with specific steps, timeline, and budget estimates. Make it actionable for their constraints.",

  "roadmap": "Phased roadmap with specific milestones. Include: 30-day priorities, 90-day goals, 6-month targets, and 12-month vision. Make milestones measurable and realistic for their situation.",

  "financials": "YOU create financial projections. Include: monthly projections for Year 1, annual for Years 2-3, break-even analysis, and funding needs (if applicable). Present key metrics in tables. Base on realistic assumptions for their stage.",

  "risks_challenges": "Identify top 5-7 risks and challenges. For each, provide YOUR recommended mitigation strategy. Include market risks, execution risks, and competitive risks. Be honest but constructive.",

  "next_steps": "Specific action items they should take THIS WEEK and THIS MONTH. Prioritize based on their biggest challenge (${context.biggestChallenge || 'getting started'}). Include: what to do, why it matters, and how to do it. Give them a clear starting point."
}

Remember: You are the consultant who did the research. Present findings and recommendations with confidence. Use specific numbers, not ranges. Take a stance on what they should do.`;
}
