/**
 * MethodWise AI - Comprehensive Engineering Dataset
 * Contains materials, manufacturing processes, preset projects, and evaluation algorithms.
 */

const MATERIALS_DATA = {
  metals: [
    {
      id: 'aluminium-6061',
      name: 'Aluminium 6061-T6',
      category: 'Metals',
      strength: 310, // MPa
      strengthRating: 'High',
      density: 2.7, // g/cm3
      weightRating: 'Lightweight',
      durability: 85, // %
      costIndex: 3, // 1 to 5 scale
      costDisplay: 'Moderate (₹180 - ₹280 / kg)',
      tempResistance: 150, // °C
      advantages: ['High strength-to-weight ratio', 'Excellent corrosion resistance', 'Good machinability and weldability'],
      limitations: ['Lower strength compared to steel', 'Requires anodizing for severe wear'],
      bestProcesses: ['CNC Machining', 'Sheet Metal Fabrication', 'Casting']
    },
    {
      id: 'stainless-steel-316',
      name: 'Stainless Steel 316L',
      category: 'Metals',
      strength: 580,
      strengthRating: 'Very High',
      density: 8.0,
      weightRating: 'Heavy',
      durability: 96,
      costIndex: 4,
      costDisplay: 'High (₹350 - ₹500 / kg)',
      tempResistance: 800,
      advantages: ['Outstanding marine corrosion resistance', 'High yield strength', 'Bio-compatible medical grade'],
      limitations: ['Difficult to machine (work hardening)', 'Heavy weight'],
      bestProcesses: ['CNC Machining', 'Casting', 'Laser Cutting']
    },
    {
      id: 'titanium-ti6al4v',
      name: 'Titanium Ti-6Al-4V',
      category: 'Metals',
      strength: 950,
      strengthRating: 'Ultra High',
      density: 4.43,
      weightRating: 'Moderate',
      durability: 99,
      costIndex: 5,
      costDisplay: 'Premium (₹2,500 - ₹4,000 / kg)',
      tempResistance: 400,
      advantages: ['Aerospace grade strength', 'Immune to most chemicals', 'Extremely durable & biocompatible'],
      limitations: ['Very expensive raw material', 'High tooling wear during machining'],
      bestProcesses: ['CNC Machining', '3D Printing (Metal SLS)']
    },
    {
      id: 'copper-c11000',
      name: 'Copper C11000',
      category: 'Metals',
      strength: 220,
      strengthRating: 'Medium',
      density: 8.94,
      weightRating: 'Heavy',
      durability: 80,
      costIndex: 4,
      costDisplay: 'High (₹700 - ₹900 / kg)',
      tempResistance: 200,
      advantages: ['Highest electrical & thermal conductivity', 'Antimicrobial properties', 'Highly ductile'],
      limitations: ['High weight', 'Prone to oxidation if untreated'],
      bestProcesses: ['CNC Machining', 'Sheet Metal Fabrication', 'Casting']
    }
  ],
  plastics: [
    {
      id: 'abs-plastic',
      name: 'ABS Plastic',
      category: 'Plastics',
      strength: 45,
      strengthRating: 'Medium',
      density: 1.05,
      weightRating: 'Light',
      durability: 78,
      costIndex: 1,
      costDisplay: 'Low (₹120 - ₹180 / kg)',
      tempResistance: 85,
      advantages: ['Excellent impact resistance', 'Easily injection molded', 'Cost-effective for high volume'],
      limitations: ['Low UV resistance', 'Lower heat deflection temperature'],
      bestProcesses: ['Injection Molding', '3D Printing', 'Laser Cutting']
    },
    {
      id: 'polycarbonate-pc',
      name: 'Polycarbonate (PC)',
      category: 'Plastics',
      strength: 70,
      strengthRating: 'High Plastic',
      density: 1.20,
      weightRating: 'Light',
      durability: 90,
      costIndex: 2,
      costDisplay: 'Moderate (₹220 - ₹320 / kg)',
      tempResistance: 120,
      advantages: ['Virtually unbreakable impact strength', 'High optical clarity', 'Good heat resistance'],
      limitations: ['Scratch sensitive without coating', 'Prone to stress cracking under chemical exposure'],
      bestProcesses: ['Injection Molding', 'CNC Machining', '3D Printing']
    },
    {
      id: 'nylon-pa66',
      name: 'Nylon PA66',
      category: 'Plastics',
      strength: 85,
      strengthRating: 'High Plastic',
      density: 1.14,
      weightRating: 'Light',
      durability: 92,
      costIndex: 2,
      costDisplay: 'Moderate (₹250 - ₹380 / kg)',
      tempResistance: 160,
      advantages: ['Self-lubricating wear resistance', 'High mechanical toughness', 'Good chemical resistance'],
      limitations: ['Hygroscopic (absorbs moisture)', 'Dimensional swelling in humid environments'],
      bestProcesses: ['Injection Molding', '3D Printing (SLS)', 'CNC Machining']
    },
    {
      id: 'pla-plastic',
      name: 'PLA (Polylactic Acid)',
      category: 'Plastics',
      strength: 50,
      strengthRating: 'Medium-Low',
      density: 1.24,
      weightRating: 'Light',
      durability: 60,
      costIndex: 1,
      costDisplay: 'Low (₹150 - ₹220 / kg)',
      tempResistance: 60,
      advantages: ['Biodegradable & eco-friendly', 'Zero toxic fumes during 3D printing', 'Good dimensional accuracy'],
      limitations: ['Brittle under heavy shock', 'Low heat resistance (warps above 60°C)'],
      bestProcesses: ['3D Printing', 'Injection Molding']
    }
  ],
  composites: [
    {
      id: 'carbon-fiber-3k',
      name: 'Carbon Fiber (3K Matrix)',
      category: 'Composites',
      strength: 1500,
      strengthRating: 'Extreme High',
      density: 1.55,
      weightRating: 'Ultra Light',
      durability: 98,
      costIndex: 5,
      costDisplay: 'Premium (₹3,000 - ₹6,000 / kg)',
      tempResistance: 250,
      advantages: ['Unmatched strength-to-weight ratio', 'High stiffness & structural rigidity', 'Sleek premium aesthetic'],
      limitations: ['High manufacturing cost', 'Brittle failure mode without warning'],
      bestProcesses: ['Sheet Metal Fabrication', '3D Printing', 'CNC Machining']
    },
    {
      id: 'fiberglass-g10',
      name: 'Fiberglass (G10 / FR4)',
      category: 'Composites',
      strength: 320,
      strengthRating: 'High',
      density: 1.85,
      weightRating: 'Light-Medium',
      durability: 88,
      costIndex: 3,
      costDisplay: 'Moderate (₹400 - ₹700 / kg)',
      tempResistance: 140,
      advantages: ['Excellent electrical insulation', 'High flexural strength', 'Moisture resistant'],
      limitations: ['Abrasive to cutting tools', 'Heavy dust during machining'],
      bestProcesses: ['CNC Machining', 'Laser Cutting', 'Casting']
    }
  ]
};

