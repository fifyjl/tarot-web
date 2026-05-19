export const config = {
  runtime: 'edge',
};

// ====== 选择短信服务商 ======
// 支持: 'aliyun' | 'yunpian' | 'tencent'
const SMS_PROVIDER = (process.env.SMS_PROVIDER as 'aliyun' | 'yunpian' | 'tencent') || 'aliyun';

// ====== 阿里云短信签名计算 ======
async function signAliyun(params: Record<string, string>, secret: string): Promise<string> {
  const sorted = Object.keys(params).sort();
  const qs = sorted.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  const str = `GET&${encodeURIComponent('/')}&${encodeURIComponent(qs)}`;
  const key = encodeURIComponent(secret) + '&';
  const enc = new TextEncoder();
  const ck = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', ck, enc.encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function sendAliyun(phone: string, code: string) {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID!;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET!;
  const signName = process.env.ALIYUN_SIGN_NAME!;
  const templateCode = process.env.ALIYUN_TEMPLATE_CODE!;

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    RegionId: 'cn-hangzhou',
    SignName: signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: String(Math.random()).slice(2),
    SignatureVersion: '1.0',
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2017-05-25',
  };

  params.Signature = await signAliyun(params, accessKeySecret);

  const url = 'https://dysmsapi.aliyuncs.com/?' + Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const res = await fetch(url);
  const data = await res.json();
  if (data.Code !== 'OK') {
    throw new Error(data.Message || '阿里云短信发送失败');
  }
}

// ====== 云片网（最简单） ======
async function sendYunpian(phone: string, code: string) {
  const apikey = process.env.YUNPIAN_API_KEY!;
  const text = `【yuyu塔罗】您的验证码是${code}，5分钟内有效。`;

  const body = new URLSearchParams({ apikey, mobile: phone, text });

  const res = await fetch('https://sms.yunpian.com/v2/sms/single_send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(data.msg || '云片短信发送失败');
  }
}

// ====== 腾讯云短信 ======
async function signTencent(params: Record<string, string>, secretKey: string, timestamp: number): Promise<string> {
  const service = 'sms';
  const host = 'sms.tencentcloudapi.com';
  const action = 'SendSms';
  const version = '2021-01-11';
  const region = 'ap-guangzhou';

  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${params.PhoneNumber}`],
    SmsSdkAppId: params.SmsSdkAppId,
    SignName: params.SignName,
    TemplateId: params.TemplateId,
    TemplateParamSet: [params.TemplateParam],
  });

  const hashedPayload = await sha256(payload);

  const canonicalRequest = `POST\n/\n\ncontent-type:application/json\nhost:${host}\n\ncontent-type;host\n${hashedPayload}`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${date}/${service}/tc3_request\n${await sha256(canonicalRequest)}`;

  const secretDate = await hmacSha256(`TC3${secretKey}`, date);
  const secretService = await hmacSha256(secretDate, service);
  const secretSigning = await hmacSha256(secretService, 'tc3_request');
  const signature = await hmacSha256Hex(secretSigning, stringToSign);

  return signature;
}

async function sha256(message: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(message));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? enc.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
}

async function hmacSha256Hex(key: ArrayBuffer, message: string): Promise<string> {
  const sig = await hmacSha256(key, message);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendTencent(phone: string, code: string) {
  const secretId = process.env.TENCENT_SECRET_ID!;
  const secretKey = process.env.TENCENT_SECRET_KEY!;
  const sdkAppId = process.env.TENCENT_SDK_APP_ID!;
  const signName = process.env.TENCENT_SIGN_NAME!;
  const templateId = process.env.TENCENT_TEMPLATE_ID!;

  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const params: Record<string, string> = {
    PhoneNumber: phone,
    SmsSdkAppId: sdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParam: code,
  };

  const signature = await signTencent(params, secretKey, timestamp);

  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: sdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: [code],
  });

  const res = await fetch('https://sms.tencentcloudapi.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'sms.tencentcloudapi.com',
      'X-TC-Action': 'SendSms',
      'X-TC-Version': '2021-01-11',
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Region': 'ap-guangzhou',
      'Authorization': `TC3-HMAC-SHA256 Credential=${secretId}/${date}/sms/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`,
    },
    body: payload,
  });

  const data = await res.json();
  if (data.Response?.Error) {
    throw new Error(data.Response.Error.Message || '腾讯云短信发送失败');
  }
}

// ====== 主入口 ======
export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'Missing phone or code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (SMS_PROVIDER === 'yunpian') {
      await sendYunpian(phone, code);
    } else if (SMS_PROVIDER === 'tencent') {
      await sendTencent(phone, code);
    } else {
      await sendAliyun(phone, code);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || '发送失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
