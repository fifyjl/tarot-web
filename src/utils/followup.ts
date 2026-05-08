import type { TarotCard } from '@/data/tarotData';
import type { Spread } from '@/data/spreads';
import { SPREADS } from '@/data/spreads';
import type { Reading } from '@/utils/interpreter';
import { getCurrentReading, setCurrentReading } from '@/utils/session';

export interface FollowUpRecord {
  id: string;
  timestamp: number;
  question: string;
  approach: 'deep-dive' | 'new-draw';
  answer: string;
  focusCard?: number;
  newCards?: (TarotCard & { isReversed: boolean })[];
  combinedReading?: string;
}

export interface FollowUpInput {
  originalQuestion: string;
  followUpQuestion: string;
  cards: (TarotCard & { isReversed: boolean })[];
  reading: Reading;
  spread: Spread;
}

// ==================== 追问分类逻辑 ====================

/** 追问类型 */
type FollowUpType = 'action' | 'timing' | 'cause' | 'other' | 'outcome' | 'decision' | 'general';

interface FollowUpCategory {
  type: FollowUpType;
  label: string;
  focusPositions: number[];
  confidenceBias: number; // 0-1, 越高越乐观
}

function classifyFollowUp(question: string): FollowUpCategory {
  const q = question.toLowerCase();

  // 行动类：怎么办|怎么做|该如何|方法|步骤|行动
  if (/怎么办|怎么做|该如何|方法|步骤|行动|建议|出路|途径/.test(q)) {
    return {
      type: 'action',
      label: '行动指引',
      focusPositions: [2, 1, 0], // 优先未来/现在/过去
      confidenceBias: 0.6,
    };
  }

  // 时机类：什么时候|多久|时间|何时|几天
  if (/什么时候|多久|时间|何时|几天|多久|周期| timing/.test(q)) {
    return {
      type: 'timing',
      label: '时机分析',
      focusPositions: [2, 1, 0],
      confidenceBias: 0.5,
    };
  }

  // 原因类：为什么|原因|怎么会|为何
  if (/为什么|原因|怎么会|为何|怎么回事|根源/.test(q)) {
    return {
      type: 'cause',
      label: '根源探究',
      focusPositions: [0, 1, 2], // 优先过去
      confidenceBias: 0.5,
    };
  }

  // 对方视角：他怎么想|她怎么看|对方|别人|对方态度
  if (/他怎么想|她怎么看|对方|别人|对方态度|对方感受|对方想法/.test(q)) {
    return {
      type: 'other',
      label: '对方视角',
      focusPositions: [1, 2, 0],
      confidenceBias: 0.5,
    };
  }

  // 结果类：会成功吗|有希望吗|能行吗|结果|结局
  if (/会成功吗|有希望吗|能行吗|结果|结局|最终|成功|失败/.test(q)) {
    return {
      type: 'outcome',
      label: '结果评估',
      focusPositions: [2, 1, 0], // 优先未来
      confidenceBias: 0.7,
    };
  }

  // 决策类：还能|还要|继续|坚持|放弃|该不该|要不要
  if (/还能|还要|继续|坚持|放弃|该不该|要不要|是否|抉择/.test(q)) {
    return {
      type: 'decision',
      label: '决策分析',
      focusPositions: [1, 2, 0],
      confidenceBias: 0.5,
    };
  }

  // 默认：综合类
  return {
    type: 'general',
    label: '综合分析',
    focusPositions: [1, 2, 0],
    confidenceBias: 0.5,
  };
}

// ==================== 花色与元素映射 ====================

const SUIT_NAMES: Record<string, string> = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
  major: '大阿卡纳',
};

const ELEMENT_MAP: Record<string, string> = {
  wands: '火',
  cups: '水',
  swords: '风',
  pentacles: '土',
};

// ==================== 核心追问回答生成 ====================

/**
 * 生成追问回答（200字+）
 */
