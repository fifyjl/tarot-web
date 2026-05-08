// 塔罗解读引擎 - 专业级高级解读系统（TypeScript）
// 融入《塔罗宝典》《塔罗入门手册》10大高级解读技法
// 技法: 元素动态分析 | 牌阵交叉对话 | 数字能量学 | 宫廷牌三维解读 | 大阿卡纳灵魂之旅
//        逆位三大心法 | 正逆位比例分析 | 缺失元素洞察 | 阵法空间能量 | 时机分析

import type { TarotCard } from '../data/tarotData';

/** 问题类型 */
export type QuestionType = 'love' | 'career' | 'wealth' | 'study' | 'health' | 'general';

/** 阵法类型 */
export type SpreadType = 'single' | 'three' | 'celtic' | 'relationship' | 'horseshoe' | 'year';

/** 问题类型映射 */
const QUESTION_TYPES: Record<QuestionType, string> = {
  love: '感情',
  career: '事业',
  wealth: '财富',
  study: '学业',
  health: '健康',
  general: '通用',
};

/** 元素映射: suit -> 元素名 */
const ELEMENT_MAP: Record<string, string> = {
  wands: '火',
  cups: '水',
  swords: '风',
  pentacles: '土',
};

/** 元素属性描述 */
const ELEMENT_DESC: Record<string, { trait: string; action: string; excess: string }> = {
  '火': { trait: '行动与热情', action: '积极出击、勇敢表达', excess: '急躁冲动、缺乏耐心' },
  '水': { trait: '情感与直觉', action: '倾听感受、信任直觉', excess: '情绪化、过度敏感' },
  '风': { trait: '思维与沟通', action: '理性分析、清晰表达', excess: '想太多做太少、过度批判' },
  '土': { trait: '物质与稳定', action: '脚踏实地、稳健执行', excess: '固执保守、害怕改变' },
};

/** 花色中文名 */
const SUIT_NAMES: Record<string, string> = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
  major: '大阿卡纳',
};

/** 数字能量学映射 */
const NUMEROLOGY: Record<number, { meaning: string; energy: string; timing: string }> = {
  0: { meaning: '无限潜能/纯净起源', energy: '混沌中孕育一切可能', timing: '即刻/起源点' },
  1: { meaning: '起始/新开端/独立意志', energy: '创始与自我确立', timing: '1天到1周' },
  2: { meaning: '平衡/选择/阴阳调和', energy: '关系与对立统一', timing: '约2周' },
  3: { meaning: '创造/社交/初步成果', energy: '表达与群体互动', timing: '约3周' },
  4: { meaning: '稳定/结构/基础建设', energy: '秩序与安全感建立', timing: '约4周(1个月)' },
  5: { meaning: '冲突/变动/打破稳定', energy: '危机与转折点', timing: '约5周' },
  6: { meaning: '和谐/责任/服务奉献', energy: '修复与均衡', timing: '约6周' },
  7: { meaning: '挑战/内省/灵性探索', energy: '考验与深层觉察', timing: '约7周' },
  8: { meaning: '力量/成就/业力回报', energy: '收获与权威确立', timing: '约2个月' },
  9: { meaning: '完成/智慧/灵性圆满', energy: '总结与升华', timing: '约3个月' },
  10: { meaning: '圆满/结束/周期完成', energy: '终极与新生前奏', timing: '约4个月到1年' },
  11: { meaning: '灵性觉醒/大师数字', energy: '高维智慧与使命', timing: '神圣的 Timing' },
  12: { meaning: '牺牲/转化/宇宙秩序', energy: '臣服与涅槃', timing: '周期循环的节点' },
  13: { meaning: '蜕变/重生/深层转化', energy: '死亡与再生的智慧', timing: '重大转变期' },
  14: { meaning: '节制/平衡/炼金术', energy: '融合与升华', timing: '渐进而深远的改变' },
  15: { meaning: '阴影/诱惑/物质束缚', energy: '面对内在黑暗', timing: '业力清算期' },
  16: { meaning: '崩塌/觉醒/打破幻象', energy: '突如其来的启示', timing: '闪电般的突变' },
  17: { meaning: '希望/灵感/宇宙祝福', energy: '疗愈与愿景显化', timing: '黎明前的蓄力' },
  18: { meaning: '幻象/潜意识/灵魂暗夜', energy: '深层恐惧与直觉觉醒', timing: '内在暗夜期' },
  19: { meaning: '成功/ vitality/光明', energy: '丰盛与生命绽放', timing: '黄金时期' },
  20: { meaning: '审判/重生/使命召唤', energy: '灵魂觉醒与天命', timing: '重生的契机' },
  21: { meaning: '圆满/合一/宇宙成就', energy: '旅程的终点与新起点', timing: '周期的完成' },
};

/** 宫廷牌数字映射 */
const _COURT_NUMBERS: Record<string, number> = {
  'page': 11, 'knight': 12, 'queen': 13, 'king': 14,
};

/** 宫廷牌三维解读模板 */
const COURT_DIMENSIONS: Record<string, { person: string; energy: string; advice: string }> = {
  '侍从': {
    person: '代表你生活中一位充满好奇心、正在学习探索的年轻人，或一个带来新消息的人',
    energy: '你正在展现或需要具备学徒般的开放心态，愿意以初学者的姿态探索新领域',
    advice: '学习侍从的好奇心和勇气，不要因为经验不足而退缩，每一个大师都曾是学徒',
  },
  '骑士': {
    person: '代表一位充满行动力、追求目标的人物，可能是带着特定使命进入你生活的人',
    energy: '你正处于积极行动、追求目标的高能量状态，带着使命感向前推进',
    advice: '学习骑士的专注和决心，但要记得控制速度和方向，有目标的冲锋才是骑士精神',
  },
  '王后': {
    person: '代表一位成熟、滋养、富有同理心的人物，可能是你生命中的重要女性或导师',
    energy: '你需要展现或正在展现成熟的滋养能量，能够给予他人和自己深度的关怀',
    advice: '学习王后的滋养智慧和内在力量，真正的力量来自于能够温柔地包容和培育',
  },
  '国王': {
    person: '代表一位权威、稳重、掌控力强的人物，可能是你的领导、长辈或生命中的权威角色',
    energy: '你需要展现或正在展现领导者般的成熟与掌控力，为自己的领域负起全责',
    advice: '学习国王的远见和担当，真正的权威来自于内在的智慧而非外在的强制',
  },
};

/** 大阿卡纳灵魂之旅序列 */
const FOOLS_JOURNEY: Record<number, string> = {
  0: '愚者——旅程的起点，纯真与无限潜能',
  1: '魔术师——显化之力，意识到内在资源',
  2: '女祭司——内在智慧，聆听直觉的声音',
  3: '女皇——丰饶与创造，拥抱生命的丰盛',
  4: '皇帝——建立秩序，以纪律成就目标',
  5: '教皇——传统智慧，在传承中找到指引',
  6: '恋人——灵魂选择，爱与关系的课题',
  7: '战车——意志的胜利，克服内在对立',
  8: '力量——温柔之力，以柔克刚的智慧',
  9: '隐士——内省之旅，在孤独中找到光明',
  10: '命运之轮——周期转折，顺应宇宙节奏',
  11: '正义——因果法则，公正与平衡',
  12: '倒吊人——自愿牺牲，从新视角领悟',
  13: '死神——蜕变转化，旧我死去新我诞生',
  14: '节制——炼金融合，在对立中找到和谐',
  15: '恶魔——面对阴影，打破束缚的幻象',
  16: '高塔——崩塌觉醒，打破固有结构',
  17: '星星——希望之光，愿景的疗愈力量',
  18: '月亮——幻象深渊，穿越恐惧的暗夜',
  19: '太阳——光明 triumph，生命力的绽放',
  20: '审判——灵魂召唤，重生的天命时刻',
  21: '世界——圆满合一，旅程的完成与开始',
};

/** 逆位三大心法解读 */
const _REVERSAL_MEANINGS = {
  blocked: (cardName: string, element: string) =>
    `${cardName}逆位首先呈现「能量受阻」模式——正位的核心能量在当前环境中被压抑或扭曲，如同一条被巨石阻挡的河流，水流不是消失，而是在寻找其他的出路。${element ? `这股${ELEMENT_DESC[element]?.trait || ''}之能量目前处于内化或迂回状态，外在表现可能不明显，但内在正在经历深刻的调整。` : ''}这并非能量的消失，而是能量的重新分配——提醒你需要更有耐心和觉察地去引导这股力量。`,
  extreme: (cardName: string, positiveTrait: string, negativeTrait: string) =>
    `${cardName}逆位同时呈现「极端化」模式——正位中${positiveTrait}的特质走向过度或不足的极端，变成了${negativeTrait}。这种极端往往源于恐惧或失衡，是内在状态在外在事件中的投射。它邀请你审视：是哪里失去了平衡？是什么让你在应该坚定的时候动摇，或在应该柔软的时候僵硬？`,
  internal: (cardName: string) =>
    `${cardName}逆位揭示「内在失衡」模式——牌面的元素能量出现了内在失控，外在事件只是内在状态的一面镜子。逆位不是否定，而是深化：它将你的注意力引向那些尚未被整合的部分，那些在阴影中等待被看见和疗愈的课题。`,
};

/** 阵法名称映射 */
const SPREAD_NAMES: Record<string, string> = {
  single: '单牌占卜',
  three: '三张牌阵',
  choice: '选择阵',
  hexagram: '六芒星阵',
  celtic: '凯尔特十字',
  relationship: '关系牌阵',
  horseshoe: '马蹄牌阵',
  year: '年度运势',
};