const MANUFACTURING_PROCESSES = [
  {
    id: 'injection-molding',
    name: 'Injection Molding',
    icon: 'package-check',
    category: 'Plastic',
    bestForQty: '1,000 - 100,000+ units',
    leadTime: '3 - 6 Weeks',
    accuracy: '± 0.05 mm',
    surfaceFinish: 'Ra 0.4 - 3.2 µm (Smooth / Polished)',
    unitCostFactor: 0.2,
    initialToolingCost: 'High (₹1,500,000+)',
    suitability: 96,
    description: 'Molten polymer injected into precision steel or aluminum molds. Ideal for mass production of complex plastic parts with exceptional surface quality and repeatability.',
    benefits: ['Extremely low per-unit cost at volume', 'High repeatability & fine detail', 'Minimal material scrap waste'],
    suitableMaterials: ['ABS Plastic', 'Polycarbonate (PC)', 'Nylon PA66', 'Polypropylene (PP)', 'PLA'],
    applications: ['Consumer electronics housings', 'Automotive interior panels', 'Medical syringe bodies', 'Helmets & enclosures'],
    industries: ['Automotive', 'Consumer Goods', 'Medical Devices', 'Electronics'],
    advantages: ['High production speed & throughput', 'Excellent dimensional repeatability', 'Good surface finish direct from mold', 'Lowest unit cost for mass production'],
    limitations: ['High initial tooling & mold cost', 'Longer setup & tooling lead time', 'Not economical for low-volume prototypes'],
    machineTypes: ['Hydraulic Injection Press', 'Electric Servo Injection Machine', 'Multi-shot Co-injection Molding Machine'],
    typicalVolume: '5,000 to 500,000+ Units'
  },
  {
    id: 'cnc-machining',
    name: 'CNC Machining',
    icon: 'cpu',
    category: 'High Precision',
    bestForQty: '1 - 1,000 units',
    leadTime: '3 - 7 Days',
    accuracy: '± 0.01 mm',
    surfaceFinish: 'Ra 0.8 - 1.6 µm (Precision Machined)',
    unitCostFactor: 1.2,
    initialToolingCost: 'Zero / Minimal',
    suitability: 90,
    description: 'Subtractive computer-controlled milling, turning, and drilling directly from solid billet metal or plastic blocks.',
    benefits: ['Tightest engineering tolerances', 'No mold tooling cost required', 'Compatible with almost all metals & polymers'],
    suitableMaterials: ['Aluminium 6061-T6', 'Stainless Steel 316L', 'Titanium Ti-6Al-4V', 'Copper C11000', 'POM Acetal'],
    applications: ['Aerospace structural brackets', 'Custom medical implants', 'Engine blocks & turbomachinery', 'Precision prototypes'],
    industries: ['Aerospace', 'Medical Equipment', 'Robotics', 'Automotive'],
    advantages: ['Extreme micron-level precision', 'Zero initial tooling delay', 'Wide material compatibility', 'Great for complex prismatic geometries'],
    limitations: ['Higher per-unit cost at high volumes', 'Subtractive material waste', 'Tool path accessibility limits internal features'],
    machineTypes: ['5-Axis CNC Machining Center', 'CNC Turning Lathe', 'Horizontal Milling Center'],
    typicalVolume: '1 to 2,500 Units'
  },
  {
    id: '3d-printing',
    name: '3D Printing (Additive)',
    icon: 'box',
    category: 'Prototype',
    bestForQty: '1 - 100 units',
    leadTime: '24 - 48 Hours',
    accuracy: '± 0.1 - 0.2 mm',
    surfaceFinish: 'Ra 3.2 - 12.5 µm (Layered Texture)',
    unitCostFactor: 1.5,
    initialToolingCost: 'Zero Tooling',
    suitability: 84,
    description: 'Layer-by-layer additive manufacturing (FDM, SLS, SLA, DMLS) directly from 3D CAD geometry.',
    benefits: ['Zero tooling setup lead time', 'Complex internal organic geometries', 'Rapid design iteration'],
    suitableMaterials: ['PLA Plastic', 'Nylon PA12', 'ABS Plastic', 'Photopolymer Resin', 'Titanium Powder'],
    applications: ['Functional prototypes', 'Custom medical orthotics', 'Lightweight lattice drone parts', 'Architectural mockups'],
    industries: ['Product R&D', 'Healthcare', 'Aerospace', 'Consumer Goods'],
    advantages: ['Instant setup without tooling', 'Unlimited design freedom for complex voids', 'Ideal for rapid prototyping', 'Low initial investment'],
    limitations: ['Slower production speed per part', 'Layer line anisotropy', 'Higher unit cost for large quantities'],
    machineTypes: ['Industrial SLS Powder Bed Printer', 'FDM Dual Extrusion Printer', 'Stereolithography SLA Printer'],
    typicalVolume: '1 to 500 Units'
  },
  {
    id: 'casting',
    name: 'Casting (Die / Investment)',
    icon: 'flame',
    category: 'Metal',
    bestForQty: '500 - 50,000 units',
    leadTime: '2 - 4 Weeks',
    accuracy: '± 0.1 mm',
    surfaceFinish: 'Ra 1.6 - 6.3 µm (Cast Texture)',
    unitCostFactor: 0.5,
    initialToolingCost: 'Moderate (₹300,000+)',
    suitability: 88,
    description: 'Molten metal poured under pressure into reusable steel dies or sacrificial investment wax molds.',
    benefits: ['High structural strength for metals', 'Ideal for complex structural frames', 'Cost efficient for medium metal batches'],
    suitableMaterials: ['Aluminium A380', 'Zinc Alloys', 'Stainless Steel 316L', 'Brass & Bronze'],
    applications: ['Engine manifolds', 'Gearboxes & pump housings', 'Structural automotive chassis frames', 'Door hardware'],
    industries: ['Automotive', 'Heavy Industrial', 'Marine', 'Power Generation'],
    advantages: ['High structural integrity & strength', 'Economical for large metal parts', 'Capable of wall thickness variations', 'Good surface finish'],
    limitations: ['Porosity risks require quality control', 'Tooling cost higher than sheet metal', 'Longer cooling cycle times'],
    machineTypes: ['High-Pressure Cold Chamber Die Casting Press', 'Vacuum Investment Casting Rig'],
    typicalVolume: '1,000 to 100,000 Units'
  },
  {
    id: 'sheet-metal',
    name: 'Sheet Metal Fabrication',
    icon: 'layers',
    category: 'Metal',
    bestForQty: '10 - 10,000 units',
    leadTime: '3 - 10 Days',
    accuracy: '± 0.1 mm',
    surfaceFinish: 'Natural / Powder Coated (Ra 1.6 µm)',
    unitCostFactor: 0.6,
    initialToolingCost: 'Low Tooling',
    suitability: 92,
    description: 'Precision cutting, punching, bending, and forming flat sheet metal stock into enclosures, chassis, and brackets.',
    benefits: ['Lightweight & strong enclosures', 'Fast setup and quick production turnaround', 'Cost effective sheet material utilization'],
    suitableMaterials: ['Aluminium 5052/6061', 'Stainless Steel 304', 'Mild Steel (CRCA)', 'Copper Sheet'],
    applications: ['Server rack cabinets', 'Control panel boxes', 'Automotive body panels', 'HVAC ducting'],
    industries: ['Telecommunications', 'Electronics', 'Automotive', 'Industrial Equipment'],
    advantages: ['Very fast setup & low tooling cost', 'High strength-to-weight ratio', 'Excellent surface coating compatibility', 'Durable structural frames'],
    limitations: ['Limited to uniform sheet thickness', 'Sharp radius bend limitations', 'Secondary welding needed for closed boxes'],
    machineTypes: ['CNC Hydraulic Press Brake', 'Turret Punch Press', 'Stamping Die Press'],
    typicalVolume: '50 to 25,000 Units'
  },
  {
    id: 'laser-cutting',
    name: 'Laser Cutting',
    icon: 'zap',
    category: 'High Precision',
    bestForQty: '1 - 10,000+ units',
    leadTime: '1 - 3 Days',
    accuracy: '± 0.05 mm',
    surfaceFinish: 'Clean Laser Cut Edge (Ra 1.6 - 3.2 µm)',
    unitCostFactor: 0.4,
    initialToolingCost: 'Zero Tooling',
    suitability: 94,
    description: 'Focused high-power fiber or CO2 laser beam vaporizing stock material along CNC vector paths.',
    benefits: ['High speed precision cut edges', 'No physical tool contact or wear', 'Ideal for 2D profiles & complex flat contours'],
    suitableMaterials: ['Stainless Steel 304/316', 'Aluminium 6061', 'Acrylic (PMMA)', 'Carbon Steel', 'Brass'],
    applications: ['Gaskets & shims', 'Decorative grilles & facades', 'Custom mounting plates', 'PCB stencil frames'],
    industries: ['Architecture', 'Electronics', 'Automotive', 'Signage & Display'],
    advantages: ['Burr-free precision cut edges', 'Zero mechanical tool contact', 'Rapid setup with minimal material waste', 'High nesting efficiency'],
    limitations: ['Limited to flat 2D sheet geometries', 'Heat affected zone (HAZ) on thick metals', 'Higher energy consumption'],
    machineTypes: ['Fiber Laser Cutting System (6kW-12kW)', 'CO2 Laser Cutter'],
    typicalVolume: '1 to 50,000 Units'
  }
];

