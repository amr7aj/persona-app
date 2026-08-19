import { UserAnswerSubmission, StoredAnalysisResult } from './types';
import { ARCHETYPES } from '../src/data/archetypesData';
import { QUESTIONS } from '../src/data/questionsData';
import { QuestionCategory } from '../src/types';

export interface CalculatedScores {
  overallScore: number;
  archetypeId: string;
  domainScores: {
    cognitive: number;
    emotional: number;
    social: number;
    behavioral: number;
    motivation: number;
    lifestyle: number;
    relationships: number;
    intimacy: number;
    career: number;
  };
  dimensions: Array<{
    name: string;
    nameAr: string;
    nameEn: string;
    category: QuestionCategory;
    score: number;
    benchmark: number;
    descriptionAr: string;
    descriptionEn: string;
  }>;
}

export function calculateAssessmentScores(answers: UserAnswerSubmission[]): CalculatedScores {
  const answerMap = new Map<string, number>();
  for (const ans of answers) {
    answerMap.set(ans.questionId, ans.value);
  }

  // Domain score accumulators
  const domainTotals: Record<QuestionCategory, { sum: number; count: number; maxPossible: number }> = {
    cognitive: { sum: 0, count: 0, maxPossible: 0 },
    emotional: { sum: 0, count: 0, maxPossible: 0 },
    social: { sum: 0, count: 0, maxPossible: 0 },
    behavioral: { sum: 0, count: 0, maxPossible: 0 },
    motivation: { sum: 0, count: 0, maxPossible: 0 },
    lifestyle: { sum: 0, count: 0, maxPossible: 0 },
    relationships: { sum: 0, count: 0, maxPossible: 0 },
    intimacy: { sum: 0, count: 0, maxPossible: 0 },
    career: { sum: 0, count: 0, maxPossible: 0 },
  };

  const dimensionList: Array<{
    name: string;
    nameAr: string;
    nameEn: string;
    category: QuestionCategory;
    score: number;
    benchmark: number;
    descriptionAr: string;
    descriptionEn: string;
  }> = [];

  for (const q of QUESTIONS) {
    const rawVal = answerMap.get(q.id) ?? 3; // fallback neutral value
    const finalVal = q.reverseScore ? 6 - rawVal : rawVal;
    const importance = q.importance ?? 1.0;

    const domain = domainTotals[q.category];
    if (domain) {
      domain.sum += finalVal * importance;
      domain.maxPossible += 5 * importance;
      domain.count += 1;
    }

    // Convert 1..5 scale to 20..100 percentage
    const normalizedDimScore = Math.round(((finalVal - 1) / 4) * 80 + 20);

    dimensionList.push({
      name: q.dimension,
      nameAr: q.dimensionAr,
      nameEn: q.dimensionEn,
      category: q.category,
      score: normalizedDimScore,
      benchmark: 65, // population average baseline
      descriptionAr: `مستوى ${q.dimensionAr}: ${normalizedDimScore}% يعكس توازناً ونمط استجابة متسق.`,
      descriptionEn: `${q.dimensionEn} index at ${normalizedDimScore}% reflects consistent behavioral patterns.`
    });
  }

  // Calculate 0-100 percentage for each domain
  const domainScores = {
    cognitive: Math.round(((domainTotals.cognitive.sum || 3) / (domainTotals.cognitive.maxPossible || 5)) * 100),
    emotional: Math.round(((domainTotals.emotional.sum || 3) / (domainTotals.emotional.maxPossible || 5)) * 100),
    social: Math.round(((domainTotals.social.sum || 3) / (domainTotals.social.maxPossible || 5)) * 100),
    behavioral: Math.round(((domainTotals.behavioral.sum || 3) / (domainTotals.behavioral.maxPossible || 5)) * 100),
    motivation: Math.round(((domainTotals.motivation.sum || 3) / (domainTotals.motivation.maxPossible || 5)) * 100),
    lifestyle: Math.round(((domainTotals.lifestyle.sum || 3) / (domainTotals.lifestyle.maxPossible || 5)) * 100),
    relationships: Math.round(((domainTotals.relationships.sum || 3) / (domainTotals.relationships.maxPossible || 5)) * 100),
    intimacy: Math.round(((domainTotals.intimacy.sum || 3) / (domainTotals.intimacy.maxPossible || 5)) * 100),
    career: Math.round(((domainTotals.career.sum || 3) / (domainTotals.career.maxPossible || 5)) * 100),
  };

  // Overall index
  const domainValues = Object.values(domainScores);
  const overallScore = Math.round(domainValues.reduce((a, b) => a + b, 0) / domainValues.length);

  // Archetype matching algorithm based on multidimensional feature vectors
  const archetypeId = classifyArchetype(domainScores);

  return {
    overallScore,
    archetypeId,
    domainScores,
    dimensions: dimensionList
  };
}