/** 阵法位置名称 */
const POSITION_NAMES: Record<string, string[]> = {
  single: ['核心讯息'],
  three: ['过去/根源', '现在/现状', '未来/趋势'],
  choice: ['选项A现状', '选项A结果', '选项B现状', '选项B结果'],
  hexagram: ['问题核心', '外在影响', '内在态度', '过去根基', '未来走向', '建议指引'],
  celtic: [
    '现状核心', '挑战阻碍', '过去根基', '近期过去',
    '最佳行动', '近期未来', '内心状态', '外在影响',
    '希望恐惧', '最终结果',
  ],
  relationship: ['自己', '对方', '关系现状', '关系挑战', '关系潜力', '最终建议'],
  horseshoe: ['过去影响', '现在状况', '隐藏因素', '最佳行动', '他人态度', '未来结果'],
  year: ['一月-二月', '三月-四月', '五月-六月', '七月-八月', '九月-十月', '十一月-十二月'],
};

/** 花色速度映射（时机分析） */
const SUIT_SPEED: Record<string, { speed: string; unit: string }> = {
  wands: { speed: '快速', unit: '天' },
  cups: { speed: '中速', unit: '周' },
  swords: { speed: '思考期', unit: '思考/评估阶段' },
  pentacles: { speed: '慢速', unit: '月或年' },
};

// ==================== 接口定义 ====================

/** 单牌解读结果 */
export interface CardReading {
  positionIndex: number;
  positionName: string;
  cardName: string;
  isReversed: boolean;
  keywords: string[];
  meaning: string;        // 模块1: 牌义解读
  advice: string;         // 模块3: 建议
  questionContext: string; // 模块2: 深度问题解读 (300-400字)
  story: string;
  fullText: string;
}

/** 完整解读结果 */
export interface Reading {
  overall: string;        // 阵法总括
  energyAnalysis: string; // 能量分析
  cardReadings: CardReading[];
  crossAnalysis: string;  // 交叉分析
  synthesis: string;      // 综合分析
  timing: string;         // 时机分析
  suggestions: string[];  // 建议
  affirmation: string;    // 肯定语
}

/** 扩展卡牌接口，用于解读时加入 isReversed */
export interface TarotCardWithOrientation extends TarotCard {
  isReversed: boolean;
}

// ==================== 辅助函数 ====================

/**
 * 推断问题类型
 */
function inferQuestionType(question: string): QuestionType {
  if (!question) return 'general';
  const q = question.toLowerCase();
  if (/感情|爱情|恋爱|桃花|分手|复合|婚姻|对象|前任|暧昧|姻缘|结婚|离婚|单身|约会|表白|暗恋|缘分/.test(q)) return 'love';
  if (/事业|工作|职场|面试|升职|跳槽|创业|求职|公司|老板|同事|项目|客户|行业|职业|办公/.test(q)) return 'career';
  if (/钱|财|投资|理财|收入|股票|基金|赚钱|消费|债务|储蓄|房产|经济|薪资|奖金/.test(q)) return 'wealth';
  if (/学业|考试|学习|成绩|录取|考研|高考|学校|专业|论文|课程|证书|培训|留学/.test(q)) return 'study';
  if (/健康|身体|病|养生|睡眠|心理|压力|情绪|医院|医生|体检|减肥|运动|饮食|康复/.test(q)) return 'health';
  return 'general';
}

/**
 * 获取牌的花色对应的元素
 */
function getCardElement(card: TarotCardWithOrientation): string {
  if (card.suit === 'major') return '无';
  return ELEMENT_MAP[card.suit] || '无';
}

/**
 * 统计四元素分布
 */
function analyzeElements(cards: TarotCardWithOrientation[]): Record<string, number> {
  const counts: Record<string, number> = { '火': 0, '水': 0, '风': 0, '土': 0, '无': 0 };
  cards.forEach((card) => {
    const el = getCardElement(card);
    counts[el]++;
  });
  return counts;
}

/**
 * 分析缺失元素及其含义
 */
function analyzeMissingElements(counts: Record<string, number>): { missing: string[]; insight: string } {
  const missing = ['火', '水', '风', '土'].filter((e) => counts[e] === 0);
  if (missing.length === 0) return { missing: [], insight: '四元素齐全，显示当前局势中各方面能量都有参与，是一种相对平衡和完整的局面。' };

  const meanings: Record<string, string> = {
    '火': '缺乏火元素暗示当前你可能感觉行动力不足、热情缺乏，或者有一种「心有余而力不足」的倦怠感。这是提醒你需要重新点燃内在的火焰，找回那份让你心跳加速的渴望。',
    '水': '缺乏水元素提示情感层面可能被压抑或忽略——你可能过于理性地处理问题，忽视了内心真实的感受，或者与他人的情感连接有所疏离。这是邀请你重新打开心扉，让情感自然流动。',
    '风': '缺乏风元素显示思维和沟通层面可能存在盲区——你可能缺乏清晰的计划，或者在重要对话中未能充分表达自己的想法。这是提醒你需要更多的理性思考和有效沟通。',
    '土': '缺乏土元素暗示务实和稳定层面的不足——当前的计划可能缺乏实际基础，或者你对物质层面的安全感不足。这是提醒你需要将梦想落地，建立稳固的现实根基。',
  };

  const insights = missing.map((e) => meanings[e] || '');
  return {
    missing,
    insight: `牌阵中缺失${missing.join('、')}元素——${insights.join('')}${missing.length >= 2 ? '多重元素的缺失揭示了当前局势中明显的能量盲点，值得特别关注。' : ''}`,
  };
}

/**
 * 分析元素互动关系
 */
function analyzeElementInteraction(elements: Record<string, number>): string {
  const active: string[] = [];
  ['火', '水', '风', '土'].forEach((e) => { if (elements[e] > 0) active.push(e); });
  if (active.length < 2) return '';

  const pairs: string[] = [];
  // 支持关系
  if (active.includes('火') && active.includes('风')) pairs.push('火+风形成「创意迸发、快速行动」的支持组合，思维与热情共振，适合迅速推进计划');
  if (active.includes('水') && active.includes('土')) pairs.push('水+土形成「情感落地、稳定关系」的支持组合，感受与现实和谐交融，适合深化根基');
  if (active.includes('火') && active.includes('土')) pairs.push('火+土形成「稳健行动」的支持组合，热情被务实引导，持久而有效');
  if (active.includes('水') && active.includes('风')) pairs.push('水+风形成「情感智慧」的支持组合，直觉与理性互补，洞察力强');
  // 挑战关系
  if (active.includes('火') && active.includes('水')) pairs.push('火+水形成「情绪冲突」的挑战组合，热情与感受可能互相抵消，需要注意内心矛盾');
  if (active.includes('风') && active.includes('土')) pairs.push('风+土形成「理性vs现实」的挑战组合，可能过度理性而忽略感受，或计划过于理想化');

  return pairs.length > 0 ? pairs.join('；') + '。' : '';
}

/**
 * 获取牌的数字能量学含义
 */
function getNumerology(card: TarotCardWithOrientation): { number: number; meaning: string; energy: string; timing: string } {
  let num: number;
  if (card.suit === 'major') {
    num = typeof card.number === 'number' ? card.number : 0;
    return { number: num, meaning: NUMEROLOGY[num]?.meaning || '灵魂课题', energy: NUMEROLOGY[num]?.energy || '深层转化', timing: NUMEROLOGY[num]?.timing || '神圣时刻' };
  }
  // 小牌数字
  const n = typeof card.number === 'number' ? card.number : parseInt(String(card.number)) || 0;
  if (n >= 1 && n <= 10) {
    return { number: n, meaning: NUMEROLOGY[n].meaning, energy: NUMEROLOGY[n].energy, timing: NUMEROLOGY[n].timing };
  }
  // 宫廷牌
  if (n >= 11 && n <= 14) {
    const courtNames = ['', '', '侍从', '骑士', '王后', '国王'];
    const courtName = courtNames[n] || '宫廷牌';
    const dims = COURT_DIMENSIONS[courtName];
    if (dims) {
      return { number: n, meaning: `${courtName}能量`, energy: dims.energy, timing: '人物影响期' };
    }
  }
  return { number: n, meaning: '特殊能量', energy: '转化与变化', timing: '视情境而定' };
}

/**
 * 获取宫廷牌解读维度
 */
function getCourtDimension(card: TarotCardWithOrientation): { person: string; energy: string; advice: string } | null {
  if (card.suit === 'major') return null;
  const suitEl = getCardElement(card);
  let rank = '';
  if (typeof card.number === 'number') {
    if (card.number === 11) rank = '侍从';
    else if (card.number === 12) rank = '骑士';
    else if (card.number === 13) rank = '王后';
    else if (card.number === 14) rank = '国王';
  }
  if (!rank) return null;

  const dims = COURT_DIMENSIONS[rank];
  if (!dims) return null;

  return {
    person: `${dims.person}（${SUIT_NAMES[card.suit]}${rank}——${suitEl}元素之${rank}）`,
    energy: `${dims.energy}。${SUIT_NAMES[card.suit]}的${suitEl}元素（${ELEMENT_DESC[suitEl]?.trait}）赋予这份${rank}能量独特的气质。`,
    advice: `${dims.advice}。结合${suitEl}元素来看，这种品质需要在${ELEMENT_DESC[suitEl]?.action}中体现。`,
  };
}

/**
 * 获取大阿卡纳灵魂之旅定位
 */
function getFoolsJourney(card: TarotCardWithOrientation): string | null {
  if (card.suit !== 'major') return null;
  const num = typeof card.number === 'number' ? card.number : 0;
  return FOOLS_JOURNEY[num] || null;
}

/**
 * 判断是否为宫廷牌
 */
function _isCourtCard(card: TarotCardWithOrientation): boolean {
  if (card.suit === 'major') return false;
  const n = typeof card.number === 'number' ? card.number : 0;
  return n >= 11 && n <= 14;
}

/**
 * 判断位置的时间属性
 */
