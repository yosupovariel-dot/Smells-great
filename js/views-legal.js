import { html } from './util.js';
import { getLang } from './i18n.js';
import { PHONE_DISPLAY } from './util.js';

const BIZ = 'SAY Boutique';
const EMAIL = 'info@say-boutique.co.il';
const UPDATED = '28.10.2026';

const page = (title, body) => html`<div class="wrap legal"><p class="eyebrow">${BIZ}</p><h1>${title}</h1><p class="updated">${getLang() === 'he' ? 'עודכן לאחרונה' : 'Last updated'}: ${UPDATED}</p>${body}</div>`;
const enNote = html`<p><em>This is a summary. The Hebrew version is the binding version.</em></p>`;

export function terms() {
  if (getLang() === 'en') return page('Terms of Use', html`${enNote}
    <h2>1. General</h2><p>The site is operated by ${BIZ}. Using the site or ordering means you accept these terms. Terms apply equally to all genders.</p>
    <h2>2. Eligibility</h2><p>Purchases are open to persons aged 18+ holding a valid Israeli-issued payment card and a valid delivery address in Israel.</p>
    <h2>3. Prices & orders</h2><p>Prices include VAT. Shipping is free above ₪299, otherwise ₪29. An order is binding only after confirmation and successful payment. We may cancel in case of a clear pricing error, stock shortage or suspected fraud.</p>
    <h2>4. Delivery</h2><p>Typically 3–5 business days, excluding Eilat and remote areas.</p>
    <h2>5. Returns</h2><p>See the Returns & Cancellation policy.</p>
    <h2>6. Members club & wholesale</h2><p>Joining is free. The 10% welcome discount applies once, to the first order. Wholesale accounts require approval.</p>
    <h2>7. Product safety</h2><p>Fragrance oils are concentrated: keep away from children and pets, avoid contact with eyes, do not ingest. Never leave a lit candle unattended.</p>
    <h2>8. Intellectual property</h2><p>All content belongs to ${BIZ} and may not be copied without written permission.</p>
    <h2>9. Jurisdiction</h2><p>Israeli law applies; exclusive jurisdiction to the competent courts in Tel Aviv.</p>
    <h2>10. Contact</h2><p>${PHONE_DISPLAY} · ${EMAIL}</p>`);
  return page('תקנון האתר', html`
    <h2>1. כללי</h2><p>אתר זה מופעל על ידי ${BIZ} (להלן: "החברה"). השימוש באתר וביצוע הזמנה מהווים הסכמה לתנאי תקנון זה. התקנון נכתב בלשון זכר מטעמי נוחות בלבד ומתייחס לכל המגדרים. במקרה של סתירה בין התקנון לבין פרסום אחר — יגבר האמור בתקנון.</p>
    <h2>2. הכשרות לביצוע רכישה</h2><p>רשאי לרכוש באתר כל אדם מעל גיל 18, בעל כרטיס אשראי בתוקף שהונפק בישראל וכתובת למשלוח בישראל. החברה רשאית לסרב לבצע הזמנה מכל סיבה סבירה, לרבות חשד להונאה.</p>
    <h2>3. מחירים ותשלום</h2><ul><li>המחירים באתר כוללים מע"מ כחוק ונקובים בשקלים חדשים.</li><li>דמי משלוח: חינם בהזמנה מעל 299₪, אחרת 29₪.</li><li>ההזמנה תיחשב סופית רק לאחר קבלת אישור מחברת האשראי. פרטי כרטיס האשראי אינם נשמרים באתר ומעובדים על ידי ספק סליקה מאובטח העומד בתקן PCI-DSS.</li><li>מחירים ומבצעים עשויים להשתנות. ט"ל — במקרה של טעות סופר בולטת במחיר, החברה רשאית לבטל את העסקה ולהשיב את הכסף במלואו.</li></ul>
    <h2>4. אספקה ומשלוחים</h2><p>זמן האספקה הוא 3–5 ימי עסקים מיום אישור ההזמנה, למעט אילת ויישובים מרוחקים. ימי עסקים אינם כוללים שישי, שבת, חגים וערבי חג. עיכוב שנגרם עקב כוח עליון לא יהווה הפרה של התקנון.</p>
    <h2>5. ביטול עסקה והחזרות</h2><p>ביטול עסקה והחזרת מוצרים יתבצעו בהתאם לחוק הגנת הצרכן, התשמ"א-1981 ולתקנות הגנת הצרכן (ביטול עסקה), התשע"א-2010, כמפורט ב<a href="#/returns">מדיניות ההחזרות והביטולים</a>.</p>
    <h2>6. מועדון לקוחות וסיטונאים</h2><ul><li>ההצטרפות למועדון הלקוחות ללא עלות. הנחת 10% למצטרפים חדשים תינתן פעם אחת, בהזמנה הראשונה, ואינה כפולה במבצעים אחרים.</li><li>חשבון סיטונאי כפוף לאישור החברה, ומחירי הסיטונאי מיועדים לבתי עסק בלבד.</li><li>החברה רשאית לשנות את הטבות המועדון בהודעה מראש.</li></ul>
    <h2>7. בטיחות מוצרים</h2><p>תמציות שמן הן מוצר מרוכז: יש להרחיק מהישג ידם של ילדים ובעלי חיים, להימנע ממגע בעיניים ואין לבלוע. אין להשאיר נר דולק ללא השגחה. במקרה של רגישות — יש להפסיק את השימוש. תמונות המוצרים להמחשה בלבד.</p>
    <h2>8. קניין רוחני</h2><p>כל הזכויות בתכני האתר, לרבות עיצוב, תמונות, לוגו וטקסטים, שמורות לחברה. אין להעתיק, להפיץ או לעשות בהם שימוש מסחרי ללא אישור בכתב.</p>
    <h2>9. אחריות</h2><p>החברה לא תהיה אחראית לנזק עקיף שייגרם כתוצאה משימוש שלא בהתאם להוראות היצרן. אחריות החברה מוגבלת לגובה התמורה ששולמה בפועל עבור המוצר, והכל בכפוף לדין.</p>
    <h2>10. פרטיות</h2><p>השימוש במידע אישי כפוף ל<a href="#/privacy">מדיניות הפרטיות</a>.</p>
    <h2>11. סמכות שיפוט</h2><p>על תקנון זה יחולו דיני מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו.</p>
    <h2>12. יצירת קשר</h2><p>טלפון ו-WhatsApp: ${PHONE_DISPLAY} · דוא"ל: ${EMAIL}</p>`);
}

