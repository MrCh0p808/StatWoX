'use strict';

const { google } = require('googleapis');

// --- AWS SSM Support (for secure Google credentials) ---
// We pull the Google service-account JSON from AWS SSM (SecureString).
// This prevents hardcoding secrets in Terraform or code. Lambda IAM policy allows only this path.
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const ssm = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function getGoogleCredsFromSSM() {
  const paramName = process.env.GOOGLE_CREDS_SSM_PARAM || '/statwox/google-service-creds';
  console.log(`ℹ️ [SSM] Attempting to fetch param: ${paramName} in region ${process.env.AWS_REGION || 'us-east-1'}`);

  try {
    const cmd = new GetParameterCommand({ Name: paramName, WithDecryption: true });
    const resp = await ssm.send(cmd);

    if (!resp?.Parameter) {
      console.error('❌ [SSM] No Parameter object returned.');
      throw new Error('Empty or malformed SSM response.');
    }

    if (!resp.Parameter.Value) {
      console.error('❌ [SSM] Parameter found but no Value.');
      throw new Error('Empty parameter value.');
    }

    console.log('✅ [SSM] Parameter fetched successfully (length only):', resp.Parameter.Value.length);
    return JSON.parse(resp.Parameter.Value);

  } catch (err) {
    // We log only the message, not the secret, to avoid leaking anything.
    console.error(`❌ [SSM] Failed to fetch creds: ${err.name || 'Error'} - ${err.message}`);
    throw new Error('Critical: Unable to load Google credentials from SSM. Check IAM permissions or parameter.');
  }
}

// Canonical order to match your sheet columns (Timestamp first)
const KEY_ORDER = [
  'Timestamp',
  'SessionID',
  'FullName','Email','Age',
  'Q1','Q2','Q3','Q4','Q5',
  'Q6','Q7','Q8','Q9','Q10',
  'Q11','Q12','Q13','Q14','Q15',
  'Q16','Q17','Q18','Q19','Q20',
  'Q21','Q22','Q23','Q24','Q25'
];

const SHEET_ID = process.env.SHEET_ID; // provided by Terraform/env
const SHEET_NAME = 'Digital Opinion Trends Responses';

// Normalize multi/select & values like your Apps Script
function normalizeValue(v){
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(x => (x ?? '').toString().trim()).filter(Boolean).join('; ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function corsHeaders(){
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  };
}