const MATERIAL_COMPATIBILITY_DATA = [
  {
    name: 'ABS Plastic',
    category: 'Plastic',
    starRating: 5,
    strength: 'Medium (45 MPa)',
    costLevel: 'Low (₹150/kg)',
    heatResistance: '85°C',
    manufacturability: '98%',
    description: 'Top choice for injection molding and 3D printing; high impact resistance.'
  },
  {
    name: 'PLA Plastic',
    category: 'Plastic',
    starRating: 4,
    strength: 'Medium-Low (50 MPa)',
    costLevel: 'Low (₹180/kg)',
    heatResistance: '60°C',
    manufacturability: '92%',
    description: 'Eco-friendly biodegradable polymer, ideal for rapid prototyping.'
  },
  {
    name: 'Nylon PA66',
    category: 'Plastic',
    starRating: 5,
    strength: 'High (85 MPa)',
    costLevel: 'Moderate (₹300/kg)',
    heatResistance: '160°C',
    manufacturability: '94%',
    description: 'Self-lubricating engineering polymer with great wear resistance.'
  },
  {
    name: 'Polycarbonate (PC)',
    category: 'Plastic',
    starRating: 4.5,
    strength: 'High (70 MPa)',
    costLevel: 'Moderate (₹280/kg)',
    heatResistance: '120°C',
    manufacturability: '90%',
    description: 'Virtually unbreakable transparent thermoplastic for safety housings.'
  },
  {
    name: 'Aluminum 6061-T6',
    category: 'Metal',
    starRating: 5,
    strength: 'Very High (310 MPa)',
    costLevel: 'Moderate (₹250/kg)',
    heatResistance: '150°C',
    manufacturability: '96%',
    description: 'Lightweight structural metal alloy with supreme CNC machinability.'
  },
  {
    name: 'Stainless Steel 316L',
    category: 'Metal',
    starRating: 4.5,
    strength: 'Ultra High (580 MPa)',
    costLevel: 'High (₹450/kg)',
    heatResistance: '800°C',
    manufacturability: '88%',
    description: 'Corrosion-resistant medical & marine grade steel for high-stress applications.'
  }
];