function getPositionTimeAttribute(positionName: string): string {
  if (positionName.includes('过去') || positionName.includes('根源')) return '过去影响——已沉淀的能量，揭示问题的历史渊源和深层原因';
  if (positionName.includes('现在') || positionName.includes('现状') || positionName.includes('核心')) return '当下核心——此刻正在发挥作用的能量，是最需要正视的现实';
  if (positionName.includes('未来') || positionName.includes('趋势') || positionName.includes('结果')) return '未来走向——当前能量轨迹所指向的发展方向，提醒未来可塑';
  if (positionName.includes('建议') || positionName.includes('指引') || positionName.includes('行动')) return '建议指引——塔罗给出的直接行动方向，告诉你如何改善局势';
  if (positionName.includes('内心') || positionName.includes('内在') || positionName.includes('态度')) return '内在状态——你潜意识中的真实感受和未被觉察的动机';
  if (positionName.includes('外在') || positionName.includes('他人') || positionName.includes('影响')) return '外在影响——来自环境或他人的作用力，是你需要应对的外部因素';
  if (positionName.includes('挑战') || positionName.includes('阻碍')) return '挑战阻碍——当前需要面对和克服的困难，是成长的契机';
  return '一般位置——揭示问题的一个重要维度，提供多维度的视角';
}

/**
 * 分析阵法空间能量
 */
function analyzeSpatialEnergy(cards: TarotCardWithOrientation[], positionNames: string[]): string {
  const total = cards.length;
  if (total < 3) return '';

  const parts: string[] = [];
  const midpoint = Math.floor(total / 2);

  // 左半部分（潜意识/内在/过去）
  const leftCards = cards.slice(0, midpoint);
  const leftElements = analyzeElements(leftCards);
  const leftMajor = leftCards.filter((c) => c.suit === 'major').length;
  if (leftCards.length > 0) {
    parts.push(`牌阵左半部分（位置1-${midpoint}）代表潜意识、内在动机和过去影响。此区域${leftMajor > 0 ? `出现${leftMajor}张大阿卡纳，暗示深层灵魂课题正从过去延续到现在；` : '以小阿卡纳为主，显示过去的经验更多是具体的生活事件；'}${Object.entries(leftElements).filter(([k, v]) => v > 0 && k !== '无').map(([k]) => k).join('、')}元素在此活跃，揭示${leftCards[0].name}${leftCards.length > 1 ? `与${leftCards[leftCards.length - 1].name}` : ''}共同塑造了当前的内在基础。`);
  }

  // 右半部分（外在/未来/他人）
  const rightCards = cards.slice(midpoint);
  const rightElements = analyzeElements(rightCards);
  const rightMajor = rightCards.filter((c) => c.suit === 'major').length;
  if (rightCards.length > 0) {
    parts.push(`牌阵右半部分（位置${midpoint + 1}-${total}）代表外在环境、未来走向和他人影响。此区域${rightMajor > 0 ? `出现${rightMajor}张大阿卡纳，预示未来是命运安排的重要阶段；` : '以小阿卡纳为主，未来更多由当下行动塑造；'}${Object.entries(rightElements).filter(([k, v]) => v > 0 && k !== '无').map(([k]) => k).join('、')}元素在此显现，${rightCards[0].name}${rightCards.length > 1 ? `与${rightCards[rightCards.length - 1].name}` : ''}共同描绘了你将面对的外在环境。`);
  }

  // 中心位置
  if (total >= 3) {
    const centerIdx = Math.floor(total / 2);
    const centerCard = cards[centerIdx];
    const centerOri = centerCard.isReversed ? '逆位' : '正位';
    parts.push(`中心位置（第${centerIdx + 1}位）的${centerCard.name}（${centerOri}）是整个牌阵的枢纽——${getPositionTimeAttribute(positionNames[centerIdx] || '核心')}。这张牌的能量贯穿整个牌阵，是解读的核心关键。`);
  }

  return parts.join('\n\n');
}

/**
 * 分析相邻牌之间的对话
 */
function analyzeAdjacentDialogue(cards: TarotCardWithOrientation[]): string[] {
  const dialogues: string[] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i];
    const b = cards[i + 1];
    const aOri = a.isReversed ? '逆位' : '正位';
    const bOri = b.isReversed ? '逆位' : '正位';
    const aEl = getCardElement(a);
    const bEl = getCardElement(b);

    // 同花色
    if (a.suit === b.suit && a.suit !== 'major') {
      dialogues.push(`${a.name}（${aOri}）→ ${b.name}（${bOri}）：同属${SUIT_NAMES[a.suit]}（${aEl}元素），前一张的能量自然流向后一张，${ELEMENT_MAP[a.suit]}元素的主题被连续强化，显示${aEl === '火' ? '行动力与热情' : aEl === '水' ? '情感与感受' : aEl === '风' ? '思维与沟通' : '务实与物质'}的课题正在深化。`);
    }
    // 元素支持/挑战
    else if (aEl !== '无' && bEl !== '无' && aEl !== bEl) {
      const isSupport = (aEl === '火' && bEl === '风') || (aEl === '风' && bEl === '火') ||
                        (aEl === '水' && bEl === '土') || (aEl === '土' && bEl === '水');
      dialogues.push(`${a.name}（${aOri}，${aEl}元素）→ ${b.name}（${bOri}，${bEl}元素）：两张牌形成${isSupport ? '「元素支持」' : '「元素张力」'}关系——${isSupport ? '前者的能量被后者所支持，能量的传递顺畅而自然' : '两种元素之间存在内在张力，需要你在两者之间找到平衡点'}，揭示了从${a.name}到${b.name}的能量流动特征。`);
    }
    // 大牌+小牌
    else if ((a.suit === 'major' && b.suit !== 'major') || (a.suit !== 'major' && b.suit === 'major')) {
      const major = a.suit === 'major' ? a : b;
      const minor = a.suit === 'major' ? b : a;
      dialogues.push(`${a.name}（${aOri}）→ ${b.name}（${bOri}）：大阿卡纳${major.name}提供灵魂课题的宏大框架，而小阿卡纳${minor.name}（${SUIT_NAMES[minor.suit]}）为这个框架填充具体细节，共同呈现出「命运蓝图+生活实践」的完整叙事。`);
    }
    // 数字共振
    else if (typeof a.number === 'number' && typeof b.number === 'number' && a.number === b.number && a.number > 0 && a.suit !== b.suit) {
      dialogues.push(`${a.name}（${aOri}）→ ${b.name}（${bOri}）：数字${a.number}共振！两张不同花色的同数字牌揭示了一个核心课题正以不同面向呈现，${NUMEROLOGY[a.number]?.meaning || ''}的能量在不同生活领域同时运作。`);
    }
  }
  return dialogues;
}

/**
 * 分析对立牌（首尾对比）
 */
function analyzeOppositeCards(cards: TarotCardWithOrientation[], positionNames: string[]): string {
  if (cards.length < 2) return '';
  const first = cards[0];
  const last = cards[cards.length - 1];
  const firstOri = first.isReversed ? '逆位' : '正位';
  const lastOri = last.isReversed ? '逆位' : '正位';
  const firstPos = positionNames[0] || '起始';
  const lastPos = positionNames[cards.length - 1] || '终点';

  let narrative = '';
  if (first.isReversed && !last.isReversed) {
    narrative = `从${firstPos}的${first.name}（${firstOri}）到${lastPos}的${last.name}（${lastOri}），呈现出一个从内在阻滞走向外在明朗的转化叙事。这表明虽然问题的根源带有某种内在困顿，但能量轨迹指向顺畅与解决——你的努力正在将逆位的课题转化为正位的智慧。`;
  } else if (!first.isReversed && last.isReversed) {
    narrative = `从${firstPos}的${first.name}（${firstOri}）到${lastPos}的${last.name}（${lastOri}），呈现出一个从顺畅走向内在调整的转化叙事。这意味着起初的情况相对明朗，但未来的发展需要你深入内在的阴影面去工作——不要被初期的顺利迷惑，真正的成长在逆位所揭示的课题中。`;
  } else if (first.isReversed && last.isReversed) {
    narrative = `${firstPos}和${lastPos}均为逆位，显示这是一个需要持续内在工作的周期。从${first.name}到${last.name}，外在的能量流动受到内在模式的持续影响。这提醒你不要期待速效，而是要以耐心和觉察来逐步转化深层的能量阻塞。`;
  } else {
    narrative = `${firstPos}到${lastPos}均为正位，显示能量流动从始至终保持顺畅。从${first.name}到${last.name}，这是一个积极发展的叙事弧线，建议你顺应这股势头，在各阶段保持觉知并积极行动。`;
  }

  return narrative;
}

// ==================== 核心深度解读函数 ====================

/**
 * 从用户问题中提取核心关键词和关切点
 */
