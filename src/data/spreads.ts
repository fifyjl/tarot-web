export interface SpreadPosition {
  index: number;
  name: string;
  meaning: string;
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  isAdvanced?: boolean;
  positions: SpreadPosition[];
  keywords: string[];
}

export const SPREADS: Spread[] = [
  {
    id: 'single',
    name: '单牌占卜',
    description: '抽取一张牌，获得对问题最直接、最核心的指引。适合快速获取当下的能量状态或简单问题的启示。',
    cardCount: 1,
    positions: [
      { index: 0, name: '核心指引', meaning: '代表问题最核心的答案和当下的能量状态' },
    ],
    keywords: ['快速', '核心', '现状', '指引', '能量'],
  },
  {
    id: 'three',
    name: '圣三角牌阵',
    description: '三张牌分别代表过去、现在、未来，揭示问题的时间流向和发展趋势。适合看清事件的发展脉络。',
    cardCount: 3,
    positions: [
      { index: 0, name: '过去', meaning: '揭示问题的根源、过往的影响和已经发生的事情' },
      { index: 1, name: '现在', meaning: '代表当前的状况、面临的挑战和当下的能量' },
      { index: 2, name: '未来', meaning: '预示事情的发展趋势、可能的结果和即将到来的能量' },
    ],
    keywords: ['时间', '发展', '趋势', '过去', '现在', '未来', '感情', '事业'],
  },
  {
    id: 'choice',
    name: '二选一牌阵',
    description: '四张牌帮助你权衡两个选择，看清每个选项的优势与挑战，做出最符合内心的决定。',
    cardCount: 4,
    positions: [
      { index: 0, name: '现状', meaning: '代表你当前面对的整体状况和能量状态' },
      { index: 1, name: '选择A', meaning: '揭示第一个选择带来的结果和影响' },
      { index: 2, name: '选择B', meaning: '揭示第二个选择带来的结果和影响' },
      { index: 3, name: '建议', meaning: '综合建议，帮助你做出最符合内心的决定' },
    ],
    keywords: ['选择', '决策', '二选一', '比较', '建议', '工作', '感情', '学业'],
  },
  {
    id: 'hexagram',
    name: '六芒星牌阵',
    description: '六张牌深入揭示问题的六个维度：过去、现在、未来、原因、环境、建议。适合对复杂问题进行全方位解析。',
    cardCount: 6,
    isAdvanced: true,
    positions: [
      { index: 0, name: '过去', meaning: '问题的历史根源和已经发生的因素' },
      { index: 1, name: '现在', meaning: '当前面临的实际状况和挑战' },
      { index: 2, name: '未来', meaning: '事情发展的可能方向和结果' },
      { index: 3, name: '原因', meaning: '隐藏在表象之下的深层原因' },
      { index: 4, name: '环境', meaning: '外部环境和他人对这件事的影响' },
      { index: 5, name: '建议', meaning: '综合所有信息后的行动建议' },
    ],
    keywords: ['深入', '全面', '复杂', '原因', '环境', '感情', '事业', '趋势', '健康'],
  },
  {
    id: 'celtic',
    name: '凯尔特十字',
    description: '最经典的十张牌阵，全面解析问题的现状、阻碍、基础、过去、未来、自我、环境、希望、结果和指引。适合任何重大问题的深度占卜。',
    cardCount: 10,
    isAdvanced: true,
    positions: [
      { index: 0, name: '现状', meaning: '代表你当前面对的核心状况和能量' },
      { index: 1, name: '阻碍', meaning: '横在你面前的障碍和挑战' },
      { index: 2, name: '基础', meaning: '问题的根基和深层基础' },
      { index: 3, name: '过去', meaning: '已经发生的事情对现在的影响' },
      { index: 4, name: '未来', meaning: '事情发展的可能走向和近期变化' },
      { index: 5, name: '自我', meaning: '你在这个问题中的态度、信念和角色' },
      { index: 6, name: '环境', meaning: '外部环境、他人和形势对你的影响' },
      { index: 7, name: '希望', meaning: '你内心的希望、恐惧和期待' },
      { index: 8, name: '结果', meaning: '如果按照当前趋势发展的最终结果' },
      { index: 9, name: '指引', meaning: '宇宙给你的终极指引和建议' },
    ],
    keywords: ['全面', '深度', '重大', '经典', '感情', '事业', '财富', '健康', '趋势'],
  },
];

const SPREAD_MATCH_PATTERNS: { keywords: string[]; spreadIds: string[] }[] = [
  {
    keywords: ['感情', '爱情', '恋爱', '婚姻', '分手', '复合', '桃花', '对象', '姻缘', '情侣', '他', '她', '对方'],
    spreadIds: ['three', 'choice', 'hexagram', 'celtic'],
  },
  {
    keywords: ['事业', '工作', '职场', '升职', '跳槽', '创业', '项目', '领导', '同事', '面试', 'offer', '职业', '发展'],
    spreadIds: ['three', 'choice', 'hexagram', 'celtic'],
  },
  {
    keywords: ['财富', '钱', '财运', '投资', '理财', '收入', '工资', '赚钱', '生意', '股票', '基金', '经济', '财务'],
    spreadIds: ['three', 'hexagram', 'celtic'],
  },
  {
    keywords: ['学业', '考试', '学习', '学校', '录取', '成绩', '考研', '留学', '论文', '专业', '毕业', '升学'],
    spreadIds: ['single', 'three', 'choice', 'hexagram'],
  },
  {
    keywords: ['健康', '身体', '疾病', '生病', '康复', '体检', '症状', '医院', '医生', '养生'],
    spreadIds: ['single', 'three', 'hexagram'],
  },
  {
    keywords: ['选择', '抉择', '二选一', '选哪个', '决定', '怎么办', '要不要', '是否', '该'],
    spreadIds: ['choice', 'celtic', 'hexagram'],
  },
  {
    keywords: ['趋势', '发展', '走向', '结果', '未来', '会怎样', '如何', '前景'],
    spreadIds: ['three', 'hexagram', 'celtic'],
  },
];

export function matchSpreads(question: string): Spread[] {
  const q = question.toLowerCase();
  const matchedIds = new Set<string>();

  for (const pattern of SPREAD_MATCH_PATTERNS) {
    const hasMatch = pattern.keywords.some((kw) => q.includes(kw));
    if (hasMatch) {
      for (const id of pattern.spreadIds) {
        matchedIds.add(id);
      }
    }
  }

  if (matchedIds.size === 0) {
    return [...SPREADS];
  }

  const matched = SPREADS.filter((s) => matchedIds.has(s.id));
  const unmatched = SPREADS.filter((s) => !matchedIds.has(s.id));
  return [...matched, ...unmatched];
}