const ALTERNATIVE_METHODS_DATA = [
  { name: 'Forging', icon: 'hammer', accuracy: '± 0.2 mm', bestFor: 'High stress structural cranks & shafts' },
  { name: 'Extrusion', icon: 'arrow-right-left', accuracy: '± 0.1 mm', bestFor: 'Constant cross-section aluminum channels' },
  { name: 'Blow Molding', icon: 'wind', accuracy: '± 0.3 mm', bestFor: 'Hollow bottles & liquid tanks' },
  { name: 'Compression Molding', icon: 'minimize-2', accuracy: '± 0.15 mm', bestFor: 'Rubber gaskets & thermoset composite panels' },
  { name: 'Vacuum Forming', icon: 'maximize', accuracy: '± 0.5 mm', bestFor: 'Large thin-wall packaging trays & blisters' },
  { name: 'Water Jet Cutting', icon: 'droplet', accuracy: '± 0.08 mm', bestFor: 'Thick heat-sensitive metal & stone slabs' },
  { name: 'EDM (Wire & Sinker)', icon: 'zap', accuracy: '± 0.005 mm', bestFor: 'Hardened tool steel molds & micro dies' },
  { name: 'Die Casting', icon: 'flame', accuracy: '± 0.05 mm', bestFor: 'High volume complex zinc & aluminum components' }
];

