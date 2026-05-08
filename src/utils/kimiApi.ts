/**
 * Kimi API 服务
 * 调用 Moonshot AI 进行深度塔罗解读
 */

const API_KEY = 'sk-rxCNIgkZZsUQJ0jX4xbd0Ji4LFw4cTvJdFi5bHED7dC4Ncyh';
const API_BASE = 'https://api.moonshot.cn/v1';

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: KimiMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用 Kimi API 进行塔罗深度解读
 */
export async function generateAIReading(
  question: string,
  spreadName: string,
  positionName: string,
  cardName: string,
  isReversed: boolean,
  cardMeaning: string,
  cardKeywords: string[],
  username: string
): Promise<string> {
  const orientation = isReversed ? '逆位' : '正位';

  const systemPrompt = `你是一位拥有30年经验的资深塔罗占卜师，精通韦特塔罗体系。你的解读风格温暖、深入、有洞察力。

重要规则：
1. 先深入分析牌面含义，再直接回答用户的具体问题
2. 解读必须紧密结合用户的问题，不能泛泛而谈
3. 如果是正位牌，给出积极建议和维持建议；如果是逆位牌，给出建设性改善建议
4. 语言要温暖、有同理心，像一位智慧的朋友
5. 每次解读300-500字
6. 可以引用牌的象征意义、数字学、元素学知识`;

  const userPrompt = `用户「${username}」提出了一个问题：「${question}」

使用的阵法是：${spreadName}
抽到的牌是：${cardName}（${orientation}）
这张牌在阵法中的位置是：${positionName}

牌的核心含义：${cardMeaning}
牌的关键词：${cardKeywords.join('、')}

请你作为资深塔罗师，给出深度解读。要求：
1. 先解读这张牌本身的含义（正位/逆位的具体表现）
2. 结合用户的问题「${question}」，直接回答这个问题
3. 给出3-5条具体、可操作的建议
4. 语言温暖有同理心

请用中文回答。`;

  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Kimi API error:', error);
      // Fallback to local interpretation
      return generateFallbackReading(question, cardName, isReversed, positionName, cardMeaning);
    }

    const data: KimiResponse = await response.json();
    return data.choices[0]?.message?.content || generateFallbackReading(question, cardName, isReversed, positionName, cardMeaning);
  } catch (error) {
    console.error('Kimi API call failed:', error);
    return generateFallbackReading(question, cardName, isReversed, positionName, cardMeaning);
  }
}

/**
 * 生成综合分析（多张牌）
 */
export async function generateAISynthesis(
  question: string,
  spreadName: string,
  cards: Array<{
    name: string;
    isReversed: boolean;
    positionName: string;
    meaning: string;
    keywords: string[];
  }>,
  username: string
): Promise<string> {
  const cardsDescription = cards.map((c, i) =>
    `${i + 1}. ${c.name}（${c.isReversed ? '逆位' : '正位'}）- ${c.positionName}：${c.meaning.split('。')[0]}。`
  ).join('\n');

  const systemPrompt = `你是一位拥有30年经验的资深塔罗占卜师。你的任务是对整个牌阵进行综合分析。

重要规则：
1. 分析牌与牌之间的关联（能量流动、冲突、互补）
2. 给出整体趋势判断
3. 直接回答用户的核心问题
4. 语言温暖有同理心
5. 每次分析200-400字`;

  const userPrompt = `用户「${username}」提出了问题：「${question}」

使用的阵法：${spreadName}

抽到的牌：
${cardsDescription}

请你作为资深塔罗师，对以上${cards.length}张牌进行综合分析：
1. 牌与牌之间的能量关系和流动
2. 整体趋势判断
3. 直接回答用户的问题「${question}」
4. 给出3条总体建议

请用中文回答。`;

  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Kimi API error');
      return generateFallbackSynthesis(question, spreadName, cards);
    }

    const data: KimiResponse = await response.json();
    return data.choices[0]?.message?.content || generateFallbackSynthesis(question, spreadName, cards);
  } catch {
    return generateFallbackSynthesis(question, spreadName, cards);
  }
}

/**
 * Fallback: 当 API 调用失败时使用本地解读
 */
function generateFallbackReading(
  question: string,
  cardName: string,
  isReversed: boolean,
  positionName: string,
  cardMeaning: string
): string {
  const orientation = isReversed ? '逆位' : '正位';
  return `关于你问的「${question}」，${cardName}（${orientation}）出现在「${positionName}」位置，为你提供了重要的指引。

${cardMeaning.split('。')[0]}。这映射到你的问题中，意味着当前${isReversed ? '你可能正在经历一些内在的挑战或调整期' : '能量流动顺畅，有较好的发展基础'}。

建议你${isReversed ? '先放慢脚步，处理内在的功课，不要急于求成。保持耐心，等待能量自然转顺。' : '顺应这股积极的能量，勇敢地迈出下一步。保持开放的心态，美好的可能性正在展开。'}`;
}

function generateFallbackSynthesis(
  question: string,
  spreadName: string,
  cards: Array<{ name: string; isReversed: boolean; positionName: string; meaning: string }>
): string {
  const reversedCount = cards.filter(c => c.isReversed).length;
  const totalCount = cards.length;
  return `基于${spreadName}的${totalCount}张牌，整体来看，你的问题「${question}」${reversedCount > totalCount / 2 ? '当前正处于调整期，需要面对一些挑战' : '呈现积极的趋势，能量流动顺畅'}。

建议你保持觉知，顺应当前的能量流动，同时根据自己的实际情况做出调整。塔罗是灯，路还是要你自己走。`;
}
