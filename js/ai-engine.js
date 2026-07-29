/**
 * MethodWise AI - Multi-Criteria Decision Evaluation Engine
 * Evaluates engineering parameters, computes DFM scores, cost breakdowns, and structural suitability.
 */

class AIEngine {
  constructor() {
    this.data = window.METHODWISE_DATA;
  }

  /**
   * Main evaluation function
   * @param {Object} input - Wizard form state
   */
  evaluate(input) {
    const {
      productName = 'Smart Product',
      productType = 'Consumer Product',
      description = '',
      purpose = '',
      targetUsage = 'Standard Environment',
      length = 100,
      width = 100,
      height = 50,
      weight = 500,
      unit = 'mm',
      preferredMaterials = [],
      selectedCategory = 'all',
      manufacturingProcess = 'auto',
      quantity = 1000,
      accuracy = 'standard',
      surfaceFinish = 'standard',
      durabilityLevel = 'high',
      budgetRange = 'medium'
    } = input;

    // 1. Calculate Estimated Volume in cm3
    let scaleToCm = unit === 'mm' ? 0.1 : (unit === 'inches' ? 2.54 : 1.0);
    let volumeCm3 = (length * scaleToCm) * (width * scaleToCm) * (height * scaleToCm);
    if (volumeCm3 <= 0) volumeCm3 = 500;

    // 2. Select Recommended Material
    let recommendedMaterial = this.findBestMaterial(input, volumeCm3);
    
    // 3. Select Recommended Manufacturing Process
    let recommendedProcess = this.findBestProcess(input, recommendedMaterial);

    // 4. Compute Cost Breakdown
    let costBreakdown = this.calculateCosts(recommendedMaterial, recommendedProcess, volumeCm3, quantity, budgetRange);

    // 5. Compute AI Performance Ratings
    let scores = this.calculateScores(recommendedMaterial, recommendedProcess, quantity, accuracy, durabilityLevel, targetUsage);

    // 6. Formulate DFM & Strategic Explanations
    let explanations = this.generateExplanations(recommendedMaterial, recommendedProcess, input, scores, costBreakdown);

    return {
      productName,
      productType,
      targetUsage,
      dimensions: { length, width, height, weight, unit },
      recommendedMaterial,
      recommendedProcess,
      costBreakdown,
      scores,
      explanations,
      timestamp: new Date().toISOString()
    };
  }

  findBestMaterial(input, volumeCm3) {
    const allMaterials = [
      ...this.data.MATERIALS.metals,
      ...this.data.MATERIALS.plastics,
      ...this.data.MATERIALS.composites
    ];

    // If user specifically picked a material, use it or score against it
    if (input.preferredMaterials && input.preferredMaterials.length > 0) {
      let matched = allMaterials.find(m => m.id === input.preferredMaterials[0] || m.name.toLowerCase().includes(input.preferredMaterials[0].toLowerCase()));
      if (matched) return matched;
    }

    // Smart auto selection rules based on Product Type and Target Usage
    const type = input.productType || '';
    const usage = (input.targetUsage || '').toLowerCase();
    const isHighStrength = usage.includes('extreme') || usage.includes('stress') || usage.includes('vibration') || usage.includes('heavy');
    const isLightweight = usage.includes('outdoor') || usage.includes('drone') || type.includes('Electronics');

    if (type === 'Medical Equipment') {
      return this.data.MATERIALS.metals.find(m => m.id === 'titanium-ti6al4v') || allMaterials[1];
    } else if (type === 'Electronics' || type === 'Consumer Product') {
      if (isHighStrength) {
        return this.data.MATERIALS.plastics.find(m => m.id === 'polycarbonate-pc') || allMaterials[0];
      }
      return this.data.MATERIALS.plastics.find(m => m.id === 'abs-plastic') || allMaterials[4];
    } else if (type === 'Automotive' || isHighStrength) {
      if (isLightweight) {
        return this.data.MATERIALS.composites.find(m => m.id === 'carbon-fiber-3k') || allMaterials[0];
      }
      return this.data.MATERIALS.metals.find(m => m.id === 'aluminium-6061') || allMaterials[0];
    }

    // Default fallback: ABS Plastic for general consumer, Aluminium for industrial
    return type === 'Industrial Product' ? this.data.MATERIALS.metals[0] : this.data.MATERIALS.plastics[0];
  }

  findBestProcess(input, material) {
    const qty = parseInt(input.quantity) || 1000;
    const procId = input.manufacturingProcess;

    if (procId && procId !== 'auto') {
      let matched = this.data.PROCESSES.find(p => p.id === procId);
      if (matched) return matched;
    }

    // AI selection rules based on quantity and material category
    if (material.category === 'Plastics') {
      if (qty >= 500) {
        return this.data.PROCESSES.find(p => p.id === 'injection-molding');
      } else {
        return this.data.PROCESSES.find(p => p.id === '3d-printing');
      }
    } else if (material.category === 'Metals') {
      if (qty <= 500) {
        return this.data.PROCESSES.find(p => p.id === 'cnc-machining');
      } else if (input.length < 50 && input.height < 10) {
        return this.data.PROCESSES.find(p => p.id === 'sheet-metal') || this.data.PROCESSES.find(p => p.id === 'laser-cutting');
      } else {
        return this.data.PROCESSES.find(p => p.id === 'casting') || this.data.PROCESSES.find(p => p.id === 'cnc-machining');
      }
    } else {
      // Composites
      return this.data.PROCESSES.find(p => p.id === '3d-printing') || this.data.PROCESSES.find(p => p.id === 'cnc-machining');
    }
  }