const COST_BREAKDOWN_ITEMS = [
  { name: 'Material Cost', val: '₹320', percent: 40, color: '#00f2fe' },
  { name: 'Machine Cost', val: '₹240', percent: 30, color: '#4facfe' },
  { name: 'Labor Cost', val: '₹96', percent: 12, color: '#10b981' },
  { name: 'Tooling Amortization', val: '₹80', percent: 10, color: '#7928ca' },
  { name: 'Finishing Cost', val: '₹40', percent: 5, color: '#f59e0b' },
  { name: 'Packaging & Logistics', val: '₹24', percent: 3, color: '#c084fc' }
];

const QUALITY_PREDICTION_ITEMS = [
  { name: 'Surface Finish', score: 92, color: '#00f2fe' },
  { name: 'Dimensional Accuracy', score: 96, color: '#10b981' },
  { name: 'Mechanical Strength', score: 88, color: '#4facfe' },
  { name: 'Product Durability', score: 94, color: '#7928ca' },
  { name: 'Overall Quality Score', score: 93, color: '#c084fc' }
];

const AI_MANUFACTURING_TIPS = [
  'Reduce wall thickness to 2.0mm–3.5mm to avoid sink marks and reduce cycle time.',
  'Add 1° to 2° draft angles on vertical ribs to facilitate easy mold ejection.',
  'Increase internal corner radii (minimum R 1.0mm) to relieve stress concentrations.',
  'Reduce unnecessary cosmetic features and deep pockets to lower CNC machining hours.',
  'Use standard drill hole sizes to avoid custom tooling reamers.',
  'Optimize nested sheet layout geometry to maximize material utilization above 90%.'
];

const ADVANTAGES_LIMITATIONS_DATA = {
  advantages: [
    'High production speed & automated cycle throughput',
    'Excellent unit-to-unit dimensional repeatability',
    'Smooth high-grade surface finish direct from mold tool',
    'Exponentially lower unit cost for mass production (>5,000 units)'
  ],
  limitations: [
    'High initial tooling setup and mold fabrication investment',
    'Longer setup lead time (3-6 weeks for hardened steel mold)',
    'Less suitable for rapid prototype iterations below 500 units'
  ]
};