export function returns() {
  if (getLang() === 'en') return page('Returns & Cancellation Policy', html`${enNote}
    <p>Per the Israeli Consumer Protection Law 1981 and Cancellation Regulations 2010:</p>
    <ul><li>You may cancel within 14 days of receiving the product or the transaction document, whichever is later.</li>
    <li>Seniors (65+), new immigrants (up to 5 years) and persons with disabilities may cancel within 4 months, provided the transaction included a phone conversation.</li>
    <li>A cancellation fee of 5% or ₪100, whichever is lower, applies, unless cancellation is due to a defect or non-conformity.</li>
    <li>Products must be returned unused and in original packaging. For hygiene reasons, opened fragrance oils, perfumes and hair products cannot be returned.</li>
    <li>Refunds are issued to the original payment method within 14 days of receiving the notice/product.</li>
    <li>Notice may be given by phone ${PHONE_DISPLAY}, email ${EMAIL} or WhatsApp.</li></ul>`);
  return page('מדיניות החזרות וביטול עסקה', html`
    <p>מדיניות זו נקבעה בהתאם לחוק הגנת הצרכן, התשמ"א-1981 ("החוק") ולתקנות הגנת הצרכן (ביטול עסקה), התשע"א-2010.</p>
    <h2>1. זכות ביטול</h2><ul><li>ניתן לבטל עסקה תוך 14 יום מיום קבלת המוצר או מיום קבלת מסמך הגילוי — המאוחר מביניהם.</li>
    <li>אזרח ותיק (מעל גיל 65), עולה חדש (עד 5 שנים מיום העלייה) ואדם עם מוגבלות — רשאים לבטל עסקה תוך 4 חודשים מיום העסקה, ובלבד שההתקשרות כללה שיחה (לרבות שיחה אלקטרונית), בכפוף להצגת תעודה מתאימה.</li></ul>
    <h2>2. אופן מסירת הודעת ביטול</h2><p>ניתן למסור הודעת ביטול בכל אחת מהדרכים: טלפונית ${PHONE_DISPLAY}, ב-WhatsApp, בדוא"ל ${EMAIL}, או באמצעות <a href="#/contact">טופס יצירת קשר</a> באתר. בהודעה יש לציין שם מלא, מספר הזמנה ומספר טלפון.</p>
    <h2>3. דמי ביטול</h2><p>בביטול שלא עקב פגם — ייגבו דמי ביטול בשיעור 5% ממחיר העסקה או 100₪, לפי הנמוך מביניהם. בביטול עקב פגם, אי התאמה או אי אספקה במועד — לא ייגבו דמי ביטול, והחברה תישא בעלות האיסוף.</p>
    <h2>4. תנאי ההחזרה</h2><ul><li>המוצר יוחזר באריזתו המקורית, כשהוא שלם, לא פגום ולא נעשה בו שימוש.</li>
    <li>בהתאם לסעיף 14ג(ד) לחוק, לא ניתן להחזיר מוצרים שמטבעם ניתנים להעתקה או שנפתחו ונפגעה אריזתם ההיגיינית — לרבות תמציות שמן, בשמים ומוצרי טיפוח שיער שנפתחו.</li>
    <li>מוצרים שיוצרו או הותאמו במיוחד עבור הלקוח (לרבות מיתוג לעסקים) — אינם ניתנים לביטול.</li></ul>
    <h2>5. החזר כספי</h2><p>ההחזר יבוצע לאמצעי התשלום המקורי תוך 14 ימים מיום קבלת הודעת הביטול, בכפוף להחזרת המוצר. דמי המשלוח המקוריים יוחזרו במקרה של פגם בלבד.</p>
    <h2>6. מוצר פגום</h2><p>במקרה של מוצר שהגיע פגום או שבור — אנא צלמו ופנו אלינו תוך 48 שעות. נחליף את המוצר או נזכה במלואו, ללא עלות.</p>
    <h2>7. החלפה</h2><p>ניתן להחליף מוצר שלא נפתח תוך 14 יום, באמצעות פנייה לשירות הלקוחות.</p>`);
}

