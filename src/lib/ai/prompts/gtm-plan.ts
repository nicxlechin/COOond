import type { QuestionnaireResponses } from '@/lib/questionnaires/types';

export const GTM_PLAN_SYSTEM_PROMPT = `You are a seasoned Chief Marketing Officer and go-to-market strategist with 20+ years of experience launching products and building brands. You've helped hundreds of startups successfully enter new markets.

Your task is to generate a comprehensive, actionable go-to-market plan based on the founder's questionnaire responses.

## Your Approach:
1. Be SPECIFIC and ACTIONABLE - avoid generic advice. Reference their actual product, market, and situation.
2. Be REALISTIC - calibrate recommendations to their budget, timeline, and experience level.
3. Be ENCOURAGING but HONEST - don't sugarcoat challenges, but frame them constructively.
4. Think like a mentor - explain the "why" behind recommendations.
5. Use CONCRETE EXAMPLES and NUMBERS wherever possible.

## Writing Style:
- Write in second person ("You should..." / "Your launch...")
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

export interface GTMPlanContext {
  productName: string;
  productDescription: string;
  launchType: string;
  readiness: string;
  primaryPersona: string;
  buyingJourney: string;
  awarenessLevel: string;
  geographicFocus: string[];
  mainCompetitors: string;
  competitiveAdvantage: string;
  marketPosition: string;
  primaryChannels: string[];
  marketingExperience: string;
  existingAudience?: string;
  launchDate: string;
  budgetRange: string;
  successMetrics: string;
  constraints?: string;
}

export function mapResponsesToGTMContext(
  responses: QuestionnaireResponses
): GTMPlanContext {
  return {
    productName: (responses.product_name as string) || '',
    productDescription: (responses.product_description as string) || '',
    launchType: (responses.launch_type as string) || '',
    readiness: (responses.readiness as string) || '',
    primaryPersona: (responses.primary_persona as string) || '',
    buyingJourney: (responses.buying_journey as string) || '',
    awarenessLevel: (responses.awareness_level as string) || '',
    geographicFocus: (responses.geographic_focus as string[]) || [],
    mainCompetitors: (responses.main_competitors as string) || '',
    competitiveAdvantage: (responses.competitive_advantage as string) || '',
    marketPosition: (responses.market_position as string) || '',
    primaryChannels: (responses.primary_channels as string[]) || [],
    marketingExperience: (responses.marketing_experience as string) || '',
    existingAudience: responses.existing_audience as string | undefined,
    launchDate: (responses.launch_date as string) || '',
    budgetRange: (responses.budget_range as string) || '',
    successMetrics: (responses.success_metrics as string) || '',
    constraints: responses.constraints as string | undefined,
  };
}

export function buildGTMPlanPrompt(context: GTMPlanContext): string {
  return `## Product & Launch Information

**Product Name:** ${context.productName}
**Product Description:** ${context.productDescription}
**Launch Type:** ${context.launchType}
**Readiness:** ${context.readiness}

**Target Customer:**
${context.primaryPersona}

**Buying Journey:** ${context.buyingJourney}
**Market Awareness Level:** ${context.awarenessLevel}
**Geographic Focus:** ${context.geographicFocus.join(', ')}

**Competitive Landscape:**
${context.mainCompetitors}

**Competitive Advantage:** ${context.competitiveAdvantage}
**Market Positioning:** ${context.marketPosition}

**Marketing Channels:** ${context.primaryChannels.join(', ')}
**Marketing Experience:** ${context.marketingExperience}
${context.existingAudience ? `**Existing Audience:** ${context.existingAudience}` : ''}

**Launch Date:** ${context.launchDate}
**Budget (3 months):** ${context.budgetRange}
**Success Metrics (90 days):** ${context.successMetrics}
${context.constraints ? `**Constraints:** ${context.constraints}` : ''}

---

Based on this information, generate a comprehensive go-to-market plan with the following sections. Each section should be substantive (200-400 words) and highly specific to THIS launch.

Return a JSON object with these exact keys:

{
  "executive_summary": "A compelling 2-3 paragraph summary of the GTM strategy. Include the core positioning, primary channels, and expected outcomes. This should excite and align the team.",

  "positioning_and_messaging": "Clear positioning statement and messaging framework. Include: positioning statement (For [target], [product] is [category] that [benefit] unlike [alternative]). Key messages for different stages of the funnel. Tone and voice guidelines.",

  "target_audience_deep_dive": "Detailed analysis of the target audience. Include: detailed persona with day-in-life scenario, where they spend time online/offline, what triggers them to look for solutions, objections they might have, who influences their decisions.",

  "competitive_positioning": "How to position against competitors. Include: competitive matrix, key differentiators to emphasize, weaknesses to avoid highlighting, response strategies for competitive objections.",

  "channel_strategy": "Detailed strategy for each selected channel. For each channel: specific tactics, content types, posting/activity frequency, key metrics to track, estimated time/budget allocation. Prioritize by expected ROI.",

  "launch_timeline": "Week-by-week launch plan for the first 90 days. Include: pre-launch activities (4-8 weeks before), launch week activities, post-launch optimization. Be specific with dates relative to their launch date.",

  "content_strategy": "Content plan to support the launch. Include: content pillars/themes, content types and formats, content calendar highlights, repurposing strategy, SEO keyword targets if relevant.",

  "budget_allocation": "How to allocate the marketing budget. Include: channel-by-channel breakdown, tools/software needed, contingency recommendations, what to prioritize if budget is tight.",

  "metrics_and_kpis": "Specific metrics to track success. Include: primary KPIs with targets, secondary metrics, leading indicators vs lagging indicators, when to expect to see results, dashboard recommendations.",

  "risk_mitigation": "Potential risks and how to mitigate them. Include: launch risks, channel risks, competitive risks, budget risks. For each, provide specific mitigation strategies.",

  "quick_wins": "5-7 things they can do THIS WEEK to start building momentum. Make these extremely specific and achievable. Focus on activities that compound over time."
}

Important: Return ONLY the JSON object, no additional text before or after.`;
}

export const GTM_PLAN_SECTIONS = [
  { key: 'executive_summary', title: 'Executive Summary', icon: 'FileText' },
  { key: 'positioning_and_messaging', title: 'Positioning & Messaging', icon: 'MessageSquare' },
  { key: 'target_audience_deep_dive', title: 'Target Audience Deep Dive', icon: 'Users' },
  { key: 'competitive_positioning', title: 'Competitive Positioning', icon: 'Target' },
  { key: 'channel_strategy', title: 'Channel Strategy', icon: 'Share2' },
  { key: 'launch_timeline', title: 'Launch Timeline', icon: 'Calendar' },
  { key: 'content_strategy', title: 'Content Strategy', icon: 'FileEdit' },
  { key: 'budget_allocation', title: 'Budget Allocation', icon: 'DollarSign' },
  { key: 'metrics_and_kpis', title: 'Metrics & KPIs', icon: 'BarChart' },
  { key: 'risk_mitigation', title: 'Risk Mitigation', icon: 'Shield' },
  { key: 'quick_wins', title: 'Quick Wins', icon: 'Zap' },
] as const;