const PRODUCTION_TIMELINE_STEPS = [
  { title: 'Design Review', desc: 'DFM & CAD clearance', status: 'Completed', icon: 'file-check-2' },
  { title: 'Material Selection', desc: 'Polymer & Alloy grade', status: 'Completed', icon: 'flask-conical' },
  { title: 'Process Selection', desc: 'Injection / CNC mapping', status: 'Active', icon: 'cog' },
  { title: 'Tooling', desc: 'Mold & Die machining', status: 'Upcoming', icon: 'wrench' },
  { title: 'Manufacturing', desc: 'Production run', status: 'Upcoming', icon: 'factory' },
  { title: 'Delivery', desc: 'Logistics dispatch', status: 'Upcoming', icon: 'truck' }
];

const PREVIOUS_PROJECTS = [
  {
    id: 'proj-001',
    name: 'Smart Helmet Shell & Visor',
    type: 'Consumer Product',
    date: '2026-07-25',
    material: 'ABS Plastic',
    process: 'Injection Molding',
    costRange: '₹500 - ₹900',
    unitCost: 720,
    efficiency: 88,
    score: 8.5,
    strengthScore: 82,
    sustainabilityScore: 75,
    manufacturabilityScore: 92,
    dimensions: { length: 280, width: 220, height: 180, weight: 850, unit: 'mm' },
    quantity: 5000,
    description: 'Lightweight impact-resistant smart protective helmet with integrated Bluetooth & LED telemetry.'
  },
  {
    id: 'proj-002',
    name: 'Medical Syringe Pump Chassis',
    type: 'Medical Equipment',
    date: '2026-07-18',
    material: 'Titanium Ti-6Al-4V',
    process: 'CNC Machining',
    costRange: '₹12,000 - ₹18,000',
    unitCost: 14500,
    efficiency: 94,
    score: 9.2,
    strengthScore: 98,
    sustainabilityScore: 80,
    manufacturabilityScore: 89,
    dimensions: { length: 150, width: 100, height: 80, weight: 420, unit: 'mm' },
    quantity: 250,
    description: 'Sterile high-precision titanium enclosure for critical hospital IV infusion pump modules.'
  },
  {
    id: 'proj-003',
    name: 'Autonomous Drone Frame',
    type: 'Aerospace & Robotics',
    date: '2026-07-10',
    material: 'Carbon Fiber (3K Matrix)',
    process: '3D Printing',
    costRange: '₹2,500 - ₹4,000',
    unitCost: 3200,
    efficiency: 90,
    score: 8.8,
    strengthScore: 96,
    sustainabilityScore: 70,
    manufacturabilityScore: 85,
    dimensions: { length: 350, width: 350, height: 60, weight: 310, unit: 'mm' },
    quantity: 100,
    description: 'Ultra-lightweight high-rigidity Quadcopter drone arm assembly for heavy payload operations.'
  },
  {
    id: 'proj-004',
    name: 'EV Battery Thermal Plate',
    type: 'Automotive EV',
    date: '2026-06-28',
    material: 'Aluminium 6061-T6',
    process: 'Sheet Metal Fabrication',
    costRange: '₹1,200 - ₹2,200',
    unitCost: 1650,
    efficiency: 91,
    score: 9.0,
    strengthScore: 85,
    sustainabilityScore: 88,
    manufacturabilityScore: 94,
    dimensions: { length: 500, width: 400, height: 12, weight: 1400, unit: 'mm' },
    quantity: 2500,
    description: 'High heat dissipation cooling manifold plate for electric vehicle battery pack heat exchange.'
  },
  {
    id: 'proj-005',
    name: 'Aerospace Jet Engine Impeller',
    type: 'Aerospace & Defense',
    date: '2026-06-15',
    material: 'Inconel 718 Alloy',
    process: 'CNC Machining',
    costRange: '₹35,000 - ₹50,000',
    unitCost: 42000,
    efficiency: 95,
    score: 9.6,
    strengthScore: 99,
    sustainabilityScore: 72,
    manufacturabilityScore: 84,
    dimensions: { length: 220, width: 220, height: 140, weight: 2800, unit: 'mm' },
    quantity: 50,
    description: '5-Axis CNC milled high-temperature nickel superalloy turbomachinery compressor impeller.'
  },
  {
    id: 'proj-006',
    name: 'Robotic Arm Joint Housing',
    type: 'Industrial Automation',
    date: '2026-06-02',
    material: 'Aluminium 7075-T6',
    process: 'Casting',
    costRange: '₹4,500 - ₹7,000',
    unitCost: 5800,
    efficiency: 89,
    score: 8.9,
    strengthScore: 93,
    sustainabilityScore: 85,
    manufacturabilityScore: 91,
    dimensions: { length: 190, width: 160, height: 130, weight: 1150, unit: 'mm' },
    quantity: 1200,
    description: 'High-torque articulated robot elbow joint casing engineered for 6-DOF industrial cobots.'
  },
  {
    id: 'proj-007',
    name: 'Orthopedic Hip Joint Implant',
    type: 'Biomedical Implants',
    date: '2026-05-20',
    material: 'Titanium Ti-6Al-4V ELI',
    process: '3D Printing',
    costRange: '₹45,000 - ₹65,000',
    unitCost: 52000,
    efficiency: 97,
    score: 9.7,
    strengthScore: 98,
    sustainabilityScore: 78,
    manufacturabilityScore: 88,
    dimensions: { length: 140, width: 70, height: 50, weight: 290, unit: 'mm' },
    quantity: 20,
    description: 'Patient-customized 3D DMLS printed porous trabecular titanium femoral stem implant.'
  },
  {
    id: 'proj-008',
    name: 'Industrial Gearbox Casing',
    type: 'Heavy Machinery',
    date: '2026-05-08',
    material: 'Ductile Cast Iron',
    process: 'Casting',
    costRange: '₹8,000 - ₹14,000',
    unitCost: 9500,
    efficiency: 87,
    score: 8.6,
    strengthScore: 94,
    sustainabilityScore: 90,
    manufacturabilityScore: 95,
    dimensions: { length: 650, width: 480, height: 380, weight: 18500, unit: 'mm' },
    quantity: 800,
    description: 'Heavy duty sand-cast vibration damping gear reducer housing for wind turbine drives.'
  },
  {
    id: 'proj-009',
    name: 'Performance Brake Caliper',
    type: 'Automotive Racing',
    date: '2026-04-24',
    material: 'Forged Aluminium 6061',
    process: 'CNC Machining',
    costRange: '₹15,000 - ₹24,000',
    unitCost: 18200,
    efficiency: 93,
    score: 9.3,
    strengthScore: 97,
    sustainabilityScore: 82,
    manufacturabilityScore: 90,
    dimensions: { length: 240, width: 180, height: 110, weight: 2200, unit: 'mm' },
    quantity: 400,
    description: 'Monoblock 6-piston high thermal capacity racing brake caliper body.'
  },
  {
    id: 'proj-010',
    name: 'Solar Panel Mounting Bracket',
    type: 'Renewable Energy',
    date: '2026-04-12',
    material: 'Galvanized Structural Steel',
    process: 'Laser Cutting',
    costRange: '₹350 - ₹600',
    unitCost: 450,
    efficiency: 92,
    score: 8.7,
    strengthScore: 88,
    sustainabilityScore: 94,
    manufacturabilityScore: 98,
    dimensions: { length: 400, width: 120, height: 80, weight: 950, unit: 'mm' },
    quantity: 50000,
    description: 'Corrosion resistant high-speed fiber laser cut rooftop solar racking bracket.'
  },
  {
    id: 'proj-011',
    name: 'Smart Watch Protective Case',
    type: 'Consumer Electronics',
    date: '2026-03-30',
    material: 'Polycarbonate (PC)',
    process: 'Injection Molding',
    costRange: '₹120 - ₹250',
    unitCost: 180,
    efficiency: 89,
    score: 8.4,
    strengthScore: 80,
    sustainabilityScore: 78,
    manufacturabilityScore: 96,
    dimensions: { length: 48, width: 42, height: 14, weight: 28, unit: 'mm' },
    quantity: 100000,
    description: 'High optical clarity shatterproof water-resistant smartwatch outer bezel bumper.'
  },
  {
    id: 'proj-012',
    name: 'Underwater ROV Thruster Nozzle',
    type: 'Marine Engineering',
    date: '2026-03-14',
    material: 'Polypropylene (PP)',
    process: '3D Printing',
    costRange: '₹1,800 - ₹3,200',
    unitCost: 2400,
    efficiency: 91,
    score: 9.0,
    strengthScore: 86,
    sustainabilityScore: 84,
    manufacturabilityScore: 92,
    dimensions: { length: 180, width: 180, height: 160, weight: 480, unit: 'mm' },
    quantity: 150,
    description: 'Hydrodynamic duct nozzle for deep-sea subsea remotely operated vehicle propulsion.'
  }
];