function extractQuestionKeywords(question: string): { keywords: string[]; coreConcern: string; emotionalTone: string } {
  if (!question) return { keywords: [], coreConcern: '', emotionalTone: '中性' };
  
  const q = question.toLowerCase();
  const keywords: string[] = [];
  let emotionalTone = '中性';
  let coreConcern = '';
  
  // 情感关系关键词
  const loveKeywords = ['感情', '爱情', '恋爱', '桃花', '分手', '复合', '婚姻', '对象', '前任', '暧昧', '姻缘', '结婚', '离婚', '单身', '约会', '表白', '暗恋', '缘分', '喜欢', '爱', '他', '她', '男友', '女友', '伴侣', '对象'];
  const careerKeywords = ['事业', '工作', '职场', '面试', '升职', '跳槽', '创业', '求职', '公司', '老板', '同事', '项目', '客户', '行业', '职业', '办公', '薪水', '离职'];
  const wealthKeywords = ['钱', '财', '投资', '理财', '收入', '股票', '基金', '赚钱', '消费', '债务', '储蓄', '房产', '经济', '薪资', '奖金', '财富'];
  const studyKeywords = ['学业', '考试', '学习', '成绩', '录取', '考研', '高考', '学校', '专业', '论文', '课程', '证书', '培训', '留学'];
  const healthKeywords = ['健康', '身体', '病', '养生', '睡眠', '心理', '压力', '情绪', '医院', '医生', '体检', '减肥', '运动', '饮食', '康复'];
  
  // 情感基调词
  const anxiousWords = ['担心', '害怕', '焦虑', '不安', '紧张', '迷茫', '困惑', '怎么办', '会不会', '能吗'];
  const hopefulWords = ['希望', '期待', '向往', '想要', '渴望', '梦想', '追求', '愿景'];
  const conflictWords = ['矛盾', '纠结', '冲突', '挣扎', '两难', '难以', '痛苦', '失望', '背叛'];
  
  // 检测情感基调
  if (anxiousWords.some(w => q.includes(w))) emotionalTone = '焦虑';
  else if (conflictWords.some(w => q.includes(w))) emotionalTone = '冲突';
  else if (hopefulWords.some(w => q.includes(w))) emotionalTone = '期待';
  
  // 提取具体关键词
  loveKeywords.forEach(kw => { if (q.includes(kw)) keywords.push(kw); });
  careerKeywords.forEach(kw => { if (q.includes(kw)) keywords.push(kw); });
  wealthKeywords.forEach(kw => { if (q.includes(kw)) keywords.push(kw); });
  studyKeywords.forEach(kw => { if (q.includes(kw)) keywords.push(kw); });
  healthKeywords.forEach(kw => { if (q.includes(kw)) keywords.push(kw); });
  
  // 去重
  const uniqueKeywords = [...new Set(keywords)].slice(0, 5);
  
  // 推断核心关切
  if (/分不分手|要不要分手|该不该分手|还能不能在一起|复合/.test(q)) {
    coreConcern = '关系是否值得继续，以及是否有复合的可能性';
  } else if (/桃花|什么时候遇到|什么时候有对象|正缘/.test(q)) {
    coreConcern = '何时能遇到合适的人，以及理想伴侣何时出现';
  } else if (/能不能成功|有没有希望|能行吗|会不会好/.test(q)) {
    coreConcern = '事情的成功概率和发展前景';
  } else if (/该怎么做|怎么办|如何做|方法|建议|出路/.test(q)) {
    coreConcern = '具体的行动策略和改善方法';
  } else if (/什么时候|多久|何时| timing|时间/.test(q)) {
    coreConcern = '事件发展的时间节点和时机判断';
  } else if (/对方怎么想|他怎么想|她怎么看|对方态度/.test(q)) {
    coreConcern = '对方的真实想法和情感态度';
  } else if (/选择|抉择|二选一|选哪个|决定|要不要/.test(q)) {
    coreConcern = '不同选项的利弊分析和最优决策';
  } else if (/为什么|原因|怎么回事|根源/.test(q)) {
    coreConcern = '问题产生的深层原因和内在机制';
  } else {
    coreConcern = '整体局势的发展趋势和内在规律';
  }
  
  return { keywords: uniqueKeywords, coreConcern, emotionalTone };
}

/**
 * 根据用户问题的情感基调生成针对性的解读开头
 */
function generateEmotionalOpening(emotionalTone: string, questionKeywords: string[], cardName: string, positionName: string, isReversed: boolean): string {
  const orientation = isReversed ? '逆位' : '正位';
  const kwStr = questionKeywords.length > 0 ? `关于${questionKeywords.join('、')}的问题` : '你的问题';
  
  if (emotionalTone === '焦虑') {
    return `我理解你心中的不安。${cardName}（${orientation}）落在「${positionName}」，正在回应你${kwStr}中的深层忧虑——这份焦虑本身也是塔罗想要与你对话的一部分。`;
  } else if (emotionalTone === '冲突') {
    return `你正处于两股力量拉扯之中，${cardName}（${orientation}）在「${positionName}」的位置，揭示了你${kwStr}背后那场尚未被完全看见的内在对话。`;
  } else if (emotionalTone === '期待') {
    return `你的渴望正在被宇宙聆听。${cardName}（${orientation}）落于「${positionName}」，正在为你${kwStr}展开一幅充满可能性的图景。`;
  }
  return `针对你${kwStr}的询问，${cardName}（${orientation}）在「${positionName}」的位置给出了它的回应。`;
}

/**
 * 生成针对用户核心关切的具体回答
 */
function generateTargetedAnswer(
  card: TarotCardWithOrientation,
  questionType: QuestionType,
  coreConcern: string,
  questionKeywords: string[],
  positionName: string,
  isReversed: boolean
): string {
  const name = card.name;
  const kwStr = questionKeywords.length > 0 ? `「${questionKeywords.join('、')}」` : '';
  
  if (isReversed) {
    // 逆位回答：聚焦阻滞和转化
    if (coreConcern.includes('成功概率')) {
      return `${name}逆位提示，你${kwStr}所期待的结果目前存在阻滞——这不是命运的否定，而是能量尚未准备就绪的信号。当前的关键不是追求速度，而是审视内在的${card.keywordsReversed?.[0] || '调整需求'}。当你能正视这个逆位所揭示的课题，局势将逐渐松动。`;
    } else if (coreConcern.includes('行动策略')) {
      return `${name}逆位给你的建议是：暂缓激进的行动。你${kwStr}所寻求的改变需要先从内在层面开始——可能是调整期待、疗愈旧伤，或是重新评估方向。在能量重新顺畅之前，「不做什么」比「做什么」更重要。`;
    } else if (coreConcern.includes('时机')) {
      return `${name}逆位暗示，关于${kwStr}的时机尚未完全成熟。宇宙的节奏不同于你的焦虑——当${card.keywordsReversed?.[0] || '内在课题'}被妥善处理，正确的时机将自然显现。耐心是这个阶段最大的智慧。`;
    } else if (coreConcern.includes('对方')) {
      return `${name}逆位揭示了对方内心可能存在的不安或矛盾——他们${kwStr}方面的状态并非表面所见，可能正被${card.keywordsReversed?.[0] || '内在冲突'}所困扰。建议你给予更多理解和空间，此刻不宜强求回应。`;
    } else if (coreConcern.includes('决策')) {
      return `${name}逆位建议你暂时搁置关于${kwStr}的重大决定。当前的能量存在阻滞，此刻做出的选择可能受到${card.keywordsReversed?.[0] || '内在失衡'}的影响。给自己更多沉淀的时间，答案会在你内心清晰时自然浮现。`;
    }
    return `${name}逆位回应你${kwStr}的询问：当前局势存在内在阻滞，${card.keywordsReversed?.[0] || '能量'}处于扭曲或压抑状态。这不是失败，而是提醒你需要先处理${coreConcern}中的深层课题。转化将从觉察开始。`;
  } else {
    // 正位回答：聚焦支持和方向
    if (coreConcern.includes('成功概率')) {
      return `${name}正位给予你积极的信号——关于${kwStr}，整体能量趋势是支持的。${card.keywordsUpright?.[0] || '牌面核心能量'}正在为你的目标提供动力。虽然结果始终取决于你的选择和行动，但宇宙当前正向你敞开一扇门。`;
    } else if (coreConcern.includes('行动策略')) {
      return `${name}正位建议你${kwStr}的最佳方向是：以${card.keywordsUpright?.[0] || '核心能量'}为主导展开行动。具体而言，${card.adviceUpright || '信任内在指引，保持觉知前行'}。现在的能量窗口支持你积极尝试，不要因犹豫错失良机。`;
    } else if (coreConcern.includes('时机')) {
      return `${name}正位暗示，关于${kwStr}的时机正在向有利于你的方向移动。${card.keywordsUpright?.[0] || '当下的能量'}支持你在${positionName.includes('未来') ? '未来的时间窗口' : '当前阶段'}采取行动。保持敏锐，机会将在你准备好时出现。`;
    } else if (coreConcern.includes('对方')) {
      return `${name}正位展现对方${kwStr}方面的真实状态——他们正处于${card.keywordsUpright?.[0] || '积极的能量'}之中。建议你以${card.keywordsUpright?.[1] || '真诚'}的态度与对方互动，理解他们的立场将帮助你找到更好的连接方式。`;
    } else if (coreConcern.includes('决策')) {
      return `${name}正位支持你关于${kwStr}做出积极的选择。当前能量顺畅，${card.keywordsUpright?.[0] || '牌面'}为你提供了清晰的指引。信任这股推动力，勇敢地迈出下一步——宇宙正在为你铺路。`;
    }
    return `${name}正位回应你${kwStr}的询问：${coreConcern}方面，当前能量流动顺畅，${card.keywordsUpright?.[0] || '核心力量'}正在支持你。建议你顺势而为，同时保持觉知，让${card.adviceUpright || '内在智慧'}引导你的每一步。`;
  }
}

/**
 * 生成深度问题解读（300-400字）
 * 核心升级：融入用户问题语义分析、情感基调识别、针对性回答
 */
/**
 * 生成深度问题解读（300-400字）
 * 核心改进：直接回答用户问题，而不是只说牌面含义
 */
/**
 * 获取花色主题描述
 */
function getSuitTheme(suit: string): string {
  const themes: Record<string, string> = {
    wands: '行动与创造',
    cups: '情感与关系',
    swords: '思维与沟通',
    pentacles: '物质与务实',
    major: '灵性成长',
  };
  return themes[suit] || '生命成长';
}


