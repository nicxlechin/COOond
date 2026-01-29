import type { QuestionnaireResponses } from './types';

// Map business plan responses to GTM plan responses
export function mapBusinessPlanToGTM(
  businessPlanResponses: QuestionnaireResponses
): Partial<QuestionnaireResponses> {
  const mapped: Partial<QuestionnaireResponses> = {};

  // Product name from business name
  if (businessPlanResponses.business_name) {
    mapped.product_name = businessPlanResponses.business_name;
  }

  // Product description from product/service
  if (businessPlanResponses.product_service) {
    mapped.product_description = businessPlanResponses.product_service;
  }

  // Primary persona from target customer
  if (businessPlanResponses.target_customer) {
    mapped.primary_persona = businessPlanResponses.target_customer;
  }

  // Main competitors from competitors list
  if (businessPlanResponses.competitors_list) {
    mapped.main_competitors = businessPlanResponses.competitors_list;
  }

  // Competitive advantage from why different
  if (businessPlanResponses.why_different) {
    mapped.competitive_advantage = businessPlanResponses.why_different;
  }

  // Map geographic focus
  const geoMapping: Record<string, string[]> = {
    local: ['local'],
    national: ['national'],
    international: ['global'],
    online_global: ['global'],
  };
  if (businessPlanResponses.geographic_focus) {
    mapped.geographic_focus = geoMapping[businessPlanResponses.geographic_focus as string] || ['national'];
  }

  // Map current status to readiness
  const statusToReadiness: Record<string, string> = {
    idea: 'concept',
    planning: 'concept',
    building: 'development',
    launched: 'soft_launch',
    growing: 'ready',
  };
  if (businessPlanResponses.current_status) {
    mapped.readiness = statusToReadiness[businessPlanResponses.current_status as string] || 'concept';
  }

  return mapped;
}

// Get display-friendly field names for import preview
export function getImportableFields(
  businessPlanResponses: QuestionnaireResponses
): { gtmField: string; label: string; value: string }[] {
  const fields: { gtmField: string; label: string; value: string }[] = [];

  if (businessPlanResponses.business_name) {
    fields.push({
      gtmField: 'product_name',
      label: 'Product Name',
      value: businessPlanResponses.business_name as string,
    });
  }

  if (businessPlanResponses.product_service) {
    fields.push({
      gtmField: 'product_description',
      label: 'Product Description',
      value: (businessPlanResponses.product_service as string).slice(0, 100) + '...',
    });
  }

  if (businessPlanResponses.target_customer) {
    fields.push({
      gtmField: 'primary_persona',
      label: 'Target Customer',
      value: (businessPlanResponses.target_customer as string).slice(0, 100) + '...',
    });
  }

  if (businessPlanResponses.competitors_list) {
    fields.push({
      gtmField: 'main_competitors',
      label: 'Competitors',
      value: (businessPlanResponses.competitors_list as string).slice(0, 100) + '...',
    });
  }

  if (businessPlanResponses.why_different) {
    fields.push({
      gtmField: 'competitive_advantage',
      label: 'Competitive Advantage',
      value: (businessPlanResponses.why_different as string).slice(0, 100) + '...',
    });
  }

  return fields;
}