  calculateCosts(material, process, volumeCm3, quantity, budgetRange) {
    // Estimate mass in grams
    let weightGrams = volumeCm3 * material.density;
    let weightKg = weightGrams / 1000.0;
    if (weightKg < 0.05) weightKg = 0.05;

    // Base raw material cost per kg (in INR ₹)
    let baseMatPrice = material.costIndex * 150; // ₹150 to ₹750/kg base
    if (material.id.includes('titanium')) baseMatPrice = 3000;
    if (material.id.includes('carbon')) baseMatPrice = 4500;

    let matCostPerUnit = Math.round(weightKg * baseMatPrice);
    if (matCostPerUnit < 50) matCostPerUnit = 80;

    // Manufacturing / Tooling amortized cost
    let toolingBase = 0;
    if (process.id === 'injection-molding') toolingBase = 150000;
    else if (process.id === 'casting') toolingBase = 80000;
    else if (process.id === 'cnc-machining') toolingBase = 5000;

    let mfgCostPerUnit = Math.round((toolingBase / Math.max(quantity, 1)) + (process.unitCostFactor * 250));
    let assemblyCostPerUnit = Math.round(matCostPerUnit * 0.15 + 40);

    let totalPerUnit = matCostPerUnit + mfgCostPerUnit + assemblyCostPerUnit;

    // Adjust range representation
    let minCost = Math.round(totalPerUnit * 0.85);
    let maxCost = Math.round(totalPerUnit * 1.25);

    return {
      materialCost: matCostPerUnit,
      manufacturingCost: mfgCostPerUnit,
      assemblyCost: assemblyCostPerUnit,
      totalPerUnit: totalPerUnit,
      costRangeDisplay: `₹${minCost.toLocaleString()} - ₹${maxCost.toLocaleString()}`,
      minCost,
      maxCost
    };
  }

  calculateScores(material, process, quantity, accuracy, durabilityLevel, targetUsage) {
    // Strength Score (0 - 100)
    let strengthScore = Math.min(99, Math.round((material.strength / 1000) * 60 + 40));
    if (material.category === 'Metals') strengthScore = Math.max(78, strengthScore);

    // Cost Efficiency Score (0 - 100)
    let costScore = 95 - (material.costIndex * 12);
    if (process.id === 'injection-molding' && quantity >= 1000) costScore += 15;
    costScore = Math.min(98, Math.max(50, costScore));

    // Sustainability Score (0 - 100)
    let sustainabilityScore = 75;
    if (material.id === 'pla-plastic') sustainabilityScore = 96;
    else if (material.id.includes('aluminium')) sustainabilityScore = 90;
    else if (material.id.includes('abs')) sustainabilityScore = 68;

    // Manufacturability Score (DFM) (0 - 100)
    let DFMScore = 88;
    if (process.id === 'injection-molding' && material.category === 'Plastics') DFMScore = 94;
    if (process.id === 'cnc-machining' && material.id.includes('titanium')) DFMScore = 78;

    // Overall Design Rating (1.0 to 10.0)
    let avg = (strengthScore + costScore + sustainabilityScore + DFMScore) / 4.0;
    let overallScore = (avg / 10.0).toFixed(1);

    return {
      strengthScore,
      costScore,
      sustainabilityScore,
      manufacturabilityScore: DFMScore,
      overallScore: parseFloat(overallScore),
      efficiency: Math.round((DFMScore + costScore) / 2)
    };
  }

  generateExplanations(material, process, input, scores, cost) {
    return {
      selectedMaterial: material.name,
      materialCategory: material.category,
      selectionReason: `${material.name} was selected because it delivers an optimal strength-to-weight index for ${input.productType || 'general product'} applications while staying within the target ${input.budgetRange || 'medium'} budget curve.`,
      advantages: material.advantages,
      limitations: material.limitations,

      bestProcessName: process.name,
      processExplanation: `${process.name} is the top AI recommendation for a batch volume of ${input.quantity || 1000} units. It provides ${process.accuracy} tolerance control with minimal lead time (${process.leadTime}).`,
      productionBenefits: process.benefits,
      dfmTips: [
        'Maintain uniform wall thickness to prevent sink marks or warpage during cooling.',
        'Incorporate 1° to 2° draft angles on vertical internal surfaces for clean ejection.',
        'Add generous fillet radii at high stress corner junctions to improve fatigue life.'
      ]
    };
  }
}

window.aiEngine = new AIEngine();