function generateDeepQuestionReading(
  card: TarotCardWithOrientation,
  questionType: QuestionType,
  question: string,
  positionName: string,
  cardIndex: number,
  totalCards: number,
  allCards: TarotCardWithOrientation[],
  positionNames: string[]
): string {
  const name = card.name;
  const suit = card.suit;
  const element = getCardElement(card);
  const orientation = card.isReversed ? '逆位' : '正位';
  const isMajor = suit === 'major';
  const suitName = SUIT_NAMES[suit] || '未知';
  const meaning = card.isReversed ? card.meaningReversed : card.meaningUpright;
  const story = card.isReversed ? card.storyReversed : card.storyUpright;

  // 提取用户问题的核心关切
  const coreConcern = extractCoreConcern(question);

  // 第1段：直接回答（80-120字）—— 回答用户最关心的问题
  const section1 = generateDirectAnswer(
    card, question, questionType, positionName, 
    coreConcern, meaning, orientation
  );

  // 第2段：牌面支撑（80-100字）—— 为什么这张牌支持这个答案
  const section2 = generateCardSupport(
    card, question, questionType, positionName,
    meaning, story, orientation, suitName
  );

  // 第3段：深入洞察（80-100字）—— 结合位置和其他牌的交叉分析
  const section3 = generateDeepInsight(
    card, allCards, cardIndex, positionName, positionNames,
    question, questionType, orientation
  );

  // 第4段：具体建议（60-80字）—— 针对用户问题的具体行动建议
  const section4 = generateTargetedAdvice(
    card, question, questionType, coreConcern, orientation
  );

  // 第5段：信心/提醒（40-60字）
  const section5 = generateClosing(
    card, questionType, orientation, allCards, cardIndex
  );

  const fullReading = `${section1}\n\n${section2}\n\n${section3}\n\n${section4}\n\n${section5}`;
  return fullReading;
}

/**
 * 提取用户问题的核心关切
 */
function extractCoreConcern(question: string): string {
  if (!question) return '未来走向';
  
  // 提取时间关键词
  if (/明天|今天|本周|下周|这个月|下个月|今年|明年|近期|最近|未来三个月|未来半年/.test(question)) {
    if (/明天|今天/.test(question)) return '短期运势';
    if (/本周|下周/.test(question)) return '本周运势';
    if (/这个月|下个月/.test(question)) return '月度运势';
    if (/今年|明年/.test(question)) return '年度运势';
    if (/未来三个月/.test(question)) return '季度运势';
    if (/未来半年/.test(question)) return '半年运势';
    return '近期走向';
  }
  
  // 提取行为关键词
  if (/要不要|该不该|能不能|可以不可以|行吗|合适吗|值得吗|会吗/.test(question)) {
    return '决策判断';
  }
  
  // 提取对象关键词
  if (/他怎么想|他对我|他对我的感觉|他爱不爱|他喜欢|他的态度/.test(question)) {
    return '对方想法';
  }
  if (/我们能不能|我们会|我们会不会|我们有没有|我们的关系/.test(question)) {
    return '关系发展';
  }
  
  // 默认
  return '未来走向';
}

/**
 * 第1段：直接回答用户问题
 */
function generateDirectAnswer(
  card: TarotCardWithOrientation,
  question: string,
  questionType: QuestionType,
  positionName: string,
  coreConcern: string,
  meaning: string,
  orientation: string
): string {
  const name = card.name;
  const isRev = card.isReversed;
  
  // 提取核心含义的第一句
  const coreMeaning = meaning.split('。')[0] + '。';
  
  let answer = '';
  
  if (questionType === 'love') {
    if (coreConcern === '对方想法') {
      answer = isRev
        ? `关于你问的「${question}」，${name}（${orientation}）给出的答案是：对方目前的状态并不明朗，内心可能存在犹豫或困惑。这张牌显示，他对你的感觉还没有完全清晰化，或者说有一些内心的矛盾没有被表达出来。`
        : `关于你问的「${question}」，${name}（${orientation}）给出的答案是：对方对你确实有好感，内心是认可这段关系的。这张牌显示，他的态度是积极的，只是表达的方式可能比较含蓄或需要时间。`;
    } else if (coreConcern === '关系发展') {
      answer = isRev
        ? `关于你问的「${question}」，${name}（${orientation}）显示这段关系正处于一个需要调整的阶段。不是说没有希望，而是目前的能量流动不够顺畅，需要你们共同面对一些现实的考验。`
        : `关于你问的「${question}」，${name}（${orientation}）给出的答案是乐观的。这段关系有很好的发展基础，双方的情感能量是匹配的，未来有可能走向更深的连接。`;
    } else {
      answer = isRev
        ? `关于你的感情问题「${question}」，${name}（${orientation}）显示当前的能量状态需要调整。短期内可能会有一些波折或误解，但这不代表没有转机。关键在于你如何面对这些挑战。`
        : `关于你的感情问题「${question}」，${name}（${orientation}）显示了一个积极的信号。这段感情有较好的发展基础，对方的态度是真诚的，建议你把握当前的窗口期，主动推进关系。`;
    }
  } else if (questionType === 'career') {
    answer = isRev
      ? `关于你的工作问题「${question}」，${name}（${orientation}）显示当前并非最佳的推进时机。职场中可能存在一些看不见的阻力，或者说时机还没有成熟。建议你暂时稳住阵脚，不要急于求成。`
      : `关于你的工作问题「${question}」，${name}（${orientation}）给出了积极的反馈。当前是一个适合行动的时期，你的努力容易被看见，机会正在向你靠近。建议你主动出击。`;
  } else if (questionType === 'wealth') {
    answer = isRev
      ? `关于你的财务问题「${question}」，${name}（${orientation}）提醒你保持谨慎。短期内不宜进行大额投资或冒险性决策，财务上可能会有一些意外的支出。建议你优先稳固现有基础。`
      : `关于你的财务问题「${question}」，${name}（${orientation}）显示财运平稳向好。虽然不是暴富的信号，但有小收获或新的收入渠道可能出现。建议你保持开放心态。`;
  } else if (questionType === 'study') {
    answer = isRev
      ? `关于你的学业问题「${question}」，${name}（${orientation}）提醒你注意学习方法或心态的调整。当前的效率可能不太理想，或者说有一些外部因素在干扰你的进度。`
      : `关于你的学业问题「${question}」，${name}（${orientation}）显示当前的学习能量是顺畅的。这是一个适合集中精力突破的时期，你的努力会有回报。`;
  } else {
    // 通用
    answer = isRev
      ? `关于你问的「${question}」，${name}（${orientation}）显示当前阶段可能需要一些耐心和等待。不是说没有希望，而是时机还未成熟，或者说你需要先解决一些内在的功课。`
      : `关于你问的「${question}」，${name}（${orientation}）给出了一个积极的信号。当前的能量趋势支持你，建议你顺应这股势头，勇敢地向前推进。`;
  }
  
  return `【答案】${answer}`;
}

/**
 * 第2段：牌面为什么支持这个答案
 */
function generateCardSupport(
  card: TarotCardWithOrientation,
  question: string,
  questionType: QuestionType,
  positionName: string,
  meaning: string,
  story: string,
  orientation: string,
  suitName: string
): string {
  const name = card.name;
  const coreMeaning = meaning.split('。')[0] + '。';
  const coreStory = story.split('。')[0] + '。';
  
  let support = '';
  
  if (card.suit === 'major') {
    support = `${name}作为大阿卡纳牌，代表人生课题级别的能量。${coreMeaning}${coreStory}这说明你当前面临的问题具有深远的意义，不是简单的日常琐事。`;
  } else {
    support = `${name}属于${suitName}系列，代表${getSuitTheme(card.suit)}方面的能量。${coreMeaning}这直接映射到你问题的核心——${getQuestionTheme(questionType)}层面正在经历${card.isReversed ? '调整期' : '活跃期'}。`;
  }
  
  return `【牌面依据】${support}`;
}

/**
 * 第3段：深入洞察（位置含义 + 交叉分析）
 */
function generateDeepInsight(
  card: TarotCardWithOrientation,
  allCards: TarotCardWithOrientation[],
  cardIndex: number,
  positionName: string,
  positionNames: string[],
  question: string,
  questionType: QuestionType,
  orientation: string
): string {
  const name = card.name;
  
  let insight = '';
  
  // 位置含义
  if (positionName.includes('过去') || positionName.includes('根源')) {
    insight = `从「${positionName}」这个位置来看，${name}揭示了你当前问题的历史渊源。`;
  } else if (positionName.includes('现在') || positionName.includes('现状') || positionName.includes('核心')) {
    insight = `「${positionName}」显示这是你当前最需要关注的能量场。`;
  } else if (positionName.includes('未来') || positionName.includes('趋势') || positionName.includes('结果')) {
    insight = `「${positionName}」展示了你当前能量轨迹指向的发展方向。`;
  } else if (positionName.includes('建议') || positionName.includes('指引')) {
    insight = `「${positionName}」是塔罗给你的直接行动建议。`;
  } else {
    insight = `「${positionName}」这个位置的能量揭示了你问题的一个重要维度。`;
  }
  
  // 交叉分析
  if (allCards.length > 1) {
    const otherCards = allCards.filter((_, i) => i !== cardIndex);
    if (otherCards.length > 0) {
      const hasSameSuit = otherCards.some(c => c.suit === card.suit);
      const hasMajor = otherCards.some(c => c.suit === 'major');
      
      if (hasSameSuit) {
        insight += `值得注意的是，多张${SUIT_NAMES[card.suit]}牌同时出现，说明${getSuitTheme(card.suit)}这个主题在你的问题中占据核心地位。`;
      }
      if (hasMajor && card.suit !== 'major') {
        insight += `与大阿卡纳牌的组合显示，你关注的${getQuestionTheme(questionType)}问题正在上升到人生课题的层面。`;
      }
    }
  }
  
  // 正逆位深度含义
  if (card.isReversed) {
    insight += `逆位的${name}提示这股能量目前处于内化或受阻状态，建议你从内在调整入手，不要期待外在的速成。`;
  } else {
    insight += `${name}正位表示这股能量正在顺畅地向外表达，外部环境对你是有利的，适合积极推进。`;
  }
  
  return `【深层洞察】${insight}`;
}

/**
 * 第4段：具体建议
 */