export function generateFollowUpAnswer(input: FollowUpInput): FollowUpRecord {
  const { followUpQuestion, cards, reading, spread } = input;
  const category = classifyFollowUp(followUpQuestion);

  // 确定聚焦牌：按追问类型优先级选择
  let focusCardIndex = 0;
  for (const posIdx of category.focusPositions) {
    if (posIdx < cards.length) {
      focusCardIndex = posIdx;
      break;
    }
  }
  // 如果该位置没有牌（如单牌阵），默认选最后一张
  if (focusCardIndex >= cards.length) {
    focusCardIndex = cards.length - 1;
  }

  const focusCard = cards[focusCardIndex];
  const orientation = focusCard.isReversed ? '逆位' : '正位';

  // 获取对应位置的名称
  const positionName = spread.positions[focusCardIndex]?.name || '核心位置';

  // 计算信心指数
  const uprightCount = cards.filter((c) => !c.isReversed).length;
  const totalCount = cards.length;
  const baseConfidence = Math.round((uprightCount / totalCount) * 100);
  const adjustedConfidence = Math.min(95, Math.max(20, Math.round(baseConfidence * category.confidenceBias * 1.2)));

  // 构建回答内容
  const answer = buildAnswer(input, category, focusCardIndex, positionName, adjustedConfidence);

  return {
    id: Date.now().toString(),
    timestamp: Date.now(),
    question: followUpQuestion,
    approach: 'deep-dive',
    answer,
    focusCard: focusCardIndex,
  };
}

/**
 * 构建追问回答文本（确保200字+）
 */
function buildAnswer(
  input: FollowUpInput,
  category: FollowUpCategory,
  focusCardIndex: number,
  positionName: string,
  confidence: number
): string {
  const { followUpQuestion, cards, reading } = input;
  const focusCard = cards[focusCardIndex];
  const orientation = focusCard.isReversed ? '逆位' : '正位';

  // 【核心回应】80-100字
  const coreResponse = generateCoreResponse(input, category, focusCardIndex, positionName);

  // 【牌面依据】60-80字
  const cardBasis = generateCardBasis(focusCard, orientation, positionName, category);

  // 【延伸建议】60-80字
  const extendedAdvice = generateExtendedAdvice(input, category, focusCardIndex);

  // 【信心指数】20字
  const confidenceLine = generateConfidenceLine(confidence, cards);

  // 【前后一致声明】确保与主解读不矛盾
  const consistencyLine = generateConsistencyLine(reading, focusCard, focusCardIndex);

  return `关于你的追问「${followUpQuestion}」，基于你之前抽出的牌面，答案是：

【核心回应】
${coreResponse}

【牌面依据】
${cardBasis}

【延伸建议】
${extendedAdvice}

【信心指数】${confidenceLine}

${consistencyLine}`;
}

