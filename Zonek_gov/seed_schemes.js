const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://127.0.0.1:27017/zonek_gov';

const schemes = [
  {
    schemeId: 'SME-001',
    schemeName: 'PMEGP - Prime Minister Employment Generation Programme',
    ministry: 'Ministry of MSME',
    category: 'Business',
    tags: ['entrepreneur', 'startup', 'loan', 'subsidy'],
    isNational: true,
    applicableStates: [],
    description: 'A major credit-linked subsidy program aimed at generating self-employment opportunities through establishment of micro-enterprises in the non-farm sector.',
    benefit: { type: 'subsidy', amount: 2500000, description: 'Margin money subsidy of 15% to 35% on projects up to 50 Lakhs.' },
    source: 'myscheme.gov.in',
    fetchedAt: new Date()
  },
  {
    schemeId: 'SME-002',
    schemeName: 'Mudra Loan (Shishu, Kishore, Tarun)',
    ministry: 'Ministry of Finance',
    category: 'Business',
    tags: ['loan', 'credit', 'startup', 'business'],
    isNational: true,
    applicableStates: [],
    description: 'Pradhan Mantri MUDRA Yojana (PMMY) provides loans up to 10 lakh to the non-corporate, non-farm small/micro enterprises.',
    benefit: { type: 'loan', amount: 1000000, description: 'Collateral free loans up to 10 Lakhs.' },
    source: 'myscheme.gov.in',
    fetchedAt: new Date()
  },
  {
    schemeId: 'SME-003',
    schemeName: 'Stand Up India',
    ministry: 'Ministry of Finance',
    category: 'Business',
    tags: ['sc', 'st', 'women', 'startup', 'business'],
    isNational: true,
    applicableStates: [],
    description: 'Facilitating bank loans between 10 lakh and 1 Crore to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) borrower and at least one woman borrower per bank branch.',
    benefit: { type: 'loan', amount: 10000000, description: 'Bank loans between 10 Lakhs and 1 Crore.' },
    source: 'myscheme.gov.in',
    fetchedAt: new Date()
  },
  {
    schemeId: 'TN-001',
    schemeName: 'NEEDs - New Entrepreneur cum Enterprise Development Scheme',
    ministry: 'MSME Department, Tamil Nadu',
    category: 'Business',
    tags: ['tamil nadu', 'startup', 'subsidy', 'entrepreneur'],
    isNational: false,
    applicableStates: ['Tamil Nadu'],
    description: 'Assisting educated youth to become entrepreneurs by providing training and capital subsidy for starting new industries/service enterprises.',
    benefit: { type: 'subsidy', amount: 3000000, description: '25% Capital Subsidy up to 30 Lakhs.' },
    source: 'tn.gov.in',
    fetchedAt: new Date()
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    const Scheme = mongoose.connection.db.collection('schemes');
    
    for (const s of schemes) {
      await Scheme.findOneAndUpdate({ schemeId: s.schemeId }, { $set: s }, { upsert: true });
    }
    
    console.log('Schemes seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