function generateTargetedAdvice(
  card: TarotCardWithOrientation,
  question: string,
  questionType: QuestionType,
  coreConcern: string,
  orientation: string
): string {
  const isRev = card.isReversed;
  
  let advice = '';
  
  if (questionType === 'love') {
    if (coreConcern === '对方想法') {
      advice = isRev
        ? `建议你暂时不要急于追问对方的想法。给他一些空间和时间，等他自己理清思绪。你可以做的是保持温和的关心，但不要施压。`
        : `建议你主动创造沟通的机会。不要害怕表达你的心意，对方其实是 receptive 的。一个真诚的对话可能比你的想象更容易开启。`;
    } else if (coreConcern === '关系发展') {
      advice = isRev
        ? `建议你们先处理当前存在的问题，不要急于推进关系。给彼此一些独立的空间，等各自的功课完成后再重新评估这段关系。`
        : `建议你主动推进关系的发展。创造更多共同经历的机会，在互动中加深了解和信任。现在是一个适合表白的窗口期。`;
    } else {
      advice = isRev
        ? `建议你关注自己在关系中的真实需求。有时候我们急于得到答案，却忽略了问题本身是否合理。先问问自己：你真正想要的是什么？`
        : `建议你珍惜这段关系，用心经营日常的相处。感情不是靠占卜来维持的，而是靠每一天的真诚和付出。把握现在，创造美好。`;
    }
  } else if (questionType === 'career') {
    advice = isRev
      ? `建议你暂时稳住现状，不要冒进。把注意力放在提升自己的核心竞争力上。时机未到不是你的问题，耐心等待转机。`
      : `建议你主动出击，争取机会。向上司展示你的能力，积极参与重要项目。你的努力现在容易被看见，不要错过这个窗口期。`;
  } else if (questionType === 'wealth') {
    advice = isRev
      ? `建议你控制开支，避免不必要的消费。暂缓大额投资决策，优先建立应急储备。保守是当前的明智策略。`
      : `建议你保持开放心态，留意身边的机会。可以尝试稳健理财或寻找副业增收的可能性。`;
  } else {
    advice = isRev
      ? `建议你放慢脚步，先处理内在的功课。不要急于追求外在的答案，内在的平静比任何结果都重要。`
      : `建议你顺应积极的趋势，勇敢地迈出下一步。保持开放的心态，接受新的可能性。相信自己有能力创造想要的结果。`;
  }
  
  return `【给你的建议】${advice}`;
}

/**
 * 第5段：结尾信心/提醒
 */
function generateClosing(
  card: TarotCardWithOrientation,
  questionType: QuestionType,
  orientation: string,
  allCards: TarotCardWithOrientation[],
  cardIndex: number
): string {
  const isRev = card.isReversed;
  
  // 计算整体牌面积极性
  const positiveCount = allCards.filter(c => !c.isReversed).length;
  const totalCount = allCards.length;
  const positiveRatio = positiveCount / totalCount;
  
  let closing = '';
  
  if (positiveRatio >= 0.7) {
    closing = `整体来看，牌面传递的能量是积极的。建议你保持信心，顺势而为。记住，塔罗揭示的是当前能量轨迹，你的行动可以塑造更好的未来。`;
  } else if (positiveRatio <= 0.3) {
    closing = `整体来看，当前确实面临一些挑战。但这并非终点，而是成长的契机。暂时的困难往往是为了让你变得更强大。相信自己，你有能力穿越这段时期。`;
  } else {
    closing = `整体来看，这是一个平衡发展的阶段，既有挑战也有机遇。建议你保持觉知，在变化中找到自己的节奏。塔罗是灯，路还是要你自己走。`;
  }
  
  return `【最后的提醒】${closing}`;
}

/**
 * 获取问题主题描述
 */
function getQuestionTheme(qType: QuestionType): string {
  const themes: Record<string, string> = {
    love: '感情',
    career: '事业',
    wealth: '财富',
    study: '学业',
    health: '健康',
    general: '生活',
  };
  return themes[qType] || '生活';
}

/**
 * 生成能量分析文本（技法1: 元素动态分析 + 技法7: 正逆位比例 + 技法5: 大牌分析）
 */
function generateEnergyAnalysis(
  elements: Record<string, number>,
  cards: TarotCardWithOrientation[]
): string {
  const total = cards.length;
  const parts: string[] = [];

  // 技法1: 元素动态分析
  const dominant = Object.entries(elements)
    .filter(([k]) => k !== '无')
    .sort((a, b) => b[1] - a[1]);

  const topElement = dominant[0];
  if (topElement && topElement[1] > 0) {
    const [name, count] = topElement;
    const ratio = Math.round((count / total) * 100);
    const desc = ELEMENT_DESC[name];
    parts.push(`【技法1·元素动态分析】这副牌以${name}元素为主导（占${ratio}%），${desc?.trait}成为当前局势的核心能量。${desc?.action}是你此刻最有力的工具，但需警惕${desc?.excess}的倾向。`);

    // 元素互动
    const interaction = analyzeElementInteraction(elements);
    if (interaction) {
      parts.push(`元素互动层面：${interaction}`);
    }
  }

  // 技法8: 缺失元素洞察
  const missingAnalysis = analyzeMissingElements(elements);
  if (missingAnalysis.missing.length > 0) {
    parts.push(`【技法8·缺失元素洞察】${missingAnalysis.insight}`);
  }

  // 技法5: 大阿卡纳灵魂之旅
  const majorCards = cards.filter((c) => c.suit === 'major');
  if (majorCards.length > 0) {
    parts.push(`【技法5·大阿卡纳灵魂之旅】牌阵中出现${majorCards.length}张大阿卡纳${majorCards.map((c) => `「${c.name}」`).join('')}，显示这绝非普通日常事务，而是灵魂成长的重要节点。${majorCards.map((c) => { const fj = getFoolsJourney(c); return fj ? `${c.name}位于${fj}` : ''; }).filter(Boolean).join('；')}。命运正以宏大而深刻的方式展开，你正在经历的是一次灵魂层面的成长洗礼。`);
  }

  // 技法7: 正逆位比例深层分析
  const reversedCount = cards.filter((c) => c.isReversed).length;
  const uprightCount = total - reversedCount;
  if (reversedCount === 0) {
    parts.push(`【技法7·正逆位比例分析】全正位牌阵——能量顺畅流动，宇宙正在以明确的方式回应你的询问。这是一个与内在意图高度对齐的阶段，外在的阻碍较少。然而全正位也可能暗示缺乏深度反思的契机，提醒你在顺境中保持觉知，不要让顺利成为忽视深层课题的借口。`);
  } else if (uprightCount === 0) {
    parts.push(`【技法7·正逆位比例分析】全逆位牌阵——这是一个强烈的信号，提示当前局势中存在较多内在阻滞或未被充分觉察的议题。过半逆位显示你正处于需要面对阴影、深入内省的关键时期。逆位不是坏事，它们像镜子一样映照出需要被看见和调整的部分。这是一个重新校准方向、整合内在分裂的珍贵时机。`);
  } else if (reversedCount > uprightCount) {
    parts.push(`【技法7·正逆位比例分析】逆位牌数量占优（${reversedCount}逆/${uprightCount}正），显示内在阻滞是当下更突出的主题。${uprightCount}张正位牌代表仍可运作的资源和方向，而${reversedCount}张逆位牌则指向需要被疗愈和转化的深层模式。这是「阴阳调和、动态成长」的时期——光明与阴影的交汇正是蜕变的契机。`);
  } else {
    parts.push(`【技法7·正逆位比例分析】正位牌数量占优（${uprightCount}正/${reversedCount}逆），显示整体能量流动相对顺畅。${reversedCount}张逆位牌如明灯般标示出需要关注的内在盲点，它们与${uprightCount}张正位牌共同构成一幅完整的成长图景——在顺流中不忘修正方向，在光明中勇于审视阴影。`);
  }

  return parts.join('\n\n');
}

/**
 * 生成分牌解读
 */
function generateCardReadings(
  cards: TarotCardWithOrientation[],
  spreadType: SpreadType,
  questionType: QuestionType,
  question: string
): CardReading[] {
  const positions = POSITION_NAMES[spreadType] || POSITION_NAMES.single;
  return cards.map((card, i) => {
    const posName = positions[i] || `第${i + 1}张牌`;
    const orientation = card.isReversed ? '逆位' : '正位';
    const ctxText = generateDeepQuestionReading(card, questionType, question, posName, i, cards.length, cards, positions);
    const storyText = card.isReversed ? card.storyReversed : card.storyUpright;
    const meaningText = card.isReversed ? card.meaningReversed : card.meaningUpright;
    const adviceText = card.isReversed ? card.adviceReversed : card.adviceUpright;

    return {
      positionName: posName,
      positionIndex: i,
      cardName: card.name,
      isReversed: card.isReversed,
      keywords: card.isReversed ? card.keywordsReversed : card.keywordsUpright,
      meaning: meaningText,
      advice: adviceText,
      questionContext: ctxText,
      story: storyText,
      fullText: `【${posName}】${card.name}（${orientation}）\n\n${ctxText}\n\n【核心牌义】${meaningText}\n\n【建议】${adviceText}\n\n【故事】${storyText}`,
    };
  });
}

/**
 * 生成交叉分析（技法2: 牌阵交叉对话 + 技法9: 阵法空间能量）
 */