function generateCoreResponse(
  input: FollowUpInput,
  category: FollowUpCategory,
  focusCardIndex: number,
  positionName: string
): string {
  const { cards, followUpQuestion } = input;
  const focusCard = cards[focusCardIndex];
  const orientation = focusCard.isReversed ? '逆位' : '正位';

  // 提取追问中的关键词片段（前30字以内）
  const qSnippet = followUpQuestion.length > 30 ? followUpQuestion.slice(0, 30) + '…' : followUpQuestion;

  const responses: Record<FollowUpType, string> = {
    action: focusCard.isReversed
      ? `针对你追问的「${qSnippet}」，牌面显示当前需要「先内后外」的策略。${focusCard.name}（${orientation}）位于「${positionName}」，表明在采取具体行动之前，你需要先处理${positionName.includes('过去') ? '历史遗留的' : '内在层面的'}调整课题。这不是说行动应该被无限期推迟，而是提醒你：有效的行动建立在能量顺畅流动的基础之上。先完成必要的内在整理，外在的行动自然会事半功倍。`
      : `针对你追问的「${qSnippet}」，牌面给出了明确的方向。${focusCard.name}（${orientation}）位于「${positionName}」，显示当前是积极行动的有利时机。建议你以${focusCard.keywordsUpright.slice(0, 2).join('、')}为核心指引，在具体执行中融入这些能量特质。不需要过度犹豫，牌面的顺畅能量支持你在${positionName.includes('未来') ? '未来的发展方向上' : '当前局势中'}主动出击。`,

    timing: focusCard.isReversed
      ? `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）传递的信息是需要「耐心等待」。逆位的能量暗示当前的时机尚未完全成熟，强行推进可能会遭遇意想不到的阻滞。建议你以「静观其变」为主策略，在等待的过程中持续观察和调整。具体的时机窗口将在你完成当前的内在调整后自然显现。`
      : `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）给出了积极的信号。正位能量显示时机正在向有利于你的方向移动，${positionName.includes('未来') ? '未来的时间窗口' : '当前阶段'}是采取行动的关键节点。建议你保持敏锐的觉察，在机会出现时果断把握——牌面的顺畅流动暗示宇宙正在为你铺路。`,

    cause: focusCard.isReversed
      ? `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）揭示了深层的问题根源。逆位状态下的${focusCard.name}指向${positionName}中尚未被完全整合的能量——这可能是被压抑的情绪、未被正视的恐惧，或是过去经验中形成的限制性模式。这个根源不是外在的敌人，而是内在需要被看见和转化的课题。建议你以温和但坚定的态度面对这个根源，转化将从觉察开始。`
      : `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）清晰地揭示了问题的根源所在。正位状态下的${focusCard.name}位于「${positionName}」，表明${positionName.includes('过去') ? '历史经验中' : '当前局势里'}的${focusCard.keywordsUpright[0]}能量是驱动当前状况的核心力量。这个根源既是问题所在，也是解决方案的线索——当你理解了${focusCard.name}在此位置的深层含义，你就握住了改变的钥匙。`,

    other: focusCard.isReversed
      ? `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）揭示了对方内心可能存在的不安或矛盾。逆位能量暗示对方当前的状态并非表面所见——他们可能在${focusCard.keywordsReversed[0]}的情绪中挣扎，或是正经历某种内在的转变。建议你给予对方更多的理解和空间，不要急于下判断，因为在逆位的影响下，对方的真实想法可能连他们自己尚未完全厘清。`
      : `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）展现了对方当前的真实状态。正位能量表明对方正处于${focusCard.keywordsUpright[0]}的能量状态中，他们的想法和行为是内在状态的外在映射。建议你以${focusCard.keywordsUpright[1]}的态度与对方互动，理解对方的立场不是为了改变他们，而是为了找到双方都能接受的连接方式。`,

    outcome: focusCard.isReversed
      ? `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）给出的信号是「有潜力，但需要转化」。逆位不意味着必然的失败，而是提醒你这个结果的可塑性很强——当前的轨迹指向一个需要克服内在障碍才能达成的目标。如果你能正视${focusCard.keywordsReversed[0]}的课题并积极调整，最终结果仍有向好的空间。关键在于你是否愿意面对逆位所揭示的调整需求。`
      : `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）传递了积极的信号。正位能量显示整体趋势向好，${positionName.includes('未来') || positionName.includes('结果') ? '未来的发展走向' : '当前的能量状态'}支持一个令人鼓舞的结果。当然，塔罗揭示的是能量趋势而非固定命运——你当下的每一个选择和行动，都在参与塑造最终的结果。保持信心，同时保持觉知。`,

    decision: focusCard.isReversed
      ? `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）建议你「暂缓决定，先处理内在课题」。逆位状态下的这张牌表明当前并非做出重大决策的最佳时机——你的内在能量存在某种阻滞，在这种情况下做出的决定可能会受到${focusCard.keywordsReversed[0]}的影响。建议你给自己更多的观察和沉淀时间，待能量重新顺畅后再做判断。`
      : `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）给出了倾向性的指引。正位能量支持你在「${positionName}」所代表的维度上做出积极的选择。牌面显示${focusCard.keywordsUpright[0]}的能量正在支持你，建议你信任这股内在的推动力，勇敢地做出决定。当然，最终决定权始终在你手中——塔罗是指南针，不是方向盘。`,

    general: focusCard.isReversed
      ? `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）从整体牌面中浮现为关键讯息。逆位状态下的这张牌提示你需要特别关注${positionName}中的能量阻滞——这不是一个局部问题，而是影响整体局势的核心节点。建议你以${focusCard.keywordsReversed[0]}为切入点，深入审视当前的处境，转化的契机往往藏在最不愿面对的地方。`
      : `关于你追问的「${qSnippet}」，${focusCard.name}（${orientation}）从整体牌面中浮现为关键讯息。正位能量在「${positionName}」位置顺畅流动，显示${focusCard.keywordsUpright[0]}是当前最值得关注的核心主题。建议你围绕这个能量特质展开思考和行动，牌面的整体趋势支持你在这一方向上积极探索。`,
  };

  return responses[category.type];
}