function classifyArchetype(scores: CalculatedScores['domainScores']): string {
  // We compute similarity score to each archetype profile vector
  const weights: Record<string, Record<keyof CalculatedScores['domainScores'], number>> = {
    'strategic-builder': { cognitive: 0.95, behavioral: 0.9, career: 0.9, motivation: 0.85, emotional: 0.6, social: 0.65, lifestyle: 0.7, relationships: 0.7, intimacy: 0.65 },
    'empathetic-catalyst': { emotional: 0.95, relationships: 0.95, social: 0.85, intimacy: 0.85, motivation: 0.7, cognitive: 0.75, behavioral: 0.7, lifestyle: 0.75, career: 0.7 },
    'visionary-architect': { cognitive: 0.95, motivation: 0.9, career: 0.85, behavioral: 0.75, emotional: 0.65, social: 0.65, lifestyle: 0.7, relationships: 0.65, intimacy: 0.6 },
    'deep-analyst': { cognitive: 0.95, behavioral: 0.85, career: 0.8, emotional: 0.6, social: 0.55, motivation: 0.75, lifestyle: 0.7, relationships: 0.65, intimacy: 0.6 },
    'driven-achiever': { motivation: 0.95, career: 0.95, behavioral: 0.85, cognitive: 0.8, social: 0.75, emotional: 0.65, lifestyle: 0.65, relationships: 0.65, intimacy: 0.7 },
    'harmonious-diplomat': { relationships: 0.95, emotional: 0.9, social: 0.85, behavioral: 0.75, cognitive: 0.7, motivation: 0.65, lifestyle: 0.75, intimacy: 0.8, career: 0.7 },
    'resilient-navigator': { lifestyle: 0.85, motivation: 0.85, cognitive: 0.8, behavioral: 0.7, social: 0.8, emotional: 0.75, career: 0.8, relationships: 0.7, intimacy: 0.75 },
    'mindful-anchor': { emotional: 0.9, lifestyle: 0.9, relationships: 0.85, behavioral: 0.85, cognitive: 0.8, motivation: 0.65, social: 0.6, intimacy: 0.75, career: 0.7 },
    'creative-maverick': { cognitive: 0.9, motivation: 0.85, emotional: 0.85, social: 0.7, career: 0.8, intimacy: 0.8, behavioral: 0.65, lifestyle: 0.7, relationships: 0.7 },
    'grounded-guardian': { behavioral: 0.95, relationships: 0.9, emotional: 0.8, career: 0.8, lifestyle: 0.85, cognitive: 0.75, motivation: 0.7, social: 0.65, intimacy: 0.75 },
    'insightful-sage': { cognitive: 0.9, emotional: 0.9, relationships: 0.85, lifestyle: 0.8, motivation: 0.7, behavioral: 0.8, social: 0.6, intimacy: 0.75, career: 0.75 },
    'dynamic-energizer': { social: 0.95, motivation: 0.85, emotional: 0.8, career: 0.8, lifestyle: 0.8, cognitive: 0.7, behavioral: 0.65, relationships: 0.8, intimacy: 0.8 }
  };

  let bestMatch = 'strategic-builder';
  let bestScore = -Infinity;

  for (const [archetypeId, vector] of Object.entries(weights)) {
    let similarity = 0;
    for (const [domainKey, weight] of Object.entries(vector)) {
      const userVal = scores[domainKey as keyof CalculatedScores['domainScores']] ?? 50;
      similarity += userVal * weight;
    }

    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = archetypeId;
    }
  }

  return ARCHETYPES[bestMatch] ? bestMatch : 'strategic-builder';
}