function generateCrossAnalysis(
  cards: TarotCardWithOrientation[],
  spreadType: SpreadType
): string {
  const positions = POSITION_NAMES[spreadType] || POSITION_NAMES.single;
  const parts: string[] = [];

  parts.push(`【技法2·牌阵交叉对话】`);

  // 相邻牌对话
  const dialogues = analyzeAdjacentDialogue(cards);
  if (dialogues.length > 0) {
    parts.push(`相邻牌的对话叙事：`);
    dialogues.forEach((d) => parts.push(d));
  } else {
    parts.push(`这组牌呈现多元的能量交织，每一张牌都在讲述同一个故事的不同面向。各牌之间的互补和对比为你提供了多维度的视角。`);
  }

  // 对立牌分析（首尾对比）
  const oppositeNarrative = analyzeOppositeCards(cards, positions);
  if (oppositeNarrative) {
    parts.push(`\n对立牌的叙事对比：`);
    parts.push(oppositeNarrative);
  }

  // 大牌集中度分析
  const majorCards = cards.filter((c) => c.suit === 'major');
  if (majorCards.length >= 2) {
    parts.push(`\n大阿卡纳集中度分析：`);
    parts.push(`多张${SUIT_NAMES.major}的出现揭示这是一个重要的生命课题阶段。${majorCards.map((c) => c.name).join('、')}共同编织了一个关于灵魂成长的宏大叙事，命运的轨迹正在以深刻的方式展开。这不是偶然的巧合，而是宇宙在回应你灵魂深处的呼唤。`);
  }

  // 技法9: 阵法空间能量
  if (cards.length >= 3) {
    parts.push(`\n【技法9·阵法空间能量】`);
    const spatialAnalysis = analyzeSpatialEnergy(cards, positions);
    if (spatialAnalysis) {
      parts.push(spatialAnalysis);
    }
  }

  return parts.join('\n\n');
}

/**
 * 生成时机分析（技法10: Timing时机分析）
 */
function generateTiming(
  cards: TarotCardWithOrientation[],
  spreadType: SpreadType
): string {
  const parts: string[] = [];
  parts.push(`【技法10·时机分析】`);

  // 基于花色的速度分析
  const speedAnalysis: string[] = [];
  cards.forEach((card) => {
    if (card.suit !== 'major') {
      const speed = SUIT_SPEED[card.suit];
      if (speed) {
        const num = typeof card.number === 'number' ? card.number : 0;
        const factor = Math.min(num, 10);
        const timingHint = speed.unit === '天' ? `${factor * 1}天到${factor * 3}天` :
                           speed.unit === '周' ? `${factor}周到${factor + 2}周` :
                           speed.unit === '月或年' ? `${Math.ceil(factor / 3)}个月到${Math.ceil(factor / 2)}个月` : '评估阶段';
        speedAnalysis.push(`${card.name}（${SUIT_NAMES[card.suit]}）：${speed.speed}能量，时间暗示约${timingHint}`);
      }
    } else {
      const num = typeof card.number === 'number' ? card.number : 0;
      speedAnalysis.push(`${card.name}（大阿卡纳）：灵魂层面的重大Timing，属于${num <= 7 ? '短期灵魂课题' : num <= 14 ? '中期成长周期' : '长期命运转折点'}`);
    }
  });

  if (speedAnalysis.length > 0) {
    parts.push(`基于牌面花色与数字的能量速度分析：`);
    speedAnalysis.forEach((s) => parts.push(`• ${s}`));
  }

  // 基于阵法的总体时机
  const spreadTimings: Record<string, string> = {
    single: '\n单牌显示的是当下的核心能量，其影响通常是即时的。如果你正在面临一个需要立即决定的问题，这张牌给出的指引适用于当下至未来一到两周内。权杖牌的影响最快（1-3天），圣杯牌为中速（1-2周），宝剑牌为思考评估期，星币牌的影响最为深远（1-3个月）。',
    three: '\n三张牌阵揭示从过去到现在再到未来的时间流。第一张牌的影响通常已经消退或正在消退（过去1-3个月），第二张牌代表当下的核心能量（未来1-2个月），第三张牌指向更长远的发展趋势（未来3-6个月）。建议你以第二张牌为核心行动点，同时用第三张牌作为长期参考。',
    celtic: '\n凯尔特十字覆盖三到六个月的时间跨度。中心两张牌反映当下最核心议题（未来2-4周），近期过去和近期未来牌指向1-2个月的发展，深层内外影响涉及更长期的模式，最终结果牌通常指向三至六个月后的趋势。',
    relationship: '\n关系牌阵关注的关系动态周期通常为两到四个月。自己、对方和关系现状三张牌反映当下的能量状态，挑战和潜力牌指向未来一到两个月的发展，最终建议牌适用于整个周期。',
    horseshoe: '\n马蹄牌阵的时间跨度通常为三到六个月，从过去的影响延伸到未来的结果。建议以周为单位追踪进展，特别关注第三张隐藏因素和第五张最佳行动所指示的时间节点。',
    year: '\n年度运势牌阵覆盖整整一年的时间周期，每一张牌代表两个月的运势走向。建议你以两个月为周期回顾和验证这些指引，同时保持灵活性，因为自由意志和外在环境的变化都会影响最终的发展。',
  };
  parts.push(spreadTimings[spreadType] || spreadTimings.single);

  // 数字能量学的时间暗示
  const numerologyTimings = cards.filter((c) => c.suit !== 'major').map((c) => {
    const num = typeof c.number === 'number' ? c.number : 0;
    if (num >= 1 && num <= 10) {
      return NUMEROLOGY[num]?.timing || '';
    }
    return '';
  }).filter(Boolean);

  if (numerologyTimings.length > 0) {
    parts.push(`\n数字能量学的时间密码：牌阵中的数字暗示${numerologyTimings.join('、')}的时间节律，建议你顺应这些数字能量的自然流动来安排行动节奏。`);
  }

  return parts.join('\n\n');
}

/**
 * 生成综合分析
 */
function generateSynthesis(
  cards: TarotCardWithOrientation[],
  questionType: QuestionType,
  spreadType: SpreadType
): string {
  const questionLabel = QUESTION_TYPES[questionType] || '生活';
  const spreadName = SPREAD_NAMES[spreadType] || '塔罗占卜';
  const keywords = cards.map((c) => (c.isReversed ? c.keywordsReversed : c.keywordsUpright)).flat();
  const uniqueKeywords = [...new Set(keywords)].slice(0, 8);

  // 核心主题提炼
  const majorCards = cards.filter((c) => c.suit === 'major');
  const elementCounts = analyzeElements(cards);
  const dominantElement = Object.entries(elementCounts).filter(([k]) => k !== '无').sort((a, b) => b[1] - a[1])[0];

  let synthesis = `【${spreadName}·综合分析】\n\n`;

  synthesis += `你以「${questionLabel}」为核心议题展开的${spreadName}，通过${cards.length}张牌编织出一个完整的叙事。核心关键词：${uniqueKeywords.join('、')}。\n\n`;

  // 叙事弧线
  synthesis += `叙事弧线：${cards[0].name}${cards[0].isReversed ? '（逆位）' : '（正位）'}开启了${questionLabel}议题的序幕`;
  if (cards.length > 1) {
    synthesis += `，${cards[1].name}${cards[1].isReversed ? '（逆位）' : '（正位）'}深化了核心主题`;
  }
  if (cards.length > 2) {
    for (let i = 2; i < cards.length - 1; i++) {
      synthesis += `，${cards[i].name}${cards[i].isReversed ? '（逆位）' : '（正位）'}带来了新的视角与挑战`;
    }
    synthesis += `，而最终的${cards[cards.length - 1].name}${cards[cards.length - 1].isReversed ? '（逆位）' : '（正位）'}为整个故事${cards[cards.length - 1].isReversed ? '提出了需要面对的深层课题' : '画下了阶段性圆满的结局'}。`;
  } else {
    synthesis += `。`;
  }

  synthesis += `\n\n`;

  // 能量总览
  synthesis += `能量总览：`;
  if (dominantElement) {
    synthesis += `以${dominantElement[0]}元素为主导，${ELEMENT_DESC[dominantElement[0]]?.trait}贯穿整个牌阵。`;
  }
  if (majorCards.length > 0) {
    synthesis += `${majorCards.length}张大阿卡纳（${majorCards.map((c) => c.name).join('、')}）揭示这是灵魂成长的重要节点，不是普通日常事件。`;
  }
  synthesis += `\n\n`;

  // 最重要的讯息
  const reversedCount = cards.filter((c) => c.isReversed).length;
  const uprightCount = cards.length - reversedCount;
  synthesis += `最重要的讯息：`;
  if (reversedCount === 0) {
    synthesis += `全正位的牌阵显示出顺畅流动的能量，当前的${questionLabel}局势相对明朗。然而，顺境中最大的挑战是保持觉知和谦逊——不要让顺利成为懈怠的理由。珍惜当下拥有的有利条件，同时持续深耕，为未来的挑战做好准备。`;
  } else if (reversedCount > uprightCount) {
    synthesis += `逆位牌数量占优显示你正处于需要深度内省和内在调整的时期。${questionLabel}领域的挑战不是外在敌人，而是内在需要被看见和转化的模式。这是一个珍贵的成长机会——当你勇敢地面对阴影，你就掌握了蜕变的钥匙。`;
  } else {
    synthesis += `正位与逆位的平衡分布显示你正处于一个动态成长的阶段。${questionLabel}的道路上既有顺流的支持，也有需要克服的阻力。这张牌阵传达的最重要讯息是：光明与阴影共同构成了真实的道路，拥抱两者，你就掌握了完整的智慧。`;
  }

  synthesis += `\n\n记住，塔罗不是预言命运的判决书，而是一面映照内心的镜子。它向你展示的是当下的能量走向，而你始终拥有选择的自由。在${questionLabel}的道路上，保持觉知、信任直觉、同时脚踏实地地行动，你正在走向属于自己的圆满。`;

  return synthesis;
}

/**
 * 生成建议
 */