function generateCardBasis(
  focusCard: TarotCard & { isReversed: boolean },
  orientation: string,
  positionName: string,
  category: FollowUpCategory
): string {
  const suitName = SUIT_NAMES[focusCard.suit] || '特殊';
  const element = focusCard.suit !== 'major' ? ELEMENT_MAP[focusCard.suit] || '' : '';

  let basis = `你抽出的${focusCard.name}（${orientation}）位于「${positionName}」——`;

  if (focusCard.isReversed) {
    basis += `这张牌逆位时揭示了${focusCard.keywordsReversed.slice(0, 2).join('、')}的能量状态。`;
    basis += `作为${focusCard.suit === 'major' ? '大阿卡纳的灵魂课题牌' : `${suitName}（${element}元素）`}，`;
    basis += `它在此位置提醒你需要先处理${category.type === 'action' ? '内在调整再推进外在行动' : category.type === 'timing' ? '时机的成熟度问题' : category.type === 'cause' ? '根源课题的转化' : '相关的内在课题'}。`;
  } else {
    basis += `这张牌正位时展现了${focusCard.keywordsUpright.slice(0, 2).join('、')}的核心能量。`;
    basis += `作为${focusCard.suit === 'major' ? '大阿卡纳的重要灵魂牌' : `${suitName}（${element}元素）`}，`;
    basis += `它在此位置为${category.type === 'action' ? '你的行动提供了清晰的指引方向' : category.type === 'timing' ? '时机判断提供了积极的参考' : category.type === 'cause' ? '问题的根源提供了明确的线索' : '你的追问提供了重要的启示'}。`;
  }

  // 如果有多张牌，补充一张次要牌的讯息
  // 这里通过调用时传入的 cards 可以扩展，但当前聚焦单牌已足够

  return basis;
}