export function privacy() {
  if (getLang() === 'en') return page('Privacy Policy', html`${enNote}
    <ul><li>We collect only what is needed to process orders and provide service: name, phone, email, delivery address, order history.</li>
    <li>Card details are never stored on our servers; payments are processed by a PCI-DSS compliant provider.</li>
    <li>Data is shared only with delivery and payment providers, or as required by law. We never sell data.</li>
    <li>Marketing messages are sent only with explicit consent and can be stopped anytime.</li>
    <li>Data is encrypted in transit (TLS) and access is restricted to authorized staff by role.</li>
    <li>You may request access, correction or deletion of your data: ${EMAIL}.</li></ul>`);
  return page('מדיניות פרטיות', html`
    <p>${BIZ} מכבדת את פרטיות המשתמשים באתר ופועלת בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 (לרבות תיקון 13), ותקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017.</p>
    <h2>1. איזה מידע אנו אוספים</h2><ul><li>מידע שמסרת בעת הזמנה או הרשמה: שם, טלפון, דוא"ל, כתובת למשלוח, שם עסק (לסיטונאים).</li><li>היסטוריית הזמנות והעדפות.</li><li>מידע טכני בסיסי (סוג דפדפן, עוגיות חיוניות) לצורך תפעול האתר.</li></ul>
    <p>אינך חייב/ת למסור מידע על פי חוק, אך ללא מסירת פרטי המשלוח לא נוכל לספק את ההזמנה.</p>
    <h2>2. מטרות השימוש</h2><ul><li>עיבוד ואספקת הזמנות, שירות לקוחות ויצירת קשר בנוגע להזמנה.</li><li>ניהול מועדון הלקוחות וחשבונות סיטונאים.</li><li>שליחת דיוור ומבצעים — רק בכפוף להסכמתך המפורשת, בהתאם לסעיף 30א לחוק התקשורת. ניתן להסיר בכל עת.</li><li>אבטחת האתר ומניעת הונאות.</li></ul>
    <h2>3. פרטי תשלום</h2><p>פרטי כרטיס אשראי אינם נשמרים באתר ואינם עוברים בשרתי החברה. הסליקה מתבצעת באמצעות ספק סליקה מורשה העומד בתקן PCI-DSS.</p>
    <h2>4. העברת מידע לצדדים שלישיים</h2><p>לא נמכור ולא נשכיר מידע אישי. מידע יועבר רק לחברות המשלוחים והסליקה לצורך ביצוע ההזמנה, לספקי אחסון בכפוף להתחייבות לסודיות, או על פי דרישה חוקית.</p>
    <h2>5. אבטחת מידע</h2><ul><li>תקשורת מוצפנת (HTTPS/TLS) בכל האתר.</li><li>סיסמאות נשמרות בגיבוב חד-כיווני (PBKDF2) ולעולם לא בטקסט גלוי.</li><li>הרשאות גישה לפי תפקיד — כל עובד רואה רק את המידע הדרוש לתפקידו (מנהל, מנהל הזמנות, שליח).</li><li>הגנה מפני ניסיונות התחברות חוזרים, ומדיניות אבטחת תוכן (CSP) נגד הזרקת קוד.</li></ul>
    <p>אף שאנו נוקטים באמצעים מתקדמים, אין אפשרות להבטיח חסינות מוחלטת.</p>
    <h2>6. עוגיות (Cookies)</h2><p>האתר משתמש באחסון מקומי ועוגיות חיוניות בלבד לצורך סל הקניות, שפה, הגדרות נגישות והתחברות. אין שימוש בעוגיות פרסום ללא הסכמה.</p>
    <h2>7. זכויותיך</h2><p>בהתאם לסעיפים 13–14 לחוק, זכותך לעיין במידע שנאסף עליך, לבקש את תיקונו או מחיקתו. פניות: ${EMAIL} או ${PHONE_DISPLAY}. נשיב תוך 30 יום.</p>
    <h2>8. שמירת מידע</h2><p>מידע הזמנות נשמר למשך התקופה הנדרשת על פי דיני המס (7 שנים). מידע שיווקי יימחק עם בקשת הסרה.</p>
    <h2>9. קטינים</h2><p>האתר אינו מיועד לקטינים מתחת לגיל 18 ואיננו אוספים ביודעין מידע עליהם.</p>`);
}

