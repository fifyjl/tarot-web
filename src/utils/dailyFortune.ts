import type { TarotCard } from '@/data/tarotData';

export interface FortuneReading {
  overall: string;
  love: string;
  career: string;
  wealth: string;
  health: string;
  suggestions: string[];
  lucky: { color: string; number: string; direction: string; time: string };
}

const LUCKY_DATA = {
  colors: ['紫色', '粉色', '金色', '白色', '蓝色', '绿色', '红色', '银色'],
  numbers: ['3', '7', '9', '12', '21', '5', '8', '11', '17', '33'],
  directions: ['正南', '东南', '正东', '东北', '正北', '西北', '正西', '西南'],
  times: ['辰时(7-9点)', '巳时(9-11点)', '午时(11-13点)', '未时(13-15点)', '申时(15-17点)', '酉时(17-19点)'],
};

function getRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getFortuneStars(isReversed: boolean): string {
  return isReversed ? '⭐⭐⭐' : '⭐⭐⭐⭐⭐';
}

const ELEMENT_NAMES: Record<string, string> = {
  wands: '权杖·火',
  cups: '圣杯·水',
  swords: '宝剑·风',
  pentacles: '星币·土',
  major: '大阿卡纳',
};

// 正位建议生成（基于牌的具体关键词和含义）
function generateUprightSuggestions(card: TarotCard): string[] {
  const { name, englishName, keywordsUpright, meaningUpright, suit, element } = card;
  const kw = keywordsUpright;
  const meaning = meaningUpright;

  // 从关键词中选取核心主题词
  const themes = kw.slice(0, 3);

  return [
    `「${name}」启示你：${themes[0]}是当下的核心课题。${meaning.split('。')[0]}，试着在行动中融入这种能量。`,
    `这张牌建议你以「${themes[1]}」的心态面对——${kw.slice(3, 5).join('、')}都是你能调用的内在资源。`,
    `「${name}」提醒：${meaning.split('。').slice(0, 2).join('。')}。这种能量会引导你找到正确的方向。`,
    `${suit === 'major' ? '作为大阿卡纳，' + name + '代表着灵魂层面的成长。' : element ? '「' + ELEMENT_NAMES[suit] + '」的元素能量提醒你：' : ''}${themes[2] || themes[0]}是关键，顺应它而非抗拒。`,
    `今天可以尝试一件与「${themes[0]}」相关的小事，哪怕只是改变一个习惯——${name}的能量会通过这些微小的行动积累。`,
    `「${name}」说：你比自己想象的更有${kw[kw.length - 1] || themes[0]}的力量。信任这个过程，即使看不到完整的图景。`,
    `把这张牌的意象放在心上——${name}（${englishName}）象征${meaning.split('。')[0]}，让这种智慧成为你今天的内在指引。`,
  ].filter(Boolean);
}

// 逆位建议生成
function generateReversedSuggestions(card: TarotCard): string[] {
  const { name, englishName, keywordsReversed, meaningReversed, suit, element } = card;
  const kw = keywordsReversed;
  const meaning = meaningReversed;
  const themes = kw.slice(0, 3);

  return [
    `「${name}」逆位提示：${themes[0]}可能是你正在经历的挑战。${meaning.split('。')[0]}，但这只是暂时的能量状态。`,
    `这张牌建议你留意「${themes[1]}」的倾向——${kw.slice(3, 5).join('、')}都是信号，不是判决。觉察即转化。`,
    `「${name}」逆位说：${meaning.split('。').slice(0, 2).join('。')}。给自己多一些耐心和宽容。`,
    `${suit === 'major' ? '大阿卡纳逆位往往是深层的转化信号。' + name + '邀请你：' : element ? '「' + ELEMENT_NAMES[suit] + '」元素逆位时，' : ''}${themes[2] || themes[0]}需要被看见，而不是被压抑。`,
    `今天适合慢下来。${name}逆位不是"坏"的预兆，而是在说：${meaning.split('。')[0]}。停下来聆听内在的声音。`,
    `「${name}」提醒你：${kw[kw.length - 1] || themes[0]}的感觉会过去。试着用温柔的方式对待自己，就像对待一位正在经历困难的朋友。`,
    `逆位的${name}（${englishName}）在说：${meaning.split('。')[0]}。这不是终点，而是一个让你重新调整、更深入理解自己的机会。`,
  ].filter(Boolean);
}