function generateExtendedAdvice(
  input: FollowUpInput,
  category: FollowUpCategory,
  focusCardIndex: number
): string {
  const { cards, reading } = input;
  const focusCard = cards[focusCardIndex];

  // 从主解读的建议中提取一条作为基础
  const mainSuggestion = reading.suggestions[0] || '';

  let advice = '';

  switch (category.type) {
    case 'action':
      advice = focusCard.isReversed
        ? `建议你本周内优先进行内在梳理：每天花15分钟反思${focusCard.keywordsReversed[0]}带给你的感受，记录下来。不要急于对外采取行动，先让自己的能量恢复平衡。可以参考主解读中的建议「${mainSuggestion.slice(0, 40)}...」，将其调整为更温和的步调执行。`
        : `建议你以${focusCard.keywordsUpright[0]}为核心展开具体行动：本周设定一个小目标，将${focusCard.name}的能量特质融入日常。参考主解读的建议「${mainSuggestion.slice(0, 40)}...」，在实际执行中保持灵活，但不要拖延启动的时机。`;
      break;
    case 'timing':
      advice = focusCard.isReversed
        ? `建议你建立一个「等待清单」，将需要在时机成熟后处理的事项记录下来。在等待期间，专注于个人能量和状态的准备。时机往往青睐有准备的人——当你在逆位课题中获得成长，正确的时机窗口出现时你将能更好地把握。`
        : `建议你保持敏锐的觉察，为即将到来的时机窗口做好准备。建立一个「行动准备清单」，确保当机会出现时你能够迅速响应。同时保持耐心，正位的能量流动需要时间显化在现实层面。`;
      break;
    case 'cause':
      advice = focusCard.isReversed
        ? `建议你以日记或冥想的方式深入探索这个根源课题。问自己：「我在${focusCard.keywordsReversed[0]}的体验中，真正害怕失去的是什么？」诚实的回答将带你找到转化的入口。必要时可以寻求信任的朋友或专业人士的支持。`
        : `建议你围绕${focusCard.keywordsUpright[0]}这个核心线索展开深入思考。理解根源不是为了归咎，而是为了获得改变的力量。当你真正理解了「为什么」，「怎么做」自然会变得清晰。`;
      break;
    case 'other':
      advice = focusCard.isReversed
        ? `建议你在与对方互动时保持温和与耐心，不要试图强行改变对方的想法或感受。给对方足够的空间去处理内在的${focusCard.keywordsReversed[0]}，你的理解和支持本身就是一种疗愈的力量。`
        : `建议你以${focusCard.keywordsUpright[0]}的态度与对方建立连接。主动但不过度，关心但不干涉。理解对方的立场后，寻找双方利益的交集点，这将是最有效的沟通策略。`;
      break;
    case 'outcome':
      advice = focusCard.isReversed
        ? `建议你不要把结果视为终点，而是视为一个持续的转化过程。专注于你能控制的部分——你的态度、你的行动、你的成长。当你持续在正确的方向上努力，结果自然会向积极的方向演变。`
        : `建议你保持信心同时保持行动。积极的结果是趋势，不是保证——你的持续努力是巩固这个趋势的关键。庆祝每一个小的进展，它们都是最终结果的重要组成部分。`;
      break;
    case 'decision':
      advice = focusCard.isReversed
        ? `建议你将重大决策推迟到你感到内在更加清晰和稳定的时候。在此期间，收集更多信息、咨询信任的人、倾听直觉的声音。好的决策往往诞生于充分的准备，而非仓促的选择。`
        : `建议你信任牌面传递的积极信号，同时确保你的决策建立在充分的信息和内心的确认之上。如果内心仍有犹豫，给自己一个最后的确认期限——在该期限到来时，勇敢地做出选择并承担其后的旅程。`;
      break;
    default:
      advice = focusCard.isReversed
        ? `建议你以${focusCard.keywordsReversed[0]}为切入点，深入审视当前的处境。转化往往始于觉察，当你真正看见问题所在，改变就已经开始了百分之五十。保持耐心和信心。`
        : `建议你围绕${focusCard.keywordsUpright[0]}这个核心主题展开积极的探索和行动。牌面的能量支持你在这个方向上前行，保持觉知、信任直觉、脚踏实地地行动，你正在走向属于自己的答案。`;
  }

  return advice;
}

function generateConfidenceLine(confidence: number, cards: (TarotCard & { isReversed: boolean })[]): string {
  const uprightRatio = Math.round((cards.filter((c) => !c.isReversed).length / cards.length) * 100);

  if (confidence >= 70) {
    return `信心指数：${confidence}%（牌面正位能量充沛，整体趋势积极向好）`;
  } else if (confidence >= 50) {
    return `信心指数：${confidence}%（正逆位平衡，转化空间充足，结果可塑性强）`;
  } else {
    return `信心指数：${confidence}%（当前以逆位课题为主，转化后有望提升至${Math.min(90, confidence + 30)}%）`;
  }
}