function generateSuggestions(
  cards: TarotCardWithOrientation[],
  spreadType: SpreadType,
  questionType: QuestionType
): string[] {
  const questionLabel = QUESTION_TYPES[questionType] || '生活';
  const uprightCards = cards.filter((c) => !c.isReversed);
  const reversedCards = cards.filter((c) => c.isReversed);
  const suggestions: string[] = [];

  // 基于正位牌的建议
  if (uprightCards.length > 0) {
    const uc = uprightCards[0];
    suggestions.push(`【正位能量运用】在${questionLabel}方面，${uc.name}的正位能量是你当前最有力的盟友。它提示你应当${uc.adviceUpright} 这是当前最有利的行动方向，值得优先投入时间和精力。`);
  }

  // 基于逆位牌的建议
  if (reversedCards.length > 0) {
    const rc = reversedCards[0];
    suggestions.push(`【逆位课题转化】${rc.name}逆位揭示了你当前需要面对的课题——${rc.adviceReversed} 避免在这个领域重复过去的模式，将注意力转向修复和调整。逆位不是终点，而是转化的起点。`);
  }

  // 基于元素的建议
  const elements = analyzeElements(cards);
  const dominant = Object.entries(elements).filter(([k]) => k !== '无').sort((a, b) => b[1] - a[1])[0];
  const missing = analyzeMissingElements(elements);
  if (dominant) {
    const [name] = dominant;
    suggestions.push(`【元素平衡指引】当前${name}元素最为活跃（${ELEMENT_DESC[name]?.trait}），建议你善用这股能量${ELEMENT_DESC[name]?.action}。${missing.missing.length > 0 ? `同时注意补充缺失的${missing.missing.join('、')}元素——${missing.missing.includes('火') ? '增加行动力，勇敢迈出第一步' : ''}${missing.missing.includes('水') ? '关注情感需求，倾听内心声音' : ''}${missing.missing.includes('风') ? '加强理性思考，清晰表达想法' : ''}${missing.missing.includes('土') ? '建立务实基础，脚踏实地执行' : ''}。` : ''}`);
  }

  // 基于阵法的建议
  if (cards.length >= 3) {
    const centerIdx = Math.floor(cards.length / 2);
    const centerCard = cards[centerIdx];
    suggestions.push(`【核心行动建议】牌阵中心${centerCard.name}揭示了你当前最需要关注的方向。${centerCard.isReversed ? '逆位的能量提示你先处理内在的调整课题，待能量顺畅后再推进外在行动。' : '正位的能量支持你积极行动，把握当下的有利时机。'}建议每天花十分钟回顾这张牌的指引，保持觉知。`);
  }

  // 综合肯定
  suggestions.push(`【灵性肯定】无论你当前面临什么样的挑战，请记住：塔罗揭示的是能量的流动趋势，而非固定的命运。你的每一个选择都在重塑未来。保持信心，相信直觉，同时脚踏实地地行动。你有力量创造自己想要的生活，这份力量一直都在你心中。宇宙的丰盛永远向你敞开，你值得拥有一切美好的可能。`);

  return suggestions;
}

/**
 * 生成肯定语
 */
function generateAffirmation(
  cards: TarotCardWithOrientation[],
  questionType: QuestionType
): string {
  const questionLabel = QUESTION_TYPES[questionType] || '生活';
  const majorCard = cards.find((c) => c.suit === 'major');
  const uprightCards = cards.filter((c) => !c.isReversed);
  const reversedCount = cards.filter((c) => c.isReversed).length;

  // 融入大阿卡纳灵魂之旅
  if (majorCard) {
    const ori = majorCard.isReversed ? '逆位' : '正位';
    const fj = getFoolsJourney(majorCard);
    const affirmation = `我接纳${majorCard.name}（${ori}）${fj ? `——在${fj.split('——')[0]}的灵魂阶段` : ''}带来的课题与礼物。在${questionLabel}的旅程中，我愿意以勇气和智慧面对一切，相信每一次经历都在塑造更完整的自己。无论${reversedCount > 0 ? '前方的道路有多少需要转化的阴影' : '当下的顺境还是逆境'}，我都拥有穿越它们的力量。宇宙与我同在，丰盛与喜悦是我的自然状态。我选择爱与光，我选择成长与自由。`;
    return affirmation;
  }

  // 基于元素
  const elements = analyzeElements(cards);
  const dominant = Object.entries(elements).filter(([k]) => k !== '无').sort((a, b) => b[1] - a[1])[0];
  if (dominant) {
    const [name] = dominant;
    const desc = ELEMENT_DESC[name];
    return `我以${name}元素的力量为指引——${desc?.trait}在我体内流淌。在${questionLabel}的道路上，我${desc?.action}，在${reversedCount > 0 ? '挑战中' : '顺境中'}保持觉知与平衡。我信任生命的流动，相信每一步都在带我走向更高的自己。我是自己生命的创造者，我值得丰盛、喜悦与圆满。`;
  }

  return `我信任宇宙的指引，在${questionLabel}的道路上，每一步都带我更接近真正的自己。我拥有创造美好改变的所有力量，我值得被爱与被祝福。`;
}

/**
 * 生成阵法总括
 */
function generateOverall(
  cards: TarotCardWithOrientation[],
  spreadType: SpreadType,
  questionType: QuestionType,
  question: string
): string {
  const spreadName = SPREAD_NAMES[spreadType] || '塔罗占卜';
  const questionLabel = QUESTION_TYPES[questionType] || '生活';
  const uprightCount = cards.filter((c) => !c.isReversed).length;
  const reversedCount = cards.length - uprightCount;
  const majorCount = cards.filter((c) => c.suit === 'major').length;

  let overall = `你选择的${spreadName}，以「${questionLabel}」为核心议题展开探索。`;
  if (question) {
    overall += `你的问题「${question}」正在被塔罗以多维度的智慧回应。`;
  }
  overall += `\n\n`;

  // 正逆位总览
  if (reversedCount === 0) {
    overall += `在这副牌阵中，所有${cards.length}张牌均为正位，显示当前的能量流动相对顺畅，宇宙正在以明确的方式回应你的询问。这通常意味着你正处于一个与内在意图对齐的阶段，外在的阻碍较少，适合积极行动。然而，全正位也提醒你：在顺境中保持觉知，不要因为顺利而忽略了深层的成长课题。`;
  } else if (uprightCount === 0) {
    overall += `在这副牌阵中，所有${cards.length}张牌均为逆位——这是一个强烈的信号，提示你当前的局势中存在较多内在阻滞或未被充分觉察的议题。逆位并非坏事，它们像镜子一样映照出需要被看见和调整的部分。这是一个深入内省、重新校准方向的珍贵时机。请记住：逆位不是终点，而是转化的起点。`;
  } else {
    overall += `在这副牌阵中，正位与逆位的分布显示出能量的动态平衡——${uprightCount}张正位牌代表当下流动的、显性的能量和机遇，${reversedCount}张逆位牌则指向需要被关注的内在课题和转化中的能量。这副牌传递的核心信息是：在${questionLabel}的领域中，你既拥有前行的动力和方向，也需要面对和调整某些深层的模式。这不是冲突，而是成长的完整图景——光明与阴影共同构成了真实的道路。`;
  }

  overall += `\n\n`;

  // 大阿卡纳提示
  if (majorCount > 0) {
    const majorNames = cards.filter((c) => c.suit === 'major').map((c) => c.name).join('、');
    overall += `值得注意的是，牌阵中出现${majorCount}张大阿卡纳（${majorNames}）。`;
    overall += `大阿卡纳的出现说明这不是普通日常事件，而是关乎灵魂成长的重要节点。你正在经历的${questionLabel}课题，实际上是灵魂旅程中一个必经的里程碑。`;
    overall += `\n\n`;
  }

  // 叙事概述
  overall += `整体而言，这副牌揭示了一个关于${questionLabel}的深刻故事：${cards[0].name}${cards[0].isReversed ? '（逆位）' : '（正位）'}开启了议题的序幕`;
  if (cards.length > 1) {
    overall += `，${cards[1].name}${cards[1].isReversed ? '（逆位）' : '（正位）'}深化了核心主题`;
  }
  if (cards.length > 2) {
    for (let i = 2; i < cards.length - 1; i++) {
      overall += `，${cards[i].name}${cards[i].isReversed ? '（逆位）' : '（正位）'}带来新的维度`;
    }
    overall += `，而${cards[cards.length - 1].name}${cards[cards.length - 1].isReversed ? '（逆位）' : '（正位）'}为整个故事${cards[cards.length - 1].isReversed ? '提出了需要转化的深层课题' : '画下阶段性圆满的结局'}。`;
  } else {
    overall += `。`;
  }
  overall += `每一张牌都是这个完整叙事中不可或缺的章节，它们共同诉说着你灵魂此刻最需要聆听的智慧。`;

  return overall;
}

// ==================== 主解读函数 ====================

/**
 * 主解读函数 - 生成完整的塔罗解读
 * 融入10大高级解读技法
 */
export function generateReading(
  question: string,
  spread: { id: string; name: string; positions: { name: string }[] },
  cards: TarotCardWithOrientation[]
): Reading {
  const spreadType = (spread?.id as SpreadType) || 'three';
  const questionType = inferQuestionType(question);
  const elements = analyzeElements(cards);

  // 阵法总括
  const overall = generateOverall(cards, spreadType, questionType, question);

  // 能量分析（技法1+5+7+8）
  const energyAnalysis = generateEnergyAnalysis(elements, cards);

  // 分牌解读（核心：每张牌300-400字深度解读）
  const cardReadings = generateCardReadings(cards, spreadType, questionType, question);

  // 交叉分析（技法2+9）
  const crossAnalysis = generateCrossAnalysis(cards, spreadType);

  // 综合分析
  const synthesis = generateSynthesis(cards, questionType, spreadType);

  // 时机分析（技法10）
  const timing = generateTiming(cards, spreadType);

  // 建议
  const suggestions = generateSuggestions(cards, spreadType, questionType);

  // 肯定语
  const affirmation = generateAffirmation(cards, questionType);

  return {
    overall,
    energyAnalysis,
    cardReadings,
    crossAnalysis,
    synthesis,
    timing,
    suggestions,
    affirmation,
  };
}

export default { generateReading };