exports.handler = async (event) => {
  // Preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  try {
    if (!SHEET_ID) throw new Error('Missing SHEET_ID');
    const body = JSON.parse(event.body || '{}');
    if (!body || typeof body !== 'object') throw new Error('Invalid payload');

    // Auth with Google
    const googleCreds = await getGoogleCredsFromSSM();
    const auth = new google.auth.GoogleAuth({
    credentials: googleCreds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });


    // 1) Ensure header row is present & canonical
    const headerRow = ['Timestamp','SessionID', 'Full name / पूरा नाम','Email address / ईमेल पता','Age / आयु',
      'How frequently do you actively participate (post/comment/vote) in online communities? / आप कितनी बार सक्रिय रूप से भाग लेते हैं?',
      'What motivates you MOST to share your opinion or engage in online discussions? / आपको क्या प्रेरित करता है?',
      'What type of content most often makes you stop scrolling and participate? / किस प्रकार की सामग्री आपको रोकती है?',
      'I feel a strong sense of belonging in the online communities I participate in. / मैं समुदायों में जुड़ाव महसूस करता/करती हूँ।',
      'Primary driver that brings you back to favorite online spaces (open). / वह प्राथमिक कारण जो आपको वापस लाता है।',
      'How important is anonymity when expressing honest opinions online? / अनामिता कितनी महत्वपूर्ण है?',
      'Which scenario best describes your identity preference in online discussions? / आपकी पहचान वरीयता?',
      'Do people share true opinions or filtered versions? / क्या लोग सच्ची राय साझा करते हैं?',
      'Single most important factor that builds your trust in an online community? / आपके विश्वास का सबसे महत्वपूर्ण कारण?',
      'Positive or negative experience related to trust/identity (open). / विश्वास/पहचान से जुड़ा अनुभव।',
      'When you give your opinion, what do you most want in return? / प्रतिक्रिया देने पर आप क्या चाहते हैं?',
      'Preferred method for giving feedback to admins/developers? / प्रतिक्रिया देने का पसंदीदा तरीका?',
      'How much does visual design/interactivity affect your trust? / डिज़ाइन/इंटरएक्टिविटी कितना प्रभावित करती है?',
      'Prefer a minimal one-tap interface or richer discussion experience? / आप किसे प्राथमिकता देंगे?',
      'Describe time feedback led to visible change (open). / प्रतिक्रिया से बदलाव का उदाहरण।',
      'Which feature would make you join a new opinion platform? / किस फ़ीचर के लिए शामिल होंगे?',
      'Which feature is most likely to bring you back regularly? / कौन-सा फीचर वापसी सुनिश्चित करेगा?',
      'How appealing is a personal insight profile based on your opinions? / व्यक्तिगत प्रोफ़ाइल कितनी आकर्षक है?',
      'Which poll result view is more engaging: local or global? / स्थानीय बनाम वैश्विक परिणाम?',
      'Share one feature that would significantly deepen your engagement (open). / एक ऐसा फीचर बताइए।',
      'When you disagree with majority, how do you respond? / बहुमत से असहमति पर प्रतिक्रिया?',
      'How much does positive social validation affect posting again? / सामाजिक मान्यता का प्रभाव?',
      'What kind of community tone makes you feel safest expressing honest views? / किस प्रकार का टोन सुरक्षित लगता है?',
      'Expressing opinions online helps me feel part of something bigger. Agree? / क्या आप सहमत हैं?',
      'What is the most significant emotional benefit OR challenge? (open). / भावनात्मक लाभ/चुनौती क्या है?'
    ];

    // Try to read first row; if mismatch, write headers
    const headerGet = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${SHEET_NAME}!1:1`
    }).catch(() => ({ data: { values: [] } }));
    const existing = headerGet.data.values?.[0] || [];
    const mismatch = existing.length !== headerRow.length ||
      headerRow.some((h, i) => existing[i] !== h);
    if (mismatch) {
      await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: SHEET_NAME });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!1:1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headerRow] }
      });
    }

    
// SessionID / Upsert logic (search by SessionID first, fallback to Email).
const sessionId = (body['SessionID'] || '').toString().trim();
let foundRowIndex = -1;

// If sessionId provided, try to find matching row in column B (B2:B)
if (sessionId) {
  const sessColRange = `${SHEET_NAME}!B2:B`;
  const sessCol = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: sessColRange
  }).catch(() => ({ data: { values: [] } }));
  const sessFlat = (sessCol.data.values || []).flat().map(s => (s || '').toString().trim());
  const foundSessIdx = sessFlat.indexOf(sessionId);
  if (foundSessIdx >= 0) {
    foundRowIndex = foundSessIdx + 2; // row number in sheet
  }
}

// Fallback: if no session match, try to find by Email (so returning users who cleared localStorage can resume)
const emailIdx = KEY_ORDER.indexOf('Email'); // index in KEY_ORDER
let emailVal = (body['Email'] || '').toString().trim().toLowerCase();
if (foundRowIndex === -1 && emailVal) {
  const emailColRange = `${SHEET_NAME}!${String.fromCharCode(65 + emailIdx)}2:${String.fromCharCode(65 + emailIdx)}`;
  const emailCol = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: emailColRange
  }).catch(() => ({ data: { values: [] } }));
  const flat = (emailCol.data.values || []).flat().map(s => (s || '').toString().trim().toLowerCase());
  const foundEmailIdx = flat.indexOf(emailVal);
  if (foundEmailIdx >= 0) {
    foundRowIndex = foundEmailIdx + 2;
  }
}

// If we have foundRowIndex, perform an update for that precise row (Upsert behavior).
if (foundRowIndex !== -1) {
  // Build row mapping (Timestamp will be overwritten here with new timestamp)
  const rowToWrite = KEY_ORDER.map(k => {
    if (k === 'Timestamp') return new Date().toISOString();
    return normalizeValue(body[k]);
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${foundRowIndex}:Z${foundRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [rowToWrite] }
  });

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true, message: '✅ धन्यवाद! Your response has been recorded (updated).', row: foundRowIndex })
  };
}

// If no existing session/email found, continue to append as new (we'll reach the build row + append logic)
// Build row in canonical order
    const row = KEY_ORDER.map(k => {
      if (k === 'Timestamp') return new Date().toISOString();
      return normalizeValue(body[k]);
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true, message: '✅ धन्यवाद! Your response has been recorded.' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ success: false, message: err.message || 'Server Error' }) };
  }
};