function generateConsistencyLine(
  reading: Reading,
  focusCard: TarotCard & { isReversed: boolean },
  focusCardIndex: number
): string {
  // 从主解读的综合分析中提取一个关键短语，确保追问解读与之呼应
  const synthesisPreview = reading.synthesis.slice(0, 60).replace(/\n/g, ' ');

  return `注：此追问解读与主解读一脉相承。主解读中指出「${synthesisPreview}...」，本次追问聚焦于${focusCard.name}在牌阵中的深层含义，两者共同构成完整的指引图景。`;
}

// ==================== 新旧牌结合解读生成 ====================

/**
 * 当用户选择"再抽牌深入"时，生成新旧牌结合的解读
 */
export function generateCombinedReading(
  oldCards: (TarotCard & { isReversed: boolean })[],
  newCards: (TarotCard & { isReversed: boolean })[],
  oldReading: Reading,
  newSpread: Spread,
  oldSpread: Spread
): string {
  const parts: string[] = [];

  parts.push(`【二次占卜·结合解读】\n`);
  parts.push(`前一次占卜使用「${oldSpread.name}」，新抽牌使用「${newSpread.name}」。新旧牌面展开一场跨越时空的对话，共同揭示更深层的指引。\n`);

  // 分析新旧牌之间的关系
  const relationships = analyzeCardRelationships(oldCards, newCards);

  if (relationships.length > 0) {
    parts.push(`【牌面对话】`);
    relationships.forEach((rel) => parts.push(rel));
    parts.push('');
  }

  // 生成新牌解读（结合旧牌上下文）
  parts.push(`【新牌深入解读】`);
  newCards.forEach((newCard, i) => {
    const positionName = newSpread.positions[i]?.name || `第${i + 1}张牌`;
    const orientation = newCard.isReversed ? '逆位' : '正位';

    // 找到与新牌最有联系的旧牌
    const linkedOldCard = findLinkedOldCard(newCard, oldCards);
    const linkText = linkedOldCard
      ? `（与前次的${linkedOldCard.name}${linkedOldCard.isReversed ? '逆位' : '正位'}形成呼应）`
      : '';

    parts.push(`「${positionName}」${newCard.name}（${orientation}）${linkText}`);

    // 结合旧牌上下文生成解读
    const contextualMeaning = generateContextualMeaning(newCard, linkedOldCard, positionName, oldReading);
    parts.push(contextualMeaning);
    parts.push('');
  });

  // 综合新视角
  parts.push(`【整合新视角】`);
  const integration = generateIntegration(oldCards, newCards, oldReading, relationships);
  parts.push(integration);

  return parts.join('\n');
}

/**
 * 分析新旧牌之间的关系，返回关系描述数组
 */