export function generateFortuneReading(card: TarotCard & { isReversed: boolean }): FortuneReading {
  const name = card.name;
  const orientation = card.isReversed ? '逆位' : '正位';
  const meaning = card.isReversed ? card.meaningReversed : card.meaningUpright;
  const suit = card.suit;
  const element = card.element;

  // 基于牌的 suit 和 element 生成不同方向的运势
  const elementTheme =
    element === 'fire'
      ? '热情与行动力'
      : element === 'water'
        ? '情感与直觉'
        : element === 'air'
          ? '思维与沟通'
          : element === 'earth'
            ? '稳定与务实'
            : '灵性成长';

  // 综合运势（60-80字）
  const overall = `${name}（${orientation}）为你揭示今日运势。${meaning.split('。')[0]}。今天你的核心能量围绕"${elementTheme}"展开，整体呈现${card.isReversed ? '内敛调整' : '积极拓展'}的态势。建议顺应这股能量，${card.isReversed ? '放慢脚步，向内反思' : '主动出击，把握机遇'}。`;

  // 爱情运势（40-60字）
  const love = card.isReversed
    ? `${name}的逆位提示感情方面需要更多耐心。今天可能感受到一些沟通上的摩擦，但不要急于下结论。给彼此一些空间，明天会更好。`
    : `${name}正位带来积极的爱情能量。今天适合表达心意或约会。你的魅力值在线，容易获得对方的好感。单身的你可能遇到有趣的灵魂。`;

  // 事业运势（40-60字）
  const career = card.isReversed
    ? `工作上今天可能遇到一些小阻碍，${name}逆位提醒你不要硬碰硬。灵活调整策略，暂时退后一步反而能找到更好的突破口。`
    : `${name}正位为你的事业注入动力。今天适合推进重要项目或向上司展示成果。你的努力容易被看见，把握机会表现自己。`;

  // 财富运势（40-60字）
  const wealth = card.isReversed
    ? `财运方面今天需要保守一些。${name}逆位提醒避免冲动消费或冒险投资。把钱花在刀刃上，不必要的开支可以先放一放。`
    : `${name}正位显示财运平稳向好。今天可能有意外的小收获，或是一个不错的理财机会出现。保持开放心态，但决策前多想想。`;

  // 健康运势（40-60字）
  const health = card.isReversed
    ? `身体今天可能有些疲惫信号。${name}逆位建议你多休息，不要勉强自己。适当的放松和早睡比任何补品都有效。`
    : `${name}正位显示身体状态不错。今天适合运动或户外活动，新鲜空气能进一步提升你的能量水平。保持这个好状态！`;

  // 建议（3-10条，基于牌的具体含义动态生成）
  const baseSuggestions = card.isReversed
    ? generateReversedSuggestions(card)
    : generateUprightSuggestions(card);

  // 根据牌的 suit 添加1-2条专属建议
  const suitSuggestions: Record<string, string[]> = {
    wands: [
      element === 'fire'
        ? '今天适合运动或户外活动，让身体动起来！'
        : '找个时间晒晒太阳，火元素需要阳光滋养。',
    ],
    cups: [
      '今天给自己泡一杯热茶或咖啡，享受片刻的宁静时光。',
      '对身边的人说一句"谢谢"或"我爱你"，情感的流动会带来温暖。',
    ],
    swords: [
      '今天做决策时，先写下来利弊清单，理性分析后再行动。',
      '如果脑子很乱，试试把所有想法写在纸上，然后放一边。',
    ],
    pentacles: [
      '今天整理一下钱包或记账，财务的清晰会带来安全感。',
      '花点时间整理工作或学习空间，环境的整洁提升效率。',
    ],
    major: [
      '今天可能发生一件让你"恍然大悟"的小事，保持觉知。',
      '记住：你正在经历的是一段灵魂成长的旅程，每一个体验都有意义。',
    ],
  };

  const extraSuggestions = suitSuggestions[suit] || [];
  const allSuggestions = [...baseSuggestions.slice(0, 5), ...extraSuggestions.slice(0, 2)];

  // 如果牌很好（正位+大牌），多给几条
  if (!card.isReversed && suit === 'major') {
    allSuggestions.push(
      '今天的经历可能会在很久以后回想起来才发现它的重要意义，珍惜当下。',
    );
  }

  return {
    overall,
    love,
    career,
    wealth,
    health,
    suggestions: allSuggestions.slice(0, 10),
    lucky: {
      color: getRandom(LUCKY_DATA.colors),
      number: getRandom(LUCKY_DATA.numbers),
      direction: getRandom(LUCKY_DATA.directions),
      time: getRandom(LUCKY_DATA.times),
    },
  };
}
