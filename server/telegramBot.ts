import { Db } from './db';
import { ARCHETYPES } from '../src/data/archetypesData';

export interface TelegramBotMessageResponse {
  text: string;
  buttons?: Array<{
    text: string;
    url?: string;
    callback_data?: string;
    web_app?: { url: string };
  }>;
  parse_mode?: 'HTML' | 'Markdown';
}

export function handleBotCommand(
  command: string,
  fromUser: { id: number; first_name: string; username?: string; language_code?: string },
  appUrl: string
): TelegramBotMessageResponse {
  const user = Db.getOrCreateUser(fromUser);
  const cmd = command.trim().toLowerCase();
  const isAr = !user.language || user.language === 'ar';
  const webAppUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;

  if (cmd.startsWith('/start')) {
    if (isAr) {
      return {
        text: `✨ <b>مرحباً بك في PERSONA</b> — منصة الذكاء الشخصي المدعومة بالذكاء الاصطناعي.\n\nهنا لن تحصل على وصف عشوائي أو قوالب نمطية جاهزة. سنبني معاً صورة حقيقية متكاملة عن طريقة تفكيرك، مشاعرك، علاقاتك، دوافعك، وعاداتك الحياتية عبر 9 أبعاد نفسية وسلوكية دقيقة.\n\n👤 <b>الحساب:</b> ${user.firstName} (@${user.username || 'user'})\n🎖️ <b>المستوى:</b> Level ${user.level} (XP: ${user.xp})\n\nاضغط على الزر أدناه لفتح التطبيق والبدء الفوري:`,
        parse_mode: 'HTML',
        buttons: [
          { text: '🚀 ابدأ التحليل (Mini App)', web_app: { url: webAppUrl } },
          { text: '📖 كيف يعمل PERSONA؟', callback_data: 'explain_flow' },
          { text: '👤 ملفي الشخصي', callback_data: 'view_profile' }
        ]
      };
    } else {
      return {
        text: `✨ <b>Welcome to PERSONA</b> — The AI Personality Intelligence Platform.\n\nYou won't receive superficial archetypes here. We synthesize an empirical, multi-dimensional blueprint of your cognition, emotional regulation, relationships, and lifestyle habits across 9 comprehensive vectors.\n\n👤 <b>User:</b> ${user.firstName} (@${user.username || 'user'})\n🎖️ <b>Level:</b> ${user.level} (XP: ${user.xp})`,
        parse_mode: 'HTML',
        buttons: [
          { text: '🚀 Launch Mini App', web_app: { url: webAppUrl } },
          { text: '📖 How it works', callback_data: 'explain_flow' },
          { text: '👤 My Profile', callback_data: 'view_profile' }
        ]
      };
    }
  }

  if (cmd.startsWith('/profile') || cmd.startsWith('view_profile')) {
    const history = Db.getUserAnalysisHistory(user.id);
    const latest = history[0];
    const archetype = latest ? ARCHETYPES[latest.archetypeId] : null;

    if (isAr) {
      return {
        text: `👤 <b>ملف المستخدم — PERSONA ID:</b> #${user.telegramId}\n\n• <b>الاسم:</b> ${user.firstName} ${user.lastName || ''}\n• <b>الرتبة:</b> ${user.role.toUpperCase()}\n• <b>النمط المكتشف:</b> ${archetype ? archetype.nameAr : 'لم يُجرَ التحليل بعد'}\n• <b>المؤشر العام:</b> ${latest ? `${latest.overallScore}%` : '—'}\n• <b>كود الإحالة:</b> <code>${user.referralCode}</code> (تمت دعوة ${user.referralCount} أصدقاء)\n• <b>النقاط والأوسمة:</b> ${user.xp} XP | ${user.badges.length} أوسمة`,
        parse_mode: 'HTML',
        buttons: [
          { text: '🚀 فتح لوحة التحكم (Mini App)', web_app: { url: webAppUrl } },
          { text: '📊 تقرير النمو الزمني', callback_data: 'growth_history' }
        ]
      };
    }
  }

  if (cmd.startsWith('/analyze')) {
    return {
      text: isAr
        ? '🧠 <b>محرك التحليل النفسي والسلوكي</b>\n\nيحتوي التحليل على محاور تغطي التفكير، المشاعر، التواصل الاجتماعي، العلاقات، والنمط اليومي.\n\nاضغط أدناه لفتح واجهة الأسئلة التفاعلية:'
        : '🧠 <b>Assessment Engine</b>\n\nTake the 9-dimensional assessment in the interactive Mini App:',
      parse_mode: 'HTML',
      buttons: [
        { text: '🚀 بدء جلسة التحليل الآن', web_app: { url: `${webAppUrl}?view=analysis` } }
      ]
    };
  }

  if (cmd.startsWith('/results')) {
    const history = Db.getUserAnalysisHistory(user.id);
    if (!history.length) {
      return {
        text: isAr
          ? '⚠️ لم تكمل أي جلسة تحليل بعد. اضغط أدناه لبدء اختبارك الأول:'
          : '⚠️ No completed assessment found yet. Start your first session below:',
        buttons: [{ text: '🚀 ابدأ أول تحليل', web_app: { url: `${webAppUrl}?view=analysis` } }]
      };
    }
    const latest = history[0];
    const arch = ARCHETYPES[latest.archetypeId];
    return {
      text: isAr
        ? `📊 <b>آخر نتائجك المعتمدة:</b>\n\n• <b>النمط:</b> ${arch?.nameAr}\n• <b>المؤشر العام:</b> ${latest.overallScore}%\n• <b>الذكاء العاطفي:</b> ${latest.domainScores.emotional}%\n• <b>التفكير والمنطق:</b> ${latest.domainScores.cognitive}%\n• <b>العلاقات:</b> ${latest.domainScores.relationships}%\n• <b>تاريخ التحليل:</b> ${new Date(latest.createdAt).toLocaleDateString('ar-EG')}`
        : `📊 <b>Latest Certified Results:</b>\n\n• Archetype: ${arch?.nameEn}\n• Index: ${latest.overallScore}%\n• Date: ${new Date(latest.createdAt).toLocaleDateString()}`,
      parse_mode: 'HTML',
      buttons: [
        { text: '📄 عرض التقرير الكامل في Mini App', web_app: { url: `${webAppUrl}?view=reports` } }
      ]
    };
  }

  if (cmd.startsWith('/help') || cmd.startsWith('explain_flow')) {
    return {
      text: isAr
        ? `📖 <b>دليل استخدام منصة PERSONA</b>\n\n1️⃣ <b>ابدأ التحليل:</b> أجب عن أسئلة المحاور التسعة في التطبيق.\n2️⃣ <b>خوارزمية الذكاء:</b> نقوم بحساب أبعادك وتحديد نمطك السلوكي بدقة.\n3️⃣ <b>تقرير الذكاء الاصطناعي:</b> يولد Gemini تقريراً عميقاً بنقاط القوة والفرص وتوصيات مخصصة.\n4️⃣ <b>تتبع النمو:</b> كرر الاختبار دورياً لمقارنة نضجك الشخصي عبر السنين (2026 vs 2027).\n\n<b>الأوامر المتاحة:</b>\n/start - بدء المحادثة\n/profile - ملفك الشخصي\n/analyze - فتح جلسة التحليل\n/results - استعراض النتائج\n/settings - الإعدادات\n/admin - لوحة الإدارة (للمشرفين)`
        : `📖 <b>PERSONA User Guide</b>\n\n1. Launch Mini App to answer questions.\n2. Deep multi-vector scoring assigns your verified Archetype.\n3. AI generates strategic strengths, blind spots, and growth pathways.\n4. Track long-term personal evolution over time.\n\nCommands: /start, /profile, /analyze, /results, /settings, /admin`,
      parse_mode: 'HTML',
      buttons: [
        { text: '🚀 فتح Mini App الآن', web_app: { url: webAppUrl } }
      ]
    };
  }

  if (cmd.startsWith('/admin')) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return {
        text: isAr
          ? '🔒 <b>منطقة محظورة:</b> حسابك الحالي لا يمتلك صلاحيات المشرفين. يمكنك طلب الصلاحية من لوحة التحكم.'
          : '🔒 <b>Access Restricted:</b> Admin privileges required.',
        parse_mode: 'HTML',
        buttons: [{ text: '🚀 فتح التطبيق', web_app: { url: webAppUrl } }]
      };
    }

    const stats = Db.getAdminStats();
    return {
      text: isAr
        ? `🛡️ <b>لوحة تحكم المشرف — PERSONA Core</b>\n\n• إجمالي المستخدمين: <b>${stats.totalUsers}</b>\n• النشطون (24h): <b>${stats.activeUsers24h}</b>\n• التحليلات المكتملة: <b>${stats.completedAnalyses}</b>\n• المشتركون Premium: <b>${stats.premiumUsers}</b>\n• طلبات AI: <b>${stats.aiRequestsCount}</b>\n• الإيرادات التقديرية: <b>$${stats.revenueEst}</b>`
        : `🛡️ <b>Admin Control Center</b>\n\nTotal Users: ${stats.totalUsers}\nAnalyses: ${stats.completedAnalyses}\nPremium: ${stats.premiumUsers}`,
      parse_mode: 'HTML',
      buttons: [
        { text: '🛡️ فتح Admin Portal بالـ Mini App', web_app: { url: `${webAppUrl}?view=admin` } }
      ]
    };
  }

  // Default response
  return {
    text: isAr
      ? `مرحباً ${user.firstName}! استخدم الأزرار أدناه للوصول إلى مميزات PERSONA:`
      : `Hello ${user.firstName}! Use the buttons below to interact with PERSONA:`,
    buttons: [
      { text: '🚀 فتح تطبيق PERSONA Mini App', web_app: { url: webAppUrl } },
      { text: '📖 دليل الاستخدام', callback_data: 'explain_flow' }
    ]
  };
}