function analyzeCardRelationships(
  oldCards: (TarotCard & { isReversed: boolean })[],
  newCards: (TarotCard & { isReversed: boolean })[]
): string[] {
  const relationships: string[] = [];

  for (const newCard of newCards) {
    for (const oldCard of oldCards) {
      // 规则1：同花色
      if (newCard.suit === oldCard.suit && newCard.suit !== 'major') {
        const suitName = SUIT_NAMES[newCard.suit];
        const element = ELEMENT_MAP[newCard.suit];
        relationships.push(
          `之前${oldCard.name}${oldCard.isReversed ? '逆位' : '正位'}的${suitName}（${element}元素）能量，在${newCard.name}${newCard.isReversed ? '逆位' : '正位'}中以新的形式延续，说明${element === '火' ? '行动力与热情' : element === '水' ? '情感与感受' : element === '风' ? '思维与沟通' : '务实与物质'}的课题在持续深化，需要你从新的角度去理解和应对。`
        );
      }

      // 规则2：同数字
      if (
        typeof newCard.number === 'number' &&
        typeof oldCard.number === 'number' &&
        newCard.number === oldCard.number &&
        newCard.number > 0 &&
        newCard.suit !== oldCard.suit
      ) {
        const numerologyMeanings: Record<number, string> = {
          1: '新开始与创始', 2: '平衡与选择', 3: '创造与表达', 4: '稳定与结构',
          5: '冲突与转折', 6: '和谐与修复', 7: '挑战与探索', 8: '力量与成就',
          9: '完成与智慧', 10: '圆满与周期',
        };
        const theme = numerologyMeanings[newCard.number] || '深层转化';
        relationships.push(
          `数字${newCard.number}共振！之前的${oldCard.name}与新抽的${newCard.name}共享同一个数字密码——「${theme}」的主题在前后两次占卜中形成深刻呼应，说明这个核心课题正以不同面向在你的生活中运作。`
        );
      }

      // 规则3：新大牌 + 旧小牌
      if (newCard.suit === 'major' && oldCard.suit !== 'major') {
        const oldSuit = SUIT_NAMES[oldCard.suit];
        relationships.push(
          `之前具体的${oldSuit}课题（${oldCard.name}）现在升级为${newCard.name}所代表的人生层面——说明这个问题正在从日常事务上升到灵魂课题的高度，宇宙正在以更深层的智慧回应你的追问。`
        );
      }

      // 规则4：新正位 + 旧逆位
      if (!newCard.isReversed && oldCard.isReversed) {
        relationships.push(
          `之前${oldCard.name}逆位所揭示的${oldCard.keywordsReversed[0]}课题，现在开始化解——${newCard.name}正位带来了转机与新的可能，能量的阻滞正在松动，顺畅的流动正在恢复。`
        );
      }

      // 规则5：新逆位 + 旧正位
      if (newCard.isReversed && !oldCard.isReversed) {
        relationships.push(
          `之前顺畅的${oldCard.name}正位所支持的${oldCard.keywordsUpright[0]}能量，现在遇到了新的阻滞——${newCard.name}逆位提醒你，在新的阶段需要面对${newCard.keywordsReversed[0]}的课题，这是成长到下一层次必经的考验。`
        );
      }
    }
  }

  // 去重并限制数量
  const uniqueRelationships = [...new Set(relationships)];
  return uniqueRelationships.slice(0, 3); // 最多显示3条关系
}

/**
 * 找到与新牌最有联系的旧牌
 */
function findLinkedOldCard(
  newCard: TarotCard & { isReversed: boolean },
  oldCards: (TarotCard & { isReversed: boolean })[]
): (TarotCard & { isReversed: boolean }) | null {
  // 优先匹配同花色
  const sameSuit = oldCards.find((c) => c.suit === newCard.suit && c.suit !== 'major');
  if (sameSuit) return sameSuit;

  // 其次匹配同数字
  if (typeof newCard.number === 'number') {
    const sameNumber = oldCards.find(
      (c) => typeof c.number === 'number' && c.number === newCard.number && c.suit !== newCard.suit
    );
    if (sameNumber) return sameNumber;
  }

  // 最后返回第一张旧牌作为默认关联
  return oldCards[0] || null;
}

/**
 * 生成结合旧牌上下文的新牌解读
 */
function generateContextualMeaning(
  newCard: TarotCard & { isReversed: boolean },
  linkedOldCard: (TarotCard & { isReversed: boolean }) | null,
  positionName: string,
  oldReading: Reading
): string {
  const orientation = newCard.isReversed ? '逆位' : '正位';
  const meaningText = newCard.isReversed ? newCard.meaningReversed : newCard.meaningUpright;
  const adviceText = newCard.isReversed ? newCard.adviceReversed : newCard.adviceUpright;

  let text = `${newCard.name}（${orientation}）在「${positionName}」位置，`;

  if (linkedOldCard) {
    const oldOri = linkedOldCard.isReversed ? '逆位' : '正位';
    text += `与前次的${linkedOldCard.name}（${oldOri}）形成跨越时空的呼应。`;

    if (newCard.isReversed && !linkedOldCard.isReversed) {
      text += `前次顺畅的能量在新阶段遇到了${newCard.keywordsReversed[0]}的新课题，这是深化的必经过程。`;
    } else if (!newCard.isReversed && linkedOldCard.isReversed) {
      text += `前次的阻滞正在化解，${newCard.keywordsUpright[0]}的新能量为你带来了转机。`;
    } else if (newCard.suit === 'major' && linkedOldCard.suit !== 'major') {
      text += `这个课题从具体的层面升级为人生层面的深刻启示。`;
    } else {
      text += `两者的能量在${positionName}中交织，共同描绘出更深层的图景。`;
    }
  }

  text += `\n核心含义：${meaningText.slice(0, 120)}...`;
  text += `\n结合前次解读的建议：${adviceText.slice(0, 100)}...`;

  return text;
}