const DYNAMIC_PROCESS_TIPS = {
  'injection-molding': [
    'Reduce wall thickness to 2.0mm–3.5mm to eliminate sink marks.',
    'Add 1° to 2° draft angles on vertical walls for smooth mold release.',
    'Choose standard dimensions to lower mold tooling costs.',
    'Avoid sharp internal corners; add minimum R 1.0mm fillet radius.',
    'Use lightweight plastics like ABS or PP where structural loads permit.'
  ],
  'cnc-machining': [
    'Avoid sharp internal right-angle corners; use standard tool radii.',
    'Choose standard stock billet dimensions to minimize machining time.',
    'Reduce deep narrow pocket depths (>4x tool diameter) to prevent tool chatter.',
    'Avoid unnecessary thin walls (<1.5mm) that flex during milling.',
    'Use lightweight Aluminium 6061-T6 for optimal strength-to-weight ratio.'
  ],
  '3d-printing': [
    'Optimize interior infill density (20%-30% lattice) to reduce material usage.',
    'Avoid unsupported overhang angles steeper than 45° to minimize support structures.',
    'Choose standard orientation for maximum Z-axis tensile strength.',
    'Round sharp exterior edges to prevent stress concentrations during layer deposition.',
    'Use lightweight PLA or Nylon PA12 for rapid prototyping.'
  ],
  'casting': [
    'Maintain uniform wall thickness throughout the casting geometry.',
    'Avoid sharp corners to prevent shrinkage cracking during cooling.',
    'Add generous draft angles (1.5°–3°) for clean mold separation.',
    'Use lightweight aluminum alloys to lower transport and component weight.',
    'Choose standard core dimensions to simplify mold box setup.'
  ],
  'sheet-metal': [
    'Maintain uniform sheet thickness across all bent surfaces.',
    'Keep bend radii equal to or greater than the material thickness.',
    'Place holes at least 2x sheet thickness away from bend lines.',
    'Avoid sharp notch corners; use circular relief cuts at bend intersections.',
    'Optimize nested sheet nesting layouts to reduce scrap waste above 90%.'
  ],
  'laser-cutting': [
    'Keep feature sizes larger than the sheet thickness for clean laser cuts.',
    'Avoid sharp internal cut corners; add small radii to avoid heat stress.',
    'Choose standard metal/plastic sheet stock gauges to cut material costs.',
    'Optimize part spacing (minimum 1x sheet thickness) during nesting.',
    'Use lightweight acrylic or aluminum sheets to save shipping weight.'
  ]
};

