export type StudyMethod = {
  id: string
  name: string
  summary: string
  howAIUsesIt: string
  evidenceStatus: string
  source: {
    title: string
    authors: string
    university: string
    year: number | null
    url: string
  }
}

// A method appears in God mode only when its url is filled in.
export const METHODS: StudyMethod[] = [
  {
    id: 'strategic-learning-002',
    name: 'Strategic learning choice',
    summary: 'Choose study strategies deliberately, then check whether they actually improved performance.',
    howAIUsesIt: 'Before studying, ask what gap the student is filling and which strategy fits it. Afterwards, compare how confident they feel with how they performed.',
    evidenceStatus: 'VERIFIED_PEER_REVIEWED',
    source: { title: 'Investigating Choice of and Perceived Efficacy of Learning Strategies Used by STEM Students', authors: 'Luotong Hui; Iro Ntonia; Anique B. H. de Bruin; Michael F. J. Fox; Magda Charalambous', university: 'Imperial College London', year: 2026, url: 'https://doi.org/10.3390/educsci16030415' },
  },
  {
    id: 'strategic-resource-use-003',
    name: 'Strategic resource use',
    summary: 'Reflecting on your goal and knowledge gap before choosing a resource improves academic performance.',
    howAIUsesIt: 'Ask the student to name the knowledge gap and choose one resource for it, then judge whether it worked.',
    evidenceStatus: 'VERIFIED_PEER_REVIEWED',
    source: { title: 'Strategic Resource Use for Learning: A Self-Administered Intervention That Guides Self-Reflection on Effective Resource Use Enhances Academic Performance', authors: 'Patricia Chen; Omar Chavez; Desmond C. Ong; Brenda Gunderson', university: 'Stanford University', year: 2017, url: 'https://doi.org/10.1177/0956797617696456' },
  },
  {
    id: 'active-learning-005',
    name: 'Active learning',
    summary: 'Actively solving and explaining problems can produce more learning than passive reading, even when it feels less smooth.',
    howAIUsesIt: 'Have the student solve or explain first. Judge progress by performance, not by how easy it feels. This evidence comes from one introductory physics setting, so do not overgeneralize.',
    evidenceStatus: 'VERIFIED_PEER_REVIEWED',
    source: { title: 'Measuring Actual Learning Versus Feeling of Learning in Response to Being Actively Engaged in the Classroom', authors: 'Louis Deslauriers; Logan S. McCarty; Kelly Miller; Kristina Callaghan; Greg Kestin', university: 'Harvard University', year: 2019, url: 'https://doi.org/10.1073/pnas.1821936116' },
  },
  {
    id: 'productive-failure-008',
    name: 'Productive failure',
    summary: 'Attempting a challenging problem before instruction, then receiving feedback, can support learning.',
    howAIUsesIt: 'Ask the student to attempt the problem first and note where they got stuck. Then give feedback and a similar problem.',
    evidenceStatus: 'VERIFIED_PEER_REVIEWED',
    source: { title: 'When Problem Solving Followed by Instruction Works: Evidence for Productive Failure', authors: 'Tanmay Sinha; Manu Kapur', university: 'ETH Zurich', year: 2021, url: 'https://doi.org/10.3102/00346543211019105' },
  },
  {
    id: 'advanced-retrieval-010',
    name: 'Retrieval with attention direction',
    summary: 'Directing attention during retrieval practice, and using recall to build arguments, improves learning beyond passive review.',
    howAIUsesIt: 'Ask the student to recall the key ideas without notes, then identify what they missed and build an argument from what they recall.',
    evidenceStatus: 'VERIFIED_PEER_REVIEWED',
    source: { title: "From JOLs to JOLs+: Directing Learners' Attention in Retrieval Practice to Boost Integrative Argumentation", authors: 'Sarah Shi Hui Wong; Stephen Wee Hun Lim', university: 'National University of Singapore', year: 2019, url: 'https://doi.org/10.1037/xap0000225' },
  },
  {
    id: 'spaced-interleaved-001',
    name: 'Spaced and interleaved practice',
    summary: 'Spacing study over time and mixing related problem types builds the ability to choose the right method.',
    howAIUsesIt: 'Revisit the topic after a delay. Once the basic method is clear, mix in related problem types.',
    evidenceStatus: 'PENDING_VERIFICATION',
    source: { title: 'Spaced and Interleaved Practice', authors: 'MIT Open Learning', university: 'Massachusetts Institute of Technology', year: null, url: '' },
  },
  {
    id: 'contextual-retrieval-004',
    name: 'Contextual retrieval',
    summary: 'Retrieving and spacing practice across varied examples and contexts supports learning.',
    howAIUsesIt: 'Ask the student to recall the same idea in different contexts and at spaced intervals.',
    evidenceStatus: 'PENDING_VERIFICATION',
    source: { title: 'Contextual Diversity, Spacing and Retrieval Effects in Adult Learning', authors: 'Not yet verified', university: 'University of Oxford', year: null, url: '' },
  },
  {
    id: 'retrieval-culture-006',
    name: 'Retrieval culture',
    summary: 'Regular low-stakes quizzes and cumulative recall strengthen long-term retention.',
    howAIUsesIt: 'Close the notes and ask for recall. Correct the gaps, then retest later.',
    evidenceStatus: 'PENDING_VERIFICATION',
    source: { title: 'Establishing Retrieval Practice as a Learning Culture', authors: 'Not yet verified', university: 'University of Cambridge', year: null, url: '' },
  },
  {
    id: 'elaboration-dual-coding-009',
    name: 'Elaboration and dual coding',
    summary: 'Explaining ideas in your own words, connected to prior knowledge, and pairing them with meaningful diagrams supports learning.',
    howAIUsesIt: 'Ask the student to explain the idea in their own words and connect it to something they already know. Suggest a diagram only where it shows a relationship.',
    evidenceStatus: 'PENDING_VERIFICATION',
    source: { title: 'Four Design Principles for Student Learning of Substantive Historical Concepts: A Realistic Review Study', authors: 'Wouter Smets', university: 'University College London', year: 2024, url: '' },
  },
  {
    id: 'neural-memory-encoding-007',
    name: 'Memory mechanisms (background)',
    summary: 'Background on how memories form and persist. Not a study protocol.',
    howAIUsesIt: 'Not used for teaching. Kept as background only.',
    evidenceStatus: 'EXCLUDED_BACKGROUND',
    source: { title: 'Persistence of Neuronal Representations Through Time and Damage in the Hippocampus', authors: 'Walter G. Gonzalez; Hanwen Zhang; Anna Harutyunyan; Carlos Lois', university: 'California Institute of Technology', year: 2019, url: '' },
  },
]

export function getReadyMethods() {
  return METHODS.filter(m => m.source.url.trim() !== '')
}

export function getMethodById(id: string) {
  return METHODS.find(m => m.id === id)
}