/**
 * 生成整合新旧牌的总结
 */
function generateIntegration(
  oldCards: (TarotCard & { isReversed: boolean })[],
  newCards: (TarotCard & { isReversed: boolean })[],
  oldReading: Reading,
  relationships: string[]
): string {
  const oldMajorCount = oldCards.filter((c) => c.suit === 'major').length;
  const newMajorCount = newCards.filter((c) => c.suit === 'major').length;

  let text = `前后两次占卜共同编织了一个更加完整的叙事。`;

  if (relationships.length > 0) {
    text += `新旧牌面之间存在${relationships.length}层深刻关联，显示你的追问正在触及问题的核心脉络。`;
  } else {
    text += `虽然新旧牌面没有直接的花色或数字关联，但它们以不同的能量频率回应着同一个灵魂课题。`;
  }

  if (newMajorCount > oldMajorCount) {
    text += `值得注意的是，新抽牌中出现了更多大阿卡纳，说明你的追问正在引导你进入更深层的灵魂探索层面。`;
  }

  const oldUpright = oldCards.filter((c) => !c.isReversed).length;
  const newUpright = newCards.filter((c) => !c.isReversed).length;

  if (newUpright > oldUpright) {
    text += `新牌的正位比例提升，显示能量正在向更加顺畅的方向流动，这是一个积极的深化信号。`;
  } else if (newUpright < oldUpright) {
    text += `新牌中逆位能量的出现并非负面信号，而是显示这个问题还有需要被看见和转化的深层课题等待你去面对。`;
  }

  text += `\n\n${oldReading.affirmation.slice(0, 80)}... 这个肯定语在二次占卜中依然有效，它提醒你：无论牌面如何变化，你始终拥有选择的自由，而每一次占卜都是灵魂成长路上的珍贵路标。`;

  return text;
}

// ==================== 工具函数 ====================

/**
 * 根据旧牌阵推荐新的二次占卜牌阵
 */
export function recommendFollowUpSpread(oldSpread: Spread): Spread {
  // 根据旧牌阵的牌数推荐
  switch (oldSpread.cardCount) {
    case 1:
      // 单牌阵不能再简，推荐三牌阵获得更多视角
      return SPREADS.find((s) => s.id === 'three') || SPREADS[1];
    case 3:
      // 三牌阵推荐单牌阵聚焦核心
      return SPREADS.find((s) => s.id === 'single') || SPREADS[0];
    case 4:
    case 6:
      // 四牌/六牌阵推荐单牌或三牌
      return SPREADS.find((s) => s.id === 'single') || SPREADS[0];
    case 10:
      // 凯尔特十字推荐单牌或三牌
      return SPREADS.find((s) => s.id === 'three') || SPREADS[1];
    default:
      return SPREADS.find((s) => s.id === 'single') || SPREADS[0];
  }
}

/**
 * 将追问记录保存到当前解读中
 */
export function saveFollowUpToReading(record: FollowUpRecord): void {
  const current = getCurrentReading();
  if (!current) return;

  const followUps = current.followUps || [];
  setCurrentReading({
    ...current,
    followUps: [...followUps, record],
  });
}