const HELP_TERMS_DATA = {
  'Manufacturing Process': 'The shaping or fabrication technique (e.g. Injection Molding, CNC Machining, 3D Printing) used to produce raw parts from engineering stock.',
  'Lead Time': 'The total calendar duration required from final CAD file approval to initial product delivery, including tooling setup.',
  'Surface Finish': 'The microscopic texture of the part surface measured in roughness average (Ra µm). Lower Ra values indicate smoother polish.',
  'Tolerance': 'The allowable variation in physical dimensions (e.g. ± 0.05 mm) from nominal CAD measurements required for proper fit.',
  'Tooling Cost': 'The upfront non-recurring engineering (NRE) cost for steel mold dies, casting patterns, or CNC custom holding fixtures.'
};

window.METHODWISE_DATA = {
  MATERIALS: MATERIALS_DATA,
  PROCESSES: MANUFACTURING_PROCESSES,
  PROJECTS: PREVIOUS_PROJECTS,
  MATERIAL_COMPATIBILITY: MATERIAL_COMPATIBILITY_DATA,
  ALTERNATIVE_METHODS: ALTERNATIVE_METHODS_DATA,
  COST_BREAKDOWN: COST_BREAKDOWN_ITEMS,
  QUALITY_PREDICTION: QUALITY_PREDICTION_ITEMS,
  AI_TIPS: AI_MANUFACTURING_TIPS,
  ADVANTAGES_LIMITATIONS: ADVANTAGES_LIMITATIONS_DATA,
  PRODUCTION_TIMELINE: PRODUCTION_TIMELINE_STEPS,
  DYNAMIC_TIPS: DYNAMIC_PROCESS_TIPS,
  HELP_TERMS: HELP_TERMS_DATA
};