export function accessibility() {
  if (getLang() === 'en') return page('Accessibility Statement', html`
    <p>${BIZ} is committed to making its website accessible to people with disabilities, in accordance with the Equal Rights for Persons with Disabilities Law 1998 and its 2013 regulations, Israeli Standard IS 5568 and WCAG 2.1 level AA.</p>
    <h2>Accessibility features</h2><ul><li>Full keyboard navigation and visible focus indicators</li><li>Screen-reader support (semantic HTML, ARIA labels, alt text)</li><li>Accessibility menu (bottom left): text size, high contrast, invert, grayscale, link highlighting, readable font, stop animations, large cursor</li><li>Respects reduced-motion preferences; rotating messages can be paused</li><li>Responsive design for mobile and zoom up to 200%</li></ul>
    <h2>Accessibility coordinator</h2><p>Phone/WhatsApp: ${PHONE_DISPLAY} · Email: ${EMAIL}. We will respond within 5 business days.</p>`);
  return page('הצהרת נגישות', html`
    <p>${BIZ} רואה חשיבות רבה במתן שירות שוויוני לכלל הלקוחות, ופועלת להנגשת האתר לאנשים עם מוגבלות בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998, ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.</p>
    <h2>רמת הנגישות</h2><p>האתר הונגש בהתאם לתקן הישראלי ת"י 5568 ולהנחיות WCAG 2.1 ברמה AA. האתר נבדק בדפדפנים Chrome, Safari, Firefox ו-Edge, במחשב ובנייד, ועם קוראי מסך NVDA ו-VoiceOver.</p>
    <h2>התאמות שבוצעו באתר</h2><ul>
      <li>ניווט מלא באמצעות מקלדת (Tab, Shift+Tab, Enter, Esc) וסימון פוקוס ברור.</li>
      <li>קישור "דלג לתוכן הראשי" בראש כל עמוד.</li>
      <li>מבנה כותרות היררכי, תגיות סמנטיות ותיאורי ARIA לרכיבים אינטראקטיביים.</li>
      <li>טקסט חלופי לתמונות, תוויות לכל שדות הטפסים והודעות שגיאה מוקראות.</li>
      <li>ניגודיות צבעים העומדת ביחס 4.5:1 לפחות לטקסט רגיל.</li>
      <li>תמיכה בהגדלת תצוגה עד 200% ללא אובדן תוכן, ותצוגה מותאמת לנייד.</li>
      <li>אפשרות לעצור את ההודעות המתחלפות בפס העליון, וכיבוד הגדרת "הפחתת תנועה" של מערכת ההפעלה.</li>
      <li>תמיכה מלאה בעברית (RTL) ובאנגלית.</li></ul>
    <h2>תפריט הנגישות</h2><p>בפינה השמאלית התחתונה של כל עמוד נמצא כפתור הנגישות, הכולל: הגדלה והקטנה של טקסט, ניגודיות גבוהה, היפוך צבעים, גווני אפור, הדגשת קישורים, גופן קריא, עצירת אנימציות, סמן גדול ואיפוס. ההגדרות נשמרות לביקורים הבאים.</p>
    <h2>הסדרי נגישות פיזיים</h2><p>החברה פועלת כחנות מקוונת. איסוף עצמי ושירות טלפוני זמינים בתיאום מראש, וניתן לקבל סיוע טלפוני מלא בביצוע הזמנה.</p>
    <h2>החרגות</h2><p>ייתכן שחלק מהתכנים שמקורם בצדדים שלישיים (כגון שירותי סליקה ומפות) אינם נגישים במלואם. אנו פועלים מול הספקים לשיפור הנגישות.</p>
    <h2>רכז/ת נגישות ופניות</h2><p>נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן.<br>טלפון ו-WhatsApp: ${PHONE_DISPLAY}<br>דוא"ל: ${EMAIL}<br>נשיב לפנייה תוך 5 ימי עסקים.</p>
    <p class="updated">תאריך עדכון ההצהרה: ${UPDATED}</p>`);
}
